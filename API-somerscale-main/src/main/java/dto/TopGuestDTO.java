package dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopGuestDTO {
    private Long huespedId;
    private String nombreCompleto;
    private long visitCount;
    private BigDecimal totalSpend;
    private LocalDateTime lastVisit;
}
