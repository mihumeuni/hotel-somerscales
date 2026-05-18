package controller;

import dto.CategoryDTO;
import dto.CategoryUpsertRequest;
import integrations.gemini.GeminiClassifierService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import service.CategoryService;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;
    private final GeminiClassifierService geminiClassifier;

    @GetMapping
    public List<CategoryDTO> list() {
        return categoryService.list();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('category.manage')")
    public ResponseEntity<CategoryDTO> create(@Valid @RequestBody CategoryUpsertRequest req) {
        return ResponseEntity.status(201).body(categoryService.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('category.manage')")
    public CategoryDTO update(@PathVariable Long id,
                              @Valid @RequestBody CategoryUpsertRequest req) {
        return categoryService.update(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('category.manage')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        categoryService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reclassify")
    @PreAuthorize("hasAuthority('category.manage')")
    public ResponseEntity<GeminiClassifierService.ClassifyResult> reclassify() {
        return ResponseEntity.ok(geminiClassifier.reclassifyAll());
    }
}
