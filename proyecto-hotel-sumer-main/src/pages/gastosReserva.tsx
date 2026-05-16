import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/apiClient";
import { useAuth } from "../context/AuthContext";
import {
  Button,
  Card,
  Input,
  Modal,
  PageHeader,
  Table,
  fieldBaseClasses,
  type Column,
} from "../components/ui";

type Moneda = "CLP" | "USD" | "EUR";

type Expense = {
  id: number;
  reservaId: number;
  concepto: string;
  monto: number;
  moneda: Moneda;
  fecha: string;
  createdById: number | null;
  createdByUsername: string | null;
  notas: string | null;
};

type ExpenseListResponse = {
  reservaId: number;
  items: Expense[];
  totals: Record<string, number>;
};

const MONEDAS: Moneda[] = ["CLP", "USD", "EUR"];

const monedaFormatter = (moneda: string, amount: number) => {
  try {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: moneda,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${moneda}`;
  }
};

const fechaFormatter = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-CL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const GastosReserva: React.FC = () => {
  const { reservaId } = useParams<{ reservaId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const canWrite = user?.role === "ADMIN" || user?.role === "RECEPCIONISTA";
  const writeBlockedReason = canWrite ? undefined : "Sin permiso (expense.write)";

  const [items, setItems] = useState<Expense[]>([]);
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [moneda, setMoneda] = useState<Moneda>("CLP");
  const [notas, setNotas] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const validReservaId = useMemo(() => {
    const n = Number(reservaId);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [reservaId]);

  const load = useCallback(async () => {
    if (validReservaId === null) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<ExpenseListResponse>(
        `/api/reservas/${validReservaId}/expenses`,
      );
      setItems(data.items);
      setTotals(data.totals ?? {});
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al cargar gastos";
      setError(msg.includes("403") ? "Sin permiso para ver gastos" : msg);
    } finally {
      setLoading(false);
    }
  }, [validReservaId]);

  useEffect(() => {
    void load();
  }, [load]);

  const resetForm = () => {
    setConcepto("");
    setMonto("");
    setMoneda("CLP");
    setNotas("");
    setFormError(null);
  };

  const openModal = () => {
    if (!canWrite) return;
    resetForm();
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validReservaId === null) return;
    const trimmedConcepto = concepto.trim();
    const montoNum = Number(monto);
    if (!trimmedConcepto) {
      setFormError("Concepto requerido");
      return;
    }
    if (!Number.isFinite(montoNum) || montoNum <= 0) {
      setFormError("Monto debe ser un número mayor a 0");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await api.post<Expense>(`/api/reservas/${validReservaId}/expenses`, {
        concepto: trimmedConcepto,
        monto: montoNum,
        moneda,
        notas: notas.trim() ? notas.trim() : null,
      });
      setModalOpen(false);
      resetForm();
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al crear gasto";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!canWrite) return;
    if (!window.confirm("¿Eliminar este gasto?")) return;
    try {
      await api.delete<void>(`/api/expenses/${id}`);
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al eliminar";
      setError(msg);
    }
  };

  const columns: Column<Expense>[] = [
    {
      key: "fecha",
      header: "Fecha",
      render: (row) => fechaFormatter(row.fecha),
    },
    { key: "concepto", header: "Concepto" },
    {
      key: "monto",
      header: "Monto",
      className: "text-right",
      render: (row) => monedaFormatter(row.moneda, Number(row.monto)),
    },
    { key: "moneda", header: "Moneda" },
    {
      key: "notas",
      header: "Notas",
      render: (row) => row.notas ?? "—",
    },
    {
      key: "createdByUsername",
      header: "Creado por",
      render: (row) => row.createdByUsername ?? "—",
    },
    {
      key: "acciones",
      header: "Acciones",
      className: "text-right",
      render: (row) => (
        <Button
          variant="danger"
          size="sm"
          disabled={!canWrite}
          title={writeBlockedReason}
          onClick={() => handleDelete(row.id)}
          aria-label={`Eliminar gasto ${row.id}`}
        >
          Eliminar
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={`Gastos de la reserva${validReservaId !== null ? ` #${validReservaId}` : ""}`}
        description="Listado de cargos adicionales (consumos, traslados, extras)."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Volver
            </Button>
            <Button
              onClick={openModal}
              disabled={!canWrite || validReservaId === null}
              title={writeBlockedReason}
            >
              Añadir gasto
            </Button>
          </div>
        }
      />
      {validReservaId === null ? (
        <Card>
          <p role="alert" className="text-sm text-red-600">
            ID de reserva inválido en la URL.
          </p>
        </Card>
      ) : (
        <>
          {!canWrite && (
            <p className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Vista de solo lectura — tu rol no permite registrar ni eliminar gastos.
            </p>
          )}
          {error && (
            <p role="alert" className="mb-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <Card title="Detalle">
            {loading ? (
              <p className="text-sm text-slate-500">Cargando…</p>
            ) : (
              <>
                <Table
                  columns={columns}
                  rows={items}
                  rowKey={(row) => row.id}
                  emptyMessage="Esta reserva no tiene gastos registrados."
                />

                {Object.keys(totals).length > 0 && (
                  <div className="mt-4 border-t border-slate-200 pt-3">
                    <h3 className="text-sm font-medium text-slate-700">Totales por moneda</h3>
                    <ul className="mt-1 grid grid-cols-1 gap-1 text-sm text-slate-900 sm:grid-cols-3">
                      {Object.entries(totals).map(([m, v]) => (
                        <li key={m} className="flex justify-between rounded-md bg-slate-50 px-3 py-1.5">
                          <span className="font-medium">{m}</span>
                          <span>{monedaFormatter(m, Number(v))}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </Card>
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Añadir gasto"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" form="add-expense-form" disabled={submitting}>
              {submitting ? "Guardando…" : "Guardar"}
            </Button>
          </>
        }
      >
        <form id="add-expense-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            label="Concepto"
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            maxLength={200}
            required
            autoFocus
          />
          <Input
            label="Monto"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            required
          />
          <div className="flex flex-col gap-1">
            <label htmlFor="add-expense-moneda" className="text-sm font-medium text-slate-700">
              Moneda
            </label>
            <select
              id="add-expense-moneda"
              value={moneda}
              onChange={(e) => setMoneda(e.target.value as Moneda)}
              className={fieldBaseClasses}
            >
              {MONEDAS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="add-expense-notas" className="text-sm font-medium text-slate-700">
              Notas (opcional)
            </label>
            <textarea
              id="add-expense-notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
              className={fieldBaseClasses}
            />
          </div>
          {formError && (
            <p role="alert" className="text-sm text-red-600">
              {formError}
            </p>
          )}
        </form>
      </Modal>
    </>
  );
};

export default GastosReserva;
