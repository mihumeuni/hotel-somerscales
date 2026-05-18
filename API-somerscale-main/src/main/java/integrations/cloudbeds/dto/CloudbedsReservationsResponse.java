package integrations.cloudbeds.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/**
 * Envelope for GET {base}/getReservations per Cloudbeds API v1.2.
 * {@code data} may be null when the response indicates failure; treat it as
 * an empty list at the call site.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record CloudbedsReservationsResponse(
        boolean success,
        int count,
        int total,
        List<CloudbedsReservation> data) {
}
