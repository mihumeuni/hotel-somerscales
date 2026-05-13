package repository;

import model.ReviewModel;
import model.ReviewSource;
import model.Sentiment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<ReviewModel, Long> {

    Optional<ReviewModel> findBySourceAndExternalId(ReviewSource source, String externalId);

    List<ReviewModel> findBySentiment(Sentiment sentiment);

    List<ReviewModel> findByPostedAtBetween(LocalDateTime start, LocalDateTime end);

    // Sentiment-bucket counts for dashboard tiles. NULL bucket included so the
    // unclassified-review backlog (sentiment IS NULL) reconciles with the total.
    @Query("SELECT r.sentiment, COUNT(r) FROM ReviewModel r GROUP BY r.sentiment")
    List<Object[]> countBySentiment();
}
