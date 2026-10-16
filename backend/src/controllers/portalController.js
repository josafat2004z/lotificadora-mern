const Contrato = require('../models/Contrato');
const Cuota = require('../models/Cuota');
const Pago = require('../models/Pago');
const Lote = require('../models/Lote');

// Arma el estado de cuenta (versión sanitizada, apta para el público) de un contrato.
// Lo comparten las dos formas de entrar al portal: el link con código y la búsqueda por lote.
async function armarEstadoCuenta(contrato) {
  const cuotas = await Cuota.find({ contrato: contrato._id }).sort({ numeroCuota: 1 });
  const pagos = await Pago.find({ contrato: contrato._id }).sort({ fecha: 1 });

  const totalPagado = pagos.reduce((acc, p) => acc + p.monto, 0);
  const saldo = Math.max(0, contrato.precioTotal - totalPagado);
  const cuotasPagadas = cuotas.filter((c) => c.estado === 'Pagada').length;
  const proximaCuota = cuotas.find((c) => c.estado !== 'Pagada') || null;

  // No exponemos nada del cliente que no necesite para identificarse:
  // nada de identidad, correo ni datos de otros clientes.
  return {
    proyecto: contrato.lote?.manzana?.proyecto?.nombre,
    manzana: contrato.lote?.manzana?.nombre,
    numeroLote: contrato.lote?.numeroLote,
    areaM2: contrato.lote?.areaM2,
    numeroContrato: contrato.numeroContrato,
    fechaContrato: contrato.fechaContrato,
    estadoContrato: contrato.estado,

    precioTotal: contrato.precioTotal,
    prima: contrato.prima,
    totalPagado,
    saldo,

    numeroCuotas: contrato.numeroCuotas,
    cuotasPagadas,
    valorCuota: contrato.valorCuota,
    frecuencia: contrato.frecuencia,

    proximaCuota: proximaCuota
      ? { numero: proximaCuota.numeroCuota, fechaVencimiento: proximaCuota.fechaVencimiento, monto: proximaCuota.monto, saldo: proximaCuota.monto - proximaCuota.montoPagado }
      : null,

    historialPagos: pagos.map((p) => ({ fecha: p.fecha, monto: p.monto, metodo: p.metodo })),
  };
}

const POPULATE_LOTE = {
  path: 'lote',
  populate: { path: 'manzana', populate: { path: 'proyecto' } },
};

// GET /api/portal/:codigoPublico — endpoint PÚBLICO, sin login (link secreto con UUID).
async function obtenerEstadoCuenta(req, res, next) {
  try {
    const contrato = await Contrato.findOne({ codigoPublico: req.params.codigoPublico }).populate(POPULATE_LOTE);
    if (!contrato) {
      return res.status(404).json({ mensaje: 'No encontramos ningún contrato con ese enlace.' });
    }
    res.json(await armarEstadoCuenta(contrato));
  } catch (error) {
    next(error);
  }
}

function escaparRegex(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// POST /api/portal/buscar — endpoint PÚBLICO: el cliente escribe su número de lote.
// Body: { numeroLote, manzana? }
// El número de lote solo es único dentro de una manzana, así que si el mismo número
// existe en varias manzanas con contrato, se pide también la manzana (sin revelar
// nada más que los nombres de manzana).
async function buscarPorLote(req, res, next) {
  try {
    const numeroLote = String(req.body.numeroLote || '').trim();
    const manzana = String(req.body.manzana || '').trim();

    if (!numeroLote) {
      return res.status(400).json({ mensaje: 'Escribe el número de tu lote.' });
    }

    const NO_ENCONTRADO = { mensaje: 'No encontramos un contrato activo para ese lote. Revisa el número o contáctanos.' };

    const lotes = await Lote.find({ numeroLote: new RegExp(`^${escaparRegex(numeroLote)}$`, 'i') }).populate('manzana');
    if (lotes.length === 0) return res.status(404).json(NO_ENCONTRADO);

    // Solo contratos vigentes: un lote puede tener contratos cancelados anteriores.
    let contratos = await Contrato.find({
      lote: { $in: lotes.map((l) => l._id) },
      estado: { $in: ['Activo', 'EnMora', 'Finalizado'] },
    }).populate(POPULATE_LOTE);

    if (manzana) {
      contratos = contratos.filter((c) => c.lote?.manzana?.nombre?.toLowerCase() === manzana.toLowerCase());
    }

    if (contratos.length === 0) return res.status(404).json(NO_ENCONTRADO);

    if (contratos.length > 1) {
      return res.status(409).json({
        requiereManzana: true,
        mensaje: 'Hay más de un lote con ese número. Indica también tu manzana.',
        manzanas: [...new Set(contratos.map((c) => c.lote.manzana.nombre))].sort(),
      });
    }

    res.json(await armarEstadoCuenta(contratos[0]));
  } catch (error) {
    next(error);
  }
}

module.exports = { obtenerEstadoCuenta, buscarPorLote };
