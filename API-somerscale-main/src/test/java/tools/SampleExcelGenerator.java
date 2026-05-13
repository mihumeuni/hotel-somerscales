package tools;

import net.datafaker.Faker;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import service.cloudbeds.CloudbedsHeaders;

import java.io.FileOutputStream;
import java.lang.reflect.Field;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Random;
import java.util.UUID;

/**
 * One-shot generator for the deterministic test fixture.
 *
 * <p>Disabled in CI. To regenerate:
 * {@code mvn test -Dtest=SampleExcelGenerator -DfailIfNoTests=false -Dgroups=manual}
 * or just remove the {@code @Disabled} annotation and run it once.
 */
@Disabled("Manual fixture generator — run only when sample-cloudbeds.xlsx needs refreshing")
class SampleExcelGenerator {

    @Test
    void writeSampleWorkbook() throws Exception {
        Path repoRoot = locateRepoRoot();
        Path out = repoRoot.resolve("docs/plan/sample-cloudbeds.xlsx");
        Files.createDirectories(out.getParent());

        // Headers come from the canonical CloudbedsHeaders constants so renames
        // in the parser stay in sync with the test fixture.
        List<String> headers = collectAllHeaders();

        Faker faker = new Faker(new Locale("es", "CL"));
        Random rnd = new Random(42);
        DateTimeFormatter dmy = DateTimeFormatter.ofPattern("d/M/yyyy");

        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Reservations");
            Row header = sheet.createRow(0);
            for (int c = 0; c < headers.size(); c++) {
                header.createCell(c).setCellValue(headers.get(c));
            }
            for (int r = 1; r <= 20; r++) {
                Row row = sheet.createRow(r);
                LocalDate in = LocalDate.now().minusDays(rnd.nextInt(540));
                LocalDate out2 = in.plusDays(1 + rnd.nextInt(7));
                int total = 80 + rnd.nextInt(500);
                int paid = rnd.nextInt(total + 1);

                put(row, headers, CloudbedsHeaders.NOMBRE,                faker.name().fullName());
                put(row, headers, CloudbedsHeaders.CORREO,                faker.internet().emailAddress());
                put(row, headers, CloudbedsHeaders.TELEFONO,              faker.phoneNumber().cellPhone());
                put(row, headers, CloudbedsHeaders.NUMERO_RESERVA,        "SMP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
                put(row, headers, CloudbedsHeaders.NUMERO_CONF_TERCEROS,  String.valueOf(rnd.nextInt(9_000_000) + 1_000_000));
                put(row, headers, CloudbedsHeaders.TIPO_DOCUMENTO,        rnd.nextBoolean() ? "RUT" : "-");
                put(row, headers, CloudbedsHeaders.NUMERO_IDENTIFICACION, rnd.nextBoolean() ? faker.number().digits(9) : "");
                put(row, headers, CloudbedsHeaders.ADULTOS,               "2");
                put(row, headers, CloudbedsHeaders.NINOS,                 "0");
                put(row, headers, CloudbedsHeaders.NUMERO_HABITACION,     "H" + (10 + rnd.nextInt(40)));
                put(row, headers, CloudbedsHeaders.CATEGORIA_HABITACION,  "Doble Vista al Mar");
                put(row, headers, CloudbedsHeaders.FECHA_LLEGADA,         dmy.format(in));
                put(row, headers, CloudbedsHeaders.SALIDA,                dmy.format(out2));
                put(row, headers, CloudbedsHeaders.NOCHES,                String.valueOf(out2.toEpochDay() - in.toEpochDay()));
                put(row, headers, CloudbedsHeaders.TOTAL_HABITACION,      String.valueOf(total));
                put(row, headers, CloudbedsHeaders.MONTO_PAGADO,          String.valueOf(paid));
                put(row, headers, CloudbedsHeaders.TOTAL_GENERAL,         String.valueOf(total));
                put(row, headers, CloudbedsHeaders.SALDO_PENDIENTE,       String.valueOf(total - paid));
                put(row, headers, CloudbedsHeaders.FECHA_RESERVA,         dmy.format(in.minusDays(10)));
                put(row, headers, CloudbedsHeaders.FUENTE,                rnd.nextBoolean() ? "Booking.com (Hotel Collect)" : "Cloudbeds");
                put(row, headers, CloudbedsHeaders.ESTADO_RESERVA,        "Confirmado");
                put(row, headers, CloudbedsHeaders.PAIS,                  faker.country().name());
            }
            try (FileOutputStream fos = new FileOutputStream(out.toFile())) {
                wb.write(fos);
            }
        }
        System.out.println("Wrote " + out.toAbsolutePath());
    }

    private static void put(Row row, List<String> headers, String name, String value) {
        int idx = headers.indexOf(name);
        if (idx >= 0) row.createCell(idx).setCellValue(value);
    }

    private static List<String> collectAllHeaders() throws IllegalAccessException {
        List<String> headers = new ArrayList<>();
        for (Field f : CloudbedsHeaders.class.getDeclaredFields()) {
            if (f.getType() == String.class && java.lang.reflect.Modifier.isStatic(f.getModifiers())) {
                headers.add((String) f.get(null));
            }
        }
        return headers;
    }

    private static Path locateRepoRoot() {
        Path here = Path.of("").toAbsolutePath();
        while (here != null && !Files.exists(here.resolve("CLAUDE.md"))) {
            here = here.getParent();
        }
        if (here == null) throw new IllegalStateException("Could not find repo root");
        return here;
    }
}
