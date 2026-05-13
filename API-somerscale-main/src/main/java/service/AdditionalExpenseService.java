package service;

import lombok.RequiredArgsConstructor;
import model.AdditionalExpenseModel;
import model.ReservaModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import repository.AdditionalExpenseRepository;
import repository.ReservaRepository;
import repository.UsuarioRepository;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdditionalExpenseService {

    private final AdditionalExpenseRepository expenseRepository;
    private final ReservaRepository reservaRepository;
    private final UsuarioRepository usuarioRepository;

    public List<AdditionalExpenseModel> listByReserva(Long reservaId) {
        ensureReservaExists(reservaId);
        return expenseRepository.findByReservaIdOrderByFechaDesc(reservaId);
    }

    @Transactional
    public AdditionalExpenseModel create(Long reservaId, AdditionalExpenseModel input, String createdByUsername) {
        ReservaModel reserva = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));
        input.setReserva(reserva);
        if (createdByUsername != null) {
            usuarioRepository.findByUsername(createdByUsername).ifPresent(input::setCreadoPor);
        }
        return expenseRepository.save(input);
    }

    @Transactional
    public void delete(Long id) {
        if (!expenseRepository.existsById(id)) {
            throw new RuntimeException("Gasto no encontrado");
        }
        expenseRepository.deleteById(id);
    }

    public Map<String, BigDecimal> sumByReserva(Long reservaId) {
        Map<String, BigDecimal> totals = new LinkedHashMap<>();
        for (Object[] row : expenseRepository.sumByReservaIdGroupByMoneda(reservaId)) {
            totals.put((String) row[0], (BigDecimal) row[1]);
        }
        return totals;
    }

    private void ensureReservaExists(Long reservaId) {
        if (!reservaRepository.existsById(reservaId)) {
            throw new RuntimeException("Reserva no encontrada");
        }
    }
}
