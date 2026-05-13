package service;

import lombok.RequiredArgsConstructor;
import model.HuespedModel;
import model.ReservaModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import repository.HuespedRepository;
import repository.ReservaRepository;
import security.HmacUtil;
import service.cloudbeds.CloudbedsRow;

import java.time.LocalDateTime;
import java.util.ArrayList;

/**
 * Imports one Cloudbeds export row in its own transaction so a single bad row
 * cannot rollback the entire upload. Kept as a sibling bean of ExcelService to
 * avoid the same-class @Transactional proxy trap.
 */
@Service
@RequiredArgsConstructor
public class ExcelRowImporter {

    public enum Outcome { IMPORTED, SKIPPED }

    private final HuespedRepository huespedRepository;
    private final ReservaRepository reservaRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW, rollbackFor = Exception.class)
    public Outcome importOne(CloudbedsRow row) {
        if (row.getNumeroReservaCloudbeds() == null) {
            throw new IllegalArgumentException(
                "row " + row.getRowNumber() + ": missing 'Número de la reserva'");
        }
        if (reservaRepository.findByNumeroReservaCloudbeds(row.getNumeroReservaCloudbeds()).isPresent()) {
            return Outcome.SKIPPED;
        }

        HuespedModel huesped = resolveGuest(row);
        ReservaModel reserva = buildReserva(row, huesped);
        reservaRepository.save(reserva);
        return Outcome.IMPORTED;
    }

    private HuespedModel resolveGuest(CloudbedsRow row) {
        // 1. Document HMAC — strongest identity when present.
        if (row.getNumeroDocumento() != null) {
            String hmac = HmacUtil.hmacSha256Hex(row.getNumeroDocumento());
            var found = huespedRepository.findByNumeroDocumentoHmac(hmac);
            if (found.isPresent()) {
                return updateMutableFields(found.get(), row);
            }
        }
        // 2. Email + name — natural key for OTA bookings.
        if (row.getEmail() != null && row.getNombre() != null) {
            var found = huespedRepository.findByEmailAndNombreCompleto(row.getEmail(), row.getNombre());
            if (found.isPresent()) {
                return updateMutableFields(found.get(), row);
            }
        }
        // 3. New guest.
        HuespedModel fresh = HuespedModel.builder()
                .nombreCompleto(row.getNombre() != null ? row.getNombre() : "(sin nombre)")
                .email(row.getEmail())
                .telefono(firstNonNull(row.getTelefono(), row.getMovil()))
                .tipoDocumento(row.getTipoDocumento())
                .numeroDocumento(row.getNumeroDocumento())
                .build();
        return huespedRepository.save(fresh);
    }

    private HuespedModel updateMutableFields(HuespedModel existing, CloudbedsRow row) {
        if (row.getNombre() != null && !row.getNombre().equals(existing.getNombreCompleto())) {
            existing.setNombreCompleto(row.getNombre());
        }
        if (row.getEmail() != null && !row.getEmail().equals(existing.getEmail())) {
            existing.setEmail(row.getEmail());
        }
        String phone = firstNonNull(row.getTelefono(), row.getMovil());
        if (phone != null && !phone.equals(existing.getTelefono())) {
            existing.setTelefono(phone);
        }
        return huespedRepository.save(existing);
    }

    private ReservaModel buildReserva(CloudbedsRow row, HuespedModel huesped) {
        var huespedes = new ArrayList<HuespedModel>(1);
        huespedes.add(huesped);
        return ReservaModel.builder()
                .numeroReservaCloudbeds(row.getNumeroReservaCloudbeds())
                .numeroConfirmacionTerceros(row.getNumeroConfirmacionTerceros())
                .fechaEntrada(toStartOfDay(row.getFechaLlegada()))
                .fechaSalida(toStartOfDay(row.getSalida()))
                .noches(row.getNoches())
                .adultos(row.getAdultos())
                .ninos(row.getNinos())
                .numeroHabitacion(row.getNumeroHabitacion())
                .categoriaHabitacion(row.getCategoriaHabitacion())
                .planComidas(row.getPlanComidas())
                .horaEstimadaLlegada(row.getHoraEstimadaLlegada())
                .origenReserva(row.getFuenteNormalizada())
                .procedencia(row.getFuenteRaw())
                .estadoReserva(row.getEstadoReserva())
                .estadoHuesped(row.getEstadoHuesped())
                .pais(row.getPais())
                .fechaReserva(row.getFechaReserva())
                .fechaCancelacion(row.getFechaCancelacion())
                .montoTotal(row.getMontoTotal())
                .montoPagado(row.getMontoPagado())
                .saldoPendiente(row.getSaldoPendiente())
                .deposito(row.getDeposito())
                .productosMonto(row.getProductosMonto())
                .tarifaCancelacion(row.getTarifaCancelacion())
                .tipoTarjetaCredito(row.getTipoTarjetaCredito())
                .huespedes(huespedes)
                .build();
    }

    private static LocalDateTime toStartOfDay(java.time.LocalDate d) {
        return d == null ? null : d.atStartOfDay();
    }

    private static String firstNonNull(String a, String b) {
        return a != null ? a : b;
    }
}
