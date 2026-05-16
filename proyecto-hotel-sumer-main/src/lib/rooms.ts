// Cloudbeds room codes ship as HA1 / HA4 / HA5; the operator and printed
// sheets use H1 / H4 / H5. The BE serializer (RoomNumberSerializer) already
// normalizes on the way out — this is a defensive belt-and-braces helper for
// any FE-side string that bypasses the API (e.g. data pasted from a CSV).
export function normalizeRoomNumber(raw: string | null | undefined): string {
  if (raw == null) return "";
  const trimmed = raw.trim();
  if (
    trimmed.length >= 3 &&
    (trimmed[0] === "H" || trimmed[0] === "h") &&
    (trimmed[1] === "A" || trimmed[1] === "a") &&
    /\d/.test(trimmed[2])
  ) {
    return trimmed[0] + trimmed.slice(2);
  }
  return trimmed;
}
