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

// Categories map 1:1 to the BE FichaService.CAT_* constants.
export type ReporteCategory =
  | "recepcion"
  | "gastronomia"
  | "bedding"
  | "admin"
  | "estacionamiento"
  | "requerimientos"
  | "reclamos";

export type FichaReporte = {
  id: number;
  label: string;
  category: ReporteCategory | null;
  value: string | null;
  ordinal: number;
};

export type FichaParking = {
  id: number;
  room: string;
  lot: string;
  position: number;
  createdAt: string;
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
  parkingEntries: FichaParking[];
};

export type ReporteUpsert = { ordinal: number; value: string | null };

export type FichaUpdateRequest = {
  reportes?: ReporteUpsert[];
  notes?: string | null;
};

export type Quickpicks = Record<string, string[]>;

// Render order + heading labels for the 7 reporte groups. The label of
// the "Estacionamiento" group also tags the row that uses the special
// dual-select editor (room + lot pairs persisted in ficha_parking).
export const CATEGORIES: ReadonlyArray<{ key: ReporteCategory; label: string }> = [
  { key: "recepcion",       label: "Recepción" },
  { key: "gastronomia",     label: "Gastronomía" },
  { key: "bedding",         label: "Bedding" },
  { key: "admin",           label: "Administración" },
  { key: "estacionamiento", label: "Estacionamiento" },
  { key: "requerimientos",  label: "Requerimientos" },
  { key: "reclamos",        label: "Reclamos" },
];

export const ROOM_OPTIONS = [
  "H1", "H2", "H3", "H4", "H5", "H6", "H7", "H8", "H9", "H10",
] as const;

export const LOT_OPTIONS = ["E-Hotel", "E-Capilla"] as const;

export type RoomOption = (typeof ROOM_OPTIONS)[number];
export type LotOption = (typeof LOT_OPTIONS)[number];

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

export const addParking = (id: number, room: string, lot: string) =>
  api.post<FichaDetail>(`/api/fichas/${id}/parking`, { room, lot });

export const removeParking = (id: number, parkingId: number) =>
  api.delete<FichaDetail>(`/api/fichas/${id}/parking/${parkingId}`);

export const shiftLabel = (shift: Shift) =>
  shift === "MANANA" ? "Mañana" : "Noche";
