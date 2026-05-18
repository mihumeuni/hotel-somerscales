import { useNavigate } from "react-router-dom";
import { type SentimentSummaryDTO } from "./types";
import { EmptyState } from "./EmptyState";
import { sentimentPalette } from "./sentimentPalette";

type Props = {
  data: SentimentSummaryDTO | null;
  loading?: boolean;
};

// task031: bars rendered straight from the BE bucket list — order, labels
// and emojis all live in sentiment_labels, so the operator controls every
// row. Tap routes to /reviews?label=code for drill-in.
export const SentimentBars = ({ data, loading }: Props) => {
  const navigate = useNavigate();
  const buckets = data?.buckets ?? [];
  const total = data?.totalReviews ?? 0;
  const max = buckets.reduce((m, b) => Math.max(m, b.count), 0);
  const hasAny = buckets.some((b) => b.count > 0);

  return (
    <div className="bg-[var(--color-surface)] border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 gap-2">
        <h3 className="font-serif text-[var(--color-marine)] text-lg">Sentimiento</h3>
        <span
          className="text-[10px] uppercase tracking-widest text-slate-400"
          title={data?.multiLabel
            ? "Una reseña puede contar en múltiples etiquetas — el total no es la suma de las barras."
            : undefined}
        >
          {total > 0 ? `${total} reseñas` : "Sin datos"}
        </span>
      </div>
      {loading ? (
        <div className="space-y-2.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-6 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      ) : !hasAny ? (
        <EmptyState>Aún no hay reseñas clasificadas.</EmptyState>
      ) : (
        <div className="space-y-2.5 text-sm">
          {buckets.map((b) => {
            const pct = max === 0 ? 0 : Math.round((b.count / max) * 100);
            const p = sentimentPalette(b.code);
            const interactive = b.count > 0;
            return (
              <button
                key={b.code}
                type="button"
                disabled={!interactive}
                onClick={() => navigate(`/reviews?label=${encodeURIComponent(b.code)}`)}
                className={`w-full flex items-center gap-3 rounded text-left transition-colors ${
                  interactive
                    ? "hover:bg-[var(--color-cream)] focus:bg-[var(--color-cream)] focus:outline-none cursor-pointer"
                    : "opacity-50 cursor-default"
                }`}
                title={interactive ? `Ver reseñas: ${b.labelEs}` : undefined}
              >
                <span className="text-lg">{b.emoji}</span>
                <span className="flex-1 text-slate-700 capitalize">{b.labelEs}</span>
                <div className="w-28 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${p.bar}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 text-right font-bold text-slate-700">{b.count}</span>
              </button>
            );
          })}
          {data?.multiLabel && (
            <p className="text-[10px] text-slate-400 pt-2 leading-snug">
              Una reseña puede recibir varias etiquetas; el total clasificado no es la suma de las barras.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
