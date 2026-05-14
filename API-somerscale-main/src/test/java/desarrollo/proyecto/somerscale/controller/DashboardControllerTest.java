package desarrollo.proyecto.somerscale.controller;

import controller.DashboardController;
import dto.OccupancyPointDTO;
import dto.SentimentSummaryDTO;
import dto.SentimentSummaryDTO.CategoryBreakdown;
import dto.TopGuestDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import service.DashboardService;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
public class DashboardControllerTest {

    private MockMvc mockMvc;

    @Mock
    private DashboardService dashboardService;

    @BeforeEach
    void setUp() {
        DashboardController controller = new DashboardController(dashboardService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void occupancy_returnsJsonArray() throws Exception {
        when(dashboardService.occupancy(eq(LocalDate.of(2025, 5, 1)), eq(LocalDate.of(2026, 5, 1))))
                .thenReturn(List.of(
                        OccupancyPointDTO.builder().month("2026-04").nights(312L).build(),
                        OccupancyPointDTO.builder().month("2026-05").nights(280L).build()
                ));

        mockMvc.perform(get("/api/dashboard/occupancy")
                        .param("from", "2025-05-01")
                        .param("to", "2026-05-01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].month").value("2026-04"))
                .andExpect(jsonPath("$[0].nights").value(312))
                .andExpect(jsonPath("$[1].month").value("2026-05"));
    }

    @Test
    void topGuests_returnsLeaderboardWithDefaultLimit10() throws Exception {
        when(dashboardService.topGuests(eq(10), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of(TopGuestDTO.builder()
                        .huespedId(1L)
                        .nombreCompleto("Juan Pérez")
                        .visitCount(14L)
                        .lastVisit(LocalDateTime.of(2026, 4, 18, 14, 0))
                        .build()));

        mockMvc.perform(get("/api/dashboard/top-guests")
                        .param("from", "2025-05-01")
                        .param("to", "2026-05-01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].huespedId").value(1))
                .andExpect(jsonPath("$[0].nombreCompleto").value("Juan Pérez"))
                .andExpect(jsonPath("$[0].visitCount").value(14));
    }

    @Test
    void topGuests_passesExplicitLimit() throws Exception {
        when(dashboardService.topGuests(eq(5), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/dashboard/top-guests")
                        .param("limit", "5")
                        .param("from", "2025-05-01")
                        .param("to", "2026-05-01"))
                .andExpect(status().isOk());
    }

    @Test
    void sentiment_returnsCountsAndByCategory() throws Exception {
        Map<String, Long> counts = new LinkedHashMap<>();
        counts.put("POSITIVE", 32L);
        counts.put("NEUTRAL", 8L);
        counts.put("NEGATIVE", 5L);
        when(dashboardService.sentiment(any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(SentimentSummaryDTO.builder()
                        .counts(counts)
                        .byCategory(List.of(CategoryBreakdown.builder()
                                .code("cleanliness")
                                .positive(10L)
                                .neutral(1L)
                                .negative(2L)
                                .build()))
                        .build());

        mockMvc.perform(get("/api/dashboard/sentiment")
                        .param("from", "2025-05-01")
                        .param("to", "2026-05-01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.counts.POSITIVE").value(32))
                .andExpect(jsonPath("$.counts.NEUTRAL").value(8))
                .andExpect(jsonPath("$.byCategory[0].code").value("cleanliness"))
                .andExpect(jsonPath("$.byCategory[0].positive").value(10));
    }
}
