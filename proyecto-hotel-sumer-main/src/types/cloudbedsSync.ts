import { api } from "../lib/apiClient";

export type SyncMode = "FULL" | "INCREMENTAL";
export type SyncStatus = "RUNNING" | "SUCCESS" | "FAILED";
export type TriggerSource = "MANUAL" | "SCHEDULED" | "STARTUP";

export type SyncRun = {
  id: number;
  startedAt: string;            // ISO-8601 instant
  finishedAt: string | null;
  mode: SyncMode;
  status: SyncStatus;
  triggerSource: TriggerSource;
  guestsUpserted: number;
  reservationsUpserted: number;
  expensesUpserted: number;
  error: string | null;
};

export const triggerSync = (mode: SyncMode = "INCREMENTAL"): Promise<SyncRun> =>
  api.post<SyncRun>(`/api/sync/cloudbeds?mode=${mode}`, {});

export const listSyncRuns = (): Promise<SyncRun[]> =>
  api.get<SyncRun[]>("/api/sync/cloudbeds/status");

export const lastSuccessfulSync = async (): Promise<SyncRun | null> => {
  try {
    const res = await api.get<SyncRun | undefined>(
      "/api/sync/cloudbeds/last",
      { silent: true },
    );
    return res ?? null;
  } catch {
    return null;
  }
};
