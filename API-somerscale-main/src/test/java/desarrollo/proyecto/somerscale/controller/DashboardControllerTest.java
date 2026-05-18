package desarrollo.proyecto.somerscale.controller;

import controller.DashboardController;
import dto.OccupancyPointDTO;
import dto.SentimentSummaryDTO;
import dto.SentimentSummaryDTO.Bucket;
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
        when(dashboardService.topGuests(eq(10), any(LocalDate.class), any(LocalDate.class), eq("visits")))
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
        when(dashboardService.topGuests(eq(5), any(LocalDate.class), any(LocalDate.class), eq("visits")))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/dashboard/top-guests")
                        .param("limit", "5")
                        .param("from", "2025-05-01")
                        .param("to", "2026-05-01"))
                .andExpect(status().isOk());
    }

    @Test
    void sentiment_returnsBucketsAndByCategory() throws Exception {
        Map<String, Long> catBuckets = new LinkedHashMap<>();
        catBuckets.put("positive", 10L);
        catBuckets.put("complaint", 2L);

        when(dashboardService.sentiment(any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(SentimentSummaryDTO.builder()
                        .buckets(List.of(
                                Bucket.builder().code("positive").labelEs("Positivo").emoji("😊").count(32L).build(),
                                Bucket.builder().code("neutral").labelEs("Neutral").emoji("😐").count(8L).build(),
                                Bucket.builder().code("negative").labelEs("Negativo").emoji("😞").count(5L).build()
                        ))
                        .totalReviews(40L)
                        .multiLabel(true)
                        .byCategory(List.of(CategoryBreakdown.builder()
                                .code("cleanliness")
                                .buckets(catBuckets)
                                .build()))
                        .build());

        mockMvc.perform(get("/api/dashboard/sentiment")
                        .param("from", "2025-05-01")
                        .param("to", "2026-05-01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalReviews").value(40))
                .andExpect(jsonPath("$.multiLabel").value(true))
                .andExpect(jsonPath("$.buckets[0].code").value("positive"))
                .andExpect(jsonPath("$.buckets[0].count").value(32))
                .andExpect(jsonPath("$.buckets[1].code").value("neutral"))
                .andExpect(jsonPath("$.byCategory[0].code").value("cleanliness"))
                .andExpect(jsonPath("$.byCategory[0].buckets.positive").value(10))
                .andExpect(jsonPath("$.byCategory[0].buckets.complaint").value(2));
    }
}
