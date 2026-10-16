const Manzana = require('../models/Manzana');
const crearCRUD = require('../utils/crudFactory');

module.exports = crearCRUD(Manzana, { populate: 'proyecto', camposBusqueda: ['nombre'] });
