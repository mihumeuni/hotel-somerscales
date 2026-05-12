package service;

import dto.InvitationRequest;
import lombok.RequiredArgsConstructor;
import model.InvitationModel;
import model.UsuarioModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import repository.InvitationRepository;
import repository.UsuarioRepository;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class InvitationService {

    private static final SecureRandom RNG = new SecureRandom();

    private final InvitationRepository invitationRepository;
    private final UsuarioRepository usuarioRepository;
    private final JavaMailSender mailSender;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.invitation.ttl-hours:72}")
    private long ttlHours;

    @Value("${app.invitation.sender-email:no-reply@somerscales.local}")
    private String senderEmail;

    @Value("${app.invitation.sender-name:Somerscales}")
    private String senderName;

    @Value("${app.frontend-base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Transactional
    public String inviteUser(InvitationRequest req) {
        String email = req.getEmail().trim().toLowerCase();

        if (usuarioRepository.existsByEmail(email) || usuarioRepository.existsByUsername(email)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Ya existe un usuario con ese correo"
            );
        }

        Optional<InvitationModel> existing = invitationRepository.findByEmail(email);

        String rawToken = generateRawToken();
        String hash = sha256Hex(rawToken);
        Instant now = Instant.now();
        Instant expires = now.plus(ttlHours, ChronoUnit.HOURS);

        InvitationModel inv = existing.orElseGet(InvitationModel::new);
        inv.setEmail(email);
        inv.setNombre(req.getNombre());
        inv.setTelefono(req.getTelefono());
        inv.setRole(req.getRole());
        inv.setTokenHash(hash);
        inv.setCreatedAt(now);
        inv.setExpiresAt(expires);
        inv.setConsumedAt(null);
        invitationRepository.save(inv);

        sendInvitationEmail(inv, rawToken);
        return email;
    }

    @Transactional
    public void consume(String rawToken, String newPassword) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token invalido");
        }

        String hash = sha256Hex(rawToken);
        InvitationModel inv = invitationRepository.findByTokenHash(hash)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Token invalido"
            ));

        if (inv.getConsumedAt() != null) {
            throw new ResponseStatusException(HttpStatus.GONE, "La invitacion ya fue usada");
        }
        if (inv.getExpiresAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.GONE, "La invitacion ha expirado");
        }
        if (usuarioRepository.existsByEmail(inv.getEmail())
                || usuarioRepository.existsByUsername(inv.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Usuario ya existe");
        }

        UsuarioModel user = UsuarioModel.builder()
            .username(inv.getEmail())
            .password(passwordEncoder.encode(newPassword))
            .rolmodel(inv.getRole())
            .email(inv.getEmail())
            .nombre(inv.getNombre())
            .telefono(inv.getTelefono())
            .build();
        usuarioRepository.save(user);

        inv.setConsumedAt(Instant.now());
        invitationRepository.save(inv);
    }

    private void sendInvitationEmail(InvitationModel inv, String rawToken) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(senderName + " <" + senderEmail + ">");
        msg.setTo(inv.getEmail());
        msg.setSubject("Invitación al panel de Somerscales");

        String link = frontendBaseUrl + "/signup-finish?token=" + rawToken;
        String body = "Hola " + inv.getNombre() + ",\n\n"
            + "Has sido invitado/a a unirte al panel de Somerscales con el rol de "
            + inv.getRole().name() + ".\n"
            + "Activa tu cuenta y elige una contraseña en el siguiente enlace\n"
            + "(válido durante " + ttlHours + " horas):\n\n"
            + link + "\n\n"
            + "Si no esperabas esta invitación, ignora este mensaje.";
        msg.setText(body);

        try {
            mailSender.send(msg);
        } catch (Exception ex) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "No se pudo enviar el correo de invitación: " + ex.getMessage(),
                ex
            );
        }
    }

    private static String generateRawToken() {
        byte[] bytes = new byte[32];
        RNG.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String sha256Hex(String s) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(s.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(digest.length * 2);
            for (byte b : digest) {
                sb.append(Character.forDigit((b >> 4) & 0xF, 16));
                sb.append(Character.forDigit(b & 0xF, 16));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
