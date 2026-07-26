import { useCallback, useMemo, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

// Componentes basicos
import Layout from "./base/Layout";

//Paginas
import Contacto from "./pages/Contacto";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Clientes from "./pages/Clientes";
import VisitasSupervisor from "./pages/VisitasSupervisor";
import VisitasTecnico from "./pages/VisitasTecnico";
import Perfil from "./pages/Perfil";
import Usuarios from "./pages/Usuarios";
import VisitasInfo from "./pages/VisitasInfo";

// Estilos
import "./App.css";
import Card from "./components/Card/Card";

export default function App() {
  const [user, setUser] = useState(null);

  const handleLogout = useCallback(() => {
    setUser(null);
  }, []);

  const role = user?.rol?.toLowerCase();
  const defaultVisitasRoute = useMemo(() => {
    if (role === "tecnico") return "/visitas/tecnico";
    return "/visitas/supervisor";
  }, [role]);

  if (!user) {
    return <Login onSuccess={setUser} />;
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <Routes>
        {/* Ruta principal: Home */}
        <Route path="/" element={<Home user={user} />} />

        {/* Ruta secundaria: Contacto */}
        <Route path="/contacto" element={<Contacto />} />

        {/* Ruta secundaria: Clientes */}
        <Route path="/clientes" element={<Clientes />} />

        {/* Rutas para manejo de visitas */}
        <Route path="/visitas" element={<Navigate to={defaultVisitasRoute} replace />} />
        <Route path="/visitas/supervisor" element={<VisitasSupervisor user={user} />} />
        <Route path="/visitas/tecnico" element={<VisitasTecnico user={user} />} />

        {/* Configuracion de perfil */}
        <Route path="/perfil" element={<Perfil user={user} onProfileUpdate={setUser} />} />

        {/* Administración de usuarios */}
        <Route path="/usuarios" element={<Usuarios user={user} />} />

        {/* Historico de Visitas */}
        <Route path="/visitasInfo" element={<VisitasInfo user={user}/>} />

        {/* Ruta fallback: si la URL no existe */}
        <Route path="*" element={<h2>Página no encontrada</h2>} />
      </Routes>
    </Layout>
  );
}
