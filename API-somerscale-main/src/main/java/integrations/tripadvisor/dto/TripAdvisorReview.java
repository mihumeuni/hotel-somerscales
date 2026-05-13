package integrations.tripadvisor.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * One review entry from the TripAdvisor Content API
 * {@code /location/{id}/reviews} payload. The numeric {@code id} is
 * used as externalId for the {@code reviews} table.
 * <p>
 * {@code text} carries the body; {@code title} prefixes it when we
 * persist so the dashboard can show the heading users typed on
 * TripAdvisor.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record TripAdvisorReview(
        Long id,
        String lang,
        @JsonProperty("published_date") String publishedDate,
        Integer rating,
        String title,
        String text,
        User user
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record User(String username) {}
}
