import { useEffect, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LogoMark } from "./LogoMark";
import { cn } from "./cn";

export type NavDestination = {
  to: string;
  label: string;
  icon: ReactNode;
};

type MobileNavDrawerProps = {
  open: boolean;
  onClose: () => void;
  primary: NavDestination[];
  isAdmin: boolean;
};

const initialsFromEmail = (email: string | undefined) => {
  if (!email) return "?";
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return (local.slice(0, 2) || "?").toUpperCase();
};

export const MobileNavDrawer = ({
  open,
  onClose,
  primary,
  isAdmin,
}: MobileNavDrawerProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  if (!open) return null;

  const handleLogout = () => {
    onClose();
    logout();
    navigate("/");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Menú de navegación"
      onClick={onClose}
    >
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        style={{ animation: "drawer-backdrop-in 220ms ease-out" }}
      />
      <aside
        className="relative bg-surface w-[85vw] max-w-[320px] h-full shadow-2xl overflow-y-auto"
        style={{
          animation:
            "drawer-slide-in 220ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <Link
            to="/dashboard"
            onClick={onClose}
            className="flex items-center gap-2"
          >
            <LogoMark size={36} />
            <span className="font-serif text-marine text-lg">Somerscales</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-ink"
            aria-label="Cerrar menú"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-3 px-5 py-4 bg-cream/50">
          <div className="w-11 h-11 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-marine font-serif text-base">
            {initialsFromEmail(user?.email)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-ink truncate">
              {user?.email ?? "Invitado"}
            </p>
            <p className="text-xs text-slate-500 capitalize">
              {user?.role?.toLowerCase() ?? "Sin sesión"}
            </p>
          </div>
        </div>

        <nav className="px-3 py-3 space-y-1">
          <p className="px-2 pb-1 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
            Navegación
          </p>
          {primary.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/dashboard"}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                  isActive
                    ? "bg-marine/10 text-marine"
                    : "text-ink hover:bg-cream",
                )
              }
            >
              <span className="text-marine">{item.icon}</span>
              <span className="font-semibold flex-1">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <nav className="px-3 py-3 space-y-1 border-t border-slate-100">
          <p className="px-2 pb-1 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
            Cuenta
          </p>
          <Link
            to="/me"
            onClick={onClose}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-cream text-ink"
          >
            <svg
              className="w-5 h-5 text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="font-semibold flex-1">Mi perfil</span>
          </Link>
          {isAdmin && (
            <Link
              to="/settings/global"
              onClick={onClose}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-cream text-ink"
            >
              <svg
                className="w-5 h-5 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="font-semibold flex-1">Settings globales</span>
              <span className="text-[10px] uppercase font-bold text-gold">
                Admin
              </span>
            </Link>
          )}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-cream text-ink"
          >
            <svg
              className="w-5 h-5 text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-semibold flex-1">Ayuda</span>
          </a>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-terracotta/5 text-terracotta"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span className="font-semibold flex-1">Cerrar sesión</span>
          </button>
        </nav>

        <style>{`
          @keyframes drawer-slide-in {
            from { transform: translateX(-100%); }
            to { transform: translateX(0); }
          }
          @keyframes drawer-backdrop-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>
      </aside>
    </div>
  );
};
