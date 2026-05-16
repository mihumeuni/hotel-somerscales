import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/apiClient";
import type { Rol } from "../types/auth";
import { Button, Card, Input, PageHeader, fieldBaseClasses } from "../components/ui";

type FormState = {
  nombre: string;
  telefono: string;
  email: string;
  role: Rol;
};

const initialState: FormState = {
  nombre: "",
  telefono: "",
  email: "",
  role: "RECEPCIONISTA",
};

const CrearUser: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessEmail(null);

    try {
      const body = {
        nombre: formData.nombre.trim(),
        telefono: formData.telefono.trim() || null,
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
      };
      await api.post<{ email: string }>("/api/users/invite", body);
      setSuccessEmail(body.email);
      setFormData(initialState);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("409")) {
        setErrorMsg("Ya existe un usuario o una invitación activa con ese correo.");
      } else if (msg.includes("403")) {
        setErrorMsg("No tienes permiso para invitar usuarios.");
      } else if (msg.includes("400")) {
        setErrorMsg("Datos inválidos. Revisa los campos.");
      } else {
        setErrorMsg("No se pudo enviar la invitación. Intenta nuevamente.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Invitar usuario"
        description="Se enviará un correo con un enlace para que la persona elija su contraseña."
        actions={
          <Button variant="secondary" onClick={() => navigate("/dashboard")}>
            Volver
          </Button>
        }
      />
      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Nombre completo"
            id="nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            maxLength={200}
          />

          <Input
            label="Teléfono"
            id="telefono"
            name="telefono"
            type="tel"
            value={formData.telefono}
            onChange={handleChange}
            maxLength={40}
          />

          <Input
            label="Correo electrónico"
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            maxLength={200}
          />

          <div className="flex flex-col gap-1">
            <label htmlFor="role" className="text-sm font-medium text-slate-700">
              Rol
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className={fieldBaseClasses}
            >
              <option value="ADMIN">Administrador</option>
              <option value="RECEPCIONISTA">Recepcionista</option>
              <option value="ASISTENTE">Asistente</option>
            </select>
          </div>

          {errorMsg && (
            <p role="alert" className="text-sm text-red-600">
              {errorMsg}
            </p>
          )}
          {successEmail && (
            <p role="status" className="text-sm text-emerald-700">
              Invitación enviada a {successEmail}.
            </p>
          )}

          <Button type="submit" disabled={submitting} className="w-full md:w-auto md:self-start">
            {submitting ? "Enviando…" : "Enviar invitación"}
          </Button>
        </form>
      </Card>
    </>
  );
};

export default CrearUser;
