package dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import model.HuespedModel;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuestHistoryDTO {
    private HuespedModel huesped;

    @Builder.Default
    private List<BookingSummaryDTO> bookings = new ArrayList<>();

    private int totalVisits;
    private int totalNights;

    // Sum of additional_expenses in CLP across all bookings. Non-CLP rows are
    // skipped in v0 — multi-currency consolidation is post-MVP.
    @Builder.Default
    private BigDecimal totalSpentClp = BigDecimal.ZERO;

    private LocalDateTime firstVisit;
    private LocalDateTime lastVisit;
}
