const mongoose = require('mongoose');
const Contrato = require('../models/Contrato');
const Cuota = require('../models/Cuota');
const Pago = require('../models/Pago');
const Lote = require('../models/Lote');
const Historial = require('../models/Historial');
const { generarCuotas } = require('../utils/generadorCuotas');
const generarNumeroContrato = require('../utils/numeroContrato');

const POPULATE_CONTRATO = [
  { path: 'cliente' },
  { path: 'lote', populate: { path: 'manzana', populate: { path: 'proyecto' } } },
];

// Calcula totalPagado sumando los Pagos reales (no las Cuotas), igual que en
// el sistema de escritorio: así la prima y el excedente SIEMPRE se reflejan.
async function calcularTotales(contratoId) {
  const pagos = await Pago.find({ contrato: contratoId });
  const totalPagado = pagos.reduce((acc, p) => acc + p.monto, 0);
  return { totalPagado };
}

async function listar(req, res, next) {
  try {
    const { estado, buscar } = req.query;
    const filtro = {};
    if (estado) filtro.estado = estado;
    if (buscar) filtro.numeroContrato = { $regex: buscar, $options: 'i' };

    const contratos = await Contrato.find(filtro).populate(POPULATE_CONTRATO).sort({ createdAt: -1 });

    const conTotales = await Promise.all(
      contratos.map(async (c) => {
        const { totalPagado } = await calcularTotales(c._id);
        return { ...c.toObject(), totalPagado, saldo: c.precioTotal - totalPagado };
      })
    );

    res.json(conTotales);
  } catch (error) {
    next(error);
  }
}

async function obtenerPorId(req, res, next) {
  try {
    const contrato = await Contrato.findById(req.params.id).populate(POPULATE_CONTRATO);
    if (!contrato) return res.status(404).json({ mensaje: 'Contrato no encontrado.' });

    const cuotas = await Cuota.find({ contrato: contrato._id }).sort({ numeroCuota: 1 });
    const pagos = await Pago.find({ contrato: contrato._id }).populate('cuota').sort({ fecha: -1 });
    const { totalPagado } = await calcularTotales(contrato._id);

    res.json({
      ...contrato.toObject(),
      totalPagado,
      saldo: contrato.precioTotal - totalPagado,
      cuotas,
      pagos,
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/contratos  — crea el contrato, genera cuotas, marca el lote como Vendido,
// y si hay prima, la registra como un Pago sin cuota asociada.
// Nota: no usa transacciones de Mongo (requieren replica set); para este alcance
// las operaciones se hacen en orden seguro y se revierten manualmente si algo falla.
async function crear(req, res, next) {
  let contratoCreado = null;

  try {
    const lote = await Lote.findById(req.body.lote);
    if (!lote) return res.status(400).json({ mensaje: 'El lote indicado no existe.' });
    if (lote.estado !== 'Disponible') {
      return res.status(400).json({ mensaje: 'Ese lote ya no está disponible.' });
    }

    const numeroContrato = await generarNumeroContrato();

    const contrato = await Contrato.create({ ...req.body, numeroContrato });
    contratoCreado = contrato;

    await generarCuotas(contrato);

    if (contrato.prima > 0) {
      await Pago.create({
        contrato: contrato._id,
        cuota: null,
        monto: contrato.prima,
        fecha: contrato.fechaContrato,
        metodo: 'Efectivo',
        observacion: 'Prima inicial',
        registradoPor: req.usuario?._id,
      });
    }

    lote.estado = 'Vendido';
    await lote.save();

    await Historial.create({
      usuario: req.usuario?._id,
      tipoAccion: 'CreacionContrato',
      entidad: 'Contrato',
      entidadId: contrato._id,
      descripcion: `Se creó el contrato ${contrato.numeroContrato}.`,
    });

    const contratoCompleto = await Contrato.findById(contrato._id).populate(POPULATE_CONTRATO);
    res.status(201).json(contratoCompleto);
  } catch (error) {
    // Si algo falló después de crear el contrato, lo deshacemos para no dejar datos huérfanos
    if (contratoCreado) {
      await Cuota.deleteMany({ contrato: contratoCreado._id });
      await Pago.deleteMany({ contrato: contratoCreado._id });
      await Contrato.findByIdAndDelete(contratoCreado._id);
    }
    next(error);
  }
}

// PUT /api/contratos/:id — bloquea cambios financieros si ya hay pagos,
// y si no los hay, regenera el calendario de cuotas completo.
async function actualizar(req, res, next) {
  try {
    const existente = await Contrato.findById(req.params.id);
    if (!existente) return res.status(404).json({ mensaje: 'Contrato no encontrado.' });

    const pagosExistentes = await Pago.countDocuments({ contrato: existente._id });

    const camposFinancieros = ['precioTotal', 'prima', 'numeroCuotas', 'valorCuota', 'frecuencia', 'fechaPrimeraCuota'];
    const cambianCondiciones = camposFinancieros.some((campo) => {
      if (req.body[campo] === undefined) return false;
      const actual = existente[campo] instanceof Date ? existente[campo].toISOString() : existente[campo];
      const nuevo = req.body[campo] instanceof Date ? req.body[campo] : req.body[campo];
      return String(actual) !== String(nuevo);
    });

    if (cambianCondiciones && pagosExistentes > 0) {
      return res.status(400).json({
        mensaje:
          'No se pueden cambiar las condiciones financieras de un contrato que ya tiene pagos registrados. ' +
          'Si fue un error, eliminá los pagos primero, o cancelá este contrato y creá uno nuevo.',
      });
    }

    Object.assign(existente, req.body);
    await existente.save();

    if (cambianCondiciones) {
      await Cuota.deleteMany({ contrato: existente._id });
      await generarCuotas(existente);
    }

    await Historial.create({
      usuario: req.usuario?._id,
      tipoAccion: 'EdicionContrato',
      entidad: 'Contrato',
      entidadId: existente._id,
      descripcion: `Se editó el contrato ${existente.numeroContrato}.`,
    });

    const actualizado = await Contrato.findById(existente._id).populate(POPULATE_CONTRATO);
    res.json(actualizado);
  } catch (error) {
    next(error);
  }
}

// DELETE /api/contratos/:id — borrado en cascada (cuotas + pagos), libera el lote.
async function eliminar(req, res, next) {
  try {
    const contrato = await Contrato.findById(req.params.id);
    if (!contrato) return res.status(404).json({ mensaje: 'Contrato no encontrado.' });

    const cantidadCuotas = await Cuota.countDocuments({ contrato: contrato._id });
    const cantidadPagos = await Pago.countDocuments({ contrato: contrato._id });

    await Pago.deleteMany({ contrato: contrato._id });
    await Cuota.deleteMany({ contrato: contrato._id });
    await Lote.findByIdAndUpdate(contrato.lote, { estado: 'Disponible' });
    await contrato.deleteOne();

    await Historial.create({
      usuario: req.usuario?._id,
      tipoAccion: 'EliminacionContrato',
      entidad: 'Contrato',
      entidadId: contrato._id,
      descripcion: `Se eliminó el contrato ${contrato.numeroContrato} (${cantidadCuotas} cuotas, ${cantidadPagos} pagos borrados).`,
    });

    res.json({ mensaje: 'Contrato eliminado correctamente.' });
  } catch (error) {
    next(error);
  }
}

module.exports = { listar, obtenerPorId, crear, actualizar, eliminar };
