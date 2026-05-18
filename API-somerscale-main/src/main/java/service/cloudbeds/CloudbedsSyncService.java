package service.cloudbeds;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import model.CloudbedsSyncRunModel;
import model.CloudbedsSyncRunModel.SyncMode;
import model.CloudbedsSyncRunModel.TriggerSource;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import repository.HuespedRepository;

/**
 * Orchestrates Cloudbeds API → local DB syncs. Slim by design — the actual
 * transactional work lives in {@link CloudbedsSyncWorker} so the Spring proxy
 * is engaged on every internal call (self-calls would silently bypass
 * {@code @Async} and {@code @Transactional}).
 *
 * <p>FULL mode wipes huespedes/reservas/additional_expenses before reloading
 * (operator-confirmed behavior per task030.md). INCREMENTAL mode upserts via
 * the existing natural-key path in {@link service.ExcelRowImporter}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CloudbedsSyncService {

    private final CloudbedsSyncWorker worker;
    private final CloudbedsSyncTxOps txOps;
    private final HuespedRepository huespedRepository;

    /**
     * On cold start, if huespedes is empty seed it via a FULL mock sync so
     * dashboards aren't blank. No-op when data already exists.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void seedIfEmpty() {
        long existing = huespedRepository.count();
        if (existing > 0) {
            log.info("[CloudbedsSyncService] startup seed skipped: {} huespedes present",
                     existing);
            return;
        }
        log.info("[CloudbedsSyncService] startup seed: huespedes empty, kicking FULL sync");
        CloudbedsSyncRunModel run = txOps.startRun(SyncMode.FULL, TriggerSource.STARTUP);
        worker.executeAsync(run.getId(), SyncMode.FULL);
    }

    /** Sunday 03:00 America/Santiago — weekly incremental refresh per task030. */
    @Scheduled(cron = "0 0 3 ? * SUN", zone = "America/Santiago")
    public void scheduledSync() {
        log.info("[CloudbedsSyncService] cron sync starting (INCREMENTAL)");
        CloudbedsSyncRunModel run = txOps.startRun(SyncMode.INCREMENTAL, TriggerSource.SCHEDULED);
        worker.executeAsync(run.getId(), SyncMode.INCREMENTAL);
    }

    /**
     * Public entrypoint used by the admin controller. Returns immediately with
     * a run id while the worker grinds asynchronously; the FE polls the status
     * endpoint to detect completion.
     */
    public CloudbedsSyncRunModel triggerSync(SyncMode mode, TriggerSource trigger) {
        CloudbedsSyncRunModel run = txOps.startRun(mode, trigger);
        worker.executeAsync(run.getId(), mode);
        return run;
    }
}
