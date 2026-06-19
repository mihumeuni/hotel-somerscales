package integrations.llm.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.util.List;

/**
 * Strict JSON shape the LLM returns when called in JSON mode by
 * {@link integrations.llm.LlmClassifierClient}. task031: {@code labels} is the
 * multi-label upgrade — the model may emit any subset of the codes in
 * {@code sentiment_labels} (positive, negative, neutral, improvement,
 * complaint) and the classifier service drops any unknown codes. The legacy
 * {@code sentiment} field is kept optional so old fixture JSON keeps
 * deserializing during the rollout; it is ignored when {@code labels} is set.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record LlmClassification(
        List<String> labels,
        String sentiment,
        String summary,
        List<CategoryHit> categories,
        List<String> keyPhrases
) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CategoryHit(String code, BigDecimal confidence) {}
}
