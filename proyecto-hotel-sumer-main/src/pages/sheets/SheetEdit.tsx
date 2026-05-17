import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Button, PageHeader } from "../../components/ui";
import { QUICK_CHIPS, REPORTES, type SheetReporte } from "./sampleData";

const GROUP_LABEL: Record<SheetReporte["group"], string> = {
  operativo: "Operativo",
  huesped: "Atención al huésped",
  mantenimiento: "Mantenimiento",
  seguridad: "Seguridad",
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-cream px-3 py-2.5 text-sm focus:outline-none focus:border-marine focus:ring-1 focus:ring-marine";
const labelClass =
  "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5";

const SheetEdit = () => {
  const navigate = useNavigate();

  const [turno, setTurno] = useState<"Mañana" | "Tarde" | "Noche">("Tarde");
  const [horaInicio, setHoraInicio] = useState("");
  const [counts, setCounts] = useState<Record<string, string>>(() =>
    Object.fromEntries(REPORTES.map((r) => [r.code, ""])),
  );
  const [selectedChips, setSelectedChips] = useState<Set<string>>(new Set());
  const [bitacora, setBitacora] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const grouped = useMemo(() => {
    const m = new Map<SheetReporte["group"], SheetReporte[]>();
    for (const r of REPORTES) {
      if (!m.has(r.group)) m.set(r.group, []);
      m.get(r.group)!.push(r);
    }
    return Array.from(m.entries());
  }, []);

  const toggleChip = (code: string) =>
    setSelectedChips((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Real persistence lands with the sheets backend (task027+). For now we
    // confirm the form is wired and bounce to the summary page.
    await new Promise((r) => setTimeout(r, 350));
    setSubmitting(false);
    toast.success("Ficha cerrada — bitácora archivada");
    navigate("/fichas");
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
      <PageHeader
        title="Nueva ficha de turno"
        description="Captura los 22 reportes operativos y deja la bitácora del turno."
      />

      <form onSubmit={submit} className="flex flex-col gap-6">
        {/* Turno + hora de inicio */}
        <section className="rounded-xl border border-slate-200 bg-surface p-4 md:p-6 shadow-sm">
          <h3 className="font-serif text-marine text-base md:text-lg mb-4">
            Inicio del turno
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="sh-turno">Turno</label>
              <select
                id="sh-turno"
                value={turno}
                onChange={(e) => setTurno(e.target.value as typeof turno)}
                className={inputClass}
              >
                <option>Mañana</option>
                <option>Tarde</option>
                <option>Noche</option>
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="sh-hora">Hora de inicio</label>
              <input
                id="sh-hora"
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        {/* 22 reportes operativos — reflow label-above-input on mobile */}
        {grouped.map(([group, items]) => (
          <section
            key={group}
            className="rounded-xl border border-slate-200 bg-surface p-4 md:p-6 shadow-sm"
          >
            <h3 className="font-serif text-marine text-base md:text-lg mb-4">
              {GROUP_LABEL[group]}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
              {items.map((r) => (
                <div key={r.code}>
                  <label className={labelClass} htmlFor={`r-${r.code}`}>
                    {r.label}
                  </label>
                  <input
                    id={`r-${r.code}`}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={counts[r.code] ?? ""}
                    onChange={(e) =>
                      setCounts((prev) => ({ ...prev, [r.code]: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Chips de incidencias rápidas — wrap on mobile */}
        <section className="rounded-xl border border-slate-200 bg-surface p-4 md:p-6 shadow-sm">
          <h3 className="font-serif text-marine text-base md:text-lg mb-3">
            Incidencias rápidas
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Toca cada incidencia que ocurrió en el turno — se incluye en el resumen.
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_CHIPS.map((c) => {
              const on = selectedChips.has(c.code);
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => toggleChip(c.code)}
                  className={`min-h-[36px] px-3 py-1.5 rounded-full border text-xs font-semibold transition ${
                    on
                      ? "bg-marine text-white border-marine"
                      : "bg-cream text-ink border-slate-200 hover:border-marine"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Bitácora libre */}
        <section className="rounded-xl border border-slate-200 bg-surface p-4 md:p-6 shadow-sm">
          <h3 className="font-serif text-marine text-base md:text-lg mb-3">
            Bitácora libre
          </h3>
          <textarea
            value={bitacora}
            onChange={(e) => setBitacora(e.target.value)}
            rows={6}
            placeholder="Notas, llamadas pendientes, contexto para el próximo turno…"
            className={`${inputClass} resize-y leading-relaxed`}
          />
        </section>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/fichas")}
            disabled={submitting}
            className="min-h-[44px] px-5 py-2 text-sm text-slate-600 hover:text-marine font-semibold disabled:opacity-50"
          >
            Cancelar
          </button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Cerrando…" : "Cerrar y archivar ficha"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SheetEdit;
