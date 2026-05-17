package dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FichaSummaryDTO {
    private Long id;
    private LocalDate fecha;
    private String shift;
    private Long ownerUserId;
    private String ownerName;
    private boolean locked;
    private Instant claimedAt;
    private Instant lockedAt;
    private int reporteCount;
    private boolean hasNotes;
}
