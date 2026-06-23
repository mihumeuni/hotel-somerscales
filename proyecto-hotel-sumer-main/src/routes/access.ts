import { matchPath } from "react-router-dom";

/**
 * Central RBAC affordance map for the SPA.
 *
 * Each rule binds a route pattern to the permission codes that let a user SEE
 * that page. `anyOf` has OR semantics — the user needs at least one of the
 * listed codes. A path with no matching rule (e.g. "/me") is viewable by any
 * authenticated user.
 *
 * This is a UI affordance only: it hides nav links and renders the "Sin acceso"
 * screen on direct navigation. The authoritative gate is the backend's
 * @PreAuthorize checks — never rely on this map for data protection.
 *
 * Codes mirror the seeded `permissions` table (migrations V2 / V14 / V16) and
 * the per-page self-checks already present in the page components.
 */
export type AccessRule = { pattern: string; anyOf: string[] };

export const ROUTE_ACCESS: AccessRule[] = [
  { pattern: "/dashboard", anyOf: ["dashboard.read"] },
  { pattern: "/calendario", anyOf: ["booking.read"] },
  { pattern: "/admin/roles", anyOf: ["role.manage"] },
  // Profiles list: invite OR manage may open it (matches profiles.tsx).
  { pattern: "/admin/perfiles", anyOf: ["user.invite", "user.manage"] },
  // Admin-editing another user requires manage (matches UserSettings).
  { pattern: "/admin/perfiles/:id", anyOf: ["user.manage"] },
  // Fichas degrade to read-only without sheet.write, so read gates viewing;
  // the write controls inside each page self-gate on sheet.write.
  { pattern: "/fichas", anyOf: ["sheet.read"] },
  { pattern: "/fichas/:id/editar", anyOf: ["sheet.read"] },
  { pattern: "/fichas/:id/resumen", anyOf: ["sheet.read"] },
  { pattern: "/settings/global", anyOf: ["category.manage"] },
  { pattern: "/reviews", anyOf: ["review.read"] },
  { pattern: "/reservas/:reservaId/gastos", anyOf: ["expense.read"] },
  { pattern: "/huespedes/:id", anyOf: ["guest.read"] },
  // Ungated (any authenticated user): "/me".
];

/**
 * Primary nav destinations in display order. Icons live in AppShell — paths,
 * labels, and order are single-sourced here so the nav menu and the
 * "first accessible page" fallback never drift apart.
 */
export const PRIMARY_NAV: { to: string; label: string }[] = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/calendario", label: "Calendario" },
  { to: "/admin/roles", label: "Roles & Permisos" },
  { to: "/admin/perfiles", label: "Perfiles" },
  { to: "/fichas", label: "Fichas" },
];

/** Required permission codes for a path, or null when the path is ungated. */
export const requiredPermsForPath = (pathname: string): string[] | null => {
  for (const rule of ROUTE_ACCESS) {
    if (matchPath({ path: rule.pattern, end: true }, pathname)) return rule.anyOf;
  }
  return null;
};

/** True when `has` satisfies at least one required code (or the path is ungated). */
export const canAccessPath = (
  pathname: string,
  has: (perm: string) => boolean,
): boolean => {
  const req = requiredPermsForPath(pathname);
  if (!req || req.length === 0) return true;
  return req.some((perm) => has(perm));
};

/** First primary-nav path the user can reach, falling back to "/me". */
export const firstAccessiblePath = (has: (perm: string) => boolean): string => {
  const hit = PRIMARY_NAV.find((dest) => canAccessPath(dest.to, has));
  return hit?.to ?? "/me";
};
