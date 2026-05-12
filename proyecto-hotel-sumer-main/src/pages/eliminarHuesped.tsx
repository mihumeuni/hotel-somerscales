import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './eliminarHuesped.css';
import type { TipoDocumento } from '../types/huesped';

const EliminarHuesped: React.FC = () => {
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('DNI');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNumeroDocumento(e.target.value);
  };

  const handleEliminar = () => {
    if (!numeroDocumento) {
      alert('Por favor, ingrese un número de documento.');
      return;
    }
    // TODO: wire to backend DELETE /api/guests/{id} (post-MVP task — endpoint not yet exposed)
    console.log('Eliminar huésped:', { tipoDocumento, numeroDocumento });
    alert('Huésped eliminado (simulado)');
  };

  const handleVolver = () => {
    navigate('/dashboard');
  };

  return (
    <div className="eliminar-container">
      <h2>Eliminar Huésped</h2>
      <div className="input-group">
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
          onChange={handleChange}
          placeholder="Ingrese el número de documento"
          className="codigo-input"
        />
      </div>
      <button onClick={handleEliminar} className="eliminar-btn">
        Eliminar Huésped
      </button>
      <button onClick={handleVolver} className="volver-btn">
        Volver al Dashboard
      </button>
    </div>
  );
};

export default EliminarHuesped;
