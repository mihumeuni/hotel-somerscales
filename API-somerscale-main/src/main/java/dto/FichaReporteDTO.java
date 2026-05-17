package dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FichaReporteDTO {
    private Long id;
    private String label;
    private String value;
    private Short ordinal;
}
