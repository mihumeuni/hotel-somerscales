import { useEffect, useState } from "react";
import { Button, Card, EmptyState, Input, Modal, Skeleton } from "../../components/ui";
import {
  createCategory,
  deleteCategory,
  listCategories,
  reclassifyAll,
  updateCategory,
  type Category,
} from "../../types/category";

type Editing = { id: number; labelEs: string } | null;
type Toast = { kind: "ok" | "error"; text: string } | null;

export const CategoriesTab = () => {
  const [items, setItems] = useState<Category[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Editing>(null);
  const [newLabel, setNewLabel] = useState("");
  const [confirmReclassify, setConfirmReclassify] = useState(false);
  const [reclassifying, setReclassifying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  useEffect(() => {
    let active = true;
    listCategories()
      .then((data) => active && setItems(data))
      .catch((e) => active && setLoadError(String(e?.message ?? e)));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const refresh = async () => setItems(await listCategories());

  const onAdd = async () => {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      await createCategory({ labelEs: trimmed });
      setNewLabel("");
      await refresh();
      setToast({ kind: "ok", text: "Categoría agregada" });
    } catch (e) {
      setToast({ kind: "error", text: String((e as Error)?.message ?? e) });
    } finally {
      setBusy(false);
    }
  };

  const onSaveEdit = async () => {
    if (!editing) return;
    const trimmed = editing.labelEs.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      await updateCategory(editing.id, { labelEs: trimmed });
      setEditing(null);
      await refresh();
      setToast({ kind: "ok", text: "Categoría actualizada" });
    } catch (e) {
      setToast({ kind: "error", text: String((e as Error)?.message ?? e) });
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (cat: Category) => {
    if (!confirm(`¿Eliminar la categoría "${cat.labelEs}"? Se removerán sus asignaciones a reseñas existentes.`)) return;
    setBusy(true);
    try {
      await deleteCategory(cat.id);
      await refresh();
      setToast({ kind: "ok", text: "Categoría eliminada" });
    } catch (e) {
      setToast({ kind: "error", text: String((e as Error)?.message ?? e) });
    } finally {
      setBusy(false);
    }
  };

  const onReclassify = async () => {
    setConfirmReclassify(false);
    setReclassifying(true);
    try {
      const res = await reclassifyAll();
      setToast({
        kind: res.mode === "live" ? "ok" : "error",
        text:
          res.mode === "disabled"
            ? "La IA está deshabilitada (sin API key). Cambios guardados sin reclasificar."
            : `Reclasificación completada: ${res.ok}/${res.processed} reseñas (${res.elapsedSec}s)`,
      });
    } catch (e) {
      setToast({ kind: "error", text: String((e as Error)?.message ?? e) });
    } finally {
      setReclassifying(false);
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
        title="Categorías"
        description="Etiquetas que la IA usa para clasificar reseñas. Al guardar puedes reclasificar todas las reseñas existentes contra la nueva lista."
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Input
            label="Nueva categoría"
            placeholder="Ej. Limpieza, Desayuno…"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            disabled={busy}
          />
          <Button onClick={onAdd} disabled={busy || newLabel.trim() === ""}>
            Agregar
          </Button>
        </div>

        <div className="mt-4 divide-y divide-slate-200 border border-slate-200 rounded-md">
          {items === null ? (
            <div className="p-4"><Skeleton /></div>
          ) : items.length === 0 ? (
            <EmptyState size="compact" title="Sin categorías" body="Agrega la primera arriba." />
          ) : (
            items.map((c) => (
              <div key={c.id} className="flex items-center gap-2 px-3 py-2">
                {editing?.id === c.id ? (
                  <>
                    <Input
                      value={editing.labelEs}
                      onChange={(e) => setEditing({ id: c.id, labelEs: e.target.value })}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={onSaveEdit} disabled={busy}>Guardar</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{c.labelEs}</p>
                      <p className="text-xs text-slate-500 truncate">código: <code>{c.code}</code></p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditing({ id: c.id, labelEs: c.labelEs })}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => onDelete(c)}
                      disabled={busy}
                    >
                      Eliminar
                    </Button>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
          <p className="text-xs text-slate-500">
            La reclasificación pasa cada reseña por la IA y consume cuota de la API.
          </p>
          <Button
            variant="primary"
            className="bg-[#c0613f] hover:bg-[#a8522f] border-[#c0613f]"
            onClick={() => setConfirmReclassify(true)}
            disabled={reclassifying || items === null || items.length === 0}
          >
            {reclassifying ? "Reclasificando…" : "Reclasificar ahora"}
          </Button>
        </div>
      </Card>

      <Modal
        open={confirmReclassify}
        onClose={() => setConfirmReclassify(false)}
        title="¿Reclasificar todas las reseñas?"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmReclassify(false)}>Cancelar</Button>
            <Button
              variant="primary"
              className="bg-[#c0613f] hover:bg-[#a8522f] border-[#c0613f]"
              onClick={onReclassify}
            >
              Sí, reclasificar
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-700">
          Esto borrará las clasificaciones actuales y pedirá a la IA que vuelva a etiquetar
          cada reseña contra la lista de categorías que tienes ahora. El proceso puede tardar
          varios minutos y consume cuota de la API.
        </p>
      </Modal>
    </div>
  );
};
