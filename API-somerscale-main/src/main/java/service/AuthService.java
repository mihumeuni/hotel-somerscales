package service;

import dto.AuthRequest;
import dto.AuthResponse;
import lombok.RequiredArgsConstructor;
import model.UsuarioModel;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import repository.UsuarioRepository;
import security.JwtService;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository userRepository;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse login(AuthRequest request) {

        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        UsuarioModel user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Usuario no encontrado: " + request.getUsername()));

        String token = jwtService.generateToken(user, auth.getAuthorities());

        List<String> perms = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();

        return AuthResponse.builder()
                .token(token)
                .role(user.getRole().getName())
                .permissions(perms)
                .build();
    }
}
