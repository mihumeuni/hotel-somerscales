package repository;

import model.FichaQuickpickModel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FichaQuickpickRepository extends JpaRepository<FichaQuickpickModel, Long> {

    List<FichaQuickpickModel> findAllByOrderByRowLabelAscOrdinalAsc();

    List<FichaQuickpickModel> findByRowLabelOrderByOrdinalAsc(String rowLabel);
}
