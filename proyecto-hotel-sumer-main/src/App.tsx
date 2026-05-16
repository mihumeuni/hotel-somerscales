import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import CrearUser from "./pages/crearUser";
import CrearHuesped from "./pages/crearHuesped";
import ConsultaHuesped from "./pages/consultaHuesped";
import ModificarHuesped from "./pages/modificarHuesped";
import EliminarHuesped from "./pages/eliminarHuesped";
import SignupFinish from "./pages/signupFinish";
import GastosReserva from "./pages/gastosReserva";
import GuestDetail from "./pages/guestDetail";
import ProtectedRoute from "./routes/Protected-route";
import { AppShell, ComingSoon } from "./components/ui";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup-finish" element={<SignupFinish />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<Dashboard />} />

            <Route
              path="/calendario"
              element={<ComingSoon name="Calendario" taskRef="task025" />}
            />
            <Route
              path="/admin/roles"
              element={
                <ComingSoon name="Roles & Permisos" taskRef="task028" />
              }
            />
            <Route
              path="/admin/perfiles"
              element={<ComingSoon name="Perfiles" taskRef="task022" />}
            />
            <Route
              path="/fichas"
              element={<ComingSoon name="Fichas de turno" taskRef="task026" />}
            />
            <Route
              path="/me"
              element={<ComingSoon name="Mi perfil" taskRef="task023" />}
            />
            <Route
              path="/settings/global"
              element={
                <ComingSoon name="Settings globales" taskRef="task027" />
              }
            />

            <Route path="/crear-user" element={<CrearUser />} />
            <Route path="/crear-huesped" element={<CrearHuesped />} />
            <Route path="/consulta-huesped" element={<ConsultaHuesped />} />
            <Route path="/modificar-huesped" element={<ModificarHuesped />} />
            <Route path="/eliminar-huesped" element={<EliminarHuesped />} />
            <Route
              path="/reservas/:reservaId/gastos"
              element={<GastosReserva />}
            />
            <Route path="/huespedes/:id" element={<GuestDetail />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
