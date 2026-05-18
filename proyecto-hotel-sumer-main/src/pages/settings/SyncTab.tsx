import { useEffect, useRef, useState } from "react";
import { Button, Card, Table, type Column } from "../../components/ui";
import {
  listSyncRuns,
  triggerSync,
  type SyncRun,
} from "../../types/cloudbedsSync";

type Toast = { kind: "ok" | "error"; text: string } | null;

const STATUS_BADGE: Record<SyncRun["status"], string> = {
  RUNNING: "bg-amber-100 text-amber-800",
  SUCCESS: "bg-emerald-100 text-emerald-800",
  FAILED:  "bg-rose-100 text-rose-800",
};

const STATUS_LABEL: Record<SyncRun["status"], string> = {
  RUNNING: "En curso",
  SUCCESS: "Exitoso",
  FAILED:  "Fallido",
};

const MODE_LABEL: Record<SyncRun["mode"], string> = {
  FULL:        "Completa",
  INCREMENTAL: "Incremental",
};

const TRIGGER_LABEL: Record<SyncRun["triggerSource"], string> = {
  MANUAL:    "Manual",
  SCHEDULED: "Programada",
  STARTUP:   "Inicio",
};

const formatDateTime = (iso: string | null): string => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("es-CL", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

const formatDuration = (run: SyncRun): string => {
  if (!run.finishedAt) return "—";
  const ms = new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime();
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
  return `${Math.round(ms / 1000)} s`;
};

export const SyncTab = () => {
  const [runs, setRuns] = useState<SyncRun[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const pollRef = useRef<number | null>(null);

  const refresh = async () => {
    try {
      setRuns(await listSyncRuns());
    } catch (e) {
      setLoadError(String((e as Error)?.message ?? e));
    }
  };

  useEffect(() => {
    refresh();
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(t);
  }, [toast]);

  const startPolling = (runId: number) => {
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = window.setInterval(async () => {
      const fresh = await listSyncRuns();
      setRuns(fresh);
      const target = fresh.find((r) => r.id === runId);
      if (target && target.status !== "RUNNING") {
        if (pollRef.current) {
          window.clearInterval(pollRef.current);
          pollRef.current = null;
        }
        setBusy(false);
        setToast(target.status === "SUCCESS"
          ? { kind: "ok",    text: `Sincronización completada: ${target.reservationsUpserted} reservas` }
          : { kind: "error", text: `Sincronización falló: ${target.error ?? "error desconocido"}` });
      }
    }, 2000);
  };

  const onSync = async (mode: SyncRun["mode"]) => {
    if (busy) return;
    setBusy(true);
    setToast(null);
    try {
      const run = await triggerSync(mode);
      await refresh();
      startPolling(run.id);
    } catch (e) {
      setBusy(false);
      setToast({ kind: "error", text: String((e as Error)?.message ?? e) });
    }
  };

  const lastSuccess = runs?.find((r) => r.status === "SUCCESS") ?? null;

  const columns: Column<SyncRun>[] = [
    {
      key: "startedAt",
      header: "Inicio",
      render: (r) => formatDateTime(r.startedAt),
    },
    {
      key: "mode",
      header: "Modo",
      render: (r) => MODE_LABEL[r.mode],
    },
    {
      key: "triggerSource",
      header: "Origen",
      render: (r) => TRIGGER_LABEL[r.triggerSource],
    },
    {
      key: "status",
      header: "Estado",
      render: (r) => (
        <span
          className={
            "inline-block rounded-full px-2 py-0.5 text-xs font-medium " +
            STATUS_BADGE[r.status]
          }
        >
          {STATUS_LABEL[r.status]}
        </span>
      ),
    },
    {
      key: "guestsUpserted",
      header: "Huéspedes",
      render: (r) => r.guestsUpserted,
    },
    {
      key: "reservationsUpserted",
      header: "Reservas",
      render: (r) => r.reservationsUpserted,
    },
    {
      key: "duration",
      header: "Duración",
      render: formatDuration,
    },
  ];

  return (
    <div className="space-y-4">
      <Card
        title="Sincronización Cloudbeds"
        description="Importa huéspedes y reservas desde el PMS de Cloudbeds. La sincronización automática ocurre los domingos a las 03:00 (hora de Santiago)."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Última sincronización exitosa
            </div>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              {lastSuccess ? formatDateTime(lastSuccess.startedAt) : "Nunca"}
            </div>
            {lastSuccess && (
              <div className="mt-1 text-xs text-slate-500">
                {lastSuccess.reservationsUpserted} reservas · {lastSuccess.guestsUpserted} huéspedes
                · {MODE_LABEL[lastSuccess.mode]}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 md:items-end md:justify-center">
            <div className="flex gap-2">
              <Button onClick={() => onSync("INCREMENTAL")} disabled={busy}>
                {busy ? "Sincronizando…" : "Sincronizar ahora"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => onSync("FULL")}
                disabled={busy}
                title="Borra los datos actuales antes de cargar"
              >
                Resincronizar todo
              </Button>
            </div>
            {toast && (
              <div
                className={
                  "text-sm " +
                  (toast.kind === "ok" ? "text-emerald-700" : "text-rose-700")
                }
              >
                {toast.text}
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card
        title="Historial reciente"
        description="Últimas 10 ejecuciones (incluye programadas, manuales y de inicio)."
      >
        {loadError ? (
          <div className="text-sm text-rose-700">No se pudo cargar el historial: {loadError}</div>
        ) : runs === null ? (
          <div className="text-sm text-slate-500">Cargando…</div>
        ) : (
          <Table
            columns={columns}
            rows={runs}
            rowKey={(r) => r.id}
            emptyMessage="Aún no hay ejecuciones registradas."
          />
        )}
      </Card>
    </div>
  );
};
