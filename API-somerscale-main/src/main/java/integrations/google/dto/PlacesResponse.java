package integrations.google.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/**
 * Top-level shape of GET /v1/places/{placeId}?fields=reviews on the
 * Places API (New). Only the reviews array is meaningful for this sync;
 * everything else is ignored so future Google additions do not break us.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record PlacesResponse(List<PlaceReview> reviews) {

    public List<PlaceReview> reviews() {
        return reviews == null ? List.of() : reviews;
    }
}
