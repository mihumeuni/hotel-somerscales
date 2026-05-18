package integrations.cloudbeds.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Shape of the POST {base}/oauth/access_token response per Cloudbeds API v1.2.
 * Unknown properties (e.g. refresh_token, scope echo) are ignored to insulate
 * us from server-side additions.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record CloudbedsTokenResponse(
        @JsonProperty("access_token") String accessToken,
        @JsonProperty("token_type") String tokenType,
        @JsonProperty("expires_in") long expiresIn) {
}
