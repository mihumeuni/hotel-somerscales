package dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String role;
    // Sheets ship in task026 — placeholder 0 keeps the FE contract stable.
    private long sheetCount;
}
