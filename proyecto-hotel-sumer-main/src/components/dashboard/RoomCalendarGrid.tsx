import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { type ReservaCalendarDTO } from "./types";
import { normalizeRoomNumber } from "../../lib/rooms";
import { formatEventTime } from "../../lib/relativeDate";
import { EmptyState } from "./EmptyState";

type Event = {
  kind: "in" | "out";
  ts: Date;
  who: string;
};

type RoomGroup = {
  room: string;
  events: Event[];
};

type Props = {
  reservas: ReservaCalendarDTO[];
  windowDays: number;
  compact?: boolean;
  loading?: boolean;
  onSeeAll?: () => void;
  now?: Date;
};

// Used in two places:
//  - dashboard widget (compact=true, windowDays=7, onSeeAll wires "Ver completo →")
//  - dedicated /calendario page (compact=false, windowDays chosen by chips)
//
// All check-in/check-out events in the [now, now+windowDays] range are shown
// per room; rooms with zero events disappear so the grid stays tight.
export const RoomCalendarGrid = ({
  reservas,
  windowDays,
  compact,
  loading,
  onSeeAll,
  now = new Date(),
}: Props) => {
  const navigate = useNavigate();
  const groups = useMemo(() => groupByRoom(reservas, now, windowDays), [reservas, now, windowDays]);

  const handleOpen = () => {
    if (onSeeAll) onSeeAll();
    else navigate("/calendario");
  };

  const headerNode = compact ? (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="font-serif text-[var(--color-marine)] text-lg">Calendario por habitación</h3>
        <p className="text-[11px] text-slate-500 mt-0.5">Próximos {windowDays} días · resumen</p>
      </div>
      <button
        type="button"
        onClick={handleOpen}
        className="text-[11px] text-[var(--color-marine)] hover:underline font-bold uppercase tracking-wider"
      >
        Ver completo →
      </button>
    </div>
  ) : null;

  const gridClasses = compact
    ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
    : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4";

  const wrapperClasses = compact
    ? "bg-[var(--color-surface)] border border-slate-200 rounded-xl p-5 shadow-sm md:col-span-2 lg:col-span-3"
    : "";

  const body = (
    <>
      {loading ? (
        <div className={gridClasses}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="border border-slate-200 rounded-lg p-3">
              <div className="h-4 w-12 bg-slate-100 rounded animate-pulse mb-3" />
              <div className="space-y-2">
                <div className="h-5 bg-slate-100 rounded animate-pulse" />
                <div className="h-5 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <EmptyState>Sin eventos en los próximos {windowDays} días.</EmptyState>
      ) : (
        <div className={gridClasses}>
          {groups.map((g) => (
            <RoomCard key={g.room} group={g} compact={!!compact} now={now} onOpen={handleOpen} />
          ))}
        </div>
      )}
      {compact && (
        <p className="text-[11px] text-slate-400 mt-4">
          Habitaciones sin eventos en los próximos {windowDays} días se ocultan automáticamente.
        </p>
      )}
    </>
  );

  if (compact) {
    return (
      <div className={wrapperClasses}>
        {headerNode}
        {body}
      </div>
    );
  }
  return <>{body}</>;
};

const RoomCard = ({
  group,
  compact,
  now,
  onOpen,
}: {
  group: RoomGroup;
  compact: boolean;
  now: Date;
  onOpen: () => void;
}) => {
  const inCount = group.events.filter((e) => e.kind === "in").length;
  const outCount = group.events.filter((e) => e.kind === "out").length;
  return (
    <article
      onClick={onOpen}
      className={
        compact
          ? "border border-slate-200 rounded-lg p-3 hover:border-[var(--color-marine)] hover:shadow-md transition cursor-pointer"
          : "bg-[var(--color-surface)] border border-slate-200 rounded-xl p-4 shadow-sm hover:border-[var(--color-marine)] hover:shadow-md transition"
      }
    >
      <header className={compact ? "flex items-center justify-between mb-2 pb-2 border-b border-slate-100" : "flex items-center justify-between mb-3 pb-3 border-b border-slate-100"}>
        <span className={compact ? "font-bold text-[var(--color-marine)]" : "font-serif text-[var(--color-marine)] text-xl"}>
          {group.room}
        </span>
        <span className="text-[10px] text-slate-400 uppercase tracking-wider">
          {compact
            ? `${group.events.length} evento${group.events.length !== 1 ? "s" : ""}`
            : `↑${inCount} · ↓${outCount}`}
        </span>
      </header>
      {compact ? (
        <div className="space-y-1.5">
          {group.events.map((e, i) => (
            <CompactRow key={i} event={e} now={now} />
          ))}
        </div>
      ) : (
        <ul className="space-y-2">
          {group.events.map((e, i) => (
            <SpaciousRow key={i} event={e} now={now} />
          ))}
        </ul>
      )}
    </article>
  );
};

