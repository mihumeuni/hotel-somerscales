package service;

import dto.AvailabilityDTO;
import dto.GuestStripDTO;
import dto.OccupancyPointDTO;
import dto.SentimentSummaryDTO;
import dto.TopGuestDTO;
import model.HotelConfigModel;
import model.SentimentLabelModel;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import repository.HotelConfigRepository;
import repository.HuespedRepository;
import repository.ReservaRepository;
import repository.ReviewRepository;
import repository.SentimentLabelRepository;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class DashboardServiceTest {

    private final LocalDate from = LocalDate.of(2025, 5, 1);
    private final LocalDate to = LocalDate.of(2026, 5, 1);

    private static SentimentLabelModel label(String code, String es, String emoji, short ord) {
        return SentimentLabelModel.builder()
                .code(code).labelEs(es).emoji(emoji).ordinal(ord).build();
    }

    private static SentimentLabelRepository taxonomy() {
        SentimentLabelRepository r = mock(SentimentLabelRepository.class);
        when(r.findAllByOrderByOrdinalAsc()).thenReturn(List.of(
                label("positive", "Positivo", "😊", (short) 0),
                label("negative", "Negativo", "😞", (short) 1),
                label("neutral", "Neutral", "😐", (short) 2),
                label("improvement", "Mejora", "💡", (short) 3),
                label("complaint", "Reclamo", "⚠️", (short) 4)
        ));
        return r;
    }

    private DashboardService svc(ReservaRepository reservas, HuespedRepository huespedes, ReviewRepository reviews) {
        return new DashboardService(reservas, huespedes, reviews,
                mock(HotelConfigRepository.class), taxonomy());
    }

    private DashboardService svc(ReservaRepository reservas, HuespedRepository huespedes, ReviewRepository reviews,
                                 HotelConfigRepository hotelConfig) {
        return new DashboardService(reservas, huespedes, reviews, hotelConfig, taxonomy());
    }

    @Test
    void occupancy_mapsObjectArraysToDtos() {
        ReservaRepository reservas = mock(ReservaRepository.class);
        when(reservas.occupancyByMonth(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(
                        new Object[]{"2026-04", 312},
                        new Object[]{"2026-05", 280L}
                ));

        List<OccupancyPointDTO> out = svc(reservas, mock(HuespedRepository.class), mock(ReviewRepository.class))
                .occupancy(from, to);
        assertEquals(2, out.size());
        assertEquals("2026-04", out.get(0).getMonth());
        assertEquals(312L, out.get(0).getNights());
        assertEquals(280L, out.get(1).getNights());
    }

    @Test
    void topGuests_byVisits_appliesLimitAndCoercesTimestamp() {
        HuespedRepository huespedes = mock(HuespedRepository.class);
        LocalDateTime lastVisit = LocalDateTime.of(2026, 4, 18, 14, 0);
        when(huespedes.findTopGuestsByVisits(any(LocalDateTime.class), any(LocalDateTime.class), eq(PageRequest.of(0, 5))))
                .thenReturn(List.of(
                        new Object[]{1L, "Juan Pérez", 14L, new BigDecimal("1850000"), Timestamp.valueOf(lastVisit)},
                        new Object[]{2L, "María González", 12L, new BigDecimal("1500000"), lastVisit}
                ));

        List<TopGuestDTO> out = svc(mock(ReservaRepository.class), huespedes, mock(ReviewRepository.class))
                .topGuests(5, from, to, "visits");
        assertEquals(2, out.size());
        assertEquals(1L, out.get(0).getHuespedId());
        assertEquals("Juan Pérez", out.get(0).getNombreCompleto());
        assertEquals(14L, out.get(0).getVisitCount());
        assertEquals(new BigDecimal("1850000"), out.get(0).getTotalSpend());
        // Critical: Postgres native queries return java.sql.Timestamp; service must coerce it.
        assertEquals(lastVisit, out.get(0).getLastVisit());
        assertEquals(lastVisit, out.get(1).getLastVisit());
    }

    @Test
    void topGuests_bySpend_callsSpendQuery() {
        HuespedRepository huespedes = mock(HuespedRepository.class);
        when(huespedes.findTopGuestsBySpend(any(LocalDateTime.class), any(LocalDateTime.class), any(Pageable.class)))
                .thenReturn(List.<Object[]>of(new Object[]{3L, "Big Spender", 4L, new BigDecimal("9999999"), null}));

        List<TopGuestDTO> out = svc(mock(ReservaRepository.class), huespedes, mock(ReviewRepository.class))
                .topGuests(10, from, to, "spend");
        assertEquals(1, out.size());
        assertEquals(new BigDecimal("9999999"), out.get(0).getTotalSpend());
    }

    @Test
    void topGuests_handlesNullSpendAndLastVisit() {
        HuespedRepository huespedes = mock(HuespedRepository.class);
        when(huespedes.findTopGuestsByVisits(any(LocalDateTime.class), any(LocalDateTime.class), any(Pageable.class)))
                .thenReturn(List.<Object[]>of(new Object[]{99L, "Sin reservas", 0L, null, null}));

        List<TopGuestDTO> out = svc(mock(ReservaRepository.class), huespedes, mock(ReviewRepository.class))
                .topGuests(10, from, to, "visits");
        assertEquals(1, out.size());
        assertEquals(BigDecimal.ZERO, out.get(0).getTotalSpend());
        assertEquals(null, out.get(0).getLastVisit());
    }

    @Test
    void sentiment_seedsAllBucketsAndOverlaysCounts() {
        ReviewRepository reviews = mock(ReviewRepository.class);
        when(reviews.countByLabelBetween(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(
                        new Object[]{"positive", 32L},
                        new Object[]{"negative", 5L},
                        new Object[]{"improvement", 4L}
                        // neutral + complaint deliberately missing — must default to 0
                ));
        when(reviews.sentimentByCategory(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(
                        new Object[]{"cleanliness", "positive", 10L},
                        new Object[]{"cleanliness", "complaint", 2L},
                        new Object[]{"service",     "positive", 8L},
                        new Object[]{"service",     "neutral",  3L}
                ));
        when(reviews.countLabeledBetween(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(30L);

        SentimentSummaryDTO out = svc(mock(ReservaRepository.class), mock(HuespedRepository.class), reviews)
                .sentiment(from, to);
        assertNotNull(out);
        assertTrue(out.isMultiLabel(), "multiLabel flag tells the FE to render the tooltip");
        assertEquals(30L, out.getTotalReviews(), "totalReviews is distinct count, not sum of buckets");
        assertEquals(5, out.getBuckets().size(), "every taxonomy row is surfaced even with zero count");
        assertEquals("positive", out.getBuckets().get(0).getCode());
        assertEquals(32L, out.getBuckets().get(0).getCount());
        assertEquals("neutral", out.getBuckets().get(2).getCode());
        assertEquals(0L, out.getBuckets().get(2).getCount(), "missing taxonomy row → zero, not absent");
        assertEquals(4L, out.getBuckets().get(3).getCount());
        assertEquals(0L, out.getBuckets().get(4).getCount());

        assertEquals(2, out.getByCategory().size());
        assertEquals("cleanliness", out.getByCategory().get(0).getCode());
        assertEquals(10L, out.getByCategory().get(0).getBuckets().get("positive"));
        assertEquals(2L, out.getByCategory().get(0).getBuckets().get("complaint"));
        assertEquals(3L, out.getByCategory().get(1).getBuckets().get("neutral"));
    }

    @Test
    void availability_subtractsOccupiedAndPicksMaxFreeAcrossWindow() {
        ReservaRepository reservas = mock(ReservaRepository.class);
        when(reservas.countOccupiedRoomsAt(any(LocalDateTime.class))).thenReturn(2L);

        HotelConfigRepository hotelConfig = mock(HotelConfigRepository.class);
        when(hotelConfig.findAll()).thenReturn(List.of(
                HotelConfigModel.builder().id(1L).totalRooms(10).updatedAt(LocalDateTime.now()).build()
        ));

        AvailabilityDTO out = svc(reservas, mock(HuespedRepository.class), mock(ReviewRepository.class), hotelConfig)
                .availability();
        assertEquals(10, out.getTotalRooms());
        assertEquals(8, out.getToday());
        assertEquals(8, out.getWeek().getMaxFree());
        assertEquals(8, out.getMonth().getMaxFree());
        assertNotNull(out.getWeek().getPeakDate());
        assertNotNull(out.getMonth().getPeakDate());
    }

    @Test
    void availability_fallsBackToDefaultWhenNoConfigRow() {
        ReservaRepository reservas = mock(ReservaRepository.class);
        when(reservas.countOccupiedRoomsAt(any(LocalDateTime.class))).thenReturn(0L);
        HotelConfigRepository hotelConfig = mock(HotelConfigRepository.class);
        when(hotelConfig.findAll()).thenReturn(List.of());

        AvailabilityDTO out = svc(reservas, mock(HuespedRepository.class), mock(ReviewRepository.class), hotelConfig)
                .availability();
        assertEquals(10, out.getTotalRooms());
        assertEquals(10, out.getToday());
    }

    @Test
    void currentGuests_groupsMultiRoomStaysAndHydratesVisits() {
        ReservaRepository reservas = mock(ReservaRepository.class);
        HuespedRepository huespedes = mock(HuespedRepository.class);
        when(reservas.findCurrentGuests(any(LocalDateTime.class))).thenReturn(List.<Object[]>of(
                new Object[]{42L, "Familia Soto", "HA3,HA4,HA5",
                        Timestamp.valueOf(LocalDateTime.of(2026, 5, 15, 14, 0)),
                        Timestamp.valueOf(LocalDateTime.of(2026, 5, 19, 11, 0)),
                        5}
        ));
        when(huespedes.countVisitsForGuests(eq(List.of(42L)))).thenReturn(List.<Object[]>of(new Object[]{42L, 7L}));

        List<GuestStripDTO> out = svc(reservas, huespedes, mock(ReviewRepository.class))
                .currentGuests();
        assertEquals(1, out.size());
        GuestStripDTO g = out.get(0);
        assertEquals(42L, g.getHuespedId());
        assertEquals("FS", g.getInitials());
        // Rooms must be H#, not HA#, after normalization
        assertTrue(g.getRooms().containsAll(List.of("H3", "H4", "H5")));
        assertEquals(3, g.getRooms().size());
        assertEquals(7L, g.getTotalVisits());
        assertEquals(5, g.getPartySize());
        assertEquals(LocalDate.of(2026, 5, 19), g.getCheckoutDate());
    }
}
