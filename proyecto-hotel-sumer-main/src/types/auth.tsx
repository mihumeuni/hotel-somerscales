import { apiFetch } from "../lib/apiClient";

// Role name is a free-form string now that roles are DB-managed.
// The literal union is kept only as documentation of seeded values.
export type Rol = string;

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  role: Rol;
  permissions?: string[];
}

export const loginUser = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  try {
    return await apiFetch<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: { username: email, password },
      auth: false,
    });
  } catch {
    throw new Error("Credenciales incorrectas");
  }
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("email");
  localStorage.removeItem("perms");
  window.location.href = "/login";
};
