import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { applyThemeAttribute, useAuth } from "../context/AuthContext";
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
import {
  changePassword,
  deleteAvatar,
  updatePreferences,
  type Theme,
} from "../types/preferences";
import { Button, Card } from "../components/ui";
import { AvatarUploader } from "../components/AvatarUploader";
import { UserAvatar } from "../components/UserAvatar";

const THEME_KEY = "theme";

const readTheme = (): Theme => {
  const v = localStorage.getItem(THEME_KEY);
  return v === "dark" || v === "light" || v === "system" ? v : "system";
};

const passwordStrength = (pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string } => {
  if (!pw) return { score: 0, label: "—" };
  let s = 0;
  if (pw.length >= 10) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const labels = ["Muy débil", "Débil", "Aceptable", "Buena", "Fuerte"] as const;
  return { score: s as 0 | 1 | 2 | 3 | 4, label: labels[s] };
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
  const { user, logout, has, refreshSelf, bumpAvatarVersion } = useAuth();

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
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwSaving, setPwSaving] = useState(false);

  const [theme, setTheme] = useState<Theme>(() => readTheme());
  const [showUploader, setShowUploader] = useState(false);
  const [avatarDeleting, setAvatarDeleting] = useState(false);

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
        const updated = await updateMe(req);
        setTarget(updated);
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

  const handleThemeChange = async (next: Theme) => {
    // Optimistic apply — fall back to localStorage if the BE write fails.
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
    applyThemeAttribute(next);
    try {
      await updatePreferences({ theme: next });
    } catch {
      // BE write failed; local state still reflects the choice.
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);
    if (!newPassword || !currentPassword) {
      setPwError("Completa la contraseña actual y la nueva");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("La confirmación no coincide");
      return;
    }
    if (newPassword.length < 10) {
      setPwError("La nueva contraseña debe tener al menos 10 caracteres");
      return;
    }
    setPwSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwSuccess("Contraseña actualizada");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al cambiar la contraseña";
      const code = msg.match(/HTTP (\d+)/)?.[1];
      if (code === "429") setPwError("Demasiados intentos; espera una hora");
      else if (code === "400") setPwError("La contraseña actual no coincide");
      else setPwError(msg);
    } finally {
      setPwSaving(false);
    }
  };

  const handleAvatarUploaded = async () => {
    setShowUploader(false);
    bumpAvatarVersion();
    await refreshSelf();
    setSuccess("Avatar actualizado");
  };

  const handleAvatarDelete = async () => {
    if (!window.confirm("¿Eliminar tu foto de perfil?")) return;
    setAvatarDeleting(true);
    setError(null);
    try {
      await deleteAvatar();
      bumpAvatarVersion();
      setSuccess("Avatar eliminado");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setAvatarDeleting(false);
    }
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
            className="min-h-[36px] -mr-2 px-2 text-terracotta text-xs font-bold uppercase tracking-wider hover:underline"
          >
            Cerrar sesión
          </button>
        )}
      </div>

      <section className="bg-surface border border-slate-200 rounded-xl shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-5 mb-8">
          <div className="relative">
            <UserAvatar
              userId={target.id}
              name={target.name}
              email={target.email}
              version={user?.avatarVersion ?? 0}
              className="w-20 h-20 rounded-full"
              fallbackClassName="bg-gold/20 border-2 border-gold/40 text-marine font-serif text-2xl"
            />
            {!isAdminEdit && (
              <button
                type="button"
                onClick={() => setShowUploader(true)}
                title="Cambiar foto"
                aria-label="Cambiar foto"
                className="absolute bottom-0 right-0 w-7 h-7 bg-marine text-white rounded-full flex items-center justify-center shadow-md hover:bg-marine-soft"
              >
                {CameraIcon}
              </button>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-serif text-marine text-xl truncate">{target.name ?? "Sin nombre"}</p>
            <p className="text-xs text-slate-500">{target.role}</p>
            {memberDate && (
              <p className="text-[11px] text-slate-400 mt-1">Miembro desde {memberDate}</p>
            )}
            {!isAdminEdit && (
              <button
                type="button"
                onClick={handleAvatarDelete}
                disabled={avatarDeleting}
                className="mt-1 text-[11px] text-slate-500 hover:text-terracotta disabled:opacity-50"
              >
                {avatarDeleting ? "Eliminando…" : "Eliminar foto"}
              </button>
            )}
          </div>
        </div>

        {showUploader && !isAdminEdit && (
          <div className="mb-8 p-4 rounded-lg border border-slate-200 bg-cream/40">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">
              Nueva foto de perfil
            </p>
            <AvatarUploader
              onUploaded={handleAvatarUploaded}
              onCancel={() => setShowUploader(false)}
            />
          </div>
        )}

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
          ) : null}

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

      {!isAdminEdit && (
        <section className="bg-surface border border-slate-200 rounded-xl shadow-sm p-6 sm:p-8">
          <h3 className="font-serif text-marine text-lg mb-4">Cambiar contraseña</h3>
          <form className="space-y-4" onSubmit={handlePasswordSubmit}>
            <div>
              <label className={labelClass} htmlFor="pw-current">Contraseña actual</label>
              <input
                id="pw-current"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClass}
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="pw-new">Nueva contraseña</label>
              <input
                id="pw-new"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
                autoComplete="new-password"
              />
              {newPassword && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-200 rounded overflow-hidden">
                    <div
                      className={
                        passwordStrength(newPassword).score >= 3
                          ? "h-full bg-emerald-500"
                          : passwordStrength(newPassword).score === 2
                            ? "h-full bg-gold"
                            : "h-full bg-terracotta"
                      }
                      style={{ width: `${(passwordStrength(newPassword).score / 4) * 100}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 w-20 text-right">
                    {passwordStrength(newPassword).label}
                  </span>
                </div>
              )}
            </div>
            <div>
              <label className={labelClass} htmlFor="pw-confirm">Confirmar nueva</label>
              <input
                id="pw-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                autoComplete="new-password"
              />
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-[11px] text-terracotta mt-1">No coincide con la nueva contraseña.</p>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Mínimo 10 caracteres. Mezcla mayúsculas, minúsculas, números y símbolos.
            </p>
            {pwError && <p role="alert" className="text-sm text-terracotta">{pwError}</p>}
            {pwSuccess && <p role="status" className="text-sm text-emerald-700">{pwSuccess}</p>}
            <div className="pt-2 flex justify-end">
              <Button type="submit" disabled={pwSaving}>
                {pwSaving ? "Cambiando…" : "Cambiar contraseña"}
              </Button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
};

export default UserSettings;
