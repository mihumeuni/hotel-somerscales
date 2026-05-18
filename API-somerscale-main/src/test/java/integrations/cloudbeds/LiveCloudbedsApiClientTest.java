package integrations.cloudbeds;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import service.cloudbeds.CloudbedsRow;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.ExpectedCount.never;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;

/**
 * Verifies the live Cloudbeds adapter against a {@link MockRestServiceServer}
 * bound to the {@link RestClient.Builder} the SUT consumes. Covers the
 * speculative-build contract described in {@code docs/plan/task033.md}:
 * paginated /getReservations, OAuth2 token caching, 401-then-refresh retry,
 * empty payload short-circuit, and the no-network safety net when
 * {@code propertyID} is blank.
 */
class LiveCloudbedsApiClientTest {

    private static final String BASE_URL = "https://hotels.cloudbeds.com/api/v1.2";
    private static final String TOKEN_URL = BASE_URL + "/oauth/access_token";

    private RestClient.Builder restClientBuilder;
    private MockRestServiceServer server;

    @BeforeEach
    void setUp() {
        restClientBuilder = RestClient.builder();
        server = MockRestServiceServer.bindTo(restClientBuilder).build();
    }

    private LiveCloudbedsApiClient newClient(int pageSize, String propertyId) {
        return new LiveCloudbedsApiClient(
                restClientBuilder,
                "test-client-id",
                "test-secret",
                propertyId,
                BASE_URL,
                "",                       // tokenUrlOverride: derive from base
                "read:reservation",
                pageSize);
    }

    private LiveCloudbedsApiClient newClient(int pageSize) {
        return newClient(pageSize, "12345");
    }

    @Test
    void fetchReservations_happyPath_returnsRowsAndAuthenticatesOnce() {
        server.expect(once(), requestTo(TOKEN_URL))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess(tokenJson("first-token", 3600), MediaType.APPLICATION_JSON));
        server.expect(once(),
                        requestTo(BASE_URL + "/getReservations?propertyID=12345&pageSize=100&pageNumber=1"))
                .andExpect(method(HttpMethod.GET))
                .andExpect(header(HttpHeaders.AUTHORIZATION, "Bearer first-token"))
                .andRespond(withSuccess(reservationsJson(1), MediaType.APPLICATION_JSON));

        List<CloudbedsRow> rows = newClient(100).fetchReservations(null);

