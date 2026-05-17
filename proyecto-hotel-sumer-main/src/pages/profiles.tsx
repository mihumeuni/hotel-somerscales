import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button, EmptyState, Modal, Skeleton } from "../components/ui";
import { listRoles, type Role } from "../types/role";
import {
  deleteUser,
  inviteUser,
  listUsers,
  resetUserPassword,
  type UserSummary,
} from "../types/user";

type Toast = { kind: "ok" | "error"; text: string } | null;

// Spanish plural labels keyed by role name. Falls back to the role itself.
const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administradores",
  RECEPCIONISTA: "Recepcionistas",
  ASISTENTE: "Asistentes",
  Auditor: "Auditores",
};
const roleLabel = (name: string) => ROLE_LABELS[name] ?? name;

// Tailwind color token per role. Matches wireframe (marine/terracotta/gold).
const ROLE_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  ADMIN: { text: "text-marine", bg: "bg-marine/15", border: "border-marine/30" },
  RECEPCIONISTA: {
    text: "text-terracotta",
    bg: "bg-terracotta/15",
    border: "border-terracotta/30",
  },
  ASISTENTE: { text: "text-gold", bg: "bg-gold/15", border: "border-gold/30" },
};
const DEFAULT_COLOR = {
  text: "text-slate-600",
  bg: "bg-slate-200/50",
  border: "border-slate-300",
};
const colorFor = (role: string) => ROLE_COLORS[role] ?? DEFAULT_COLOR;

const initialsOf = (name: string | null, email: string) => {
  const source = (name && name.trim()) || email.split("@")[0] || "?";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
};

type CreateDraft = {
  nombre: string;
  email: string;
  telefono: string;
  role: string;
};

const emptyDraft: CreateDraft = { nombre: "", email: "", telefono: "", role: "" };

