import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { EmptyState, Modal, Skeleton } from "../components/ui";
import {
  createRole,
  deleteRole,
  listPermissions,
  listRoles,
  savePermissions,
  updateRole,
  type Permission,
  type Role,
} from "../types/role";

const GROUP_LABELS: Record<string, string> = {
  guest: "Huéspedes",
  booking: "Reservas",
  expense: "Gastos adicionales",
  review: "Reseñas",
  dashboard: "Dashboard",
  user: "Usuarios",
  role: "Roles y permisos",
};

const groupLabel = (key: string) =>
  GROUP_LABELS[key] ?? key[0].toUpperCase() + key.slice(1);

type Toast = { kind: "ok" | "error"; text: string } | null;

type Draft = {
  name: string;
  description: string;
  permissions: Set<string>;
};

const draftFromRole = (role: Role): Draft => ({
  name: role.name,
  description: role.description ?? "",
  permissions: new Set(role.permissions),
});

const RolesPermissions = () => {
  const { has } = useAuth();
  const allowed = has("role.manage");

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedId) ?? null,
    [roles, selectedId],
  );

  const showToast = useCallback((next: Toast) => {
    setToast(next);
    if (next) {
      window.setTimeout(() => setToast(null), 2500);
    }
  }, []);

  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    (async () => {
      try {
        const [rolesData, permsData] = await Promise.all([
          listRoles(),
          listPermissions(),
        ]);
        if (cancelled) return;
        setRoles(rolesData);
        setPermissions(permsData);
        if (rolesData.length > 0) {
          setSelectedId(rolesData[0].id);
          setDraft(draftFromRole(rolesData[0]));
        }
      } catch {
        if (!cancelled) setLoadError("No se pudieron cargar los roles");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [allowed]);

  const permsByGroup = useMemo(() => {
    const m = new Map<string, Permission[]>();
    permissions.forEach((p) => {
      const arr = m.get(p.group) ?? [];
      arr.push(p);
      m.set(p.group, arr);
    });
    m.forEach((arr) => arr.sort((a, b) => a.code.localeCompare(b.code)));
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [permissions]);

  const selectRole = useCallback(
    (role: Role) => {
      setSelectedId(role.id);
      setDraft(draftFromRole(role));
      setToast(null);
    },
    [],
  );

  const handleCreate = useCallback(async () => {
    const baseName = "Nuevo rol";
    let name = baseName;
    let n = 2;
    const taken = new Set(roles.map((r) => r.name));
    while (taken.has(name)) {
      name = `${baseName} ${n++}`;
    }
    try {
      const created = await createRole({ name, description: "" });
      setRoles((prev) => [...prev, created]);
      setSelectedId(created.id);
      setDraft(draftFromRole(created));
      showToast({ kind: "ok", text: "Rol creado" });
    } catch {
      showToast({ kind: "error", text: "No se pudo crear el rol" });
    }
  }, [roles, showToast]);

  const togglePermission = useCallback((code: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = new Set(prev.permissions);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return { ...prev, permissions: next };
    });
  }, []);

  const setGroup = useCallback(
    (group: string, allOn: boolean) => {
      setDraft((prev) => {
        if (!prev) return prev;
        const next = new Set(prev.permissions);
        const codes = permissions
          .filter((p) => p.group === group)
          .map((p) => p.code);
        codes.forEach((c) => (allOn ? next.add(c) : next.delete(c)));
        return { ...prev, permissions: next };
      });
    },
    [permissions],
  );

  const handleSave = useCallback(async () => {
    if (!draft || !selectedRole) return;
    setSaving(true);

    const nameChanged =
      draft.name.trim() !== selectedRole.name ||
      (draft.description ?? "") !== (selectedRole.description ?? "");

    const draftPerms = Array.from(draft.permissions).sort();
    const currentPerms = [...selectedRole.permissions].sort();
    const permsChanged =
      draftPerms.length !== currentPerms.length ||
      draftPerms.some((p, i) => p !== currentPerms[i]);

    try {
      let updated: Role = selectedRole;
      if (nameChanged) {
        updated = await updateRole(selectedRole.id, {
          name: draft.name.trim(),
          description: draft.description.trim() || null,
        });
      }
      if (permsChanged && !selectedRole.systemAdmin) {
        updated = await savePermissions(selectedRole.id, draftPerms);
      }
      setRoles((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r)),
      );
      setDraft(draftFromRole(updated));
      showToast({ kind: "ok", text: "Guardado ✓" });
    } catch {
      showToast({ kind: "error", text: "No se pudo guardar" });
    } finally {
      setSaving(false);
    }
  }, [draft, selectedRole, showToast]);

  const handleDelete = useCallback(async () => {
    if (!selectedRole) return;
    try {
      await deleteRole(selectedRole.id);
      setRoles((prev) => {
        const filtered = prev.filter((r) => r.id !== selectedRole.id);
        if (filtered.length > 0) {
          setSelectedId(filtered[0].id);
          setDraft(draftFromRole(filtered[0]));
        } else {
          setSelectedId(null);
          setDraft(null);
        }
        return filtered;
      });
      setConfirmDelete(false);
      showToast({ kind: "ok", text: "Rol eliminado" });
    } catch (err) {
      setConfirmDelete(false);
      const message =
        err instanceof Error && err.message.includes("409")
          ? "Este rol tiene usuarios asignados; reasignalos antes de eliminarlo"
          : "No se pudo eliminar el rol";
      showToast({ kind: "error", text: message });
    }
  }, [selectedRole, showToast]);

  const isAdminLocked = selectedRole?.systemAdmin ?? false;

  if (!allowed) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-marine text-2xl md:text-3xl tracking-tight">
            Roles & Permisos
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Define qué puede ver y hacer cada rol del personal.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          className="shrink-0 rounded-full bg-marine px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-marine-soft"
        >
          + Nuevo rol
        </button>
      </div>

      {loading && (
        <div className="grid flex-grow grid-cols-1 gap-4 lg:grid-cols-5 lg:gap-6">
          <aside className="rounded-xl border border-slate-200 bg-surface p-3 shadow-sm lg:col-span-2">
            <Skeleton className="h-3 w-24 mb-3" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full" rounded="lg" />
              ))}
            </div>
          </aside>
          <section className="rounded-xl border border-slate-200 bg-surface p-4 shadow-sm md:p-6 lg:col-span-3 space-y-4">
            <Skeleton className="h-9 w-full" rounded="lg" />
            <Skeleton className="h-9 w-full" rounded="lg" />
            <div className="border-t border-slate-100 pt-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" rounded="lg" />
              ))}
            </div>
          </section>
        </div>
      )}

      {loadError && !loading && (
        <div className="rounded-xl border border-terracotta/40 bg-terracotta/10 p-4 text-sm text-terracotta">
          {loadError}
        </div>
      )}

      {!loading && !loadError && (
        <div className="grid flex-grow grid-cols-1 gap-4 lg:grid-cols-5 lg:gap-6">
          {/* Mobile: horizontal chip strip. Desktop: vertical list. */}
          <aside className="rounded-xl border border-slate-200 bg-surface p-2 shadow-sm lg:col-span-2">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Roles existentes
            </div>
            <ul className="flex gap-2 overflow-x-auto px-1 pb-2 lg:flex-col lg:gap-1 lg:overflow-visible">
              {roles.map((role) => {
                const active = role.id === selectedId;
                return (
                  <li key={role.id} className="shrink-0 lg:w-full">
                    <button
                      type="button"
                      onClick={() => selectRole(role)}
                      className={`group flex w-full min-w-[180px] cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                        active
                          ? "bg-marine text-white"
                          : "hover:bg-cream"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {role.name}
                          {role.systemAdmin && (
                            <span
                              className={`ml-1 align-middle text-[9px] uppercase tracking-widest ${
                                active ? "text-cream/80" : "text-marine/70"
                              }`}
                            >
                              · sistema
                            </span>
                          )}
                        </p>
                        <p
                          className={`truncate text-[11px] ${
                            active ? "text-cream/70" : "text-slate-500"
                          }`}
                        >
                          {role.description || "Sin descripción"}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-[10px] font-bold uppercase tracking-wider ${
                          active ? "text-cream/80" : "text-slate-400"
                        }`}
                      >
                        {role.memberCount}{" "}
                        {role.memberCount === 1 ? "miembro" : "miembros"}
                      </span>
                    </button>
                  </li>
                );
              })}
              {roles.length === 0 && (
                <li className="w-full py-2">
                  <EmptyState
                    size="compact"
                    title="Sin roles"
                    body="Crea tu primer rol con + Nuevo rol."
                  />
                </li>
              )}
            </ul>
          </aside>

          <section className="flex flex-col rounded-xl border border-slate-200 bg-surface p-4 shadow-sm md:p-6 lg:col-span-3">
            {!draft || !selectedRole ? (
              <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
                Selecciona un rol para editarlo
              </div>
            ) : (
              <>
                {isAdminLocked && (
                  <div className="mb-4 rounded-lg border border-marine/30 bg-marine/5 px-3 py-2 text-xs text-marine">
                    Rol de sistema · nombre y permisos fijos
                  </div>
                )}

                <div className="mb-6 space-y-4">
                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Nombre del rol
                    </label>
                    <input
                      type="text"
                      value={draft.name}
                      disabled={isAdminLocked}
                      onChange={(e) =>
                        setDraft((d) =>
                          d ? { ...d, name: e.target.value } : d,
                        )
                      }
                      className="w-full rounded-lg border border-slate-200 bg-cream px-4 py-2.5 text-sm focus:border-marine focus:outline-none focus:ring-1 focus:ring-marine disabled:cursor-not-allowed disabled:bg-slate-100"
                      maxLength={40}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Descripción
                    </label>
                    <input
                      type="text"
                      value={draft.description}
                      disabled={isAdminLocked}
                      onChange={(e) =>
                        setDraft((d) =>
                          d ? { ...d, description: e.target.value } : d,
                        )
                      }
                      className="w-full rounded-lg border border-slate-200 bg-cream px-4 py-2.5 text-sm focus:border-marine focus:outline-none focus:ring-1 focus:ring-marine disabled:cursor-not-allowed disabled:bg-slate-100"
                      maxLength={255}
                    />
                  </div>
                </div>

                <div className="flex-grow space-y-5 overflow-y-auto border-t border-slate-100 pt-5 pr-1">
                  {permsByGroup.map(([group, perms]) => {
                    const allOn = perms.every((p) =>
                      draft.permissions.has(p.code),
                    );
                    const noneOn = perms.every(
                      (p) => !draft.permissions.has(p.code),
                    );
                    return (
                      <div key={group}>
                        <div className="mb-2 flex items-center justify-between px-3">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-marine">
                            {groupLabel(group)}
                          </h4>
                          <div className="flex gap-2 text-[10px] font-bold uppercase tracking-wider">
                            <button
                              type="button"
                              disabled={isAdminLocked || allOn}
                              onClick={() => setGroup(group, true)}
                              className="text-marine hover:underline disabled:cursor-not-allowed disabled:text-slate-300 disabled:no-underline"
                            >
                              Todos
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                              type="button"
                              disabled={isAdminLocked || noneOn}
                              onClick={() => setGroup(group, false)}
                              className="text-slate-500 hover:underline disabled:cursor-not-allowed disabled:text-slate-300 disabled:no-underline"
                            >
                              Ninguno
                            </button>
                          </div>
                        </div>
                        <div className="divide-y divide-slate-50 rounded-lg border border-slate-100">
                          {perms.map((perm) => {
                            const checked = draft.permissions.has(perm.code);
                            return (
                              <label
                                key={perm.code}
                                className={`flex items-center justify-between gap-3 rounded px-3 py-2 transition ${
                                  isAdminLocked
                                    ? "cursor-not-allowed opacity-70"
                                    : "cursor-pointer hover:bg-cream"
                                }`}
                              >
                                <span className="text-sm text-ink">
                                  {perm.description || perm.code}{" "}
                                  <span className="font-mono text-[10px] text-slate-400">
                                    {perm.code}
                                  </span>
                                </span>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={isAdminLocked}
                                  onChange={() => togglePermission(perm.code)}
                                  className="h-4 w-4 rounded border-slate-300 text-marine focus:ring-marine disabled:cursor-not-allowed"
                                />
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 flex items-center justify-between gap-2 border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    disabled={isAdminLocked}
                    className="text-xs font-bold uppercase tracking-wider text-terracotta hover:underline disabled:cursor-not-allowed disabled:text-slate-300 disabled:no-underline"
                  >
                    Eliminar rol
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isAdminLocked || saving}
                    className="rounded-full bg-marine px-8 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-marine-soft disabled:cursor-not-allowed disabled:bg-marine/40"
                  >
                    {saving ? "Guardando…" : "Guardar rol"}
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Eliminar rol"
        footer={
          <>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="rounded-md border border-slate-300 bg-surface px-4 py-2 text-sm text-ink hover:bg-cream"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-md bg-terracotta px-4 py-2 text-sm font-bold text-white hover:bg-terracotta/90"
            >
              Eliminar
            </button>
          </>
        }
      >
        ¿Eliminar <strong>{selectedRole?.name}</strong>? Esta acción no se puede
        deshacer. Si el rol tiene usuarios asignados, reasignalos antes.
      </Modal>

      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-lg ${
            toast.kind === "ok" ? "bg-marine" : "bg-terracotta"
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
};

export default RolesPermissions;