        assertThat(rows).hasSize(1);
        CloudbedsRow only = rows.get(0);
        assertThat(only.getNumeroReservaCloudbeds()).isEqualTo("RES-1");
        assertThat(only.getNombre()).isEqualTo("Ada Lovelace");
        assertThat(only.getEmail()).isEqualTo("ada@example.com");
        assertThat(only.getFechaLlegada()).isEqualTo(LocalDate.parse("2026-05-20"));
        assertThat(only.getSalida()).isEqualTo(LocalDate.parse("2026-05-22"));
        assertThat(only.getFuenteNormalizada()).isEqualTo("BOOKING");
        server.verify();
    }

    @Test
    void fetchReservations_refreshesTokenAndRetriesOnceOn401() {
        server.expect(once(), requestTo(TOKEN_URL))
                .andRespond(withSuccess(tokenJson("stale-token", 3600), MediaType.APPLICATION_JSON));
        server.expect(once(),
                        requestTo(BASE_URL + "/getReservations?propertyID=12345&pageSize=100&pageNumber=1"))
                .andExpect(header(HttpHeaders.AUTHORIZATION, "Bearer stale-token"))
                .andRespond(withStatus(HttpStatus.UNAUTHORIZED));
        server.expect(once(), requestTo(TOKEN_URL))
                .andRespond(withSuccess(tokenJson("fresh-token", 3600), MediaType.APPLICATION_JSON));
        server.expect(once(),
                        requestTo(BASE_URL + "/getReservations?propertyID=12345&pageSize=100&pageNumber=1"))
                .andExpect(header(HttpHeaders.AUTHORIZATION, "Bearer fresh-token"))
                .andRespond(withSuccess(reservationsJson(1), MediaType.APPLICATION_JSON));

        List<CloudbedsRow> rows = newClient(100).fetchReservations(null);

        assertThat(rows).hasSize(1);
        server.verify();
    }

    @Test
    void fetchReservations_propagatesAuthExceptionWhenRefreshAlsoReturns401() {
        server.expect(once(), requestTo(TOKEN_URL))
                .andRespond(withSuccess(tokenJson("stale-token", 3600), MediaType.APPLICATION_JSON));
        server.expect(once(),
                        requestTo(BASE_URL + "/getReservations?propertyID=12345&pageSize=100&pageNumber=1"))
                .andRespond(withStatus(HttpStatus.UNAUTHORIZED));
        server.expect(once(), requestTo(TOKEN_URL))
                .andRespond(withSuccess(tokenJson("still-stale", 3600), MediaType.APPLICATION_JSON));
        server.expect(once(),
                        requestTo(BASE_URL + "/getReservations?propertyID=12345&pageSize=100&pageNumber=1"))
                .andRespond(withStatus(HttpStatus.UNAUTHORIZED));

        assertThatThrownBy(() -> newClient(100).fetchReservations(null))
                .isInstanceOf(CloudbedsAuthException.class);
        server.verify();
    }

    @Test
    void fetchReservations_emptyDataReturnsEmptyListWithoutCrashing() {
        server.expect(once(), requestTo(TOKEN_URL))
                .andRespond(withSuccess(tokenJson("tok", 3600), MediaType.APPLICATION_JSON));
        server.expect(once(),
                        requestTo(BASE_URL + "/getReservations?propertyID=12345&pageSize=100&pageNumber=1"))
                .andRespond(withSuccess(
                        "{\"success\":true,\"count\":0,\"total\":0,\"data\":[]}",
                        MediaType.APPLICATION_JSON));

        List<CloudbedsRow> rows = newClient(100).fetchReservations(null);

        assertThat(rows).isEmpty();
        server.verify();
    }

    @Test
    void fetchReservations_paginationStopsWhenBatchSmallerThanPageSize() {
        server.expect(once(), requestTo(TOKEN_URL))
                .andRespond(withSuccess(tokenJson("tok", 3600), MediaType.APPLICATION_JSON));
        server.expect(once(),
                        requestTo(BASE_URL + "/getReservations?propertyID=12345&pageSize=2&pageNumber=1"))
                .andRespond(withSuccess(reservationsJson(2), MediaType.APPLICATION_JSON));
        server.expect(once(),
                        requestTo(BASE_URL + "/getReservations?propertyID=12345&pageSize=2&pageNumber=2"))
                .andRespond(withSuccess(reservationsJson(1), MediaType.APPLICATION_JSON));

        List<CloudbedsRow> rows = newClient(2).fetchReservations(null);

        assertThat(rows).hasSize(3);
        assertThat(rows).extracting(CloudbedsRow::getNumeroReservaCloudbeds)
                .containsExactly("RES-1", "RES-2", "RES-1");
        server.verify();
    }

    @Test
    void fetchReservations_includesModifiedFromWhenUpdatedSinceProvided() {
        server.expect(once(), requestTo(TOKEN_URL))
                .andRespond(withSuccess(tokenJson("tok", 3600), MediaType.APPLICATION_JSON));
        server.expect(once(),
                        requestTo(BASE_URL
                                + "/getReservations?propertyID=12345&pageSize=100&pageNumber=1&modifiedFrom=2026-05-01"))
                .andRespond(withSuccess(reservationsJson(1), MediaType.APPLICATION_JSON));

        List<CloudbedsRow> rows = newClient(100).fetchReservations(LocalDate.parse("2026-05-01"));

        assertThat(rows).hasSize(1);
        server.verify();
    }

    @Test
    void fetchReservations_skipsAllHttpWhenPropertyIdBlank() {
        server.expect(never(), requestTo(TOKEN_URL));

        List<CloudbedsRow> rows = newClient(100, "").fetchReservations(null);

        assertThat(rows).isEmpty();
        server.verify();
    }

    @Test
    void isLive_returnsTrueRegardlessOfState() {
        assertThat(newClient(100).isLive()).isTrue();
    }

    private static String tokenJson(String token, long expiresIn) {
        return "{\"access_token\":\"" + token
                + "\",\"token_type\":\"Bearer\",\"expires_in\":" + expiresIn + "}";
    }

    /** Synthesize a Cloudbeds-shaped payload with {@code n} sequential reservations. */
    private static String reservationsJson(int n) {
        StringBuilder sb = new StringBuilder("{\"success\":true,\"count\":")
                .append(n).append(",\"total\":").append(n).append(",\"data\":[");
        for (int i = 1; i <= n; i++) {
            if (i > 1) sb.append(',');
            sb.append("{")
              .append("\"reservationID\":\"RES-").append(i).append("\",")
              .append("\"guestID\":\"GST-").append(i).append("\",")
              .append("\"guestName\":\"Ada Lovelace\",")
              .append("\"guestEmail\":\"ada@example.com\",")
              .append("\"guestPhone\":\"+56 9 1111 2222\",")
              .append("\"guestCountry\":\"CL\",")
              .append("\"guestDocumentType\":\"Pasaporte\",")
              .append("\"guestDocumentNumber\":\"P12345678\",")
              .append("\"startDate\":\"2026-05-20\",")
              .append("\"endDate\":\"2026-05-22\",")
              .append("\"nights\":2,")
              .append("\"adults\":2,")
              .append("\"kids\":0,")
              .append("\"roomName\":\"101\",")
              .append("\"roomTypeName\":\"Doble Estandar\",")
              .append("\"sourceName\":\"Booking.com\",")
              .append("\"status\":\"confirmed\",")
              .append("\"guestStatus\":\"checked_in\",")
              .append("\"dateCreated\":\"2026-05-01\",")
              .append("\"total\":250.00,")
              .append("\"paid\":100.00,")
              .append("\"balance\":150.00")
              .append("}");
        }
        sb.append("]}");
        return sb.toString();
    }
}
