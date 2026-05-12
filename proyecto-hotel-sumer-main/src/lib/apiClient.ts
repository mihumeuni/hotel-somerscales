const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8080";

type ApiOptions = Omit<RequestInit, "body" | "headers"> & {
  body?: unknown;
  headers?: Record<string, string>;
  auth?: boolean;
};

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { body, headers, auth = true, ...rest } = options;

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

  const response = await fetch(url, {
    ...rest,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

type CallOpts = { auth?: boolean };

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
