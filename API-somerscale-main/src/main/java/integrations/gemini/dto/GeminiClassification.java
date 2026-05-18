package integrations.gemini.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.util.List;

/**
 * Strict JSON shape Gemini returns when called with the responseSchema in
 * {@link integrations.gemini.GeminiClient}. task031: {@code labels} is the
 * multi-label upgrade — Gemini may emit any subset of the codes in
 * {@code sentiment_labels} (positive, negative, neutral, improvement,
 * complaint) and the classifier service drops any unknown codes. The legacy
 * {@code sentiment} field is kept optional so old fixture JSON keeps
 * deserializing during the rollout; it is ignored when {@code labels} is set.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record GeminiClassification(
        List<String> labels,
        String sentiment,
        String summary,
        List<CategoryHit> categories,
        List<String> keyPhrases
) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CategoryHit(String code, BigDecimal confidence) {}
}
