package repository;

import model.ReviewCategoryId;
import model.ReviewCategoryModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface ReviewCategoryRepository
        extends JpaRepository<ReviewCategoryModel, ReviewCategoryId> {

    @Modifying
    @Query("delete from ReviewCategoryModel rc where rc.category.id = :categoryId")
    void deleteByCategoryId(Long categoryId);

    @Modifying
    @Query("delete from ReviewCategoryModel rc")
    void deleteAllRows();
}
