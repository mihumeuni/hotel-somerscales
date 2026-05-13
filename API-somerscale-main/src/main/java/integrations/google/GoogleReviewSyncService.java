package integrations.google;

import integrations.google.dto.PlaceReview;
import integrations.google.dto.PlacesResponse;
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
 * Daily review sync from Google Places API (New) into the {@code reviews}
 * table. Idempotent via {@link ReviewService#upsertReview} keyed by
 * (source=GOOGLE, externalId=review resource name).
 * <p>
 * Three entry points:
 * <ul>
 *   <li>{@link #scheduledSync()} — fired by {@code @Scheduled}; respects
 *       the per-language quota guard so a misfiring cron cannot burn the
 *       free tier.</li>
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
public class GoogleReviewSyncService {

    private final GooglePlacesClient placesClient;
    private final ReviewService reviewService;
    private final ReviewRepository reviewRepository;
    private final List<String> languages;

    private final Map<String, LocalDate> lastSyncDayByLanguage = new HashMap<>();
    private final AtomicReference<SyncResult> lastResult = new AtomicReference<>();

    public GoogleReviewSyncService(
            GooglePlacesClient placesClient,
            ReviewService reviewService,
            ReviewRepository reviewRepository,
            @Value("${integrations.google.places.languages:es,en}") String languagesCsv) {
        this.placesClient = placesClient;
        this.reviewService = reviewService;
        this.reviewRepository = reviewRepository;
        this.languages = List.of(languagesCsv.split("\\s*,\\s*"));
    }

    @Scheduled(cron = "${integrations.google.places.cron:0 0 4 * * *}")
    public void scheduledSync() {
        try {
            runSync(false);
        } catch (Exception e) {
            // Defensive: never let a scheduler thread die.
            log.error("[GoogleReviewSync] scheduled run crashed: {}", e.getMessage(), e);
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
        return placesClient.isLiveMode();
    }

    private synchronized SyncResult runSync(boolean force) {
        int fetched = 0, inserted = 0, updated = 0, errors = 0, skipped = 0;
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        boolean live = placesClient.isLiveMode();
        String modeLabel = live ? "live" : "fixture";

        for (String lang : languages) {
            if (!force && today.equals(lastSyncDayByLanguage.get(lang))) {
                skipped++;
                log.info("[GoogleReviewSync] lang={} skipped (quota: already ran today)", lang);
                continue;
            }

            PlacesResponse response;
            try {
                response = placesClient.fetchReviews(lang);
            } catch (Exception e) {
                errors++;
                log.error("[GoogleReviewSync] fetch failed lang={}: {}", lang, e.getMessage());
                continue;
            }

            List<PlaceReview> reviews = response.reviews();
            fetched += reviews.size();

            for (PlaceReview review : reviews) {
                try {
                    boolean isNew = upsertOne(review, lang);
                    if (isNew) inserted++; else updated++;
                } catch (Exception e) {
                    errors++;
                    log.warn("[GoogleReviewSync] upsert failed lang={} id={}: {}",
                            lang, review.name(), e.getMessage());
                }
            }
            lastSyncDayByLanguage.put(lang, today);
        }

        SyncResult result = new SyncResult(
                LocalDateTime.now(), modeLabel, fetched, inserted, updated, errors, skipped);
        lastResult.set(result);
        log.info("[GoogleReviewSync] mode={} fetched={} inserted={} updated={} errors={} skipped={}",
                modeLabel, fetched, inserted, updated, errors, skipped);
        return result;
    }

    private boolean upsertOne(PlaceReview review, String fallbackLang) {
        String externalId = review.name();
        if (externalId == null || externalId.isBlank()) {
            throw new IllegalArgumentException("review.name is null/blank");
        }
        boolean isNew = reviewRepository
                .findBySourceAndExternalId(ReviewSource.GOOGLE, externalId)
                .isEmpty();

        String author = Optional.ofNullable(review.authorAttribution())
                .map(PlaceReview.AuthorAttribution::displayName)
                .orElse(null);
        BigDecimal rating = review.rating() == null ? null : BigDecimal.valueOf(review.rating());
        String rawText = Optional.ofNullable(review.text())
                .map(PlaceReview.LocalizedText::text)
                .orElse(Optional.ofNullable(review.originalText())
                        .map(PlaceReview.LocalizedText::text)
                        .orElse(""));
        String language = Optional.ofNullable(review.text())
                .map(PlaceReview.LocalizedText::languageCode)
                .orElse(fallbackLang);
        LocalDateTime postedAt = parsePublishTime(review.publishTime());

        reviewService.upsertReview(ReviewSource.GOOGLE, externalId, author, rating,
                language, rawText, postedAt);
        return isNew;
    }

    private LocalDateTime parsePublishTime(String iso) {
        if (iso == null || iso.isBlank()) return null;
        try {
            return OffsetDateTime.parse(iso).toLocalDateTime();
        } catch (DateTimeParseException e) {
            log.debug("[GoogleReviewSync] unparseable publishTime '{}': {}", iso, e.getMessage());
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
