package controller;

import service.ExcelService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class ExcelController {

    private final ExcelService excelService;

    @PostMapping("/upload-excel")
    public String uploadExcel(@RequestParam("file") MultipartFile file) {
        excelService.processExcel(file);
        return "Archivo procesado correctamente";
    }
}
