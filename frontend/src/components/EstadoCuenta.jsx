import { useState } from 'react';
import PlanoManzanas from './PlanoManzanas';
import { formatoLempiras, formatoFecha, COLOR_ESTADO } from '../utils/formato';
import '../styles/estado.css';

const ETAPAS = ['Reservado', 'Contrato firmado', 'En pagos', 'Liquidado'];
const PAGOS_VISIBLES = 5;

function etapaActual(estadoContrato, cuotasPagadas) {
  if (estadoContrato === 'Finalizado') return 3;
  if (cuotasPagadas > 0) return 2;
  return 1;
}

// Vista del estado de cuenta. La usan las dos formas de entrar al portal:
// el link con código y la búsqueda por número de lote.
export default function EstadoCuenta({ datos, alVolver }) {
  const [verTodos, setVerTodos] = useState(false);

  const paso = etapaActual(datos.estadoContrato, datos.cuotasPagadas);
  const porcentaje = datos.precioTotal ? Math.min(100, Math.round((datos.totalPagado / datos.precioTotal) * 100)) : 0;
  const vencida = datos.proximaCuota && new Date(datos.proximaCuota.fechaVencimiento) < new Date();

  // Más recientes primero
  const pagos = [...(datos.historialPagos || [])].reverse();
  const pagosMostrados = verTodos ? pagos : pagos.slice(0, PAGOS_VISIBLES);

  const mensajeWhatsapp = encodeURIComponent(
    `Hola, quisiera consultar sobre mi lote ${datos.manzana}-${datos.numeroLote} (contrato ${datos.numeroContrato}).`
  );

  return (
    <div className="estado">
      <header className="estado-cabecera">
        <PlanoManzanas />
        <div className="estado-marca"><span className="sello">L</span>Lotificadora</div>
        <h1>{datos.proyecto}</h1>
        <p>Lote {datos.manzana}-{datos.numeroLote} · {datos.areaM2} m²</p>
      </header>

      <main className="estado-cuerpo">
        {/* Línea de tiempo */}
        <section className="estado-tarjeta" aria-label="Etapa del contrato">
          <div className="etapas">
            <div className="etapas-linea" />
            <div className="etapas-avance" style={{ width: `${(paso / (ETAPAS.length - 1)) * 75}%` }} />
            {ETAPAS.map((etiqueta, i) => (
              <div key={etiqueta} className={`etapa ${i <= paso ? 'hecha' : ''} ${i === paso ? 'actual' : ''}`}>
                <div className="punto" />
                {etiqueta}
              </div>
            ))}
          </div>
        </section>

        {/* Estado de cuenta */}
        <section className="estado-tarjeta">
          <div className="estado-encabezado">
            <h2>Estado de cuenta</h2>
            <span className="estado-insignia" style={{ background: COLOR_ESTADO[datos.estadoContrato] }}>{datos.estadoContrato}</span>
          </div>

          <div className="barra-progreso">
            <div className="barra-progreso-relleno" style={{ width: `${porcentaje}%` }} />
          </div>
          <div className="estado-progreso-texto">{porcentaje}% pagado · {datos.cuotasPagadas} de {datos.numeroCuotas} cuotas</div>

          <div className="estado-datos">
            <div>
              <div className="estado-etiqueta">Precio total</div>
              <div className="estado-valor">{formatoLempiras(datos.precioTotal)}</div>
            </div>
            <div>
              <div className="estado-etiqueta">Total pagado</div>
              <div className="estado-valor" style={{ color: '#1E9E7A' }}>{formatoLempiras(datos.totalPagado)}</div>
            </div>
            <div>
              <div className="estado-etiqueta">Saldo pendiente</div>
              <div className="estado-valor">{formatoLempiras(datos.saldo)}</div>
            </div>
            <div>
              <div className="estado-etiqueta">Cuota {datos.frecuencia?.toLowerCase()}</div>
              <div className="estado-valor">{formatoLempiras(datos.valorCuota)}</div>
            </div>
          </div>
        </section>

        {/* Próxima cuota */}
        {datos.proximaCuota ? (
          <section className={`estado-tarjeta estado-proxima ${vencida ? 'vencida' : ''}`}>
            <div className="estado-etiqueta">{vencida ? 'Cuota vencida' : 'Próxima cuota'}</div>
            <div className="fila">
              <div>
                <div className="estado-valor">Cuota #{datos.proximaCuota.numero}</div>
                <div style={{ fontSize: 13 }}>{vencida ? 'Venció' : 'Vence'} el {formatoFecha(datos.proximaCuota.fechaVencimiento)}</div>
              </div>
              <div className="monto">{formatoLempiras(datos.proximaCuota.saldo)}</div>
            </div>
          </section>
        ) : (
          <section className="estado-tarjeta estado-ok">
            <div className="estado-valor">Tu lote está totalmente pagado</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>No tienes cuotas pendientes.</div>
          </section>
        )}

        {/* Historial de pagos */}
        <section className="estado-tarjeta">
          <h2>Historial de pagos</h2>
          {pagos.length === 0 ? (
            <p className="estado-vacio">Todavía no hay pagos registrados.</p>
          ) : (
            <>
              <ul className="historial">
                {pagosMostrados.map((p, i) => (
                  <li key={i}>
                    <div>
                      <div className="fecha">{formatoFecha(p.fecha)}</div>
                      <div className="metodo">{p.metodo}</div>
                    </div>
                    <div className="monto">{formatoLempiras(p.monto)}</div>
                  </li>
                ))}
              </ul>
              {pagos.length > PAGOS_VISIBLES && (
                <button className="estado-enlace" onClick={() => setVerTodos((v) => !v)}>
                  {verTodos ? 'Ver menos' : `Ver los ${pagos.length} pagos`}
                </button>
              )}
            </>
          )}
        </section>

        <div className="estado-acciones">
          <a href={`https://wa.me/?text=${mensajeWhatsapp}`} target="_blank" rel="noreferrer" className="estado-boton whatsapp">
            💬 Contactar por WhatsApp
          </a>
          {alVolver && (
            <button className="estado-boton secundario" onClick={alVolver}>Consultar otro lote</button>
          )}
        </div>

        <p className="estado-pie">Contrato {datos.numeroContrato} · {formatoFecha(datos.fechaContrato)}</p>
      </main>
    </div>
  );
}
