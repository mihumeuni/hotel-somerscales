package repository;

import model.ReservaModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReservaRepository extends JpaRepository<ReservaModel, Long> {
    Optional<ReservaModel> findByNumeroReservaCloudbeds(String numeroReservaCloudbeds);

    // Bookings linked to a guest through the reserva_huespedes join table.
    // Ordered by check-in date (oldest first) so the FE can derive firstVisit/lastVisit.
    @Query("SELECT r FROM ReservaModel r JOIN r.huespedes h " +
           "WHERE h.id = :huespedId ORDER BY r.fechaEntrada ASC")
    List<ReservaModel> findByHuespedesId(@Param("huespedId") Long huespedId);
}
