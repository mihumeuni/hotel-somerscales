package dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SentimentLabelUpdateRequest {

    @NotBlank(message = "La etiqueta en español es obligatoria")
    @Size(max = 40, message = "La etiqueta no puede superar 40 caracteres")
    private String labelEs;

    @NotBlank(message = "El emoji es obligatorio")
    @Size(max = 8, message = "El emoji no puede superar 8 caracteres")
    private String emoji;
}
