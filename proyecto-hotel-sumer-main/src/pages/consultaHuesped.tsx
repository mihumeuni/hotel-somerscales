import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/apiClient";
import type { Huesped } from "../types/huesped";
import { AppShell, Button, Card, Input } from "../components/ui";

const ConsultaHuesped: React.FC = () => {
  const [id, setId] = useState("");
  const [huesped, setHuesped] = useState<Huesped | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) setId(value);
  };

  const handleBuscar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) {
      setError("Ingrese un ID");
      return;
    }
    setError(null);
    setHuesped(null);
    setLoading(true);
    try {
      const data = await api.get<Huesped>(`/api/guests/${id}`);
      setHuesped(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al buscar");
    } finally {
      setLoading(false);
    }
  };

  const goToDetail = (guestId: number) => navigate(`/huespedes/${guestId}`);

  return (
    <AppShell
      title="Consultar huésped"
      description="Busca un huésped por su ID interno."
      actions={
        <Button variant="secondary" onClick={() => navigate("/dashboard")}>
          Volver
        </Button>
      }
    >
      <Card>
        <form onSubmit={handleBuscar} className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <Input
              label="ID del huésped"
              id="id"
              value={id}
              onChange={handleChange}
              placeholder="Ingrese el ID numérico"
              inputMode="numeric"
              helper="Solo dígitos."
            />
          </div>
          <Button type="submit" disabled={loading} className="md:self-end">
            {loading ? "Buscando…" : "Buscar"}
          </Button>
        </form>

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}
      </Card>

      {huesped && (
        <Card
          className="mt-4"
          title="Ficha del huésped"
        >
          <button
            type="button"
            onClick={() => goToDetail(huesped.id)}
            className="-m-2 block w-[calc(100%+1rem)] rounded-md p-2 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label={`Ver historial de ${huesped.nombreCompleto}`}
          >
            <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="font-medium text-slate-700">ID</dt>
              <dd className="text-slate-900">{huesped.id}</dd>
              <dt className="font-medium text-slate-700">Nombre completo</dt>
              <dd className="text-slate-900">{huesped.nombreCompleto}</dd>
              <dt className="font-medium text-slate-700">Tipo documento</dt>
              <dd className="text-slate-900">{huesped.tipoDocumento}</dd>
              <dt className="font-medium text-slate-700">Número documento</dt>
              <dd className="text-slate-900">{huesped.numeroDocumento}</dd>
              <dt className="font-medium text-slate-700">Email</dt>
              <dd className="text-slate-900">{huesped.email ?? "—"}</dd>
              <dt className="font-medium text-slate-700">Teléfono</dt>
              <dd className="text-slate-900">{huesped.telefono ?? "—"}</dd>
              <dt className="font-medium text-slate-700">Otros</dt>
              <dd className="text-slate-900">{huesped.datoExtra ?? "—"}</dd>
            </dl>
          </button>
          <div className="mt-3 flex justify-end">
            <Button onClick={() => goToDetail(huesped.id)}>
              Ver historial
            </Button>
          </div>
        </Card>
      )}
    </AppShell>
  );
};

export default ConsultaHuesped;
