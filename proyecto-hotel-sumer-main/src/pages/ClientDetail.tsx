import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/apiClient";
import type { GuestHistory } from "../types/guestHistory";
import { Card, Button, EmptyState, Skeleton } from "../components/ui";
import { initialsOf } from "../components/dashboard/avatar";
import { useAuth } from "../context/AuthContext";

const clpFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const dateLong = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const dateShort = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "short" });
};

const ClientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { has } = useAuth();

  const guestId = useMemo(() => {
    const n = Number(id);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [id]);

  const [data, setData] = useState<GuestHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (guestId === null) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<GuestHistory>(`/api/guests/${guestId}/historial`);
      setData(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al cargar el historial";
      setError(msg.includes("404") ? "Huésped no encontrado" : msg);
    } finally {
      setLoading(false);
    }
  }, [guestId]);

  useEffect(() => {
    void load();
  }, [load]);

  const huesped = data?.huesped;
  const canSeeExpenses = has("expense.read") || has("expense.write");

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <div className="bg-marine/5 border border-marine/20 rounded-lg px-4 py-2.5 text-xs text-marine flex items-center gap-2">
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>
          Datos sincronizados desde Cloudbeds · último sync:{" "}
          <span className="font-semibold">{dateLong(data?.lastVisit ?? null)}</span> · solo lectura
        </span>
      </div>

      {guestId === null && (
        <Card>
          <p role="alert" className="text-sm text-terracotta">ID inválido en la URL.</p>
        </Card>
      )}

      {guestId !== null && error && (
        <Card>
          <div className="flex flex-col gap-3">
            <p role="alert" className="text-sm text-terracotta">{error}</p>
            <div>
              <Button variant="secondary" onClick={() => navigate(-1)}>Volver</Button>
            </div>
          </div>
        </Card>
      )}

      {guestId !== null && loading && !data && (
        <>
          <div className="bg-surface border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col sm:flex-row sm:items-center gap-5">
            <Skeleton className="w-20 h-20 shrink-0" rounded="full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-3 w-72 max-w-full" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
          <div className="bg-surface border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-cream border-b border-slate-100">
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="divide-y divide-slate-100">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/5" />
                    <Skeleton className="h-3 w-2/5" />
                  </div>
                  <Skeleton className="h-4 w-20 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {data && huesped && (
        <>
          <header className="bg-surface border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-marine/15 border-2 border-marine/30 flex items-center justify-center text-marine font-serif text-2xl shadow-sm shrink-0">
              {initialsOf(huesped.nombreCompleto)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-serif text-marine text-2xl truncate">{huesped.nombreCompleto}</h2>
              <p className="text-sm text-slate-500 truncate">
                {huesped.email ?? "Sin email"} · {huesped.telefono ?? "Sin teléfono"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {huesped.tipoDocumento} (encriptado) · {huesped.numeroDocumento ?? "—"}
              </p>
            </div>
            <div className="flex gap-6 sm:flex-col sm:text-right">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500">Visitas</p>
                <p className="font-serif text-marine text-2xl">{data.totalVisits}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500">Gasto total</p>
                <p className="font-serif text-marine text-2xl">{clpFormatter.format(data.totalSpentClp ?? 0)}</p>
              </div>
            </div>
          </header>

          <section className="bg-surface border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-cream flex items-center justify-between">
              <h3 className="font-serif text-marine text-lg">Reservas anteriores</h3>
              <span className="text-[10px] uppercase tracking-widest text-slate-400">
                {data.bookings.length} {data.bookings.length === 1 ? "reserva" : "reservas"}
              </span>
            </div>

            {data.bookings.length === 0 ? (
              <EmptyState
                title="Sin reservas registradas"
                body="Este huésped aún no tiene reservas en el historial."
              />
            ) : (
              <>
                <table className="w-full text-sm hidden md:table">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-500">
                    <tr>
                      <th className="px-5 py-2.5 text-left">Llegada</th>
                      <th className="px-5 py-2.5 text-left">Salida</th>
                      <th className="px-5 py-2.5 text-left">Noches</th>
                      <th className="px-5 py-2.5 text-left">Origen</th>
                      <th className="px-5 py-2.5 text-left">Estado</th>
                      <th className="px-5 py-2.5 text-right">Total</th>
                      {canSeeExpenses && <th className="px-5 py-2.5 text-right">Gastos</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.bookings.map((b) => {
                      const expensesClp = b.totalExpensesByCurrency?.CLP ?? 0;
                      return (
                        <tr key={b.id} className="hover:bg-cream">
                          <td className="px-5 py-2.5 text-slate-700">{dateLong(b.fechaEntrada)}</td>
                          <td className="px-5 py-2.5 text-slate-700">{dateLong(b.fechaSalida)}</td>
                          <td className="px-5 py-2.5 text-slate-700">{b.nightsCount ?? "—"}</td>
                          <td className="px-5 py-2.5 text-slate-500">{b.origenReserva ?? "—"}</td>
                          <td className="px-5 py-2.5 text-slate-500">{b.estadoReserva ?? "—"}</td>
                          <td className="px-5 py-2.5 text-right text-slate-700 font-medium">
                            {clpFormatter.format(b.montoTotal ?? 0)}
                          </td>
                          {canSeeExpenses && (
                            <td className="px-5 py-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => navigate(`/reservas/${b.id}/gastos`)}
                                className="text-marine font-bold uppercase text-[10px] tracking-wider hover:underline"
                              >
                                {clpFormatter.format(expensesClp)} ›
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <ul className="md:hidden divide-y divide-slate-100">
                  {data.bookings.map((b) => (
                    <li key={b.id} className="px-5 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink truncate">
                          {dateShort(b.fechaEntrada)} → {dateShort(b.fechaSalida)}
                        </p>
                        <p className="text-xs text-slate-500 font-mono truncate">
                          {b.origenReserva ?? "—"}
                          {b.nightsCount != null && ` · ${b.nightsCount}n`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-marine">
                          {clpFormatter.format(b.montoTotal ?? 0)}
                        </p>
                        {canSeeExpenses && (
                          <button
                            type="button"
                            onClick={() => navigate(`/reservas/${b.id}/gastos`)}
                            className="text-[10px] text-marine uppercase tracking-wider font-bold hover:underline"
                          >
                            Ver gastos ›
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default ClientDetail;
