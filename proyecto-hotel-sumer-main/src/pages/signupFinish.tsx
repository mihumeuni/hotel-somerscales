import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/apiClient";
import { LogoMark } from "../components/ui";

const SignupFinish: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const tokenMissing = !token;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < 8) {
      setErrorMsg("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== passwordConfirm) {
      setErrorMsg("Las contraseñas no coinciden.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post<void>(
        "/api/users/signup-finish",
        { token, password },
        { auth: false },
      );
      setSuccess(true);
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("410")) {
        setErrorMsg("Esta invitación ya fue usada o ha expirado.");
      } else if (msg.includes("400")) {
        setErrorMsg("Token inválido.");
      } else if (msg.includes("409")) {
        setErrorMsg("Ya existe una cuenta con ese correo.");
      } else {
        setErrorMsg("No se pudo completar el registro. Intenta más tarde.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-svh items-center justify-center bg-cream px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-surface p-8 shadow-xl sm:p-10">
        <div className="mb-6 flex flex-col items-center">
          <LogoMark size={80} className="mb-5 shadow-md" />
          <h1 className="font-serif text-2xl tracking-wide text-marine">
            Configura tu contraseña
          </h1>
          <p className="mt-2 text-center text-xs uppercase tracking-[0.25em] text-marine/60">
            Te invitaron a Somerscales · Gestión Interna
          </p>
        </div>

        {tokenMissing ? (
          <p role="alert" className="text-center text-sm text-red-600">
            Falta el token de invitación en el enlace. Solicita una nueva invitación al
            administrador.
          </p>
        ) : success ? (
          <p role="status" className="text-center text-sm text-emerald-700">
            ¡Cuenta creada! Redirigiendo al inicio de sesión…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="signup-password"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600"
              >
                Nueva contraseña
              </label>
              <input
                id="signup-password"
                type="password"
                required
                minLength={8}
                maxLength={100}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-200 bg-cream px-4 py-3 text-sm text-ink transition focus:border-marine focus:outline-none focus:ring-1 focus:ring-marine"
              />
            </div>

            <div>
              <label
                htmlFor="signup-password-confirm"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600"
              >
                Confirmar contraseña
              </label>
              <input
                id="signup-password-confirm"
                type="password"
                required
                minLength={8}
                maxLength={100}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-200 bg-cream px-4 py-3 text-sm text-ink transition focus:border-marine focus:outline-none focus:ring-1 focus:ring-marine"
              />
            </div>

            {errorMsg && (
              <p role="alert" className="text-sm text-red-600">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-lg bg-marine py-3 font-semibold text-white shadow-md transition duration-200 hover:bg-marine-soft hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Creando cuenta…" : "Crear cuenta"}
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-[11px] text-slate-400">
          Hotel Casa Somerscales · Valparaíso
        </p>
      </div>
    </div>
  );
};

export default SignupFinish;
