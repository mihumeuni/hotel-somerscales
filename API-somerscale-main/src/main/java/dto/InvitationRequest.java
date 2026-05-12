package dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import model.RolModel;

@Data
public class InvitationRequest {

    @NotBlank
    @Size(max = 200)
    private String nombre;

    @Size(max = 40)
    private String telefono;

    @NotBlank
    @Email
    @Size(max = 200)
    private String email;

    @NotNull
    private RolModel role;
}
