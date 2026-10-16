export default function Modal({ titulo, onCerrar, children, ancho = 480 }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 12,
      }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCerrar(); }}
    >
      <div className="tarjeta" style={{ width: ancho, maxWidth: 'calc(100vw - 24px)', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>{titulo}</h3>
          <button onClick={onCerrar} className="boton boton-secundario" style={{ padding: '6px 10px' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
