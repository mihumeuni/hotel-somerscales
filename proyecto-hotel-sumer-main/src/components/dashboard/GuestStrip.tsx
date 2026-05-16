import { useNavigate } from "react-router-dom";
import { avatarClasses, pickAvatarColor } from "./avatar";
import { type GuestStripDTO } from "./types";
import { SkeletonRow } from "./SkeletonRow";
import { EmptyState } from "./EmptyState";
import { formatPastCheckout, formatUpcomingCheckout } from "../../lib/relativeDate";

type Props = {
  title: string;
  eyebrow?: string;
  rows: GuestStripDTO[];
  loading?: boolean;
  flavour: "current" | "recent";
};

// Shared widget body for "Huéspedes actuales" + "Huéspedes recientes".
// `flavour` only changes label tone (future "sale..." vs past "salió...").
export const GuestStrip = ({ title, eyebrow, rows, loading, flavour }: Props) => {
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
        <ul className="space-y-3 text-sm">
          {[0, 1, 2].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </ul>
      ) : rows.length === 0 ? (
        <EmptyState>
          {flavour === "current" ? "No hay huéspedes en el hotel ahora." : "Sin check-outs recientes."}
        </EmptyState>
      ) : (
        <ul className="space-y-3 text-sm">
          {rows.map((g) => {
            const color = pickAvatarColor(g.huespedId);
            const roomsLine = g.rooms.join(" · ");
            const checkout = g.checkoutDate ? new Date(g.checkoutDate) : null;
            const when = checkout
              ? flavour === "current"
                ? formatUpcomingCheckout(checkout)
                : formatPastCheckout(checkout)
              : "";
            const multiRoom = g.rooms.length > 1 ? ` · ${g.rooms.length} habs` : "";
            return (
              <li
                key={`${g.huespedId}-${g.checkoutDate ?? "x"}`}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/huespedes/${g.huespedId}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") navigate(`/huespedes/${g.huespedId}`);
                }}
                className="flex items-center gap-3 hover:bg-[var(--color-cream)] rounded p-1 -mx-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-marine)]/40"
              >
                <span className={`w-9 h-9 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${avatarClasses(color)}`}>
                  {g.initials}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--color-ink)] truncate">{g.nombreCompleto}</p>
                  <p className="text-[11px] text-slate-500 truncate">
                    <span className="font-mono font-bold text-[var(--color-marine)]">{roomsLine}</span>
                    <span> · {g.totalVisits} visita{g.totalVisits !== 1 ? "s" : ""}</span>
                    {multiRoom && <span>{multiRoom}</span>}
                  </p>
                </div>
                <span
                  className={
                    flavour === "current"
                      ? "text-[11px] text-[var(--color-terracotta)] font-semibold shrink-0 text-right"
                      : "text-[10px] text-slate-400 shrink-0 text-right"
                  }
                >
                  {when}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
