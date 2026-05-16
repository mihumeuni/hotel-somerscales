package config;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;

import java.io.IOException;

// Strips the leading "A" Cloudbeds prepends to room codes ("HA5" → "H5") so
// every consumer of `reservas` sees the H# format the operator uses on
// printed sheets and in conversation. Serialize-only: ingest paths keep the
// raw Cloudbeds value to preserve round-tripping with the upstream PMS.
public class RoomNumberSerializer extends JsonSerializer<String> {

    @Override
    public void serialize(String value, JsonGenerator gen, SerializerProvider serializers) throws IOException {
        if (value == null) {
            gen.writeNull();
            return;
        }
        gen.writeString(normalize(value));
    }

    public static String normalize(String raw) {
        if (raw == null) {
            return null;
        }
        String trimmed = raw.trim();
        if (trimmed.length() >= 3 && (trimmed.charAt(0) == 'H' || trimmed.charAt(0) == 'h')
                && (trimmed.charAt(1) == 'A' || trimmed.charAt(1) == 'a')
                && Character.isDigit(trimmed.charAt(2))) {
            return trimmed.charAt(0) + trimmed.substring(2);
        }
        return trimmed;
    }
}
