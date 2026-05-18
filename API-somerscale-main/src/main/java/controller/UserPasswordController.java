package controller;

import dto.PasswordChangeRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import model.UsuarioModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import repository.UsuarioRepository;
import service.PasswordChangeRateLimiter;

@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
public class UserPasswordController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordChangeRateLimiter rateLimiter;

    @PutMapping("/password")
    @PreAuthorize("isAuthenticated()")
    @Transactional
    public ResponseEntity<Void> change(@Valid @RequestBody PasswordChangeRequest body) {
        UsuarioModel me = currentUser();

        if (!rateLimiter.tryConsume(me.getId())) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                "Demasiados intentos; vuelve a intentarlo en una hora");
        }

        if (!passwordEncoder.matches(body.getCurrentPassword(), me.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "La contraseña actual no coincide");
        }

        me.setPassword(passwordEncoder.encode(body.getNewPassword()));
        usuarioRepository.save(me);
        rateLimiter.clearOnSuccess(me.getId());
        return ResponseEntity.noContent().build();
    }

    private UsuarioModel currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesión no válida");
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof UsuarioModel u) {
            return usuarioRepository.findById(u.getId())
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));
        }
        String username = principal != null ? principal.toString() : auth.getName();
        return usuarioRepository.findByUsername(username)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));
    }
}
