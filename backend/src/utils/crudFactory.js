// Fábrica de controladores CRUD simples, para no repetir el mismo código
// en Proyecto, Manzana, Cliente, etc. Las entidades con lógica especial
// (Contrato, Pago, Lote) tienen su propio controlador completo.
function crearCRUD(Modelo, { populate = null, camposBusqueda = [] } = {}) {
  return {
    async listar(req, res, next) {
      try {
        const { buscar } = req.query;
        let filtro = {};

        if (buscar && camposBusqueda.length > 0) {
          filtro = {
            $or: camposBusqueda.map((campo) => ({
              [campo]: { $regex: buscar, $options: 'i' },
            })),
          };
        }

        let query = Modelo.find(filtro).sort({ createdAt: -1 });
        if (populate) query = query.populate(populate);

        const items = await query;
        res.json(items);
      } catch (error) {
        next(error);
      }
    },

    async obtenerPorId(req, res, next) {
      try {
        let query = Modelo.findById(req.params.id);
        if (populate) query = query.populate(populate);
        const item = await query;
        if (!item) return res.status(404).json({ mensaje: 'No encontrado.' });
        res.json(item);
      } catch (error) {
        next(error);
      }
    },

    async crear(req, res, next) {
      try {
        const item = await Modelo.create(req.body);
        res.status(201).json(item);
      } catch (error) {
        next(error);
      }
    },

    async actualizar(req, res, next) {
      try {
        const item = await Modelo.findByIdAndUpdate(req.params.id, req.body, {
          new: true,
          runValidators: true,
        });
        if (!item) return res.status(404).json({ mensaje: 'No encontrado.' });
        res.json(item);
      } catch (error) {
        next(error);
      }
    },

    async eliminar(req, res, next) {
      try {
        const item = await Modelo.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ mensaje: 'No encontrado.' });
        res.json({ mensaje: 'Eliminado correctamente.' });
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = crearCRUD;
