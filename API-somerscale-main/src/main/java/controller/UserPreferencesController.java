package controller;

import dto.UserPreferencesDTO;
import dto.UserPreferencesUpdateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import model.UsuarioModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import repository.UsuarioRepository;
import service.UserPreferencesService;

import java.io.IOException;

@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
public class UserPreferencesController {

    private final UserPreferencesService preferencesService;
    private final UsuarioRepository usuarioRepository;

    @GetMapping("/preferences")
    @PreAuthorize("isAuthenticated()")
    public UserPreferencesDTO get() {
        return preferencesService.read(currentUserId());
    }

    @PutMapping("/preferences")
    @PreAuthorize("isAuthenticated()")
    public UserPreferencesDTO update(@Valid @RequestBody UserPreferencesUpdateRequest body) {
        return preferencesService.update(currentUserId(), body);
    }

    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public UserPreferencesDTO uploadAvatar(@RequestParam("image") MultipartFile image) {
        try {
            return preferencesService.setAvatar(
                currentUserId(),
                image.getBytes(),
                image.getContentType()
            );
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Error al leer la imagen", e);
        }
    }

    @DeleteMapping("/avatar")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteAvatar() {
        preferencesService.clearAvatar(currentUserId());
        return ResponseEntity.noContent().build();
    }

    private Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesión no válida");
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof UsuarioModel u) {
            return u.getId();
        }
        String username = principal != null ? principal.toString() : auth.getName();
        UsuarioModel u = usuarioRepository.findByUsername(username)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));
        return u.getId();
    }
}
