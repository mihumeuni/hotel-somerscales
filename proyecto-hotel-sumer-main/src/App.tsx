import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import CrearUser from "./pages/crearUser";
import ConsultaHuesped from "./pages/consultaHuesped";
import ModificarHuesped from "./pages/modificarHuesped";
import EliminarHuesped from "./pages/eliminarHuesped";
import ProtectedRoute from "./routes/Protected-route";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/crear-user" element={<ProtectedRoute><CrearUser /></ProtectedRoute>} />
        <Route path="/consulta-huesped" element={<ProtectedRoute><ConsultaHuesped /></ProtectedRoute>} />
        <Route path="/modificar-huesped" element={<ProtectedRoute><ModificarHuesped /></ProtectedRoute>} />
        <Route path="/eliminar-huesped" element={<ProtectedRoute><EliminarHuesped /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
