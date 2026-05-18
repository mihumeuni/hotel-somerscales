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
import model.SentimentLabelModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import repository.CategoryRepository;
import repository.ReviewCategoryRepository;
import repository.ReviewRepository;
import repository.SentimentLabelRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Backfills sentiment labels + summary + categories + key phrases on reviews
 * where {@code classification_raw IS NULL}. Idempotent: rows already
 * classified are skipped because the page query filters them out.
 * task031: sentiment is now multi-label — a review can land in multiple
 * buckets, validated against the {@code sentiment_labels.code} catalog.
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
    private final SentimentLabelRepository sentimentLabelRepository;
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
            SentimentLabelRepository sentimentLabelRepository,
            EntityManager entityManager,
            @Value("${integrations.gemini.batch-size:10}") int batchSize,
            @Value("${integrations.gemini.throttle-ms:4000}") long throttleMs,
            @Value("${integrations.gemini.daily-cap:1500}") int dailyCap) {
        this.geminiClient = geminiClient;
        this.reviewRepository = reviewRepository;
        this.reviewCategoryRepository = reviewCategoryRepository;
        this.categoryRepository = categoryRepository;
        this.sentimentLabelRepository = sentimentLabelRepository;
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
        // Always page 0 — the WHERE classification_raw IS NULL filter shrinks
        // as rows get classified, so we naturally drain the backlog. The cap
        // protects the free-tier quota; remainder is picked up tomorrow.
        outer:
        while (processed < dailyCap) {
            Page<ReviewModel> page = reviewRepository.findByClassificationRawIsNull(
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
        List<String> sentimentCodes = currentSentimentCodes();
        GeminiClient.Result result = geminiClient.classify(
                review.getRawText(), currentCategoryCodes(), sentimentCodes);
        GeminiClassification c = result.classification();

        Set<String> labels = resolveLabels(c, sentimentCodes);
        if (labels.isEmpty()) {
            throw new IllegalStateException(
                    "Gemini returned no recognised sentiment labels");
        }
        review.setLabels(labels);
        review.setSummary(truncate(c.summary(), 500));
        review.setKeyPhrases(serializeKeyPhrases(c.keyPhrases()));
        review.setClassificationRaw(result.rawJson());
        reviewRepository.save(review);

        if (c.categories() != null) {
            for (GeminiClassification.CategoryHit hit : c.categories()) {
                persistCategory(review, hit);
            }
        }
    }

    // task031: prefer the new labels array; fall back to the legacy sentiment
    // field so any old fixture or cached response still classifies. Unknown
    // codes are dropped silently — they can't reach the DB anyway because of
    // the FK to sentiment_labels.code.
    private Set<String> resolveLabels(GeminiClassification c, List<String> validCodes) {
        Set<String> valid = new LinkedHashSet<>(validCodes);
        Set<String> out = new LinkedHashSet<>();
        if (c.labels() != null) {
            for (String raw : c.labels()) {
                if (raw == null) continue;
                String code = raw.trim().toLowerCase();
                if (valid.contains(code)) out.add(code);
            }
        }
        if (out.isEmpty() && c.sentiment() != null) {
            String legacy = c.sentiment().trim().toLowerCase();
            if (valid.contains(legacy)) out.add(legacy);
        }
        return out;
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

    /**
     * task028 + task031: drops all review_categories + review_sentiment_labels
     * rows and nulls every review's classifier output, then runs
     * {@link #classifyOnce()} to re-tag every review against the current
     * operator-managed categories and sentiment taxonomy. Intended for the
     * "Guardar y reclasificar" button in /settings/global. Same daily-cap +
     * throttle guardrails as the scheduled run.
     */
    @Transactional
    public synchronized ClassifyResult reclassifyAll() {
        reviewCategoryRepository.deleteAllRows();
        reviewRepository.deleteAllSentimentLabels();
        reviewRepository.resetClassification();
        entityManager.flush();
        entityManager.clear();
        return classifyOnce();
    }

    private List<String> currentCategoryCodes() {
        return categoryRepository.findAll().stream()
                .map(CategoryModel::getCode)
                .toList();
    }

    private List<String> currentSentimentCodes() {
        return sentimentLabelRepository.findAllByOrderByOrdinalAsc().stream()
                .map(SentimentLabelModel::getCode)
                .toList();
    }

    private void throttle() {
        if (throttleMs <= 0) return;
        try {
            Thread.sleep(throttleMs);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
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
