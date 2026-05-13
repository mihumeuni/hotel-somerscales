package service;

import dto.ImportResult;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import service.cloudbeds.CloudbedsHeaders;
import service.cloudbeds.CloudbedsParsers;
import service.cloudbeds.CloudbedsRow;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExcelService {

    private final ExcelRowImporter rowImporter;

    /**
     * Parse a Cloudbeds .xlsx export and persist guests + bookings.
     * Idempotent: rows whose {@code numero_reserva_cloudbeds} already exists are skipped.
     */
    public ImportResult parseBookingsExcel(MultipartFile file) {
        List<String> errors = new ArrayList<>();
        int imported = 0;
        int skipped  = 0;

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Map<String, Integer> headers = readHeaders(sheet.getRow(0));
            requireHeaders(headers);

            DataFormatter fmt = new DataFormatter();
            for (int r = 1; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;
                try {
                    CloudbedsRow cb = parseRow(row, headers, fmt);
                    switch (rowImporter.importOne(cb)) {
                        case IMPORTED -> imported++;
                        case SKIPPED  -> skipped++;
                    }
                } catch (Exception e) {
                    errors.add("row " + (r + 1) + ": " + e.getMessage());
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Error procesando Excel: " + e.getMessage(), e);
        }

        return ImportResult.builder()
                .imported(imported)
                .skipped(skipped)
                .errors(errors)
                .build();
    }

    /** Retained for backward compatibility with any wiring still calling the old name. */
    public ImportResult processExcel(MultipartFile file) {
        return parseBookingsExcel(file);
    }

    // --- internals ---------------------------------------------------------

    private Map<String, Integer> readHeaders(Row headerRow) {
        if (headerRow == null) {
            throw new IllegalStateException("Excel has no header row");
        }
        Map<String, Integer> map = new HashMap<>();
        DataFormatter fmt = new DataFormatter();
        for (int c = 0; c < headerRow.getLastCellNum(); c++) {
            Cell cell = headerRow.getCell(c);
            if (cell == null) continue;
            String raw = fmt.formatCellValue(cell);
            // Preserve the header verbatim — Cloudbeds uses a trailing space on "Estado "
            // to distinguish it from the address-state "Estado" column.
            if (!raw.isEmpty()) map.putIfAbsent(raw, c);
        }
        return map;
    }

    private void requireHeaders(Map<String, Integer> headers) {
        List<String> missing = Arrays.stream(CloudbedsHeaders.REQUIRED)
                .filter(h -> !headers.containsKey(h))
                .collect(Collectors.toList());
        if (!missing.isEmpty()) {
            throw new IllegalStateException(
                "Cloudbeds export missing required headers: " + missing);
        }
    }

    private CloudbedsRow parseRow(Row row, Map<String, Integer> headers, DataFormatter fmt) {
        String fuenteRaw = cell(row, headers, CloudbedsHeaders.FUENTE, fmt);
        return CloudbedsRow.builder()
                .rowNumber(row.getRowNum() + 1)
                .nombre(CloudbedsParsers.trimToNull(cell(row, headers, CloudbedsHeaders.NOMBRE, fmt)))
                .email(CloudbedsParsers.trimToNull(cell(row, headers, CloudbedsHeaders.CORREO, fmt)))
                .telefono(CloudbedsParsers.trimToNull(cell(row, headers, CloudbedsHeaders.TELEFONO, fmt)))
                .movil(CloudbedsParsers.trimToNull(cell(row, headers, CloudbedsHeaders.MOVIL, fmt)))
                .tipoDocumento(CloudbedsParsers.normalizeTipoDocumento(cell(row, headers, CloudbedsHeaders.TIPO_DOCUMENTO, fmt)))
                .numeroDocumento(CloudbedsParsers.trimToNull(cell(row, headers, CloudbedsHeaders.NUMERO_IDENTIFICACION, fmt)))
                .numeroReservaCloudbeds(CloudbedsParsers.trimToNull(cell(row, headers, CloudbedsHeaders.NUMERO_RESERVA, fmt)))
                .numeroConfirmacionTerceros(CloudbedsParsers.trimToNull(cell(row, headers, CloudbedsHeaders.NUMERO_CONF_TERCEROS, fmt)))
                .fechaLlegada(CloudbedsParsers.parseDate(cell(row, headers, CloudbedsHeaders.FECHA_LLEGADA, fmt)))
                .salida(CloudbedsParsers.parseDate(cell(row, headers, CloudbedsHeaders.SALIDA, fmt)))
                .noches(CloudbedsParsers.parseInt(cell(row, headers, CloudbedsHeaders.NOCHES, fmt)))
                .adultos(CloudbedsParsers.parseInt(cell(row, headers, CloudbedsHeaders.ADULTOS, fmt)))
                .ninos(CloudbedsParsers.parseInt(cell(row, headers, CloudbedsHeaders.NINOS, fmt)))
                .numeroHabitacion(CloudbedsParsers.trimToNull(cell(row, headers, CloudbedsHeaders.NUMERO_HABITACION, fmt)))
                .categoriaHabitacion(CloudbedsParsers.trimToNull(cell(row, headers, CloudbedsHeaders.CATEGORIA_HABITACION, fmt)))
                .planComidas(CloudbedsParsers.trimToNull(cell(row, headers, CloudbedsHeaders.PLAN_COMIDAS, fmt)))
                .horaEstimadaLlegada(CloudbedsParsers.trimToNull(cell(row, headers, CloudbedsHeaders.HORA_ESTIMADA, fmt)))
                .fuenteRaw(CloudbedsParsers.trimToNull(fuenteRaw))
                .fuenteNormalizada(CloudbedsParsers.normalizeFuente(fuenteRaw))
                .estadoReserva(CloudbedsParsers.trimToNull(cell(row, headers, CloudbedsHeaders.ESTADO_RESERVA, fmt)))
                .estadoHuesped(CloudbedsParsers.trimToNull(cell(row, headers, CloudbedsHeaders.ESTADO_HUESPED, fmt)))
                .pais(CloudbedsParsers.trimToNull(cell(row, headers, CloudbedsHeaders.PAIS, fmt)))
                .procedencia(CloudbedsParsers.trimToNull(cell(row, headers, CloudbedsHeaders.PROCEDENCIA, fmt)))
                .fechaReserva(CloudbedsParsers.parseDate(cell(row, headers, CloudbedsHeaders.FECHA_RESERVA, fmt)))
                .fechaCancelacion(CloudbedsParsers.parseDate(cell(row, headers, CloudbedsHeaders.FECHA_CANCELACION, fmt)))
                .montoTotal(CloudbedsParsers.parseDecimal(cell(row, headers, CloudbedsHeaders.TOTAL_GENERAL, fmt)))
                .montoPagado(CloudbedsParsers.parseDecimal(cell(row, headers, CloudbedsHeaders.MONTO_PAGADO, fmt)))
                .saldoPendiente(CloudbedsParsers.parseDecimal(cell(row, headers, CloudbedsHeaders.SALDO_PENDIENTE, fmt)))
                .deposito(CloudbedsParsers.parseDecimal(cell(row, headers, CloudbedsHeaders.DEPOSITO, fmt)))
                .productosMonto(CloudbedsParsers.parseDecimal(cell(row, headers, CloudbedsHeaders.PRODUCTOS, fmt)))
                .tarifaCancelacion(CloudbedsParsers.parseDecimal(cell(row, headers, CloudbedsHeaders.TARIFA_CANCELACION, fmt)))
                .tipoTarjetaCredito(CloudbedsParsers.trimToNull(cell(row, headers, CloudbedsHeaders.TIPO_TARJETA_CREDITO, fmt)))
                .build();
    }

    private String cell(Row row, Map<String, Integer> headers, String header, DataFormatter fmt) {
        Integer idx = headers.get(header);
        if (idx == null) return null;
        Cell c = row.getCell(idx);
        if (c == null) return null;
        return fmt.formatCellValue(c);
    }
}
