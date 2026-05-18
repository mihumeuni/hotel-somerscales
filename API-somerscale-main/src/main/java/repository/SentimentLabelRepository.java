package repository;

import model.SentimentLabelModel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SentimentLabelRepository extends JpaRepository<SentimentLabelModel, Long> {

    List<SentimentLabelModel> findAllByOrderByOrdinalAsc();
}
