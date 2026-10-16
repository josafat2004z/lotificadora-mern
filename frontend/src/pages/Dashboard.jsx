import { useEffect, useState } from 'react';
import api from '../api/cliente';
import { formatoLempiras, formatoFecha } from '../utils/formato';

function Tarjeta({ titulo, valor, color }) {
  return (
    <div className="tarjeta">
      <div style={{ fontSize: 13, color: 'var(--color-texto-secundario)', marginBottom: 6 }}>{titulo}</div>
      <div style={{ fontSize: 24, fontWeight: 700, whiteSpace: 'nowrap', color: color || 'var(--color-texto)' }}>{valor}</div>
    </div>
  );
}

export default function Dashboard() {
  const [resumen, setResumen] = useState(null);
  const [notificaciones, setNotificaciones] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/dashboard/resumen'), api.get('/dashboard/notificaciones')])
      .then(([r1, r2]) => {
        setResumen(r1.data);
        setNotificaciones(r2.data);
      })
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <p>Cargando…</p>;

  return (
    <div>
      <h1>Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, marginBottom: 24 }}>
        <Tarjeta titulo="Lotes totales" valor={resumen.totalLotes} />
        <Tarjeta titulo="Disponibles" valor={resumen.lotesDisponibles} color="var(--color-exito)" />
        <Tarjeta titulo="Vendidos" valor={resumen.lotesVendidos} color="var(--color-acento)" />
        <Tarjeta titulo="En mora" valor={resumen.lotesEnMora} color="var(--color-peligro)" />
        <Tarjeta titulo="Contratos activos" valor={resumen.contratosActivos} />
        <Tarjeta titulo="Total recaudado" valor={formatoLempiras(resumen.totalRecaudado)} color="var(--color-exito)" />
      </div>

      <div className="grid-2" style={{ gap: 16 }}>
        <div className="tarjeta">
          <h3 style={{ marginTop: 0 }}>⚠️ Cuotas vencidas ({notificaciones.vencidas.length})</h3>
          {notificaciones.vencidas.length === 0 && <p style={{ color: 'var(--color-texto-secundario)' }}>No hay cuotas vencidas.</p>}
          {notificaciones.vencidas.slice(0, 8).map((c) => (
            <div key={c._id} style={{ padding: '8px 0', borderBottom: '1px solid var(--color-borde)', fontSize: 13 }}>
              <strong>{c.contrato?.cliente?.nombreCompleto}</strong> — cuota #{c.numeroCuota} venció el {formatoFecha(c.fechaVencimiento)}
            </div>
          ))}
        </div>

        <div className="tarjeta">
          <h3 style={{ marginTop: 0 }}>🔔 Próximas a vencer ({notificaciones.proximasAVencer.length})</h3>
          {notificaciones.proximasAVencer.length === 0 && <p style={{ color: 'var(--color-texto-secundario)' }}>Nada en los próximos 7 días.</p>}
          {notificaciones.proximasAVencer.slice(0, 8).map((c) => (
            <div key={c._id} style={{ padding: '8px 0', borderBottom: '1px solid var(--color-borde)', fontSize: 13 }}>
              <strong>{c.contrato?.cliente?.nombreCompleto}</strong> — cuota #{c.numeroCuota} vence el {formatoFecha(c.fechaVencimiento)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
