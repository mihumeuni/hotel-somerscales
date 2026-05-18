import {
  createContext,
  useState,
  useContext,
  type ReactNode,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { loginUser, type Rol } from "../types/auth";
import { getMe } from "../types/user";
import { getPreferences, type Theme } from "../types/preferences";

type User = {
  id: number | null;
  email: string;
  role: Rol;
  permissions: string[];
  avatarVersion: number;
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  has: (perm: string) => boolean;
  refreshSelf: () => Promise<User | null>;
  bumpAvatarVersion: () => void;
};

const THEME_STORAGE_KEY = "theme";

// Applies a theme to <html data-theme=...>. "system" leaves the attribute off
// and lets the CSS prefers-color-scheme rule decide (no-op without one set,
// matching the existing light defaults in index.css).
export const applyThemeAttribute = (theme: Theme) => {
  const root = document.documentElement;
  if (theme === "system") {
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    if (prefersDark) root.setAttribute("data-theme", "dark");
    else root.removeAttribute("data-theme");
  } else if (theme === "dark") {
    root.setAttribute("data-theme", "dark");
  } else {
    root.removeAttribute("data-theme");
  }
};

const readThemeFromStorage = (): Theme => {
  const v = localStorage.getItem(THEME_STORAGE_KEY);
  return v === "dark" || v === "light" || v === "system" ? v : "system";
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Decode the `perms` claim out of the JWT as a defensive fallback when the
// /api/auth/login response didn't carry a permissions array (older clients,
// stale sessions). Failure modes are silent — we just yield [].
const decodePermsFromToken = (token: string): string[] => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return [];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const json = JSON.parse(atob(padded));
    const perms = json?.perms;
    return Array.isArray(perms) ? perms.map(String) : [];
  } catch {
    return [];
  }
};

const bootstrapUser = (): User | null => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const email = localStorage.getItem("email");
  const permsRaw = localStorage.getItem("perms");
  const idRaw = localStorage.getItem("userId");

  if (!token || !role || !email) return null;

  let perms: string[] = [];
  if (permsRaw) {
    try {
      const parsed = JSON.parse(permsRaw);
      if (Array.isArray(parsed)) perms = parsed.map(String);
    } catch {
      perms = decodePermsFromToken(token);
    }
  } else {
    perms = decodePermsFromToken(token);
  }
  const idNum = idRaw ? Number(idRaw) : NaN;
  return {
    id: Number.isFinite(idNum) ? idNum : null,
    email,
    role: role as Rol,
    permissions: perms,
    avatarVersion: 0,
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Hydrate synchronously from localStorage so the first paint already has
  // the auth state — avoids a sync setState inside useEffect.
  const [user, setUser] = useState<User | null>(() => bootstrapUser());

  const bumpAvatarVersion = useCallback(() => {
    setUser((prev) => (prev ? { ...prev, avatarVersion: prev.avatarVersion + 1 } : prev));
  }, []);

  // Apply the localStorage theme synchronously at first paint so dark mode
  // doesn't flash light during the initial render. The BE-stored theme
  // overrides this once preferences load post-login.
  useEffect(() => {
    applyThemeAttribute(readThemeFromStorage());
  }, []);

  // System theme listener — switches the data-theme attr when the OS theme
  // changes while the user has chosen "system".
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const handler = () => {
      if (readThemeFromStorage() === "system") applyThemeAttribute("system");
    };
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  const loadPreferences = useCallback(async () => {
    try {
      const prefs = await getPreferences();
      localStorage.setItem(THEME_STORAGE_KEY, prefs.theme);
      applyThemeAttribute(prefs.theme);
    } catch {
      /* tolerated — keep local theme until next refresh */
    }
  }, []);

  const refreshSelf = useCallback(async (): Promise<User | null> => {
    try {
      const me = await getMe();
      const next: User = {
        id: me.id,
        email: me.email,
        role: me.role,
        permissions: JSON.parse(localStorage.getItem("perms") ?? "[]") as string[],
        avatarVersion: 0,
      };
      localStorage.setItem("email", me.email);
      localStorage.setItem("role", me.role);
      localStorage.setItem("userId", String(me.id));
      setUser(next);
      return next;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    // Refresh id + fresh email/role from BE on mount; failure leaves the
    // cached snapshot untouched.
    if (localStorage.getItem("token")) {
      void refreshSelf();
      void loadPreferences();
    }
  }, [refreshSelf, loadPreferences]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const data = await loginUser(email, password);

      const perms = Array.isArray(data.permissions) && data.permissions.length > 0
        ? data.permissions
        : decodePermsFromToken(data.token);

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("email", email);
      localStorage.setItem("perms", JSON.stringify(perms));

      setUser({ id: null, email, role: data.role, permissions: perms, avatarVersion: 0 });

      // Resolve self id (needed by admin-edit guards) after first login.
      try {
        const me = await getMe();
        localStorage.setItem("userId", String(me.id));
        localStorage.setItem("email", me.email);
        setUser({ id: me.id, email: me.email, role: me.role, permissions: perms, avatarVersion: 0 });
      } catch {
        /* tolerated — id will load on the next session bootstrap */
      }

      // Load BE-stored theme; fire-and-forget so login doesn't block on it.
      void loadPreferences();

      return true;
    } catch {
      return false;
    }
  }, [loadPreferences]);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    localStorage.removeItem("perms");
    localStorage.removeItem("userId");
    setUser(null);
  }, []);

  // Centralized 401 handler — apiClient fires `auth:unauthorized` on any
  // response with that status. Guarded so we only bounce if a session exists.
  useEffect(() => {
    const onUnauthorized = () => {
      if (!localStorage.getItem("token")) return;
      logout();
      if (window.location.pathname !== "/") {
        window.location.assign("/");
      }
    };
    window.addEventListener("auth:unauthorized", onUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", onUnauthorized);
  }, [logout]);

  const has = useCallback(
    (perm: string) => Boolean(user?.permissions?.includes(perm)),
    [user?.permissions],
  );

  const value = useMemo(
    () => ({ user, login, logout, has, refreshSelf, bumpAvatarVersion }),
    [user, login, logout, has, refreshSelf, bumpAvatarVersion],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
};
