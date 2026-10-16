const jwt = require('jsonwebtoken');

function generarToken(usuario) {
  return jwt.sign(
    { id: usuario._id, rol: usuario.rol, nombreUsuario: usuario.nombreUsuario },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

module.exports = generarToken;
