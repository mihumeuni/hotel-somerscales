import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogoMark } from "../components/ui";

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
    <div className="flex min-h-svh items-center justify-center bg-cream px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-surface p-8 shadow-xl sm:p-10">
        <div className="mb-8 flex flex-col items-center">
          <LogoMark size={80} className="mb-5 shadow-md" />
          <h1 className="font-serif text-3xl tracking-wide text-marine">Somerscales</h1>
          <p className="mt-1 text-xs uppercase tracking-[0.25em] text-marine/60">
            Gestión Interna
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5" noValidate>
          <div>
            <label
              htmlFor="login-email"
              className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600"
            >
              Email
            </label>
            <input
              id="login-email"
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              placeholder="tu@hotel.cl"
              className="w-full rounded-lg border border-slate-200 bg-cream px-4 py-3 text-sm text-ink transition focus:border-marine focus:outline-none focus:ring-1 focus:ring-marine"
            />
          </div>

          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <label
                htmlFor="login-password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-600"
              >
                Contraseña
              </label>
              <a href="#" className="text-xs text-marine hover:underline">
                Olvidé mi contraseña
              </a>
            </div>
            <input
              id="login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-200 bg-cream px-4 py-3 text-sm text-ink transition focus:border-marine focus:outline-none focus:ring-1 focus:ring-marine"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-lg bg-marine py-3 font-semibold text-white shadow-md transition duration-200 hover:bg-marine-soft hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Ingresando…" : "Ingresar"}
          </button>
        </form>

        <p className="mt-8 text-center text-[11px] text-slate-400">
          Hotel Casa Somerscales · Valparaíso
        </p>
      </div>
    </div>
  );
};

export default Login;
