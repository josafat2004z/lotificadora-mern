const Lote = require('../models/Lote');
const Contrato = require('../models/Contrato');
const Pago = require('../models/Pago');
const Cuota = require('../models/Cuota');

// GET /api/dashboard/resumen
async function resumen(req, res, next) {
  try {
    const [totalLotes, lotesDisponibles, lotesVendidos, lotesEnMora, contratosActivos] = await Promise.all([
      Lote.countDocuments(),
      Lote.countDocuments({ estado: 'Disponible' }),
      Lote.countDocuments({ estado: 'Vendido' }),
      Lote.countDocuments({ estado: 'EnMora' }),
      Contrato.countDocuments({ estado: { $in: ['Activo', 'EnMora'] } }),
    ]);

    const pagos = await Pago.find();
    const totalRecaudado = pagos.reduce((acc, p) => acc + p.monto, 0);

    res.json({ totalLotes, lotesDisponibles, lotesVendidos, lotesEnMora, contratosActivos, totalRecaudado });
  } catch (error) {
    next(error);
  }
}

// GET /api/dashboard/notificaciones — cuotas vencidas o próximas a vencer
async function notificaciones(req, res, next) {
  try {
    const hoy = new Date();
    const en7dias = new Date();
    en7dias.setDate(hoy.getDate() + 7);

    const vencidas = await Cuota.find({ estado: { $ne: 'Pagada' }, fechaVencimiento: { $lt: hoy } })
      .populate({ path: 'contrato', populate: 'cliente' })
      .sort({ fechaVencimiento: 1 });

    const proximasAVencer = await Cuota.find({
      estado: { $ne: 'Pagada' },
      fechaVencimiento: { $gte: hoy, $lte: en7dias },
    })
      .populate({ path: 'contrato', populate: 'cliente' })
      .sort({ fechaVencimiento: 1 });

    res.json({ vencidas, proximasAVencer });
  } catch (error) {
    next(error);
  }
}

module.exports = { resumen, notificaciones };
