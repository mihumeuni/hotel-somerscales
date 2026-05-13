package security;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class HmacUtilTest {

    private static final byte[] TEST_AES = new byte[32];
    private static final byte[] TEST_HMAC = new byte[32];

    @BeforeAll
    static void initKeys() {
        for (int i = 0; i < 32; i++) {
            TEST_AES[i] = (byte) i;
            TEST_HMAC[i] = (byte) (i + 100);
        }
        CryptoKeys.init(TEST_AES, TEST_HMAC);
    }

    @Test
    void hmacSha256Hex_isDeterministic() {
        String first = HmacUtil.hmacSha256Hex("12.345.678-9");
        String second = HmacUtil.hmacSha256Hex("12.345.678-9");
        assertEquals(first, second);
    }

    @Test
    void hmacSha256Hex_returns64LowercaseHex() {
        String digest = HmacUtil.hmacSha256Hex("12.345.678-9");
        assertTrue(digest.matches("^[a-f0-9]{64}$"), "Expected 64-char lowercase hex, got: " + digest);
    }

    @Test
    void hmacSha256Hex_null_returnsNull() {
        assertNull(HmacUtil.hmacSha256Hex(null));
    }
}
