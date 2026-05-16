import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "../components/ui";
import { api } from "../lib/apiClient";
import {
  RoomCalendarGrid,
  type ReservaCalendarDTO,
} from "../components/dashboard";
import { formatDayMonth } from "../lib/relativeDate";

const WINDOW_OPTIONS = [7, 14, 30] as const;
type WindowOption = (typeof WINDOW_OPTIONS)[number];

function rangeLabel(start: Date, days: number): string {
  const end = new Date(start);
  end.setDate(end.getDate() + days - 1);
  return `${formatDayMonth(start)} → ${formatDayMonth(end)}`;
}

const Calendario = () => {
  const [reservas, setReservas] = useState<ReservaCalendarDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [windowDays, setWindowDays] = useState<WindowOption>(7);

  useEffect(() => {
    let cancelled = false;
    api
      .get<ReservaCalendarDTO[]>("/api/reservas")
      .then((d) => {
        if (!cancelled) setReservas(d);
      })
      .catch(() => !cancelled && setError("No se pudieron cargar las reservas."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const now = useMemo(() => new Date(), []);

  // Pre-compute KPIs for the strip: in/out counts + active rooms + avg occupancy
  // over the selected window.
  const kpis = useMemo(() => {
    const start = now.getTime();
    const end = start + windowDays * 86_400_000;
    let checkIns = 0;
    let checkOuts = 0;
    const activeRooms = new Set<string>();
    let occupiedRoomDays = 0;
    const totalRooms = 10; // matches V9 hotel_config seed; refined later
    for (const r of reservas) {
      const room = (r.numeroHabitacion ?? "").trim();
      if (!room) continue;
      if (
        r.estadoReserva &&
        (r.estadoReserva.toUpperCase().includes("CANCEL") || r.estadoReserva.toUpperCase().includes("NO_SHOW"))
      ) {
        continue;
      }
      const entrada = r.fechaEntrada ? new Date(r.fechaEntrada).getTime() : NaN;
      const salida = r.fechaSalida ? new Date(r.fechaSalida).getTime() : NaN;
      if (!Number.isNaN(entrada) && entrada >= start && entrada <= end) {
        checkIns += 1;
        activeRooms.add(room);
      }
      if (!Number.isNaN(salida) && salida >= start && salida <= end) {
        checkOuts += 1;
        activeRooms.add(room);
      }
      // Overlap days count toward occupancy average.
      if (!Number.isNaN(entrada) && !Number.isNaN(salida)) {
        const overlapStart = Math.max(entrada, start);
        const overlapEnd = Math.min(salida, end);
        if (overlapEnd > overlapStart) {
          occupiedRoomDays += Math.ceil((overlapEnd - overlapStart) / 86_400_000);
        }
      }
    }
    const avgOccupancy = Math.round((occupiedRoomDays / (totalRooms * windowDays)) * 100);
    return {
      checkIns,
      checkOuts,
      activeRooms: activeRooms.size,
      totalRooms,
      avgOccupancy: Number.isFinite(avgOccupancy) ? avgOccupancy : 0,
    };
  }, [reservas, windowDays, now]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Calendario"
        description={`Próximos ${windowDays} días · ${rangeLabel(now, windowDays)}`}
      />

      <div className="flex flex-wrap gap-2">
        {WINDOW_OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setWindowDays(opt)}
            className={
              opt === windowDays
                ? "px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-[var(--color-marine)] text-white rounded-full shadow-sm"
                : "px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-[var(--color-surface)] text-slate-600 border border-slate-200 rounded-full hover:border-[var(--color-marine)]"
            }
          >
            {opt} días
          </button>
        ))}
      </div>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Check-ins" value={kpis.checkIns} loading={loading} />
        <KpiCard label="Check-outs" value={kpis.checkOuts} loading={loading} />
        <KpiCard
          label="Habitaciones activas"
          value={kpis.activeRooms}
          loading={loading}
          suffix={` / ${kpis.totalRooms}`}
        />
        <KpiCard label="Ocupación promedio" value={kpis.avgOccupancy} loading={loading} suffix="%" />
      </section>

      {error && (
        <div className="rounded-lg border border-[var(--color-terracotta)]/40 bg-[var(--color-terracotta)]/5 text-[var(--color-terracotta)] px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <RoomCalendarGrid
        reservas={reservas}
        windowDays={windowDays}
        loading={loading}
        now={now}
      />

      <p className="text-xs text-slate-400">
        Habitaciones sin eventos en la ventana seleccionada se ocultan. Cambia el rango con los botones superiores.
      </p>
    </div>
  );
};

const KpiCard = ({
  label,
  value,
  loading,
  suffix,
}: {
  label: string;
  value: number;
  loading?: boolean;
  suffix?: string;
}) => (
  <div className="bg-[var(--color-surface)] border border-slate-200 rounded-xl p-4 shadow-sm">
    <p className="text-[10px] uppercase tracking-widest text-slate-500">{label}</p>
    {loading ? (
      <div className="mt-2 h-7 w-14 bg-slate-100 rounded animate-pulse" />
    ) : (
      <p className="text-2xl font-serif font-bold text-[var(--color-marine)] mt-1">
        {value}
        {suffix && <span className="text-base text-slate-400">{suffix}</span>}
      </p>
    )}
  </div>
);

export default Calendario;
