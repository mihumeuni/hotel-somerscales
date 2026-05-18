package dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

// One AI-clustered review summary. `count` is the number of underlying reviews
// the Gemini classifier (task013) grouped under this summary text. task031:
// `labels` is the distinct set of sentiment codes applied to the cluster — a
// cluster can carry mixed sentiment chips on the FE.
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NormalizedReviewDTO {
    private String summary;
    @Builder.Default
    private List<String> labels = new ArrayList<>();
    private long count;
}
