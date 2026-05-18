import { sentimentPalette } from "./sentimentPalette";

type Props = {
  code: string;
  // Optional human-readable label. Falls back to the code itself so the chip
  // never breaks if the FE somehow renders before the taxonomy loads.
  label?: string;
  emoji?: string;
  size?: "sm" | "xs";
};

// task031: reusable label chip for review rows + filtered-list headers.
// Code-driven so adding a new sentiment_labels row reaches the UI by
// landing in the operator-managed table — no FE update needed.
export const SentimentChip = ({ code, label, emoji, size = "sm" }: Props) => {
  const p = sentimentPalette(code);
  const padding = size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${padding} ${p.chip} ${p.chipText}`}
    >
      {emoji && <span aria-hidden>{emoji}</span>}
      <span className="capitalize">{label ?? code}</span>
    </span>
  );
};
