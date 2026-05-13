package integrations.tripadvisor;

import com.fasterxml.jackson.databind.ObjectMapper;
import integrations.tripadvisor.dto.TripAdvisorResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Fetches the reviews payload for the configured TripAdvisor
 * {@code location_id}.
 * <p>
 * Two modes — mirrors {@code GooglePlacesClient}:
 * <ol>
 *   <li><b>Live</b> — {@code integrations.tripadvisor.api-key} and
 *       {@code location-id} are set: hits
 *       {@code GET api/v1/location/{id}/reviews?key=...&language=...}
 *       on {@code api.content.tripadvisor.com}.</li>
 *   <li><b>Fixture</b> — api-key is blank: reads
 *       {@code {fixture-dir}/tripadvisor-{lang}.json}. The MVP demo
 *       mode while we wait for free-tier approval.</li>
 * </ol>
 * Either mode returns the same {@link TripAdvisorResponse} shape so
 * the sync service is mode-agnostic.
 */
@Slf4j
@Component
public class TripAdvisorClient {

    private static final String BASE_URL = "https://api.content.tripadvisor.com";

    private final String apiKey;
    private final String locationId;
    private final Path fixtureDir;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public TripAdvisorClient(
            @Value("${integrations.tripadvisor.api-key:}") String apiKey,
            @Value("${integrations.tripadvisor.location-id:}") String locationId,
            @Value("${integrations.tripadvisor.fixture-dir:../tests}") String fixtureDir) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.locationId = locationId == null ? "" : locationId.trim();
        this.fixtureDir = Path.of(fixtureDir);
        // Local instance: Spring Boot 4.0.6 webmvc starter does not auto-
        // register an ObjectMapper bean by default. Fixture parsing has no
        // need for the app's serialization config anyway.
        this.objectMapper = new ObjectMapper();
        this.restClient = RestClient.builder().baseUrl(BASE_URL).build();
    }

    public boolean isLiveMode() {
        return !apiKey.isBlank() && !locationId.isBlank();
    }

    /**
     * Returns the reviews payload for a given language. Never throws on
     * fixture-not-found in demo mode — returns an empty response so the
     * sync logs a zero count and moves on.
     */
    public TripAdvisorResponse fetchReviews(String languageCode) {
        if (isLiveMode()) {
            return fetchLive(languageCode);
        }
        return fetchFixture(languageCode);
    }

    private TripAdvisorResponse fetchLive(String languageCode) {
        String uri = "/api/v1/location/" + locationId + "/reviews"
                + "?key=" + apiKey
                + "&language=" + languageCode;
        log.debug("[TripAdvisorClient] live fetch lang={} location={}",
                languageCode, locationId);
        TripAdvisorResponse response = restClient.get()
                .uri(uri)
                .header("Accept", "application/json")
                .retrieve()
                .body(TripAdvisorResponse.class);
        return response == null ? new TripAdvisorResponse(java.util.List.of()) : response;
    }

    private TripAdvisorResponse fetchFixture(String languageCode) {
        Path fixture = fixtureDir.resolve("tripadvisor-" + languageCode + ".json");
        if (!Files.exists(fixture)) {
            log.warn("[TripAdvisorClient] fixture missing lang={} path={}",
                    languageCode, fixture.toAbsolutePath());
            return new TripAdvisorResponse(java.util.List.of());
        }
        try {
            log.debug("[TripAdvisorClient] fixture fetch lang={} path={}",
                    languageCode, fixture);
            return objectMapper.readValue(fixture.toFile(), TripAdvisorResponse.class);
        } catch (IOException e) {
            log.error("[TripAdvisorClient] fixture parse failed lang={} path={}: {}",
                    languageCode, fixture, e.getMessage());
            return new TripAdvisorResponse(java.util.List.of());
        }
    }
}
