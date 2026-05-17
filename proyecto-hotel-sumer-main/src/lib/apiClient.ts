import toast from "react-hot-toast";

const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8080";

type ApiOptions = Omit<RequestInit, "body" | "headers"> & {
  body?: unknown;
  headers?: Record<string, string>;
  auth?: boolean;
  // Pass { silent: true } for endpoints that surface their own inline errors
  // (e.g. typeahead, form fields) and don't want a global toast/redirect.
  silent?: boolean;
};

// Logout is owned by AuthContext. We avoid the import cycle by routing 401s
// through a window event the provider listens for. apiClient stays decoupled.
const fireUnauthorized = () => {
  try {
    window.dispatchEvent(new CustomEvent("auth:unauthorized"));
  } catch {
    /* SSR or pre-render guard */
  }
};

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { body, headers, auth = true, silent = false, ...rest } = options;

  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers ?? {}),
  };

  if (auth) {
    const token = localStorage.getItem("token");
    if (token) {
      finalHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    // Network error: no response at all.
    if (!silent) toast.error("Sin conexión con el servidor.");
    throw err;
  }

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired or invalid — let AuthContext clear state + bounce to /.
      if (!silent) fireUnauthorized();
    } else if (response.status >= 500 && !silent) {
      toast.error(`Error del servidor (${response.status}). Intenta nuevamente.`);
    }
    throw new Error(`HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

type CallOpts = { auth?: boolean; silent?: boolean };

export const api = {
  get: <T>(path: string, opts: CallOpts = {}) =>
    apiFetch<T>(path, { method: "GET", ...opts }),
  post: <T>(path: string, body: unknown, opts: CallOpts = {}) =>
    apiFetch<T>(path, { method: "POST", body, ...opts }),
  put: <T>(path: string, body: unknown, opts: CallOpts = {}) =>
    apiFetch<T>(path, { method: "PUT", body, ...opts }),
  delete: <T>(path: string, opts: CallOpts = {}) =>
    apiFetch<T>(path, { method: "DELETE", ...opts }),
};
