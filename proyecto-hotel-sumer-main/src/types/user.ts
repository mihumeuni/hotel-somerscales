import { api } from "../lib/apiClient";

export interface UserSummary {
  id: number;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  sheetCount: number;
}

export interface InviteRequest {
  nombre: string;
  telefono?: string | null;
  email: string;
  role: string;
}

export const listUsers = () => api.get<UserSummary[]>("/api/users");

export const inviteUser = (req: InviteRequest) =>
  api.post<{ email: string }>("/api/users/invite", req);

export const resetUserPassword = (id: number) =>
  api.post<void>(`/api/users/${id}/reset-password`, {});

export const deleteUser = (id: number) =>
  api.delete<void>(`/api/users/${id}`);
