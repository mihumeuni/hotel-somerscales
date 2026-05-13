package integrations.google;

import com.fasterxml.jackson.databind.ObjectMapper;
import integrations.google.dto.PlacesResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Fetches the reviews payload for the configured Place ID.
 * <p>
 * Two modes:
 * <ol>
 *   <li><b>Live</b> — {@code integrations.google.places.api-key} is set:
 *       hits {@code GET v1/places/{id}} on places.googleapis.com with the
 *       {@code reviews} field mask.</li>
 *   <li><b>Fixture</b> — api-key is blank: reads
 *       {@code {fixture-dir}/google-places-{lang}.json}. This is the MVP
 *       demo mode while the hotel cannot front a billing card.</li>
 * </ol>
 * Either mode returns the same {@link PlacesResponse} shape so the sync
 * service is mode-agnostic.
 */
@Slf4j
@Component
public class GooglePlacesClient {

    private static final String BASE_URL = "https://places.googleapis.com";
    private static final String FIELD_MASK = "reviews";

    private final String apiKey;
    private final String placeId;
    private final Path fixtureDir;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public GooglePlacesClient(
            @Value("${integrations.google.places.api-key:}") String apiKey,
            @Value("${integrations.google.places.place-id:}") String placeId,
            @Value("${integrations.google.places.fixture-dir:../tests}") String fixtureDir) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.placeId = placeId == null ? "" : placeId.trim();
        this.fixtureDir = Path.of(fixtureDir);
        // Local instance: Spring Boot 4.0.6 webmvc starter does not auto-
        // register an ObjectMapper bean by default. Fixture parsing has no
        // need for the app's serialization config anyway.
        this.objectMapper = new ObjectMapper();
        this.restClient = RestClient.builder().baseUrl(BASE_URL).build();
    }

    public boolean isLiveMode() {
        return !apiKey.isBlank() && !placeId.isBlank();
    }

    /**
     * Returns the reviews payload for a given language. Never throws on
     * fixture-not-found in demo mode — returns an empty response so the
     * sync logs a zero count and moves on.
     */
    public PlacesResponse fetchReviews(String languageCode) {
        if (isLiveMode()) {
            return fetchLive(languageCode);
        }
        return fetchFixture(languageCode);
    }

    private PlacesResponse fetchLive(String languageCode) {
        String uri = "/v1/places/" + placeId + "?languageCode=" + languageCode;
        log.debug("[GooglePlacesClient] live fetch lang={} place={}", languageCode, placeId);
        PlacesResponse response = restClient.get()
                .uri(uri)
                .header("X-Goog-Api-Key", apiKey)
                .header("X-Goog-FieldMask", FIELD_MASK)
                .retrieve()
                .body(PlacesResponse.class);
        return response == null ? new PlacesResponse(java.util.List.of()) : response;
    }

    private PlacesResponse fetchFixture(String languageCode) {
        Path fixture = fixtureDir.resolve("google-places-" + languageCode + ".json");
        if (!Files.exists(fixture)) {
            log.warn("[GooglePlacesClient] fixture missing lang={} path={}",
                    languageCode, fixture.toAbsolutePath());
            return new PlacesResponse(java.util.List.of());
        }
        try {
            log.debug("[GooglePlacesClient] fixture fetch lang={} path={}",
                    languageCode, fixture);
            return objectMapper.readValue(fixture.toFile(), PlacesResponse.class);
        } catch (IOException e) {
            log.error("[GooglePlacesClient] fixture parse failed lang={} path={}: {}",
                    languageCode, fixture, e.getMessage());
            return new PlacesResponse(java.util.List.of());
        }
    }
}
