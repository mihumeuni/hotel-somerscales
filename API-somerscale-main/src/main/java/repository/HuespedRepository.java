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
                   MAX(r.fecha_entrada) AS last_visit
            FROM huespedes h
            JOIN reserva_huespedes rh ON rh.huesped_id = h.id
            JOIN reservas r           ON r.id = rh.reserva_id
            WHERE r.fecha_entrada BETWEEN :from AND :to
            GROUP BY h.id, h.nombre_completo
            ORDER BY visits DESC, last_visit DESC
            """, nativeQuery = true)
    List<Object[]> findTopGuests(@Param("from") LocalDateTime from,
                                 @Param("to") LocalDateTime to,
                                 Pageable pageable);
}
