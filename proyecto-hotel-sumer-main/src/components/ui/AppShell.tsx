import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { cn } from "./cn";
import { LogoMark } from "./LogoMark";
import { LogoWordmark } from "./LogoWordmark";
import { MobileNavDrawer, type NavDestination } from "./MobileNavDrawer";
import { searchGuests, type GuestSearchHit } from "../../types/user";
import { UserAvatar } from "../UserAvatar";

const HouseIcon = (
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
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

const CalendarIcon = (
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
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const ShieldIcon = (
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
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
);

const UsersIcon = (
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
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
    />
  </svg>
);

const SheetIcon = (
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
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
    />
  </svg>
);

const SearchIcon = (
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
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const GearIcon = (
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
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

const HamburgerIcon = (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
);

const NAV_ITEMS: NavDestination[] = [
  { to: "/dashboard", label: "Dashboard", icon: HouseIcon },
  { to: "/calendario", label: "Calendario", icon: CalendarIcon },
  { to: "/admin/roles", label: "Roles & Permisos", icon: ShieldIcon },
  { to: "/admin/perfiles", label: "Perfiles", icon: UsersIcon },
  { to: "/fichas", label: "Fichas", icon: SheetIcon },
];

const initialsFromEmail = (email: string | undefined) => {
  if (!email) return "?";
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return (local.slice(0, 2) || "?").toUpperCase();
};

const DesktopNavLink = ({
  to,
  children,
}: {
  to: string;
  children: ReactNode;
}) => (
  <NavLink
    to={to}
    end={to === "/dashboard"}
    className={({ isActive }) =>
      cn(
        "pb-1 border-b-2 transition-colors",
        isActive
          ? "text-marine border-terracotta"
          : "text-slate-500 border-transparent hover:text-marine",
      )
    }
  >
    {children}
  </NavLink>
);

export const AppShell = () => {
  const { user, logout, has } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement | null>(null);

  const [searchQ, setSearchQ] = useState("");
  const [searchHits, setSearchHits] = useState<GuestSearchHit[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);

  const isAdmin = user?.role === "ADMIN";
  const canSearchGuests = has("guest.read");

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const toggleAvatar = useCallback(() => setAvatarOpen((p) => !p), []);
  const closeAvatar = useCallback(() => setAvatarOpen(false), []);

  useEffect(() => {
    setAvatarOpen(false);
    setSearchOpen(false);
    setSearchQ("");
  }, [location.pathname]);

  useEffect(() => {
    if (!avatarOpen) return;
    const handler = (e: MouseEvent) => {
      if (!avatarRef.current?.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [avatarOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const handler = (e: MouseEvent) => {
      if (!searchRef.current?.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [searchOpen]);

  // Debounced server-side autocomplete. <2 chars or no permission → clear.
  useEffect(() => {
    if (!canSearchGuests) return;
    const q = searchQ.trim();
    if (q.length < 2) {
      setSearchHits([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const hits = await searchGuests(q, 8);
        setSearchHits(hits);
      } catch {
        setSearchHits([]);
      } finally {
        setSearchLoading(false);
      }
    }, 180);
    return () => window.clearTimeout(timer);
  }, [searchQ, canSearchGuests]);

  const handleSearchPick = (id: number) => {
    setSearchOpen(false);
    setSearchQ("");
    navigate(`/huespedes/${id}`);
  };

  const handleLogout = useCallback(() => {
    setAvatarOpen(false);
    setDrawerOpen(false);
    logout();
    navigate("/");
  }, [logout, navigate]);

  return (
    <div className="flex min-h-svh flex-col bg-[var(--color-bg)] text-[var(--color-fg)]">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-surface shadow-sm">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-3 px-4 sm:px-6 md:h-16 lg:px-8">
          <div className="flex items-center gap-3 sm:gap-6 lg:gap-10 min-w-0">
            <button
              type="button"
              aria-label="Abrir menú"
              aria-expanded={drawerOpen}
              className="md:hidden -ml-2 inline-flex h-11 w-11 items-center justify-center text-marine hover:text-terracotta transition-colors"
              onClick={openDrawer}
            >
              {HamburgerIcon}
            </button>

            <Link to="/dashboard" className="md:hidden">
              <LogoMark size={40} />
            </Link>

            <Link to="/dashboard" className="hidden md:block">
              <LogoWordmark />
            </Link>

            <nav
              className="hidden md:flex items-center gap-5 lg:gap-7 text-xs font-bold uppercase tracking-widest"
              aria-label="Navegación principal"
            >
              {NAV_ITEMS.map((item) => (
                <DesktopNavLink key={item.to} to={item.to}>
                  {item.label}
                </DesktopNavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="md:hidden inline-flex h-11 w-11 items-center justify-center text-slate-500 hover:text-marine transition-colors"
              aria-label="Buscar"
              onClick={() => {
                // Search overlay deferred to task028; for now no-op.
              }}
            >
              {SearchIcon}
            </button>

            {canSearchGuests && (
              <div className="relative hidden md:block" ref={searchRef}>
                <input
                  type="text"
                  value={searchQ}
                  onChange={(e) => {
                    setSearchQ(e.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Buscar huésped…"
                  className="bg-cream border border-slate-200 text-sm rounded-full pl-5 pr-10 py-2 w-56 lg:w-72 focus:outline-none focus:border-marine focus:ring-1 focus:ring-marine"
                  aria-label="Buscar huésped"
                  aria-expanded={searchOpen}
                  autoComplete="off"
                />
                <span className="absolute right-4 top-2.5 text-slate-400 pointer-events-none">
                  {SearchIcon}
                </span>
                {searchOpen && searchQ.trim().length >= 2 && (
                  <div className="absolute right-0 left-0 mt-2 rounded-lg border border-slate-200 bg-surface shadow-lg max-h-80 overflow-y-auto z-50">
                    {searchLoading && (
                      <p className="px-3 py-2 text-xs text-slate-500">Buscando…</p>
                    )}
                    {!searchLoading && searchHits.length === 0 && (
                      <p className="px-3 py-2 text-xs text-slate-500">Sin resultados</p>
                    )}
                    {!searchLoading && searchHits.map((h) => (
                      <button
                        type="button"
                        key={h.id}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSearchPick(h.id)}
                        className="block w-full text-left px-3 py-2 hover:bg-cream"
                      >
                        <p className="text-sm font-semibold text-ink truncate">{h.nombreCompleto}</p>
                        {h.email && (
                          <p className="text-xs text-slate-500 truncate">{h.email}</p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {isAdmin && (
              <Link
                to="/settings/global"
                className="inline-flex h-11 w-11 items-center justify-center text-slate-500 hover:text-marine transition-colors md:h-10 md:w-10"
                aria-label="Settings globales"
              >
                {GearIcon}
              </Link>
            )}

            <div className="relative hidden md:block" ref={avatarRef}>
              <button
                type="button"
                onClick={toggleAvatar}
                aria-haspopup="menu"
                aria-expanded={avatarOpen}
                aria-label="Mi cuenta"
                className="hover:ring-2 hover:ring-marine/30 transition rounded-full"
              >
                {user?.id ? (
                  <UserAvatar
                    userId={user.id}
                    email={user.email}
                    version={user.avatarVersion}
                    className="w-9 h-9 rounded-full"
                    fallbackClassName="bg-gold/20 border border-gold/40 text-marine font-bold text-sm"
                  />
                ) : (
                  <span className="flex w-9 h-9 rounded-full bg-gold/20 border border-gold/40 items-center justify-center text-marine font-bold text-sm">
                    {initialsFromEmail(user?.email)}
                  </span>
                )}
              </button>
              {avatarOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-200 bg-surface shadow-lg py-2"
                >
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-sm font-semibold text-ink truncate">
                      {user?.email ?? "Invitado"}
                    </p>
                    <p className="text-xs text-slate-500 capitalize">
                      {user?.role?.toLowerCase() ?? "—"}
                    </p>
                  </div>
                  <Link
                    to="/me"
                    role="menuitem"
                    onClick={closeAvatar}
                    className="block px-3 py-2 text-sm text-ink hover:bg-cream"
                  >
                    Mi perfil
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 text-sm text-terracotta hover:bg-terracotta/5"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-4 sm:px-6 md:py-6 lg:px-8 pb-8">
        <Outlet />
      </main>

      <MobileNavDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        primary={NAV_ITEMS}
        isAdmin={isAdmin}
      />
    </div>
  );
};
