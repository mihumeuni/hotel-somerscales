package dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

// task031: row shape for GET /api/reviews?label= — one source review with
// every sentiment label it received, so the FE can render multi-colour chips
// per review without a second round-trip.
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewListItemDTO {
    private Long id;
    private String source;
    private String author;
    private BigDecimal rating;
    private String rawText;
    private String summary;
    private LocalDateTime postedAt;
    @Builder.Default
    private List<String> labels = new ArrayList<>();
}
