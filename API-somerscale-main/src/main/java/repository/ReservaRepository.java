package repository;

import model.ReservaModel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ReservaRepository extends JpaRepository<ReservaModel, Long> {
    Optional<ReservaModel> findByNumeroReservaCloudbeds(String numeroReservaCloudbeds);
}