const Profiles = () => {
  const { has } = useAuth();
  const navigate = useNavigate();
  const canInvite = has("user.invite");
  const canManage = has("user.manage");
  const allowed = canInvite || canManage;

  const openEdit = (id: number) => navigate(`/admin/perfiles/${id}`);

  const [users, setUsers] = useState<UserSummary[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState<CreateDraft>(emptyDraft);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [resettingId, setResettingId] = useState<number | null>(null);
  const [resetDoneIds, setResetDoneIds] = useState<Set<number>>(new Set());

  const [confirmDelete, setConfirmDelete] = useState<UserSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = useCallback((next: Toast) => {
    setToast(next);
    if (next) window.setTimeout(() => setToast(null), 2500);
  }, []);

  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    (async () => {
      try {
        const [usersData, rolesData] = await Promise.all([
          listUsers(),
          listRoles(),
        ]);
        if (cancelled) return;
        setUsers(usersData);
        setRoles(rolesData);
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "No se pudo cargar la lista.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [allowed]);

  const grouped = useMemo(() => {
    // Preserve role table order if available; append roles encountered only
    // in users last (defensive — usually all users' roles exist in /api/roles).
    const order: string[] = [];
    const seen = new Set<string>();
    for (const r of roles) {
      if (!seen.has(r.name)) {
        order.push(r.name);
        seen.add(r.name);
      }
    }
    for (const u of users) {
      if (!seen.has(u.role)) {
        order.push(u.role);
        seen.add(u.role);
      }
    }
    return order
      .map((name) => ({
        name,
        members: users.filter((u) => u.role === name),
      }))
      .filter((g) => g.members.length > 0);
  }, [users, roles]);

  const openCreate = () => {
    const preferred =
      roles.find((r) => r.name === "RECEPCIONISTA")?.name ??
      roles[0]?.name ??
      "";
    setDraft({ ...emptyDraft, role: preferred });
    setCreateError(null);
    setCreateOpen(true);
  };

  const closeCreate = () => {
    if (creating) return;
    setCreateOpen(false);
  };

  const handleCreateChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setDraft((prev) => ({ ...prev, [name]: value }));
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      const body = {
        nombre: draft.nombre.trim(),
        telefono: draft.telefono.trim() || null,
        email: draft.email.trim().toLowerCase(),
        role: draft.role,
      };
      await inviteUser(body);
      showToast({ kind: "ok", text: `Invitación enviada a ${body.email}` });
      setCreateOpen(false);
      // Refresh list — the user appears only after they consume the invite,
      // but this catches the case where someone else added a user in parallel.
      try {
        const next = await listUsers();
        setUsers(next);
      } catch {
        /* non-fatal */
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("409")) {
        setCreateError("Ya existe un usuario o invitación con ese correo.");
      } else if (msg.includes("403")) {
        setCreateError("No tienes permiso para invitar usuarios.");
      } else if (msg.includes("400")) {
        setCreateError("Datos inválidos. Revisa los campos.");
      } else {
        setCreateError("No se pudo enviar la invitación. Intenta nuevamente.");
      }
    } finally {
      setCreating(false);
    }
  };

  const handleReset = async (user: UserSummary) => {
    if (!canManage) return;
    setResettingId(user.id);
    try {
      await resetUserPassword(user.id);
      setResetDoneIds((prev) => new Set(prev).add(user.id));
      showToast({ kind: "ok", text: `Correo enviado a ${user.email}` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      showToast({
        kind: "error",
        text: msg.includes("404")
          ? "Usuario no encontrado."
          : "No se pudo enviar el correo de restablecimiento.",
      });
    } finally {
      setResettingId(null);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteUser(confirmDelete.id);
      setUsers((prev) => prev.filter((u) => u.id !== confirmDelete.id));
      showToast({ kind: "ok", text: `${confirmDelete.email} eliminado.` });
      setConfirmDelete(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      showToast({
        kind: "error",
        text: msg.includes("409")
          ? "No se puede eliminar a un administrador del sistema."
          : "No se pudo eliminar al usuario.",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (!allowed) return <Navigate to="/dashboard" replace />;

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1400px] mx-auto w-full flex-grow flex flex-col gap-6 pb-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-serif text-marine text-2xl">Perfiles</h2>
        {canInvite && (
          <button
            type="button"
            onClick={openCreate}
            className="bg-marine hover:bg-marine-soft text-white px-5 py-2 rounded-full text-xs font-bold tracking-wider uppercase shadow-sm transition shrink-0"
          >
            + Crear usuario
          </button>
        )}
      </div>

      {loading && (
        <>
          <div className="hidden md:block bg-surface border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-cream px-6 py-2.5">
              <Skeleton className="h-3 w-32" />
            </div>
            <div className="divide-y divide-slate-100">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-6 py-3 flex items-center gap-3">
                  <Skeleton className="w-9 h-9" rounded="full" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          </div>
          <div className="md:hidden space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-surface border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-3"
              >
                <Skeleton className="w-10 h-10" rounded="full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {loadError && !loading && (
        <p role="alert" className="text-sm text-red-600">
          {loadError}
        </p>
      )}
      {!loading && !loadError && grouped.length === 0 && (
        <div className="bg-surface border border-slate-200 rounded-xl shadow-sm">
          <EmptyState
            title="Sin usuarios aún"
            body="Invita al primero del equipo con “+ Crear usuario”."
            cta={
              canInvite ? (
                <Button onClick={openCreate}>+ Crear usuario</Button>
              ) : null
            }
          />
        </div>
      )}

      {/* Desktop: single bordered card with grouped sections */}
      <div className="hidden md:block bg-surface border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {grouped.map((group) => {
          const color = colorFor(group.name);
          return (
            <div key={group.name} className="border-b border-slate-100 last:border-0">
              <div className="bg-cream px-6 py-2.5 flex items-center justify-between">
                <h3
                  className={`text-[11px] font-bold uppercase tracking-widest ${color.text}`}
                >
                  {roleLabel(group.name)}{" "}
                  <span className="text-slate-400 font-mono ml-1">
                    · {group.members.length}
                  </span>
                </h3>
              </div>
              <table className="w-full text-left text-sm table-fixed">
                <colgroup>
                  <col className="w-[28%]" />
                  <col className="w-[30%]" />
                  <col className="w-[18%]" />
                  <col className="w-[12%]" />
                  <col className="w-[12%]" />
                </colgroup>
                <tbody className="divide-y divide-slate-100">
                  {group.members.map((u) => (
                    <tr key={u.id} className="hover:bg-cream transition">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-9 h-9 rounded-full ${color.bg} border ${color.border} flex items-center justify-center ${color.text} font-bold text-xs`}
                          >
                            {initialsOf(u.name, u.email)}
                          </span>
                          {canManage ? (
                            <button
                              type="button"
                              onClick={() => openEdit(u.id)}
                              className="font-semibold text-ink hover:text-marine hover:underline text-left truncate min-w-0"
                            >
                              {u.name ?? u.email}
                            </button>
                          ) : (
                            <span className="font-semibold text-ink truncate min-w-0">
                              {u.name ?? u.email}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-slate-500 truncate">{u.email}</td>
                      <td className="px-6 py-3">
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => handleReset(u)}
                            disabled={resettingId === u.id}
                            className="text-[11px] uppercase tracking-wider text-marine hover:underline font-bold disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                          >
                            {resettingId === u.id
                              ? "Enviando…"
                              : resetDoneIds.has(u.id)
                                ? "Enviado ✓"
                                : "Resetear contraseña"}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-3 text-slate-600 font-mono text-xs">
                        {u.sheetCount} fichas
                      </td>
                      <td className="px-6 py-3 text-right">
                        {canManage && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEdit(u.id)}
                              className="p-1 text-slate-400 hover:text-marine"
                              title="Editar"
                              aria-label={`Editar ${u.email}`}
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(u)}
                              className="p-1 text-slate-400 hover:text-terracotta"
                              title="Eliminar"
                              aria-label={`Eliminar ${u.email}`}
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"
                                />
                              </svg>
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      {/* Mobile: stacked cards per group */}
      <div className="md:hidden space-y-4">
        {grouped.map((group) => {
          const color = colorFor(group.name);
          return (
            <div key={group.name}>
              <h3
                className={`text-[11px] font-bold uppercase tracking-widest ${color.text} mb-2 px-1`}
              >
                {roleLabel(group.name)} · {group.members.length}
              </h3>
              <div className="space-y-2">
                {group.members.map((u) => (
                  <div
                    key={u.id}
                    className="bg-surface border border-slate-200 rounded-xl p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className={`w-10 h-10 rounded-full ${color.bg} border ${color.border} flex items-center justify-center ${color.text} font-bold`}
                      >
                        {initialsOf(u.name, u.email)}
                      </span>
                      <div className="min-w-0 flex-1">
                        {canManage ? (
                          <button
                            type="button"
                            onClick={() => openEdit(u.id)}
                            className="font-semibold text-ink truncate text-left hover:text-marine hover:underline w-full"
                          >
                            {u.name ?? u.email}
                          </button>
                        ) : (
                          <p className="font-semibold text-ink truncate">
                            {u.name ?? u.email}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 truncate">
                          {u.email}
                        </p>
                      </div>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(u)}
                          className="inline-flex h-11 w-11 -mr-2 items-center justify-center text-slate-400 hover:text-terracotta"
                          title="Eliminar"
                          aria-label={`Eliminar ${u.email}`}
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">
                        <span className="font-mono font-bold text-ink">
                          {u.sheetCount}
                        </span>{" "}
                        fichas
                      </span>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => handleReset(u)}
                          disabled={resettingId === u.id}
                          className="min-h-[36px] -mr-2 px-2 text-marine font-bold uppercase tracking-wider hover:underline disabled:opacity-50"
                        >
                          {resettingId === u.id
                            ? "Enviando…"
                            : resetDoneIds.has(u.id)
                              ? "Enviado ✓"
                              : "Resetear contraseña"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 px-4 py-2 rounded-lg text-sm shadow-lg ${
            toast.kind === "ok"
              ? "bg-marine text-white"
              : "bg-terracotta text-white"
          }`}
        >
          {toast.text}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={closeCreate}
        title="Crear nuevo usuario"
        footer={
          <>
            <button
              type="button"
              onClick={closeCreate}
              disabled={creating}
              className="px-4 py-2 text-sm text-slate-600 hover:text-ink disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="create-user-form"
              disabled={creating}
              className="bg-marine hover:bg-marine-soft text-white px-5 py-2 rounded-full text-xs font-bold tracking-wider uppercase disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {creating ? "Enviando…" : "Enviar invitación"}
            </button>
          </>
        }
      >
        <form
          id="create-user-form"
          onSubmit={submitCreate}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="nombre"
              className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2"
            >
              Nombre completo
            </label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              value={draft.nombre}
              onChange={handleCreateChange}
              required
              maxLength={200}
              className="w-full bg-cream border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-marine focus:ring-1 focus:ring-marine"
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={draft.email}
              onChange={handleCreateChange}
              required
              maxLength={200}
              placeholder="usuario@hotelsomerscales.cl"
              className="w-full bg-cream border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-marine focus:ring-1 focus:ring-marine"
            />
          </div>
          <div>
            <label
              htmlFor="telefono"
              className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2"
            >
              Teléfono (opcional)
            </label>
            <input
              id="telefono"
              name="telefono"
              type="tel"
              value={draft.telefono}
              onChange={handleCreateChange}
              maxLength={40}
              className="w-full bg-cream border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-marine focus:ring-1 focus:ring-marine"
            />
          </div>
          <div>
            <label
              htmlFor="role"
              className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2"
            >
              Rol asignado
            </label>
            <select
              id="role"
              name="role"
              value={draft.role}
              onChange={handleCreateChange}
              required
              className="w-full bg-cream border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-marine focus:ring-1 focus:ring-marine"
            >
              {roles.length === 0 && <option value="">Cargando roles…</option>}
              {roles.map((r) => (
                <option key={r.id} value={r.name}>
                  {roleLabel(r.name)}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-slate-500 bg-cream p-3 rounded-lg">
            Se enviará un correo con un enlace para que la persona elija su
            contraseña.
          </p>
          {createError && (
            <p role="alert" className="text-sm text-red-600">
              {createError}
            </p>
          )}
        </form>
      </Modal>

      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => !deleting && setConfirmDelete(null)}
        title="Eliminar usuario"
        footer={
          <>
            <button
              type="button"
              onClick={() => setConfirmDelete(null)}
              disabled={deleting}
              className="px-4 py-2 text-sm text-slate-600 hover:text-ink disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirmed}
              disabled={deleting}
              className="bg-terracotta hover:bg-terracotta/90 text-white px-5 py-2 rounded-full text-xs font-bold tracking-wider uppercase disabled:opacity-60"
            >
              {deleting ? "Eliminando…" : "Eliminar"}
            </button>
          </>
        }
      >
        <p>
          ¿Eliminar el acceso de{" "}
          <strong>{confirmDelete?.name ?? confirmDelete?.email}</strong>? La
          cuenta se deshabilita y se conserva el historial de fichas.
        </p>
      </Modal>
    </main>
  );
};

export default Profiles;
