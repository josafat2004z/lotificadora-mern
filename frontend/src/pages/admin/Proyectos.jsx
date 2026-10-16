import { useEffect, useState } from 'react';
import api from '../../api/cliente';
import Modal from '../../components/Modal';

const VACIO = { nombre: '', ubicacion: '', descripcion: '' };

export default function Proyectos() {
  const [proyectos, setProyectos] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(VACIO);
  const [error, setError] = useState('');

  async function cargar() {
    const { data } = await api.get('/proyectos');
    setProyectos(data);
  }

  useEffect(() => { cargar(); }, []);

  function abrirNuevo() {
    setForm(VACIO);
    setEditando(null);
    setError('');
    setModalAbierto(true);
  }

  function abrirEditar(p) {
    setForm({ nombre: p.nombre, ubicacion: p.ubicacion || '', descripcion: p.descripcion || '' });
    setEditando(p._id);
    setError('');
    setModalAbierto(true);
  }

  async function guardar(e) {
    e.preventDefault();
    setError('');
    try {
      if (editando) await api.put(`/proyectos/${editando}`, form);
      else await api.post('/proyectos', form);
      setModalAbierto(false);
      cargar();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo guardar el proyecto.');
    }
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar este proyecto? Esto no se puede deshacer.')) return;
    try {
      await api.delete(`/proyectos/${id}`);
      cargar();
    } catch (err) {
      alert(err.response?.data?.mensaje || 'No se pudo eliminar.');
    }
  }

  return (
    <div>
      <div className="encabezado-pagina">
        <h1>Proyectos</h1>
        <button className="boton boton-primario" onClick={abrirNuevo}>+ Nuevo proyecto</button>
      </div>

      <div className="tarjeta">
        <table>
          <thead>
            <tr><th>Nombre</th><th>Ubicación</th><th></th></tr>
          </thead>
          <tbody>
            {proyectos.map((p) => (
              <tr key={p._id}>
                <td>{p.nombre}</td>
                <td>{p.ubicacion || '—'}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="boton boton-secundario" onClick={() => abrirEditar(p)} style={{ marginRight: 8 }}>Editar</button>
                  <button className="boton boton-peligro" onClick={() => eliminar(p._id)}>Eliminar</button>
                </td>
              </tr>
            ))}
            {proyectos.length === 0 && (
              <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--color-texto-secundario)' }}>Aún no hay proyectos.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <Modal titulo={editando ? 'Editar proyecto' : 'Nuevo proyecto'} onCerrar={() => setModalAbierto(false)}>
          {error && <div className="mensaje-error">{error}</div>}
          <form onSubmit={guardar}>
            <div className="campo">
              <label>Nombre</label>
              <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required autoFocus />
            </div>
            <div className="campo">
              <label>Ubicación</label>
              <input value={form.ubicacion} onChange={(e) => setForm({ ...form, ubicacion: e.target.value })} />
            </div>
            <div className="campo">
              <label>Descripción</label>
              <textarea rows={3} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            </div>
            <button className="boton boton-primario" style={{ width: '100%', justifyContent: 'center' }}>Guardar</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
