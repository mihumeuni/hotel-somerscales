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


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup-finish" element={<SignupFinish />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/crear-user" element={<ProtectedRoute><CrearUser /></ProtectedRoute>} />
        <Route path="/crear-huesped" element={<ProtectedRoute><CrearHuesped /></ProtectedRoute>} />
        <Route path="/consulta-huesped" element={<ProtectedRoute><ConsultaHuesped /></ProtectedRoute>} />
        <Route path="/modificar-huesped" element={<ProtectedRoute><ModificarHuesped /></ProtectedRoute>} />
        <Route path="/eliminar-huesped" element={<ProtectedRoute><EliminarHuesped /></ProtectedRoute>} />
        <Route path="/reservas/:reservaId/gastos" element={<ProtectedRoute><GastosReserva /></ProtectedRoute>} />
        <Route path="/huespedes/:id" element={<ProtectedRoute><GuestDetail /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
