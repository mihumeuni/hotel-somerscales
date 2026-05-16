package service;

import config.RoomNumberSerializer;
import dto.AvailabilityDTO;
import dto.CategoryCountDTO;
import dto.GuestStripDTO;
import dto.NormalizedReviewDTO;
import dto.OccupancyPointDTO;
import dto.SentimentSummaryDTO;
import dto.SentimentSummaryDTO.CategoryBreakdown;
import dto.TopGuestDTO;
import lombok.RequiredArgsConstructor;
import model.HotelConfigModel;
import model.Sentiment;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import repository.HotelConfigRepository;
import repository.HuespedRepository;
import repository.ReservaRepository;
import repository.ReviewRepository;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

// Composes the dashboard KPI queries (task014 + task022). Repositories return
// Object[] from native queries; this service does the type narrowing so
// callers see typed DTOs.
@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final int DEFAULT_TOTAL_ROOMS = 10;
    private static final int RECENT_GUESTS_LOOKBACK_DAYS = 30;

    private final ReservaRepository reservaRepository;
    private final HuespedRepository huespedRepository;
    private final ReviewRepository reviewRepository;
    private final HotelConfigRepository hotelConfigRepository;

    public List<OccupancyPointDTO> occupancy(LocalDate from, LocalDate to) {
        LocalDateTime fromTs = from.atStartOfDay();
        LocalDateTime toTs = to.atTime(LocalTime.MAX);
        List<Object[]> rows = reservaRepository.occupancyByMonth(fromTs, toTs);
        List<OccupancyPointDTO> out = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            out.add(OccupancyPointDTO.builder()
                    .month((String) row[0])
                    .nights(((Number) row[1]).longValue())
                    .build());
        }
        return out;
    }

    public List<TopGuestDTO> topGuests(int limit, LocalDate from, LocalDate to, String metric) {
        LocalDateTime fromTs = from.atStartOfDay();
        LocalDateTime toTs = to.atTime(LocalTime.MAX);
        boolean bySpend = "spend".equalsIgnoreCase(metric);
        List<Object[]> rows = bySpend
                ? huespedRepository.findTopGuestsBySpend(fromTs, toTs, PageRequest.of(0, limit))
                : huespedRepository.findTopGuestsByVisits(fromTs, toTs, PageRequest.of(0, limit));
        List<TopGuestDTO> out = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            out.add(TopGuestDTO.builder()
                    .huespedId(((Number) row[0]).longValue())
                    .nombreCompleto((String) row[1])
                    .visitCount(((Number) row[2]).longValue())
                    .totalSpend(row[3] == null ? BigDecimal.ZERO : new BigDecimal(row[3].toString()))
                    .lastVisit(toLocalDateTime(row[4]))
                    .build());
        }
        return out;
    }

    public SentimentSummaryDTO sentiment(LocalDate from, LocalDate to) {
        LocalDateTime fromTs = from.atStartOfDay();
        LocalDateTime toTs = to.atTime(LocalTime.MAX);

        // Stable iteration order — pie slices render in the same order across reloads.
        Map<String, Long> counts = new LinkedHashMap<>();
        counts.put("POSITIVE", 0L);
        counts.put("NEUTRAL", 0L);
        counts.put("NEGATIVE", 0L);
        for (Object[] row : reviewRepository.countBySentimentBetween(fromTs, toTs)) {
            Sentiment s = (Sentiment) row[0];
            long n = ((Number) row[1]).longValue();
            if (s != null) {
                counts.put(s.name(), n);
            }
        }

        List<CategoryBreakdown> byCategory = new ArrayList<>();
        for (Object[] row : reviewRepository.sentimentByCategory(fromTs, toTs)) {
            byCategory.add(CategoryBreakdown.builder()
                    .code((String) row[0])
                    .positive(((Number) row[1]).longValue())
                    .neutral(((Number) row[2]).longValue())
                    .negative(((Number) row[3]).longValue())
                    .build());
        }

        return SentimentSummaryDTO.builder()
                .counts(counts)
                .byCategory(byCategory)
                .build();
    }

    public AvailabilityDTO availability() {
        int totalRooms = hotelConfigRepository.findAll().stream()
                .map(HotelConfigModel::getTotalRooms)
                .findFirst()
                .orElse(DEFAULT_TOTAL_ROOMS);

        LocalDate today = LocalDate.now();
        int todayFree = freeAt(totalRooms, today.atTime(12, 0));

        AvailabilityDTO.Window week = peakFree(totalRooms, today, 7);
        AvailabilityDTO.Window month = peakFree(totalRooms, today, 30);

        return AvailabilityDTO.builder()
                .totalRooms(totalRooms)
                .today(todayFree)
                .week(week)
                .month(month)
                .build();
    }

    private int freeAt(int totalRooms, LocalDateTime ts) {
        long occupied = reservaRepository.countOccupiedRoomsAt(ts);
        return Math.max(0, totalRooms - (int) occupied);
    }

    // Walks each day in the window and reports the max free count + the date it
    // peaked. Linear in `days` and bounded by 30, so it's cheap enough to call
    // per dashboard load without caching.
    private AvailabilityDTO.Window peakFree(int totalRooms, LocalDate start, int days) {
        int maxFree = -1;
        LocalDate peak = start;
        for (int i = 0; i < days; i++) {
            LocalDate d = start.plusDays(i);
            int free = freeAt(totalRooms, d.atTime(12, 0));
            if (free > maxFree) {
                maxFree = free;
                peak = d;
            }
        }
        return AvailabilityDTO.Window.builder()
                .maxFree(Math.max(0, maxFree))
                .peakDate(peak)
                .build();
    }

    public List<GuestStripDTO> currentGuests() {
        List<Object[]> rows = reservaRepository.findCurrentGuests(LocalDateTime.now());
        return toGuestStrip(rows, /* recent= */ false);
    }

    public List<GuestStripDTO> recentGuests(int limit) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime since = now.minusDays(RECENT_GUESTS_LOOKBACK_DAYS);
        List<Object[]> rows = reservaRepository.findRecentGuests(now, since, limit);
        return toGuestStrip(rows, /* recent= */ true);
    }

    private List<GuestStripDTO> toGuestStrip(List<Object[]> rows, boolean recent) {
        if (rows.isEmpty()) {
            return List.of();
        }
        // Hydrate visit counts in one round-trip rather than N+1.
        List<Long> ids = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            ids.add(((Number) row[0]).longValue());
        }
        Map<Long, Long> visitsById = new HashMap<>();
        for (Object[] r : huespedRepository.countVisitsForGuests(ids)) {
            visitsById.put(((Number) r[0]).longValue(), ((Number) r[1]).longValue());
        }

        List<GuestStripDTO> out = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            Long id = ((Number) row[0]).longValue();
            String name = (String) row[1];
            List<String> rooms = parseRooms((String) row[2]);
            // row[3] = check_in (unused), row[4] = check_out
            LocalDate checkout = toLocalDate(row[4]);
            int partySize = row[5] == null ? 0 : ((Number) row[5]).intValue();
            out.add(GuestStripDTO.builder()
                    .huespedId(id)
                    .nombreCompleto(name)
                    .initials(initials(name))
                    .rooms(rooms)
                    .totalVisits(visitsById.getOrDefault(id, 0L))
                    .checkoutDate(checkout)
                    .partySize(partySize)
                    .build());
        }
        return out;
    }

    public List<CategoryCountDTO> categoryCounts(LocalDate from, LocalDate to) {
        LocalDateTime fromTs = from.atStartOfDay();
        LocalDateTime toTs = to.atTime(LocalTime.MAX);
        List<Object[]> rows = reviewRepository.categoryCounts(fromTs, toTs);
        List<CategoryCountDTO> out = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            out.add(CategoryCountDTO.builder()
                    .code((String) row[0])
                    .labelEs((String) row[1])
                    .labelEn((String) row[2])
                    .count(((Number) row[3]).longValue())
                    .build());
        }
        return out;
    }

    public List<NormalizedReviewDTO> normalizedReviews(LocalDate from, LocalDate to, int limit) {
        LocalDateTime fromTs = from.atStartOfDay();
        LocalDateTime toTs = to.atTime(LocalTime.MAX);
        List<Object[]> rows = reviewRepository.normalizedSummaries(fromTs, toTs, limit);
        List<NormalizedReviewDTO> out = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            out.add(NormalizedReviewDTO.builder()
                    .summary((String) row[0])
                    .sentiment((String) row[1])
                    .count(((Number) row[2]).longValue())
                    .build());
        }
        return out;
    }

    private static List<String> parseRooms(String agg) {
        if (agg == null || agg.isBlank()) {
            return List.of();
        }
        String[] parts = agg.split(",");
        List<String> out = new ArrayList<>(parts.length);
        for (String p : parts) {
            String norm = RoomNumberSerializer.normalize(p);
            if (norm != null && !norm.isBlank() && !out.contains(norm)) {
                out.add(norm);
            }
        }
        return out;
    }

    private static String initials(String name) {
        if (name == null || name.isBlank()) {
            return "?";
        }
        String[] words = name.trim().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < Math.min(2, words.length); i++) {
            sb.append(Character.toUpperCase(words[i].charAt(0)));
        }
        return sb.toString();
    }

    private static LocalDate toLocalDate(Object raw) {
        if (raw == null) {
            return null;
        }
        if (raw instanceof LocalDate ld) {
            return ld;
        }
        if (raw instanceof LocalDateTime ldt) {
            return ldt.toLocalDate();
        }
        if (raw instanceof Timestamp ts) {
            return ts.toLocalDateTime().toLocalDate();
        }
        if (raw instanceof java.sql.Date sd) {
            return sd.toLocalDate();
        }
        throw new IllegalStateException("Unexpected date type from native query: " + raw.getClass());
    }

    private static LocalDateTime toLocalDateTime(Object raw) {
        if (raw == null) {
            return null;
        }
        if (raw instanceof LocalDateTime ldt) {
            return ldt;
        }
        if (raw instanceof Timestamp ts) {
            return ts.toLocalDateTime();
        }
        throw new IllegalStateException("Unexpected timestamp type from native query: " + raw.getClass());
    }
}
