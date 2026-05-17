import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Card, PageHeader } from "../../components/ui";
import { findPastSheet, QUICK_CHIPS, REPORTES } from "./sampleData";

const turnoColor: Record<string, string> = {
  Noche: "bg-marine/15 text-marine border-marine/30",
  Tarde: "bg-terracotta/15 text-terracotta border-terracotta/30",
  Mañana: "bg-gold/15 text-gold border-gold/30",
};

const SheetSummary = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const sheet = useMemo(() => (id ? findPastSheet(id) : null), [id]);

  if (!sheet) {
    return (
      <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
        <Card>
          <p role="alert" className="text-sm text-terracotta">
            Ficha no encontrada o sin acceso.
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

  // Build a fake-but-deterministic distribution per reporte for the summary.
  const numbers = REPORTES.map((r, i) => ({
    ...r,
    value: ((sheet.reportes * 7 + i * 3) % 11),
  }));

  const handlePrint = () => window.print();

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/fichas"
          className="text-xs uppercase tracking-widest font-bold text-marine hover:underline"
        >
          ‹ Fichas
        </Link>
        {/* Hidden in print previews so the bitácora exports clean. */}
        <button
          type="button"
          onClick={handlePrint}
          className="print:hidden min-h-[36px] inline-flex items-center gap-2 rounded-full border border-marine/30 bg-marine/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-marine hover:bg-marine/10"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Imprimir
        </button>
      </div>

      <PageHeader
        title={`Ficha ${sheet.id}`}
        description={`Resumen del turno · ${sheet.fecha}`}
      />

      <section className="rounded-xl border border-slate-200 bg-surface p-4 md:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
              Responsable
            </p>
            <p className="font-serif text-marine text-xl mt-1">
              {sheet.recepcionista}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <span
              className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full border ${
                turnoColor[sheet.turno] ?? ""
              }`}
            >
              {sheet.turno}
            </span>
            <span className="text-xs text-slate-500">
              {sheet.reportes} reportes ·{" "}
              {sheet.incidentes > 0 ? (
                <span className="text-terracotta font-semibold">
                  {sheet.incidentes} incidente{sheet.incidentes === 1 ? "" : "s"}
                </span>
              ) : (
                "sin incidentes"
              )}
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-surface shadow-sm overflow-hidden">
        <header className="px-5 py-3 bg-cream border-b border-slate-100">
          <h3 className="font-serif text-marine text-base md:text-lg">
            Reportes operativos
          </h3>
        </header>

        {/* Desktop table */}
        <table className="w-full text-sm hidden md:table">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-500">
            <tr>
              <th className="px-5 py-2.5 text-left">Reporte</th>
              <th className="px-5 py-2.5 text-left">Grupo</th>
              <th className="px-5 py-2.5 text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {numbers.map((r) => (
              <tr key={r.code}>
                <td className="px-5 py-2.5 text-slate-700">{r.label}</td>
                <td className="px-5 py-2.5 text-slate-500 capitalize text-xs">
                  {r.group}
                </td>
                <td className="px-5 py-2.5 text-right font-mono">{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Mobile: stacked rows so values don't overflow */}
        <ul className="md:hidden divide-y divide-slate-100">
          {numbers.map((r) => (
            <li
              key={r.code}
              className="px-5 py-3 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-sm text-ink truncate">{r.label}</p>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 capitalize">
                  {r.group}
                </p>
              </div>
              <span className="font-mono text-base text-marine">{r.value}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-surface p-4 md:p-6 shadow-sm">
        <h3 className="font-serif text-marine text-base md:text-lg mb-3">
          Incidencias destacadas
        </h3>
        <div className="flex flex-wrap gap-2">
          {QUICK_CHIPS.slice(0, 3).map((c) => (
            <span
              key={c.code}
              className="px-3 py-1 rounded-full border border-marine/30 bg-marine/5 text-marine text-xs font-semibold"
            >
              {c.label}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-surface p-4 md:p-6 shadow-sm">
        <h3 className="font-serif text-marine text-base md:text-lg mb-3">
          Bitácora libre
        </h3>
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
          Llamada de 22:14 — huésped 304 reporta ruido en pasillo. Se atiende
          a 22:18, se acompaña al área de fumadores y se cierra el ticket sin
          escalamiento.{"\n\n"}
          Caja cuadra. Sin novedades adicionales para el próximo turno.
        </p>
      </section>
    </div>
  );
};

export default SheetSummary;
