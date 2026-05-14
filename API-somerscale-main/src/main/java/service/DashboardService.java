package service;

import dto.OccupancyPointDTO;
import dto.SentimentSummaryDTO;
import dto.SentimentSummaryDTO.CategoryBreakdown;
import dto.TopGuestDTO;
import lombok.RequiredArgsConstructor;
import model.Sentiment;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import repository.HuespedRepository;
import repository.ReservaRepository;
import repository.ReviewRepository;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

// Composes the three KPI queries the dashboard renders (task014).
// Repositories return Object[] from native queries; this service does the
// type narrowing so callers see typed DTOs.
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ReservaRepository reservaRepository;
    private final HuespedRepository huespedRepository;
    private final ReviewRepository reviewRepository;

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

    public List<TopGuestDTO> topGuests(int limit, LocalDate from, LocalDate to) {
        LocalDateTime fromTs = from.atStartOfDay();
        LocalDateTime toTs = to.atTime(LocalTime.MAX);
        List<Object[]> rows = huespedRepository.findTopGuests(fromTs, toTs, PageRequest.of(0, limit));
        List<TopGuestDTO> out = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            out.add(TopGuestDTO.builder()
                    .huespedId(((Number) row[0]).longValue())
                    .nombreCompleto((String) row[1])
                    .visitCount(((Number) row[2]).longValue())
                    .lastVisit(toLocalDateTime(row[3]))
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
