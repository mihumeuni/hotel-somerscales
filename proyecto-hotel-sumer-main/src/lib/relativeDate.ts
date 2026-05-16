// es-CL relative-date labels for compact widget rows ("salió ayer",
// "sale hoy", "hace 3 d"). Anything beyond ~6 weeks falls back to a short
// absolute date so the FE doesn't have to handle longer ranges.

const ES_SHORT_MONTHS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

const ES_SHORT_DAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function diffInDays(from: Date, to: Date): number {
  const a = startOfDay(from).getTime();
  const b = startOfDay(to).getTime();
  return Math.round((b - a) / 86_400_000);
}

// Generic short labeller used by widgets that need a single chip ("hoy",
// "mañana", "hace 3 d", "vie 22 may").
export function formatRelativeDate(date: Date | string | null | undefined, now: Date = new Date()): string {
  if (date == null) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";

  const diff = diffInDays(now, d);
  if (diff === 0) return "hoy";
  if (diff === 1) return "mañana";
  if (diff === -1) return "ayer";
  if (diff > 0 && diff < 7) return `en ${diff} d`;
  if (diff < 0 && diff > -7) return `hace ${-diff} d`;
  if (diff >= 7 && diff < 42) return `en ${Math.round(diff / 7)} sem`;
  if (diff <= -7 && diff > -42) return `hace ${Math.round(-diff / 7)} sem`;
  return `${ES_SHORT_DAYS[d.getDay()]} ${d.getDate()} ${ES_SHORT_MONTHS[d.getMonth()]}`;
}

// Past-tense flavour for the "Huéspedes recientes" widget ("salió ayer").
export function formatPastCheckout(date: Date | string | null | undefined, now: Date = new Date()): string {
  if (date == null) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  const diff = diffInDays(now, d);
  if (diff === 0) return "salió hoy";
  if (diff === -1) return "salió ayer";
  if (diff < 0 && diff > -7) return `salió hace ${-diff} d`;
  if (diff <= -7 && diff > -42) return `salió hace ${Math.round(-diff / 7)} sem`;
  return `salió ${ES_SHORT_DAYS[d.getDay()]} ${d.getDate()} ${ES_SHORT_MONTHS[d.getMonth()]}`;
}

// Future-tense flavour for "Huéspedes actuales" ("sale mañana"). Same diff
// math, just different verb conjugation.
export function formatUpcomingCheckout(date: Date | string | null | undefined, now: Date = new Date()): string {
  if (date == null) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  const diff = diffInDays(now, d);
  if (diff === 0) return "sale hoy";
  if (diff === 1) return "sale mañana";
  if (diff > 1 && diff < 7) return `sale en ${diff} d`;
  if (diff < 0) return formatPastCheckout(d, now);
  return `sale ${ES_SHORT_DAYS[d.getDay()]} ${d.getDate()} ${ES_SHORT_MONTHS[d.getMonth()]}`;
}

export function formatDayMonth(date: Date | string | null | undefined): string {
  if (date == null) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getDate()} ${ES_SHORT_MONTHS[d.getMonth()]}`;
}

// Date+time used by RoomCalendarGrid event rows: "hoy 14:00", "mañana 11:00",
// "vie 22 may 10:30".
export function formatEventTime(date: Date | string | null | undefined, now: Date = new Date()): string {
  if (date == null) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  const time = `${hh}:${mm}`;
  const diff = diffInDays(now, d);
  if (diff === 0) return `hoy ${time}`;
  if (diff === 1) return `mañana ${time}`;
  if (diff === -1) return `ayer ${time}`;
  return `${ES_SHORT_DAYS[d.getDay()]} ${d.getDate()} ${ES_SHORT_MONTHS[d.getMonth()]} ${time}`;
}
