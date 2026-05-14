package repository;

import model.ReservaModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ReservaRepository extends JpaRepository<ReservaModel, Long> {
    Optional<ReservaModel> findByNumeroReservaCloudbeds(String numeroReservaCloudbeds);

    // Bookings linked to a guest through the reserva_huespedes join table.
    // Ordered by check-in date (oldest first) so the FE can derive firstVisit/lastVisit.
    @Query("SELECT r FROM ReservaModel r JOIN r.huespedes h " +
           "WHERE h.id = :huespedId ORDER BY r.fechaEntrada ASC")
    List<ReservaModel> findByHuespedesId(@Param("huespedId") Long huespedId);

    // Occupancy per calendar month, computed as Σ(check-out − check-in) in days.
    // Native because EXTRACT/date_trunc don't have portable JPQL equivalents and
    // the dashboard line chart needs server-side grouping for any practical row count.
    @Query(value = """
            SELECT to_char(date_trunc('month', fecha_entrada), 'YYYY-MM') AS month,
                   COALESCE(SUM(EXTRACT(DAY FROM (fecha_salida - fecha_entrada))), 0) AS nights
            FROM reservas
            WHERE fecha_entrada BETWEEN :from AND :to
              AND fecha_salida IS NOT NULL
            GROUP BY 1
            ORDER BY 1
            """, nativeQuery = true)
    List<Object[]> occupancyByMonth(@Param("from") LocalDateTime from,
                                    @Param("to") LocalDateTime to);
}
