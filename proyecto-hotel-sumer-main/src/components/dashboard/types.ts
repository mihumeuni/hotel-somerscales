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

export type SentimentBucket = {
  key: string;
  label: string;
  emoji: string;
  className: string; // tailwind bg-* for the bar fill
};

export type SentimentSummaryDTO = {
  counts: Record<string, number>;
  byCategory: Array<{ code: string; positive: number; neutral: number; negative: number }>;
};

export type CategoryCountDTO = {
  code: string;
  labelEs: string;
  labelEn: string;
  count: number;
};

export type NormalizedReviewDTO = {
  summary: string;
  sentiment: string | null;
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
