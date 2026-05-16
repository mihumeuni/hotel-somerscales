package controller;

import dto.AvailabilityDTO;
import dto.CategoryCountDTO;
import dto.GuestStripDTO;
import dto.NormalizedReviewDTO;
import dto.OccupancyPointDTO;
import dto.SentimentSummaryDTO;
import dto.TopGuestDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import service.DashboardService;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/occupancy")
    @PreAuthorize("hasAuthority('dashboard.read')")
    public List<OccupancyPointDTO> occupancy(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return dashboardService.occupancy(from, to);
    }

    @GetMapping("/top-guests")
    @PreAuthorize("hasAuthority('dashboard.read')")
    public List<TopGuestDTO> topGuests(
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "visits") String metric) {
        return dashboardService.topGuests(limit, from, to, metric);
    }

    @GetMapping("/sentiment")
    @PreAuthorize("hasAuthority('dashboard.read')")
    public SentimentSummaryDTO sentiment(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return dashboardService.sentiment(from, to);
    }

    @GetMapping("/availability")
    @PreAuthorize("hasAuthority('dashboard.read')")
    public AvailabilityDTO availability() {
        return dashboardService.availability();
    }

    @GetMapping("/current-guests")
    @PreAuthorize("hasAuthority('dashboard.read')")
    public List<GuestStripDTO> currentGuests() {
        return dashboardService.currentGuests();
    }

    @GetMapping("/recent-guests")
    @PreAuthorize("hasAuthority('dashboard.read')")
    public List<GuestStripDTO> recentGuests(@RequestParam(defaultValue = "10") int limit) {
        return dashboardService.recentGuests(limit);
    }

    @GetMapping("/categories")
    @PreAuthorize("hasAuthority('dashboard.read')")
    public List<CategoryCountDTO> categories(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return dashboardService.categoryCounts(from, to);
    }

    @GetMapping("/normalized-reviews")
    @PreAuthorize("hasAuthority('dashboard.read')")
    public List<NormalizedReviewDTO> normalizedReviews(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "10") int limit) {
        return dashboardService.normalizedReviews(from, to, limit);
    }
}
