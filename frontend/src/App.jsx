import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RutaProtegida from './components/RutaProtegida';
import Layout from './components/Layout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Proyectos from './pages/admin/Proyectos';
import Lotes from './pages/admin/Lotes';
import Clientes from './pages/admin/Clientes';
import Contratos from './pages/admin/Contratos';
import ContratoDetalle from './pages/admin/ContratoDetalle';
import Pagos from './pages/admin/Pagos';
import Usuarios from './pages/admin/Usuarios';
import PortalCliente from './pages/portal/PortalCliente';
import PortalConsulta from './pages/portal/PortalConsulta';
import Inicio from './pages/Inicio';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Páginas públicas: sin login */}
          <Route path="/" element={<Inicio />} />
          <Route path="/consulta" element={<PortalConsulta />} />
          <Route path="/portal/:codigo" element={<PortalCliente />} />

          <Route path="/login" element={<Login />} />

          {/* Panel administrativo: requiere sesión */}
          <Route element={<RutaProtegida><Layout /></RutaProtegida>}>
            <Route path="/panel" element={<Dashboard />} />
            <Route path="/proyectos" element={<Proyectos />} />
            <Route path="/lotes" element={<Lotes />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/contratos" element={<Contratos />} />
            <Route path="/contratos/:id" element={<ContratoDetalle />} />
            <Route path="/pagos" element={<Pagos />} />
            <Route path="/usuarios" element={<Usuarios />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
