package security;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

// AES-GCM is non-deterministic: same plaintext encrypts differently each call,
// so equality lookups on encrypted columns require a sidecar HMAC (see HmacUtil).
// Column payload layout is Base64( IV(12) || ciphertext(N) || tag(16) ).
@Converter
public class EncryptedStringConverter implements AttributeConverter<String, String> {

    private static final String TRANSFORM = "AES/GCM/NoPadding";
    private static final int IV_BYTES = 12;
    private static final int TAG_BITS = 128;
    private static final SecureRandom RNG = new SecureRandom();

    @Override
    public String convertToDatabaseColumn(String plaintext) {
        if (plaintext == null) {
            return null;
        }
        try {
            byte[] iv = new byte[IV_BYTES];
            RNG.nextBytes(iv);
            Cipher cipher = Cipher.getInstance(TRANSFORM);
            cipher.init(Cipher.ENCRYPT_MODE,
                new SecretKeySpec(CryptoKeys.aesKey(), "AES"),
                new GCMParameterSpec(TAG_BITS, iv));
            byte[] ct = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
            byte[] out = new byte[iv.length + ct.length];
            System.arraycopy(iv, 0, out, 0, iv.length);
            System.arraycopy(ct, 0, out, iv.length, ct.length);
            return Base64.getEncoder().encodeToString(out);
        } catch (Exception ex) {
            throw new IllegalStateException("AES-GCM encryption failed", ex);
        }
    }

    @Override
    public String convertToEntityAttribute(String dbValue) {
        if (dbValue == null) {
            return null;
        }
        try {
            byte[] in = Base64.getDecoder().decode(dbValue);
            if (in.length < IV_BYTES + (TAG_BITS / 8)) {
                throw new IllegalStateException("Encrypted payload too short");
            }
            byte[] iv = new byte[IV_BYTES];
            System.arraycopy(in, 0, iv, 0, IV_BYTES);
            byte[] ct = new byte[in.length - IV_BYTES];
            System.arraycopy(in, IV_BYTES, ct, 0, ct.length);
            Cipher cipher = Cipher.getInstance(TRANSFORM);
            cipher.init(Cipher.DECRYPT_MODE,
                new SecretKeySpec(CryptoKeys.aesKey(), "AES"),
                new GCMParameterSpec(TAG_BITS, iv));
            byte[] pt = cipher.doFinal(ct);
            return new String(pt, StandardCharsets.UTF_8);
        } catch (Exception ex) {
            throw new IllegalStateException("AES-GCM decryption failed", ex);
        }
    }
}
