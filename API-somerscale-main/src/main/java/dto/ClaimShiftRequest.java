package dto;

import lombok.Data;

@Data
public class ClaimShiftRequest {
    /**
     * Optional override. When null, the server uses the auto-detected shift
     * based on the current Santiago time (MANANA 06:00-18:00, NOCHE otherwise).
     */
    private String shift;
}
