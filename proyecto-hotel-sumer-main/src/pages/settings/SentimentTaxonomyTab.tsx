import { useEffect, useState } from "react";
import { Button, Card, EmptyState, Input, Skeleton } from "../../components/ui";
import {
  listSentimentLabels,
  updateSentimentLabel,
  type SentimentLabel,
} from "../../types/sentiment";

type Toast = { kind: "ok" | "error"; text: string } | null;

export const SentimentTaxonomyTab = () => {
  const [original, setOriginal] = useState<SentimentLabel[] | null>(null);
  const [draft, setDraft] = useState<SentimentLabel[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  useEffect(() => {
    let active = true;
    listSentimentLabels()
      .then((data) => {
        if (!active) return;
        setOriginal(data);
        setDraft(data);
      })
      .catch((e) => active && setLoadError(String(e?.message ?? e)));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const setField = (id: number, key: "labelEs" | "emoji", value: string) => {
    setDraft((rows) => rows.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  };

  const dirtyRows = original
    ? draft.filter((d) => {
        const o = original.find((x) => x.id === d.id);
        return o && (o.labelEs !== d.labelEs || o.emoji !== d.emoji);
      })
    : [];

  const onSave = async () => {
    if (dirtyRows.length === 0) return;
    setSaving(true);
    try {
      for (const row of dirtyRows) {
        await updateSentimentLabel(row.id, { labelEs: row.labelEs, emoji: row.emoji });
      }
      const fresh = await listSentimentLabels();
      setOriginal(fresh);
      setDraft(fresh);
      setToast({ kind: "ok", text: "Taxonomía actualizada" });
    } catch (e) {
      setToast({ kind: "error", text: String((e as Error)?.message ?? e) });
    } finally {
      setSaving(false);
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
        title="Taxonomía de sentimiento"
        description="Renombrar las cinco etiquetas y emojis que aparecen en el dashboard. Los códigos internos son inmutables."
      >
        {original === null ? (
          <Skeleton />
        ) : (
          <div className="space-y-3">
            {draft.map((row) => (
              <div
                key={row.id}
                className="flex flex-col gap-2 rounded-md border border-slate-200 p-3 sm:flex-row sm:items-end"
              >
                <div className="sm:w-32">
                  <p className="text-xs text-slate-500">código</p>
                  <code className="text-sm text-slate-800">{row.code}</code>
                </div>
                <Input
                  label="Emoji"
                  className="sm:w-24 text-center text-lg"
                  value={row.emoji}
                  onChange={(e) => setField(row.id, "emoji", e.target.value)}
                />
                <Input
                  label="Etiqueta (es)"
                  className="flex-1"
                  value={row.labelEs}
                  onChange={(e) => setField(row.id, "labelEs", e.target.value)}
                />
              </div>
            ))}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => original && setDraft(original)}
                disabled={saving || dirtyRows.length === 0}
              >
                Descartar
              </Button>
              <Button
                onClick={onSave}
                disabled={saving || dirtyRows.length === 0}
              >
                {saving ? "Guardando…" : `Guardar (${dirtyRows.length})`}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
