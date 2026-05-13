package dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdditionalExpenseDTO {
    private Long id;
    private Long reservaId;
    private String concepto;
    private BigDecimal monto;
    private String moneda;
    private LocalDateTime fecha;
    private Long createdById;
    private String createdByUsername;
    private String notas;
}
