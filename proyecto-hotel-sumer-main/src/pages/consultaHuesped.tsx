import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './consultaHuesped.css';

const ConsultaHuesped: React.FC = () => {
  const [codigo, setCodigo] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Permitir solo letras y números, máximo 12 caracteres
    if (/^[a-zA-Z0-9]*$/.test(value) && value.length <= 12) {
      setCodigo(value);
    }
  };

  const handleVolver = () => {
    navigate('/dashboard');
  };

  return (
    <div className="consulta-container">
      <h2>Consultar Huésped</h2>
      <div className="input-group">
        <label htmlFor="codigo">Código (12 caracteres, letras y números):</label>
        <input
          type="text"
          id="codigo"
          value={codigo}
          onChange={handleChange}
          maxLength={12}
          placeholder="Ingrese el código"
          className="codigo-input"
        />
      </div>
      <button onClick={handleVolver} className="volver-btn">
        Volver al Dashboard
      </button>
    </div>
  );
};

export default ConsultaHuesped;