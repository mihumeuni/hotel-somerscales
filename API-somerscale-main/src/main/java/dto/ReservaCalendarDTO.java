package dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

// Slim projection for the room calendar (dashboard widget + /calendario page).
// Carries only what RoomCalendarGrid/KPIs read — room, check-in/out, status and
// a single guest name — so the BE never loads HuespedModel entities. That avoids
// the @ManyToMany N+1, skips AES-GCM decryption of numeroDocumento, and keeps the
// encrypted document number / email / phone off the wire for a read-only view.
// huespedes is a 0- or 1-element list purely to preserve the FE shape the grid
// already consumes (r.huespedes?.[0]?.nombreCompleto).
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservaCalendarDTO {
    private Long id;
    private LocalDateTime fechaEntrada;
    private LocalDateTime fechaSalida;
    private String numeroHabitacion;
    private String estadoReserva;
    private List<Guest> huespedes;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Guest {
        private Long id;
        private String nombreCompleto;
    }
}
