// Manejo de autenticación de la aplicacion.
// DTO = data transfer object, es un objeto que se utiliza para transferir datos entre capas de la aplicacion.

package controller;

import dto.AuthRequest;
import dto.AuthResponse;
import service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public AuthResponse login(@RequestBody AuthRequest request) {
        return authService.login(request);
    }
}