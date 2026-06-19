package repository;

import model.ReviewModel;
import model.ReviewSource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<ReviewModel, Long> {

    Optional<ReviewModel> findBySourceAndExternalId(ReviewSource source, String externalId);

    List<ReviewModel> findByPostedAtBetween(LocalDateTime start, LocalDateTime end);

    // task031: classifier backlog. classification_raw IS NULL is the single
    // source of truth for "the classifier has not seen this row yet" — replaces the
    // sentiment IS NULL filter used before the multi-label migration.
    Page<ReviewModel> findByClassificationRawIsNull(Pageable pageable);

    long countByClassificationRawIsNull();

    // task028: null out classifier outputs so the next classifyOnce() picks
    // every review back up. Used when categories change and a full
    // reclassification is requested.
    @Modifying
    @Query("update ReviewModel r set r.summary = null, r.keyPhrases = null, r.classificationRaw = null")
    void resetClassification();

    // task031: remove every join-table row in one DELETE — paired with
    // resetClassification() so the next classifier run re-tags from scratch.
    @Modifying
    @Query(value = "DELETE FROM review_sentiment_labels", nativeQuery = true)
    void deleteAllSentimentLabels();

    // Sentiment-bucket counts for the dashboard pie, filtered by posting
    // window. A single review with mixed sentiment counts once per label, so
    // SUM(buckets) ≥ COUNT(reviews) — the FE shows a tooltip explaining it.
    @Query(value = """
            SELECT rsl.label_code AS code,
                   COUNT(*)       AS cnt
            FROM reviews r
            JOIN review_sentiment_labels rsl ON rsl.review_id = r.id
            WHERE r.posted_at BETWEEN :from AND :to
            GROUP BY rsl.label_code
            """, nativeQuery = true)
    List<Object[]> countByLabelBetween(@Param("from") LocalDateTime from,
                                       @Param("to") LocalDateTime to);

    // task031: total distinct reviews that received at least one label in
    // window. Needed so the dashboard widget can show "{labeled} reseñas
    // clasificadas" without summing buckets (which double-counts multi-label).
    @Query(value = """
            SELECT COUNT(DISTINCT r.id)
            FROM reviews r
            JOIN review_sentiment_labels rsl ON rsl.review_id = r.id
            WHERE r.posted_at BETWEEN :from AND :to
            """, nativeQuery = true)
    long countLabeledBetween(@Param("from") LocalDateTime from,
                             @Param("to") LocalDateTime to);

    // Per-category sentiment breakdown for the dashboard stacked bar.
    // task031: aggregates over review_sentiment_labels; a review with both
    // positive and complaint contributes one row to each bucket per category.
    @Query(value = """
            SELECT c.code        AS code,
                   rsl.label_code AS label_code,
                   COUNT(*)      AS cnt
            FROM reviews r
            JOIN review_categories rc        ON rc.review_id = r.id
            JOIN categories c                ON c.id = rc.category_id
            JOIN review_sentiment_labels rsl ON rsl.review_id = r.id
            WHERE r.posted_at BETWEEN :from AND :to
            GROUP BY c.code, rsl.label_code
            ORDER BY c.code
            """, nativeQuery = true)
    List<Object[]> sentimentByCategory(@Param("from") LocalDateTime from,
                                       @Param("to") LocalDateTime to);

    // Category chips on the dashboard: review-count per category in window.
    @Query(value = """
            SELECT c.code     AS code,
                   c.label_es AS label_es,
                   c.label_en AS label_en,
                   COALESCE(COUNT(rc.review_id), 0) AS cnt
            FROM categories c
            LEFT JOIN review_categories rc ON rc.category_id = c.id
            LEFT JOIN reviews r            ON r.id = rc.review_id
                                          AND r.posted_at BETWEEN :from AND :to
            GROUP BY c.code, c.label_es, c.label_en
            ORDER BY cnt DESC, c.code ASC
            """, nativeQuery = true)
    List<Object[]> categoryCounts(@Param("from") LocalDateTime from,
                                  @Param("to") LocalDateTime to);

    // Clusters LLM-summarized reviews by summary text so each cluster row
    // carries the count of underlying source reviews. task031: a string-agg
    // of the distinct labels per cluster lets the FE render mixed-sentiment
    // chips without a follow-up query.
    @Query(value = """
            SELECT r.summary                                  AS summary,
                   STRING_AGG(DISTINCT rsl.label_code, ',')   AS labels,
                   COUNT(*)                                   AS cnt
            FROM reviews r
            LEFT JOIN review_sentiment_labels rsl ON rsl.review_id = r.id
            WHERE r.summary IS NOT NULL
              AND length(trim(r.summary)) > 0
              AND r.posted_at BETWEEN :from AND :to
            GROUP BY r.summary
            ORDER BY cnt DESC, r.summary ASC
            LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> normalizedSummaries(@Param("from") LocalDateTime from,
                                       @Param("to") LocalDateTime to,
                                       @Param("limit") int limit);

    // task031: filtered review list backing GET /api/reviews?label=. ORDER
    // BY posted_at DESC matches the dashboard's normalized comments feed.
    @Query(value = """
            SELECT r.*
            FROM reviews r
            JOIN review_sentiment_labels rsl ON rsl.review_id = r.id
            WHERE rsl.label_code = :code
            ORDER BY r.posted_at DESC NULLS LAST, r.id DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<ReviewModel> findByLabel(@Param("code") String code,
                                  @Param("limit") int limit);
}
