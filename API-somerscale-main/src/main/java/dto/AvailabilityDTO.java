package dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvailabilityDTO {
    private int totalRooms;
    private int today;
    private Window week;
    private Window month;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Window {
        private int maxFree;
        private LocalDate peakDate;
    }
}
