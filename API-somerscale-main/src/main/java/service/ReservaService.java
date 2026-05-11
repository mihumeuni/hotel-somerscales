package service;

import model.ReservaModel;
import model.HuespedModel;
import repository.ReservaRepository;
import repository.HuespedRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReservaService {

    private final ReservaRepository reservaRepository;
    private final HuespedRepository huespedRepository;

    public List<ReservaModel> getAllReservas() {
        return reservaRepository.findAll();
    }

    public ReservaModel createReserva(ReservaModel reserva) {

        // Validación básica
        if (reserva.getFechaEntrada().isAfter(reserva.getFechaSalida())) {
            throw new RuntimeException("Fechas inválidas");
        }

        // Asegurar que los huéspedes existan
        List<HuespedModel> huesped = reserva.getHuespedes().stream()
                .map(h -> huespedRepository.findById(h.getId())
                        .orElseThrow(() -> new RuntimeException("Huésped no encontrado")))
                .toList();

        reserva.setHuespedes(huesped);

        return reservaRepository.save(reserva);
    }

    public ReservaModel getReservaById(Long id) {
        return reservaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));
    }
}