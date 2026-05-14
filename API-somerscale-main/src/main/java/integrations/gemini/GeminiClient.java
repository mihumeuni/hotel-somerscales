package integrations.gemini;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.genai.Client;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.Schema;
import integrations.gemini.dto.GeminiClassification;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Thin wrapper around the google-genai SDK that returns a strict
 * {@link GeminiClassification} for a single review.
 * <p>
 * Configured with {@code responseMimeType=application/json} + a
 * {@code responseSchema} so the model is constrained to the expected JSON
 * shape — no prose, no markdown fences, no recoverable parse errors. When
 * {@code integrations.gemini.api-key} is blank the client reports
 * {@code !isLiveMode()} so the classifier service can skip the daily run
 * entirely.
 */
@Slf4j
@Component
public class GeminiClient {

    private final String apiKey;
    private final String model;
    private final ObjectMapper objectMapper;
    private final Client client;
    private final Schema responseSchema;

    public GeminiClient(
            @Value("${integrations.gemini.api-key:}") String apiKey,
            @Value("${integrations.gemini.model:gemini-2.5-flash}") String model) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.model = model;
        this.objectMapper = new ObjectMapper();
        this.client = this.apiKey.isBlank()
                ? null
                : Client.builder().apiKey(this.apiKey).build();
        this.responseSchema = buildResponseSchema();
    }

    public boolean isLiveMode() {
        return client != null;
    }

    /**
     * Classifies a single review. Throws {@link IllegalStateException} when
     * called without an API key — callers must gate on {@link #isLiveMode()}.
     */
    public GeminiClassification classify(String rawText) {
        if (client == null) {
            throw new IllegalStateException(
                    "GeminiClient called without GEMINI_API_KEY configured");
        }

        String prompt = buildPrompt(rawText);
        GenerateContentConfig config = GenerateContentConfig.builder()
                .responseMimeType("application/json")
                .responseSchema(responseSchema)
                .candidateCount(1)
                .build();

        GenerateContentResponse response =
                client.models.generateContent(model, prompt, config);
        String json = response.text();
        if (json == null || json.isBlank()) {
            throw new IllegalStateException("Gemini returned empty response");
        }

        try {
            return objectMapper.readValue(json, GeminiClassification.class);
        } catch (Exception e) {
            log.warn("[GeminiClient] JSON parse failed: payload={} err={}",
                    json, e.getMessage());
            throw new IllegalStateException("Gemini response not parseable", e);
        }
    }

    private static String buildPrompt(String rawText) {
        // Spanish system + the raw review verbatim. The responseSchema forces
        // strict JSON shape — the prompt only guides content quality.
        return """
               Eres un analista de reseñas de hotel. Dada la reseña al final,
               clasifica el sentimiento (POSITIVE, NEUTRAL o NEGATIVE), escribe
               un resumen en español en una sola oración de máximo 30 palabras,
               etiqueta las categorías relevantes con un valor de confianza
               entre 0.0 y 1.0, y extrae entre 3 y 5 frases clave cortas en el
               idioma original. Categorías válidas:
               cleanliness, service, food, location, value, comfort, amenities, other.
               Reseña:
               """ + rawText;
    }

    private static Schema buildResponseSchema() {
        // Gemini structured-output schema using the typed SDK builder.
        // Type names accept both enum (Type.Known.OBJECT) and string ("OBJECT")
        // — strings keep the JSON-equivalent shape obvious at the call site.
        Schema categoryHit = Schema.builder()
                .type("OBJECT")
                .properties(orderedMap(
                        "code", Schema.builder()
                                .type("STRING")
                                .enum_(List.of("cleanliness", "service", "food",
                                        "location", "value", "comfort",
                                        "amenities", "other"))
                                .build(),
                        "confidence", Schema.builder().type("NUMBER").build()
                ))
                .required(List.of("code", "confidence"))
                .build();

        return Schema.builder()
                .type("OBJECT")
                .properties(orderedMap(
                        "sentiment", Schema.builder()
                                .type("STRING")
                                .enum_(List.of("POSITIVE", "NEUTRAL", "NEGATIVE"))
                                .build(),
                        "summary", Schema.builder().type("STRING").build(),
                        "categories", Schema.builder()
                                .type("ARRAY")
                                .items(categoryHit)
                                .build(),
                        "keyPhrases", Schema.builder()
                                .type("ARRAY")
                                .items(Schema.builder().type("STRING").build())
                                .build()
                ))
                .required(List.of("sentiment", "summary", "categories", "keyPhrases"))
                .build();
    }

    // Small helper because Map.of preserves no insertion order and the
    // responseSchema reads better with a stable property layout in logs.
    private static Map<String, Schema> orderedMap(Object... kv) {
        Map<String, Schema> out = new LinkedHashMap<>(kv.length / 2);
        for (int i = 0; i < kv.length; i += 2) {
            out.put((String) kv[i], (Schema) kv[i + 1]);
        }
        return out;
    }
}
