import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './eliminarHuesped.css';

const EliminarHuesped: React.FC = () => {
  const [codigo, setCodigo] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^[a-zA-Z0-9]*$/.test(value) && value.length <= 12) {
      setCodigo(value);
    }
  };

  const handleEliminar = () => {
    if (codigo.length === 12) {
      console.log('Eliminar huésped con código:', codigo);
      // Lógica para eliminar
      alert('Huésped eliminado (simulado)');
    } else {
      alert('Por favor, ingrese un código válido de 12 caracteres.');
    }
  };

  const handleVolver = () => {
    navigate('/dashboard');
  };

  return (
    <div className="eliminar-container">
      <h2>Eliminar Huésped</h2>
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