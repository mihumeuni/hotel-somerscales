import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "./login.css";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Estados para guardar lo que escribe el usuario
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Debes completar todos los campos");
      return;
    }

    const success = await login(email, password);

    if (success) {
      navigate("/dashboard");
    } else {
      alert("Credenciales incorrectas");
    }
  };

return (
    <div className="login-container">
      <div className="login-box">
        <h2>Login</h2>

        <form onSubmit={handleLogin}>
          <input
            className="login-input"
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="login-input"
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="login-button" type="submit">
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;