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

type User = {
  email: string;
  role: Rol;
  permissions: string[];
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  has: (perm: string) => boolean;
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const email = localStorage.getItem("email");
    const permsRaw = localStorage.getItem("perms");

    if (token && role && email) {
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
      setUser({ email, role: role as Rol, permissions: perms });
    }
  }, []);

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

      setUser({ email, role: data.role, permissions: perms });

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
    setUser(null);
  }, []);

  const has = useCallback(
    (perm: string) => Boolean(user?.permissions?.includes(perm)),
    [user?.permissions],
  );

  const value = useMemo(
    () => ({ user, login, logout, has }),
    [user, login, logout, has],
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
