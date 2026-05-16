import { useNavigate } from "react-router-dom";
import { avatarClasses, initialsOf, pickAvatarColor } from "./avatar";
import { type TopGuestDTO } from "./types";
import { SkeletonRow } from "./SkeletonRow";
import { EmptyState } from "./EmptyState";

type Props = {
  title: string;
  eyebrow?: string;
  rows: TopGuestDTO[];
  loading?: boolean;
  format: "visits" | "spend";
};

const CLP_FORMATTER = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

function formatSpend(value: number | string | null | undefined): string {
  if (value == null) return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n) || n === 0) return "—";
  return CLP_FORMATTER.format(n);
}

export const LeaderboardCard = ({ title, eyebrow, rows, loading, format }: Props) => {
  const navigate = useNavigate();

  return (
    <div className="bg-[var(--color-surface)] border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-[var(--color-marine)] text-lg">{title}</h3>
        {eyebrow && (
          <span className="text-[10px] uppercase tracking-widest text-slate-400">{eyebrow}</span>
        )}
      </div>
      {loading ? (
        <ol className="space-y-3 text-sm">
          {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </ol>
      ) : rows.length === 0 ? (
        <EmptyState>Sin datos aún · sincroniza Cloudbeds desde Settings</EmptyState>
      ) : (
        <ol className="space-y-3 text-sm">
          {rows.slice(0, 5).map((g, i) => {
            const color = pickAvatarColor(g.huespedId);
            return (
              <li
                key={g.huespedId}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/huespedes/${g.huespedId}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") navigate(`/huespedes/${g.huespedId}`);
                }}
                className="flex items-center gap-3 hover:bg-[var(--color-cream)] rounded p-1 -mx-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-marine)]/40"
              >
                <span className="w-5 text-slate-400 font-mono text-xs text-right">{i + 1}.</span>
                <span className={`w-9 h-9 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${avatarClasses(color)}`}>
                  {initialsOf(g.nombreCompleto)}
                </span>
                <span className="flex-1 font-medium text-[var(--color-ink)] truncate">{g.nombreCompleto}</span>
                <span className="text-xs text-slate-700 font-semibold">
                  {format === "spend"
                    ? formatSpend(g.totalSpend)
                    : `${g.visitCount} visita${g.visitCount !== 1 ? "s" : ""}`}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
};
