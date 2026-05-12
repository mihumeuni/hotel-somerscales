package dto;

import lombok.Builder;
import lombok.Data;
import model.RolModel;

@Data
@Builder
public class AuthResponse {
    private String token;
    private RolModel role;
}
