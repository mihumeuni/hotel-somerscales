package controller;

import dto.FichaQuickpickDTO;
import dto.FichaQuickpickUpsertRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import service.FichaQuickpickService;

import java.util.List;

@RestController
@RequestMapping("/api/sheet-quickpicks")
@RequiredArgsConstructor
public class FichaQuickpickController {

    private final FichaQuickpickService service;

    @GetMapping
    public List<FichaQuickpickDTO> list() {
        return service.list();
    }

    @GetMapping("/labels")
    public List<String> labels() {
        return service.labels();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('category.manage')")
    public ResponseEntity<FichaQuickpickDTO> create(@Valid @RequestBody FichaQuickpickUpsertRequest req) {
        return ResponseEntity.status(201).body(service.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('category.manage')")
    public FichaQuickpickDTO update(@PathVariable Long id,
                                    @Valid @RequestBody FichaQuickpickUpsertRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('category.manage')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
