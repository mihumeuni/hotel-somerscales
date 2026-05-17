package dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Status of "the shift the operator should be on right now". If a ficha
 * already exists for (today, currentShift), the FE shows it as the active
 * ficha (locked or owned by you); otherwise the FE renders a claim CTA.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActiveShiftDTO {
    private LocalDate fecha;
    private String shift; // MANANA | NOCHE
    private String status; // CLAIMED_BY_ME | CLAIMED_BY_OTHER | UNCLAIMED
    private Long fichaId; // null when UNCLAIMED
    private boolean locked;
    private Long ownerUserId;
    private String ownerName;
}
