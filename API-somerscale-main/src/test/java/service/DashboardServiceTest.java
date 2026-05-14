package service;

import dto.OccupancyPointDTO;
import dto.SentimentSummaryDTO;
import dto.TopGuestDTO;
import model.Sentiment;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import repository.HuespedRepository;
import repository.ReservaRepository;
import repository.ReviewRepository;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class DashboardServiceTest {

    private final LocalDate from = LocalDate.of(2025, 5, 1);
    private final LocalDate to = LocalDate.of(2026, 5, 1);

    @Test
    void occupancy_mapsObjectArraysToDtos() {
        ReservaRepository reservas = mock(ReservaRepository.class);
        when(reservas.occupancyByMonth(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(
                        new Object[]{"2026-04", 312},
                        new Object[]{"2026-05", 280L}
                ));

        DashboardService svc = new DashboardService(reservas, mock(HuespedRepository.class), mock(ReviewRepository.class));

        List<OccupancyPointDTO> out = svc.occupancy(from, to);
        assertEquals(2, out.size());
        assertEquals("2026-04", out.get(0).getMonth());
        assertEquals(312L, out.get(0).getNights());
        assertEquals(280L, out.get(1).getNights());
    }

    @Test
    void topGuests_appliesLimitAndCoercesTimestamp() {
        HuespedRepository huespedes = mock(HuespedRepository.class);
        LocalDateTime lastVisit = LocalDateTime.of(2026, 4, 18, 14, 0);
        when(huespedes.findTopGuests(any(LocalDateTime.class), any(LocalDateTime.class), eq(PageRequest.of(0, 5))))
                .thenReturn(List.of(
                        new Object[]{1L, "Juan Pérez", 14L, Timestamp.valueOf(lastVisit)},
                        new Object[]{2L, "María González", 12L, lastVisit}
                ));

        DashboardService svc = new DashboardService(mock(ReservaRepository.class), huespedes, mock(ReviewRepository.class));

        List<TopGuestDTO> out = svc.topGuests(5, from, to);
        assertEquals(2, out.size());
        assertEquals(1L, out.get(0).getHuespedId());
        assertEquals("Juan Pérez", out.get(0).getNombreCompleto());
        assertEquals(14L, out.get(0).getVisitCount());
        // Critical: Postgres native queries return java.sql.Timestamp; service must coerce it.
        assertEquals(lastVisit, out.get(0).getLastVisit());
        assertEquals(lastVisit, out.get(1).getLastVisit());
    }

    @Test
    void topGuests_handlesNullLastVisit() {
        HuespedRepository huespedes = mock(HuespedRepository.class);
        when(huespedes.findTopGuests(any(LocalDateTime.class), any(LocalDateTime.class), any(Pageable.class)))
                .thenReturn(List.<Object[]>of(new Object[]{99L, "Sin reservas", 0L, null}));

        DashboardService svc = new DashboardService(mock(ReservaRepository.class), huespedes, mock(ReviewRepository.class));

        List<TopGuestDTO> out = svc.topGuests(10, from, to);
        assertEquals(1, out.size());
        assertEquals(null, out.get(0).getLastVisit());
    }

    @Test
    void sentiment_seedsAllBucketsAndOverlaysCounts() {
        ReviewRepository reviews = mock(ReviewRepository.class);
        when(reviews.countBySentimentBetween(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(
                        new Object[]{Sentiment.POSITIVE, 32L},
                        new Object[]{Sentiment.NEGATIVE, 5L}
                        // NEUTRAL deliberately missing
                ));
        when(reviews.sentimentByCategory(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(
                        new Object[]{"cleanliness", 10L, 1L, 2L},
                        new Object[]{"service", 8L, 3L, 1L}
                ));

        DashboardService svc = new DashboardService(mock(ReservaRepository.class), mock(HuespedRepository.class), reviews);

        SentimentSummaryDTO out = svc.sentiment(from, to);
        assertNotNull(out);
        // Acceptance: all three buckets present even when DB returned only two
        assertEquals(32L, out.getCounts().get("POSITIVE"));
        assertEquals(0L, out.getCounts().get("NEUTRAL"));
        assertEquals(5L, out.getCounts().get("NEGATIVE"));

        assertEquals(2, out.getByCategory().size());
        assertEquals("cleanliness", out.getByCategory().get(0).getCode());
        assertEquals(10L, out.getByCategory().get(0).getPositive());
        assertEquals(3L, out.getByCategory().get(1).getNeutral());
    }
}
