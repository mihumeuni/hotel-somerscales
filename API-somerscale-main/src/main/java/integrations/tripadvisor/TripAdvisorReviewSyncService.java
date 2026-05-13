package integrations.tripadvisor;

import integrations.tripadvisor.dto.TripAdvisorResponse;
import integrations.tripadvisor.dto.TripAdvisorReview;
import lombok.extern.slf4j.Slf4j;
import model.ReviewSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import repository.ReviewRepository;
import service.ReviewService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Daily review sync from the TripAdvisor Content API into the
 * {@code reviews} table. Idempotent via
 * {@link ReviewService#upsertReview} keyed by
 * (source=TRIPADVISOR, externalId=numeric review id stringified).
 * <p>
 * Mirrors {@code GoogleReviewSyncService} — three entry points:
 * <ul>
 *   <li>{@link #scheduledSync()} — fired by {@code @Scheduled};
 *       respects the per-language quota guard so a misfiring cron
 *       cannot exhaust the free-tier budget.</li>
 *   <li>{@link #syncOnce()} — called from the admin trigger endpoint;
 *       force-runs regardless of quota for demo purposes.</li>
 *   <li>{@link #lastResult()} — read-only snapshot for the status
 *       endpoint and tests.</li>
 * </ul>
 * Errors from individual review upserts are logged + counted; the loop
 * keeps going so one malformed payload does not poison the rest.
 */
@Slf4j
@Service
public class TripAdvisorReviewSyncService {

    private final TripAdvisorClient client;
    private final ReviewService reviewService;
    private final ReviewRepository reviewRepository;
    private final List<String> languages;

    private final Map<String, LocalDate> lastSyncDayByLanguage = new HashMap<>();
    private final AtomicReference<SyncResult> lastResult = new AtomicReference<>();

    public TripAdvisorReviewSyncService(
            TripAdvisorClient client,
            ReviewService reviewService,
            ReviewRepository reviewRepository,
            @Value("${integrations.tripadvisor.languages:es,en}") String languagesCsv) {
        this.client = client;
        this.reviewService = reviewService;
        this.reviewRepository = reviewRepository;
        this.languages = List.of(languagesCsv.split("\\s*,\\s*"));
    }

    @Scheduled(cron = "${integrations.tripadvisor.cron:0 30 4 * * *}")
    public void scheduledSync() {
        try {
            runSync(false);
        } catch (Exception e) {
            // Defensive: never let a scheduler thread die.
            log.error("[TripAdvisorReviewSync] scheduled run crashed: {}", e.getMessage(), e);
        }
    }

    /** Manual trigger; ignores the per-language daily quota. */
    public SyncResult syncOnce() {
        return runSync(true);
    }

    public Optional<SyncResult> lastResult() {
        return Optional.ofNullable(lastResult.get());
    }

    public boolean isLiveMode() {
        return client.isLiveMode();
    }

    private synchronized SyncResult runSync(boolean force) {
        int fetched = 0, inserted = 0, updated = 0, errors = 0, skipped = 0;
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        boolean live = client.isLiveMode();
        String modeLabel = live ? "live" : "fixture";

        for (String lang : languages) {
            if (!force && today.equals(lastSyncDayByLanguage.get(lang))) {
                skipped++;
                log.info("[TripAdvisorReviewSync] lang={} skipped (quota: already ran today)", lang);
                continue;
            }

            TripAdvisorResponse response;
            try {
                response = client.fetchReviews(lang);
            } catch (Exception e) {
                errors++;
                log.error("[TripAdvisorReviewSync] fetch failed lang={}: {}", lang, e.getMessage());
                continue;
            }

            List<TripAdvisorReview> reviews = response.data();
            fetched += reviews.size();

            for (TripAdvisorReview review : reviews) {
                try {
                    boolean isNew = upsertOne(review, lang);
                    if (isNew) inserted++; else updated++;
                } catch (Exception e) {
                    errors++;
                    log.warn("[TripAdvisorReviewSync] upsert failed lang={} id={}: {}",
                            lang, review.id(), e.getMessage());
                }
            }
            lastSyncDayByLanguage.put(lang, today);
        }

        SyncResult result = new SyncResult(
                LocalDateTime.now(), modeLabel, fetched, inserted, updated, errors, skipped);
        lastResult.set(result);
        log.info("[TripAdvisorReviewSync] mode={} fetched={} inserted={} updated={} errors={} skipped={}",
                modeLabel, fetched, inserted, updated, errors, skipped);
        return result;
    }

    private boolean upsertOne(TripAdvisorReview review, String fallbackLang) {
        if (review.id() == null) {
            throw new IllegalArgumentException("review.id is null");
        }
        String externalId = String.valueOf(review.id());
        boolean isNew = reviewRepository
                .findBySourceAndExternalId(ReviewSource.TRIPADVISOR, externalId)
                .isEmpty();

        String author = Optional.ofNullable(review.user())
                .map(TripAdvisorReview.User::username)
                .orElse(null);
        BigDecimal rating = review.rating() == null ? null : BigDecimal.valueOf(review.rating());
        String language = Optional.ofNullable(review.lang())
                .filter(s -> !s.isBlank())
                .orElse(fallbackLang);
        String rawText = combineTitleAndBody(review.title(), review.text());
        LocalDateTime postedAt = parsePublishedDate(review.publishedDate());

        reviewService.upsertReview(ReviewSource.TRIPADVISOR, externalId, author, rating,
                language, rawText, postedAt);
        return isNew;
    }

    private String combineTitleAndBody(String title, String body) {
        String t = title == null ? "" : title.trim();
        String b = body == null ? "" : body.trim();
        if (t.isEmpty()) return b;
        if (b.isEmpty()) return t;
        return t + "\n\n" + b;
    }

    private LocalDateTime parsePublishedDate(String iso) {
        if (iso == null || iso.isBlank()) return null;
        try {
            return OffsetDateTime.parse(iso).toLocalDateTime();
        } catch (DateTimeParseException e) {
            log.debug("[TripAdvisorReviewSync] unparseable published_date '{}': {}",
                    iso, e.getMessage());
            return null;
        }
    }

    public record SyncResult(
            LocalDateTime ranAt,
            String mode,
            int fetched,
            int inserted,
            int updated,
            int errors,
            int skipped
    ) {}
}
