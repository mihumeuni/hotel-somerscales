package dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

// Shared shape for the dashboard's "Huéspedes actuales" and "Huéspedes recientes"
// widgets. The same guest may occupy multiple rooms in a single stay, so we
// group reservations by (huesped, fecha_entrada, fecha_salida) on the BE and
// emit a single row with the rooms[] array — the FE renders them joined.
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuestStripDTO {
    private Long huespedId;
    private String nombreCompleto;
    private String initials;
    private List<String> rooms;
    private long totalVisits;
    private LocalDate checkoutDate;
    private int partySize;
}
