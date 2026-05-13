package integrations.google.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * One review entry from the Places API (New) reviews array.
 * 'name' is the resource path (places/X/reviews/Y) we use as externalId.
 * 'text' is wrapped in a localized object; we flatten via accessor below.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record PlaceReview(
        String name,
        Integer rating,
        LocalizedText text,
        LocalizedText originalText,
        AuthorAttribution authorAttribution,
        String publishTime
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record LocalizedText(String text, String languageCode) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record AuthorAttribution(String displayName, String uri) {}
}
