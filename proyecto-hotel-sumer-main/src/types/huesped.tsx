export type TipoDocumento = "DNI" | "RUT" | "PASAPORTE";

export interface Huesped {
  id: number;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombreCompleto: string;
  email: string | null;
  telefono: string | null;
  datoExtra: string | null;
}

export interface HuespedCreatePayload {
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombreCompleto: string;
  email?: string;
  telefono?: string;
  datoExtra?: string;
}
