package controller;

import model.HuespedModel;
import service.HuespedService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/guests")
@RequiredArgsConstructor
public class HuespedController {

    private final HuespedService huespedService;

    @GetMapping
    public List<HuespedModel> getAllHuespedes() {
        return huespedService.getAllHuespedes();
    }

    @GetMapping("/{id}")
    public HuespedModel getHuespedById(@PathVariable Long id) {
        return huespedService.getHuespedById(id);
    }

    @PostMapping
    public HuespedModel createHuesped(@RequestBody HuespedModel huesped) {
        return huespedService.createHuesped(huesped);
    }

    @PutMapping("/{id}")
    public HuespedModel updateHuesped(@PathVariable Long id, @RequestBody HuespedModel huesped) {
        return huespedService.updateHuesped(id, huesped);
    }
}
