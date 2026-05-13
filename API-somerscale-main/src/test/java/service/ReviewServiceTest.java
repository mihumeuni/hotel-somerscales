package service;

import model.ReviewModel;
import model.ReviewSource;
import org.junit.jupiter.api.Test;
import repository.ReviewRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ReviewServiceTest {

    @Test
    void upsertReview_insertsWhenNoMatch() {
        ReviewRepository repo = mock(ReviewRepository.class);
        when(repo.findBySourceAndExternalId(ReviewSource.GOOGLE, "EXT-1"))
                .thenReturn(Optional.empty());
        when(repo.save(any(ReviewModel.class))).thenAnswer(inv -> inv.getArgument(0));

        ReviewService svc = new ReviewService(repo);

        ReviewModel saved = svc.upsertReview(
                ReviewSource.GOOGLE, "EXT-1", "Ada Lovelace",
                new BigDecimal("4.5"), "es", "Great stay", LocalDateTime.of(2026, 5, 1, 12, 0));

        assertEquals(ReviewSource.GOOGLE, saved.getSource());
        assertEquals("EXT-1", saved.getExternalId());
        assertEquals("Ada Lovelace", saved.getAuthor());
        assertEquals("Great stay", saved.getRawText());
        assertNotNull(saved.getFetchedAt(), "service must stamp fetchedAt on insert path");
        verify(repo, times(1)).save(any(ReviewModel.class));
    }

    @Test
    void upsertReview_updatesExistingRowWithoutDuplicating() {
        ReviewRepository repo = mock(ReviewRepository.class);

        ReviewModel existing = ReviewModel.builder()
                .id(42L)
                .source(ReviewSource.GOOGLE)
                .externalId("EXT-1")
                .author("Ada Lovelace")
                .rawText("Great stay")
                .build();

        when(repo.findBySourceAndExternalId(ReviewSource.GOOGLE, "EXT-1"))
                .thenReturn(Optional.of(existing));
        when(repo.save(any(ReviewModel.class))).thenAnswer(inv -> inv.getArgument(0));

        ReviewService svc = new ReviewService(repo);

        ReviewModel saved = svc.upsertReview(
                ReviewSource.GOOGLE, "EXT-1", "Ada Lovelace (edited)",
                new BigDecimal("4.8"), "en", "Updated review body",
                LocalDateTime.of(2026, 5, 2, 12, 0));

        // Acceptance criterion: second upsert with the same (source, externalId)
        // must mutate the existing row instead of allocating a new one.
        assertSame(existing, saved, "upsert must update in-place, not allocate a new row");
        assertEquals(42L, saved.getId(), "primary key preserved across refetch");
        assertEquals("Ada Lovelace (edited)", saved.getAuthor());
        assertEquals(new BigDecimal("4.8"), saved.getRating());
        assertEquals("en", saved.getLanguage());
        assertEquals("Updated review body", saved.getRawText());
        verify(repo, times(1)).save(existing);
    }
}
