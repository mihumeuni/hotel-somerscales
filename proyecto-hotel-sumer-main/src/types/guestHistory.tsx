import type { Huesped } from "./huesped";

export interface BookingSummary {
  id: number;
  fechaEntrada: string | null;
  fechaSalida: string | null;
  origenReserva: string | null;
  nightsCount: number | null;
  estadoReserva: string | null;
  montoTotal: number | null;
  totalExpensesByCurrency: Record<string, number>;
}

export interface GuestHistory {
  huesped: Huesped;
  bookings: BookingSummary[];
  totalVisits: number;
  totalNights: number;
  totalSpentClp: number;
  firstVisit: string | null;
  lastVisit: string | null;
}
