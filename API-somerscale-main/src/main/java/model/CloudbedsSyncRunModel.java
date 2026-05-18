package model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "cloudbeds_sync_runs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CloudbedsSyncRunModel {

    public enum SyncMode { FULL, INCREMENTAL }
    public enum SyncStatus { RUNNING, SUCCESS, FAILED }
    public enum TriggerSource { MANUAL, SCHEDULED, STARTUP }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "finished_at")
    private Instant finishedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private SyncMode mode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private SyncStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "trigger_source", nullable = false, length = 16)
    private TriggerSource triggerSource;

    @Column(name = "guests_upserted", nullable = false)
    @Builder.Default
    private Integer guestsUpserted = 0;

    @Column(name = "reservations_upserted", nullable = false)
    @Builder.Default
    private Integer reservationsUpserted = 0;

    @Column(name = "expenses_upserted", nullable = false)
    @Builder.Default
    private Integer expensesUpserted = 0;

    @Column(columnDefinition = "TEXT")
    private String error;
}
