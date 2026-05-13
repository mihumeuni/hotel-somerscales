package repository;

import model.ReviewCategoryId;
import model.ReviewCategoryModel;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewCategoryRepository
        extends JpaRepository<ReviewCategoryModel, ReviewCategoryId> {
}
