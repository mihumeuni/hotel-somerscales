package integrations.llm;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import integrations.llm.dto.LlmClassification;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * Thin wrapper around any OpenAI-compatible chat-completions API that returns a
 * strict {@link LlmClassification} for a single review. Default provider is
 * <b>Groq</b> ({@code https://api.groq.com/openai/v1}, model
 * {@code llama-3.3-70b-versatile}); switching to Cerebras / OpenRouter / etc.
 * is a {@code .env} change ({@code LLM_BASE_URL} + {@code LLM_MODEL}) with no
 * code edit, since they all speak the same protocol.
 * <p>
 * Replaces the former Gemini SDK client: Gemini's free tier requires a billing
 * card + a USD deposit the hotel cannot front, so classification now runs on
 * Groq's genuinely card-free tier. Calls use JSON mode
 * ({@code response_format=json_object}); because that has no typed schema like
 * Gemini's {@code responseSchema}, the expected shape and the allowed sentiment
 * codes are pinned in the prompt. The classifier service still filters every
 * label/category against the operator taxonomy, so an out-of-enum response can
 * never reach the database.
 * <p>
 * When {@code integrations.llm.api-key} is blank the client reports
 * {@code !isLiveMode()} so the classifier service skips the run entirely.
 */
@Slf4j
@Component
public class LlmClassifierClient {

    private final String model;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    public LlmClassifierClient(
            @Value("${integrations.llm.api-key:}") String apiKey,
            @Value("${integrations.llm.base-url:https://api.groq.com/openai/v1}") String baseUrl,
            @Value("${integrations.llm.model:llama-3.3-70b-versatile}") String model) {
        String key = apiKey == null ? "" : apiKey.trim();
        this.model = model;
        // Local instance: the Spring Boot 4.0.6 webmvc starter does not auto-
        // register an ObjectMapper bean (same note as GooglePlacesClient).
        this.objectMapper = new ObjectMapper();
        this.restClient = key.isBlank()
                ? null
                : RestClient.builder()
                        .baseUrl(baseUrl)
                        .defaultHeader("Authorization", "Bearer " + key)
                        .build();
    }

    public boolean isLiveMode() {
        return restClient != null;
    }

    /**
     * Classifies a single review against the supplied category + sentiment
     * label code lists. {@code sentimentCodes} is the operator-managed taxonomy
     * from {@code sentiment_labels}; the model emits any subset as an array.
     * Throws {@link IllegalStateException} when called without an API key —
     * callers must gate on {@link #isLiveMode()}.
     * <p>
     * Returns the raw JSON the model emitted in {@link Result#rawJson} so the
     * service can persist it to {@code reviews.classification_raw} for audit.
     */
    public Result classify(String rawText,
                           List<String> categoryCodes,
                           List<String> sentimentCodes) {
        if (restClient == null) {
            throw new IllegalStateException(
                    "LlmClassifierClient called without integrations.llm.api-key configured");
        }

        String requestBody;
        try {
            requestBody = objectMapper.writeValueAsString(
                    buildRequest(rawText, categoryCodes, sentimentCodes));
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize LLM request", e);
        }

        String envelope = restClient.post()
                .uri("/chat/completions")
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(String.class);

        if (envelope == null || envelope.isBlank()) {
            throw new IllegalStateException("LLM returned empty HTTP body");
        }

        String content;
        try {
            JsonNode root = objectMapper.readTree(envelope);
            content = root.path("choices").path(0).path("message").path("content")
                    .asText(null);
        } catch (Exception e) {
            throw new IllegalStateException("LLM response envelope not parseable", e);
        }
        if (content == null || content.isBlank()) {
            throw new IllegalStateException("LLM returned empty content");
        }

        try {
            LlmClassification parsed = objectMapper.readValue(content, LlmClassification.class);
            return new Result(parsed, content);
        } catch (Exception e) {
            log.warn("[LlmClassifierClient] JSON parse failed: payload={} err={}",
                    content, e.getMessage());
            throw new IllegalStateException("LLM content not parseable as classification", e);
        }
    }

    public record Result(LlmClassification classification, String rawJson) {}

    // OpenAI-compatible request body. JSON mode requires the literal word
    // "JSON" to appear in the prompt, and since there is no typed responseSchema
    // anymore, the exact shape + allowed sentiment codes are pinned in the
    // prompt. temperature=0 keeps classification deterministic.
    private Map<String, Object> buildRequest(String rawText,
                                             List<String> categoryCodes,
                                             List<String> sentimentCodes) {
        return Map.of(
                "model", model,
                "temperature", 0,
                "max_tokens", 1024,
                "response_format", Map.of("type", "json_object"),
                "messages", List.of(
                        Map.of("role", "system", "content", SYSTEM_PROMPT),
                        Map.of("role", "user", "content",
                                userPrompt(rawText, categoryCodes, sentimentCodes))));
    }

    private static final String SYSTEM_PROMPT = """
            Eres un analista de reseñas de hotel. Respondes SIEMPRE con un único
            objeto JSON válido, sin texto adicional, sin explicaciones y sin
            vallas de código. El JSON debe tener EXACTAMENTE estas claves:
              "labels": arreglo de strings con los códigos de sentimiento aplicables,
              "summary": string, resumen en español de máximo 30 palabras,
              "categories": arreglo de objetos {"code": string, "confidence": número entre 0.0 y 1.0},
              "keyPhrases": arreglo de 3 a 5 frases cortas en el idioma original.
            """;

    private static String userPrompt(String rawText,
                                     List<String> categoryCodes,
                                     List<String> sentimentCodes) {
        // Category + sentiment lists are operator-managed (task028 + task031);
        // injected dynamically so editing the taxonomy in /settings/global
        // reaches the classifier without a code change.
        String catList = String.join(", ", categoryCodes);
        String sentList = String.join(", ", sentimentCodes);
        return """
               Etiqueta TODOS los sentimientos aplicables (puede ser más de uno)
               usando EXCLUSIVAMENTE estos códigos: """ + sentList + """
               .
               Por ejemplo, una reseña que elogia el desayuno pero se queja del
               ruido debería recibir ["positive","complaint"]. No incluyas
               códigos que no apliquen.
               Etiqueta las categorías relevantes con un valor de confianza entre
               0.0 y 1.0, usando solo estos códigos: """ + catList + """
               .
               Extrae entre 3 y 5 frases clave cortas en el idioma original y
               devuelve el resultado como JSON con el formato indicado.
               Reseña:
               """ + rawText;
    }
}
