package service.cloudbeds;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import model.CloudbedsSyncRunModel;
import model.CloudbedsSyncRunModel.SyncMode;
import model.CloudbedsSyncRunModel.SyncStatus;
import model.CloudbedsSyncRunModel.TriggerSource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import repository.CloudbedsSyncRunRepository;

import java.time.Instant;

/**
 * Holds the transactional database operations used by the Cloudbeds sync.
 * Lives in its own bean so {@link CloudbedsSyncWorker} can invoke each method
 * through the Spring proxy — self-calls inside one bean silently bypass
 * {@code @Transactional}.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CloudbedsSyncTxOps {

    private final CloudbedsSyncRunRepository runRepository;

    @PersistenceContext
    private EntityManager em;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public CloudbedsSyncRunModel startRun(SyncMode mode, TriggerSource trigger) {
        CloudbedsSyncRunModel run = CloudbedsSyncRunModel.builder()
                .startedAt(Instant.now())
                .mode(mode)
                .status(SyncStatus.RUNNING)
                .triggerSource(trigger)
                .build();
        return runRepository.save(run);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void wipeAll() {
        em.createNativeQuery(
            "TRUNCATE TABLE additional_expenses, reserva_huespedes, reservas, huespedes RESTART IDENTITY CASCADE"
        ).executeUpdate();
        log.info("[CloudbedsSyncTxOps] wipeAll: huespedes/reservas/expenses truncated");
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void finishRun(Long runId, SyncStatus status, int guests, int reservations,
                          int expenses, String error) {
        runRepository.findById(runId).ifPresent(run -> {
            run.setStatus(status);
            run.setFinishedAt(Instant.now());
            run.setGuestsUpserted(guests);
            run.setReservationsUpserted(reservations);
            run.setExpensesUpserted(expenses);
            run.setError(error);
            runRepository.save(run);
        });
    }
}
