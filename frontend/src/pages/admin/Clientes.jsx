import { useEffect, useState } from 'react';
import api from '../../api/cliente';
import Modal from '../../components/Modal';

const VACIO = { nombreCompleto: '', identidad: '', telefono: '', correo: '', direccion: '' };

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(VACIO);
  const [error, setError] = useState('');

  async function cargar(texto = '') {
    const { data } = await api.get('/clientes', { params: texto ? { buscar: texto } : {} });
    setClientes(data);
  }

  useEffect(() => { cargar(); }, []);

  function abrirNuevo() {
    setForm(VACIO);
    setEditando(null);
    setError('');
    setModalAbierto(true);
  }

  function abrirEditar(c) {
    setForm({
      nombreCompleto: c.nombreCompleto,
      identidad: c.identidad || '',
      telefono: c.telefono || '',
      correo: c.correo || '',
      direccion: c.direccion || '',
    });
    setEditando(c._id);
    setError('');
    setModalAbierto(true);
  }

  async function guardar(e) {
    e.preventDefault();
    setError('');
    try {
      if (editando) await api.put(`/clientes/${editando}`, form);
      else await api.post('/clientes', form);
      setModalAbierto(false);
      cargar(buscar);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo guardar el cliente.');
    }
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar este cliente?')) return;
    try {
      await api.delete(`/clientes/${id}`);
      cargar(buscar);
    } catch (err) {
      alert(err.response?.data?.mensaje || 'No se pudo eliminar.');
    }
  }

  return (
    <div>
      <div className="encabezado-pagina">
        <h1>Clientes</h1>
        <button className="boton boton-primario" onClick={abrirNuevo}>+ Nuevo cliente</button>
      </div>

      <div className="campo" style={{ maxWidth: 320 }}>
        <input
          placeholder="Buscar por nombre, identidad, teléfono…"
          value={buscar}
          onChange={(e) => { setBuscar(e.target.value); cargar(e.target.value); }}
        />
      </div>

      <div className="tarjeta">
        <table>
          <thead>
            <tr><th>Nombre</th><th>Identidad</th><th>Teléfono</th><th>Correo</th><th></th></tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c._id}>
                <td>{c.nombreCompleto}</td>
                <td>{c.identidad || '—'}</td>
                <td>{c.telefono || '—'}</td>
                <td>{c.correo || '—'}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="boton boton-secundario" onClick={() => abrirEditar(c)} style={{ marginRight: 8 }}>Editar</button>
                  <button className="boton boton-peligro" onClick={() => eliminar(c._id)}>Eliminar</button>
                </td>
              </tr>
            ))}
            {clientes.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-texto-secundario)' }}>No hay clientes.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <Modal titulo={editando ? 'Editar cliente' : 'Nuevo cliente'} onCerrar={() => setModalAbierto(false)}>
          {error && <div className="mensaje-error">{error}</div>}
          <form onSubmit={guardar}>
            <div className="campo">
              <label>Nombre completo</label>
              <input value={form.nombreCompleto} onChange={(e) => setForm({ ...form, nombreCompleto: e.target.value })} required autoFocus />
            </div>
            <div className="campo">
              <label>Identidad</label>
              <input value={form.identidad} onChange={(e) => setForm({ ...form, identidad: e.target.value })} />
            </div>
            <div className="campo">
              <label>Teléfono</label>
              <input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            </div>
            <div className="campo">
              <label>Correo</label>
              <input type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} />
            </div>
            <div className="campo">
              <label>Dirección</label>
              <textarea rows={2} value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
            </div>
            <button className="boton boton-primario" style={{ width: '100%', justifyContent: 'center' }}>Guardar</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
