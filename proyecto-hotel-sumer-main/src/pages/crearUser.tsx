import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './crearUser.css';
import { api } from '../lib/apiClient';
import type { Rol } from '../types/auth';

type FormState = {
  nombre: string;
  telefono: string;
  email: string;
  role: Rol;
};

const initialState: FormState = {
  nombre: '',
  telefono: '',
  email: '',
  role: 'RECEPCIONISTA',
};

const CrearUser: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessEmail(null);

    try {
      const body = {
        nombre: formData.nombre.trim(),
        telefono: formData.telefono.trim() || null,
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
      };
      await api.post<{ email: string }>('/api/users/invite', body);
      setSuccessEmail(body.email);
      setFormData(initialState);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('409')) {
        setErrorMsg('Ya existe un usuario o una invitación activa con ese correo.');
      } else if (msg.includes('403')) {
        setErrorMsg('No tienes permiso para invitar usuarios.');
      } else if (msg.includes('400')) {
        setErrorMsg('Datos inválidos. Revisa los campos.');
      } else {
        setErrorMsg('No se pudo enviar la invitación. Intenta nuevamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Invitar Usuario</h2>
      <p className="form-hint">
        Se enviará un correo con un enlace para que la persona elija su contraseña.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="nombre">Nombre Completo:</label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            maxLength={200}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="telefono">Teléfono:</label>
          <input
            type="tel"
            id="telefono"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            maxLength={40}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Correo electrónico:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            maxLength={200}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="role">Rol:</label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
            className="form-input"
          >
            <option value="ADMIN">Administrador</option>
            <option value="RECEPCIONISTA">Recepcionista</option>
            <option value="ASISTENTE">Asistente</option>
          </select>
        </div>

        {errorMsg && <p className="form-error">{errorMsg}</p>}
        {successEmail && (
          <p className="form-success">Invitación enviada a {successEmail}.</p>
        )}

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
          {submitting ? 'Enviando…' : 'Enviar invitación'}
        </button>
      </form>

      <button className="back-button" onClick={() => navigate('/dashboard')}>
        Volver
      </button>
    </div>
  );
};

export default CrearUser;
