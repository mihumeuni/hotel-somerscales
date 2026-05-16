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

    // Distinct rooms whose reserva window straddles `ts`. Used to compute
    // free-room counts per calendar day for the Disponibilidad KPI.
    @Query(value = """
            SELECT COUNT(DISTINCT numero_habitacion)
            FROM reservas
            WHERE numero_habitacion IS NOT NULL
              AND fecha_entrada <= :ts
              AND fecha_salida  >  :ts
              AND (estado_reserva IS NULL OR estado_reserva NOT IN ('CANCELADA','NO_SHOW'))
            """, nativeQuery = true)
    long countOccupiedRoomsAt(@Param("ts") LocalDateTime ts);

    // In-house grouping: same guest + same check-in/out window collapses to one
    // row carrying all rooms taken. Aggregates room codes preserving the H#
    // values after the JSON normalizer strips the Cloudbeds A prefix.
    @Query(value = """
            SELECT h.id                                    AS huesped_id,
                   h.nombre_completo                       AS nombre_completo,
                   STRING_AGG(DISTINCT r.numero_habitacion, ',' ORDER BY r.numero_habitacion) AS rooms,
                   MIN(r.fecha_entrada)                    AS check_in,
                   MAX(r.fecha_salida)                     AS check_out,
                   (COALESCE(SUM(r.adultos),0) + COALESCE(SUM(r.ninos),0)) AS party_size
            FROM huespedes h
            JOIN reserva_huespedes rh ON rh.huesped_id = h.id
            JOIN reservas r           ON r.id = rh.reserva_id
            WHERE r.fecha_entrada <= :now
              AND r.fecha_salida  >  :now
              AND (r.estado_reserva IS NULL OR r.estado_reserva NOT IN ('CANCELADA','NO_SHOW'))
            GROUP BY h.id, h.nombre_completo, date_trunc('day', r.fecha_entrada), date_trunc('day', r.fecha_salida)
            ORDER BY check_out ASC
            """, nativeQuery = true)
    List<Object[]> findCurrentGuests(@Param("now") LocalDateTime now);

    // Recent checkouts grouped the same way. `since` clips the window to keep
    // the result bounded; the controller still applies LIMIT via Pageable.
    @Query(value = """
            SELECT h.id                                    AS huesped_id,
                   h.nombre_completo                       AS nombre_completo,
                   STRING_AGG(DISTINCT r.numero_habitacion, ',' ORDER BY r.numero_habitacion) AS rooms,
                   MIN(r.fecha_entrada)                    AS check_in,
                   MAX(r.fecha_salida)                     AS check_out,
                   (COALESCE(SUM(r.adultos),0) + COALESCE(SUM(r.ninos),0)) AS party_size
            FROM huespedes h
            JOIN reserva_huespedes rh ON rh.huesped_id = h.id
            JOIN reservas r           ON r.id = rh.reserva_id
            WHERE r.fecha_salida <= :now
              AND r.fecha_salida >= :since
              AND (r.estado_reserva IS NULL OR r.estado_reserva NOT IN ('CANCELADA','NO_SHOW'))
            GROUP BY h.id, h.nombre_completo, date_trunc('day', r.fecha_entrada), date_trunc('day', r.fecha_salida)
            ORDER BY check_out DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> findRecentGuests(@Param("now") LocalDateTime now,
                                    @Param("since") LocalDateTime since,
                                    @Param("limit") int limit);
}
