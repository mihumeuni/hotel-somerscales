package dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import model.FichaQuickpickModel;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FichaQuickpickDTO {

    private Long id;
    private String rowLabel;
    private String value;
    private Short ordinal;

    public static FichaQuickpickDTO from(FichaQuickpickModel m) {
        return FichaQuickpickDTO.builder()
                .id(m.getId())
                .rowLabel(m.getRowLabel())
                .value(m.getValue())
                .ordinal(m.getOrdinal())
                .build();
    }
}
