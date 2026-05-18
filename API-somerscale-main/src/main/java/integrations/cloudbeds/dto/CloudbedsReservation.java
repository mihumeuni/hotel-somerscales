package integrations.cloudbeds.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;

/**
 * A single Cloudbeds reservation row as returned by GET {base}/getReservations.
 *
 * <p>Field names are best-effort against the public docs
 * (<a href="https://hotels.cloudbeds.com/api/v1.2/docs/">v1.2</a>) — unknown
 * properties are ignored, missing properties deserialize as null. Either is
 * tolerated downstream by {@code ExcelRowImporter} which only requires
 * {@code reservationID}, {@code guestName}, and the start/end dates.</p>
 *
 * <p>Any field rename on the Cloudbeds side is a one-line patch on the
 * {@code @JsonProperty} below.</p>
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record CloudbedsReservation(
        @JsonProperty("reservationID")              String reservationId,
        @JsonProperty("thirdPartyIdentifier")       String thirdPartyIdentifier,
        @JsonProperty("guestID")                    String guestId,
        @JsonProperty("guestName")                  String guestName,
        @JsonProperty("guestEmail")                 String guestEmail,
        @JsonProperty("guestPhone")                 String guestPhone,
        @JsonProperty("guestCountry")               String guestCountry,
        @JsonProperty("guestDocumentType")          String guestDocumentType,
        @JsonProperty("guestDocumentNumber")        String guestDocumentNumber,
        @JsonProperty("startDate")                  String startDate,
        @JsonProperty("endDate")                    String endDate,
        @JsonProperty("nights")                     Integer nights,
        @JsonProperty("adults")                     Integer adults,
        @JsonProperty("kids")                       Integer kids,
        @JsonProperty("roomName")                   String roomName,
        @JsonProperty("roomTypeName")               String roomTypeName,
        @JsonProperty("estimatedArrivalTime")       String estimatedArrivalTime,
        @JsonProperty("sourceName")                 String sourceName,
        @JsonProperty("status")                     String status,
        @JsonProperty("guestStatus")                String guestStatus,
        @JsonProperty("dateCreated")                String dateCreated,
        @JsonProperty("dateCancelled")              String dateCancelled,
        @JsonProperty("total")                      BigDecimal total,
        @JsonProperty("paid")                       BigDecimal paid,
        @JsonProperty("balance")                    BigDecimal balance,
        @JsonProperty("deposit")                    BigDecimal deposit,
        @JsonProperty("productsTotal")              BigDecimal productsTotal,
        @JsonProperty("cancellationFee")            BigDecimal cancellationFee,
        @JsonProperty("creditCardType")             String creditCardType) {
}
