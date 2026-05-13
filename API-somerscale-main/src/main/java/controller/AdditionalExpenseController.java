package controller;

import dto.AdditionalExpenseDTO;
import lombok.RequiredArgsConstructor;
import model.AdditionalExpenseModel;
import model.ReservaModel;
import model.UsuarioModel;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import service.AdditionalExpenseService;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class AdditionalExpenseController {

    private final AdditionalExpenseService expenseService;

    @GetMapping("/api/reservas/{reservaId}/expenses")
    @PreAuthorize("hasAuthority('expense.read')")
    public Map<String, Object> list(@PathVariable Long reservaId) {
        List<AdditionalExpenseDTO> items = expenseService.listByReserva(reservaId).stream()
                .map(this::toDto)
                .toList();
        Map<String, BigDecimal> totals = expenseService.sumByReserva(reservaId);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("reservaId", reservaId);
        body.put("items", items);
        body.put("totals", totals);
        return body;
    }

    @PostMapping("/api/reservas/{reservaId}/expenses")
    @PreAuthorize("hasAuthority('expense.write')")
    public AdditionalExpenseDTO create(@PathVariable Long reservaId,
                                       @RequestBody AdditionalExpenseDTO dto,
                                       Authentication auth) {
        AdditionalExpenseModel entity = AdditionalExpenseModel.builder()
                .concepto(dto.getConcepto())
                .monto(dto.getMonto())
                .moneda(dto.getMoneda())
                .fecha(dto.getFecha())
                .notas(dto.getNotas())
                .build();
        String username = auth != null ? auth.getName() : null;
        return toDto(expenseService.create(reservaId, entity, username));
    }

    @DeleteMapping("/api/expenses/{id}")
    @PreAuthorize("hasAuthority('expense.write')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        expenseService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private AdditionalExpenseDTO toDto(AdditionalExpenseModel m) {
        ReservaModel r = m.getReserva();
        UsuarioModel u = m.getCreadoPor();
        return AdditionalExpenseDTO.builder()
                .id(m.getId())
                .reservaId(r != null ? r.getId() : null)
                .concepto(m.getConcepto())
                .monto(m.getMonto())
                .moneda(m.getMoneda())
                .fecha(m.getFecha())
                .createdById(u != null ? u.getId() : null)
                .createdByUsername(u != null ? u.getUsername() : null)
                .notas(m.getNotas())
                .build();
    }
}
