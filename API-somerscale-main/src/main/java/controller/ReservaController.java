package controller;

import lombok.RequiredArgsConstructor;
import model.ReservaModel;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import service.ReservaService;

import java.util.List;

@RestController
@RequestMapping("/api/reservas")
@RequiredArgsConstructor
public class ReservaController {

    private final ReservaService reservaService;

    @GetMapping
    @PreAuthorize("hasAuthority('booking.read')")
    public List<ReservaModel> getAllReservas() {
        return reservaService.getAllReservas();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('booking.write')")
    public ReservaModel createReserva(@RequestBody ReservaModel reserva) {
        return reservaService.createReserva(reserva);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('booking.read')")
    public ReservaModel getReservaById(@PathVariable Long id) {
        return reservaService.getReservaById(id);
    }
}
