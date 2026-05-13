import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "./Button";
import { cn } from "./cn";

type NavItem = {
  to: string;
  label: string;
  adminOnly?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/consulta-huesped", label: "Consultar huésped" },
  { to: "/crear-huesped", label: "Crear huésped", adminOnly: true },
  { to: "/modificar-huesped", label: "Modificar huésped", adminOnly: true },
  { to: "/eliminar-huesped", label: "Eliminar huésped", adminOnly: true },
  { to: "/crear-user", label: "Invitar usuario", adminOnly: true },
];

type AppShellProps = {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
};

export const AppShell = ({ title, description, actions, children }: AppShellProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const visibleItems = useMemo(
    () => NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === "ADMIN"),
    [user?.role],
  );

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex min-h-svh flex-col bg-slate-50 text-slate-900">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 md:h-16 md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label={drawerOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={drawerOpen}
              aria-controls="app-nav"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 md:hidden"
              onClick={() => setDrawerOpen((prev) => !prev)}
            >
              <span aria-hidden="true" className="text-xl leading-none">
                {drawerOpen ? "✕" : "☰"}
              </span>
            </button>
            <Link to="/dashboard" className="flex items-center gap-2">
              <img src="/logo.svg" alt="" className="h-8 w-8" onError={(e) => (e.currentTarget.style.display = "none")} />
              <span className="text-lg font-semibold tracking-tight text-slate-900 md:text-xl">
                Hotel Somerscales
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            {user?.role && (
              <span className="hidden rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 md:inline-flex">
                {user.role}
              </span>
            )}
            {user?.email && (
              <span className="hidden text-sm text-slate-600 md:inline">{user.email}</span>
            )}
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-4 md:flex-row md:gap-6 md:px-6 md:py-6">
        {/* Sidebar / drawer */}
        <nav
          id="app-nav"
          className={cn(
            "shrink-0 md:w-60",
            !drawerOpen && "hidden md:block",
          )}
          aria-label="Navegación principal"
        >
          <ul className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
            {visibleItems.map((item) => {
              const active = location.pathname === item.to;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-brand-50 text-brand-700"
                        : "text-slate-700 hover:bg-slate-100",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Main */}
        <main className="min-w-0 flex-1">
          {(title || description || actions) && (
            <div className="mb-4 flex flex-col gap-2 md:mb-6 md:flex-row md:items-end md:justify-between md:gap-4">
              <div>
                {title && (
                  <h1 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
                    {title}
                  </h1>
                )}
                {description && (
                  <p className="mt-1 text-sm text-slate-600">{description}</p>
                )}
              </div>
              {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
};
