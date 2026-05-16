// Hash-based avatar colour pickup so the same guest gets the same accent
// across widgets. The wireframe cycles marine / gold / terracotta — keeping
// the palette deliberately small.
const AVATAR_PALETTE = ["marine", "gold", "terracotta"] as const;
export type AvatarColor = (typeof AVATAR_PALETTE)[number];

export function pickAvatarColor(seed: string | number): AvatarColor {
  const str = String(seed ?? "");
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

export function avatarClasses(color: AvatarColor): string {
  switch (color) {
    case "gold":
      return "bg-[var(--color-gold)]/15 border-[var(--color-gold)]/30 text-[var(--color-gold)]";
    case "terracotta":
      return "bg-[var(--color-terracotta)]/10 border-[var(--color-terracotta)]/30 text-[var(--color-terracotta)]";
    case "marine":
    default:
      return "bg-[var(--color-marine)]/15 border-[var(--color-marine)]/30 text-[var(--color-marine)]";
  }
}

export function initialsOf(name: string | null | undefined, fallback = "?"): string {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join("") || fallback;
}
