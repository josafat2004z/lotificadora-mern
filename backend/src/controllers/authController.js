const Usuario = require('../models/Usuario');
const generarToken = require('../utils/generarToken');

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { nombreUsuario, contrasena } = req.body;

    if (!nombreUsuario || !contrasena) {
      return res.status(400).json({ mensaje: 'Usuario y contraseña son obligatorios.' });
    }

    const usuario = await Usuario.findOne({ nombreUsuario });
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos.' });
    }

    const contrasenaValida = await usuario.compararContrasena(contrasena);
    if (!contrasenaValida) {
      return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos.' });
    }

    const token = generarToken(usuario);
    res.json({ token, usuario });
  } catch (error) {
    next(error);
  }
}

// GET /api/auth/perfil
async function perfil(req, res) {
  res.json({ usuario: req.usuario });
}

module.exports = { login, perfil };
