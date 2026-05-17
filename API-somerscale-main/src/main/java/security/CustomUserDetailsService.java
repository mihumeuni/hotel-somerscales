package security;

import lombok.RequiredArgsConstructor;
import model.PermissionModel;
import model.UsuarioModel;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import repository.PermissionRepository;
import repository.RolePermissionRepository;
import repository.UsuarioRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final PermissionRepository permissionRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UsuarioModel user = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Usuario no encontrado: " + username));

        // System-admin role always carries every permission, regardless of
        // what role_permissions stores. This guarantees admins keep access
        // when a new permission row is added by a future migration.
        List<String> codes = user.getRole().isSystemAdmin()
                ? permissionRepository.findAll().stream().map(PermissionModel::getCode).toList()
                : rolePermissionRepository.findCodesByRoleId(user.getRole().getId());

        List<SimpleGrantedAuthority> authorities = codes.stream()
                .map(SimpleGrantedAuthority::new)
                .toList();

        return new User(user.getUsername(), user.getPassword(), authorities);
    }
}
