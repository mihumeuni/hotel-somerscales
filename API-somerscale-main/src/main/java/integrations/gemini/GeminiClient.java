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

    public GeminiClient(
            @Value("${integrations.gemini.api-key:}") String apiKey,
            @Value("${integrations.gemini.model:gemini-2.5-flash}") String model) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.model = model;
        this.objectMapper = new ObjectMapper();
        this.client = this.apiKey.isBlank()
                ? null
                : Client.builder().apiKey(this.apiKey).build();
    }

    public boolean isLiveMode() {
        return client != null;
    }

    /**
     * Classifies a single review against the supplied category + sentiment
     * label code lists. task031: {@code sentimentCodes} is the operator-
     * managed taxonomy from {@code sentiment_labels} — Gemini emits any
     * subset as an array. Throws {@link IllegalStateException} when called
     * without an API key — callers must gate on {@link #isLiveMode()}.
     * <p>
     * Returns the raw JSON Gemini emitted in {@link Result#rawJson} so the
     * service can persist it to {@code reviews.classification_raw} for audit.
     */
    public Result classify(String rawText,
                           List<String> categoryCodes,
                           List<String> sentimentCodes) {
        if (client == null) {
            throw new IllegalStateException(
                    "GeminiClient called without GEMINI_API_KEY configured");
        }

        String prompt = buildPrompt(rawText, categoryCodes, sentimentCodes);
        // Schema is built per-call so the labels enum reflects the operator's
        // current sentiment taxonomy without a process restart.
        Schema schema = buildResponseSchema(sentimentCodes);
        GenerateContentConfig config = GenerateContentConfig.builder()
                .responseMimeType("application/json")
                .responseSchema(schema)
                .candidateCount(1)
                .build();

        GenerateContentResponse response =
                client.models.generateContent(model, prompt, config);
        String json = response.text();
        if (json == null || json.isBlank()) {
            throw new IllegalStateException("Gemini returned empty response");
        }

        try {
            GeminiClassification parsed = objectMapper.readValue(json, GeminiClassification.class);
            return new Result(parsed, json);
        } catch (Exception e) {
            log.warn("[GeminiClient] JSON parse failed: payload={} err={}",
                    json, e.getMessage());
            throw new IllegalStateException("Gemini response not parseable", e);
        }
    }

    public record Result(GeminiClassification classification, String rawJson) {}

    private static String buildPrompt(String rawText,
                                      List<String> categoryCodes,
                                      List<String> sentimentCodes) {
        // Category + sentiment lists are operator-managed (task028 + task031);
        // injected dynamically so editing the taxonomy in /settings/global
        // reaches the classifier without a code change. responseSchema enums
        // mirror these lists so unknown codes can't be returned at all.
        String catList = String.join(", ", categoryCodes);
        String sentList = String.join(", ", sentimentCodes);
        return """
               Eres un analista de reseñas de hotel. Dada la reseña al final,
               etiqueta TODOS los sentimientos aplicables (puede ser más de uno)
               usando exclusivamente estos códigos: """ + sentList + """
               .
               Por ejemplo, una reseña que elogia el desayuno pero se queja del
               ruido debería recibir ["positive","complaint"]. No incluyas
               códigos que no apliquen.
               Escribe un resumen en español en una sola oración de máximo 30
               palabras que capture todos los aspectos detectados.
               Etiqueta las categorías relevantes con un valor de confianza
               entre 0.0 y 1.0, y extrae entre 3 y 5 frases clave cortas en el
               idioma original.
               Categorías válidas (usa solo estos códigos): """ + catList + """
               .
               Reseña:
               """ + rawText;
    }

    private static Schema buildResponseSchema(List<String> sentimentCodes) {
        // Gemini structured-output schema using the typed SDK builder.
        Schema categoryHit = Schema.builder()
                .type("OBJECT")
                .properties(orderedMap(
                        "code", Schema.builder().type("STRING").build(),
                        "confidence", Schema.builder().type("NUMBER").build()
                ))
                .required(List.of("code", "confidence"))
                .build();

        Schema labelString = sentimentCodes == null || sentimentCodes.isEmpty()
                ? Schema.builder().type("STRING").build()
                : Schema.builder().type("STRING").enum_(sentimentCodes).build();

        return Schema.builder()
                .type("OBJECT")
                .properties(orderedMap(
                        "labels", Schema.builder()
                                .type("ARRAY")
                                .items(labelString)
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
                .required(List.of("labels", "summary", "categories", "keyPhrases"))
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
