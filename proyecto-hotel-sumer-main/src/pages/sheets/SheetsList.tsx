import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Button,
  Card,
  EmptyState,
  PageHeader,
  Skeleton,
} from "../../components/ui";
import {
  claimShift,
  getActiveShift,
  listFichas,
  shiftLabel,
  type ActiveShift,
  type FichaSummary,
} from "../../types/sheet";
import { useAuth } from "../../context/AuthContext";
import { useShiftClock } from "../../hooks/useShiftClock";

const turnoColor: Record<string, string> = {
  NOCHE: "bg-marine/15 text-marine border-marine/30",
  MANANA: "bg-gold/15 text-gold border-gold/30",
};

const SheetsList = () => {
  const navigate = useNavigate();
  const { has } = useAuth();
  const canWrite = has("sheet.write");
  const clock = useShiftClock();

  const [active, setActive] = useState<ActiveShift | null>(null);
  const [sheets, setSheets] = useState<FichaSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [activeRes, sheetsRes] = await Promise.all([
        getActiveShift(),
        listFichas(),
      ]);
      setActive(activeRes);
      setSheets(sheetsRes);
    } catch {
      /* apiClient already toasts network/5xx; leave UI in last good state */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleClaim = async () => {
    if (!canWrite || claiming) return;
    setClaiming(true);
    try {
      const created = await claimShift();
      toast.success(`Turno ${shiftLabel(created.shift)} reclamado`);
      navigate(`/fichas/${created.id}/editar`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("409")) {
        toast.error("Ya hay una ficha abierta para este turno");
        void load();
      } else if (msg.includes("403")) {
        toast.error("No tienes permiso para abrir un turno");
      }
    } finally {
      setClaiming(false);
    }
  };

  const renderHero = () => {
    if (loading || !active) {
      return (
        <section className="rounded-xl border border-marine/30 bg-marine/5 p-5 md:p-6">
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-7 w-64 max-w-full mb-2" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </section>
      );
    }

    return (
      <section
        className="rounded-xl border border-marine/30 bg-marine/5 p-5 md:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        aria-label="Turno actual"
      >
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-marine/70 font-bold">
            Turno {shiftLabel(active.shift)} · {active.fecha}
          </p>
          {active.status === "UNCLAIMED" && (
            <>
              <h2 className="font-serif text-marine text-xl md:text-2xl mt-1">
                Sin turno abierto
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Reclama el turno y la ficha se inicia con los 21 reportes en
                blanco. Quedan editables hasta que entregues el turno.
              </p>
            </>
          )}
          {active.status === "CLAIMED_BY_ME" && (
            <>
              <h2 className="font-serif text-marine text-xl md:text-2xl mt-1">
                Tu turno está abierto
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                {active.locked
                  ? "Ya entregaste el turno. Solo lectura."
                  : "Recordá cerrar y entregar al fin del turno."}
              </p>
            </>
          )}
          {active.status === "CLAIMED_BY_OTHER" && (
            <>
              <h2 className="font-serif text-marine text-xl md:text-2xl mt-1">
                En curso por {active.ownerName ?? "otro operador"}
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                {active.locked
                  ? "Ya entregada — puedes leer el resumen."
                  : "Solo el dueño del turno puede editar esta ficha."}
              </p>
            </>
          )}
        </div>
        <div className="shrink-0 flex flex-col sm:flex-row gap-2">
          {active.status === "UNCLAIMED" && canWrite && (
            <Button onClick={handleClaim} disabled={claiming}>
              {claiming ? "Abriendo…" : `Reclamar turno ${clock.label}`}
            </Button>
          )}
          {active.status === "CLAIMED_BY_ME" && active.fichaId && (
            <Button
              onClick={() =>
                navigate(
                  active.locked
                    ? `/fichas/${active.fichaId}/resumen`
                    : `/fichas/${active.fichaId}/editar`,
                )
              }
            >
              {active.locked ? "Ver resumen" : "Continuar ficha"}
            </Button>
          )}
          {active.status === "CLAIMED_BY_OTHER" && active.fichaId && (
            <Button
              variant="secondary"
              onClick={() => navigate(`/fichas/${active.fichaId}/resumen`)}
            >
              Ver resumen
            </Button>
          )}
        </div>
      </section>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Fichas de turno"
        description="Bitácora del turno actual + historial reciente."
      />

      {renderHero()}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-marine text-lg">Fichas anteriores</h3>
          {!loading && (
            <span className="text-[10px] uppercase tracking-widest text-slate-400">
              {sheets.length} {sheets.length === 1 ? "ficha" : "fichas"}
            </span>
          )}
        </div>

        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" rounded="lg" />
            ))}
          </div>
        )}

        {!loading && sheets.length === 0 && (
          <Card>
            <EmptyState
              title="Sin fichas anteriores"
              body="Reclama el primer turno con el botón superior y la ficha quedará archivada al cerrarla."
            />
          </Card>
        )}

        {!loading && sheets.length > 0 && (
          <>
            {/* Mobile: stacked cards */}
            <ul className="md:hidden space-y-2">
              {sheets.map((s) => (
                <li key={s.id}>
                  <Link
                    to={`/fichas/${s.id}/resumen`}
                    className="block bg-surface border border-slate-200 rounded-xl p-4 shadow-sm hover:bg-cream transition"
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="font-mono text-xs text-slate-400">
                        #{s.id.toString().padStart(4, "0")}
                      </span>
                      <span
                        className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full border ${
                          turnoColor[s.shift] ?? ""
                        }`}
                      >
                        {shiftLabel(s.shift)}
                      </span>
                    </div>
                    <p className="font-semibold text-ink truncate">
                      {s.ownerName ?? "Sin operador"}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {s.fecha} ·{" "}
                      {s.reporteCount} reportes
                      {s.locked ? (
                        <span className="text-emerald-700"> · entregada ✓</span>
                      ) : (
                        <span className="text-gold"> · en curso</span>
                      )}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Desktop: table */}
            <div className="hidden md:block bg-surface border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-500">
                  <tr>
                    <th className="px-5 py-2.5 text-left">Folio</th>
                    <th className="px-5 py-2.5 text-left">Fecha</th>
                    <th className="px-5 py-2.5 text-left">Turno</th>
                    <th className="px-5 py-2.5 text-left">Operador</th>
                    <th className="px-5 py-2.5 text-right">Reportes</th>
                    <th className="px-5 py-2.5 text-left">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sheets.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => navigate(`/fichas/${s.id}/resumen`)}
                      className="hover:bg-cream cursor-pointer"
                    >
                      <td className="px-5 py-3 font-mono text-xs text-slate-400">
                        #{s.id.toString().padStart(4, "0")}
                      </td>
                      <td className="px-5 py-3 text-slate-700">{s.fecha}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full border ${
                            turnoColor[s.shift] ?? ""
                          }`}
                        >
                          {shiftLabel(s.shift)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-ink font-semibold">
                        {s.ownerName ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-right text-slate-700 font-mono">
                        {s.reporteCount}
                      </td>
                      <td className="px-5 py-3 text-xs">
                        {s.locked ? (
                          <span className="text-emerald-700 font-semibold">
                            Entregada
                          </span>
                        ) : (
                          <span className="text-gold font-semibold">
                            En curso
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default SheetsList;
