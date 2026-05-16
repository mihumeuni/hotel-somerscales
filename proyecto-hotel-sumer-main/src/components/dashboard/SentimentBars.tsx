import { type SentimentSummaryDTO } from "./types";
import { EmptyState } from "./EmptyState";

type Bucket = {
  key: string;
  label: string;
  emoji: string;
  barClass: string;
};

// Stable bucket order; if BE returns extra labels (e.g. SUGGESTION, COMPLAINT
// once task031 ships) they're appended in insertion order. Buckets missing
// from BE are simply not rendered — no fake zeros, per the operator's pick.
const KNOWN_BUCKETS: Bucket[] = [
  { key: "POSITIVE", label: "Positivo", emoji: "😊", barClass: "bg-emerald-500" },
  { key: "NEGATIVE", label: "Negativo", emoji: "😞", barClass: "bg-[var(--color-terracotta)]" },
  { key: "NEUTRAL", label: "Neutro", emoji: "😐", barClass: "bg-slate-400" },
  { key: "SUGGESTION", label: "Mejora", emoji: "💡", barClass: "bg-[var(--color-gold)]" },
  { key: "COMPLAINT", label: "Reclamo", emoji: "🚨", barClass: "bg-[var(--color-marine)]" },
];

type Props = {
  data: SentimentSummaryDTO | null;
  loading?: boolean;
};

export const SentimentBars = ({ data, loading }: Props) => {
  const counts = data?.counts ?? {};
  const entries = Object.entries(counts).filter(([, v]) => v > 0);
  const total = entries.reduce((sum, [, v]) => sum + v, 0);
  const max = entries.reduce((m, [, v]) => Math.max(m, v), 0);

  const ordered: Array<{ bucket: Bucket; count: number }> = [];
  for (const known of KNOWN_BUCKETS) {
    if (known.key in counts && counts[known.key] > 0) {
      ordered.push({ bucket: known, count: counts[known.key] });
    }
  }
  // Surface any unrecognized buckets the BE adds in the future.
  for (const [k, v] of entries) {
    if (!KNOWN_BUCKETS.find((b) => b.key === k)) {
      ordered.push({ bucket: { key: k, label: k.toLowerCase(), emoji: "•", barClass: "bg-slate-300" }, count: v });
    }
  }

  return (
    <div className="bg-[var(--color-surface)] border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-[var(--color-marine)] text-lg">Sentimiento</h3>
        <span
          className="text-[10px] uppercase tracking-widest text-slate-400"
          title="Una reseña puede contar en varios buckets cuando se habilite multi-etiqueta"
        >
          {total > 0 ? `${total} reseñas` : "Sin datos"}
        </span>
      </div>
      {loading ? (
        <div className="space-y-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-6 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      ) : ordered.length === 0 ? (
        <EmptyState>Aún no hay reseñas clasificadas.</EmptyState>
      ) : (
        <div className="space-y-2.5 text-sm">
          {ordered.map(({ bucket, count }) => {
            const pct = max === 0 ? 0 : Math.round((count / max) * 100);
            return (
              <div key={bucket.key} className="flex items-center gap-3">
                <span className="text-lg">{bucket.emoji}</span>
                <span className="flex-1 text-slate-700 capitalize">{bucket.label}</span>
                <div className="w-28 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${bucket.barClass}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 text-right font-bold text-slate-700">{count}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
