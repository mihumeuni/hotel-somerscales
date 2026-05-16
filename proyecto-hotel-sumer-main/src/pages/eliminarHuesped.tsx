import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { TipoDocumento } from "../types/huesped";
import { Button, Card, Input, Modal, PageHeader, fieldBaseClasses } from "../components/ui";

const EliminarHuesped: React.FC = () => {
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>("DNI");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNumeroDocumento(e.target.value);
  };

  const handleEliminarClick = () => {
    setError(null);
    setInfo(null);
    if (!numeroDocumento) {
      setError("Por favor, ingrese un número de documento.");
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    // TODO: wire to backend DELETE /api/guests/{id} (post-MVP — endpoint not yet exposed)
    console.log("Eliminar huésped:", { tipoDocumento, numeroDocumento });
    setConfirmOpen(false);
    setInfo("Huésped eliminado (simulado).");
    setNumeroDocumento("");
  };

  return (
    <>
      <PageHeader
        title="Eliminar huésped"
        description="Localiza por documento y confirma la baja."
        actions={
          <Button variant="secondary" onClick={() => navigate("/dashboard")}>
            Volver
          </Button>
        }
      />
      <Card>
        <div className="flex flex-col gap-4">
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

          <Input
            label="Número de documento"
            id="numeroDocumento"
            value={numeroDocumento}
            onChange={handleChange}
            placeholder="Ingrese el número de documento"
          />

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          {info && (
            <p role="status" className="text-sm text-emerald-700">
              {info}
            </p>
          )}

          <Button
            variant="danger"
            onClick={handleEliminarClick}
            className="w-full md:w-auto md:self-start"
          >
            Eliminar huésped
          </Button>
        </div>
      </Card>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirmar eliminación"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleConfirm}>
              Sí, eliminar
            </Button>
          </>
        }
      >
        <p>
          Esta acción eliminará al huésped con {tipoDocumento}{" "}
          <span className="font-medium">{numeroDocumento}</span>. ¿Deseas continuar?
        </p>
      </Modal>
    </>
  );
};

export default EliminarHuesped;
