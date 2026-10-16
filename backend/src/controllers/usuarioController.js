const Usuario = require('../models/Usuario');

async function listar(req, res, next) {
  try {
    res.json(await Usuario.find().sort({ createdAt: -1 }));
  } catch (error) {
    next(error);
  }
}

async function crear(req, res, next) {
  try {
    const { nombreUsuario, nombreCompleto, contrasena, rol } = req.body;
    if (!nombreUsuario || !nombreCompleto || !contrasena) {
      return res.status(400).json({ mensaje: 'Nombre de usuario, nombre completo y contraseña son obligatorios.' });
    }

    const contrasenaHash = await Usuario.hashearContrasena(contrasena);
    const usuario = await Usuario.create({ nombreUsuario, nombreCompleto, contrasenaHash, rol });
    res.status(201).json(usuario);
  } catch (error) {
    next(error);
  }
}

async function actualizar(req, res, next) {
  try {
    const { nombreCompleto, rol, activo, contrasena } = req.body;
    const cambios = { nombreCompleto, rol, activo };

    if (contrasena) {
      cambios.contrasenaHash = await Usuario.hashearContrasena(contrasena);
    }

    const usuario = await Usuario.findByIdAndUpdate(req.params.id, cambios, {
      new: true,
      runValidators: true,
    });
    if (!usuario) return res.status(404).json({ mensaje: 'No encontrado.' });
    res.json(usuario);
  } catch (error) {
    next(error);
  }
}

async function eliminar(req, res, next) {
  try {
    const usuario = await Usuario.findByIdAndDelete(req.params.id);
    if (!usuario) return res.status(404).json({ mensaje: 'No encontrado.' });
    res.json({ mensaje: 'Eliminado correctamente.' });
  } catch (error) {
    next(error);
  }
}

module.exports = { listar, crear, actualizar, eliminar };
