package service;

import lombok.RequiredArgsConstructor;
import model.ReviewModel;
import model.ReviewSource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import repository.ReviewRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;

    /**
     * Idempotent insert/refresh keyed by (source, externalId).
     * sentiment/summary/keyPhrases are deliberately preserved — those are
     * written by the LLM classifier (task 013), not by the fetch path.
     */
    @Transactional
    public ReviewModel upsertReview(
            ReviewSource source,
            String externalId,
            String author,
            BigDecimal rating,
            String language,
            String rawText,
            LocalDateTime postedAt) {

        ReviewModel entity = reviewRepository
                .findBySourceAndExternalId(source, externalId)
                .orElseGet(() -> ReviewModel.builder()
                        .source(source)
                        .externalId(externalId)
                        .build());

        entity.setAuthor(author);
        entity.setRating(rating);
        entity.setLanguage(language);
        entity.setRawText(rawText);
        entity.setPostedAt(postedAt);
        entity.setFetchedAt(LocalDateTime.now());

        return reviewRepository.save(entity);
    }
}
