package service;

import dto.CategoryDTO;
import dto.CategoryUpsertRequest;
import lombok.RequiredArgsConstructor;
import model.CategoryModel;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import repository.CategoryRepository;
import repository.ReviewCategoryRepository;

import java.text.Normalizer;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ReviewCategoryRepository reviewCategoryRepository;

    @Transactional(readOnly = true)
    public List<CategoryDTO> list() {
        return categoryRepository.findAll().stream()
                .sorted(Comparator.comparing(CategoryModel::getLabelEs, String.CASE_INSENSITIVE_ORDER))
                .map(CategoryDTO::from)
                .toList();
    }

    @Transactional
    public CategoryDTO create(CategoryUpsertRequest req) {
        String code = slugify(req.getLabelEs());
        if (categoryRepository.findByCode(code).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ya existe una categoría con esa etiqueta");
        }
        String labelEn = req.getLabelEn() != null && !req.getLabelEn().isBlank()
                ? req.getLabelEn() : req.getLabelEs();
        CategoryModel m = CategoryModel.builder()
                .code(code)
                .labelEs(req.getLabelEs())
                .labelEn(labelEn)
                .build();
        return CategoryDTO.from(categoryRepository.save(m));
    }

    @Transactional
    public CategoryDTO update(Long id, CategoryUpsertRequest req) {
        CategoryModel m = categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Categoría no encontrada"));
        m.setLabelEs(req.getLabelEs());
        if (req.getLabelEn() != null && !req.getLabelEn().isBlank()) {
            m.setLabelEn(req.getLabelEn());
        } else {
            m.setLabelEn(req.getLabelEs());
        }
        return CategoryDTO.from(categoryRepository.save(m));
    }

    @Transactional
    public void delete(Long id) {
        CategoryModel m = categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Categoría no encontrada"));
        reviewCategoryRepository.deleteByCategoryId(id);
        categoryRepository.delete(m);
    }

    private static String slugify(String input) {
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "_")
                .replaceAll("^_+|_+$", "");
        if (normalized.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La etiqueta debe contener al menos un carácter alfanumérico");
        }
        if (normalized.length() > 40) {
            normalized = normalized.substring(0, 40);
        }
        return normalized;
    }
}
