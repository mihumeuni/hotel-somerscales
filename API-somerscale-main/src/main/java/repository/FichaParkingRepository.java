package repository;

import model.FichaParkingModel;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FichaParkingRepository extends JpaRepository<FichaParkingModel, Long> {
}
