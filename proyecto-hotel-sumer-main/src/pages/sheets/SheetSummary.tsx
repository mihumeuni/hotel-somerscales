import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Button,
  Card,
  PageHeader,
  Skeleton,
} from "../../components/ui";
import {
  CATEGORIES,
  getFicha,
  shiftLabel,
  type FichaDetail,
  type FichaReporte,
  type ReporteCategory,
} from "../../types/sheet";
import { useAuth } from "../../context/AuthContext";

const turnoColor: Record<string, string> = {
  NOCHE: "bg-marine/15 text-marine border-marine/30",
  MANANA: "bg-gold/15 text-gold border-gold/30",
};

const groupRows = (reportes: FichaReporte[]) => {
  const buckets = new Map<ReporteCategory, FichaReporte[]>();
  for (const r of reportes) {
    if (!r.category) continue;
    const list = buckets.get(r.category) ?? [];
    list.push(r);
    buckets.set(r.category, list);
  }
  for (const list of buckets.values()) {
    list.sort((a, b) => a.ordinal - b.ordinal);
  }
  return buckets;
};

const SheetSummary = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, has } = useAuth();
  const canWrite = has("sheet.write");

  const fichaId = useMemo(() => {
    if (!id) return null;
    const n = Number(id);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [id]);

  const [ficha, setFicha] = useState<FichaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (fichaId === null) return;
    setLoading(true);
    setError(null);
    try {
      const detail = await getFicha(fichaId);
      setFicha(detail);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(msg.includes("404") ? "Ficha no encontrada" : "No se pudo cargar la ficha");
    } finally {
      setLoading(false);
    }
  }, [fichaId]);

  useEffect(() => {
    void load();
  }, [load]);

  const grouped = useMemo(
    () => (ficha ? groupRows(ficha.reportes) : new Map<ReporteCategory, FichaReporte[]>()),
    [ficha],
  );

  const handlePrint = () => {
    if (!ficha) return;
    window.print();
  };

  const handleExportPdf = () => {
    toast("Usa Imprimir → Guardar como PDF para exportar.", { icon: "ℹ️" });
  };

  const canResumeEdit =
    ficha != null
    && !ficha.locked
    && canWrite
    && user?.id === ficha.ownerUserId;

  if (loading) {
    return (
      <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-24 w-full" rounded="lg" />
        <Skeleton className="h-80 w-full" rounded="lg" />
      </div>
    );
  }

  if (error || !ficha) {
    return (
      <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
        <Card>
          <p role="alert" className="text-sm text-terracotta">
            {error ?? "No se pudo cargar la ficha."}
          </p>
          <div className="mt-3">
            <Button variant="secondary" onClick={() => navigate("/fichas")}>
              Volver al listado
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const parkingSummary =
    ficha.parkingEntries.length === 0
      ? null
      : ficha.parkingEntries.map((p) => `${p.room} · ${p.lot}`).join(", ");

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link
          to="/fichas"
          className="min-h-[36px] inline-flex items-center text-xs uppercase tracking-widest font-bold text-marine hover:underline"
        >
          ‹ Fichas
        </Link>
        <div className="flex items-center gap-2">
          {canResumeEdit && (
            <Button
              variant="secondary"
              onClick={() => navigate(`/fichas/${ficha.id}/editar`)}
            >
              Editar
            </Button>
          )}
          <button
            type="button"
            onClick={handleExportPdf}
            className="min-h-[36px] inline-flex items-center gap-2 rounded-full border border-slate-200 bg-cream px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-marine"
          >
            Exportar PDF
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="min-h-[36px] inline-flex items-center gap-2 rounded-full border border-marine/30 bg-marine/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-marine hover:bg-marine/10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir
          </button>
        </div>
      </div>

      <PageHeader
        title={`Ficha #${ficha.id.toString().padStart(4, "0")}`}
        description={`Resumen del turno · ${ficha.fecha}`}
      />

      <section className="rounded-xl border border-slate-200 bg-surface p-4 md:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
              Responsable
            </p>
            <p className="font-serif text-marine text-xl mt-1">
              {ficha.ownerName ?? "—"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <span
              className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full border ${
                turnoColor[ficha.shift] ?? ""
              }`}
            >
              {shiftLabel(ficha.shift)}
            </span>
            <span className="text-xs text-slate-500">
              {ficha.locked ? (
                <span className="text-emerald-700 font-semibold">Entregada</span>
              ) : (
                <span className="text-gold font-semibold">En curso</span>
              )}
            </span>
          </div>
        </div>
      </section>

      {CATEGORIES.map(({ key, label }) => {
        const rows = grouped.get(key) ?? [];
        if (rows.length === 0) return null;
        return (
          <section
            key={key}
            className="rounded-xl border border-slate-200 bg-surface shadow-sm overflow-hidden"
          >
            <header className="px-5 py-3 bg-cream border-b border-slate-100">
              <h3 className="font-serif text-marine text-base md:text-lg uppercase tracking-wider">
                {label}
              </h3>
            </header>

            {/* Desktop table */}
            <table className="w-full text-sm hidden md:table">
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => {
                  if (r.category === "estacionamiento") {
                    return (
                      <tr key={r.ordinal}>
                        <td className="px-5 py-2.5 text-slate-700 w-1/2">
                          {r.label}
                        </td>
                        <td className="px-5 py-2.5 text-ink">
                          {parkingSummary ?? (
                            <span className="text-slate-300 italic">sin dato</span>
                          )}
                        </td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={r.ordinal}>
                      <td className="px-5 py-2.5 text-slate-700 w-1/2">{r.label}</td>
                      <td className="px-5 py-2.5 text-ink">
                        {r.value ?? (
                          <span className="text-slate-300 italic">sin dato</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile: stacked rows */}
            <ul className="md:hidden divide-y divide-slate-100">
              {rows.map((r) => {
                if (r.category === "estacionamiento") {
                  return (
                    <li
                      key={r.ordinal}
                      className="px-5 py-3 flex flex-col gap-1.5"
                    >
                      <p className="text-sm text-ink">{r.label}</p>
                      {ficha.parkingEntries.length === 0 ? (
                        <p className="text-xs text-slate-300 italic">sin dato</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {ficha.parkingEntries.map((p) => (
                            <span
                              key={p.id}
                              className="inline-flex items-center rounded-full bg-cream border border-slate-200 px-2 py-0.5 text-xs font-semibold text-marine"
                            >
                              {p.room} · {p.lot}
                            </span>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                }
                return (
                  <li
                    key={r.ordinal}
                    className="px-5 py-3 flex items-center justify-between gap-3"
                  >
                    <p className="text-sm text-ink truncate flex-1 min-w-0">
                      {r.label}
                    </p>
                    <span className="font-mono text-sm text-marine shrink-0 max-w-[50%] truncate text-right">
                      {r.value ?? (
                        <span className="text-slate-300 italic">sin dato</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <section className="rounded-xl border border-slate-200 bg-surface p-4 md:p-6 shadow-sm">
        <h3 className="font-serif text-marine text-base md:text-lg mb-3">
          Notas del turno
        </h3>
        {ficha.notes ? (
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {ficha.notes}
          </p>
        ) : (
          <p className="text-sm text-slate-400 italic">Sin notas registradas.</p>
        )}
      </section>
    </div>
  );
};

export default SheetSummary;
