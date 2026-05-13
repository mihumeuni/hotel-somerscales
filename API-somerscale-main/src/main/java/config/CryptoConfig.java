package config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import security.CryptoKeys;

import java.util.Base64;

@Configuration
public class CryptoConfig {

    @Value("${app.encryption.key:}")
    private String aesKeyBase64;

    @Value("${app.hmac.key:}")
    private String hmacKeyBase64;

    @PostConstruct
    public void initialise() {
        byte[] aes = decode("app.encryption.key", aesKeyBase64);
        byte[] hmac = decode("app.hmac.key", hmacKeyBase64);
        CryptoKeys.init(aes, hmac);
    }

    private static byte[] decode(String propName, String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(propName + " is required (base64-encoded 32 bytes).");
        }
        byte[] raw;
        try {
            raw = Base64.getDecoder().decode(value);
        } catch (IllegalArgumentException ex) {
            throw new IllegalStateException(propName + " is not valid base64", ex);
        }
        if (raw.length != 32) {
            throw new IllegalStateException(propName + " must decode to 32 bytes; got " + raw.length);
        }
        return raw;
    }
}
