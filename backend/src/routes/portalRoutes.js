const express = require('express');
const { obtenerEstadoCuenta, buscarPorLote } = require('../controllers/portalController');
const limitarIntentos = require('../middleware/limitarIntentos');

const router = express.Router();

// Públicas, SIN protegerRuta. Dos formas de entrar:
//  1) POST /buscar  -> el cliente escribe su número de lote (con límite de intentos)
//  2) GET /:codigo  -> link secreto (UUID) que comparte el administrador
router.post('/buscar', limitarIntentos(), buscarPorLote);
router.get('/:codigoPublico', obtenerEstadoCuenta);

module.exports = router;
