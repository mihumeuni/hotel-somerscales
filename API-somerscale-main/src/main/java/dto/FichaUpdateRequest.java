package dto;

import lombok.Data;

import java.util.List;

@Data
public class FichaUpdateRequest {
    private List<FichaReporteUpsert> reportes;
    private String notes;

    @Data
    public static class FichaReporteUpsert {
        private Short ordinal;
        private String value;
    }
}
