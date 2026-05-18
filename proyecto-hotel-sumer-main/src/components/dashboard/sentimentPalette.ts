// task031: stable colour mapping for sentiment_labels.code → Tailwind classes.
// Codes are operator-managed in /settings/global so this map degrades
// gracefully: any unknown code lands on a neutral slate so a freshly added
// label still renders without a FE change.

type Palette = {
  bar: string;      // bg-* for the bar fill on SentimentBars
  chip: string;     // bg-*/border-*/text-* for inline chips
  chipText: string; // explicit text colour when chip background is dark
};

const KNOWN: Record<string, Palette> = {
  positive:    { bar: "bg-emerald-500",                       chip: "bg-emerald-100 border-emerald-300",          chipText: "text-emerald-800" },
  negative:    { bar: "bg-[var(--color-terracotta)]",         chip: "bg-[var(--color-terracotta)]/15 border-[var(--color-terracotta)]/40", chipText: "text-[var(--color-terracotta)]" },
  neutral:     { bar: "bg-slate-400",                         chip: "bg-slate-100 border-slate-300",              chipText: "text-slate-700" },
  improvement: { bar: "bg-[var(--color-gold)]",               chip: "bg-amber-100 border-amber-300",              chipText: "text-amber-800" },
  complaint:   { bar: "bg-[var(--color-marine)]",             chip: "bg-[var(--color-marine)]/15 border-[var(--color-marine)]/40", chipText: "text-[var(--color-marine)]" },
};

const FALLBACK: Palette = {
  bar: "bg-slate-300",
  chip: "bg-slate-100 border-slate-300",
  chipText: "text-slate-700",
};

export const sentimentPalette = (code: string): Palette =>
  KNOWN[code] ?? FALLBACK;
