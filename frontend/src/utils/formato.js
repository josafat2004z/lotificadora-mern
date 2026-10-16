export function formatoLempiras(monto) {
  if (monto === null || monto === undefined) return 'L. 0.00';
  return `L. ${Number(monto).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatoFecha(fecha) {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleDateString('es-HN', { year: 'numeric', month: 'long', day: 'numeric' });
}

export const COLOR_ESTADO = {
  Disponible: '#10B981',
  Reservado: '#F59E0B',
  Vendido: '#3B82F6',
  EnMora: '#EF4444',
  Bloqueado: '#6B7280',
  Activo: '#10B981',
  Finalizado: '#3B82F6',
  Cancelado: '#6B7280',
  Pendiente: '#F59E0B',
  Parcial: '#3B82F6',
  Pagada: '#10B981',
  Vencida: '#EF4444',
};

// Fecha en formato YYYY-MM-DD (hora local) para <input type="date">.
export function aInputFecha(fecha = new Date()) {
  const d = new Date(fecha);
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

// Convierte el valor de un <input type="date"> a ISO a mediodía local, para que
// la fecha no se corra un día al guardarla (UTC vs. hora de Honduras).
export function deInputFecha(valor) {
  return new Date(`${valor}T12:00:00`).toISOString();
}
