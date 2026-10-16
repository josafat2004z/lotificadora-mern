const express = require('express');
const { login, perfil } = require('../controllers/authController');
const { protegerRuta } = require('../middleware/auth');

const router = express.Router();

router.post('/login', login);
router.get('/perfil', protegerRuta, perfil);

module.exports = router;
