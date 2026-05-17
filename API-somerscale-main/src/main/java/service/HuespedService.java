package service;

import dto.BookingSummaryDTO;
import dto.GuestHistoryDTO;
import lombok.RequiredArgsConstructor;
import model.HuespedModel;
import model.ReservaModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import repository.AdditionalExpenseRepository;
import repository.HuespedRepository;
import repository.ReservaRepository;
import security.HmacUtil;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class HuespedService {

    private static final String CURRENCY_CLP = "CLP";

    private final HuespedRepository huespedRepository;
    private final ReservaRepository reservaRepository;
    private final AdditionalExpenseRepository additionalExpenseRepository;

    public List<HuespedModel> getAllHuespedes() {
        return huespedRepository.findAll();
    }

    public HuespedModel getHuespedById(Long id) {
        return huespedRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Huésped no encontrado"));
    }

    // Header search autocomplete. Empty/short queries return [] to avoid full
    // table scans on key-up; the FE only fires this once the user typed 2+ chars.
    public List<HuespedModel> search(String q, int limit) {
        if (q == null || q.trim().length() < 2) return List.of();
        int capped = Math.min(Math.max(limit, 1), 20);
        return huespedRepository.searchByNombreCompleto(
            q.trim(),
            org.springframework.data.domain.PageRequest.of(0, capped)
        );
    }

    public HuespedModel createHuesped(HuespedModel huesped) {

        String hmac = HmacUtil.hmacSha256Hex(huesped.getNumeroDocumento());
        huespedRepository.findByNumeroDocumentoHmac(hmac)
                .ifPresent(g -> {
                    throw new RuntimeException("El huésped ya existe");
                });

        return huespedRepository.save(huesped);
    }

    public HuespedModel updateHuesped(Long id, HuespedModel updatedHuesped) {

        HuespedModel huesped = huespedRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Huésped no encontrado"));

        huesped.setNombreCompleto(updatedHuesped.getNombreCompleto());
        huesped.setEmail(updatedHuesped.getEmail());
        huesped.setTelefono(updatedHuesped.getTelefono());
        huesped.setDatoExtra(updatedHuesped.getDatoExtra());

        return huespedRepository.save(huesped);
    }

    public void deleteHuesped(Long id) {
        if (!huespedRepository.existsById(id)) {
            throw new RuntimeException("Huésped no encontrado");
        }
        huespedRepository.deleteById(id);
    }

    // Aggregate query for the Holistic View detail page. 1+N is acceptable at MVP
    // scale (200 guests / 500 bookings); revisit with a fetch-join if a guest ever
    // accumulates dozens of bookings.
    @Transactional(readOnly = true)
    public GuestHistoryDTO getHistorial(Long huespedId) {
        HuespedModel huesped = huespedRepository.findById(huespedId)
                .orElseThrow(() -> new RuntimeException("Huésped no encontrado"));

        List<ReservaModel> reservas = reservaRepository.findByHuespedesId(huespedId);

        List<BookingSummaryDTO> bookings = new ArrayList<>(reservas.size());
        int totalNights = 0;
        BigDecimal totalSpentClp = BigDecimal.ZERO;
        LocalDateTime firstVisit = null;
        LocalDateTime lastVisit = null;

        for (ReservaModel r : reservas) {
            Map<String, BigDecimal> totalsByCurrency = sumExpensesByCurrency(r.getId());
            int nights = computeNights(r);
            totalNights += nights;
            totalSpentClp = totalSpentClp.add(
                    totalsByCurrency.getOrDefault(CURRENCY_CLP, BigDecimal.ZERO));

            LocalDateTime entrada = r.getFechaEntrada();
            if (entrada != null) {
                if (firstVisit == null || entrada.isBefore(firstVisit)) firstVisit = entrada;
                if (lastVisit == null || entrada.isAfter(lastVisit)) lastVisit = entrada;
            }

            bookings.add(BookingSummaryDTO.builder()
                    .id(r.getId())
                    .fechaEntrada(r.getFechaEntrada())
                    .fechaSalida(r.getFechaSalida())
                    .origenReserva(r.getOrigenReserva())
                    .nightsCount(nights)
                    .estadoReserva(r.getEstadoReserva())
                    .montoTotal(r.getMontoTotal())
                    .totalExpensesByCurrency(totalsByCurrency)
                    .build());
        }

        return GuestHistoryDTO.builder()
                .huesped(huesped)
                .bookings(bookings)
                .totalVisits(bookings.size())
                .totalNights(totalNights)
                .totalSpentClp(totalSpentClp)
                .firstVisit(firstVisit)
                .lastVisit(lastVisit)
                .build();
    }

    private Map<String, BigDecimal> sumExpensesByCurrency(Long reservaId) {
        Map<String, BigDecimal> totals = new LinkedHashMap<>();
        for (Object[] row : additionalExpenseRepository.sumByReservaIdGroupByMoneda(reservaId)) {
            totals.put((String) row[0], (BigDecimal) row[1]);
        }
        return totals;
    }

    private int computeNights(ReservaModel r) {
        // Prefer Cloudbeds-supplied nights when populated; fall back to a date diff.
        if (r.getNoches() != null && r.getNoches() > 0) return r.getNoches();
        LocalDateTime in = r.getFechaEntrada();
        LocalDateTime out = r.getFechaSalida();
        if (in == null || out == null) return 0;
        long days = ChronoUnit.DAYS.between(in.toLocalDate(), out.toLocalDate());
        return (int) Math.max(0, days);
    }
}
