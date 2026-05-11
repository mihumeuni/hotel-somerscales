package service;

import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ExcelService {

    public void processExcel(MultipartFile file) {

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {

            Sheet sheet = workbook.getSheetAt(0);

            for (Row row : sheet) {

                if (row.getRowNum() == 0) continue; // saltar cabecera

                Cell cell = row.getCell(0);

                String nombre = cell.getStringCellValue();

                System.out.println("Procesando: " + nombre);

                // Aquí luego crearás huéspedes y reservas
            }

        } catch (Exception e) {
            throw new RuntimeException("Error procesando Excel", e);
        }
    }
}
