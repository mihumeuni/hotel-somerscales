import { api } from "../lib/apiClient";

export interface UserSummary {
  id: number;
  name: string | null;
  username?: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt?: string | null;
  sheetCount: number;
}

export interface InviteRequest {
  nombre: string;
  telefono?: string | null;
  email: string;
  role: string;
}

export interface UpdateMeRequest {
  name: string;
  email: string;
  phone?: string | null;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export interface UpdateUserRequest {
  name: string;
  email: string;
  phone?: string | null;
  role: string;
}

export const listUsers = () => api.get<UserSummary[]>("/api/users");

export const getMe = () => api.get<UserSummary>("/api/users/me");

export const updateMe = (req: UpdateMeRequest) =>
  api.put<UserSummary>("/api/users/me", req);

export const getUserById = (id: number) =>
  api.get<UserSummary>(`/api/users/${id}`);

export const updateUser = (id: number, req: UpdateUserRequest) =>
  api.put<UserSummary>(`/api/users/${id}`, req);

export const inviteUser = (req: InviteRequest) =>
  api.post<{ email: string }>("/api/users/invite", req);

export const resetUserPassword = (id: number) =>
  api.post<void>(`/api/users/${id}/reset-password`, {});

export const deleteUser = (id: number) =>
  api.delete<void>(`/api/users/${id}`);

export interface GuestSearchHit {
  id: number;
  nombreCompleto: string;
  email: string;
}

export const searchGuests = (q: string, limit = 8) =>
  api.get<GuestSearchHit[]>(
    `/api/guests/search?q=${encodeURIComponent(q)}&limit=${limit}`,
  );
