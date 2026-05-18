package dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * task031 shape: one bucket per row in {@code sentiment_labels}, plus the
 * total distinct labelled reviews (since multi-label means sum(buckets) ≥
 * totalReviews). {@code multiLabel} flags FE to render the "una reseña puede
 * contar en varias etiquetas" tooltip.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SentimentSummaryDTO {

    @Builder.Default
    private List<Bucket> buckets = new ArrayList<>();

    private long totalReviews;

    @Builder.Default
    private boolean multiLabel = true;

    @Builder.Default
    private List<CategoryBreakdown> byCategory = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Bucket {
        private String code;
        private String labelEs;
        private String emoji;
        private long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryBreakdown {
        private String code;
        // task031: bucket counts keyed by sentiment_labels.code (lowercase).
        // FE matches against the same code so renaming a label only requires
        // editing sentiment_labels.label_es — no FE change.
        @Builder.Default
        private java.util.Map<String, Long> buckets = new java.util.LinkedHashMap<>();
    }
}
