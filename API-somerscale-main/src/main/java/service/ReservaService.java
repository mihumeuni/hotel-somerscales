package service;

import config.RoomNumberSerializer;
import dto.ReservaCalendarDTO;
import model.ReservaModel;
import model.HuespedModel;
import repository.ReservaRepository;
import repository.HuespedRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReservaService {

    private final ReservaRepository reservaRepository;
    private final HuespedRepository huespedRepository;

    public List<ReservaModel> getAllReservas() {
        return reservaRepository.findAll();
    }

    // Date-windowed feed for the room calendar. `from`/`to` are inclusive days;
    // `to` is expanded to its end-of-day so a same-day check-out still matches.
    // Returns a slim DTO (see ReservaCalendarDTO) — no entity load, no N+1, no
    // decryption — replacing the old findAll() the calendar used to hammer.
    public List<ReservaCalendarDTO> getCalendarReservas(LocalDate from, LocalDate to) {
        LocalDateTime fromTs = from.atStartOfDay();
        LocalDateTime toTs = to.plusDays(1).atStartOfDay();
        List<Object[]> rows = reservaRepository.findCalendarWindow(fromTs, toTs);

        List<ReservaCalendarDTO> out = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            List<ReservaCalendarDTO.Guest> guests = new ArrayList<>(1);
            if (row[5] != null) {
                guests.add(new ReservaCalendarDTO.Guest(
                        ((Number) row[5]).longValue(), (String) row[6]));
            }
            out.add(ReservaCalendarDTO.builder()
                    .id(((Number) row[0]).longValue())
                    .fechaEntrada(toLocalDateTime(row[1]))
                    .fechaSalida(toLocalDateTime(row[2]))
                    .numeroHabitacion(RoomNumberSerializer.normalize((String) row[3]))
                    .estadoReserva((String) row[4])
                    .huespedes(guests)
                    .build());
        }
        return out;
    }

    // Native timestamp columns surface as java.sql.Timestamp (or LocalDateTime,
    // depending on the Hibernate type resolver) — normalize either to LocalDateTime.
    private static LocalDateTime toLocalDateTime(Object v) {
        if (v == null) return null;
        if (v instanceof LocalDateTime ldt) return ldt;
        if (v instanceof Timestamp ts) return ts.toLocalDateTime();
        if (v instanceof Instant ins) return LocalDateTime.ofInstant(ins, ZoneId.systemDefault());
        throw new IllegalStateException("Unexpected temporal type: " + v.getClass());
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