package dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String name;
    private String username;
    private String email;
    private String phone;
    private String role;
    private Instant createdAt;
    // Sheets ship in task026 — placeholder 0 keeps the FE contract stable.
    private long sheetCount;
}
