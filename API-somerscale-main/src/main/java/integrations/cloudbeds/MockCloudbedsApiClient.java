package integrations.cloudbeds;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Component;
import service.cloudbeds.CloudbedsHeaders;
import service.cloudbeds.CloudbedsParsers;
import service.cloudbeds.CloudbedsRow;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Reads {@code tests/huespedes.csv} (a TSV Cloudbeds export) and serves the
 * rows as if they came from the live Cloudbeds API. Keeps the MVP demo runnable
 * without real client_id/secret while {@link LiveCloudbedsApiClient} matures.
 *
 * Same {@code fixture-dir=../tests} pattern as Google Places + TripAdvisor.
 */
@Slf4j
@Component
@ConditionalOnExpression("'${integrations.cloudbeds.client-id:}'.isEmpty()")
public class MockCloudbedsApiClient implements CloudbedsApiClient {

    private final String configuredDir;
    private final String fileName;

    public MockCloudbedsApiClient(
            @Value("${integrations.cloudbeds.fixture-dir:../tests}") String fixtureDir,
            @Value("${integrations.cloudbeds.fixture-file:huespedes.csv}") String fileName) {
        this.configuredDir = fixtureDir;
        this.fileName = fileName;
    }

    @Override
    public boolean isLive() { return false; }

    @Override
    public List<CloudbedsRow> fetchReservations(LocalDate updatedSince) {
        Path fixture = resolveFixture();
        if (fixture == null) {
            log.warn("[MockCloudbedsApiClient] fixture missing: tried {} and ./tests/{}",
                     Path.of(configuredDir).resolve(fileName).toAbsolutePath(), fileName);
            return List.of();
        }
        try (Stream<String> lines = Files.lines(fixture, StandardCharsets.UTF_8)) {
            List<String[]> rows = lines
                    .map(line -> line.split("\t", -1))
                    .collect(Collectors.toList());
            if (rows.isEmpty()) return List.of();

            Map<String, Integer> headers = readHeaderIndex(rows.get(0));
            List<CloudbedsRow> out = new ArrayList<>(rows.size() - 1);
            for (int i = 1; i < rows.size(); i++) {
                String[] cols = rows.get(i);
                CloudbedsRow row = parseRow(cols, headers, i + 1);
                if (row.getNumeroReservaCloudbeds() == null) continue;
                out.add(row);
            }
            log.info("[MockCloudbedsApiClient] loaded {} reservations from {}",
                     out.size(), fixture);
            return out;
        } catch (Exception e) {
            log.error("[MockCloudbedsApiClient] fixture parse failed path={}: {}",
                      fixture, e.getMessage());
            return List.of();
        }
    }

    private Map<String, Integer> readHeaderIndex(String[] headerCols) {
        Map<String, Integer> map = new HashMap<>();
        for (int c = 0; c < headerCols.length; c++) {
            String h = headerCols[c];
            if (h == null || h.isEmpty()) continue;
            // Preserve the trailing space on "Estado " — Cloudbeds uses it to
            // disambiguate booking status from the address-state column.
            map.putIfAbsent(h, c);
        }
        return map;
    }

