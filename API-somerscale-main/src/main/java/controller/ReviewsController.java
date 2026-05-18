package controller;

import dto.ReviewListItemDTO;
import lombok.RequiredArgsConstructor;
import model.ReviewModel;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import repository.ReviewRepository;

import java.util.ArrayList;
import java.util.List;

/**
 * task031: filtered cluster list backing the dashboard sentiment-bucket
 * tap-through. Single endpoint today (label filter); other filters (date,
 * source) can plug into the same controller without a new route prefix.
 */
@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewsController {

    private static final int MAX_LIMIT = 200;
    private static final int DEFAULT_LIMIT = 50;

    private final ReviewRepository reviewRepository;

    @GetMapping
    @PreAuthorize("hasAuthority('dashboard.read')")
    public List<ReviewListItemDTO> list(
            @RequestParam String label,
            @RequestParam(defaultValue = "50") int limit) {
        int capped = Math.max(1, Math.min(MAX_LIMIT, limit == 0 ? DEFAULT_LIMIT : limit));
        List<ReviewModel> rows = reviewRepository.findByLabel(label, capped);
        List<ReviewListItemDTO> out = new ArrayList<>(rows.size());
        for (ReviewModel r : rows) {
            out.add(ReviewListItemDTO.builder()
                    .id(r.getId())
                    .source(r.getSource() == null ? null : r.getSource().name())
                    .author(r.getAuthor())
                    .rating(r.getRating())
                    .rawText(r.getRawText())
                    .summary(r.getSummary())
                    .postedAt(r.getPostedAt())
                    // Fresh list — labels collection is lazy but the iteration
                    // forces the join-table fetch inside the same JPA session.
                    .labels(new ArrayList<>(r.getLabels()))
                    .build());
        }
        return out;
    }
}
