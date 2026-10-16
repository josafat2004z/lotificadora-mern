import { useEffect, useState } from 'react';
import api from '../../api/cliente';
import Modal from '../../components/Modal';
import { formatoLempiras, COLOR_ESTADO } from '../../utils/formato';

const LOTE_VACIO = { manzana: '', numeroLote: '', areaM2: '', precio: '', observaciones: '' };

export default function Lotes() {
  const [proyectos, setProyectos] = useState([]);
  const [manzanas, setManzanas] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [proyectoSel, setProyectoSel] = useState('');
  const [manzanaSel, setManzanaSel] = useState('');

  const [modalManzana, setModalManzana] = useState(false);
  const [nombreManzana, setNombreManzana] = useState('');

  const [modalLote, setModalLote] = useState(false);
  const [editandoLote, setEditandoLote] = useState(null);
  const [formLote, setFormLote] = useState(LOTE_VACIO);
  const [error, setError] = useState('');

  useEffect(() => { api.get('/proyectos').then((r) => setProyectos(r.data)); }, []);

  useEffect(() => {
    if (!proyectoSel) { setManzanas([]); setManzanaSel(''); return; }
    api.get('/manzanas').then((r) => setManzanas(r.data.filter((m) => m.proyecto?._id === proyectoSel)));
  }, [proyectoSel]);

  async function cargarLotes() {
    if (!manzanaSel) { setLotes([]); return; }
    const { data } = await api.get('/lotes', { params: { manzana: manzanaSel } });
    setLotes(data);
  }

  useEffect(() => { cargarLotes(); }, [manzanaSel]);

  async function crearManzana(e) {
    e.preventDefault();
    const { data } = await api.post('/manzanas', { proyecto: proyectoSel, nombre: nombreManzana });
    setManzanas((prev) => [...prev, data]);
    setManzanaSel(data._id);
    setNombreManzana('');
    setModalManzana(false);
  }

  function abrirNuevoLote() {
    setFormLote({ ...LOTE_VACIO, manzana: manzanaSel });
    setEditandoLote(null);
    setError('');
    setModalLote(true);
  }

  function abrirEditarLote(l) {
    setFormLote({
      manzana: l.manzana?._id || manzanaSel,
      numeroLote: l.numeroLote,
      areaM2: l.areaM2,
      precio: l.precio,
      observaciones: l.observaciones || '',
      estado: l.estado,
    });
    setEditandoLote(l._id);
    setError('');
    setModalLote(true);
  }

  async function guardarLote(e) {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...formLote, areaM2: Number(formLote.areaM2), precio: Number(formLote.precio) };
      if (editandoLote) await api.put(`/lotes/${editandoLote}`, payload);
      else await api.post('/lotes', payload);
      setModalLote(false);
      cargarLotes();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo guardar el lote.');
    }
  }

  async function eliminarLote(id) {
    if (!confirm('¿Eliminar este lote?')) return;
    try {
      await api.delete(`/lotes/${id}`);
      cargarLotes();
    } catch (err) {
      alert(err.response?.data?.mensaje || 'No se pudo eliminar.');
    }
  }

  return (
    <div>
      <h1>Lotes</h1>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div className="campo" style={{ margin: 0, flex: 1 }}>
          <label>Proyecto</label>
          <select value={proyectoSel} onChange={(e) => setProyectoSel(e.target.value)}>
            <option value="">Seleccioná un proyecto…</option>
            {proyectos.map((p) => <option key={p._id} value={p._id}>{p.nombre}</option>)}
          </select>
        </div>
        <div className="campo" style={{ margin: 0, flex: 1 }}>
          <label>Manzana</label>
          <select value={manzanaSel} onChange={(e) => setManzanaSel(e.target.value)} disabled={!proyectoSel}>
            <option value="">Seleccioná una manzana…</option>
            {manzanas.map((m) => <option key={m._id} value={m._id}>{m.nombre}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          <button className="boton boton-secundario" disabled={!proyectoSel} onClick={() => setModalManzana(true)}>+ Manzana</button>
          <button className="boton boton-primario" disabled={!manzanaSel} onClick={abrirNuevoLote}>+ Lote</button>
        </div>
      </div>

      {manzanaSel && (
        <div className="tarjeta">
          <table>
            <thead>
              <tr><th>Lote</th><th>Área (m²)</th><th>Precio</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              {lotes.map((l) => (
                <tr key={l._id}>
                  <td>{l.numeroLote}</td>
                  <td>{l.areaM2}</td>
                  <td>{formatoLempiras(l.precio)}</td>
                  <td><span className="pastilla" style={{ background: COLOR_ESTADO[l.estado] }}>{l.estado}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="boton boton-secundario" onClick={() => abrirEditarLote(l)} style={{ marginRight: 8 }}>Editar</button>
                    <button className="boton boton-peligro" onClick={() => eliminarLote(l._id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
              {lotes.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-texto-secundario)' }}>Esta manzana no tiene lotes todavía.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!manzanaSel && <p style={{ color: 'var(--color-texto-secundario)' }}>Elegí un proyecto y una manzana para ver sus lotes.</p>}

      {modalManzana && (
        <Modal titulo="Nueva manzana" onCerrar={() => setModalManzana(false)} ancho={360}>
          <form onSubmit={crearManzana}>
            <div className="campo">
              <label>Nombre de la manzana</label>
              <input value={nombreManzana} onChange={(e) => setNombreManzana(e.target.value)} placeholder="Ej: A, B, Manzana 1…" required autoFocus />
            </div>
            <button className="boton boton-primario" style={{ width: '100%', justifyContent: 'center' }}>Crear</button>
          </form>
        </Modal>
      )}

      {modalLote && (
        <Modal titulo={editandoLote ? 'Editar lote' : 'Nuevo lote'} onCerrar={() => setModalLote(false)}>
          {error && <div className="mensaje-error">{error}</div>}
          <form onSubmit={guardarLote}>
            <div className="campo">
              <label>Número de lote</label>
              <input value={formLote.numeroLote} onChange={(e) => setFormLote({ ...formLote, numeroLote: e.target.value })} required autoFocus />
            </div>
            <div className="campo">
              <label>Área (m²)</label>
              <input type="number" step="0.01" value={formLote.areaM2} onChange={(e) => setFormLote({ ...formLote, areaM2: e.target.value })} required />
            </div>
            <div className="campo">
              <label>Precio</label>
              <input type="number" step="0.01" value={formLote.precio} onChange={(e) => setFormLote({ ...formLote, precio: e.target.value })} required />
            </div>
            {editandoLote && (
              <div className="campo">
                <label>Estado</label>
                <select value={formLote.estado} onChange={(e) => setFormLote({ ...formLote, estado: e.target.value })}>
                  {['Disponible', 'Reservado', 'Vendido', 'EnMora', 'Bloqueado'].map((op) => <option key={op} value={op}>{op}</option>)}
                </select>
              </div>
            )}
            <div className="campo">
              <label>Observaciones</label>
              <textarea rows={2} value={formLote.observaciones} onChange={(e) => setFormLote({ ...formLote, observaciones: e.target.value })} />
            </div>
            <button className="boton boton-primario" style={{ width: '100%', justifyContent: 'center' }}>Guardar</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