    private CloudbedsRow parseRow(String[] cols, Map<String, Integer> h, int rowNum) {
        String fuenteRaw = cell(cols, h, CloudbedsHeaders.FUENTE);
        return CloudbedsRow.builder()
                .rowNumber(rowNum)
                .nombre(CloudbedsParsers.trimToNull(cell(cols, h, CloudbedsHeaders.NOMBRE)))
                .email(CloudbedsParsers.trimToNull(cell(cols, h, CloudbedsHeaders.CORREO)))
                .telefono(CloudbedsParsers.trimToNull(cell(cols, h, CloudbedsHeaders.TELEFONO)))
                .movil(CloudbedsParsers.trimToNull(cell(cols, h, CloudbedsHeaders.MOVIL)))
                .tipoDocumento(CloudbedsParsers.normalizeTipoDocumento(cell(cols, h, CloudbedsHeaders.TIPO_DOCUMENTO)))
                .numeroDocumento(CloudbedsParsers.trimToNull(cell(cols, h, CloudbedsHeaders.NUMERO_IDENTIFICACION)))
                .numeroReservaCloudbeds(CloudbedsParsers.trimToNull(cell(cols, h, CloudbedsHeaders.NUMERO_RESERVA)))
                .numeroConfirmacionTerceros(CloudbedsParsers.trimToNull(cell(cols, h, CloudbedsHeaders.NUMERO_CONF_TERCEROS)))
                .fechaLlegada(CloudbedsParsers.parseDate(cell(cols, h, CloudbedsHeaders.FECHA_LLEGADA)))
                .salida(CloudbedsParsers.parseDate(cell(cols, h, CloudbedsHeaders.SALIDA)))
                .noches(CloudbedsParsers.parseInt(cell(cols, h, CloudbedsHeaders.NOCHES)))
                .adultos(CloudbedsParsers.parseInt(cell(cols, h, CloudbedsHeaders.ADULTOS)))
                .ninos(CloudbedsParsers.parseInt(cell(cols, h, CloudbedsHeaders.NINOS)))
                .numeroHabitacion(CloudbedsParsers.trimToNull(cell(cols, h, CloudbedsHeaders.NUMERO_HABITACION)))
                .categoriaHabitacion(CloudbedsParsers.trimToNull(cell(cols, h, CloudbedsHeaders.CATEGORIA_HABITACION)))
                .planComidas(CloudbedsParsers.trimToNull(cell(cols, h, CloudbedsHeaders.PLAN_COMIDAS)))
                .horaEstimadaLlegada(CloudbedsParsers.trimToNull(cell(cols, h, CloudbedsHeaders.HORA_ESTIMADA)))
                .fuenteRaw(CloudbedsParsers.trimToNull(fuenteRaw))
                .fuenteNormalizada(CloudbedsParsers.normalizeFuente(fuenteRaw))
                .estadoReserva(CloudbedsParsers.trimToNull(cell(cols, h, CloudbedsHeaders.ESTADO_RESERVA)))
                .estadoHuesped(CloudbedsParsers.trimToNull(cell(cols, h, CloudbedsHeaders.ESTADO_HUESPED)))
                .pais(CloudbedsParsers.trimToNull(cell(cols, h, CloudbedsHeaders.PAIS)))
                .procedencia(CloudbedsParsers.trimToNull(cell(cols, h, CloudbedsHeaders.PROCEDENCIA)))
                .fechaReserva(CloudbedsParsers.parseDate(cell(cols, h, CloudbedsHeaders.FECHA_RESERVA)))
                .fechaCancelacion(CloudbedsParsers.parseDate(cell(cols, h, CloudbedsHeaders.FECHA_CANCELACION)))
                .montoTotal(CloudbedsParsers.parseDecimal(cell(cols, h, CloudbedsHeaders.TOTAL_GENERAL)))
                .montoPagado(CloudbedsParsers.parseDecimal(cell(cols, h, CloudbedsHeaders.MONTO_PAGADO)))
                .saldoPendiente(CloudbedsParsers.parseDecimal(cell(cols, h, CloudbedsHeaders.SALDO_PENDIENTE)))
                .deposito(CloudbedsParsers.parseDecimal(cell(cols, h, CloudbedsHeaders.DEPOSITO)))
                .productosMonto(CloudbedsParsers.parseDecimal(cell(cols, h, CloudbedsHeaders.PRODUCTOS)))
                .tarifaCancelacion(CloudbedsParsers.parseDecimal(cell(cols, h, CloudbedsHeaders.TARIFA_CANCELACION)))
                .tipoTarjetaCredito(CloudbedsParsers.trimToNull(cell(cols, h, CloudbedsHeaders.TIPO_TARJETA_CREDITO)))
                .build();
    }

    private String cell(String[] cols, Map<String, Integer> headers, String name) {
        Integer i = headers.get(name);
        if (i == null || i >= cols.length) return null;
        String v = cols[i];
        return v == null ? null : v;
    }

    /**
     * Search the configured fixture dir first, then fall back to {@code ./tests}
     * so the same default works both locally (CWD=API-somerscale-main, fixtures
     * one level up) and inside the Docker image (CWD=/app, fixtures at
     * {@code /app/tests} per the Dockerfile COPY).
     */
    private Path resolveFixture() {
        Path primary = Path.of(configuredDir).resolve(fileName);
        if (Files.exists(primary)) return primary;
        Path docker = Path.of("./tests").resolve(fileName);
        if (Files.exists(docker)) return docker;
        return null;
    }
}
