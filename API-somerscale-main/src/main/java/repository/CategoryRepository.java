package repository;

import model.CategoryModel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CategoryRepository extends JpaRepository<CategoryModel, Long> {

    Optional<CategoryModel> findByCode(String code);
}
