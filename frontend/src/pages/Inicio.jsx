import { Link } from 'react-router-dom';
import PlanoManzanas from '../components/PlanoManzanas';
import '../styles/inicio.css';

const Flecha = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Pin de ubicación: representa "mi lote"
const IconoLote = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.7" />
  </svg>
);

// Tablero: representa el panel de administración
const IconoPanel = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3.5" y="3.5" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
    <rect x="13.5" y="3.5" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
    <rect x="13.5" y="11.5" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
    <rect x="3.5" y="15.5" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
  </svg>
);

// Página de entrada: el visitante elige si entra como cliente o como personal.
export default function Inicio() {
  return (
    <div className="inicio">
      <PlanoManzanas />

      <div className="inicio-contenido">
        <div className="inicio-marca">
          <span className="sello">L</span>
          Lotificadora
        </div>

        <h1>Bienvenido</h1>
        <p className="sub">Elige cómo quieres entrar. Si eres cliente, solo necesitas el número de tu lote.</p>

        <div className="inicio-opciones">
          <Link to="/consulta" className="opcion opcion-clientes">
            <span className="icono"><IconoLote /></span>
            <h2>Soy cliente</h2>
            <p>Mira cuánto has pagado, tu saldo y la fecha de tu próxima cuota.</p>
            <span className="entrar">Consultar mi lote <Flecha /></span>
          </Link>

          <Link to="/login" className="opcion opcion-admin">
            <span className="icono"><IconoPanel /></span>
            <h2>Administración</h2>
            <p>Acceso del personal para gestionar clientes, lotes, contratos y pagos.</p>
            <span className="entrar">Iniciar sesión <Flecha /></span>
          </Link>
        </div>
      </div>
    </div>
  );
}
