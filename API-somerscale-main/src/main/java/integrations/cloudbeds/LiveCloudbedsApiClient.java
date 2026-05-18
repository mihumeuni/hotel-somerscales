package integrations.cloudbeds;

import integrations.cloudbeds.dto.CloudbedsReservation;
import integrations.cloudbeds.dto.CloudbedsReservationsResponse;
import integrations.cloudbeds.dto.CloudbedsTokenResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import service.cloudbeds.CloudbedsParsers;
import service.cloudbeds.CloudbedsRow;

import java.math.BigDecimal;
import java.net.URI;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Production swap-in for {@link MockCloudbedsApiClient}. Authenticates against
 * the Cloudbeds OAuth2 client-credentials endpoint and fetches reservations
 * page-by-page from {@code GET /getReservations} (v1.2 public API), translating
 * each JSON row into the {@link CloudbedsRow} contract the rest of the sync
 * pipeline already understands.
 *
 * <p>Activates automatically when {@code CLOUDBEDS_CLIENT_ID} is non-empty; the
 * inverse condition disables {@link MockCloudbedsApiClient} so the
 * {@link CloudbedsApiClient}-typed autowire in
 * {@link service.cloudbeds.CloudbedsSyncWorker} stays single-bean.</p>
 *
 * <p>Speculative build (task033): JSON field names target the published
 * docs. Any drift surfaces as null fields on the {@link CloudbedsRow}, which
 * the importer tolerates, and is fixed by patching {@link integrations.cloudbeds.dto.CloudbedsReservation}.</p>
 */
@Slf4j
@Component
@ConditionalOnExpression("!'${integrations.cloudbeds.client-id:}'.isEmpty()")
public class LiveCloudbedsApiClient implements CloudbedsApiClient {

    private static final DateTimeFormatter ISO_DATE = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final long TOKEN_REFRESH_MARGIN_SECONDS = 60L;

    private final RestClient http;
    private final String clientId;
    private final String clientSecret;
    private final String propertyId;
    private final String scope;
    private final URI tokenUri;
    private final int pageSize;

    private volatile String cachedToken;
    private volatile Instant tokenExpiresAt = Instant.EPOCH;

    public LiveCloudbedsApiClient(
            RestClient.Builder builder,
            @Value("${integrations.cloudbeds.client-id}") String clientId,
            @Value("${integrations.cloudbeds.client-secret:}") String clientSecret,
            @Value("${integrations.cloudbeds.property-id:}") String propertyId,
            @Value("${integrations.cloudbeds.base-url}") String baseUrl,
            @Value("${integrations.cloudbeds.token-url:}") String tokenUrlOverride,
            @Value("${integrations.cloudbeds.scope:read:reservation read:guest}") String scope,
            @Value("${integrations.cloudbeds.page-size:100}") int pageSize) {
        this.http = builder.baseUrl(baseUrl).build();
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.propertyId = propertyId;
        this.scope = scope;
        this.pageSize = pageSize <= 0 ? 100 : pageSize;
        String resolvedTokenUrl = (tokenUrlOverride == null || tokenUrlOverride.isBlank())
                ? trimTrailingSlash(baseUrl) + "/oauth/access_token"
                : tokenUrlOverride;
        this.tokenUri = URI.create(resolvedTokenUrl);
        log.info("[LiveCloudbedsApiClient] initialised: base={} tokenUrl={} propertyId-set={} pageSize={}",
                 baseUrl, resolvedTokenUrl, !propertyId.isBlank(), this.pageSize);
    }

    @Override
    public boolean isLive() {
        return true;
    }

    @Override
    public List<CloudbedsRow> fetchReservations(LocalDate updatedSince) {
        if (propertyId == null || propertyId.isBlank()) {
            log.warn("[LiveCloudbedsApiClient] CLOUDBEDS_PROPERTY_ID is blank; skipping fetch. " +
                     "Set the env var to enable the live sync.");
            return List.of();
        }
        List<CloudbedsRow> all = new ArrayList<>();
        int page = 1;
        while (true) {
            List<CloudbedsReservation> batch = fetchPage(page, updatedSince);
            for (CloudbedsReservation reservation : batch) {
                CloudbedsRow row = toRow(reservation, all.size() + 1);
                if (row.getNumeroReservaCloudbeds() == null) continue;
                all.add(row);
            }
            if (batch.size() < pageSize) break;
            page++;
        }
        log.info("[LiveCloudbedsApiClient] fetched {} reservations across {} page(s); updatedSince={}",
                 all.size(), page, updatedSince);
        return all;
    }

    private List<CloudbedsReservation> fetchPage(int page, LocalDate updatedSince) {
        try {
            return requestPage(page, updatedSince, accessToken(false));
        } catch (CloudbedsAuthException retryable) {
            log.info("[LiveCloudbedsApiClient] 401 on page {}; refreshing token + retrying once", page);
            try {
                return requestPage(page, updatedSince, accessToken(true));
            } catch (CloudbedsAuthException terminal) {
                throw terminal;
            }
        }
    }

