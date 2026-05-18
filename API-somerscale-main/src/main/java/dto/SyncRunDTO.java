package dto;

import lombok.Builder;
import lombok.Value;
import model.CloudbedsSyncRunModel;

import java.time.Instant;

@Value
@Builder
public class SyncRunDTO {
    Long id;
    Instant startedAt;
    Instant finishedAt;
    String mode;
    String status;
    String triggerSource;
    Integer guestsUpserted;
    Integer reservationsUpserted;
    Integer expensesUpserted;
    String error;

    public static SyncRunDTO of(CloudbedsSyncRunModel run) {
        return SyncRunDTO.builder()
                .id(run.getId())
                .startedAt(run.getStartedAt())
                .finishedAt(run.getFinishedAt())
                .mode(run.getMode().name())
                .status(run.getStatus().name())
                .triggerSource(run.getTriggerSource().name())
                .guestsUpserted(run.getGuestsUpserted())
                .reservationsUpserted(run.getReservationsUpserted())
                .expensesUpserted(run.getExpensesUpserted())
                .error(run.getError())
                .build();
    }
}
