import { useEffect, useState } from "react";
import { type NormalizedReviewDTO } from "./types";
import { EmptyState } from "./EmptyState";
import { SentimentChip } from "./SentimentChip";
import { listSentimentLabels, type SentimentLabel } from "../../types/sentiment";

type Props = {
  rows: NormalizedReviewDTO[];
  loading?: boolean;
};

// task031: each cluster row shows a count badge plus a chip per applicable
// sentiment label. Labels resolve through the operator-managed
// sentiment_labels table so a renamed bucket flips here on next mount.
export const NormalizedComments = ({ rows, loading }: Props) => {
  const [taxonomy, setTaxonomy] = useState<Record<string, SentimentLabel>>({});

  useEffect(() => {
    let cancelled = false;
    listSentimentLabels()
      .then((labels) => {
        if (cancelled) return;
        const map: Record<string, SentimentLabel> = {};
        for (const l of labels) map[l.code] = l;
        setTaxonomy(map);
      })
      .catch(() => {
        // Chips fall back to the raw code if the taxonomy fetch fails.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-[var(--color-surface)] border border-slate-200 rounded-xl p-5 shadow-sm md:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-[var(--color-marine)] text-lg">Comentarios normalizados</h3>
        <span className="text-[10px] uppercase tracking-widest text-slate-400">Resumido por IA</span>
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
        <EmptyState>Sin clusters todavía. La IA resume al sincronizar reseñas.</EmptyState>
      ) : (
        <ul className="divide-y divide-slate-100 text-sm">
          {rows.map((r, i) => (
            <li
              key={i}
              className="py-3 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 hover:bg-[var(--color-cream)] rounded px-2 -mx-2"
            >
              <span className="px-2.5 py-0.5 bg-[var(--color-marine)] text-white rounded-full text-[11px] font-bold mt-0.5 shrink-0 self-start">
                {r.count}
              </span>
              <span className="flex-1 text-slate-700">{r.summary}</span>
              {r.labels.length > 0 && (
                <span className="flex flex-wrap gap-1 self-start sm:self-center">
                  {r.labels.map((code) => {
                    const t = taxonomy[code];
                    return (
                      <SentimentChip
                        key={code}
                        code={code}
                        label={t?.labelEs}
                        emoji={t?.emoji}
                        size="xs"
                      />
                    );
                  })}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
