package dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import model.CategoryModel;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDTO {

    private Long id;
    private String code;
    private String labelEs;
    private String labelEn;

    public static CategoryDTO from(CategoryModel m) {
        return CategoryDTO.builder()
                .id(m.getId())
                .code(m.getCode())
                .labelEs(m.getLabelEs())
                .labelEn(m.getLabelEn())
                .build();
    }
}
