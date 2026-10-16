import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/cliente';
import EstadoCuenta from '../../components/EstadoCuenta';
import '../../styles/estado.css';

// Entrada por link secreto: /portal/<codigoPublico>
export default function PortalCliente() {
  const { codigo } = useParams();
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api
      .get(`/portal/${codigo}`)
      .then((r) => setDatos(r.data))
      .catch((err) => setError(err.response?.data?.mensaje || 'No se pudo cargar tu estado de cuenta.'))
      .finally(() => setCargando(false));
  }, [codigo]);

  if (cargando) {
    return <div className="estado-centro">Cargando tu estado de cuenta…</div>;
  }

  if (error) {
    return (
      <div className="estado-centro">
        <div className="estado-tarjeta">
          <h2>Enlace no válido</h2>
          <p style={{ color: '#66736C', marginBottom: 0 }}>{error}</p>
        </div>
      </div>
    );
  }

  return <EstadoCuenta datos={datos} />;
}
