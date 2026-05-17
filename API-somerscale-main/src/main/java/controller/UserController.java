package controller;

import dto.UserDTO;
import lombok.RequiredArgsConstructor;
import model.UsuarioModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import repository.UsuarioRepository;
import service.InvitationService;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UsuarioRepository usuarioRepository;
    private final InvitationService invitationService;

    @GetMapping
    @PreAuthorize("hasAuthority('user.invite') or hasAuthority('user.manage')")
    public List<UserDTO> list() {
        return usuarioRepository
            .findAllByDisabledFalseOrderByRoleNameAscNombreAsc()
            .stream()
            .map(UserController::toDTO)
            .toList();
    }

    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasAuthority('user.manage')")
    public ResponseEntity<Void> resetPassword(@PathVariable Long id) {
        invitationService.resetPasswordFor(id);
        return ResponseEntity.accepted().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('user.manage')")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        UsuarioModel user = usuarioRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Usuario no encontrado"
            ));
        if (user.getRole() != null && user.getRole().isSystemAdmin()) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "No se puede eliminar a un administrador del sistema"
            );
        }
        user.setDisabled(true);
        usuarioRepository.save(user);
        return ResponseEntity.noContent().build();
    }

    private static UserDTO toDTO(UsuarioModel u) {
        return UserDTO.builder()
            .id(u.getId())
            .name(u.getNombre())
            .email(u.getEmail() != null ? u.getEmail() : u.getUsername())
            .phone(u.getTelefono())
            .role(u.getRole() != null ? u.getRole().getName() : null)
            .sheetCount(0L)
            .build();
    }
}
