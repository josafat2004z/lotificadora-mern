import Modal from './Modal';
import { formatoLempiras, formatoFecha } from '../utils/formato';

// Recibo de un pago, listo para imprimir (o guardar como PDF desde el diálogo de impresión).
export default function ReciboPago({ pago, contrato, onCerrar }) {
  const lote = contrato?.lote ? `${contrato.lote.manzana?.nombre ?? ''}-${contrato.lote.numeroLote}` : '—';

  return (
    <Modal titulo="Recibo de pago" onCerrar={onCerrar} ancho={460}>
      <div className="recibo-impresion">
        <div style={{ textAlign: 'center', borderBottom: '2px dashed var(--color-borde)', paddingBottom: 12, marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Lotificadora</div>
          <div style={{ fontSize: 13, color: 'var(--color-texto-secundario)' }}>Recibo de pago</div>
          <div style={{ marginTop: 6, fontWeight: 600 }}>N° {pago.numeroRecibo || 'S/N'}</div>
        </div>

        <table style={{ fontSize: 14 }}>
          <tbody>
            <tr><td style={{ color: 'var(--color-texto-secundario)' }}>Fecha</td><td>{formatoFecha(pago.fecha)}</td></tr>
            <tr><td style={{ color: 'var(--color-texto-secundario)' }}>Cliente</td><td>{contrato?.cliente?.nombreCompleto || '—'}</td></tr>
            <tr><td style={{ color: 'var(--color-texto-secundario)' }}>Contrato</td><td>{contrato?.numeroContrato || '—'}</td></tr>
            <tr><td style={{ color: 'var(--color-texto-secundario)' }}>Lote</td><td>{lote}</td></tr>
            <tr><td style={{ color: 'var(--color-texto-secundario)' }}>Concepto</td><td>{pago.cuota ? `Cuota #${pago.cuota.numeroCuota}` : 'Abono general'}</td></tr>
            <tr><td style={{ color: 'var(--color-texto-secundario)' }}>Método</td><td>{pago.metodo}</td></tr>
            {pago.observacion && <tr><td style={{ color: 'var(--color-texto-secundario)' }}>Observación</td><td>{pago.observacion}</td></tr>}
          </tbody>
        </table>

        <div style={{ textAlign: 'center', marginTop: 16, padding: 12, background: '#F9FAFB', borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--color-texto-secundario)' }}>Monto recibido</div>
          <div style={{ fontSize: 26, fontWeight: 700 }}>{formatoLempiras(pago.monto)}</div>
        </div>

        <div style={{ marginTop: 36, textAlign: 'center', fontSize: 12, color: 'var(--color-texto-secundario)' }}>
          ______________________________<br />Firma de quien recibe
        </div>
      </div>

      <button className="boton boton-primario no-imprimir" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }} onClick={() => window.print()}>
        🖨️ Imprimir / Guardar PDF
      </button>
    </Modal>
  );
}
