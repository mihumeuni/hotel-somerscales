package integrations.google;

import integrations.google.GoogleReviewSyncService.SyncResult;
import integrations.google.dto.PlaceReview;
import integrations.google.dto.PlacesResponse;
import model.ReviewModel;
import model.ReviewSource;
import org.junit.jupiter.api.Test;
import repository.ReviewRepository;
import service.ReviewService;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class GoogleReviewSyncServiceTest {

    private static PlaceReview review(String id, int rating, String lang, String text) {
        return new PlaceReview(
                id, rating,
                new PlaceReview.LocalizedText(text, lang),
                null,
                new PlaceReview.AuthorAttribution("Tester " + id, null),
                "2026-04-01T12:00:00Z"
        );
    }

    private GoogleReviewSyncService buildService(
            GooglePlacesClient client, ReviewService svc, ReviewRepository repo) {
        return new GoogleReviewSyncService(client, svc, repo, "es,en");
    }

    @Test
    void syncOnce_insertsAllReviewsOnFirstRun() {
        GooglePlacesClient client = mock(GooglePlacesClient.class);
        when(client.isLiveMode()).thenReturn(false);
        when(client.fetchReviews("es")).thenReturn(new PlacesResponse(List.of(
                review("places/X/reviews/ES1", 5, "es", "Excelente"),
                review("places/X/reviews/ES2", 4, "es", "Muy bueno"))));
        when(client.fetchReviews("en")).thenReturn(new PlacesResponse(List.of(
                review("places/X/reviews/EN1", 3, "en", "Decent stay"))));

        ReviewRepository repo = mock(ReviewRepository.class);
        when(repo.findBySourceAndExternalId(eq(ReviewSource.GOOGLE), anyString()))
                .thenReturn(Optional.empty());

        ReviewService svc = mock(ReviewService.class);
        when(svc.upsertReview(any(), anyString(), any(), any(), any(), any(), any()))
                .thenAnswer(inv -> ReviewModel.builder()
                        .source(inv.getArgument(0))
                        .externalId(inv.getArgument(1))
                        .build());

        SyncResult result = buildService(client, svc, repo).syncOnce();

        assertEquals(3, result.fetched());
        assertEquals(3, result.inserted(), "all three reviews are new on first run");
        assertEquals(0, result.updated());
        assertEquals(0, result.errors());
        assertEquals(0, result.skipped());
        assertEquals("fixture", result.mode());
        assertNotNull(result.ranAt());
        verify(svc, times(3)).upsertReview(any(), anyString(), any(), any(), any(), any(), any());
    }

    @Test
    void syncOnce_countsUpdatesWhenExternalIdsAlreadyExist() {
        GooglePlacesClient client = mock(GooglePlacesClient.class);
        when(client.isLiveMode()).thenReturn(false);
        when(client.fetchReviews("es")).thenReturn(new PlacesResponse(List.of(
                review("places/X/reviews/ES1", 5, "es", "Excelente"))));
        when(client.fetchReviews("en")).thenReturn(new PlacesResponse(List.of(
                review("places/X/reviews/EN1", 3, "en", "Decent stay"))));

        ReviewModel existing = ReviewModel.builder().id(1L).source(ReviewSource.GOOGLE).build();

        ReviewRepository repo = mock(ReviewRepository.class);
        when(repo.findBySourceAndExternalId(eq(ReviewSource.GOOGLE), anyString()))
                .thenReturn(Optional.of(existing));

        ReviewService svc = mock(ReviewService.class);
        when(svc.upsertReview(any(), anyString(), any(), any(), any(), any(), any()))
                .thenReturn(existing);

        SyncResult result = buildService(client, svc, repo).syncOnce();

        assertEquals(2, result.fetched());
        assertEquals(0, result.inserted());
        assertEquals(2, result.updated(), "both reviews already exist -> update path");
        assertEquals(0, result.errors());
    }

    @Test
    void scheduledSync_appliesPerLanguageQuotaWithinSameDay() {
        GooglePlacesClient client = mock(GooglePlacesClient.class);
        when(client.isLiveMode()).thenReturn(false);
        when(client.fetchReviews(anyString())).thenReturn(new PlacesResponse(List.of(
                review("places/X/reviews/Q1", 5, "es", "ok"))));

        ReviewRepository repo = mock(ReviewRepository.class);
        when(repo.findBySourceAndExternalId(eq(ReviewSource.GOOGLE), anyString()))
                .thenReturn(Optional.empty());

        ReviewService svc = mock(ReviewService.class);
        when(svc.upsertReview(any(), anyString(), any(), any(), any(), any(), any()))
                .thenAnswer(inv -> ReviewModel.builder().build());

        GoogleReviewSyncService sync = buildService(client, svc, repo);
        sync.scheduledSync();
        sync.scheduledSync(); // same-day re-run

        SyncResult tail = sync.lastResult().orElseThrow();
        assertEquals(2, tail.skipped(), "both ES + EN must be skipped on the second same-day run");
        assertEquals(0, tail.fetched(), "no fetch when quota tripped");
        verify(client, times(1)).fetchReviews("es");
        verify(client, times(1)).fetchReviews("en");
        // upsertReview only invoked on the first run's two reviews (one per lang).
        verify(svc, times(2)).upsertReview(any(), anyString(), any(), any(), any(), any(), any());
    }
}
