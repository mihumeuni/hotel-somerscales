package service.cloudbeds;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

public final class CloudbedsParsers {

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("d/M/yyyy");

    private CloudbedsParsers() {}

    public static String trimToNull(String raw) {
        if (raw == null) return null;
        String t = raw.trim();
        return t.isEmpty() || "-".equals(t) ? null : t;
    }

    public static LocalDate parseDate(String raw) {
        String t = trimToNull(raw);
        if (t == null) return null;
        try {
            return LocalDate.parse(t, DATE);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Tolerant decimal parser. Handles both US-style "252.46" and
     * ES-style "1.234,56". Returns null for blank or non-numeric input.
     */
    public static BigDecimal parseDecimal(String raw) {
        String t = trimToNull(raw);
        if (t == null) return null;
        String normalized;
        boolean hasComma = t.indexOf(',') >= 0;
        boolean hasDot   = t.indexOf('.') >= 0;
        if (hasComma && hasDot) {
            // "1.234,56" — dots are thousand separators, comma is decimal.
            normalized = t.replace(".", "").replace(",", ".");
        } else if (hasComma) {
            normalized = t.replace(",", ".");
        } else {
            normalized = t;
        }
        try {
            return new BigDecimal(normalized);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    public static Integer parseInt(String raw) {
        String t = trimToNull(raw);
        if (t == null) return null;
        try {
            return Integer.parseInt(t);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * Map a Cloudbeds "Fuente" string to our normalized origenReserva enum-ish value.
     * The raw string is kept separately on {@code procedencia}.
     */
    public static String normalizeFuente(String raw) {
        String t = trimToNull(raw);
        if (t == null) return "MANUAL";
        String lower = t.toLowerCase();
        if (lower.startsWith("booking"))    return "BOOKING";
        if (lower.contains("tripadvisor"))  return "TRIPADVISOR";
        if (lower.contains("cloudbeds"))    return "CLOUDBEDS";
        if (lower.contains("expedia"))      return "WEB";
        if (lower.contains("airbnb"))       return "WEB";
        if (lower.contains("manual"))       return "MANUAL";
        if (lower.contains("direct") || lower.contains("directa")) return "WEB";
        return "WEB";
    }

    /**
     * Normalize Cloudbeds tipo de documento strings to known short codes.
     * Unknown values pass through trimmed; "-" / blank → null.
     */
    public static String normalizeTipoDocumento(String raw) {
        String t = trimToNull(raw);
        if (t == null) return null;
        String upper = t.toUpperCase();
        if (upper.contains("DNI"))        return "DNI";
        if (upper.contains("RUT"))        return "RUT";
        if (upper.contains("PASAPORTE") || upper.contains("PASSPORT")) return "PASAPORTE";
        return t.length() > 20 ? t.substring(0, 20) : t;
    }
}
