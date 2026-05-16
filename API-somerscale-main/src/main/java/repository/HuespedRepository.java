package repository;

import model.HuespedModel;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface HuespedRepository extends JpaRepository<HuespedModel, Long> {
    Optional<HuespedModel> findByNumeroDocumentoHmac(String numeroDocumentoHmac);
    Optional<HuespedModel> findByEmailAndNombreCompleto(String email, String nombreCompleto);

    // Top guests by visit count, joined through the reserva_huespedes link table.
    // Native to keep the projection flat (id, name, count, max-date) for the
    // dashboard leaderboard. Pageable carries the LIMIT.
    @Query(value = """
            SELECT h.id                AS huesped_id,
                   h.nombre_completo   AS nombre_completo,
                   COUNT(rh.reserva_id) AS visits,
                   COALESCE(SUM(r.monto_total), 0) AS total_spend,
                   MAX(r.fecha_entrada) AS last_visit
            FROM huespedes h
            JOIN reserva_huespedes rh ON rh.huesped_id = h.id
            JOIN reservas r           ON r.id = rh.reserva_id
            WHERE r.fecha_entrada BETWEEN :from AND :to
            GROUP BY h.id, h.nombre_completo
            ORDER BY visits DESC, last_visit DESC
            """, nativeQuery = true)
    List<Object[]> findTopGuestsByVisits(@Param("from") LocalDateTime from,
                                         @Param("to") LocalDateTime to,
                                         Pageable pageable);

    @Query(value = """
            SELECT h.id                AS huesped_id,
                   h.nombre_completo   AS nombre_completo,
                   COUNT(rh.reserva_id) AS visits,
                   COALESCE(SUM(r.monto_total), 0) AS total_spend,
                   MAX(r.fecha_entrada) AS last_visit
            FROM huespedes h
            JOIN reserva_huespedes rh ON rh.huesped_id = h.id
            JOIN reservas r           ON r.id = rh.reserva_id
            WHERE r.fecha_entrada BETWEEN :from AND :to
            GROUP BY h.id, h.nombre_completo
            ORDER BY total_spend DESC, last_visit DESC
            """, nativeQuery = true)
    List<Object[]> findTopGuestsBySpend(@Param("from") LocalDateTime from,
                                        @Param("to") LocalDateTime to,
                                        Pageable pageable);

    // Total lifetime visits per guest — used by GuestStrip widgets so each
    // in-house/recent guest row can show a "5 estadías" badge.
    @Query(value = """
            SELECT h.id, COUNT(rh.reserva_id)
            FROM huespedes h
            LEFT JOIN reserva_huespedes rh ON rh.huesped_id = h.id
            WHERE h.id IN (:ids)
            GROUP BY h.id
            """, nativeQuery = true)
    List<Object[]> countVisitsForGuests(@Param("ids") List<Long> ids);
}
