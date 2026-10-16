import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/cliente';
import Modal from '../../components/Modal';
import ReciboPago from '../../components/ReciboPago';
import { formatoLempiras, formatoFecha, COLOR_ESTADO } from '../../utils/formato';

export default function ContratoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contrato, setContrato] = useState(null);
  const [modalPago, setModalPago] = useState(false);
  const [cuotaSel, setCuotaSel] = useState(null);
  const [formPago, setFormPago] = useState({ monto: '', metodo: 'Efectivo', numeroRecibo: '', observacion: '' });
  const [error, setError] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [reciboSel, setReciboSel] = useState(null);

  async function cargar() {
    const { data } = await api.get(`/contratos/${id}`);
    setContrato(data);
  }

  useEffect(() => { cargar(); }, [id]);

  function abrirPago(cuota) {
    setCuotaSel(cuota);
    setFormPago({ monto: cuota ? String(cuota.monto - cuota.montoPagado) : '', metodo: 'Efectivo', numeroRecibo: '', observacion: '' });
    setError('');
    setModalPago(true);
  }

  async function registrarPago(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/pagos', {
        contrato: id,
        cuota: cuotaSel?._id || null,
        monto: Number(formPago.monto),
        metodo: formPago.metodo,
        numeroRecibo: formPago.numeroRecibo,
        observacion: formPago.observacion,
      });
      setModalPago(false);
      cargar();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo registrar el pago.');
    }
  }

  async function eliminarPago(pagoId) {
    if (!confirm('¿Eliminar este pago? Se revertirá el monto en la cuota correspondiente.')) return;
    try {
      await api.delete(`/pagos/${pagoId}`);
      cargar();
    } catch (err) {
      alert(err.response?.data?.mensaje || 'No se pudo eliminar el pago.');
    }
  }

  async function eliminarContrato() {
    if (!confirm('¿ELIMINAR este contrato por completo? Se borrarán todas sus cuotas y pagos, y el lote volverá a estar disponible. Esta acción NO se puede deshacer.')) return;
    try {
      await api.delete(`/contratos/${id}`);
      navigate('/contratos');
    } catch (err) {
      alert(err.response?.data?.mensaje || 'No se pudo eliminar el contrato.');
    }
  }

  function copiarLinkPortal() {
    const url = `${window.location.origin}/portal/${contrato.codigoPublico}`;
    navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  if (!contrato) return <p>Cargando…</p>;

  const porcentaje = Math.min(100, Math.round((contrato.totalPagado / contrato.precioTotal) * 100));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>Contrato {contrato.numeroContrato}</h1>
          <span className="pastilla" style={{ background: COLOR_ESTADO[contrato.estado] }}>{contrato.estado}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="boton boton-secundario" onClick={copiarLinkPortal}>
            {copiado ? '✅ Copiado' : '🔗 Copiar link del portal'}
          </button>
          <button className="boton boton-peligro" onClick={eliminarContrato}>Eliminar contrato</button>
        </div>
      </div>

      <div className="grid-3" style={{ gap: 16, marginBottom: 20 }}>
        <div className="tarjeta">
          <div style={{ fontSize: 13, color: 'var(--color-texto-secundario)' }}>Cliente</div>
          <div style={{ fontWeight: 600 }}>{contrato.cliente?.nombreCompleto}</div>
          <div style={{ fontSize: 13, color: 'var(--color-texto-secundario)', marginTop: 8 }}>Lote</div>
          <div>{contrato.lote?.manzana?.proyecto?.nombre} — {contrato.lote?.manzana?.nombre}-{contrato.lote?.numeroLote} ({contrato.lote?.areaM2} m²)</div>
        </div>
        <div className="tarjeta">
          <div style={{ fontSize: 13, color: 'var(--color-texto-secundario)' }}>Precio total</div>
          <div style={{ fontWeight: 600, fontSize: 18 }}>{formatoLempiras(contrato.precioTotal)}</div>
          <div style={{ fontSize: 13, color: 'var(--color-texto-secundario)', marginTop: 8 }}>Prima</div>
          <div>{formatoLempiras(contrato.prima)}</div>
        </div>
        <div className="tarjeta">
          <div style={{ fontSize: 13, color: 'var(--color-texto-secundario)' }}>Pagado / Saldo</div>
          <div style={{ fontWeight: 600, fontSize: 18 }}>{formatoLempiras(contrato.totalPagado)} <span style={{ color: 'var(--color-texto-secundario)', fontSize: 14, fontWeight: 400 }}>/ {formatoLempiras(contrato.saldo)}</span></div>
          <div className="barra-progreso" style={{ marginTop: 10 }}>
            <div className="barra-progreso-relleno" style={{ width: `${porcentaje}%` }} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-texto-secundario)', marginTop: 4 }}>{porcentaje}% completado</div>
        </div>
      </div>

      <div className="tarjeta" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <h3 style={{ margin: 0 }}>Cuotas</h3>
          <button className="boton boton-primario" onClick={() => abrirPago(null)}>+ Registrar abono general</button>
        </div>
        <table>
          <thead>
            <tr><th>#</th><th>Vencimiento</th><th>Monto</th><th>Pagado</th><th>Saldo</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            {contrato.cuotas.map((c) => (
              <tr key={c._id}>
                <td>{c.numeroCuota}</td>
                <td>{formatoFecha(c.fechaVencimiento)}</td>
                <td>{formatoLempiras(c.monto)}</td>
                <td>{formatoLempiras(c.montoPagado)}</td>
                <td>{formatoLempiras(c.monto - c.montoPagado)}</td>
                <td><span className="pastilla" style={{ background: COLOR_ESTADO[c.estado] }}>{c.estado}</span></td>
                <td style={{ textAlign: 'right' }}>
                  {c.estado !== 'Pagada' && (
                    <button className="boton boton-secundario" onClick={() => abrirPago(c)}>Registrar pago</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="tarjeta">
        <h3 style={{ marginTop: 0 }}>Historial de pagos</h3>
        <table>
          <thead>
            <tr><th>Fecha</th><th>Monto</th><th>Método</th><th>Cuota</th><th>Observación</th><th></th></tr>
          </thead>
          <tbody>
            {contrato.pagos.map((p) => (
              <tr key={p._id}>
                <td>{formatoFecha(p.fecha)}</td>
                <td>{formatoLempiras(p.monto)}</td>
                <td>{p.metodo}</td>
                <td>{p.cuota ? `#${p.cuota.numeroCuota}` : 'Abono general'}</td>
                <td style={{ fontSize: 13, color: 'var(--color-texto-secundario)' }}>{p.observacion || '—'}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="boton boton-secundario" style={{ marginRight: 6 }} onClick={() => setReciboSel(p)}>🧾 Recibo</button>
                  <button className="boton boton-peligro" onClick={() => eliminarPago(p._id)}>Eliminar</button>
                </td>
              </tr>
            ))}
            {contrato.pagos.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-texto-secundario)' }}>Aún no hay pagos registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {reciboSel && <ReciboPago pago={reciboSel} contrato={contrato} onCerrar={() => setReciboSel(null)} />}

      {modalPago && (
        <Modal titulo={cuotaSel ? `Registrar pago — Cuota #${cuotaSel.numeroCuota}` : 'Registrar abono general'} onCerrar={() => setModalPago(false)}>
          {error && <div className="mensaje-error">{error}</div>}
          <form onSubmit={registrarPago}>
            <div className="campo">
              <label>Monto</label>
              <input type="number" step="0.01" value={formPago.monto} onChange={(e) => setFormPago({ ...formPago, monto: e.target.value })} required autoFocus />
              {cuotaSel && <small style={{ color: 'var(--color-texto-secundario)' }}>Si pagás más del saldo de esta cuota, el excedente se aplica automáticamente a las siguientes.</small>}
            </div>
            <div className="campo">
              <label>Método</label>
              <select value={formPago.metodo} onChange={(e) => setFormPago({ ...formPago, metodo: e.target.value })}>
                {['Efectivo', 'Transferencia', 'Deposito', 'Cheque', 'Otro'].map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="campo">
              <label>N° de recibo</label>
              <input value={formPago.numeroRecibo} onChange={(e) => setFormPago({ ...formPago, numeroRecibo: e.target.value })} />
            </div>
            <div className="campo">
              <label>Observación</label>
              <textarea rows={2} value={formPago.observacion} onChange={(e) => setFormPago({ ...formPago, observacion: e.target.value })} />
            </div>
            <button className="boton boton-primario" style={{ width: '100%', justifyContent: 'center' }}>Registrar pago</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
