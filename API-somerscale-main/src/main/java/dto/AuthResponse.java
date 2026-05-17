package dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AuthResponse {
    private String token;
    private String role;
    private List<String> permissions;
}
