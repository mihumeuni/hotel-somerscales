package model;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReviewCategoryId implements Serializable {

    private Long reviewId;
    private Long categoryId;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ReviewCategoryId other)) return false;
        return Objects.equals(reviewId, other.reviewId)
            && Objects.equals(categoryId, other.categoryId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(reviewId, categoryId);
    }
}
