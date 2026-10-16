import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/layout.css';

const ENLACES = [
  { ruta: '/panel', etiqueta: '📊 Dashboard' },
  { ruta: '/proyectos', etiqueta: '🏘️ Proyectos' },
  { ruta: '/lotes', etiqueta: '📐 Lotes' },
  { ruta: '/clientes', etiqueta: '👤 Clientes' },
  { ruta: '/contratos', etiqueta: '📄 Contratos' },
  { ruta: '/pagos', etiqueta: '💳 Pagos' },
  { ruta: '/usuarios', etiqueta: '🔑 Usuarios' },
];

export default function Layout() {
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  function salir() {
    cerrarSesion();
    navigate('/login');
  }

  return (
    <div className="app">
      {/* Barra superior: solo se ve en celular */}
      <header className="app-barra">
        <button className="app-menu-boton" onClick={() => setMenuAbierto(true)} aria-label="Abrir menú" aria-expanded={menuAbierto}>☰</button>
        Lotificadora
      </header>

      <div className={`app-velo ${menuAbierto ? 'abierto' : ''}`} onClick={() => setMenuAbierto(false)} />

      <aside className={`app-lateral ${menuAbierto ? 'abierto' : ''}`}>
        <div className="app-marca">
          <span className="sello">L</span>
          <div>
            <b>Lotificadora</b>
            <small>Sistema de Gestión</small>
          </div>
        </div>

        <nav className="app-nav">
          {ENLACES.map((e) => (
            <NavLink
              key={e.ruta}
              to={e.ruta}
              end={e.ruta === '/panel'}
              className="app-enlace"
              onClick={() => setMenuAbierto(false)}
            >
              {e.etiqueta}
            </NavLink>
          ))}
        </nav>

        <div className="app-usuario">
          <div className="nombre">
            {usuario?.nombreCompleto}
            <div className="rol">{usuario?.rol}</div>
          </div>
          <button onClick={salir} className="boton boton-secundario" style={{ width: '100%', justifyContent: 'center' }}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="app-principal">
        <div className="contenedor">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
