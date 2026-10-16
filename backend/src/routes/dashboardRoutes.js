const express = require('express');
const { resumen, notificaciones } = require('../controllers/dashboardController');
const { protegerRuta } = require('../middleware/auth');

const router = express.Router();
router.use(protegerRuta);

router.get('/resumen', resumen);
router.get('/notificaciones', notificaciones);

module.exports = router;
