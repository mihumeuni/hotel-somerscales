import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './consultaHuesped.css';
import { api } from '../lib/apiClient';
import type { Huesped } from '../types/huesped';

const ConsultaHuesped: React.FC = () => {
  const [id, setId] = useState('');
  const [huesped, setHuesped] = useState<Huesped | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setId(value);
    }
  };

  const handleBuscar = async () => {
    if (!id) {
      setError('Ingrese un ID');
      return;
    }
    setError(null);
    setHuesped(null);
    setLoading(true);
    try {
      const data = await api.get<Huesped>(`/api/guests/${id}`);
      setHuesped(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al buscar');
    } finally {
      setLoading(false);
    }
  };

  const handleVolver = () => {
    navigate('/dashboard');
  };

  return (
    <div className="consulta-container">
      <h2>Consultar Huésped</h2>
      <div className="input-group">
        <label htmlFor="id">ID del huésped:</label>
        <input
          type="text"
          id="id"
          value={id}
          onChange={handleChange}
          placeholder="Ingrese el ID numérico"
          className="codigo-input"
          inputMode="numeric"
        />
        <button onClick={handleBuscar} disabled={loading} className="buscar-btn">
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {error && <p className="error-msg">{error}</p>}

      {huesped && (
        <div className="huesped-card">
          <p><strong>ID:</strong> {huesped.id}</p>
          <p><strong>Nombre Completo:</strong> {huesped.nombreCompleto}</p>
          <p><strong>Tipo Documento:</strong> {huesped.tipoDocumento}</p>
          <p><strong>Número Documento:</strong> {huesped.numeroDocumento}</p>
          <p><strong>Email:</strong> {huesped.email ?? '—'}</p>
          <p><strong>Teléfono:</strong> {huesped.telefono ?? '—'}</p>
          <p><strong>Otros:</strong> {huesped.datoExtra ?? '—'}</p>
        </div>
      )}

      <button onClick={handleVolver} className="volver-btn">
        Volver al Dashboard
      </button>
    </div>
  );
};

export default ConsultaHuesped;
