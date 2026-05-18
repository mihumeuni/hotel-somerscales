package controller;

import dto.SyncRunDTO;
import lombok.RequiredArgsConstructor;
import model.CloudbedsSyncRunModel;
import model.CloudbedsSyncRunModel.SyncMode;
import model.CloudbedsSyncRunModel.TriggerSource;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import repository.CloudbedsSyncRunRepository;
import service.cloudbeds.CloudbedsSyncService;

import java.util.List;

@RestController
@RequestMapping("/api/sync/cloudbeds")
@RequiredArgsConstructor
public class CloudbedsSyncController {

    private final CloudbedsSyncService syncService;
    private final CloudbedsSyncRunRepository runRepository;

    @PostMapping
    @PreAuthorize("hasAuthority('category.manage')")
    public ResponseEntity<SyncRunDTO> trigger(
            @RequestParam(name = "mode", defaultValue = "INCREMENTAL") String mode) {
        SyncMode parsed;
        try {
            parsed = SyncMode.valueOf(mode.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
        CloudbedsSyncRunModel run = syncService.triggerSync(parsed, TriggerSource.MANUAL);
        return ResponseEntity.accepted().body(SyncRunDTO.of(run));
    }

    @GetMapping("/status")
    @PreAuthorize("hasAuthority('category.manage')")
    public List<SyncRunDTO> status() {
        return runRepository
                .findAllByOrderByStartedAtDesc(PageRequest.of(0, 10))
                .stream()
                .map(SyncRunDTO::of)
                .toList();
    }

    /**
     * Lightweight read used by the dashboard footer; returns only the most-recent
     * successful run's started-at so the calendar widget can render "Datos al …"
     * without leaking trigger source or row counts to non-admins.
     */
    @GetMapping("/last")
    public ResponseEntity<SyncRunDTO> last() {
        return runRepository
                .findFirstByStatusOrderByStartedAtDesc(CloudbedsSyncRunModel.SyncStatus.SUCCESS)
                .map(SyncRunDTO::of)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }
}
