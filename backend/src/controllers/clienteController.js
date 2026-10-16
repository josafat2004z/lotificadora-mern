const Cliente = require('../models/Cliente');
const crearCRUD = require('../utils/crudFactory');

module.exports = crearCRUD(Cliente, {
  camposBusqueda: ['nombreCompleto', 'identidad', 'telefono', 'correo'],
});
