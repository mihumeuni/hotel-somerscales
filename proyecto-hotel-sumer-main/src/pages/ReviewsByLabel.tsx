import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "../components/ui";
import { api } from "../lib/apiClient";
import { listSentimentLabels, type SentimentLabel } from "../types/sentiment";
import { SentimentChip, sentimentPalette } from "../components/dashboard";

type ReviewListItemDTO = {
  id: number;
  source: string | null;
  author: string | null;
  rating: number | null;
  rawText: string;
  summary: string | null;
  postedAt: string | null;
  labels: string[];
};

function formatPostedAt(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

// task031: filtered cluster list reached from a sentiment-bucket tap on the
// dashboard. Single source of truth for the active filter is the URL —
// browser back lands on the dashboard with bars rendered the same way.
const ReviewsByLabel = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const labelCode = params.get("label") ?? "";

  const [taxonomy, setTaxonomy] = useState<SentimentLabel[]>([]);
  const [rows, setRows] = useState<ReviewListItemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listSentimentLabels()
      .then((labels) => !cancelled && setTaxonomy(labels))
      .catch(() => {
        // Chips still render with the raw code if the taxonomy fails to load.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!labelCode) {
      setRows([]);
      setLoading(false);
      setError("Falta el parámetro de filtro 'label'.");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .get<ReviewListItemDTO[]>(`/api/reviews?label=${encodeURIComponent(labelCode)}&limit=100`)
      .then((d) => !cancelled && setRows(d))
      .catch(() => !cancelled && setError("No se pudieron cargar las reseñas."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [labelCode]);

  const taxonomyMap = useMemo(() => {
    const m: Record<string, SentimentLabel> = {};
    for (const l of taxonomy) m[l.code] = l;
    return m;
  }, [taxonomy]);

  const activeLabel = taxonomyMap[labelCode];
  const palette = sentimentPalette(labelCode);
  const title = activeLabel
    ? `Reseñas: ${activeLabel.labelEs}`
    : labelCode
      ? `Reseñas: ${labelCode}`
      : "Reseñas";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={title}
        description={
          activeLabel
            ? `Reseñas que recibieron la etiqueta ${activeLabel.emoji} ${activeLabel.labelEs}.`
            : "Listado filtrado de reseñas por etiqueta de sentimiento."
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-[var(--color-marine)]"
        >
          ← Volver
        </button>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-[var(--color-marine)]"
        >
          Dashboard
        </Link>
        {labelCode && (
          <span className="ml-auto inline-flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-slate-400">Filtro</span>
            <SentimentChip
              code={labelCode}
              label={activeLabel?.labelEs}
              emoji={activeLabel?.emoji}
            />
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-[var(--color-terracotta)]/40 bg-[var(--color-terracotta)]/5 text-[var(--color-terracotta)] px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div
        className={`bg-[var(--color-surface)] border border-slate-200 rounded-xl shadow-sm overflow-hidden`}
      >
        <div className={`h-1 ${palette.bar}`} />
        {loading ? (
          <ul className="divide-y divide-slate-100">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="p-4 flex flex-col gap-2">
                <div className="h-3 w-32 bg-slate-100 rounded animate-pulse" />
                <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
              </li>
            ))}
          </ul>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Sin reseñas para esta etiqueta en la base.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((r) => (
              <li key={r.id} className="p-4 flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">
                    {r.author ?? "Autor desconocido"}
                  </span>
                  {r.source && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase tracking-wide">
                      {r.source.toLowerCase()}
                    </span>
                  )}
                  {r.rating != null && (
                    <span className="text-amber-600 font-semibold">★ {r.rating}</span>
                  )}
                  <span className="ml-auto">{formatPostedAt(r.postedAt)}</span>
                </div>
                {r.summary && (
                  <p className="text-sm text-slate-800 font-medium">{r.summary}</p>
                )}
                <p className="text-sm text-slate-700 whitespace-pre-line">{r.rawText}</p>
                {r.labels.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {r.labels.map((code) => {
                      const t = taxonomyMap[code];
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
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ReviewsByLabel;
