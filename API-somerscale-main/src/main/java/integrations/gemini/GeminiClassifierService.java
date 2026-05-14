package integrations.gemini;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import integrations.gemini.dto.GeminiClassification;
import jakarta.persistence.EntityManager;
import lombok.extern.slf4j.Slf4j;
import model.CategoryModel;
import model.ReviewCategoryId;
import model.ReviewCategoryModel;
import model.ReviewModel;
import model.Sentiment;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import repository.CategoryRepository;
import repository.ReviewCategoryRepository;
import repository.ReviewRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Backfills sentiment + summary + categories + key phrases on reviews where
 * {@code sentiment IS NULL}. Idempotent: rows already classified are skipped
 * because the page query filters them out.
 * <p>
 * Two entry points (mirrors task011/012):
 * <ul>
 *   <li>{@link #scheduledClassify()} — daily {@code @Scheduled} cron.</li>
 *   <li>{@link #classifyOnce()} — admin {@code POST /api/sync/classify}.</li>
 * </ul>
 * Free-tier guardrails (Gemini 2.5 Flash, no card):
 * <ul>
 *   <li><b>throttle-ms</b> sleeps between calls so 15 RPM is not exceeded.</li>
 *   <li><b>daily-cap</b> bounds the run to 1500 RPD; once hit, the loop stops
 *       and the remaining backlog is picked up on the next run.</li>
 * </ul>
 */
@Slf4j
@Service
public class GeminiClassifierService {

    private final GeminiClient geminiClient;
    private final ReviewRepository reviewRepository;
    private final ReviewCategoryRepository reviewCategoryRepository;
    private final CategoryRepository categoryRepository;
    private final EntityManager entityManager;
    private final ObjectMapper objectMapper;
    private final int batchSize;
    private final long throttleMs;
    private final int dailyCap;

    private final AtomicReference<ClassifyResult> lastResult = new AtomicReference<>();

    public GeminiClassifierService(
            GeminiClient geminiClient,
            ReviewRepository reviewRepository,
            ReviewCategoryRepository reviewCategoryRepository,
            CategoryRepository categoryRepository,
            EntityManager entityManager,
            @Value("${integrations.gemini.batch-size:10}") int batchSize,
            @Value("${integrations.gemini.throttle-ms:4000}") long throttleMs,
            @Value("${integrations.gemini.daily-cap:1500}") int dailyCap) {
        this.geminiClient = geminiClient;
        this.reviewRepository = reviewRepository;
        this.reviewCategoryRepository = reviewCategoryRepository;
        this.categoryRepository = categoryRepository;
        this.entityManager = entityManager;
        this.objectMapper = new ObjectMapper();
        this.batchSize = batchSize;
        this.throttleMs = throttleMs;
        this.dailyCap = dailyCap;
    }

    @Scheduled(cron = "${integrations.gemini.classify-cron:0 0 5 * * *}")
    public void scheduledClassify() {
        try {
            classifyOnce();
        } catch (Exception e) {
            // Defensive: never let a scheduler thread die.
            log.error("[GeminiClassifier] scheduled run crashed: {}", e.getMessage(), e);
        }
    }

    public Optional<ClassifyResult> lastResult() {
        return Optional.ofNullable(lastResult.get());
    }

    public boolean isLiveMode() {
        return geminiClient.isLiveMode();
    }

    /**
     * Synchronous backfill. Bounded by {@code daily-cap} so a misconfigured
     * cron cannot burn the free-tier daily quota in a single run.
     */
    public synchronized ClassifyResult classifyOnce() {
        long started = System.currentTimeMillis();

        if (!geminiClient.isLiveMode()) {
            log.info("[GeminiClassifier] disabled — GEMINI_API_KEY blank, skipping");
            ClassifyResult res = new ClassifyResult(
                    LocalDateTime.now(), "disabled", 0, 0, 0, 0L);
            lastResult.set(res);
            return res;
        }

        int processed = 0, ok = 0, errors = 0;
        boolean dailyCapHit = false;
        // Always page 0 — the WHERE sentiment IS NULL filter shrinks as rows
        // get classified, so we naturally drain the backlog. The cap protects
        // the free-tier quota; once hit, the remainder is picked up tomorrow.
        outer:
        while (processed < dailyCap) {
            Page<ReviewModel> page = reviewRepository.findBySentimentIsNull(
                    PageRequest.of(0, batchSize));
            if (page.isEmpty()) break;

            for (ReviewModel review : page.getContent()) {
                if (processed >= dailyCap) {
                    dailyCapHit = true;
                    break outer;
                }
                processed++;
                try {
                    classifyAndPersist(review);
                    ok++;
                } catch (Exception e) {
                    errors++;
                    log.warn("[GeminiClassifier] review id={} failed: {}",
                            review.getId(), e.getMessage());
                }
                throttle();
            }
        }

        if (dailyCapHit) {
            log.warn("[GeminiClassifier] daily cap {} hit; backlog deferred to next run", dailyCap);
        }

        long elapsedSec = (System.currentTimeMillis() - started) / 1000L;
        ClassifyResult res = new ClassifyResult(
                LocalDateTime.now(), "live", processed, ok, errors, elapsedSec);
        lastResult.set(res);
        log.info("[GeminiClassifier] processed={} ok={} errors={} elapsedSec={}",
                processed, ok, errors, elapsedSec);
        return res;
    }

    // No @Transactional on this method: it's invoked from classifyOnce() in
    // the same bean, so Spring proxy AOP would not apply the annotation
    // anyway. Each Spring Data JPA save() runs in its own implicit tx, which
    // is exactly what we want — a per-review boundary means one bad row
    // never rolls back the rest of the batch.
    void classifyAndPersist(ReviewModel review) {
        GeminiClassification c = geminiClient.classify(review.getRawText());

        Sentiment sentiment = parseSentiment(c.sentiment());
        if (sentiment == null) {
            throw new IllegalStateException(
                    "Gemini returned unknown sentiment: " + c.sentiment());
        }
        review.setSentiment(sentiment);
        review.setSummary(truncate(c.summary(), 500));
        review.setKeyPhrases(serializeKeyPhrases(c.keyPhrases()));
        reviewRepository.save(review);

        if (c.categories() != null) {
            for (GeminiClassification.CategoryHit hit : c.categories()) {
                persistCategory(review, hit);
            }
        }
    }

    private void persistCategory(ReviewModel review, GeminiClassification.CategoryHit hit) {
        if (hit == null || hit.code() == null) return;
        Optional<CategoryModel> categoryOpt = categoryRepository.findByCode(hit.code());
        if (categoryOpt.isEmpty()) {
            log.debug("[GeminiClassifier] unknown category code={} skipped", hit.code());
            return;
        }
        CategoryModel category = categoryOpt.get();
        ReviewCategoryId id = new ReviewCategoryId(review.getId(), category.getId());
        if (reviewCategoryRepository.existsById(id)) {
            return; // idempotent — Gemini may emit the same code twice
        }
        ReviewCategoryModel rc = ReviewCategoryModel.builder()
                .id(id)
                // Use entityManager.getReference to avoid an extra SELECT round-trip;
                // we already have the IDs and JPA only needs the proxy for the FK.
                .review(entityManager.getReference(ReviewModel.class, review.getId()))
                .category(entityManager.getReference(CategoryModel.class, category.getId()))
                .confidence(clampConfidence(hit.confidence()))
                .build();
        reviewCategoryRepository.save(rc);
    }

    private void throttle() {
        if (throttleMs <= 0) return;
        try {
            Thread.sleep(throttleMs);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private static Sentiment parseSentiment(String value) {
        if (value == null) return null;
        try {
            return Sentiment.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private String serializeKeyPhrases(List<String> phrases) {
        if (phrases == null || phrases.isEmpty()) return null;
        try {
            return objectMapper.writeValueAsString(phrases);
        } catch (JsonProcessingException e) {
            log.warn("[GeminiClassifier] keyPhrases serialize failed: {}", e.getMessage());
            return null;
        }
    }

    private static String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }

    private static BigDecimal clampConfidence(BigDecimal raw) {
        if (raw == null) return null;
        BigDecimal clamped = raw.min(BigDecimal.ONE).max(BigDecimal.ZERO);
        // Column is NUMERIC(4,3) — 3 decimal places of precision.
        return clamped.setScale(3, RoundingMode.HALF_UP);
    }

    public record ClassifyResult(
            LocalDateTime ranAt,
            String mode,
            int processed,
            int ok,
            int errors,
            long elapsedSec
    ) {}
}
