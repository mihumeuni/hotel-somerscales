package dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingSummaryDTO {
    private Long id;
    private LocalDateTime fechaEntrada;
    private LocalDateTime fechaSalida;
    private String origenReserva;
    private Integer nightsCount;
    private String estadoReserva;
    private BigDecimal montoTotal;

    // Sum of additional_expenses grouped by currency for this booking.
    @Builder.Default
    private Map<String, BigDecimal> totalExpensesByCurrency = new LinkedHashMap<>();
}
