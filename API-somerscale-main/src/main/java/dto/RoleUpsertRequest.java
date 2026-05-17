package dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RoleUpsertRequest {

    @NotBlank(message = "El nombre del rol es obligatorio")
    @Size(max = 40, message = "El nombre no puede superar 40 caracteres")
    private String name;

    @Size(max = 255, message = "La descripción no puede superar 255 caracteres")
    private String description;
}
