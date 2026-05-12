import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './modificarHuesped.css';
import type { TipoDocumento } from '../types/huesped';

const ModificarHuesped: React.FC = () => {
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('DNI');
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    email: '',
    telefono: '',
    otros: ''
  });
  const navigate = useNavigate();

  const handleNumeroDocumentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNumeroDocumento(e.target.value);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBuscar = () => {
    // TODO: wire to backend GET /api/guests by numeroDocumento (post-MVP task)
    console.log('Buscar huésped con numeroDocumento:', numeroDocumento);
  };

  const handleModificar = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire to backend PUT /api/guests/{id} (post-MVP task)
    console.log('Modificar huésped:', { tipoDocumento, numeroDocumento, ...formData });
  };

  const handleVolver = () => {
    navigate('/dashboard');
  };

  return (
    <div className="modificar-container">
      <h2>Modificar Huésped</h2>

      <div className="buscar-section">
        <label htmlFor="tipoDocumentoBuscar">Tipo de Documento:</label>
        <select
          id="tipoDocumentoBuscar"
          value={tipoDocumento}
          onChange={(e) => setTipoDocumento(e.target.value as TipoDocumento)}
          className="form-input"
        >
          <option value="DNI">DNI</option>
          <option value="RUT">RUT</option>
          <option value="PASAPORTE">Pasaporte</option>
        </select>

        <label htmlFor="numeroDocumento">Número de Documento:</label>
        <input
          type="text"
          id="numeroDocumento"
          value={numeroDocumento}
          onChange={handleNumeroDocumentoChange}
          placeholder="Ingrese el número de documento"
          className="codigo-input"
        />
        <button onClick={handleBuscar} className="buscar-btn">Buscar</button>
      </div>

      <form onSubmit={handleModificar} className="form-section">
        <div className="form-group">
          <label htmlFor="nombreCompleto">Nombre Completo:</label>
          <input
            type="text"
            id="nombreCompleto"
            name="nombreCompleto"
            value={formData.nombreCompleto}
            onChange={handleFormChange}
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
            onChange={handleFormChange}
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
            onChange={handleFormChange}
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
            onChange={handleFormChange}
            rows={4}
            className="form-textarea"
          />
        </div>
        <button type="submit" className="modificar-btn">Modificar Huésped</button>
      </form>

      <button onClick={handleVolver} className="volver-btn">Volver al Dashboard</button>
    </div>
  );
};

export default ModificarHuesped;
