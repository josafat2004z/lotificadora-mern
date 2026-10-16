import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/cliente';
import Modal from '../../components/Modal';
import { formatoLempiras, formatoFecha, COLOR_ESTADO } from '../../utils/formato';

const VACIO = {
  cliente: '', proyecto: '', manzana: '', lote: '',
  precioTotal: '', prima: '0', numeroCuotas: '', valorCuota: '',
  frecuencia: 'Mensual', fechaContrato: new Date().toISOString().slice(0, 10),
  fechaPrimeraCuota: new Date().toISOString().slice(0, 10),
};

export default function Contratos() {
  const [contratos, setContratos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [manzanas, setManzanas] = useState([]);
  const [lotesDisponibles, setLotesDisponibles] = useState([]);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState(VACIO);
  const [error, setError] = useState('');

  async function cargarContratos() {
    const { data } = await api.get('/contratos');
    setContratos(data);
  }

  useEffect(() => {
    cargarContratos();
    api.get('/clientes').then((r) => setClientes(r.data));
    api.get('/proyectos').then((r) => setProyectos(r.data));
  }, []);

  useEffect(() => {
    if (!form.proyecto) { setManzanas([]); return; }
    api.get('/manzanas').then((r) => setManzanas(r.data.filter((m) => m.proyecto?._id === form.proyecto)));
  }, [form.proyecto]);

  useEffect(() => {
    if (!form.manzana) { setLotesDisponibles([]); return; }
    api.get('/lotes', { params: { manzana: form.manzana, estado: 'Disponible' } }).then((r) => setLotesDisponibles(r.data));
  }, [form.manzana]);

  function abrirNuevo() {
    setForm(VACIO);
    setError('');
    setModalAbierto(true);
  }

  async function guardar(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/contratos', {
        cliente: form.cliente,
        lote: form.lote,
        precioTotal: Number(form.precioTotal),
        prima: Number(form.prima) || 0,
        numeroCuotas: Number(form.numeroCuotas),
        valorCuota: Number(form.valorCuota),
        frecuencia: form.frecuencia,
        fechaContrato: form.fechaContrato,
        fechaPrimeraCuota: form.fechaPrimeraCuota,
      });
      setModalAbierto(false);
      cargarContratos();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo crear el contrato.');
    }
  }

  return (
    <div>
      <div className="encabezado-pagina">
        <h1>Contratos</h1>
        <button className="boton boton-primario" onClick={abrirNuevo}>+ Nuevo contrato</button>
      </div>

      <div className="tarjeta">
        <table>
          <thead>
            <tr><th>N° Contrato</th><th>Cliente</th><th>Lote</th><th>Total</th><th>Saldo</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            {contratos.map((c) => (
              <tr key={c._id}>
                <td>{c.numeroContrato}</td>
                <td>{c.cliente?.nombreCompleto}</td>
                <td>{c.lote?.manzana?.nombre}-{c.lote?.numeroLote}</td>
                <td>{formatoLempiras(c.precioTotal)}</td>
                <td>{formatoLempiras(c.saldo)}</td>
                <td><span className="pastilla" style={{ background: COLOR_ESTADO[c.estado] }}>{c.estado}</span></td>
                <td style={{ textAlign: 'right' }}>
                  <Link to={`/contratos/${c._id}`} className="boton boton-secundario">Ver detalle</Link>
                </td>
              </tr>
            ))}
            {contratos.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--color-texto-secundario)' }}>No hay contratos todavía.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <Modal titulo="Nuevo contrato" onCerrar={() => setModalAbierto(false)} ancho={520}>
          {error && <div className="mensaje-error">{error}</div>}
          <form onSubmit={guardar}>
            <div className="campo">
              <label>Cliente</label>
              <select value={form.cliente} onChange={(e) => setForm({ ...form, cliente: e.target.value })} required>
                <option value="">Seleccioná un cliente…</option>
                {clientes.map((c) => <option key={c._id} value={c._id}>{c.nombreCompleto}</option>)}
              </select>
            </div>

            <div className="grid-2" style={{ gap: 12 }}>
              <div className="campo">
                <label>Proyecto</label>
                <select value={form.proyecto} onChange={(e) => setForm({ ...form, proyecto: e.target.value, manzana: '', lote: '' })} required>
                  <option value="">Seleccioná…</option>
                  {proyectos.map((p) => <option key={p._id} value={p._id}>{p.nombre}</option>)}
                </select>
              </div>
              <div className="campo">
                <label>Manzana</label>
                <select value={form.manzana} onChange={(e) => setForm({ ...form, manzana: e.target.value, lote: '' })} required disabled={!form.proyecto}>
                  <option value="">Seleccioná…</option>
                  {manzanas.map((m) => <option key={m._id} value={m._id}>{m.nombre}</option>)}
                </select>
              </div>
            </div>

            <div className="campo">
              <label>Lote disponible</label>
              <select value={form.lote} onChange={(e) => setForm({ ...form, lote: e.target.value })} required disabled={!form.manzana}>
                <option value="">Seleccioná…</option>
                {lotesDisponibles.map((l) => <option key={l._id} value={l._id}>{l.numeroLote} ({l.areaM2} m²) — {formatoLempiras(l.precio)}</option>)}
              </select>
              {form.manzana && lotesDisponibles.length === 0 && (
                <small style={{ color: 'var(--color-peligro)' }}>Esta manzana no tiene lotes disponibles.</small>
              )}
            </div>

            <div className="grid-2" style={{ gap: 12 }}>
              <div className="campo">
                <label>Precio total</label>
                <input type="number" step="0.01" value={form.precioTotal} onChange={(e) => setForm({ ...form, precioTotal: e.target.value })} required />
              </div>
              <div className="campo">
                <label>Prima</label>
                <input type="number" step="0.01" value={form.prima} onChange={(e) => setForm({ ...form, prima: e.target.value })} />
              </div>
            </div>

            <div className="grid-3" style={{ gap: 12 }}>
              <div className="campo">
                <label>N° de cuotas</label>
                <input type="number" value={form.numeroCuotas} onChange={(e) => setForm({ ...form, numeroCuotas: e.target.value })} required />
              </div>
              <div className="campo">
                <label>Valor cuota</label>
                <input type="number" step="0.01" value={form.valorCuota} onChange={(e) => setForm({ ...form, valorCuota: e.target.value })} required />
              </div>
              <div className="campo">
                <label>Frecuencia</label>
                <select value={form.frecuencia} onChange={(e) => setForm({ ...form, frecuencia: e.target.value })}>
                  {['Semanal', 'Quincenal', 'Mensual'].map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>

            <div className="grid-2" style={{ gap: 12 }}>
              <div className="campo">
                <label>Fecha del contrato</label>
                <input type="date" value={form.fechaContrato} onChange={(e) => setForm({ ...form, fechaContrato: e.target.value })} required />
              </div>
              <div className="campo">
                <label>Fecha primera cuota</label>
                <input type="date" value={form.fechaPrimeraCuota} onChange={(e) => setForm({ ...form, fechaPrimeraCuota: e.target.value })} required />
              </div>
            </div>

            <button className="boton boton-primario" style={{ width: '100%', justifyContent: 'center' }}>Crear contrato</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
