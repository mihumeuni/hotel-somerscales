import { useEffect, useMemo, useState } from "react";
import { Button, Card, EmptyState, Input, Skeleton } from "../../components/ui";
import {
  createQuickpick,
  deleteQuickpick,
  listQuickpickLabels,
  listQuickpicks,
  updateQuickpick,
  type FichaQuickpick,
} from "../../types/quickpicks";

type Toast = { kind: "ok" | "error"; text: string } | null;

const groupByRowLabel = (rows: FichaQuickpick[]): Record<string, FichaQuickpick[]> => {
  const out: Record<string, FichaQuickpick[]> = {};
  for (const r of rows) {
    if (!out[r.rowLabel]) out[r.rowLabel] = [];
    out[r.rowLabel].push(r);
  }
  for (const key of Object.keys(out)) {
    out[key].sort((a, b) => a.ordinal - b.ordinal);
  }
  return out;
};

export const QuickpicksTab = () => {
  const [items, setItems] = useState<FichaQuickpick[] | null>(null);
  const [labels, setLabels] = useState<string[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<{ id: number; value: string } | null>(null);
  const [newChip, setNewChip] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  useEffect(() => {
    let active = true;
    Promise.all([listQuickpicks(), listQuickpickLabels()])
      .then(([data, lbls]) => {
        if (!active) return;
        setItems(data);
        setLabels(lbls);
      })
      .catch((e) => active && setLoadError(String(e?.message ?? e)));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const grouped = useMemo(() => (items ? groupByRowLabel(items) : {}), [items]);
  // Use the BE canonical label list as the source of truth for which
  // rows to render. Fold in any extra labels found in `items` (e.g. a
  // legacy row that was seeded before the canonical list shrank) so
  // they remain editable. Order: canonical first (BE order), then any
  // extras alphabetically.
  const rowLabels = useMemo(() => {
    const canonical = labels ?? [];
    const fromItems = Object.keys(grouped);
    const known = new Set(canonical);
    const extras = fromItems.filter((l) => !known.has(l)).sort();
    return [...canonical, ...extras];
  }, [labels, grouped]);

  const refresh = async () => setItems(await listQuickpicks());

  const onAdd = async (rowLabel: string) => {
    const text = (newChip[rowLabel] ?? "").trim();
    if (!text) return;
    setBusy(true);
    try {
      await createQuickpick({ rowLabel, value: text, ordinal: 0 });
      setNewChip((prev) => ({ ...prev, [rowLabel]: "" }));
      await refresh();
      setToast({ kind: "ok", text: "Quick-pick agregado" });
    } catch (e) {
      setToast({ kind: "error", text: String((e as Error)?.message ?? e) });
    } finally {
      setBusy(false);
    }
  };

  const onSaveEdit = async () => {
    if (!editing) return;
    const text = editing.value.trim();
    if (!text) return;
    const current = items?.find((x) => x.id === editing.id);
    if (!current) return;
    setBusy(true);
    try {
      await updateQuickpick(editing.id, {
        rowLabel: current.rowLabel,
        value: text,
        ordinal: current.ordinal,
      });
      setEditing(null);
      await refresh();
      setToast({ kind: "ok", text: "Quick-pick actualizado" });
    } catch (e) {
      setToast({ kind: "error", text: String((e as Error)?.message ?? e) });
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (q: FichaQuickpick) => {
    if (!confirm(`¿Eliminar "${q.value}" de ${q.rowLabel}?`)) return;
    setBusy(true);
    try {
      await deleteQuickpick(q.id);
      await refresh();
      setToast({ kind: "ok", text: "Quick-pick eliminado" });
    } catch (e) {
      setToast({ kind: "error", text: String((e as Error)?.message ?? e) });
    } finally {
      setBusy(false);
    }
  };

  if (loadError) {
    return <EmptyState title="No se pudo cargar" body={loadError} />;
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div
          role="status"
          className={
            "rounded-md px-3 py-2 text-sm " +
            (toast.kind === "ok"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200")
          }
        >
          {toast.text}
        </div>
      )}

      <Card
        title="Quick-picks de fichas"
        description="Chips sugeridos que aparecen en el editor de fichas cuando el operador toca una fila."
      >
        {items === null || labels === null ? (
          <Skeleton />
        ) : rowLabels.length === 0 ? (
          <EmptyState title="Sin filas configurables" body="El backend no devolvió filas quick-pickables." />
        ) : (
          <div className="space-y-2">
            {rowLabels.map((label) => {
              const isOpen = open.has(label);
              const chips = grouped[label] ?? [];
              return (
                <details
                  key={label}
                  open={isOpen}
                  onToggle={(e) => {
                    const next = (e.currentTarget as HTMLDetailsElement).open;
                    setOpen((prev) => {
                      const s = new Set(prev);
                      if (next) s.add(label);
                      else s.delete(label);
                      return s;
                    });
                  }}
                  className="rounded-md border border-slate-200"
                >
                  <summary className="flex cursor-pointer items-center justify-between px-3 py-2 text-sm font-medium text-slate-800">
                    <span>{label}</span>
                    <span className="text-xs text-slate-500">{chips.length}</span>
                  </summary>
                  <div className="border-t border-slate-200 p-3 space-y-2">
                    {chips.map((chip) => (
                      <div key={chip.id} className="flex items-center gap-2">
                        {editing?.id === chip.id ? (
                          <>
                            <Input
                              className="flex-1"
                              value={editing.value}
                              onChange={(e) => setEditing({ id: chip.id, value: e.target.value })}
                            />
                            <Button size="sm" onClick={onSaveEdit} disabled={busy}>Guardar</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 text-sm text-slate-900">{chip.value}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditing({ id: chip.id, value: chip.value })}
                            >
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => onDelete(chip)}
                              disabled={busy}
                            >
                              Eliminar
                            </Button>
                          </>
                        )}
                      </div>
                    ))}

                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      <Input
                        placeholder="Nuevo chip"
                        className="flex-1"
                        value={newChip[label] ?? ""}
                        onChange={(e) => setNewChip((p) => ({ ...p, [label]: e.target.value }))}
                      />
                      <Button
                        size="sm"
                        onClick={() => onAdd(label)}
                        disabled={busy || !(newChip[label] ?? "").trim()}
                      >
                        Agregar
                      </Button>
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
