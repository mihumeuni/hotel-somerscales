import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './crearHuesped.css';
import type { TipoDocumento } from '../types/huesped';

const CrearHuesped: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    tipoDocumento: 'DNI' as TipoDocumento,
    numeroDocumento: '',
    email: '',
    telefono: '',
    otros: ''
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire to backend POST /api/guests via apiClient (post-MVP task)
    console.log('Datos del formulario:', formData);
  };

  return (
    <div className="form-container">
      <h2>Crear Huésped</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="nombreCompleto">Nombre Completo:</label>
          <input
            type="text"
            id="nombreCompleto"
            name="nombreCompleto"
            value={formData.nombreCompleto}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="tipoDocumento">Tipo de Documento:</label>
          <select
            id="tipoDocumento"
            name="tipoDocumento"
            value={formData.tipoDocumento}
            onChange={handleChange}
            required
            className="form-input"
          >
            <option value="DNI">DNI</option>
            <option value="RUT">RUT</option>
            <option value="PASAPORTE">Pasaporte</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="numeroDocumento">Número de Documento:</label>
          <input
            type="text"
            id="numeroDocumento"
            name="numeroDocumento"
            value={formData.numeroDocumento}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
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
            required
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="otros">Otros:</label>
          <textarea
            id="otros"
            name="otros"
            value={formData.otros}
            onChange={handleChange}
            rows={4}
            className="form-input"
          />
        </div>
        <button
          type="submit"
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Crear Huésped
        </button>
      </form>
      <button className="back-button" onClick={() => navigate('/dashboard')}>
        Volver
      </button>
    </div>
  );
};

export default CrearHuesped;
