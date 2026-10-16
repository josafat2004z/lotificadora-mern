const Pago = require('../models/Pago');
const Cuota = require('../models/Cuota');
const Contrato = require('../models/Contrato');
const Historial = require('../models/Historial');

function estadoCuotaSegunMonto(cuota) {
  if (cuota.montoPagado <= 0) return 'Pendiente';
  if (cuota.montoPagado >= cuota.monto) return 'Pagada';
  return 'Parcial';
}

// Revisa si, tras un cambio, el contrato debe pasar a Finalizado o volver a Activo/EnMora
async function reconciliarEstadoContrato(contratoId) {
  const contrato = await Contrato.findById(contratoId);
  if (!contrato || contrato.estado === 'Cancelado') return;

  const cuotas = await Cuota.find({ contrato: contratoId });
  const todasPagadas = cuotas.length > 0 && cuotas.every((c) => c.estado === 'Pagada');

  if (todasPagadas && contrato.estado !== 'Finalizado') {
    contrato.estado = 'Finalizado';
    await contrato.save();
  } else if (!todasPagadas && contrato.estado === 'Finalizado') {
    const hayVencidas = cuotas.some((c) => c.estado === 'Vencida');
    contrato.estado = hayVencidas ? 'EnMora' : 'Activo';
    await contrato.save();
  }
}

// GET /api/pagos/:id
async function obtenerPorId(req, res, next) {
  try {
    const pago = await Pago.findById(req.params.id)
      .populate({ path: 'contrato', populate: ['cliente', 'lote'] })
      .populate('cuota');
    if (!pago) return res.status(404).json({ mensaje: 'Pago no encontrado.' });
    res.json(pago);
  } catch (error) {
    next(error);
  }
}

// GET /api/pagos?contrato=&buscar=&metodo=&desde=&hasta=
// Listado general de pagos (más recientes primero) con cliente y lote ya cargados.
async function listar(req, res, next) {
  try {
    const { contrato, buscar, metodo, desde, hasta } = req.query;
    const filtro = {};
    if (contrato) filtro.contrato = contrato;
    if (metodo) filtro.metodo = metodo;
    if (desde || hasta) {
      filtro.fecha = {};
      if (desde) filtro.fecha.$gte = new Date(`${desde}T00:00:00`);
      if (hasta) filtro.fecha.$lte = new Date(`${hasta}T23:59:59.999`);
    }

    let pagos = await Pago.find(filtro)
      .populate('cuota')
      .populate({
        path: 'contrato',
        populate: [
          { path: 'cliente', select: 'nombreCompleto' },
          { path: 'lote', populate: { path: 'manzana', select: 'nombre' } },
        ],
      })
      .sort({ fecha: -1, createdAt: -1 });

    // La búsqueda por texto cruza varias colecciones (cliente, contrato, lote, recibo),
    // así que se aplica sobre los resultados ya cargados.
    if (buscar) {
      const q = buscar.trim().toLowerCase();
      pagos = pagos.filter((p) =>
        [
          p.contrato?.cliente?.nombreCompleto,
          p.contrato?.numeroContrato,
          p.contrato?.lote?.numeroLote,
          p.contrato?.lote?.manzana?.nombre && `${p.contrato.lote.manzana.nombre}-${p.contrato.lote.numeroLote}`,
          p.numeroRecibo,
        ].some((campo) => campo && String(campo).toLowerCase().includes(q))
      );
    }

    res.json(pagos);
  } catch (error) {
    next(error);
  }
}

// POST /api/pagos — registra un pago aplicando el excedente automáticamente
// a las siguientes cuotas pendientes, igual que en el sistema de escritorio.
async function registrar(req, res, next) {
  try {
    const { contrato: contratoId, cuota: cuotaId, monto, fecha, metodo, numeroRecibo, observacion } = req.body;

    if (!monto || monto <= 0) {
      return res.status(400).json({ mensaje: 'El monto debe ser mayor a cero.' });
    }

    const contrato = await Contrato.findById(contratoId);
    if (!contrato) return res.status(404).json({ mensaje: 'Contrato no encontrado.' });

    let restante = monto;
    const pagosCreados = [];

    if (cuotaId) {
      const cuotaInicial = await Cuota.findById(cuotaId);
      if (!cuotaInicial) return res.status(404).json({ mensaje: 'Cuota no encontrada.' });

      const cuotasPendientes = await Cuota.find({
        contrato: contratoId,
        numeroCuota: { $gte: cuotaInicial.numeroCuota },
      }).sort({ numeroCuota: 1 });

      for (const cuota of cuotasPendientes) {
        if (restante <= 0) break;
        const saldoCuota = cuota.monto - cuota.montoPagado;
        if (saldoCuota <= 0) continue;

        const aplicado = Math.min(restante, saldoCuota);
        cuota.montoPagado += aplicado;
        cuota.estado = estadoCuotaSegunMonto(cuota);
        await cuota.save();

        const esPrimerPago = pagosCreados.length === 0;
        const pago = await Pago.create({
          contrato: contratoId,
          cuota: cuota._id,
          monto: aplicado,
          fecha: fecha || Date.now(),
          metodo,
          numeroRecibo: esPrimerPago ? numeroRecibo : undefined,
          observacion: esPrimerPago ? observacion : `Excedente aplicado automáticamente (cuota #${cuota.numeroCuota})`,
          registradoPor: req.usuario?._id,
        });
        pagosCreados.push(pago);

        restante -= aplicado;
      }
    }

    // Lo que sobre (o todo, si no se indicó cuota) se registra como abono general
    if (restante > 0) {
      const pago = await Pago.create({
        contrato: contratoId,
        cuota: null,
        monto: restante,
        fecha: fecha || Date.now(),
        metodo,
        numeroRecibo: pagosCreados.length === 0 ? numeroRecibo : undefined,
        observacion: pagosCreados.length === 0 ? observacion : 'Abono general (excedente sin cuotas pendientes)',
        registradoPor: req.usuario?._id,
      });
      pagosCreados.push(pago);
    }

    await reconciliarEstadoContrato(contratoId);

    await Historial.create({
      usuario: req.usuario?._id,
      tipoAccion: 'RegistroPago',
      entidad: 'Pago',
      entidadId: pagosCreados[0]?._id,
      descripcion: `Se registró un pago de L. ${monto.toFixed(2)} al contrato ${contrato.numeroContrato}.`,
    });

    res.status(201).json({ pagos: pagosCreados });
  } catch (error) {
    next(error);
  }
}

