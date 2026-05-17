// Sample fichas data for the v1.1 scaffold (task026). The real backend
// integration is task027+ — this seed exists so the screens render with
// realistic shape during the mobile-pass audit.

export type SheetReporte = {
  code: string;
  label: string;
  group: "operativo" | "huesped" | "mantenimiento" | "seguridad";
};

// The 22 reportes the wireframe locks in. Order matches docs/wireframeUP.html.
export const REPORTES: SheetReporte[] = [
  { code: "check-ins", label: "Check-ins realizados", group: "operativo" },
  { code: "check-outs", label: "Check-outs realizados", group: "operativo" },
  { code: "no-show", label: "No-shows", group: "operativo" },
  { code: "walk-ins", label: "Walk-ins atendidos", group: "operativo" },
  { code: "extension", label: "Extensiones de estadía", group: "operativo" },
  { code: "cancelaciones", label: "Cancelaciones", group: "operativo" },

  { code: "huesped-llamadas", label: "Llamadas atendidas", group: "huesped" },
  { code: "huesped-quejas", label: "Quejas recibidas", group: "huesped" },
  { code: "huesped-elogios", label: "Elogios recibidos", group: "huesped" },
  { code: "huesped-pedidos", label: "Pedidos especiales", group: "huesped" },
  { code: "huesped-amenities", label: "Amenities entregados", group: "huesped" },

  { code: "mant-ordenes", label: "Órdenes de mantenimiento", group: "mantenimiento" },
  { code: "mant-resueltas", label: "Órdenes resueltas en el turno", group: "mantenimiento" },
  { code: "mant-pendientes", label: "Pendientes al cierre", group: "mantenimiento" },
  { code: "mant-housekeeping", label: "Re-limpiezas solicitadas", group: "mantenimiento" },

  { code: "seg-rondas", label: "Rondas de seguridad", group: "seguridad" },
  { code: "seg-incidentes", label: "Incidentes registrados", group: "seguridad" },
  { code: "seg-llaves", label: "Llaves perdidas", group: "seguridad" },
  { code: "seg-objetos", label: "Objetos olvidados", group: "seguridad" },

  { code: "caja-apertura", label: "Caja apertura (CLP)", group: "operativo" },
  { code: "caja-cierre", label: "Caja cierre (CLP)", group: "operativo" },
  { code: "caja-diferencia", label: "Diferencia (CLP)", group: "operativo" },
];

export type Chip = { code: string; label: string };

export const QUICK_CHIPS: Chip[] = [
  { code: "ruido", label: "Ruido en pasillos" },
  { code: "wifi", label: "WiFi inestable" },
  { code: "agua-caliente", label: "Sin agua caliente" },
  { code: "aseo", label: "Solicitud de aseo extra" },
  { code: "llave", label: "Re-codificación de llave" },
  { code: "minibar", label: "Reposición de minibar" },
  { code: "transfer", label: "Coordinar transfer" },
  { code: "almacenamiento", label: "Equipaje en bodega" },
];

export type PastSheet = {
  id: string;
  fecha: string;
  turno: "Mañana" | "Tarde" | "Noche";
  recepcionista: string;
  reportes: number;
  incidentes: number;
};

export const PAST_SHEETS: PastSheet[] = [
  { id: "f-1042", fecha: "2026-05-16", turno: "Noche", recepcionista: "M. Korotkov", reportes: 18, incidentes: 1 },
  { id: "f-1041", fecha: "2026-05-16", turno: "Tarde", recepcionista: "C. Vergara", reportes: 22, incidentes: 0 },
  { id: "f-1040", fecha: "2026-05-16", turno: "Mañana", recepcionista: "P. Soto", reportes: 14, incidentes: 0 },
  { id: "f-1039", fecha: "2026-05-15", turno: "Noche", recepcionista: "M. Korotkov", reportes: 20, incidentes: 2 },
  { id: "f-1038", fecha: "2026-05-15", turno: "Tarde", recepcionista: "C. Vergara", reportes: 19, incidentes: 1 },
];

export const findPastSheet = (id: string) =>
  PAST_SHEETS.find((s) => s.id === id) ?? null;
