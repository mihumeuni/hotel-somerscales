import { useEffect, useState } from "react";
import type { Shift } from "../types/sheet";

const TZ = "America/Santiago";

const santiagoNow = () => new Date(new Date().toLocaleString("en-US", { timeZone: TZ }));

const detectShift = (d: Date): Shift => {
  const h = d.getHours();
  return h >= 6 && h < 18 ? "MANANA" : "NOCHE";
};

const fmtFecha = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/**
 * Returns the current Santiago-local shift and date. Re-evaluates every minute
 * so a long-open tab picks up the 06:00/18:00 transition without a refresh.
 */
export const useShiftClock = () => {
  const [now, setNow] = useState(() => santiagoNow());

  useEffect(() => {
    const id = window.setInterval(() => setNow(santiagoNow()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const shift = detectShift(now);
  return {
    shift,
    fecha: fmtFecha(now),
    label: shift === "MANANA" ? "Mañana" : "Noche",
    hour: now.getHours(),
  };
};