// PUT /api/pagos/:id — ajusta solo el monto/datos de ESE pago puntual (sin excedente automático)
async function actualizar(req, res, next) {
  try {
    const pago = await Pago.findById(req.params.id);
    if (!pago) return res.status(404).json({ mensaje: 'Pago no encontrado.' });

    const nuevoMonto = req.body.monto !== undefined ? req.body.monto : pago.monto;

    if (pago.cuota) {
      const cuota = await Cuota.findById(pago.cuota);
      if (cuota) {
        const delta = nuevoMonto - pago.monto;
        const nuevoMontoPagado = cuota.montoPagado + delta;

        if (nuevoMontoPagado < 0 || nuevoMontoPagado > cuota.monto) {
          return res.status(400).json({
            mensaje: 'Ese monto no es válido: dejaría la cuota en negativo o por encima de su valor. Si querés aplicar un excedente, eliminá este pago y registralo de nuevo.',
          });
        }

        cuota.montoPagado = nuevoMontoPagado;
        cuota.estado = estadoCuotaSegunMonto(cuota);
        await cuota.save();
      }
    }

    pago.monto = nuevoMonto;
    if (req.body.fecha) pago.fecha = req.body.fecha;
    if (req.body.metodo) pago.metodo = req.body.metodo;
    if (req.body.numeroRecibo !== undefined) pago.numeroRecibo = req.body.numeroRecibo;
    if (req.body.observacion !== undefined) pago.observacion = req.body.observacion;
    await pago.save();

    await reconciliarEstadoContrato(pago.contrato);

    await Historial.create({
      usuario: req.usuario?._id,
      tipoAccion: 'EdicionPago',
      entidad: 'Pago',
      entidadId: pago._id,
      descripcion: `Se editó un pago del contrato.`,
    });

    res.json(pago);
  } catch (error) {
    next(error);
  }
}

// DELETE /api/pagos/:id — revierte el monto en la cuota y reconcilia el contrato
async function eliminar(req, res, next) {
  try {
    const pago = await Pago.findById(req.params.id);
    if (!pago) return res.status(404).json({ mensaje: 'Pago no encontrado.' });

    if (pago.cuota) {
      const cuota = await Cuota.findById(pago.cuota);
      if (cuota) {
        cuota.montoPagado = Math.max(0, cuota.montoPagado - pago.monto);
        cuota.estado = estadoCuotaSegunMonto(cuota);
        await cuota.save();
      }
    }

    const contratoId = pago.contrato;
    await pago.deleteOne();
    await reconciliarEstadoContrato(contratoId);

    await Historial.create({
      usuario: req.usuario?._id,
      tipoAccion: 'EliminacionPago',
      entidad: 'Pago',
      entidadId: pago._id,
      descripcion: `Se eliminó un pago de L. ${pago.monto.toFixed(2)}.`,
    });

    res.json({ mensaje: 'Pago eliminado correctamente.' });
  } catch (error) {
    next(error);
  }
}

// POST /api/pagos/carga-inicial — para migrar pagos históricos en bloque
async function cargaInicial(req, res, next) {
  try {
    const { contrato: contratoId, cantidadCuotas, metodo, fechaFija } = req.body;

    const cuotasPendientes = await Cuota.find({
      contrato: contratoId,
      estado: { $ne: 'Pagada' },
    })
      .sort({ numeroCuota: 1 })
      .limit(cantidadCuotas);

    if (cuotasPendientes.length < cantidadCuotas) {
      return res.status(400).json({
        mensaje: `Solo hay ${cuotasPendientes.length} cuotas pendientes, no se pueden marcar ${cantidadCuotas}.`,
      });
    }

    const pagosCreados = [];
    for (const cuota of cuotasPendientes) {
      const saldoCuota = cuota.monto - cuota.montoPagado;
      cuota.montoPagado = cuota.monto;
      cuota.estado = 'Pagada';
      await cuota.save();

      const pago = await Pago.create({
        contrato: contratoId,
        cuota: cuota._id,
        monto: saldoCuota,
        fecha: fechaFija || cuota.fechaVencimiento,
        metodo,
        observacion: 'Carga inicial de pagos históricos',
        registradoPor: req.usuario?._id,
      });
      pagosCreados.push(pago);
    }

    await reconciliarEstadoContrato(contratoId);
    res.status(201).json({ pagos: pagosCreados });
  } catch (error) {
    next(error);
  }
}

module.exports = { listar, obtenerPorId, registrar, actualizar, eliminar, cargaInicial };
