package controller;

import dto.SentimentLabelDTO;
import dto.SentimentLabelUpdateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import service.SentimentTaxonomyService;

import java.util.List;

@RestController
@RequestMapping("/api/sentiment-labels")
@RequiredArgsConstructor
public class SentimentTaxonomyController {

    private final SentimentTaxonomyService service;

    @GetMapping
    public List<SentimentLabelDTO> list() {
        return service.list();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('category.manage')")
    public SentimentLabelDTO update(@PathVariable Long id,
                                    @Valid @RequestBody SentimentLabelUpdateRequest req) {
        return service.update(id, req);
    }
}
