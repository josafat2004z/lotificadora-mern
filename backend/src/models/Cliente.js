const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema(
  {
    nombreCompleto: { type: String, required: true, trim: true },
    identidad: { type: String, trim: true },
    telefono: { type: String, trim: true },
    correo: { type: String, trim: true, lowercase: true },
    direccion: { type: String, trim: true },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cliente', clienteSchema);
