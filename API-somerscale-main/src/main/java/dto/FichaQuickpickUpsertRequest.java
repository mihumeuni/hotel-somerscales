package dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class FichaQuickpickUpsertRequest {

    @NotBlank(message = "La etiqueta de fila es obligatoria")
    @Size(max = 64, message = "La etiqueta no puede superar 64 caracteres")
    private String rowLabel;

    @NotBlank(message = "El valor del chip es obligatorio")
    @Size(max = 64, message = "El valor no puede superar 64 caracteres")
    private String value;

    @NotNull(message = "El orden es obligatorio")
    @PositiveOrZero(message = "El orden no puede ser negativo")
    private Short ordinal;
}
