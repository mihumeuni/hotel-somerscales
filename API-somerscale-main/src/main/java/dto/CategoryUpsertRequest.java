package dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CategoryUpsertRequest {

    @NotBlank(message = "La etiqueta en español es obligatoria")
    @Size(max = 80, message = "La etiqueta no puede superar 80 caracteres")
    private String labelEs;

    @Size(max = 80, message = "La etiqueta en inglés no puede superar 80 caracteres")
    private String labelEn;
}
