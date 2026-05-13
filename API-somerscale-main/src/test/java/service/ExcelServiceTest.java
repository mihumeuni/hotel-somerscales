package service;

import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.mockito.invocation.InvocationOnMock;
import org.springframework.mock.web.MockMultipartFile;
import service.cloudbeds.CloudbedsHeaders;

import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.times;

class ExcelServiceTest {

    @Test
    void parsesAllRows_andSkipsKnownReservationCodes() throws Exception {
        // Set up: 5 unique Cloudbeds rows; second pass treats codes #2 and #4 as already-imported.
        byte[] xlsx = buildWorkbook(5);

        ExcelRowImporter mockImporter = mock(ExcelRowImporter.class);
        Set<String> alreadySeen = new HashSet<>();
        when(mockImporter.importOne(any())).thenAnswer((InvocationOnMock inv) -> {
            var row = inv.getArgument(0, service.cloudbeds.CloudbedsRow.class);
            return alreadySeen.add(row.getNumeroReservaCloudbeds())
                    ? ExcelRowImporter.Outcome.IMPORTED
                    : ExcelRowImporter.Outcome.SKIPPED;
        });

        ExcelService svc = new ExcelService(mockImporter);

        var first = svc.parseBookingsExcel(
            new MockMultipartFile("file", "sample.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", xlsx));

        assertEquals(5, first.getImported(), "first import: 5 fresh rows");
        assertEquals(0, first.getSkipped());
        assertTrue(first.getErrors().isEmpty(), () -> "unexpected errors: " + first.getErrors());

        // Re-upload exactly the same workbook; importer now reports every code as seen.
        var second = svc.parseBookingsExcel(
            new MockMultipartFile("file", "sample.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", xlsx));

        assertEquals(0, second.getImported(), "second import: nothing new");
        assertEquals(5, second.getSkipped(), "second import: all rows skipped");
        verify(mockImporter, times(10)).importOne(any()); // 5 rows × 2 uploads
    }

    @Test
    void rejectsWorkbookMissingRequiredHeaders() throws Exception {
        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet();
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Some Other Header");
            byte[] bytes;
            try (var bos = new ByteArrayOutputStream()) {
                wb.write(bos);
                bytes = bos.toByteArray();
            }
            ExcelService svc = new ExcelService(mock(ExcelRowImporter.class));
            var ex = org.junit.jupiter.api.Assertions.assertThrows(
                RuntimeException.class,
                () -> svc.parseBookingsExcel(new MockMultipartFile("file", "bad.xlsx", "x", bytes)));
            assertTrue(ex.getMessage().contains("missing required headers"),
                "expected header-diff message, got: " + ex.getMessage());
        }
    }

    private byte[] buildWorkbook(int rowCount) throws Exception {
        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet();
            List<String> headers = new ArrayList<>(List.of(
                CloudbedsHeaders.NOMBRE,
                CloudbedsHeaders.CORREO,
                CloudbedsHeaders.NUMERO_RESERVA,
                CloudbedsHeaders.FECHA_LLEGADA,
                CloudbedsHeaders.SALIDA,
                CloudbedsHeaders.FUENTE
            ));
            Row h = sheet.createRow(0);
            for (int c = 0; c < headers.size(); c++) {
                h.createCell(c).setCellValue(headers.get(c));
            }
            for (int r = 1; r <= rowCount; r++) {
                Row row = sheet.createRow(r);
                row.createCell(0).setCellValue("Guest " + r);
                row.createCell(1).setCellValue("g" + r + "@example.com");
                row.createCell(2).setCellValue("TST-" + r);
                row.createCell(3).setCellValue("01/02/2026");
                row.createCell(4).setCellValue("03/02/2026");
                row.createCell(5).setCellValue("Booking.com (Hotel Collect)");
            }
            try (var bos = new ByteArrayOutputStream()) {
                wb.write(bos);
                return bos.toByteArray();
            }
        }
    }
}
