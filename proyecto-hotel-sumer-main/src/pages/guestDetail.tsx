import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/apiClient";
import type { GuestHistory, BookingSummary } from "../types/guestHistory";
import { AppShell, Button, Card, Table, type Column } from "../components/ui";

const currencyFormatter = (currency: string, amount: number) => {
  try {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
};

const dateFormatter = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-CL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const formatExpenseSummary = (totals: Record<string, number>) => {
  const entries = Object.entries(totals ?? {});
  if (entries.length === 0) return "—";
  return entries.map(([m, v]) => currencyFormatter(m, Number(v))).join(" · ");
};

const GuestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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

  const bookingColumns: Column<BookingSummary>[] = [
    {
      key: "fechaEntrada",
      header: "Entrada",
      render: (row) => dateFormatter(row.fechaEntrada),
    },
    {
      key: "fechaSalida",
      header: "Salida",
      render: (row) => dateFormatter(row.fechaSalida),
    },
    {
      key: "nightsCount",
      header: "Noches",
      className: "text-right",
      render: (row) => (row.nightsCount ?? 0).toString(),
    },
    {
      key: "origenReserva",
      header: "Origen",
      render: (row) => row.origenReserva ?? "—",
    },
    {
      key: "estadoReserva",
      header: "Estado",
      render: (row) => row.estadoReserva ?? "—",
    },
    {
      key: "totalExpensesByCurrency",
      header: "Gastos",
      render: (row) => formatExpenseSummary(row.totalExpensesByCurrency),
    },
    {
      key: "acciones",
      header: "Acciones",
      className: "text-right",
      render: (row) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(`/reservas/${row.id}/gastos`)}
        >
          Ver gastos
        </Button>
      ),
    },
  ];

  const huesped = data?.huesped;

  return (
    <AppShell
      title={huesped ? huesped.nombreCompleto : "Detalle de huésped"}
      description="Historial completo de visitas, estadía y consumos."
      actions={
        <Button variant="secondary" onClick={() => navigate("/consulta-huesped")}>
          Volver
        </Button>
      }
    >
      {guestId === null && (
        <Card>
          <p role="alert" className="text-sm text-red-600">
            ID inválido en la URL.
          </p>
        </Card>
      )}

      {guestId !== null && error && (
        <Card>
          <p role="alert" className="text-sm text-red-600">{error}</p>
        </Card>
      )}

      {guestId !== null && loading && !data && (
        <Card>
          <p className="text-sm text-slate-500">Cargando…</p>
        </Card>
      )}

      {data && huesped && (
        <div className="flex flex-col gap-4 md:gap-6">
          <Card>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
                  {huesped.nombreCompleto}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  ID #{huesped.id}
                  {huesped.tipoDocumento && ` · ${huesped.tipoDocumento}`}
                  {huesped.numeroDocumento && ` · ${huesped.numeroDocumento}`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
                  {data.totalVisits} {data.totalVisits === 1 ? "visita" : "visitas"}
                </span>
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                  {currencyFormatter("CLP", data.totalSpentClp)} acumulado
                </span>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                  {data.totalNights} {data.totalNights === 1 ? "noche" : "noches"}
                </span>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
            <Card title="Datos de contacto">
              <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
                <dt className="font-medium text-slate-700">Email</dt>
                <dd className="break-words text-slate-900">{huesped.email ?? "—"}</dd>
                <dt className="font-medium text-slate-700">Teléfono</dt>
                <dd className="text-slate-900">{huesped.telefono ?? "—"}</dd>
                <dt className="font-medium text-slate-700">Datos extra</dt>
                <dd className="text-slate-900 whitespace-pre-wrap break-words">
                  {huesped.datoExtra ?? "—"}
                </dd>
              </dl>
            </Card>

            <Card title="Resumen de visitas">
              <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
                <dt className="font-medium text-slate-700">Primera visita</dt>
                <dd className="text-slate-900">{dateFormatter(data.firstVisit)}</dd>
                <dt className="font-medium text-slate-700">Última visita</dt>
                <dd className="text-slate-900">{dateFormatter(data.lastVisit)}</dd>
                <dt className="font-medium text-slate-700">Total visitas</dt>
                <dd className="text-slate-900">{data.totalVisits}</dd>
                <dt className="font-medium text-slate-700">Total noches</dt>
                <dd className="text-slate-900">{data.totalNights}</dd>
                <dt className="font-medium text-slate-700">Total gastado (CLP)</dt>
                <dd className="text-slate-900">{currencyFormatter("CLP", data.totalSpentClp)}</dd>
              </dl>
            </Card>
          </div>

          <Card title="Reservas anteriores" description="Listado completo de estadías registradas.">
            <Table
              columns={bookingColumns}
              rows={data.bookings}
              rowKey={(row) => row.id}
              emptyMessage="Este huésped aún no tiene reservas registradas."
            />
          </Card>
        </div>
      )}
    </AppShell>
  );
};

export default GuestDetail;
