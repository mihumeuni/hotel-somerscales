package repository;

import model.ReservaModel;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReservaRepository extends JpaRepository<ReservaModel, Long> {
}
