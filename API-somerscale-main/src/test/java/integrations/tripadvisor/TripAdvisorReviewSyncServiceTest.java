package integrations.tripadvisor;

import integrations.tripadvisor.TripAdvisorReviewSyncService.SyncResult;
import integrations.tripadvisor.dto.TripAdvisorResponse;
import integrations.tripadvisor.dto.TripAdvisorReview;
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

class TripAdvisorReviewSyncServiceTest {

    private static TripAdvisorReview review(long id, int rating, String lang, String title, String body) {
        return new TripAdvisorReview(
                id, lang, "2026-04-01T12:00:00Z",
                rating, title, body,
                new TripAdvisorReview.User("tester_" + id)
        );
    }

    private TripAdvisorReviewSyncService buildService(
            TripAdvisorClient client, ReviewService svc, ReviewRepository repo) {
        return new TripAdvisorReviewSyncService(client, svc, repo, "es,en");
    }

    @Test
    void syncOnce_insertsAllReviewsOnFirstRun() {
        TripAdvisorClient client = mock(TripAdvisorClient.class);
        when(client.isLiveMode()).thenReturn(false);
        when(client.fetchReviews("es")).thenReturn(new TripAdvisorResponse(List.of(
                review(101L, 5, "es", "Excelente", "Volveremos seguro"),
                review(102L, 4, "es", "Muy bueno", "Buen servicio"))));
        when(client.fetchReviews("en")).thenReturn(new TripAdvisorResponse(List.of(
                review(201L, 3, "en", "Decent", "Decent stay overall"))));

        ReviewRepository repo = mock(ReviewRepository.class);
        when(repo.findBySourceAndExternalId(eq(ReviewSource.TRIPADVISOR), anyString()))
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
        TripAdvisorClient client = mock(TripAdvisorClient.class);
        when(client.isLiveMode()).thenReturn(false);
        when(client.fetchReviews("es")).thenReturn(new TripAdvisorResponse(List.of(
                review(101L, 5, "es", "Excelente", "Volveremos"))));
        when(client.fetchReviews("en")).thenReturn(new TripAdvisorResponse(List.of(
                review(201L, 3, "en", "Decent", "ok"))));

        ReviewModel existing = ReviewModel.builder().id(1L).source(ReviewSource.TRIPADVISOR).build();

        ReviewRepository repo = mock(ReviewRepository.class);
        when(repo.findBySourceAndExternalId(eq(ReviewSource.TRIPADVISOR), anyString()))
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
        TripAdvisorClient client = mock(TripAdvisorClient.class);
        when(client.isLiveMode()).thenReturn(false);
        when(client.fetchReviews(anyString())).thenReturn(new TripAdvisorResponse(List.of(
                review(999L, 5, "es", "Quota check", "ok"))));

        ReviewRepository repo = mock(ReviewRepository.class);
        when(repo.findBySourceAndExternalId(eq(ReviewSource.TRIPADVISOR), anyString()))
                .thenReturn(Optional.empty());

        ReviewService svc = mock(ReviewService.class);
        when(svc.upsertReview(any(), anyString(), any(), any(), any(), any(), any()))
                .thenAnswer(inv -> ReviewModel.builder().build());

        TripAdvisorReviewSyncService sync = buildService(client, svc, repo);
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
