import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/apiClient";
import { Button, Card, Input } from "../components/ui";

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
    <div className="flex min-h-svh items-center justify-center bg-gradient-to-br from-cream via-surface to-cream px-4 py-10">
      <Card className="w-full max-w-md" title="Activar cuenta">
        {tokenMissing ? (
          <p role="alert" className="text-sm text-red-600">
            Falta el token de invitación en el enlace. Solicita una nueva invitación al
            administrador.
          </p>
        ) : success ? (
          <p role="status" className="text-sm text-emerald-700">
            ¡Cuenta activada! Redirigiendo al inicio de sesión…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <p className="text-sm text-slate-600">
              Elige una contraseña para iniciar sesión.
            </p>

            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              maxLength={100}
              autoComplete="new-password"
            />

            <Input
              label="Confirmar contraseña"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              minLength={8}
              maxLength={100}
              autoComplete="new-password"
            />

            {errorMsg && (
              <p role="alert" className="text-sm text-red-600">
                {errorMsg}
              </p>
            )}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Activando…" : "Activar cuenta"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};

export default SignupFinish;
