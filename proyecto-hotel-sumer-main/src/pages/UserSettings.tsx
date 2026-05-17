import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getMe,
  getUserById,
  resetUserPassword,
  updateMe,
  updateUser,
  type UpdateMeRequest,
  type UpdateUserRequest,
  type UserSummary,
} from "../types/user";
import { listRoles, type Role } from "../types/role";
import { Button, Card } from "../components/ui";
import { initialsOf } from "../components/dashboard/avatar";

type Theme = "light" | "dark" | "system";

const THEME_KEY = "theme";

const applyTheme = (t: Theme) => {
  const root = document.documentElement;
  if (t === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", t);
  }
};

const readTheme = (): Theme => {
  const v = localStorage.getItem(THEME_KEY);
  return v === "dark" || v === "system" ? v : "light";
};

const memberSince = (iso: string | null | undefined) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const CameraIcon = (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const UserSettings = () => {
  const navigate = useNavigate();
  const { id: pathId } = useParams<{ id: string }>();
  const { user, logout, has, refreshSelf } = useAuth();

  const adminEditTargetId = useMemo(() => {
    if (!pathId) return null;
    const n = Number(pathId);
    if (!Number.isFinite(n) || n <= 0) return null;
    if (user?.id != null && user.id === n) return null;
    return n;
  }, [pathId, user?.id]);

  const isAdminEdit = adminEditTargetId !== null && has("user.manage");

  const [target, setTarget] = useState<UserSummary | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [theme, setTheme] = useState<Theme>(() => readTheme());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const me = isAdminEdit && adminEditTargetId !== null
        ? await getUserById(adminEditTargetId)
        : await getMe();
      setTarget(me);
      setName(me.name ?? "");
      setEmail(me.email);
      setPhone(me.phone ?? "");
      setRole(me.role);
      if (isAdminEdit) {
        const allRoles = await listRoles();
        setRoles(allRoles);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al cargar el perfil";
      setError(msg.includes("404") ? "Usuario no encontrado" : msg);
    } finally {
      setLoading(false);
    }
  }, [isAdminEdit, adminEditTargetId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      if (isAdminEdit && adminEditTargetId !== null) {
        const req: UpdateUserRequest = {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          role,
        };
        const updated = await updateUser(adminEditTargetId, req);
        setTarget(updated);
        setSuccess("Cambios guardados");
      } else {
        const req: UpdateMeRequest = {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
        };
        if (currentPassword || newPassword || confirmPassword) {
          req.currentPassword = currentPassword;
          req.newPassword = newPassword;
          req.confirmPassword = confirmPassword;
        }
        const updated = await updateMe(req);
        setTarget(updated);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setSuccess("Cambios guardados");
        await refreshSelf();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al guardar";
      const code = msg.match(/HTTP (\d+)/)?.[1];
      if (code === "409") setError("Ese email ya está en uso.");
      else if (code === "400" || code === "403") setError("Revisa los datos: email inválido, la contraseña actual no coincide o la nueva es muy corta (mín. 8).");
      else setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!target) return;
    if (!window.confirm(`¿Enviar correo de restablecimiento de contraseña a ${target.email}?`)) return;
    setResetting(true);
    setError(null);
    setSuccess(null);
    try {
      await resetUserPassword(target.id);
      setSuccess("Correo enviado");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al restablecer");
    } finally {
      setResetting(false);
    }
  };

  const handleDiscard = () => {
    if (!target) return;
    setName(target.name ?? "");
    setEmail(target.email);
    setPhone(target.phone ?? "");
    setRole(target.role);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    setSuccess(null);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleThemeChange = (next: Theme) => {
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  };

  const memberDate = memberSince(target?.createdAt ?? null);

  if (loading) {
    return (
      <Card>
        <p className="text-sm text-slate-500">Cargando perfil…</p>
      </Card>
    );
  }

  if (!target) {
    return (
      <Card>
        <p role="alert" className="text-sm text-terracotta">{error ?? "No se pudo cargar el perfil."}</p>
        <div className="mt-3">
          <Button variant="secondary" onClick={() => navigate(-1)}>Volver</Button>
        </div>
      </Card>
    );
  }

  const inputClass =
    "w-full bg-cream border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-marine focus:ring-1 focus:ring-marine";
  const labelClass = "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2";

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-marine text-2xl">
          {isAdminEdit ? "Editar usuario" : "Mi perfil"}
        </h2>
        {!isAdminEdit && (
          <button
            type="button"
            onClick={handleLogout}
            className="text-terracotta text-xs font-bold uppercase tracking-wider hover:underline"
          >
            Cerrar sesión
          </button>
        )}
      </div>

      <section className="bg-surface border border-slate-200 rounded-xl shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-5 mb-8">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gold/20 border-2 border-gold/40 flex items-center justify-center text-marine font-serif text-2xl shadow-sm">
              {initialsOf(target.name ?? target.email)}
            </div>
            <button
              type="button"
              disabled
              title="Disponible en próxima versión"
              aria-label="Cambiar foto (disponible en próxima versión)"
              className="absolute bottom-0 right-0 w-7 h-7 bg-marine/40 text-white rounded-full flex items-center justify-center shadow-md cursor-not-allowed"
            >
              {CameraIcon}
            </button>
          </div>
          <div className="min-w-0">
            <p className="font-serif text-marine text-xl truncate">{target.name ?? "Sin nombre"}</p>
            <p className="text-xs text-slate-500">{target.role}</p>
            {memberDate && (
              <p className="text-[11px] text-slate-400 mt-1">Miembro desde {memberDate}</p>
            )}
          </div>
        </div>

        <form className="space-y-5" onSubmit={handleSave}>
          <div>
            <label className={labelClass} htmlFor="us-name">Nombre completo</label>
            <input
              id="us-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="us-email">Email</label>
            <input
              id="us-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="us-phone">Teléfono</label>
            <input
              id="us-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+56 9 …"
              className={inputClass}
            />
          </div>

          {isAdminEdit ? (
            <>
              <div>
                <label className={labelClass} htmlFor="us-role">Rol asignado</label>
                <select
                  id="us-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={inputClass}
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="rounded-lg border border-slate-200 bg-cream/60 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-xs text-slate-600">
                  <p className="font-semibold text-ink">Contraseña</p>
                  <p>Envía un correo al usuario para que establezca una nueva contraseña.</p>
                </div>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={handleReset}
                  disabled={resetting}
                >
                  {resetting ? "Enviando…" : "Resetear contraseña"}
                </Button>
              </div>
            </>
          ) : (
            <fieldset className="border border-slate-200 rounded-lg p-4">
              <legend className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2">
                Cambiar contraseña
              </legend>
              <div className="space-y-3 pt-2">
                <input
                  type="password"
                  placeholder="Contraseña actual"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={inputClass}
                  autoComplete="current-password"
                />
                <input
                  type="password"
                  placeholder="Nueva contraseña (mín. 8 caracteres)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputClass}
                  autoComplete="new-password"
                />
                <input
                  type="password"
                  placeholder="Confirmar nueva"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                  autoComplete="new-password"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-3">
                Deja los tres campos en blanco para no cambiar la contraseña.
              </p>
            </fieldset>
          )}

          <fieldset className="border border-slate-200 rounded-lg p-4">
            <legend className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2">
              Apariencia
            </legend>
            <div className="grid grid-cols-3 gap-2 pt-2">
              {(["light", "dark", "system"] as const).map((opt) => (
                <label key={opt} className="cursor-pointer">
                  <input
                    type="radio"
                    name="theme"
                    value={opt}
                    checked={theme === opt}
                    onChange={() => handleThemeChange(opt)}
                    className="peer sr-only"
                  />
                  <div className="border-2 border-slate-200 peer-checked:border-marine rounded-lg p-3 text-center transition">
                    <div
                      className={
                        opt === "light"
                          ? "h-12 bg-cream border border-slate-300 rounded mb-2"
                          : opt === "dark"
                            ? "h-12 bg-marine-deep border border-marine rounded mb-2"
                            : "h-12 bg-gradient-to-r from-cream to-marine-deep border border-slate-300 rounded mb-2"
                      }
                    />
                    <span className="text-xs font-semibold text-slate-700">
                      {opt === "light" ? "Claro" : opt === "dark" ? "Oscuro" : "Sistema"}
                    </span>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-3">
              Aplicado al instante en este dispositivo. La sincronización entre dispositivos llegará en una próxima versión.
            </p>
          </fieldset>

          {error && (
            <p role="alert" className="text-sm text-terracotta">{error}</p>
          )}
          {success && (
            <p role="status" className="text-sm text-emerald-700">{success}</p>
          )}

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleDiscard}
              disabled={saving}
              className="px-5 py-2 text-sm text-slate-600 hover:text-marine font-semibold disabled:opacity-50"
            >
              Descartar
            </button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando…" : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default UserSettings;
