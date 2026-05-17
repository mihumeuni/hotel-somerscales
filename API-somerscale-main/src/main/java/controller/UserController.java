package controller;

import dto.UpdateMeRequest;
import dto.UpdateUserRequest;
import dto.UserDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import model.RoleEntity;
import model.UsuarioModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import repository.FichaRepository;
import repository.RoleRepository;
import repository.UsuarioRepository;
import service.InvitationService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UsuarioRepository usuarioRepository;
    private final RoleRepository roleRepository;
    private final InvitationService invitationService;
    private final PasswordEncoder passwordEncoder;
    private final FichaRepository fichaRepository;

    @GetMapping
    @PreAuthorize("hasAuthority('user.invite') or hasAuthority('user.manage')")
    public List<UserDTO> list() {
        Map<Long, Long> sheetCounts = new HashMap<>();
        for (var row : fichaRepository.countSheetsGroupedByOwner()) {
            sheetCounts.put(row.getOwnerId(), row.getTotal());
        }
        return usuarioRepository
            .findAllByDisabledFalseOrderByRoleNameAscNombreAsc()
            .stream()
            .map(u -> toDTO(u, sheetCounts.getOrDefault(u.getId(), 0L)))
            .toList();
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public UserDTO me() {
        UsuarioModel me = currentUser();
        return toDTO(me, fichaRepository.countByOwnerId(me.getId()));
    }

    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Transactional
    public UserDTO updateMe(@Valid @RequestBody UpdateMeRequest body) {
        UsuarioModel me = currentUser();

        if (!body.getEmail().equalsIgnoreCase(me.getEmail())
            && usuarioRepository.existsByEmail(body.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Ese email ya está en uso");
        }

        me.setNombre(body.getName());
        me.setEmail(body.getEmail());
        me.setTelefono(blankToNull(body.getPhone()));

        if (anyNonBlank(body.getCurrentPassword(), body.getNewPassword(), body.getConfirmPassword())) {
            if (isBlank(body.getCurrentPassword())
                || isBlank(body.getNewPassword())
                || isBlank(body.getConfirmPassword())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Para cambiar la contraseña completa los tres campos");
            }
            if (!body.getNewPassword().equals(body.getConfirmPassword())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La confirmación no coincide");
            }
            if (body.getNewPassword().length() < 8) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La nueva contraseña debe tener al menos 8 caracteres");
            }
            if (!passwordEncoder.matches(body.getCurrentPassword(), me.getPassword())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La contraseña actual no coincide");
            }
            me.setPassword(passwordEncoder.encode(body.getNewPassword()));
        }

        UsuarioModel saved = usuarioRepository.save(me);
        return toDTO(saved, fichaRepository.countByOwnerId(saved.getId()));
    }

    @GetMapping("/{id:\\d+}")
    @PreAuthorize("hasAuthority('user.manage')")
    public UserDTO getById(@PathVariable Long id) {
        UsuarioModel u = usuarioRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        return toDTO(u, fichaRepository.countByOwnerId(u.getId()));
    }

    @PutMapping("/{id:\\d+}")
    @PreAuthorize("hasAuthority('user.manage')")
    @Transactional
    public UserDTO updateById(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest req) {
        UsuarioModel target = usuarioRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        UsuarioModel me = currentUser();
        boolean editingSelf = me.getId().equals(target.getId());

        // Email uniqueness across other rows.
        if (!req.getEmail().equalsIgnoreCase(target.getEmail())
            && usuarioRepository.existsByEmail(req.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Ese email ya está en uso");
        }

        target.setNombre(req.getName());
        target.setEmail(req.getEmail());
        target.setTelefono(blankToNull(req.getPhone()));

        // Role swap. Block demoting a system-admin (would lock everyone out) and
        // block self-demotion to enforce the same invariant from the other side.
        RoleEntity newRole = roleRepository.findByName(req.getRole())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Rol no encontrado: " + req.getRole()));

        boolean roleChanged = target.getRole() == null
            || !target.getRole().getId().equals(newRole.getId());

        if (roleChanged
            && target.getRole() != null
            && target.getRole().isSystemAdmin()
            && !newRole.isSystemAdmin()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "No se puede quitar el rol de administrador del sistema");
        }
        if (roleChanged && editingSelf) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "No puedes cambiar tu propio rol; usa /me");
        }
        target.setRole(newRole);

        UsuarioModel saved = usuarioRepository.save(target);
        return toDTO(saved, fichaRepository.countByOwnerId(saved.getId()));
    }

    @PostMapping("/{id:\\d+}/reset-password")
    @PreAuthorize("hasAuthority('user.manage')")
    public ResponseEntity<Void> resetPassword(@PathVariable Long id) {
        invitationService.resetPasswordFor(id);
        return ResponseEntity.accepted().build();
    }

    @DeleteMapping("/{id:\\d+}")
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

    private UsuarioModel currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesión no válida");
        }
        Object principal = auth.getPrincipal();
        // JwtValidador sets the principal as a UsuarioModel directly; fall back
        // to username string for any other flow.
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

    private static UserDTO toDTO(UsuarioModel u, long sheetCount) {
        return UserDTO.builder()
            .id(u.getId())
            .name(u.getNombre())
            .username(u.getUsername())
            .email(u.getEmail() != null ? u.getEmail() : u.getUsername())
            .phone(u.getTelefono())
            .role(u.getRole() != null ? u.getRole().getName() : null)
            .createdAt(u.getCreatedAt())
            .sheetCount(sheetCount)
            .build();
    }

    private static boolean isBlank(String s) { return s == null || s.isBlank(); }
    private static boolean anyNonBlank(String... values) {
        for (String v : values) if (!isBlank(v)) return true;
        return false;
    }
    private static String blankToNull(String s) { return isBlank(s) ? null : s; }
}
