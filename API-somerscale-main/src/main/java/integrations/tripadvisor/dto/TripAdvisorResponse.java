package integrations.tripadvisor.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/**
 * Top-level shape of GET /api/v1/location/{id}/reviews on the
 * TripAdvisor Content API. We only consume the {@code data} array;
 * paging and other fields are ignored so TripAdvisor additions do not
 * break us.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record TripAdvisorResponse(List<TripAdvisorReview> data) {

    public List<TripAdvisorReview> data() {
        return data == null ? List.of() : data;
    }
}
