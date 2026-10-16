import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/cliente';
import EstadoCuenta from '../../components/EstadoCuenta';
import PlanoManzanas, { ESTADOS } from '../../components/PlanoManzanas';
import '../../styles/login.css';

// Entrada para clientes: escriben su número de lote y ven su estado de cuenta.
export default function PortalConsulta() {
  const [numeroLote, setNumeroLote] = useState('');
  const [manzana, setManzana] = useState('');
  const [pedirManzana, setPedirManzana] = useState(false);
  const [opcionesManzana, setOpcionesManzana] = useState([]);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  function reiniciar() {
    setDatos(null);
    setNumeroLote('');
    setManzana('');
    setPedirManzana(false);
    setOpcionesManzana([]);
    setError('');
  }

  async function consultar(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const { data } = await api.post('/portal/buscar', { numeroLote, manzana });
      setDatos(data);
    } catch (err) {
      const respuesta = err.response?.data;
      if (err.response?.status === 409 && respuesta?.requiereManzana) {
        setPedirManzana(true);
        setOpcionesManzana(respuesta.manzanas || []);
      }
      setError(respuesta?.mensaje || 'No se pudo consultar. Inténtalo de nuevo.');
    } finally {
      setCargando(false);
    }
  }

  if (datos) return <EstadoCuenta datos={datos} alVolver={reiniciar} />;

  return (
    <div className="login">
      <aside className="login-plano">
        <PlanoManzanas />

        <div className="login-marca">
          <span className="sello">L</span>
          Lotificadora
        </div>

        <div className="login-lema">
          <h2>Tu lote, tus pagos y tu próxima cuota.</h2>
          <p>Escribe el número de tu lote y revisa tu estado de cuenta al momento.</p>
        </div>

        <div className="login-leyenda">
          {ESTADOS.map((e) => (
            <span key={e.clave}><i style={{ background: e.color }} />{e.clave}</span>
          ))}
        </div>
      </aside>

      <main className="login-form-lado">
        <form className="login-form" onSubmit={consultar}>
          <h1>Consulta tu lote</h1>
          <p className="sub">Con el número de tu lote ves tu estado de cuenta.</p>

          {error && <div className="login-error" role="alert">{error}</div>}

          <div className="login-campo">
            <label htmlFor="lote">Número de lote</label>
            <div className="login-input">
              <input id="lote" value={numeroLote} onChange={(e) => setNumeroLote(e.target.value)} placeholder="Ej: 12" autoFocus required />
            </div>
          </div>

          {pedirManzana && (
            <div className="login-campo">
              <label htmlFor="manzana">Manzana</label>
              <div className="login-input">
                <input id="manzana" value={manzana} onChange={(e) => setManzana(e.target.value)} list="manzanas-opciones" placeholder="Ej: A" required />
              </div>
              <datalist id="manzanas-opciones">
                {opcionesManzana.map((m) => <option key={m} value={m} />)}
              </datalist>
            </div>
          )}

          <button className="login-boton" disabled={cargando}>
            {cargando ? 'Consultando…' : 'Ver mi estado de cuenta'}
          </button>

          <Link to="/" className="login-volver">← Volver al inicio</Link>
        </form>
      </main>
    </div>
  );
}
