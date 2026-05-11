import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './modificarHuesped.css';

const ModificarHuesped: React.FC = () => {
  const [codigo, setCodigo] = useState('');
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    rutOPasaporte: '',
    email: '',
    telefono: '',
    otros: ''
  });
  const navigate = useNavigate();

  const handleCodigoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^[a-zA-Z0-9]*$/.test(value) && value.length <= 12) {
      setCodigo(value);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBuscar = () => {
    // Lógica para buscar el huésped por código
    console.log('Buscar huésped con código:', codigo);
    // Aquí podrías cargar los datos del huésped en formData
  };

  const handleModificar = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Modificar huésped:', { codigo, ...formData });
    // Lógica para modificar
  };

  const handleVolver = () => {
    navigate('/dashboard');
  };

  return (
    <div className="modificar-container">
      <h2>Modificar Huésped</h2>
      <div className="buscar-section">
        <label htmlFor="codigo">Código (12 caracteres):</label>
        <input
          type="text"
          id="codigo"
          value={codigo}
          onChange={handleCodigoChange}
          maxLength={12}
          placeholder="Ingrese el código"
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
          <label htmlFor="rutOPasaporte">RUT o Pasaporte:</label>
          <input
            type="text"
            id="rutOPasaporte"
            name="rutOPasaporte"
            value={formData.rutOPasaporte}
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