    private List<CloudbedsReservation> requestPage(int page, LocalDate updatedSince, String token) {
        try {
            CloudbedsReservationsResponse resp = http.get()
                    .uri(uriBuilder -> {
                        uriBuilder
                                .path("/getReservations")
                                .queryParam("propertyID", propertyId)
                                .queryParam("pageSize", pageSize)
                                .queryParam("pageNumber", page);
                        if (updatedSince != null) {
                            uriBuilder.queryParam("modifiedFrom", updatedSince.format(ISO_DATE));
                        }
                        return uriBuilder.build();
                    })
                    .header("Authorization", "Bearer " + token)
                    .retrieve()
                    .onStatus(status -> status.value() == 401,
                            (req, res) -> { throw new CloudbedsAuthException(
                                    "Cloudbeds /getReservations returned 401 on page " + page); })
                    .body(CloudbedsReservationsResponse.class);
            if (resp == null || resp.data() == null) return List.of();
            return resp.data();
        } catch (CloudbedsAuthException auth) {
            throw auth;
        } catch (RestClientException transientFailure) {
            log.warn("[LiveCloudbedsApiClient] page {} dropped (will end pagination): {}",
                     page, transientFailure.getMessage());
            return List.of();
        }
    }

    private synchronized String accessToken(boolean forceRefresh) {
        if (!forceRefresh
                && cachedToken != null
                && Instant.now().isBefore(tokenExpiresAt.minusSeconds(TOKEN_REFRESH_MARGIN_SECONDS))) {
            return cachedToken;
        }
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "client_credentials");
        form.add("client_id", clientId);
        form.add("client_secret", clientSecret);
        if (scope != null && !scope.isBlank()) {
            form.add("scope", scope);
        }
        try {
            CloudbedsTokenResponse resp = http.post()
                    .uri(tokenUri)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .onStatus(status -> status.isError(),
                            (req, res) -> { throw new CloudbedsAuthException(
                                    "Cloudbeds token endpoint returned " + res.getStatusCode()); })
                    .body(CloudbedsTokenResponse.class);
            if (resp == null || resp.accessToken() == null) {
                throw new CloudbedsAuthException("Cloudbeds token endpoint returned empty body");
            }
            cachedToken = resp.accessToken();
            long ttl = resp.expiresIn() > 0 ? resp.expiresIn() : 3600L;
            tokenExpiresAt = Instant.now().plusSeconds(ttl);
            log.info("[LiveCloudbedsApiClient] token acquired; expires in {}s", ttl);
            return cachedToken;
        } catch (CloudbedsAuthException auth) {
            throw auth;
        } catch (RestClientException e) {
            throw new CloudbedsAuthException("Cloudbeds token fetch failed: " + e.getMessage(), e);
        }
    }

    private CloudbedsRow toRow(CloudbedsReservation r, int rowNum) {
        String fuenteRaw = CloudbedsParsers.trimToNull(r.sourceName());
        String phone = CloudbedsParsers.trimToNull(r.guestPhone());
        return CloudbedsRow.builder()
                .rowNumber(rowNum)
                .nombre(CloudbedsParsers.trimToNull(r.guestName()))
                .email(CloudbedsParsers.trimToNull(r.guestEmail()))
                .telefono(phone)
                .movil(phone)
                .tipoDocumento(CloudbedsParsers.normalizeTipoDocumento(r.guestDocumentType()))
                .numeroDocumento(CloudbedsParsers.trimToNull(r.guestDocumentNumber()))
                .numeroReservaCloudbeds(CloudbedsParsers.trimToNull(r.reservationId()))
                .numeroConfirmacionTerceros(CloudbedsParsers.trimToNull(r.thirdPartyIdentifier()))
                .fechaLlegada(parseIsoDate(r.startDate()))
                .salida(parseIsoDate(r.endDate()))
                .noches(r.nights())
                .adultos(r.adults())
                .ninos(r.kids())
                .numeroHabitacion(CloudbedsParsers.trimToNull(r.roomName()))
                .categoriaHabitacion(CloudbedsParsers.trimToNull(r.roomTypeName()))
                .planComidas(null)
                .horaEstimadaLlegada(CloudbedsParsers.trimToNull(r.estimatedArrivalTime()))
                .fuenteRaw(fuenteRaw)
                .fuenteNormalizada(CloudbedsParsers.normalizeFuente(fuenteRaw))
                .estadoReserva(CloudbedsParsers.trimToNull(r.status()))
                .estadoHuesped(CloudbedsParsers.trimToNull(r.guestStatus()))
                .pais(CloudbedsParsers.trimToNull(r.guestCountry()))
                .procedencia(fuenteRaw)
                .fechaReserva(parseIsoDate(r.dateCreated()))
                .fechaCancelacion(parseIsoDate(r.dateCancelled()))
                .montoTotal(nullSafe(r.total()))
                .montoPagado(nullSafe(r.paid()))
                .saldoPendiente(nullSafe(r.balance()))
                .deposito(nullSafe(r.deposit()))
                .productosMonto(nullSafe(r.productsTotal()))
                .tarifaCancelacion(nullSafe(r.cancellationFee()))
                .tipoTarjetaCredito(CloudbedsParsers.trimToNull(r.creditCardType()))
                .build();
    }

    private static LocalDate parseIsoDate(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return LocalDate.parse(raw.length() >= 10 ? raw.substring(0, 10) : raw, ISO_DATE);
        } catch (Exception e) {
            return null;
        }
    }

    private static BigDecimal nullSafe(BigDecimal v) {
        return v;
    }

    private static String trimTrailingSlash(String s) {
        if (s == null) return "";
        return s.endsWith("/") ? s.substring(0, s.length() - 1) : s;
    }
}
