package service.cloudbeds;

import integrations.cloudbeds.CloudbedsApiClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import model.CloudbedsSyncRunModel.SyncMode;
import model.CloudbedsSyncRunModel.SyncStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import repository.CloudbedsSyncRunRepository;
import service.ExcelRowImporter;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

/**
 * Performs a single Cloudbeds sync run end-to-end. All DB writes are delegated
 * to {@link CloudbedsSyncTxOps} so each transactional boundary goes through
 * the Spring proxy (self-calls inside the same bean would silently bypass it).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CloudbedsSyncWorker {

    private final CloudbedsApiClient apiClient;
    private final ExcelRowImporter rowImporter;
    private final CloudbedsSyncRunRepository runRepository;
    private final CloudbedsSyncTxOps txOps;

    @Async
    public void executeAsync(Long runId, SyncMode mode) {
        execute(runId, mode);
    }

    public void execute(Long runId, SyncMode mode) {
        try {
            int guests = 0;
            int reservations = 0;

            if (mode == SyncMode.FULL) {
                txOps.wipeAll();
            }

            LocalDate updatedSince = mode == SyncMode.INCREMENTAL
                    ? lastSuccessfulStart()
                    : null;
            List<CloudbedsRow> rows = apiClient.fetchReservations(updatedSince);

            for (CloudbedsRow row : rows) {
                try {
                    ExcelRowImporter.Outcome outcome = rowImporter.importOne(row);
                    if (outcome == ExcelRowImporter.Outcome.IMPORTED) {
                        reservations++;
                        guests++;
                    }
                } catch (Exception perRow) {
                    log.warn("[CloudbedsSyncWorker] row {} failed: {}",
                             row.getRowNumber(), perRow.getMessage());
                }
            }

            txOps.finishRun(runId, SyncStatus.SUCCESS, guests, reservations, 0, null);
            log.info("[CloudbedsSyncWorker] run {} finished: mode={} guests={} reservations={}",
                     runId, mode, guests, reservations);
        } catch (Exception e) {
            log.error("[CloudbedsSyncWorker] run {} failed: {}", runId, e.getMessage(), e);
            txOps.finishRun(runId, SyncStatus.FAILED, 0, 0, 0, e.getMessage());
        }
    }

    private LocalDate lastSuccessfulStart() {
        return runRepository.findFirstByStatusOrderByStartedAtDesc(SyncStatus.SUCCESS)
                .map(r -> r.getStartedAt().atZone(ZoneId.of("America/Santiago")).toLocalDate())
                .orElse(null);
    }
}
