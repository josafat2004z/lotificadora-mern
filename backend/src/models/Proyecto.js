const mongoose = require('mongoose');

const proyectoSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    ubicacion: { type: String, trim: true },
    descripcion: { type: String, trim: true },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Proyecto', proyectoSchema);
