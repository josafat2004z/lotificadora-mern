// Middleware centralizado de errores: cualquier throw/next(error) termina acá
function manejadorErrores(err, _req, res, _next) {
  console.error(err);

  if (err.name === 'ValidationError') {
    const mensajes = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ mensaje: 'Datos inválidos', detalles: mensajes });
  }

  if (err.code === 11000) {
    const campo = Object.keys(err.keyValue || {})[0] || 'campo';
    return res.status(409).json({ mensaje: `Ya existe un registro con ese ${campo}.` });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ mensaje: 'Identificador inválido.' });
  }

  const codigo = err.statusCode || 500;
  return res.status(codigo).json({ mensaje: err.message || 'Error interno del servidor.' });
}

module.exports = manejadorErrores;
