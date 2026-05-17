package controller;

import dto.ActiveShiftDTO;
import dto.ClaimShiftRequest;
import dto.FichaDetailDTO;
import dto.FichaParkingRequest;
import dto.FichaSummaryDTO;
import dto.FichaUpdateRequest;
import lombok.RequiredArgsConstructor;
import model.UsuarioModel;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import repository.UsuarioRepository;
import service.FichaService;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fichas")
@RequiredArgsConstructor
public class FichaController {

    private final FichaService fichaService;
    private final UsuarioRepository usuarioRepository;

    @GetMapping
    @PreAuthorize("hasAuthority('sheet.read')")
    public List<FichaSummaryDTO> list(
        @RequestParam(value = "from", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(value = "to", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return fichaService.list(from, to);
    }

    @GetMapping("/active")
    @PreAuthorize("hasAuthority('sheet.read')")
    public ActiveShiftDTO active() {
        return fichaService.active(currentUser());
    }

    @GetMapping("/quickpicks")
    @PreAuthorize("hasAuthority('sheet.read')")
    public Map<String, List<String>> quickpicks() {
        return fichaService.quickpicks();
    }

    @PostMapping("/claim")
    @PreAuthorize("hasAuthority('sheet.write')")
    public FichaDetailDTO claim(@RequestBody(required = false) ClaimShiftRequest body) {
        String requested = body == null ? null : body.getShift();
        return fichaService.claim(currentUser(), requested);
    }

    @GetMapping("/{id:\\d+}")
    @PreAuthorize("hasAuthority('sheet.read')")
    public FichaDetailDTO get(@PathVariable Long id) {
        return fichaService.get(id);
    }

    @PutMapping("/{id:\\d+}")
    @PreAuthorize("hasAuthority('sheet.write')")
    public FichaDetailDTO update(@PathVariable Long id, @RequestBody FichaUpdateRequest body) {
        return fichaService.update(currentUser(), id, body);
    }

    @PostMapping("/{id:\\d+}/handoff")
    @PreAuthorize("hasAuthority('sheet.write')")
    public FichaDetailDTO handoff(@PathVariable Long id) {
        return fichaService.handoff(currentUser(), id);
    }

    @PostMapping("/{id:\\d+}/parking")
    @PreAuthorize("hasAuthority('sheet.write')")
    public FichaDetailDTO addParking(
        @PathVariable Long id,
        @RequestBody FichaParkingRequest body
    ) {
        return fichaService.addParking(currentUser(), id, body.getRoom(), body.getLot());
    }

    @DeleteMapping("/{id:\\d+}/parking/{parkingId:\\d+}")
    @PreAuthorize("hasAuthority('sheet.write')")
    public FichaDetailDTO removeParking(
        @PathVariable Long id,
        @PathVariable Long parkingId
    ) {
        return fichaService.removeParking(currentUser(), id, parkingId);
    }

    private UsuarioModel currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesión no válida");
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof UsuarioModel user) {
            return usuarioRepository.findById(user.getId())
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));
        }
        String username = principal != null ? principal.toString() : auth.getName();
        return usuarioRepository.findByUsername(username)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));
    }
}
