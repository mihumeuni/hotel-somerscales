package security;

import model.UsuarioModel;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;

@Service
public class JwtService {

    private static final String SECRET_KEY = "mi_clave_secreta_super_segura_12345678901234567890";
    private static final long EXPIRATION_TIME = 1000 * 60 * 60; // 1 hora

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(SECRET_KEY.getBytes());
    }

    //  Generar token
    public String generateToken(UsuarioModel user) {
        return Jwts.builder()
                .setSubject(user.getUsername())
                .claim("role", user.getRolmodel().name())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    //  Extraer username
    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    //  Validar token
    public boolean isTokenValid(String token, UsuarioModel user) {
        final String username = extractUsername(token);
        return username.equals(user.getUsername()) && !isTokenExpired(token);
    }

    //  Verificar expiración
    private boolean isTokenExpired(String token) {
        return extractAllClaims(token).getExpiration().before(new Date());
    }

    //  Obtener datos del token
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}