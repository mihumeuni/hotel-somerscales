package service;

import com.fasterxml.jackson.databind.ObjectMapper;
import dto.InvitationRequest;
import lombok.RequiredArgsConstructor;
import model.InvitationModel;
import model.RoleEntity;
import model.UsuarioModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import repository.InvitationRepository;
import repository.RoleRepository;
import repository.UsuarioRepository;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class InvitationService {

    private static final Logger log = LoggerFactory.getLogger(InvitationService.class);

    private static final SecureRandom RNG = new SecureRandom();

    private static final HttpClient HTTP_CLIENT = HttpClient.newHttpClient();

    private static final URI RESEND_ENDPOINT = URI.create("https://api.resend.com/emails");

    // Owned ObjectMapper instance instead of constructor-injecting Spring's
    // bean. Spring Boot 4's webmvc starter does not register a default
    // ObjectMapper bean, and adding spring-boot-starter-json pulls in extra
    // autoconfig we don't need. Jackson's ObjectMapper is thread-safe after
    // configuration, so a static singleton is appropriate here.
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final InvitationRepository invitationRepository;
    private final UsuarioRepository usuarioRepository;
    private final RoleRepository roleRepository;
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

    @Value("${integrations.resend.api-key:}")
    private String resendApiKey;

    @Value("${integrations.resend.from:onboarding@resend.dev}")
    private String resendFrom;

    @Transactional
    public String inviteUser(InvitationRequest req) {
        String email = req.getEmail().trim().toLowerCase();

        if (usuarioRepository.existsByEmail(email) || usuarioRepository.existsByUsername(email)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Ya existe un usuario con ese correo"
            );
        }

        RoleEntity role = roleRepository.findByName(req.getRole().trim())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Rol desconocido: " + req.getRole()
            ));

        Optional<InvitationModel> existing = invitationRepository.findByEmail(email);

        String rawToken = generateRawToken();
        String hash = sha256Hex(rawToken);
        Instant now = Instant.now();
        Instant expires = now.plus(ttlHours, ChronoUnit.HOURS);

        InvitationModel inv = existing.orElseGet(InvitationModel::new);
        inv.setEmail(email);
        inv.setNombre(req.getNombre());
        inv.setTelefono(req.getTelefono());
        inv.setRole(role);
        inv.setTokenHash(hash);
        inv.setCreatedAt(now);
        inv.setExpiresAt(expires);
        inv.setConsumedAt(null);
        inv.setReset(false);
        invitationRepository.save(inv);

        sendInvitationEmail(inv, rawToken, false);
        return email;
    }

    @Transactional
    public String resetPasswordFor(Long userId) {
        UsuarioModel user = usuarioRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Usuario no encontrado"
            ));
        if (user.isDisabled()) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT, "El usuario esta deshabilitado"
            );
        }

        String email = user.getEmail() != null ? user.getEmail() : user.getUsername();

        // Reuse the invitations row keyed by email — schema enforces unique
        // email, so an old invite for the same person becomes the carrier
        // for the reset token. This keeps the table single-purpose without
        // a parallel "password_resets" table.
        Optional<InvitationModel> existing = invitationRepository.findByEmail(email);

        String rawToken = generateRawToken();
        String hash = sha256Hex(rawToken);
        Instant now = Instant.now();
        Instant expires = now.plus(ttlHours, ChronoUnit.HOURS);

        InvitationModel inv = existing.orElseGet(InvitationModel::new);
        inv.setEmail(email);
        inv.setNombre(user.getNombre() != null ? user.getNombre() : email);
        inv.setTelefono(user.getTelefono());
        inv.setRole(user.getRole());
        inv.setTokenHash(hash);
        inv.setCreatedAt(now);
        inv.setExpiresAt(expires);
        inv.setConsumedAt(null);
        inv.setReset(true);
        invitationRepository.save(inv);

        sendInvitationEmail(inv, rawToken, true);
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

        Optional<UsuarioModel> existingUser = usuarioRepository.findByEmail(inv.getEmail());

        if (inv.isReset()) {
            // Reset path: user must still exist; only update password.
            UsuarioModel user = existingUser
                .or(() -> usuarioRepository.findByUsername(inv.getEmail()))
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.GONE, "El usuario ya no existe"
                ));
            user.setPassword(passwordEncoder.encode(newPassword));
            usuarioRepository.save(user);
        } else {
            // Invite path: user must not exist yet.
            if (existingUser.isPresent()
                    || usuarioRepository.existsByUsername(inv.getEmail())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Usuario ya existe");
            }
            UsuarioModel user = UsuarioModel.builder()
                .username(inv.getEmail())
                .password(passwordEncoder.encode(newPassword))
                .role(inv.getRole())
                .email(inv.getEmail())
                .nombre(inv.getNombre())
                .telefono(inv.getTelefono())
                .build();
            usuarioRepository.save(user);
        }

        inv.setConsumedAt(Instant.now());
        invitationRepository.save(inv);
    }

    private void sendInvitationEmail(InvitationModel inv, String rawToken, boolean reset) {
        String subject = reset
            ? "Restablecer contraseña — Somerscales"
            : "Invitación al panel de Somerscales";
        String link = frontendBaseUrl + "/signup-finish?token=" + rawToken;
        String body = reset
            ? "Hola " + inv.getNombre() + ",\n\n"
                + "Se ha solicitado restablecer la contraseña de tu cuenta en el panel de "
                + "Somerscales. Elige una contraseña nueva en el siguiente enlace\n"
                + "(válido durante " + ttlHours + " horas):\n\n"
                + link + "\n\n"
                + "Si tú no solicitaste el cambio, ignora este mensaje y tu contraseña "
                + "actual seguirá siendo válida."
            : "Hola " + inv.getNombre() + ",\n\n"
                + "Has sido invitado/a a unirte al panel de Somerscales con el rol de "
                + inv.getRole().getName() + ".\n"
                + "Activa tu cuenta y elige una contraseña en el siguiente enlace\n"
                + "(válido durante " + ttlHours + " horas):\n\n"
                + link + "\n\n"
                + "Si no esperabas esta invitación, ignora este mensaje.";

        // Send asynchronously on a fresh thread. HF Spaces' edge proxy kills
        // upstream requests at ~12s and returns an opaque 403 to the client,
        // so a synchronous outbound call (SMTP cold TLS handshake or even a
        // slow Resend HTTP round-trip) made the controller appear to fail
        // even though the invitation row was already committed. Returning
        // 202 first and doing the network call in the background avoids the
        // proxy timeout entirely; failures are logged loudly so we can spot
        // them in HF's Logs tab.
        new Thread(() -> {
            try {
                if (resendApiKey != null && !resendApiKey.isBlank()) {
                    sendViaResend(inv.getEmail(), subject, body);
                } else {
                    sendViaSmtp(inv.getEmail(), subject, body);
                }
            } catch (Exception ex) {
                log.error("Invite delivery failed for {}", inv.getEmail(), ex);
            }
        }, "invite-mail-" + inv.getEmail()).start();
    }

    private void sendViaSmtp(String toEmail, String subject, String body) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(senderName + " <" + senderEmail + ">");
        msg.setTo(toEmail);
        msg.setSubject(subject);
        msg.setText(body);
        try {
            mailSender.send(msg);
            log.info("Invitation email sent to {} (SMTP)", toEmail);
        } catch (Exception ex) {
            log.error("SMTP send failed for invite to {}", toEmail, ex);
        }
    }

    // HF Spaces blocks outbound SMTP entirely (port 587 STARTTLS and 465 SSL
    // both timeout at TCP connect), so the production path uses Resend's
    // HTTPS API. Sandbox sender onboarding@resend.dev only reaches the
    // Resend account owner; once a custom domain is verified, set
    // RESEND_FROM=Somerscales <noreply@your-domain> on the host.
    private void sendViaResend(String toEmail, String subject, String body) {
        String json;
        try {
            json = OBJECT_MAPPER.writeValueAsString(Map.of(
                "from", resendFrom,
                "to", List.of(toEmail),
                "subject", subject,
                "text", body
            ));
        } catch (Exception ex) {
            log.error("Resend JSON encoding failed for invite to {}", toEmail, ex);
            return;
        }

        HttpRequest req = HttpRequest.newBuilder()
            .uri(RESEND_ENDPOINT)
            .header("Authorization", "Bearer " + resendApiKey)
            .header("Content-Type", "application/json")
            .timeout(Duration.ofSeconds(15))
            .POST(HttpRequest.BodyPublishers.ofString(json, StandardCharsets.UTF_8))
            .build();

        try {
            HttpResponse<String> resp = HTTP_CLIENT.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() / 100 == 2) {
                log.info("Resend accepted invite to {} (status {})", toEmail, resp.statusCode());
            } else {
                log.error("Resend rejected invite to {}: status {} body {}",
                    toEmail, resp.statusCode(), resp.body());
            }
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            log.error("Resend HTTP send interrupted for invite to {}", toEmail, ex);
        } catch (Exception ex) {
            log.error("Resend HTTP call failed for invite to {}", toEmail, ex);
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
