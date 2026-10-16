import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/cliente';
import Modal from '../../components/Modal';
import ReciboPago from '../../components/ReciboPago';
import { formatoLempiras, formatoFecha, aInputFecha, deInputFecha } from '../../utils/formato';

const METODOS = ['Efectivo', 'Transferencia', 'Deposito', 'Cheque', 'Otro'];

const FORM_NUEVO = {
  contrato: '', cuota: '', monto: '', fecha: aInputFecha(), metodo: 'Efectivo', numeroRecibo: '', observacion: '',
};

export default function Pagos() {
  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({ buscar: '', metodo: '', desde: '', hasta: '' });

  const [contratos, setContratos] = useState([]);
  const [cuotasContrato, setCuotasContrato] = useState([]);

  // 'nuevo' | 'editar' | 'carga' | null
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(FORM_NUEVO);
  const [pagoEditando, setPagoEditando] = useState(null);
  const [formCarga, setFormCarga] = useState({ contrato: '', cantidadCuotas: '', metodo: 'Efectivo', fechaFija: '' });
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [recibo, setRecibo] = useState(null);

  async function cargarPagos() {
    setCargando(true);
    try {
      const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v));
      const { data } = await api.get('/pagos', { params });
      setPagos(data);
    } finally {
      setCargando(false);
    }
  }

  // Recarga con un pequeño retraso al escribir, para no consultar en cada tecla
  useEffect(() => {
    const t = setTimeout(cargarPagos, 300);
    return () => clearTimeout(t);
  }, [filtros]);

  useEffect(() => {
    api.get('/contratos').then((r) => setContratos(r.data.filter((c) => c.estado !== 'Cancelado')));
  }, []);

  // Al elegir un contrato en el formulario, se traen sus cuotas pendientes
  useEffect(() => {
    const id = modal === 'nuevo' ? form.contrato : null;
    if (!id) { setCuotasContrato([]); return; }
    api.get(`/contratos/${id}`).then((r) => {
      const pendientes = r.data.cuotas.filter((c) => c.estado !== 'Pagada');
      setCuotasContrato(pendientes);
      const primera = pendientes[0];
      setForm((f) => ({
        ...f,
        cuota: primera ? primera._id : '',
        monto: primera ? String(primera.monto - primera.montoPagado) : '',
      }));
    });
  }, [form.contrato, modal]);

  const totales = useMemo(() => {
    const total = pagos.reduce((acc, p) => acc + p.monto, 0);
    return { total, cantidad: pagos.length, promedio: pagos.length ? total / pagos.length : 0 };
  }, [pagos]);

  function abrirNuevo() {
    setForm({ ...FORM_NUEVO, fecha: aInputFecha() });
    setError('');
    setModal('nuevo');
  }

  function abrirEditar(pago) {
    setPagoEditando(pago);
    setForm({
      monto: String(pago.monto),
      fecha: aInputFecha(pago.fecha),
      metodo: pago.metodo,
      numeroRecibo: pago.numeroRecibo || '',
      observacion: pago.observacion || '',
    });
    setError('');
    setModal('editar');
  }

  function abrirCarga() {
    setFormCarga({ contrato: '', cantidadCuotas: '', metodo: 'Efectivo', fechaFija: '' });
    setError('');
    setModal('carga');
  }

  function cambiarCuota(id) {
    const cuota = cuotasContrato.find((c) => c._id === id);
    setForm({ ...form, cuota: id, monto: cuota ? String(cuota.monto - cuota.montoPagado) : form.monto });
  }

  async function guardarNuevo(e) {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      const { data } = await api.post('/pagos', {
        contrato: form.contrato,
        cuota: form.cuota || null,
        monto: Number(form.monto),
        fecha: deInputFecha(form.fecha),
        metodo: form.metodo,
        numeroRecibo: form.numeroRecibo,
        observacion: form.observacion,
      });
      setModal(null);
      setExito(data.pagos.length > 1
        ? `Pago registrado. El excedente se aplicó a ${data.pagos.length - 1} cuota(s) más.`
        : 'Pago registrado correctamente.');
      cargarPagos();
      api.get('/contratos').then((r) => setContratos(r.data.filter((c) => c.estado !== 'Cancelado')));
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo registrar el pago.');
    } finally {
      setGuardando(false);
    }
  }

  async function guardarEdicion(e) {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      await api.put(`/pagos/${pagoEditando._id}`, {
        monto: Number(form.monto),
        fecha: deInputFecha(form.fecha),
        metodo: form.metodo,
        numeroRecibo: form.numeroRecibo,
        observacion: form.observacion,
      });
      setModal(null);
      setExito('Pago actualizado.');
      cargarPagos();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo actualizar el pago.');
    } finally {
      setGuardando(false);
    }
  }

  async function guardarCarga(e) {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      const { data } = await api.post('/pagos/carga-inicial', {
        contrato: formCarga.contrato,
        cantidadCuotas: Number(formCarga.cantidadCuotas),
        metodo: formCarga.metodo,
        fechaFija: formCarga.fechaFija ? deInputFecha(formCarga.fechaFija) : undefined,
      });
      setModal(null);
      setExito(`Se marcaron ${data.pagos.length} cuota(s) como pagadas.`);
      cargarPagos();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo hacer la carga inicial.');
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(pago) {
    if (!confirm(`¿Eliminar el pago de ${formatoLempiras(pago.monto)}? Se revertirá el monto en la cuota correspondiente.`)) return;
    try {
      await api.delete(`/pagos/${pago._id}`);
      setExito('Pago eliminado.');
      cargarPagos();
    } catch (err) {
      alert(err.response?.data?.mensaje || 'No se pudo eliminar el pago.');
    }
  }

  const textoContrato = (c) =>
    `${c.numeroContrato} — ${c.cliente?.nombreCompleto} — ${c.lote?.manzana?.nombre}-${c.lote?.numeroLote} (saldo ${formatoLempiras(c.saldo)})`;
  const contratosConSaldo = contratos.filter((c) => c.estado !== 'Finalizado');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 8, flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>Pagos</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="boton boton-secundario" onClick={abrirCarga}>📥 Carga inicial</button>
          <button className="boton boton-primario" onClick={abrirNuevo}>+ Registrar pago</button>
        </div>
      </div>

      {exito && (
        <div className="mensaje-exito" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{exito}</span>
          <button onClick={() => setExito('')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 16 }}>
        <div className="tarjeta">
          <div style={{ fontSize: 13, color: 'var(--color-texto-secundario)' }}>Total cobrado (según filtros)</div>
          <div style={{ fontWeight: 700, fontSize: 22, color: 'var(--color-exito)' }}>{formatoLempiras(totales.total)}</div>
        </div>
        <div className="tarjeta">
          <div style={{ fontSize: 13, color: 'var(--color-texto-secundario)' }}>N° de pagos</div>
          <div style={{ fontWeight: 700, fontSize: 22 }}>{totales.cantidad}</div>
        </div>
        <div className="tarjeta">
          <div style={{ fontSize: 13, color: 'var(--color-texto-secundario)' }}>Promedio por pago</div>
          <div style={{ fontWeight: 700, fontSize: 22 }}>{formatoLempiras(totales.promedio)}</div>
        </div>
      </div>

      <div className="tarjeta" style={{ marginBottom: 16 }}>
        <div className="grid-filtros">
          <div className="campo" style={{ margin: 0 }}>
            <label>Buscar</label>
            <input placeholder="Cliente, contrato, lote o recibo…" value={filtros.buscar} onChange={(e) => setFiltros({ ...filtros, buscar: e.target.value })} />
          </div>
          <div className="campo" style={{ margin: 0 }}>
            <label>Método</label>
            <select value={filtros.metodo} onChange={(e) => setFiltros({ ...filtros, metodo: e.target.value })}>
              <option value="">Todos</option>
              {METODOS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="campo" style={{ margin: 0 }}>
            <label>Desde</label>
            <input type="date" value={filtros.desde} onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })} />
          </div>
          <div className="campo" style={{ margin: 0 }}>
            <label>Hasta</label>
            <input type="date" value={filtros.hasta} onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })} />
          </div>
          <button className="boton boton-secundario" onClick={() => setFiltros({ buscar: '', metodo: '', desde: '', hasta: '' })}>Limpiar</button>
        </div>
      </div>

      <div className="tarjeta" style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr><th>Fecha</th><th>Recibo</th><th>Cliente</th><th>Lote</th><th>Concepto</th><th>Monto</th><th>Método</th><th></th></tr>
          </thead>
          <tbody>
            {pagos.map((p) => (
              <tr key={p._id}>
                <td>{formatoFecha(p.fecha)}</td>
                <td>{p.numeroRecibo || '—'}</td>
                <td>
                  {p.contrato ? <Link to={`/contratos/${p.contrato._id}`}>{p.contrato.cliente?.nombreCompleto}</Link> : '—'}
                  <div style={{ fontSize: 12, color: 'var(--color-texto-secundario)' }}>{p.contrato?.numeroContrato}</div>
                </td>
                <td>{p.contrato?.lote ? `${p.contrato.lote.manzana?.nombre}-${p.contrato.lote.numeroLote}` : '—'}</td>
                <td>{p.cuota ? `Cuota #${p.cuota.numeroCuota}` : 'Abono general'}</td>
                <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{formatoLempiras(p.monto)}</td>
                <td>{p.metodo}</td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button className="boton boton-secundario" style={{ marginRight: 6 }} onClick={() => setRecibo(p)}>🧾 Recibo</button>
                  <button className="boton boton-secundario" style={{ marginRight: 6 }} onClick={() => abrirEditar(p)}>Editar</button>
                  <button className="boton boton-peligro" onClick={() => eliminar(p)}>Eliminar</button>
                </td>
              </tr>
            ))}
            {!cargando && pagos.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--color-texto-secundario)' }}>No hay pagos con esos filtros.</td></tr>
            )}
            {cargando && (
              <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--color-texto-secundario)' }}>Cargando…</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Registrar pago */}
      {modal === 'nuevo' && (
        <Modal titulo="Registrar pago" onCerrar={() => setModal(null)} ancho={520}>
          {error && <div className="mensaje-error">{error}</div>}
          <form onSubmit={guardarNuevo}>
            <div className="campo">
              <label>Contrato</label>
              <select value={form.contrato} onChange={(e) => setForm({ ...form, contrato: e.target.value, cuota: '', monto: '' })} required autoFocus>
                <option value="">Seleccioná un contrato…</option>
                {contratosConSaldo.map((c) => <option key={c._id} value={c._id}>{textoContrato(c)}</option>)}
              </select>
            </div>

            {form.contrato && (
              <div className="campo">
                <label>Aplicar a</label>
                <select value={form.cuota} onChange={(e) => cambiarCuota(e.target.value)}>
                  {cuotasContrato.map((c) => (
                    <option key={c._id} value={c._id}>
                      Cuota #{c.numeroCuota} — vence {formatoFecha(c.fechaVencimiento)} — saldo {formatoLempiras(c.monto - c.montoPagado)}
                    </option>
                  ))}
                  <option value="">Abono general (sin cuota)</option>
                </select>
                {form.cuota && (
                  <small style={{ color: 'var(--color-texto-secundario)' }}>
                    Si el monto supera el saldo de la cuota, el excedente se aplica automáticamente a las siguientes.
                  </small>
                )}
              </div>
            )}

            <div className="grid-2" style={{ gap: 12 }}>
              <div className="campo">
                <label>Monto</label>
                <input type="number" step="0.01" min="0.01" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} required />
              </div>
              <div className="campo">
                <label>Fecha</label>
                <input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} required />
              </div>
            </div>
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="campo">
                <label>Método</label>
                <select value={form.metodo} onChange={(e) => setForm({ ...form, metodo: e.target.value })}>
                  {METODOS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="campo">
                <label>N° de recibo</label>
                <input value={form.numeroRecibo} onChange={(e) => setForm({ ...form, numeroRecibo: e.target.value })} />
              </div>
            </div>
            <div className="campo">
              <label>Observación</label>
              <textarea rows={2} value={form.observacion} onChange={(e) => setForm({ ...form, observacion: e.target.value })} />
            </div>
            <button className="boton boton-primario" style={{ width: '100%', justifyContent: 'center' }} disabled={guardando}>
              {guardando ? 'Guardando…' : 'Registrar pago'}
            </button>
          </form>
        </Modal>
      )}

      {/* Editar pago */}
      {modal === 'editar' && pagoEditando && (
        <Modal titulo="Editar pago" onCerrar={() => setModal(null)}>
          {error && <div className="mensaje-error">{error}</div>}
          <p style={{ marginTop: 0, fontSize: 13, color: 'var(--color-texto-secundario)' }}>
            {pagoEditando.contrato?.cliente?.nombreCompleto} · {pagoEditando.cuota ? `Cuota #${pagoEditando.cuota.numeroCuota}` : 'Abono general'}
          </p>
          <form onSubmit={guardarEdicion}>
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="campo">
                <label>Monto</label>
                <input type="number" step="0.01" min="0.01" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} required autoFocus />
              </div>
              <div className="campo">
                <label>Fecha</label>
                <input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} required />
              </div>
            </div>
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="campo">
                <label>Método</label>
                <select value={form.metodo} onChange={(e) => setForm({ ...form, metodo: e.target.value })}>
                  {METODOS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="campo">
                <label>N° de recibo</label>
                <input value={form.numeroRecibo} onChange={(e) => setForm({ ...form, numeroRecibo: e.target.value })} />
              </div>
            </div>
            <div className="campo">
              <label>Observación</label>
              <textarea rows={2} value={form.observacion} onChange={(e) => setForm({ ...form, observacion: e.target.value })} />
            </div>
            <button className="boton boton-primario" style={{ width: '100%', justifyContent: 'center' }} disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </form>
        </Modal>
      )}

      {/* Carga inicial de pagos históricos */}
      {modal === 'carga' && (
        <Modal titulo="Carga inicial de pagos históricos" onCerrar={() => setModal(null)}>
          {error && <div className="mensaje-error">{error}</div>}
          <p style={{ marginTop: 0, fontSize: 13, color: 'var(--color-texto-secundario)' }}>
            Para clientes que ya venían pagando antes de usar el sistema: marca como pagadas las primeras cuotas pendientes del contrato.
          </p>
          <form onSubmit={guardarCarga}>
            <div className="campo">
              <label>Contrato</label>
              <select value={formCarga.contrato} onChange={(e) => setFormCarga({ ...formCarga, contrato: e.target.value })} required>
                <option value="">Seleccioná un contrato…</option>
                {contratosConSaldo.map((c) => <option key={c._id} value={c._id}>{textoContrato(c)}</option>)}
              </select>
            </div>
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="campo">
                <label>Cuotas ya pagadas</label>
                <input type="number" min="1" value={formCarga.cantidadCuotas} onChange={(e) => setFormCarga({ ...formCarga, cantidadCuotas: e.target.value })} required />
              </div>
              <div className="campo">
                <label>Método</label>
                <select value={formCarga.metodo} onChange={(e) => setFormCarga({ ...formCarga, metodo: e.target.value })}>
                  {METODOS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="campo">
              <label>Fecha de los pagos (opcional)</label>
              <input type="date" value={formCarga.fechaFija} onChange={(e) => setFormCarga({ ...formCarga, fechaFija: e.target.value })} />
              <small style={{ color: 'var(--color-texto-secundario)' }}>Si la dejas vacía, cada pago toma la fecha de vencimiento de su cuota.</small>
            </div>
            <button className="boton boton-primario" style={{ width: '100%', justifyContent: 'center' }} disabled={guardando}>
              {guardando ? 'Guardando…' : 'Aplicar carga inicial'}
            </button>
          </form>
        </Modal>
      )}

      {recibo && <ReciboPago pago={recibo} contrato={recibo.contrato} onCerrar={() => setRecibo(null)} />}
    </div>
  );
}
