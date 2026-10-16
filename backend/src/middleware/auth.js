const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// Verifica que venga un token válido en el header Authorization: Bearer <token>
async function protegerRuta(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ mensaje: 'No autorizado. Inicia sesión para continuar.' });
    }

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const usuario = await Usuario.findById(payload.id);
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ mensaje: 'Usuario no válido o inactivo.' });
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    return res.status(401).json({ mensaje: 'Sesión inválida o expirada. Inicia sesión de nuevo.' });
  }
}

// Restringe por rol: usar como permitirRoles('Administrador')
function permitirRoles(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ mensaje: 'No tenés permiso para realizar esta acción.' });
    }
    next();
  };
}

module.exports = { protegerRuta, permitirRoles };
