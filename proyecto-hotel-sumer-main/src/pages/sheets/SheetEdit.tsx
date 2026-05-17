import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Button,
  PageHeader,
  Skeleton,
} from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import {
  addParking,
  CATEGORIES,
  getFicha,
  getQuickpicks,
  handoffFicha,
  LOT_OPTIONS,
  removeParking,
  ROOM_OPTIONS,
  shiftLabel,
  updateFicha,
  type FichaDetail,
  type FichaReporte,
  type LotOption,
  type Quickpicks,
  type ReporteCategory,
  type RoomOption,
} from "../../types/sheet";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-cream px-3 py-2.5 text-sm focus:outline-none focus:border-marine focus:ring-1 focus:ring-marine disabled:cursor-not-allowed disabled:opacity-60";
const labelClass =
  "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5";

const AUTOSAVE_DEBOUNCE_MS = 600;

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

  // Collapsible groups. Default = all open.
  const [expanded, setExpanded] = useState<Set<ReporteCategory>>(
    () => new Set(CATEGORIES.map((c) => c.key)),
  );

  // Pending parking pair (the trailing empty [room][lot] selects). Saving
  // auto-fires the moment both halves are filled.
  const [pendingRoom, setPendingRoom] = useState<RoomOption | "">("");
  const [pendingLot, setPendingLot] = useState<LotOption | "">("");
  const [parkingBusy, setParkingBusy] = useState(false);

  const notesTimer = useRef<number | null>(null);
  const valueTimers = useRef<Map<number, number>>(new Map());
  const parkingInFlight = useRef(false);

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

  const grouped = useMemo(
    () => (ficha ? groupRows(ficha.reportes) : new Map<ReporteCategory, FichaReporte[]>()),
    [ficha],
  );

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

  // Multi-chip toggle: chip values are tracked as comma-joined tokens in
  // the input. Tapping a chip adds it (if absent) or removes it (if
  // already present); free-typed fragments are preserved.
  const onChipToggle = (ordinal: number, chip: string) => {
    const current = valueDrafts[ordinal] ?? "";
    const tokens = current
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const idx = tokens.indexOf(chip);
    if (idx >= 0) tokens.splice(idx, 1);
    else tokens.push(chip);
    const next = tokens.join(", ");
    setValueDrafts((prev) => ({ ...prev, [ordinal]: next }));
    // Cancel any in-flight debounce — chip taps save instantly.
    const t = valueTimers.current.get(ordinal);
    if (t) {
      window.clearTimeout(t);
      valueTimers.current.delete(ordinal);
    }
    void persistReporte(ordinal, next);
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

  const toggleGroup = (key: ReporteCategory) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  // Auto-add the pending parking pair once both halves are filled.
  // Uses a ref-based in-flight flag instead of putting parkingBusy in the
  // dep array — otherwise setParkingBusy(true) re-triggers the effect's
  // own cleanup, sets cancelled=true, and the setFicha call after the
  // await gets silently skipped.
  useEffect(() => {
    if (!pendingRoom || !pendingLot || fichaId === null) return;
    if (parkingInFlight.current) return;
    parkingInFlight.current = true;
    setParkingBusy(true);
    addParking(fichaId, pendingRoom, pendingLot)
      .then((updated) => {
        setFicha(updated);
        setPendingRoom("");
        setPendingLot("");
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("409")) toast.error("Esta ficha ya fue entregada");
        else if (msg.includes("400")) toast.error("Habitación o estacionamiento inválido");
        else toast.error("No se pudo agregar el estacionamiento");
        // Clear the pending pair on error too — otherwise the effect
        // refires forever on every render.
        setPendingRoom("");
        setPendingLot("");
      })
      .finally(() => {
        parkingInFlight.current = false;
        setParkingBusy(false);
      });
  }, [pendingRoom, pendingLot, fichaId]);

  const dropParking = async (parkingId: number) => {
    if (fichaId === null) return;
    setParkingBusy(true);
    try {
      const updated = await removeParking(fichaId, parkingId);
      setFicha(updated);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("409")) toast.error("Esta ficha ya fue entregada");
      else toast.error("No se pudo eliminar la entrada");
    } finally {
      setParkingBusy(false);
    }
  };

  const performHandoff = async () => {
    if (fichaId === null) return;
    setHandingOff(true);
    try {
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
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" rounded="lg" />
          ))}
        </div>
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

      {CATEGORIES.map(({ key, label }) => {
        const rows = grouped.get(key) ?? [];
        if (rows.length === 0) return null;
        const isOpen = expanded.has(key);
        return (
          <section
            key={key}
            className="rounded-xl border border-slate-200 bg-surface shadow-sm overflow-hidden"
          >
            <button
              type="button"
              onClick={() => toggleGroup(key)}
              aria-expanded={isOpen}
              className="w-full px-4 md:px-5 py-2.5 bg-cream border-b border-slate-100 flex items-center justify-between gap-3 hover:bg-cream/80 transition"
            >
              <h3 className="font-serif text-marine text-sm md:text-base uppercase tracking-wider">
                {label}
              </h3>
              <span
                aria-hidden="true"
                className={`text-marine text-lg leading-none transition-transform ${
                  isOpen ? "rotate-90" : ""
                }`}
              >
                ›
              </span>
            </button>

            {isOpen && (
              <div className="p-4 md:p-5 flex flex-col gap-5">
                {rows.map((r) => {
                  if (r.category === "estacionamiento") {
                    return (
                      <div key={r.ordinal}>
                        <p className={labelClass}>{r.label}</p>
                        <div className="flex flex-wrap gap-2">
                          {/* Empty pair is anchored at position 0 and never
                              moves — saved entries flow to its right. */}
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-marine/40 bg-marine/5 px-2 py-1">
                            <select
                              aria-label="Habitación"
                              value={pendingRoom}
                              onChange={(e) =>
                                setPendingRoom(e.target.value as RoomOption | "")
                              }
                              disabled={parkingBusy}
                              className="bg-transparent text-xs font-semibold text-marine focus:outline-none disabled:opacity-50"
                            >
                              <option value="">Habitación</option>
                              {ROOM_OPTIONS.map((room) => (
                                <option key={room} value={room}>
                                  {room}
                                </option>
                              ))}
                            </select>
                            <select
                              aria-label="Estacionamiento"
                              value={pendingLot}
                              onChange={(e) =>
                                setPendingLot(e.target.value as LotOption | "")
                              }
                              disabled={parkingBusy}
                              className="bg-transparent text-xs font-semibold text-gold focus:outline-none disabled:opacity-50"
                            >
                              <option value="">Estacionamiento</option>
                              {LOT_OPTIONS.map((lot) => (
                                <option key={lot} value={lot}>
                                  {lot}
                                </option>
                              ))}
                            </select>
                          </span>
                          {ficha.parkingEntries.map((p) => (
                            <span
                              key={p.id}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-cream px-2.5 py-1.5 text-xs font-semibold text-ink"
                            >
                              <span className="rounded bg-marine/10 text-marine px-1.5 py-0.5">
                                {p.room}
                              </span>
                              <span className="rounded bg-gold/10 text-gold px-1.5 py-0.5">
                                {p.lot}
                              </span>
                              <button
                                type="button"
                                aria-label="Quitar entrada"
                                onClick={() => void dropParking(p.id)}
                                disabled={parkingBusy}
                                className="ml-0.5 text-slate-400 hover:text-terracotta disabled:opacity-50"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                        <p className="mt-2 text-[10px] text-slate-400 uppercase tracking-wider">
                          Elige habitación y estacionamiento — la entrada se agrega sola.
                        </p>
                      </div>
                    );
                  }
                  const draft = valueDrafts[r.ordinal] ?? "";
                  const chips = quickpicks[r.label] ?? [];
                  const saving = savingOrdinals.has(r.ordinal);
                  return (
                    <div key={r.ordinal}>
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
                      {chips.length > 0 && (() => {
                        const tokens = new Set(
                          draft.split(",").map((s) => s.trim()).filter(Boolean),
                        );
                        return (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {chips.map((c) => {
                              const on = tokens.has(c);
                              return (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => onChipToggle(r.ordinal, c)}
                                  aria-pressed={on}
                                  className={`min-h-[36px] px-3 py-1.5 rounded-full border text-xs font-semibold transition ${
                                    on
                                      ? "bg-marine text-white border-marine"
                                      : "bg-cream text-ink border-slate-200 hover:border-marine"
                                  }`}
                                >
                                  {on && (
                                    <span className="mr-1" aria-hidden="true">
                                      ✓
                                    </span>
                                  )}
                                  {c}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}

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
