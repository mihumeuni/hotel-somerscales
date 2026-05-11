import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './crearUser.css';

const CrearUser: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    rutOPasaporte: '',
    email: '',
    telefono: '',
    otros: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí puedes manejar el envío del formulario, por ejemplo, enviar a una API
    console.log('Datos del formulario:', formData);
    // Resetear el formulario o mostrar un mensaje de éxito
  };

  return (
    <div className="form-container">
      <h2>Crear Usuario</h2>
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
          <label htmlFor="rutOPasaporte">RUT o Pasaporte:</label>
          <input
            type="text"
            id="rutOPasaporte"
            name="rutOPasaporte"
            value={formData.rutOPasaporte}
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
        <button type="submit" style={{
          width: '100%',
          padding: '10px',
          backgroundColor: '#007bff',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          Crear Usuario
        </button>\r\n      </form>\r\n      <button className="back-button" onClick={() => navigate('/dashboard')}>Volver</button>\r\n    </div>
  );
};

export default CrearUser;











