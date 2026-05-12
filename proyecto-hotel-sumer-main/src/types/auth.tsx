import { apiFetch } from "../lib/apiClient";

export type Rol = "ADMIN" | "RECEPCIONISTA" | "ASISTENTE";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  role: Rol;
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
  window.location.href = "/login";
};