const CompactRow = ({ event, now }: { event: Event; now: Date }) => {
  const color =
    event.kind === "in"
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : "text-[var(--color-terracotta)] bg-[var(--color-terracotta)]/5 border-[var(--color-terracotta)]/20";
  const arrow = event.kind === "in" ? "→" : "←";
  return (
    <div className={`flex items-center gap-2 text-[11px] px-2 py-1 rounded border ${color}`}>
      <span className="font-mono">{arrow}</span>
      <span className="flex-1 truncate">
        <span className="font-semibold">{formatEventTime(event.ts, now)}</span>
        {event.who && <> · {event.who}</>}
      </span>
    </div>
  );
};

const SpaciousRow = ({ event, now }: { event: Event; now: Date }) => {
  const color =
    event.kind === "in"
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : "text-[var(--color-terracotta)] bg-[var(--color-terracotta)]/5 border-[var(--color-terracotta)]/20";
  const arrow = event.kind === "in" ? "→" : "←";
  const label = event.kind === "in" ? "Entrada" : "Salida";
  return (
    <li className={`flex items-center gap-3 px-3 py-2 rounded-md border ${color}`}>
      <span className="font-mono text-base">{arrow}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] uppercase font-bold tracking-wider opacity-70">{label}</p>
        <p className="text-sm font-semibold truncate">{formatEventTime(event.ts, now)}</p>
        {event.who && <p className="text-xs opacity-80 truncate">{event.who}</p>}
      </div>
    </li>
  );
};

function groupByRoom(reservas: ReservaCalendarDTO[], now: Date, windowDays: number): RoomGroup[] {
  const start = now.getTime();
  const end = start + windowDays * 86_400_000;
  const buckets = new Map<string, Event[]>();

  for (const r of reservas) {
    const room = normalizeRoomNumber(r.numeroHabitacion ?? "");
    if (!room) continue;
    if (
      r.estadoReserva &&
      (r.estadoReserva.toUpperCase().includes("CANCEL") || r.estadoReserva.toUpperCase().includes("NO_SHOW"))
    ) {
      continue;
    }
    const who = (r.huespedes?.[0]?.nombreCompleto ?? "").trim();
    const candidates: Array<[Date, "in" | "out"]> = [];
    if (r.fechaEntrada) candidates.push([new Date(r.fechaEntrada), "in"]);
    if (r.fechaSalida) candidates.push([new Date(r.fechaSalida), "out"]);
    for (const [ts, kind] of candidates) {
      if (Number.isNaN(ts.getTime())) continue;
      if (ts.getTime() < start || ts.getTime() > end) continue;
      const list = buckets.get(room) ?? [];
      list.push({ ts, kind, who: short(who) });
      buckets.set(room, list);
    }
  }

  const groups: RoomGroup[] = [];
  for (const [room, events] of buckets) {
    events.sort((a, b) => a.ts.getTime() - b.ts.getTime());
    groups.push({ room, events });
  }
  groups.sort((a, b) => roomKey(a.room) - roomKey(b.room));
  return groups;
}

function roomKey(room: string): number {
  const m = room.match(/(\d+)/);
  return m ? Number(m[1]) : 999;
}

function short(name: string): string {
  if (!name) return "";
  const parts = name.split(/\s+/);
  if (parts.length < 2) return parts[0];
  return `${parts[0].charAt(0)}. ${parts[parts.length - 1]}`;
}
