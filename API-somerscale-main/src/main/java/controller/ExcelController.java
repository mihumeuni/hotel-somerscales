package controller;

import dto.ImportResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import service.ExcelService;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class ExcelController {

    private final ExcelService excelService;

    @PostMapping("/upload-excel")
    @PreAuthorize("hasAuthority('booking.write')")
    public ResponseEntity<ImportResult> uploadExcel(@RequestParam("file") MultipartFile file) {
        ImportResult result = excelService.parseBookingsExcel(file);
        return ResponseEntity.ok(result);
    }
}
