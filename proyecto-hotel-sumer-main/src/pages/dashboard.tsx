import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AppShell, Button, Card } from "../components/ui";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAdmin = user?.role === "ADMIN";

  return (
    <AppShell
      title={`Bienvenido${user?.email ? `, ${user.email}` : ""}`}
      description={user?.role ? `Sesión iniciada como ${user.role}` : undefined}
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card
          title="Consultar huésped"
          description="Busca un huésped por su ID interno para ver su ficha."
        >
          <Button onClick={() => navigate("/consulta-huesped")} className="w-full md:w-auto">
            Ir a consulta
          </Button>
        </Card>

        {isAdmin && (
          <Card
            title="Crear huésped"
            description="Registra manualmente un nuevo huésped en el sistema."
          >
            <Button onClick={() => navigate("/crear-huesped")} className="w-full md:w-auto">
              Crear huésped
            </Button>
          </Card>
        )}

        {isAdmin && (
          <Card
            title="Modificar huésped"
            description="Edita los datos de un huésped existente."
          >
            <Button
              variant="secondary"
              onClick={() => navigate("/modificar-huesped")}
              className="w-full md:w-auto"
            >
              Modificar
            </Button>
          </Card>
        )}

        {isAdmin && (
          <Card
            title="Eliminar huésped"
            description="Da de baja un huésped por número de documento."
          >
            <Button
              variant="danger"
              onClick={() => navigate("/eliminar-huesped")}
              className="w-full md:w-auto"
            >
              Eliminar
            </Button>
          </Card>
        )}

        {isAdmin && (
          <Card
            title="Invitar usuario"
            description="Envía una invitación por correo para crear una cuenta de staff."
          >
            <Button onClick={() => navigate("/crear-user")} className="w-full md:w-auto">
              Invitar
            </Button>
          </Card>
        )}

        <Card
          title="Resumen"
          description="Información clave sobre tu cuenta y actividad reciente."
        >
          <p className="text-sm text-slate-600">
            Sección reservada para indicadores. Próximamente: ocupación, top huéspedes y
            sentimiento de reseñas.
          </p>
        </Card>
      </div>
    </AppShell>
  );
};

export default Dashboard;
