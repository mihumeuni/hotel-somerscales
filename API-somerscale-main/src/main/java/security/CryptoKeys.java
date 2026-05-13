package security;

// JPA AttributeConverters cannot receive Spring DI, so AES + HMAC keys are
// held statically and populated once at startup by config.CryptoConfig.
public final class CryptoKeys {

    private static volatile byte[] aesKey;
    private static volatile byte[] hmacKey;

    private CryptoKeys() {}

    public static void init(byte[] aes, byte[] hmac) {
        aesKey = aes.clone();
        hmacKey = hmac.clone();
    }

    public static byte[] aesKey() {
        byte[] k = aesKey;
        if (k == null) {
            throw new IllegalStateException("AES key not initialised. Check APP_ENCRYPTION_KEY env var.");
        }
        return k;
    }

    public static byte[] hmacKey() {
        byte[] k = hmacKey;
        if (k == null) {
            throw new IllegalStateException("HMAC key not initialised. Check APP_HMAC_KEY env var.");
        }
        return k;
    }
}
