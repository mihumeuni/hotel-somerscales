import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Button,
  Modal,
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
  // Ensure intra-group order matches ordinal.
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
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [handingOff, setHandingOff] = useState(false);
  const [confirmHandoff, setConfirmHandoff] = useState(false);

  // Modal state: which row is being edited (null = closed).
  const [editing, setEditing] = useState<FichaReporte | null>(null);
  const [editingDraft, setEditingDraft] = useState("");
  const [editingSaving, setEditingSaving] = useState(false);

  // Parking modal state (open when the Estacionamiento row is tapped).
  const [parkingOpen, setParkingOpen] = useState(false);
  const [pendingRoom, setPendingRoom] = useState<RoomOption | "">("");
  const [pendingLot, setPendingLot] = useState<LotOption | "">("");
  const [parkingBusy, setParkingBusy] = useState(false);

  const notesTimer = useRef<number | null>(null);

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

  // ----- Standard row modal -----

  const openRow = (r: FichaReporte) => {
    if (r.category === "estacionamiento") {
      setPendingRoom("");
      setPendingLot("");
      setParkingOpen(true);
      return;
    }
    setEditing(r);
    setEditingDraft(r.value ?? "");
  };

  const closeRow = () => {
    setEditing(null);
    setEditingDraft("");
  };

  const saveRow = async () => {
    if (!editing || fichaId === null) return;
    setEditingSaving(true);
    try {
      const trimmed = editingDraft.trim();
      const updated = await updateFicha(fichaId, {
        reportes: [{ ordinal: editing.ordinal, value: trimmed ? editingDraft : null }],
      });
      setFicha(updated);
      closeRow();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("409")) toast.error("Esta ficha ya fue entregada");
      else toast.error("No se pudo guardar el reporte");
    } finally {
      setEditingSaving(false);
    }
  };

  // ----- Parking modal -----

  const closeParking = () => {
    setParkingOpen(false);
    setPendingRoom("");
    setPendingLot("");
  };

  const submitParking = async () => {
    if (!pendingRoom || !pendingLot || fichaId === null) return;
    setParkingBusy(true);
    try {
      const updated = await addParking(fichaId, pendingRoom, pendingLot);
      setFicha(updated);
      setPendingRoom("");
      setPendingLot("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("409")) toast.error("Esta ficha ya fue entregada");
      else if (msg.includes("400")) toast.error("Habitación o estacionamiento inválido");
      else toast.error("No se pudo agregar el estacionamiento");
    } finally {
      setParkingBusy(false);
    }
  };

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

  const editingChips = editing ? quickpicks[editing.label] ?? [] : [];

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
      <PageHeader
        title={`Ficha #${ficha.id.toString().padStart(4, "0")}`}
        description={`Turno ${shiftLabel(ficha.shift)} · ${ficha.fecha} · toca un reporte para editar`}
      />

      {CATEGORIES.map(({ key, label }) => {
        const rows = grouped.get(key) ?? [];
        if (rows.length === 0) return null;
        return (
          <section
            key={key}
            className="rounded-xl border border-slate-200 bg-surface shadow-sm overflow-hidden"
          >
            <header className="px-4 md:px-5 py-2.5 bg-cream border-b border-slate-100 sticky top-0 z-10">
              <h3 className="font-serif text-marine text-sm md:text-base uppercase tracking-wider">
                {label}
              </h3>
            </header>
            <ul className="divide-y divide-slate-100">
              {rows.map((r) => {
                if (r.category === "estacionamiento") {
                  return (
                    <li key={r.ordinal} className="px-4 md:px-5 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-ink">{r.label}</p>
                        <button
                          type="button"
                          onClick={() => openRow(r)}
                          className="shrink-0 min-h-[36px] px-3 py-1.5 rounded-full border border-marine/30 bg-marine/5 text-xs font-bold uppercase tracking-wider text-marine hover:bg-marine/10"
                        >
                          + Agregar
                        </button>
                      </div>
                      {ficha.parkingEntries.length === 0 ? (
                        <p className="mt-2 text-xs text-slate-400 italic">
                          Sin registros de estacionamiento.
                        </p>
                      ) : (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {ficha.parkingEntries.map((p) => (
                            <span
                              key={p.id}
                              className="inline-flex items-center gap-1.5 rounded-full bg-cream border border-slate-200 px-2.5 py-1 text-xs font-semibold text-ink"
                            >
                              <span>
                                {p.room} · {p.lot}
                              </span>
                              <button
                                type="button"
                                aria-label="Quitar entrada"
                                onClick={() => void dropParking(p.id)}
                                disabled={parkingBusy}
                                className="text-slate-400 hover:text-terracotta disabled:opacity-50"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                }
                const value = r.value;
                return (
                  <li key={r.ordinal}>
                    <button
                      type="button"
                      onClick={() => openRow(r)}
                      className="w-full px-4 md:px-5 py-3 flex items-center justify-between gap-3 text-left hover:bg-cream transition"
                    >
                      <span className="text-sm text-ink truncate flex-1 min-w-0">
                        {r.label}
                      </span>
                      <span className="font-mono text-sm shrink-0 max-w-[55%] truncate text-right">
                        {value ? (
                          <span className="text-marine">{value}</span>
                        ) : (
                          <span className="text-slate-300 italic">sin dato</span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
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

      {/* Standard reporte editor modal */}
      <Modal
        open={editing !== null}
        onClose={closeRow}
        title={editing?.label ?? ""}
        footer={
          <>
            <Button variant="secondary" onClick={closeRow} disabled={editingSaving}>
              Cancelar
            </Button>
            <Button onClick={saveRow} disabled={editingSaving}>
              {editingSaving ? "Guardando…" : "Guardar"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <div>
            <label className={labelClass} htmlFor="reporte-editor-input">
              Valor
            </label>
            <input
              id="reporte-editor-input"
              type="text"
              autoFocus
              value={editingDraft}
              onChange={(e) => setEditingDraft(e.target.value)}
              className={inputClass}
            />
          </div>
          {editingChips.length > 0 && (
            <div>
              <p className={labelClass}>Sugerencias rápidas</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {editingChips.map((c) => {
                  const on = editingDraft === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditingDraft(c)}
                      className={`min-h-[40px] px-3 py-2 rounded-lg border text-xs font-semibold transition text-center ${
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
            </div>
          )}
        </div>
      </Modal>

      {/* Parking editor modal */}
      <Modal
        open={parkingOpen}
        onClose={closeParking}
        title="Estacionamiento"
        footer={
          <Button variant="secondary" onClick={closeParking}>
            Cerrar
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          {ficha.parkingEntries.length > 0 && (
            <div>
              <p className={labelClass}>Asignaciones actuales</p>
              <div className="flex flex-wrap gap-2">
                {ficha.parkingEntries.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-cream border border-slate-200 px-2.5 py-1 text-xs font-semibold text-ink"
                  >
                    <span>
                      {p.room} · {p.lot}
                    </span>
                    <button
                      type="button"
                      aria-label="Quitar entrada"
                      onClick={() => void dropParking(p.id)}
                      disabled={parkingBusy}
                      className="text-slate-400 hover:text-terracotta disabled:opacity-50"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="parking-room">
                Habitación
              </label>
              <select
                id="parking-room"
                value={pendingRoom}
                onChange={(e) => setPendingRoom(e.target.value as RoomOption | "")}
                className={inputClass}
              >
                <option value="">—</option>
                {ROOM_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="parking-lot">
                Estacionamiento
              </label>
              <select
                id="parking-lot"
                value={pendingLot}
                onChange={(e) => setPendingLot(e.target.value as LotOption | "")}
                className={inputClass}
              >
                <option value="">—</option>
                {LOT_OPTIONS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button
            onClick={submitParking}
            disabled={!pendingRoom || !pendingLot || parkingBusy}
          >
            {parkingBusy ? "Guardando…" : "Agregar entrada"}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default SheetEdit;
