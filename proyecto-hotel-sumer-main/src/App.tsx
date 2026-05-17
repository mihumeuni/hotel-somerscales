import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Calendario from "./pages/calendario";
import Profiles from "./pages/profiles";
import SignupFinish from "./pages/signupFinish";
import GastosReserva from "./pages/gastosReserva";
import ClientDetail from "./pages/ClientDetail";
import RolesPermissions from "./pages/rolesPermissions";
import UserSettings from "./pages/UserSettings";
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

            <Route path="/calendario" element={<Calendario />} />
            <Route path="/admin/roles" element={<RolesPermissions />} />
            <Route path="/admin/perfiles" element={<Profiles />} />
            <Route path="/admin/perfiles/:id" element={<UserSettings />} />
            <Route
              path="/fichas"
              element={<ComingSoon name="Fichas de turno" taskRef="task026" />}
            />
            <Route path="/me" element={<UserSettings />} />
            <Route
              path="/settings/global"
              element={
                <ComingSoon name="Settings globales" taskRef="task027" />
              }
            />

            <Route
              path="/reservas/:reservaId/gastos"
              element={<GastosReserva />}
            />
            <Route path="/huespedes/:id" element={<ClientDetail />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
