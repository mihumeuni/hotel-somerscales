package dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SentimentSummaryDTO {

    // Sentiment label → count. NULL is excluded; only POSITIVE/NEUTRAL/NEGATIVE
    // are surfaced so the dashboard pie sums match what was classified.
    @Builder.Default
    private Map<String, Long> counts = new LinkedHashMap<>();

    @Builder.Default
    private List<CategoryBreakdown> byCategory = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryBreakdown {
        private String code;
        private long positive;
        private long neutral;
        private long negative;
    }
}
