import { type CategoryCountDTO } from "./types";
import { EmptyState } from "./EmptyState";

type Props = {
  rows: CategoryCountDTO[];
  loading?: boolean;
};

// Maps category codes to the heritage palette. Anything unmapped falls back
// to marine so a fresh BE category still renders without a code change.
function chipClasses(code: string): string {
  const hue = hash(code) % 3;
  if (hue === 0) return "bg-[var(--color-marine)]/10 text-[var(--color-marine)] border-[var(--color-marine)]/20";
  if (hue === 1) return "bg-[var(--color-gold)]/15 text-[var(--color-gold)] border-[var(--color-gold)]/30";
  return "bg-[var(--color-terracotta)]/10 text-[var(--color-terracotta)] border-[var(--color-terracotta)]/20";
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

export const CategoryChips = ({ rows, loading }: Props) => {
  const populated = rows.filter((r) => r.count > 0);
  return (
    <div className="bg-[var(--color-surface)] border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-[var(--color-marine)] text-lg">Categorías</h3>
        <span className="text-[11px] text-slate-400">Gemini clasifica al sincronizar</span>
      </div>
      {loading ? (
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="h-7 w-20 bg-slate-100 rounded-full animate-pulse" />
          ))}
        </div>
      ) : populated.length === 0 ? (
        <EmptyState>Aún no hay categorías con reseñas en este rango.</EmptyState>
      ) : (
        <div className="flex flex-wrap gap-2">
          {populated.map((c) => (
            <span
              key={c.code}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${chipClasses(c.code)}`}
            >
              {c.labelEs ?? c.code} · {c.count}
            </span>
          ))}
        </div>
      )}
      <p className="text-[11px] text-slate-400 mt-4">
        Las categorías se editan en Settings → Categorías.
      </p>
    </div>
  );
};
