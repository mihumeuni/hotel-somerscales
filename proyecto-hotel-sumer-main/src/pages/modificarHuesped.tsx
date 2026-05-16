import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { TipoDocumento } from "../types/huesped";
import { Button, Card, Input, PageHeader, fieldBaseClasses } from "../components/ui";

const ModificarHuesped: React.FC = () => {
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>("DNI");
  const [formData, setFormData] = useState({
    nombreCompleto: "",
    email: "",
    telefono: "",
    otros: "",
  });
  const navigate = useNavigate();

  const handleNumeroDocumentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNumeroDocumento(e.target.value);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire to backend GET /api/guests by numeroDocumento (post-MVP task)
    console.log("Buscar huésped con numeroDocumento:", numeroDocumento);
  };

  const handleModificar = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire to backend PUT /api/guests/{id} (post-MVP task)
    console.log("Modificar huésped:", { tipoDocumento, numeroDocumento, ...formData });
  };

  return (
    <>
      <PageHeader
        title="Modificar huésped"
        description="Busca por documento y edita los datos."
        actions={
          <Button variant="secondary" onClick={() => navigate("/dashboard")}>
            Volver
          </Button>
        }
      />
      <Card title="Buscar huésped">
        <form onSubmit={handleBuscar} className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex flex-col gap-1 md:w-48">
            <label htmlFor="tipoDocumentoBuscar" className="text-sm font-medium text-slate-700">
              Tipo de documento
            </label>
            <select
              id="tipoDocumentoBuscar"
              value={tipoDocumento}
              onChange={(e) => setTipoDocumento(e.target.value as TipoDocumento)}
              className={fieldBaseClasses}
            >
              <option value="DNI">DNI</option>
              <option value="RUT">RUT</option>
              <option value="PASAPORTE">Pasaporte</option>
            </select>
          </div>

          <div className="flex-1">
            <Input
              label="Número de documento"
              id="numeroDocumento"
              value={numeroDocumento}
              onChange={handleNumeroDocumentoChange}
              placeholder="Ingrese el número de documento"
            />
          </div>

          <Button type="submit" className="md:self-end">
            Buscar
          </Button>
        </form>
      </Card>

      <Card className="mt-4" title="Datos del huésped">
        <form onSubmit={handleModificar} className="flex flex-col gap-4">
          <Input
            label="Nombre completo"
            id="nombreCompleto"
            name="nombreCompleto"
            value={formData.nombreCompleto}
            onChange={handleFormChange}
            required
          />
          <Input
            label="Email"
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleFormChange}
            required
          />
          <Input
            label="Teléfono"
            id="telefono"
            name="telefono"
            type="tel"
            value={formData.telefono}
            onChange={handleFormChange}
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
              onChange={handleFormChange}
              rows={4}
              className={fieldBaseClasses}
            />
          </div>

          <Button type="submit" className="w-full md:w-auto md:self-start">
            Modificar huésped
          </Button>
        </form>
      </Card>
    </>
  );
};

export default ModificarHuesped;
