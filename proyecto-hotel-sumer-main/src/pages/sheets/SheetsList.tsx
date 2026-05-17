import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Card, EmptyState, PageHeader, Skeleton } from "../../components/ui";
import { PAST_SHEETS } from "./sampleData";

// Sample turno currently in progress, if any. Hardcoded toggle for the v1.1
// scaffold — real session state will land with the backend wiring (task027+).
const SHIFT_OPEN = false;

const turnoColor: Record<string, string> = {
  Noche: "bg-marine/15 text-marine border-marine/30",
  Tarde: "bg-terracotta/15 text-terracotta border-terracotta/30",
  Mañana: "bg-gold/15 text-gold border-gold/30",
};

const SheetsList = () => {
  const navigate = useNavigate();
  // Even though data is local, simulate a brief skeleton tick so the mobile
  // pass can validate the loading state.
  const [loading] = useState(false);

  const sheets = PAST_SHEETS;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Fichas de turno"
        description="Bitácora del turno actual + historial reciente."
      />

      <section
        className="rounded-xl border border-marine/30 bg-marine/5 p-5 md:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        aria-label="Turno actual"
      >
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-marine/70 font-bold">
            Turno actual
          </p>
          <h2 className="font-serif text-marine text-xl md:text-2xl mt-1">
            {SHIFT_OPEN ? "En progreso — recordá cerrar al fin del turno" : "Sin turno abierto"}
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Cada ficha condensa los 22 reportes operativos y la bitácora del turno.
          </p>
        </div>
        <div className="shrink-0 flex flex-col sm:flex-row gap-2">
          {SHIFT_OPEN ? (
            <Button onClick={() => navigate("/fichas/actual")}>Continuar ficha</Button>
          ) : (
            <Button onClick={() => navigate("/fichas/nueva")}>Comenzar turno</Button>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-marine text-lg">Fichas anteriores</h3>
          <span className="text-[10px] uppercase tracking-widest text-slate-400">
            {sheets.length} {sheets.length === 1 ? "ficha" : "fichas"}
          </span>
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
              body="Reclama el primer turno con “Comenzar turno”."
            />
          </Card>
        )}

        {!loading && sheets.length > 0 && (
          <>
            {/* Mobile: stacked cards. Each cell wraps below sm. */}
            <ul className="md:hidden space-y-2">
              {sheets.map((s) => (
                <li key={s.id}>
                  <Link
                    to={`/fichas/${s.id}/resumen`}
                    className="block bg-surface border border-slate-200 rounded-xl p-4 shadow-sm hover:bg-cream transition"
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="font-mono text-xs text-slate-400">{s.id}</span>
                      <span
                        className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full border ${
                          turnoColor[s.turno] ?? ""
                        }`}
                      >
                        {s.turno}
                      </span>
                    </div>
                    <p className="font-semibold text-ink truncate">
                      {s.recepcionista}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {s.fecha} · {s.reportes} reportes
                      {s.incidentes > 0 && (
                        <span className="text-terracotta font-semibold">
                          {" "}· {s.incidentes} incidente{s.incidentes === 1 ? "" : "s"}
                        </span>
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
                    <th className="px-5 py-2.5 text-left">Recepcionista</th>
                    <th className="px-5 py-2.5 text-right">Reportes</th>
                    <th className="px-5 py-2.5 text-right">Incidentes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sheets.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => navigate(`/fichas/${s.id}/resumen`)}
                      className="hover:bg-cream cursor-pointer"
                    >
                      <td className="px-5 py-3 font-mono text-xs text-slate-400">{s.id}</td>
                      <td className="px-5 py-3 text-slate-700">{s.fecha}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full border ${
                            turnoColor[s.turno] ?? ""
                          }`}
                        >
                          {s.turno}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-ink font-semibold">
                        {s.recepcionista}
                      </td>
                      <td className="px-5 py-3 text-right text-slate-700 font-mono">
                        {s.reportes}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {s.incidentes > 0 ? (
                          <span className="text-terracotta font-semibold">
                            {s.incidentes}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
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
