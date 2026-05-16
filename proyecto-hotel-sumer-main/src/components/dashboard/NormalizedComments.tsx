import { type NormalizedReviewDTO } from "./types";
import { EmptyState } from "./EmptyState";

type Props = {
  rows: NormalizedReviewDTO[];
  loading?: boolean;
};

function badgeClass(sentiment: string | null): string {
  switch (sentiment) {
    case "POSITIVE":
      return "bg-[var(--color-marine)]";
    case "NEGATIVE":
      return "bg-[var(--color-terracotta)]";
    case "NEUTRAL":
      return "bg-slate-400";
    default:
      return "bg-[var(--color-gold)]";
  }
}

export const NormalizedComments = ({ rows, loading }: Props) => (
  <div className="bg-[var(--color-surface)] border border-slate-200 rounded-xl p-5 shadow-sm md:col-span-2">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-serif text-[var(--color-marine)] text-lg">Comentarios normalizados</h3>
      <span className="text-[10px] uppercase tracking-widest text-slate-400">Resumido por Gemini</span>
    </div>
    {loading ? (
      <ul className="divide-y divide-slate-100 text-sm">
        {[0, 1, 2].map((i) => (
          <li key={i} className="py-3 flex items-center gap-3">
            <span className="w-8 h-5 bg-slate-100 rounded-full animate-pulse" />
            <span className="flex-1 h-4 bg-slate-100 rounded animate-pulse" />
          </li>
        ))}
      </ul>
    ) : rows.length === 0 ? (
      <EmptyState>Sin clusters todavía. Gemini resume al sincronizar reseñas.</EmptyState>
    ) : (
      <ul className="divide-y divide-slate-100 text-sm">
        {rows.map((r, i) => (
          <li key={i} className="py-3 flex items-start gap-3 hover:bg-[var(--color-cream)] rounded px-2 -mx-2">
            <span
              className={`px-2.5 py-0.5 text-white rounded-full text-[11px] font-bold mt-0.5 shrink-0 ${badgeClass(r.sentiment)}`}
            >
              {r.count}
            </span>
            <span className="flex-1 text-slate-700">{r.summary}</span>
          </li>
        ))}
      </ul>
    )}
  </div>
);
