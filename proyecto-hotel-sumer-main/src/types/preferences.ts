import { api } from "../lib/apiClient";

export type Theme = "light" | "dark" | "system";
export type Language = "es" | "en";

export type UserPreferences = {
  theme: Theme;
  language: Language;
  hasAvatar: boolean;
};

const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8080";

export const getPreferences = (): Promise<UserPreferences> =>
  api.get<UserPreferences>("/api/users/me/preferences");

export const updatePreferences = (
  body: Partial<Pick<UserPreferences, "theme" | "language">>,
): Promise<UserPreferences> =>
  api.put<UserPreferences>("/api/users/me/preferences", body);

export const uploadAvatar = async (file: Blob): Promise<UserPreferences> => {
  const token = localStorage.getItem("token");
  const form = new FormData();
  form.append("image", file, "avatar.jpg");
  const res = await fetch(`${API_BASE_URL}/api/users/me/avatar`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) {
    if (res.status === 401) {
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as UserPreferences;
};

export const deleteAvatar = (): Promise<void> =>
  api.delete<void>("/api/users/me/avatar");

export const changePassword = (
  currentPassword: string,
  newPassword: string,
): Promise<void> =>
  api.put<void>("/api/users/me/password", { currentPassword, newPassword });

export const avatarUrl = (userId: number, version: number = 0): string => {
  const suffix = version > 0 ? `?v=${version}` : "";
  return `${API_BASE_URL}/api/users/${userId}/avatar${suffix}`;
};
