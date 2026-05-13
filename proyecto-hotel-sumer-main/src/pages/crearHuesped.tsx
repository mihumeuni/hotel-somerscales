import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { TipoDocumento } from "../types/huesped";
import { AppShell, Button, Card, Input, fieldBaseClasses } from "../components/ui";

const CrearHuesped: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombreCompleto: "",
    tipoDocumento: "DNI" as TipoDocumento,
    numeroDocumento: "",
    email: "",
    telefono: "",
    otros: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire to backend POST /api/guests via apiClient (post-MVP task)
    console.log("Datos del formulario:", formData);
  };

  return (
    <AppShell
      title="Crear huésped"
      description="Registra manualmente un nuevo huésped en el sistema."
      actions={
        <Button variant="secondary" onClick={() => navigate("/dashboard")}>
          Volver
        </Button>
      }
    >
      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Nombre completo"
            id="nombreCompleto"
            name="nombreCompleto"
            value={formData.nombreCompleto}
            onChange={handleChange}
            required
          />

          <div className="flex flex-col gap-1">
            <label htmlFor="tipoDocumento" className="text-sm font-medium text-slate-700">
              Tipo de documento
            </label>
            <select
              id="tipoDocumento"
              name="tipoDocumento"
              value={formData.tipoDocumento}
              onChange={handleChange}
              required
              className={fieldBaseClasses}
            >
              <option value="DNI">DNI</option>
              <option value="RUT">RUT</option>
              <option value="PASAPORTE">Pasaporte</option>
            </select>
          </div>

          <Input
            label="Número de documento"
            id="numeroDocumento"
            name="numeroDocumento"
            value={formData.numeroDocumento}
            onChange={handleChange}
            required
          />

          <Input
            label="Email"
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <Input
            label="Teléfono"
            id="telefono"
            name="telefono"
            type="tel"
            value={formData.telefono}
            onChange={handleChange}
            required
          />

          <div className="flex flex-col gap-1">
            <label htmlFor="otros" className="text-sm font-medium text-slate-700">
              Otros
            </label>
            <textarea
              id="otros"
              name="otros"
              value={formData.otros}
              onChange={handleChange}
              rows={4}
              className={fieldBaseClasses}
            />
          </div>

          <Button type="submit" className="w-full md:w-auto md:self-start">
            Crear huésped
          </Button>
        </form>
      </Card>
    </AppShell>
  );
};

export default CrearHuesped;
