import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button, Card, Input } from "../components/ui";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Debes completar todos los campos.");
      return;
    }

    setSubmitting(true);
    const success = await login(email, password);
    setSubmitting(false);

    if (success) navigate("/dashboard");
    else setError("Credenciales incorrectas.");
  };

  return (
    <div className="flex min-h-svh items-center justify-center bg-gradient-to-br from-brand-50 via-white to-slate-100 px-4 py-10">
      <Card className="w-full max-w-md">
        <div className="flex flex-col items-center gap-2 text-center">
          <img
            src="/logo.svg"
            alt=""
            className="h-12 w-12"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Hotel Somerscales
          </h1>
          <p className="text-sm text-slate-600">Acceso al panel administrativo</p>
        </div>

        <form onSubmit={handleLogin} className="mt-6 flex flex-col gap-4">
          <Input
            label="Usuario"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Ingresando…" : "Ingresar"}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default Login;
