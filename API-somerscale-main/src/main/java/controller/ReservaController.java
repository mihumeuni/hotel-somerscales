package controller;

import service.ReservaService;
import model.ReservaModel;
import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reservas")
@RequiredArgsConstructor
public class ReservaController {

    private final ReservaService reservaService;

    @GetMapping
    public List<ReservaModel> getAllReservas() {
        return reservaService.getAllReservas();
    }

    @PostMapping
    public ReservaModel createReserva(@RequestBody ReservaModel reserva) {
        return reservaService.createReserva(reserva);
    }

    @GetMapping("/{id}")
    public ReservaModel getReservaById(@PathVariable Long id) {
        return reservaService.getReservaById(id);
    }
}