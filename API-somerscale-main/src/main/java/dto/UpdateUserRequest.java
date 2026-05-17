package dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateUserRequest {

    @NotBlank
    @Size(max = 200)
    private String name;

    @NotBlank
    @Email
    @Size(max = 200)
    private String email;

    @Size(max = 40)
    private String phone;

    @NotBlank
    private String role;
}
