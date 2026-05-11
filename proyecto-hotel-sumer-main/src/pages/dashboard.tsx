// src/pages/Dashboard.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./dashboard.css";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth(); 

  const [showAdminInfo, setShowAdminInfo] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const adminInfo = {
    nombre: "Juan Pérez",
    correo: "admin@ejemplo.com",
    usuario: "admin123",
    ingreso: "12/04/2026",
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  
  return (
    
    <div className="dashboard-page">
      <button
        className={`sidebar-toggle ${sidebarOpen ? "open" : ""}`}
        type="button"
        aria-label={sidebarOpen ? "Cerrar menú" : "Abrir menú"}
        onClick={() => setSidebarOpen((prev) => !prev)}
      >
        {sidebarOpen ? "x" : "☰"}
      </button>

      <div className={`dashboard-layout ${sidebarOpen ? "sidebar-open" : ""}`}>
        <aside className={`dashboard-sidebar ${sidebarOpen ? "open" : "closed"}`}>
          <div className="sidebar-header">
            <h2>Menú</h2>
          </div>

          <button
            className="sidebar-button"
            type="button"
            onClick={() => setShowAdminInfo((prev) => !prev)}
          >
            {showAdminInfo ? "Ocultar administrador" : "Mostrar administrador"}
          </button>

          {showAdminInfo && (
            <div className="admin-info">
              <p>
                <span>Nombre:</span> {adminInfo.nombre}
              </p>
              <p>
                <span>Correo:</span> {adminInfo.correo}
              </p>
              <p>
                <span>Usuario:</span> {adminInfo.usuario}
              </p>
              <p>
                <span>Ingreso:</span> {adminInfo.ingreso}
              </p>
            </div>
          )}

          {user?.role === "ADMIN" && (
            <button
              className="sidebar-button"
              type="button"
              onClick={() => navigate("/crear-user")}
            >
              Crear huesped
            </button>
          )}
          
          <button onClick={() => navigate("/consulta-huesped")}>
            Consultar huesped
          </button>  

          {user?.role === "ADMIN" && (
            <button onClick={() => navigate("/modificar-huesped")}>
              Modificar huesped
            </button>
          )}

          {user?.role === "ADMIN" && (
            <button onClick={() => navigate("/eliminar-huesped")}>
              Eliminar huesped
            </button>
          )}
          
          <button
            className="sidebar-logout"
            type="button"
            onClick={handleLogout}
          >
            Cerrar sesión
          </button>
        </aside>

        <main className="dashboard-main">
          <div className="dashboard-header">
            <h1>¡Bienvenido  {user?.email}!</h1>
            <p>Rol: {user?.role}</p>
          </div>

          <div className="dashboard-cards">
            <div className="dashboard-card">
              <h2>Resumen de huesped</h2>
              <p>Información clave sobre tu cuenta y actividad reciente.</p>
            </div>

            <div className="dashboard-card">
              <h2>Estadísticas</h2>
              <p>Datos importantes para ayudarte a tomar mejores decisiones.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
