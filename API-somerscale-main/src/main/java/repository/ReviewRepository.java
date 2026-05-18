package repository;

import model.ReviewModel;
import model.ReviewSource;
import model.Sentiment;
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

    List<ReviewModel> findBySentiment(Sentiment sentiment);

    List<ReviewModel> findByPostedAtBetween(LocalDateTime start, LocalDateTime end);

    // task013: paged backlog of unclassified reviews for the Gemini classifier.
    // Spring Data derives the WHERE r.sentiment IS NULL filter from the name.
    Page<ReviewModel> findBySentimentIsNull(Pageable pageable);

    long countBySentimentIsNull();

    // task028: null out classifier outputs so the next classifyOnce() picks
    // every review back up. Used when categories change and a full
    // reclassification is requested.
    @Modifying
    @Query("update ReviewModel r set r.sentiment = null, r.summary = null, r.keyPhrases = null")
    void resetClassification();

    // Sentiment-bucket counts for dashboard tiles. NULL bucket included so the
    // unclassified-review backlog (sentiment IS NULL) reconciles with the total.
    @Query("SELECT r.sentiment, COUNT(r) FROM ReviewModel r GROUP BY r.sentiment")
    List<Object[]> countBySentiment();

    // Sentiment counts for the dashboard pie, filtered by posting window.
    // NULL sentiment excluded so the pie sums to the classified-only total.
    @Query("""
            SELECT r.sentiment, COUNT(r)
            FROM ReviewModel r
            WHERE r.postedAt BETWEEN :from AND :to
              AND r.sentiment IS NOT NULL
            GROUP BY r.sentiment
            """)
    List<Object[]> countBySentimentBetween(@Param("from") LocalDateTime from,
                                           @Param("to") LocalDateTime to);

    // Per-category sentiment breakdown for the dashboard stacked bar.
    // Native because the join hops reviews → review_categories → categories and
    // a pivot-style projection (positive/neutral/negative columns) is easier
    // expressed in SQL than JPQL.
    @Query(value = """
            SELECT c.code AS code,
                   SUM(CASE WHEN r.sentiment = 'POSITIVE' THEN 1 ELSE 0 END) AS positive,
                   SUM(CASE WHEN r.sentiment = 'NEUTRAL'  THEN 1 ELSE 0 END) AS neutral,
                   SUM(CASE WHEN r.sentiment = 'NEGATIVE' THEN 1 ELSE 0 END) AS negative
            FROM reviews r
            JOIN review_categories rc ON rc.review_id = r.id
            JOIN categories c         ON c.id = rc.category_id
            WHERE r.posted_at BETWEEN :from AND :to
              AND r.sentiment IS NOT NULL
            GROUP BY c.code
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

    // Clusters Gemini-summarized reviews by summary text + sentiment so each
    // cluster row carries the count of underlying source reviews.
    @Query(value = """
            SELECT r.summary    AS summary,
                   r.sentiment  AS sentiment,
                   COUNT(*)     AS cnt
            FROM reviews r
            WHERE r.summary IS NOT NULL
              AND length(trim(r.summary)) > 0
              AND r.posted_at BETWEEN :from AND :to
            GROUP BY r.summary, r.sentiment
            ORDER BY cnt DESC, r.summary ASC
            LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> normalizedSummaries(@Param("from") LocalDateTime from,
                                       @Param("to") LocalDateTime to,
                                       @Param("limit") int limit);
}
