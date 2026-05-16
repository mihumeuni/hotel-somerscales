package dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// One AI-clustered review summary. `count` is the number of underlying reviews
// the Gemini classifier (task013) grouped under this summary text.
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NormalizedReviewDTO {
    private String summary;
    private String sentiment;
    private long count;
}
