package integrations.gemini.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.util.List;

/**
 * Strict JSON shape Gemini returns when called with the responseSchema in
 * {@code integrations.gemini.GeminiClient}. Maps to {@code model.Sentiment}
 * and to the seeded {@code categories.code} catalog.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record GeminiClassification(
        String sentiment,
        String summary,
        List<CategoryHit> categories,
        List<String> keyPhrases
) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CategoryHit(String code, BigDecimal confidence) {}
}
