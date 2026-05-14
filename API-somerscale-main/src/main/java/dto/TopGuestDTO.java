package dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopGuestDTO {
    private Long huespedId;
    private String nombreCompleto;
    private long visitCount;
    private LocalDateTime lastVisit;
}
