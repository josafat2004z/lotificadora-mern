import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PlanoManzanas, { ESTADOS } from '../components/PlanoManzanas';
import '../styles/login.css';

export default function Login() {
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [verContrasena, setVerContrasena] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();

  async function manejarSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await iniciarSesion(nombreUsuario, contrasena);
      navigate('/panel');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo iniciar sesión. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="login">
      <aside className="login-plano">
        <PlanoManzanas />

        <div className="login-marca">
          <span className="sello">L</span>
          Lotificadora
        </div>

        <div className="login-lema">
          <h2>Cada lote, cada contrato y cada pago en su lugar.</h2>
          <p>Administra proyectos, clientes y cobros desde un solo panel.</p>
        </div>

        <div className="login-leyenda">
          {ESTADOS.map((e) => (
            <span key={e.clave}><i style={{ background: e.color }} />{e.clave}</span>
          ))}
        </div>
      </aside>

      <main className="login-form-lado">
        <form className="login-form" onSubmit={manejarSubmit}>
          <h1>Iniciar sesión</h1>
          <p className="sub">Acceso para el personal de la lotificadora.</p>

          {error && <div className="login-error" role="alert">{error}</div>}

          <div className="login-campo">
            <label htmlFor="usuario">Usuario</label>
            <div className="login-input">
              <input
                id="usuario" value={nombreUsuario} onChange={(e) => setNombreUsuario(e.target.value)}
                autoComplete="username" autoFocus required
              />
            </div>
          </div>

          <div className="login-campo">
            <label htmlFor="contrasena">Contraseña</label>
            <div className="login-input">
              <input
                id="contrasena" type={verContrasena ? 'text' : 'password'} value={contrasena}
                onChange={(e) => setContrasena(e.target.value)} autoComplete="current-password" required
              />
              <button type="button" className="ver" onClick={() => setVerContrasena((v) => !v)}>
                {verContrasena ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          <button className="login-boton" disabled={cargando}>
            {cargando ? 'Entrando…' : 'Entrar'}
          </button>

          <Link to="/" className="login-volver">← Volver al inicio</Link>
        </form>
      </main>
    </div>
  );
}
