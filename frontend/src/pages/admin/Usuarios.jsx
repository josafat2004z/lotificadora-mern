import { useEffect, useState } from 'react';
import api from '../../api/cliente';
import Modal from '../../components/Modal';

const VACIO = { nombreUsuario: '', nombreCompleto: '', contrasena: '', rol: 'Vendedor' };

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(VACIO);
  const [error, setError] = useState('');

  async function cargar() {
    const { data } = await api.get('/usuarios');
    setUsuarios(data);
  }

  useEffect(() => { cargar(); }, []);

  function abrirNuevo() {
    setForm(VACIO);
    setEditando(null);
    setError('');
    setModalAbierto(true);
  }

  function abrirEditar(u) {
    setForm({ nombreUsuario: u.nombreUsuario, nombreCompleto: u.nombreCompleto, contrasena: '', rol: u.rol, activo: u.activo });
    setEditando(u._id);
    setError('');
    setModalAbierto(true);
  }

  async function guardar(e) {
    e.preventDefault();
    setError('');
    try {
      if (editando) await api.put(`/usuarios/${editando}`, form);
      else await api.post('/usuarios', form);
      setModalAbierto(false);
      cargar();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo guardar el usuario.');
    }
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar este usuario?')) return;
    try {
      await api.delete(`/usuarios/${id}`);
      cargar();
    } catch (err) {
      alert(err.response?.data?.mensaje || 'No se pudo eliminar.');
    }
  }

  return (
    <div>
      <div className="encabezado-pagina">
        <h1>Usuarios</h1>
        <button className="boton boton-primario" onClick={abrirNuevo}>+ Nuevo usuario</button>
      </div>

      <div className="tarjeta">
        <table>
          <thead>
            <tr><th>Usuario</th><th>Nombre</th><th>Rol</th><th>Activo</th><th></th></tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u._id}>
                <td>{u.nombreUsuario}</td>
                <td>{u.nombreCompleto}</td>
                <td>{u.rol}</td>
                <td>{u.activo ? 'Sí' : 'No'}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="boton boton-secundario" onClick={() => abrirEditar(u)} style={{ marginRight: 8 }}>Editar</button>
                  <button className="boton boton-peligro" onClick={() => eliminar(u._id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <Modal titulo={editando ? 'Editar usuario' : 'Nuevo usuario'} onCerrar={() => setModalAbierto(false)}>
          {error && <div className="mensaje-error">{error}</div>}
          <form onSubmit={guardar}>
            <div className="campo">
              <label>Nombre de usuario</label>
              <input value={form.nombreUsuario} onChange={(e) => setForm({ ...form, nombreUsuario: e.target.value })} required disabled={!!editando} autoFocus />
            </div>
            <div className="campo">
              <label>Nombre completo</label>
              <input value={form.nombreCompleto} onChange={(e) => setForm({ ...form, nombreCompleto: e.target.value })} required />
            </div>
            <div className="campo">
              <label>{editando ? 'Nueva contraseña (opcional)' : 'Contraseña'}</label>
              <input type="password" value={form.contrasena} onChange={(e) => setForm({ ...form, contrasena: e.target.value })} required={!editando} />
            </div>
            <div className="campo">
              <label>Rol</label>
              <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
                {['Administrador', 'Vendedor', 'Cobrador'].map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <button className="boton boton-primario" style={{ width: '100%', justifyContent: 'center' }}>Guardar</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
