package security;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.Base64;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class EncryptedStringConverterTest {

    private static final byte[] TEST_AES = new byte[32];
    private static final byte[] TEST_HMAC = new byte[32];

    private final EncryptedStringConverter converter = new EncryptedStringConverter();

    @BeforeAll
    static void initKeys() {
        for (int i = 0; i < 32; i++) {
            TEST_AES[i] = (byte) i;
            TEST_HMAC[i] = (byte) (i + 100);
        }
        CryptoKeys.init(TEST_AES, TEST_HMAC);
    }

    @Test
    void roundTrip_preservesPlaintext() {
        String plaintext = "12.345.678-9";
        String ciphertext = converter.convertToDatabaseColumn(plaintext);
        String decrypted = converter.convertToEntityAttribute(ciphertext);
        assertEquals(plaintext, decrypted);
    }

    @Test
    void encrypt_producesDifferentCiphertextEachCall() {
        String plaintext = "12.345.678-9";
        String first = converter.convertToDatabaseColumn(plaintext);
        String second = converter.convertToDatabaseColumn(plaintext);
        assertNotEquals(first, second, "Random IV must yield different ciphertext per call");
    }

    @Test
    void convertToDatabaseColumn_outputIsBase64() {
        String ciphertext = converter.convertToDatabaseColumn("12.345.678-9");
        assertTrue(ciphertext.matches("^[A-Za-z0-9+/=]+$"), "Output must be base64: " + ciphertext);
    }

    @Test
    void convertToDatabaseColumn_payloadIsIvPlusCiphertextPlusTag() {
        String plaintext = "12.345.678-9";
        String ciphertext = converter.convertToDatabaseColumn(plaintext);
        byte[] decoded = Base64.getDecoder().decode(ciphertext);
        int plaintextUtf8Length = plaintext.getBytes(java.nio.charset.StandardCharsets.UTF_8).length;
        int expectedMinimum = 12 + plaintextUtf8Length + 16; // IV(12) + ciphertext(N) + GCM tag(16)
        assertTrue(decoded.length >= expectedMinimum,
            "Decoded payload " + decoded.length + " bytes < expected minimum " + expectedMinimum);
    }

    @Test
    void null_inputReturnsNull() {
        assertNull(converter.convertToDatabaseColumn(null));
        assertNull(converter.convertToEntityAttribute(null));
    }

    @Test
    void tamperedCiphertext_throws() {
        String bogus = Base64.getEncoder().encodeToString(new byte[28]);
        assertThrows(IllegalStateException.class, () -> converter.convertToEntityAttribute(bogus));
    }
}
