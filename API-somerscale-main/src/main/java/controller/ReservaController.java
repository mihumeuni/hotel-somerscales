package controller;

import dto.ReservaCalendarDTO;
import lombok.RequiredArgsConstructor;
import model.ReservaModel;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import service.ReservaService;

import java.time.LocalDate;
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

    // Calendar feed: only reservations overlapping [from, to] (defaults to the
    // next 30 days), as a slim DTO. The FE points the room calendar here instead
    // of GET / to avoid pulling the whole table + the @ManyToMany N+1 per load.
    @GetMapping("/calendario")
    @PreAuthorize("hasAuthority('booking.read')")
    public List<ReservaCalendarDTO> getCalendarReservas(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        LocalDate f = from != null ? from : LocalDate.now();
        LocalDate t = to != null ? to : f.plusDays(30);
        return reservaService.getCalendarReservas(f, t);
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
