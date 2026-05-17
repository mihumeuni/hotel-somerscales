import { api } from "../lib/apiClient";

export type Shift = "MANANA" | "NOCHE";

export type ActiveShiftStatus =
  | "CLAIMED_BY_ME"
  | "CLAIMED_BY_OTHER"
  | "UNCLAIMED";

export type ActiveShift = {
  fecha: string; // YYYY-MM-DD
  shift: Shift;
  status: ActiveShiftStatus;
  fichaId: number | null;
  locked: boolean;
  ownerUserId: number | null;
  ownerName: string | null;
};

export type FichaSummary = {
  id: number;
  fecha: string;
  shift: Shift;
  ownerUserId: number;
  ownerName: string | null;
  locked: boolean;
  claimedAt: string;
  lockedAt: string | null;
  reporteCount: number;
  hasNotes: boolean;
};

export type FichaReporte = {
  id: number;
  label: string;
  value: string | null;
  ordinal: number;
};

export type FichaDetail = {
  id: number;
  fecha: string;
  shift: Shift;
  ownerUserId: number;
  ownerName: string | null;
  locked: boolean;
  claimedAt: string;
  lockedAt: string | null;
  updatedAt: string;
  notes: string | null;
  reportes: FichaReporte[];
};

export type ReporteUpsert = { ordinal: number; value: string | null };

export type FichaUpdateRequest = {
  reportes?: ReporteUpsert[];
  notes?: string | null;
};

export type Quickpicks = Record<string, string[]>;

export const listFichas = (params?: { from?: string; to?: string }) => {
  const qs = new URLSearchParams();
  if (params?.from) qs.set("from", params.from);
  if (params?.to) qs.set("to", params.to);
  const tail = qs.toString();
  return api.get<FichaSummary[]>(`/api/fichas${tail ? `?${tail}` : ""}`);
};

export const getActiveShift = () => api.get<ActiveShift>("/api/fichas/active");

export const getQuickpicks = () =>
  api.get<Quickpicks>("/api/fichas/quickpicks");

export const getFicha = (id: number) =>
  api.get<FichaDetail>(`/api/fichas/${id}`);

export const claimShift = (shift?: Shift) =>
  api.post<FichaDetail>("/api/fichas/claim", { shift: shift ?? null });

export const updateFicha = (id: number, body: FichaUpdateRequest) =>
  api.put<FichaDetail>(`/api/fichas/${id}`, body);

export const handoffFicha = (id: number) =>
  api.post<FichaDetail>(`/api/fichas/${id}/handoff`, {});

export const shiftLabel = (shift: Shift) =>
  shift === "MANANA" ? "Mañana" : "Noche";
