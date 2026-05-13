package security;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;

// Deterministic 64-char lowercase hex digest. Used as the sidecar lookup key
// for AES-GCM-encrypted columns whose ciphertext changes on every write.
public final class HmacUtil {

    private static final String ALG = "HmacSHA256";

    private HmacUtil() {}

    public static String hmacSha256Hex(String plaintext) {
        if (plaintext == null) {
            return null;
        }
        try {
            Mac mac = Mac.getInstance(ALG);
            mac.init(new SecretKeySpec(CryptoKeys.hmacKey(), ALG));
            byte[] digest = mac.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(digest.length * 2);
            for (byte b : digest) {
                sb.append(Character.forDigit((b >> 4) & 0xF, 16));
                sb.append(Character.forDigit(b & 0xF, 16));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("HmacSHA256 not available", ex);
        } catch (InvalidKeyException ex) {
            throw new IllegalStateException("Invalid HMAC key", ex);
        }
    }
}
