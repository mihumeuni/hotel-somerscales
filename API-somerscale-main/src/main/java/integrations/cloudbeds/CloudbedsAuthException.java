package integrations.cloudbeds;

/**
 * Thrown when the live Cloudbeds API rejects the client credentials or returns
 * an unrecoverable 401. {@link LiveCloudbedsApiClient} attempts a single token
 * refresh + retry before propagating this; the sync worker captures the
 * message in {@code cloudbeds_sync_runs.error} and ends the run as FAILED.
 */
public class CloudbedsAuthException extends RuntimeException {

    public CloudbedsAuthException(String message) {
        super(message);
    }

    public CloudbedsAuthException(String message, Throwable cause) {
        super(message, cause);
    }
}
