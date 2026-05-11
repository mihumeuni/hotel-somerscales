import { createContext, useState, useContext, type ReactNode, useEffect } from "react";
import { loginUser } from "../types/auth";

type User = {
  email: string;
  role: "ADMIN" | "USER";
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // 🔄 Mantener sesión al recargar
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const email = localStorage.getItem("email");

    if (token && role && email) {
      setUser({ email, role: role as "ADMIN" | "USER" });
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data = await loginUser(email, password);

      // Guardar en localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("email", email);

      // Guardar en estado
      setUser({ email, role: data.role });

      return true;
    } catch (error) {
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
};