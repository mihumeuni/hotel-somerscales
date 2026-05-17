package repository;

import model.FichaModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface FichaRepository extends JpaRepository<FichaModel, Long> {

    Optional<FichaModel> findByFechaAndShift(LocalDate fecha, String shift);

    @Query("SELECT f FROM FichaModel f " +
           "WHERE (:from IS NULL OR f.fecha >= :from) " +
           "  AND (:to   IS NULL OR f.fecha <= :to) " +
           "ORDER BY f.fecha DESC, f.shift DESC")
    List<FichaModel> findInRange(@Param("from") LocalDate from, @Param("to") LocalDate to);

    long countByOwnerId(Long ownerId);

    @Query("SELECT f.owner.id AS ownerId, COUNT(f) AS total " +
           "FROM FichaModel f GROUP BY f.owner.id")
    List<OwnerSheetCount> countSheetsGroupedByOwner();

    interface OwnerSheetCount {
        Long getOwnerId();
        Long getTotal();
    }
}
