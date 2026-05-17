package dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FichaParkingDTO {
    private Long id;
    private String room;
    private String lot;
    private Short position;
    private Instant createdAt;
}
