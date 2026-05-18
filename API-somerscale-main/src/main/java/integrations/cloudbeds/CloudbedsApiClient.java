package integrations.cloudbeds;

import service.cloudbeds.CloudbedsRow;

import java.time.LocalDate;
import java.util.List;

/**
 * Cloudbeds PMS API client. The MVP wires a TSV-fixture-backed mock
 * ({@link MockCloudbedsApiClient}) because real client credentials are not yet
 * provisioned; {@link LiveCloudbedsApiClient} is a placeholder for post-MVP
 * OAuth2 client-credentials integration against us2.cloudbeds.com.
 */
public interface CloudbedsApiClient {

    /**
     * @param updatedSince when non-null, the live client filters to reservations
     *                     modified at-or-after this date; the mock returns the
     *                     full fixture either way.
     * @return one CloudbedsRow per reservation (each carries embedded guest data).
     */
    List<CloudbedsRow> fetchReservations(LocalDate updatedSince);

    /** Whether this client talks to a real Cloudbeds tenant. */
    boolean isLive();
}
