package dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

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

    // Role *name* (e.g. "RECEPCIONISTA", "Auditor"). Backend resolves to a
    // RoleEntity at invite time.
    @NotBlank
    @Size(max = 40)
    private String role;
}
