const Lote = require('../models/Lote');
const Manzana = require('../models/Manzana');

async function listar(req, res, next) {
  try {
    const { manzana, proyecto, estado, buscar } = req.query;
    const filtro = {};
    if (manzana) filtro.manzana = manzana;
    if (estado) filtro.estado = estado;
    if (buscar) filtro.numeroLote = { $regex: buscar, $options: 'i' };

    let lotes = await Lote.find(filtro)
      .populate({ path: 'manzana', populate: { path: 'proyecto' } })
      .sort({ createdAt: -1 });

    // Filtro opcional por proyecto (se aplica después del populate porque
    // el proyecto vive en manzana.proyecto, no directo en Lote)
    if (proyecto) {
      lotes = lotes.filter((l) => String(l.manzana?.proyecto?._id) === String(proyecto));
    }

    res.json(lotes);
  } catch (error) {
    next(error);
  }
}

async function obtenerPorId(req, res, next) {
  try {
    const lote = await Lote.findById(req.params.id).populate({
      path: 'manzana',
      populate: { path: 'proyecto' },
    });
    if (!lote) return res.status(404).json({ mensaje: 'Lote no encontrado.' });
    res.json(lote);
  } catch (error) {
    next(error);
  }
}

async function crear(req, res, next) {
  try {
    const manzana = await Manzana.findById(req.body.manzana);
    if (!manzana) return res.status(400).json({ mensaje: 'La manzana indicada no existe.' });

    const lote = await Lote.create(req.body);
    res.status(201).json(lote);
  } catch (error) {
    next(error);
  }
}

async function actualizar(req, res, next) {
  try {
    const lote = await Lote.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!lote) return res.status(404).json({ mensaje: 'Lote no encontrado.' });
    res.json(lote);
  } catch (error) {
    next(error);
  }
}

async function eliminar(req, res, next) {
  try {
    const lote = await Lote.findById(req.params.id);
    if (!lote) return res.status(404).json({ mensaje: 'Lote no encontrado.' });

    if (lote.estado === 'Vendido' || lote.estado === 'EnMora') {
      return res.status(400).json({
        mensaje: 'No se puede eliminar un lote con contrato activo. Cancelá o eliminá el contrato primero.',
      });
    }

    await lote.deleteOne();
    res.json({ mensaje: 'Lote eliminado correctamente.' });
  } catch (error) {
    next(error);
  }
}

module.exports = { listar, obtenerPorId, crear, actualizar, eliminar };
