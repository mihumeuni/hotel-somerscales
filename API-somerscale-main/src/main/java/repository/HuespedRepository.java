package repository;

import model.HuespedModel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface HuespedRepository extends JpaRepository<HuespedModel, Long> {
    Optional<HuespedModel> findByNumeroDocumento(String numeroDocumento);
}