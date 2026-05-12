package security;

import lombok.RequiredArgsConstructor;
import model.UsuarioModel;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import repository.RolePermissionRepository;
import repository.UsuarioRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;
    private final RolePermissionRepository rolePermissionRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UsuarioModel user = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Usuario no encontrado: " + username));

        List<SimpleGrantedAuthority> authorities = rolePermissionRepository
                .findCodesByRole(user.getRolmodel())
                .stream()
                .map(SimpleGrantedAuthority::new)
                .toList();

        return new User(user.getUsername(), user.getPassword(), authorities);
    }
}
