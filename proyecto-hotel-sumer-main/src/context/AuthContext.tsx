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

type User = {
  id: number | null;
  email: string;
  role: Rol;
  permissions: string[];
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  has: (perm: string) => boolean;
  refreshSelf: () => Promise<User | null>;
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
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Hydrate synchronously from localStorage so the first paint already has
  // the auth state — avoids a sync setState inside useEffect.
  const [user, setUser] = useState<User | null>(() => bootstrapUser());

  const refreshSelf = useCallback(async (): Promise<User | null> => {
    try {
      const me = await getMe();
      const next: User = {
        id: me.id,
        email: me.email,
        role: me.role,
        permissions: JSON.parse(localStorage.getItem("perms") ?? "[]") as string[],
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
    }
  }, [refreshSelf]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const data = await loginUser(email, password);

      const perms = Array.isArray(data.permissions) && data.permissions.length > 0
        ? data.permissions
        : decodePermsFromToken(data.token);

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("email", email);
      localStorage.setItem("perms", JSON.stringify(perms));

      setUser({ id: null, email, role: data.role, permissions: perms });

      // Resolve self id (needed by admin-edit guards) after first login.
      try {
        const me = await getMe();
        localStorage.setItem("userId", String(me.id));
        localStorage.setItem("email", me.email);
        setUser({ id: me.id, email: me.email, role: me.role, permissions: perms });
      } catch {
        /* tolerated — id will load on the next session bootstrap */
      }

      return true;
    } catch {
      return false;
    }
  }, []);

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
    () => ({ user, login, logout, has, refreshSelf }),
    [user, login, logout, has, refreshSelf],
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
