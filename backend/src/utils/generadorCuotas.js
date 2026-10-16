const Cuota = require('../models/Cuota');

const DIAS_POR_FRECUENCIA = {
  Semanal: 7,
  Quincenal: 15,
  Mensual: 30,
};

function sumarDias(fecha, dias) {
  const nueva = new Date(fecha);
  nueva.setDate(nueva.getDate() + dias);
  return nueva;
}

// Genera el calendario completo de cuotas de un contrato recién creado (o recalculado)
async function generarCuotas(contrato) {
  const intervalo = DIAS_POR_FRECUENCIA[contrato.frecuencia] || 30;
  const cuotas = [];

  for (let i = 1; i <= contrato.numeroCuotas; i++) {
    cuotas.push({
      contrato: contrato._id,
      numeroCuota: i,
      monto: contrato.valorCuota,
      montoPagado: 0,
      fechaVencimiento: sumarDias(contrato.fechaPrimeraCuota, intervalo * (i - 1)),
      estado: 'Pendiente',
    });
  }

  await Cuota.insertMany(cuotas);
}

module.exports = { generarCuotas };
