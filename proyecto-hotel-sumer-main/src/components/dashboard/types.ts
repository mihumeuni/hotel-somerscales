// Shared DTO shapes mirrored from the BE dashboard endpoints.

export type AvailabilityWindow = {
  maxFree: number;
  peakDate: string; // ISO yyyy-mm-dd
};

export type AvailabilityDTO = {
  totalRooms: number;
  today: number;
  week: AvailabilityWindow;
  month: AvailabilityWindow;
};

export type TopGuestDTO = {
  huespedId: number;
  nombreCompleto: string;
  visitCount: number;
  totalSpend: number | string | null;
  lastVisit: string | null;
};

export type GuestStripDTO = {
  huespedId: number;
  nombreCompleto: string;
  initials: string;
  rooms: string[];
  totalVisits: number;
  checkoutDate: string | null; // yyyy-mm-dd
  partySize: number;
};

// task031: BE-driven sentiment buckets — code/labelEs/emoji come straight
// from the sentiment_labels table so renaming a label in /settings/global
// updates the dashboard without a FE change.
export type SentimentBucketDTO = {
  code: string;
  labelEs: string;
  emoji: string;
  count: number;
};

export type SentimentSummaryDTO = {
  buckets: SentimentBucketDTO[];
  totalReviews: number;
  multiLabel: boolean;
  byCategory: Array<{ code: string; buckets: Record<string, number> }>;
};

export type CategoryCountDTO = {
  code: string;
  labelEs: string;
  labelEn: string;
  count: number;
};

// task031: a cluster can carry mixed sentiment chips when the underlying
// reviews disagree; `labels` is the deduped union of every label_code
// applied to any review in the cluster.
export type NormalizedReviewDTO = {
  summary: string;
  labels: string[];
  count: number;
};

export type ReservaCalendarDTO = {
  id: number;
  fechaEntrada: string;
  fechaSalida: string | null;
  numeroHabitacion: string | null;
  estadoReserva: string | null;
  huespedes?: Array<{ id: number; nombreCompleto: string }>;
};
