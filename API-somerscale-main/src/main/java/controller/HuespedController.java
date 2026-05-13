package controller;

import dto.GuestHistoryDTO;
import lombok.RequiredArgsConstructor;
import model.HuespedModel;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import service.HuespedService;

import java.util.List;

@RestController
@RequestMapping("/api/guests")
@RequiredArgsConstructor
public class HuespedController {

    private final HuespedService huespedService;

    @GetMapping
    @PreAuthorize("hasAuthority('guest.read')")
    public List<HuespedModel> getAllHuespedes() {
        return huespedService.getAllHuespedes();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('guest.read')")
    public HuespedModel getHuespedById(@PathVariable Long id) {
        return huespedService.getHuespedById(id);
    }

    @GetMapping("/{id}/historial")
    @PreAuthorize("hasAuthority('guest.read')")
    public GuestHistoryDTO getHistorial(@PathVariable Long id) {
        return huespedService.getHistorial(id);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('guest.write')")
    public HuespedModel createHuesped(@RequestBody HuespedModel huesped) {
        return huespedService.createHuesped(huesped);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('guest.write')")
    public HuespedModel updateHuesped(@PathVariable Long id, @RequestBody HuespedModel huesped) {
        return huespedService.updateHuesped(id, huesped);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('guest.delete')")
    public ResponseEntity<Void> deleteHuesped(@PathVariable Long id) {
        huespedService.deleteHuesped(id);
        return ResponseEntity.noContent().build();
    }
}
