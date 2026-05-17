import { api } from "../lib/apiClient";

export interface Role {
  id: number;
  name: string;
  description: string | null;
  systemAdmin: boolean;
  memberCount: number;
  permissions: string[];
}

export interface RoleUpsertRequest {
  name: string;
  description?: string | null;
}

export interface Permission {
  id: number;
  code: string;
  description: string | null;
  group: string;
}

export const listRoles = () => api.get<Role[]>("/api/roles");

export const createRole = (req: RoleUpsertRequest) =>
  api.post<Role>("/api/roles", req);

export const updateRole = (id: number, req: RoleUpsertRequest) =>
  api.put<Role>(`/api/roles/${id}`, req);

export const savePermissions = (id: number, permissionKeys: string[]) =>
  api.put<Role>(`/api/roles/${id}/permissions`, { permissionKeys });

export const deleteRole = (id: number) =>
  api.delete<void>(`/api/roles/${id}`);

export const listPermissions = () => api.get<Permission[]>("/api/permissions");
