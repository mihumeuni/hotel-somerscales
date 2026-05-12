import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './signupFinish.css';
import { api } from '../lib/apiClient';

const SignupFinish: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams]);

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const tokenMissing = !token;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < 8) {
      setErrorMsg('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== passwordConfirm) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post<void>(
        '/api/users/signup-finish',
        { token, password },
        { auth: false }
      );
      setSuccess(true);
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('410')) {
        setErrorMsg('Esta invitación ya fue usada o ha expirado.');
      } else if (msg.includes('400')) {
        setErrorMsg('Token inválido.');
      } else if (msg.includes('409')) {
        setErrorMsg('Ya existe una cuenta con ese correo.');
      } else {
        setErrorMsg('No se pudo completar el registro. Intenta más tarde.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Activar cuenta</h2>

      {tokenMissing ? (
        <p className="form-error">
          Falta el token de invitación en el enlace. Solicita una nueva invitación al administrador.
        </p>
      ) : success ? (
        <p className="form-success">
          ¡Cuenta activada! Redirigiendo al inicio de sesión…
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          <p className="form-hint">Elige una contraseña para iniciar sesión.</p>

          <div className="form-group">
            <label htmlFor="password">Contraseña:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              maxLength={100}
              className="form-input"
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="passwordConfirm">Confirmar contraseña:</label>
            <input
              type="password"
              id="passwordConfirm"
              name="passwordConfirm"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              minLength={8}
              maxLength={100}
              className="form-input"
              autoComplete="new-password"
            />
          </div>

          {errorMsg && <p className="form-error">{errorMsg}</p>}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: submitting ? '#6c757d' : '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Activando…' : 'Activar cuenta'}
          </button>
        </form>
      )}
    </div>
  );
};

export default SignupFinish;
