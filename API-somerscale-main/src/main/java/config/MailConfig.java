package config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

/**
 * Configuracion de envio de correos.
 *
 * En el perfil 'dev' se registra el contenido del correo en el log en lugar
 * de enviarlo por SMTP. Esto permite probar el flujo completo de invitaciones
 * sin disponer todavia de credenciales de Brevo.
 *
 * Cuando Spring carga otro perfil (por ejemplo 'prod'), Spring Boot
 * autoconfigura un JavaMailSenderImpl basado en las propiedades
 * spring.mail.*; no se requiere ninguna bean explicita aqui.
 */
@Configuration
public class MailConfig {

    private static final Logger log = LoggerFactory.getLogger(MailConfig.class);

    @Bean
    @Primary
    @Profile("dev")
    public JavaMailSender devMailSender() {
        return new JavaMailSenderImpl() {
            @Override
            public void send(SimpleMailMessage... simpleMessages) {
                for (SimpleMailMessage m : simpleMessages) {
                    String to = m.getTo() != null ? String.join(",", m.getTo()) : "(none)";
                    log.info(
                        "[DEV-MAIL] to={} from={} subject={}\n----- body -----\n{}\n----------------",
                        to, m.getFrom(), m.getSubject(), m.getText()
                    );
                }
            }
        };
    }
}
