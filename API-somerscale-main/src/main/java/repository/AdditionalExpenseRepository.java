package repository;

import model.AdditionalExpenseModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AdditionalExpenseRepository extends JpaRepository<AdditionalExpenseModel, Long> {

    List<AdditionalExpenseModel> findByReservaIdOrderByFechaDesc(Long reservaId);

    // Grouped sum per moneda — totals row in the FE table needs one number per
    // currency rather than a single mixed-currency sum.
    @Query("SELECT e.moneda, COALESCE(SUM(e.monto), 0) FROM AdditionalExpenseModel e " +
           "WHERE e.reserva.id = :reservaId GROUP BY e.moneda")
    List<Object[]> sumByReservaIdGroupByMoneda(@Param("reservaId") Long reservaId);
}
