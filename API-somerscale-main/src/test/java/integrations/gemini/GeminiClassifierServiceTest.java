package integrations.gemini;

import integrations.gemini.GeminiClassifierService.ClassifyResult;
import integrations.gemini.dto.GeminiClassification;
import integrations.gemini.dto.GeminiClassification.CategoryHit;
import jakarta.persistence.EntityManager;
import model.CategoryModel;
import model.ReviewCategoryModel;
import model.ReviewModel;
import model.ReviewSource;
import model.Sentiment;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import repository.CategoryRepository;
import repository.ReviewCategoryRepository;
import repository.ReviewRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class GeminiClassifierServiceTest {

    private static ReviewModel review(Long id, String rawText) {
        return ReviewModel.builder()
                .id(id)
                .source(ReviewSource.GOOGLE)
                .externalId("places/X/reviews/" + id)
                .rawText(rawText)
                .build();
    }

    private static GeminiClassification classification(String sentiment, String code) {
        return new GeminiClassification(
                sentiment,
                "Resumen breve en español.",
                List.of(new CategoryHit(code, new BigDecimal("0.9"))),
                List.of("limpio", "amable", "comoda")
        );
    }

    private GeminiClassifierService build(
            GeminiClient client, ReviewRepository repo,
            ReviewCategoryRepository rcRepo, CategoryRepository catRepo,
            EntityManager em, int batch, long throttle, int dailyCap) {
        return new GeminiClassifierService(client, repo, rcRepo, catRepo, em,
                batch, throttle, dailyCap);
    }

    @Test
    void classifyOnce_returnsDisabledWhenApiKeyMissing() {
        GeminiClient client = mock(GeminiClient.class);
        when(client.isLiveMode()).thenReturn(false);

        ReviewRepository repo = mock(ReviewRepository.class);
        ReviewCategoryRepository rcRepo = mock(ReviewCategoryRepository.class);
        CategoryRepository catRepo = mock(CategoryRepository.class);
        EntityManager em = mock(EntityManager.class);

        ClassifyResult result = build(client, repo, rcRepo, catRepo, em, 10, 0L, 1500).classifyOnce();

        assertEquals("disabled", result.mode());
        assertEquals(0, result.processed());
        verify(repo, never()).findBySentimentIsNull(any(Pageable.class));
        verify(client, never()).classify(anyString(), anyList());
    }

    @Test
    void classifyOnce_writesSentimentSummaryKeyPhrasesAndCategory() {
        GeminiClient client = mock(GeminiClient.class);
        when(client.isLiveMode()).thenReturn(true);
        when(client.classify(anyString(), anyList()))
                .thenReturn(classification("POSITIVE", "cleanliness"));

        ReviewModel r1 = review(1L, "Hotel impecable, todo limpio.");
        ReviewRepository repo = mock(ReviewRepository.class);
        when(repo.findBySentimentIsNull(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(r1)))
                .thenReturn(new PageImpl<>(List.of()));

        CategoryModel cat = CategoryModel.builder().id(7L).code("cleanliness").build();
        CategoryRepository catRepo = mock(CategoryRepository.class);
        when(catRepo.findByCode("cleanliness")).thenReturn(Optional.of(cat));

        ReviewCategoryRepository rcRepo = mock(ReviewCategoryRepository.class);
        when(rcRepo.existsById(any())).thenReturn(false);

        EntityManager em = mock(EntityManager.class);
        when(em.getReference(eq(ReviewModel.class), eq(1L))).thenReturn(r1);
        when(em.getReference(eq(CategoryModel.class), eq(7L))).thenReturn(cat);

        ClassifyResult result = build(client, repo, rcRepo, catRepo, em, 10, 0L, 1500).classifyOnce();

        assertEquals(1, result.processed());
        assertEquals(1, result.ok());
        assertEquals(0, result.errors());
        assertEquals("live", result.mode());
        assertNotNull(result.ranAt());

        // Review entity received sentiment + summary + serialized phrases.
        ArgumentCaptor<ReviewModel> savedReview = ArgumentCaptor.forClass(ReviewModel.class);
        verify(repo).save(savedReview.capture());
        ReviewModel saved = savedReview.getValue();
        assertEquals(Sentiment.POSITIVE, saved.getSentiment());
        assertEquals("Resumen breve en español.", saved.getSummary());
        assertTrue(saved.getKeyPhrases().startsWith("[\"limpio\""),
                "keyPhrases must be Jackson-serialized JSON array, got " + saved.getKeyPhrases());

        // review_categories row inserted with clamped confidence.
        ArgumentCaptor<ReviewCategoryModel> savedRc = ArgumentCaptor.forClass(ReviewCategoryModel.class);
        verify(rcRepo).save(savedRc.capture());
        ReviewCategoryModel rc = savedRc.getValue();
        assertEquals(1L, rc.getId().getReviewId());
        assertEquals(7L, rc.getId().getCategoryId());
        assertEquals(0, rc.getConfidence().compareTo(new BigDecimal("0.900")));
    }

    @Test
    void classifyOnce_skipsUnknownCategoryCodes() {
        GeminiClient client = mock(GeminiClient.class);
        when(client.isLiveMode()).thenReturn(true);
        when(client.classify(anyString(), anyList()))
                .thenReturn(classification("NEUTRAL", "definitely-not-a-real-code"));

        ReviewRepository repo = mock(ReviewRepository.class);
        when(repo.findBySentimentIsNull(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(review(9L, "neutral text"))))
                .thenReturn(new PageImpl<>(List.of()));

        CategoryRepository catRepo = mock(CategoryRepository.class);
        when(catRepo.findByCode("definitely-not-a-real-code")).thenReturn(Optional.empty());

        ReviewCategoryRepository rcRepo = mock(ReviewCategoryRepository.class);
        EntityManager em = mock(EntityManager.class);

        ClassifyResult result = build(client, repo, rcRepo, catRepo, em, 10, 0L, 1500).classifyOnce();

        assertEquals(1, result.ok(), "review row updates even when category is unknown");
        verify(repo).save(any(ReviewModel.class));
        verify(rcRepo, never()).save(any(ReviewCategoryModel.class));
    }

    @Test
    void classifyOnce_countsErrorsWhenGeminiThrows() {
        GeminiClient client = mock(GeminiClient.class);
        when(client.isLiveMode()).thenReturn(true);
        when(client.classify(anyString(), anyList()))
                .thenThrow(new IllegalStateException("transport error"));

        ReviewRepository repo = mock(ReviewRepository.class);
        when(repo.findBySentimentIsNull(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(review(1L, "x"), review(2L, "y"))))
                .thenReturn(new PageImpl<>(List.of()));

        ClassifyResult result = build(
                client,
                repo,
                mock(ReviewCategoryRepository.class),
                mock(CategoryRepository.class),
                mock(EntityManager.class),
                10, 0L, 1500).classifyOnce();

        assertEquals(2, result.processed());
        assertEquals(0, result.ok());
        assertEquals(2, result.errors());
        // Review must NOT be saved if classification fails — sentiment stays null
        // so the next run retries it.
        verify(repo, never()).save(any(ReviewModel.class));
    }

    @Test
    void classifyOnce_stopsAtDailyCap() {
        GeminiClient client = mock(GeminiClient.class);
        when(client.isLiveMode()).thenReturn(true);
        when(client.classify(anyString(), anyList()))
                .thenReturn(classification("POSITIVE", "service"));

        // 5 reviews available; cap=2 must stop after 2 processed.
        ReviewRepository repo = mock(ReviewRepository.class);
        when(repo.findBySentimentIsNull(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(
                        review(1L, "a"), review(2L, "b"), review(3L, "c"),
                        review(4L, "d"), review(5L, "e"))));

        CategoryRepository catRepo = mock(CategoryRepository.class);
        when(catRepo.findByCode(anyString())).thenReturn(Optional.empty());

        ClassifyResult result = build(
                client,
                repo,
                mock(ReviewCategoryRepository.class),
                catRepo,
                mock(EntityManager.class),
                10, 0L, 2).classifyOnce();

        assertEquals(2, result.processed(), "daily cap must stop the loop after N reviews");
        assertEquals(2, result.ok());
        verify(client, times(2)).classify(anyString(), anyList());
    }

    @Test
    void classifyOnce_treatsUnknownSentimentAsError() {
        GeminiClient client = mock(GeminiClient.class);
        when(client.isLiveMode()).thenReturn(true);
        // Schema constrains sentiment, but defend the persistence side anyway.
        when(client.classify(anyString(), anyList())).thenReturn(
                new GeminiClassification("MAYBE", "ok", List.of(), List.of("x")));

        ReviewRepository repo = mock(ReviewRepository.class);
        when(repo.findBySentimentIsNull(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(review(1L, "txt"))))
                .thenReturn(new PageImpl<>(List.of()));

        ReviewModel saved = review(1L, "txt");
        ClassifyResult result = build(
                client,
                repo,
                mock(ReviewCategoryRepository.class),
                mock(CategoryRepository.class),
                mock(EntityManager.class),
                10, 0L, 1500).classifyOnce();

        assertEquals(1, result.processed());
        assertEquals(0, result.ok());
        assertEquals(1, result.errors());
        assertNull(saved.getSentiment(),
                "review.sentiment stays null so next run retries it");
        verify(repo, never()).save(any(ReviewModel.class));
    }
}
