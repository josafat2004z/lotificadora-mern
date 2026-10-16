const express = require('express');
const controlador = require('../controllers/usuarioController');
const { protegerRuta, permitirRoles } = require('../middleware/auth');

const router = express.Router();
router.use(protegerRuta, permitirRoles('Administrador'));

router.get('/', controlador.listar);
router.post('/', controlador.crear);
router.put('/:id', controlador.actualizar);
router.delete('/:id', controlador.eliminar);

module.exports = router;
