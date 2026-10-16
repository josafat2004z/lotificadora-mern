const express = require('express');
const controlador = require('../controllers/pagoController');
const { protegerRuta } = require('../middleware/auth');

const router = express.Router();
router.use(protegerRuta);

router.get('/', controlador.listar);
router.get('/:id', controlador.obtenerPorId);
router.post('/', controlador.registrar);
router.post('/carga-inicial', controlador.cargaInicial);
router.put('/:id', controlador.actualizar);
router.delete('/:id', controlador.eliminar);

module.exports = router;
