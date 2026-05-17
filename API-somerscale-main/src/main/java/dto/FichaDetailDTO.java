package dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FichaDetailDTO {
    private Long id;
    private LocalDate fecha;
    private String shift;
    private Long ownerUserId;
    private String ownerName;
    private boolean locked;
    private Instant claimedAt;
    private Instant lockedAt;
    private Instant updatedAt;
    private String notes;
    private List<FichaReporteDTO> reportes;
    private List<FichaParkingDTO> parkingEntries;
}
