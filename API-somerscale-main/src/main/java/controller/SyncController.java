package controller;

import integrations.llm.LlmClassifierService;
import integrations.google.GoogleReviewSyncService;
import integrations.tripadvisor.TripAdvisorReviewSyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Admin-only triggers and status read for the daily review sync jobs.
 * <p>
 * Reuses the existing {@code user.manage} authority to avoid bloating the
 * permission catalog (see task011 plan step 7). If sync ever grows beyond
 * Google + TripAdvisor, split into its own {@code sync.run} permission.
 */
@RestController
@RequestMapping("/api/sync")
@RequiredArgsConstructor
public class SyncController {

    private final GoogleReviewSyncService googleSync;
    private final TripAdvisorReviewSyncService tripAdvisorSync;
    private final LlmClassifierService llmClassifier;

    @PostMapping("/google")
    @PreAuthorize("hasAuthority('user.manage')")
    public ResponseEntity<GoogleReviewSyncService.SyncResult> google() {
        return ResponseEntity.ok(googleSync.syncOnce());
    }

    @GetMapping("/google/status")
    @PreAuthorize("hasAuthority('user.manage')")
    public ResponseEntity<Object> googleStatus() {
        return googleSync.lastResult()
                .<ResponseEntity<Object>>map(ResponseEntity::ok)
                .orElseGet(() -> {
                    Map<String, Object> body = new LinkedHashMap<>();
                    body.put("lastRunAt", null);
                    body.put("mode", googleSync.isLiveMode() ? "live" : "fixture");
                    return ResponseEntity.ok(body);
                });
    }

    @PostMapping("/tripadvisor")
    @PreAuthorize("hasAuthority('user.manage')")
    public ResponseEntity<TripAdvisorReviewSyncService.SyncResult> tripadvisor() {
        return ResponseEntity.ok(tripAdvisorSync.syncOnce());
    }

    @GetMapping("/tripadvisor/status")
    @PreAuthorize("hasAuthority('user.manage')")
    public ResponseEntity<Object> tripadvisorStatus() {
        return tripAdvisorSync.lastResult()
                .<ResponseEntity<Object>>map(ResponseEntity::ok)
                .orElseGet(() -> {
                    Map<String, Object> body = new LinkedHashMap<>();
                    body.put("lastRunAt", null);
                    body.put("mode", tripAdvisorSync.isLiveMode() ? "live" : "fixture");
                    return ResponseEntity.ok(body);
                });
    }

    @PostMapping("/classify")
    @PreAuthorize("hasAuthority('user.manage')")
    public ResponseEntity<LlmClassifierService.ClassifyResult> classify() {
        return ResponseEntity.ok(llmClassifier.classifyOnce());
    }

    @GetMapping("/classify/status")
    @PreAuthorize("hasAuthority('user.manage')")
    public ResponseEntity<Object> classifyStatus() {
        return llmClassifier.lastResult()
                .<ResponseEntity<Object>>map(ResponseEntity::ok)
                .orElseGet(() -> {
                    Map<String, Object> body = new LinkedHashMap<>();
                    body.put("lastRunAt", null);
                    body.put("mode", llmClassifier.isLiveMode() ? "live" : "disabled");
                    return ResponseEntity.ok(body);
                });
    }
}
