const Proyecto = require('../models/Proyecto');
const crearCRUD = require('../utils/crudFactory');

module.exports = crearCRUD(Proyecto, { camposBusqueda: ['nombre', 'ubicacion'] });
