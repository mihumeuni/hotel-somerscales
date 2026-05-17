import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Button,
  Card,
  PageHeader,
  Skeleton,
} from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import {
  getFicha,
  getQuickpicks,
  handoffFicha,
  shiftLabel,
  updateFicha,
  type FichaDetail,
  type Quickpicks,
} from "../../types/sheet";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-cream px-3 py-2.5 text-sm focus:outline-none focus:border-marine focus:ring-1 focus:ring-marine disabled:cursor-not-allowed disabled:opacity-60";
const labelClass =
  "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5";

const AUTOSAVE_DEBOUNCE_MS = 600;

const SheetEdit = () => {
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
  const [quickpicks, setQuickpicks] = useState<Quickpicks>({});
  const [loading, setLoading] = useState(true);
  const [savingOrdinals, setSavingOrdinals] = useState<Set<number>>(new Set());
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [valueDrafts, setValueDrafts] = useState<Record<number, string>>({});
  const [handingOff, setHandingOff] = useState(false);
  const [confirmHandoff, setConfirmHandoff] = useState(false);

  const notesTimer = useRef<number | null>(null);
  const valueTimers = useRef<Map<number, number>>(new Map());

  // Initial load.
  useEffect(() => {
    if (fichaId === null) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([getFicha(fichaId), getQuickpicks().catch(() => ({}))])
      .then(([detail, qp]) => {
        if (cancelled) return;
        setFicha(detail);
        setQuickpicks(qp);
        setNotesDraft(detail.notes ?? "");
        const drafts: Record<number, string> = {};
        for (const r of detail.reportes) {
          drafts[r.ordinal] = r.value ?? "";
        }
        setValueDrafts(drafts);
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("404")) {
          toast.error("Ficha no encontrada");
          navigate("/fichas", { replace: true });
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [fichaId, navigate]);

  // Permission gate: redirect to summary if locked or not owner.
  useEffect(() => {
    if (!ficha || !user) return;
    const notMine = ficha.ownerUserId !== user.id;
    if (!canWrite || ficha.locked || notMine) {
      navigate(`/fichas/${ficha.id}/resumen`, { replace: true });
    }
  }, [ficha, user, canWrite, navigate]);

  const markSaving = (ordinal: number, on: boolean) =>
    setSavingOrdinals((prev) => {
      const next = new Set(prev);
      if (on) next.add(ordinal);
      else next.delete(ordinal);
      return next;
    });

  const persistReporte = useCallback(
    async (ordinal: number, value: string) => {
      if (fichaId === null) return;
      markSaving(ordinal, true);
      try {
        const updated = await updateFicha(fichaId, {
          reportes: [{ ordinal, value: value.trim() ? value : null }],
        });
        setFicha(updated);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("409")) toast.error("Esta ficha ya fue entregada");
        else toast.error("No se pudo guardar el reporte");
      } finally {
        markSaving(ordinal, false);
      }
    },
    [fichaId],
  );

  const persistNotes = useCallback(
    async (value: string) => {
      if (fichaId === null) return;
      setSavingNotes(true);
      try {
        const updated = await updateFicha(fichaId, { notes: value });
        setFicha(updated);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("409")) toast.error("Esta ficha ya fue entregada");
        else toast.error("No se pudieron guardar las notas");
      } finally {
        setSavingNotes(false);
      }
    },
    [fichaId],
  );

  const onValueChange = (ordinal: number, value: string) => {
    setValueDrafts((prev) => ({ ...prev, [ordinal]: value }));
    const existing = valueTimers.current.get(ordinal);
    if (existing) window.clearTimeout(existing);
    const t = window.setTimeout(() => {
      void persistReporte(ordinal, value);
      valueTimers.current.delete(ordinal);
    }, AUTOSAVE_DEBOUNCE_MS);
    valueTimers.current.set(ordinal, t);
  };

  const onValueBlur = (ordinal: number) => {
    const t = valueTimers.current.get(ordinal);
    if (t) {
      window.clearTimeout(t);
      valueTimers.current.delete(ordinal);
    }
    void persistReporte(ordinal, valueDrafts[ordinal] ?? "");
  };

  const onChipPick = (ordinal: number, value: string) => {
    setValueDrafts((prev) => ({ ...prev, [ordinal]: value }));
    void persistReporte(ordinal, value);
  };

  const onNotesChange = (value: string) => {
    setNotesDraft(value);
    if (notesTimer.current) window.clearTimeout(notesTimer.current);
    notesTimer.current = window.setTimeout(() => {
      void persistNotes(value);
      notesTimer.current = null;
    }, AUTOSAVE_DEBOUNCE_MS);
  };

  const onNotesBlur = () => {
    if (notesTimer.current) {
      window.clearTimeout(notesTimer.current);
      notesTimer.current = null;
    }
    void persistNotes(notesDraft);
  };

  const performHandoff = async () => {
    if (fichaId === null) return;
    setHandingOff(true);
    try {
      // Flush any pending debounced saves before locking.
      if (notesTimer.current) {
        window.clearTimeout(notesTimer.current);
        notesTimer.current = null;
        await persistNotes(notesDraft);
      }
      for (const [ordinal, t] of valueTimers.current.entries()) {
        window.clearTimeout(t);
        await persistReporte(ordinal, valueDrafts[ordinal] ?? "");
      }
      valueTimers.current.clear();

      const result = await handoffFicha(fichaId);
      setFicha(result);
      toast.success("Turno entregado");
      navigate(`/fichas/${result.id}/resumen`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("403")) toast.error("No puedes entregar este turno");
      else toast.error("No se pudo entregar la ficha");
    } finally {
      setHandingOff(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
        <Skeleton className="h-8 w-48" />
        <Card>
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" rounded="lg" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (!ficha) return null;

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
      <PageHeader
        title={`Ficha #${ficha.id.toString().padStart(4, "0")}`}
        description={`Turno ${shiftLabel(ficha.shift)} · ${ficha.fecha} · auto-guardado al perder foco`}
      />

      <section className="rounded-xl border border-slate-200 bg-surface p-4 md:p-6 shadow-sm">
        <h3 className="font-serif text-marine text-base md:text-lg mb-4">
          Reportes operativos
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Los chips bajo cada campo prellenan valores frecuentes. Toca un chip
          y se guarda automáticamente.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
          {ficha.reportes.map((r) => {
            const draft = valueDrafts[r.ordinal] ?? "";
            const chips = quickpicks[r.label] ?? [];
            const saving = savingOrdinals.has(r.ordinal);
            return (
              <div key={r.ordinal} className={chips.length > 0 ? "sm:col-span-2" : ""}>
                <label className={labelClass} htmlFor={`r-${r.ordinal}`}>
                  {r.label}
                  {saving && (
                    <span className="ml-2 text-marine font-normal normal-case tracking-normal">
                      · guardando…
                    </span>
                  )}
                </label>
                <input
                  id={`r-${r.ordinal}`}
                  type="text"
                  value={draft}
                  onChange={(e) => onValueChange(r.ordinal, e.target.value)}
                  onBlur={() => onValueBlur(r.ordinal)}
                  className={inputClass}
                />
                {chips.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {chips.map((c) => {
                      const on = draft === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => onChipPick(r.ordinal, c)}
                          className={`min-h-[36px] px-3 py-1.5 rounded-full border text-xs font-semibold transition ${
                            on
                              ? "bg-marine text-white border-marine"
                              : "bg-cream text-ink border-slate-200 hover:border-marine"
                          }`}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-surface p-4 md:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-marine text-base md:text-lg">
            Notas del turno
          </h3>
          {savingNotes && (
            <span className="text-xs text-marine">guardando…</span>
          )}
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Observaciones, incidentes, pendientes para el próximo turno.
        </p>
        <textarea
          value={notesDraft}
          onChange={(e) => onNotesChange(e.target.value)}
          onBlur={onNotesBlur}
          rows={8}
          placeholder="Pasajero H5 pidió cambio de almohada · Se cayó cuadro en cocina, se reparó · Calefacción se apagó automáticamente a las 01:30…"
          className={`${inputClass} resize-y leading-relaxed`}
        />
      </section>

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate("/fichas")}
          className="min-h-[44px] px-5 py-2 text-sm text-slate-600 hover:text-marine font-semibold"
        >
          Volver al listado
        </button>
        {!confirmHandoff ? (
          <Button
            variant="danger"
            onClick={() => setConfirmHandoff(true)}
            disabled={handingOff}
          >
            Entregar turno
          </Button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <span className="text-xs text-terracotta font-bold uppercase tracking-wider">
              ¿Entregar y bloquear?
            </span>
            <Button
              variant="secondary"
              onClick={() => setConfirmHandoff(false)}
              disabled={handingOff}
            >
              Cancelar
            </Button>
            <Button variant="danger" onClick={performHandoff} disabled={handingOff}>
              {handingOff ? "Entregando…" : "Sí, entregar"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SheetEdit;
