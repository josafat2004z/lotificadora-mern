const mongoose = require('mongoose');

const manzanaSchema = new mongoose.Schema(
  {
    proyecto: { type: mongoose.Schema.Types.ObjectId, ref: 'Proyecto', required: true },
    nombre: { type: String, required: true, trim: true }, // Ej: "A", "B", "Manzana 1"
  },
  { timestamps: true }
);

manzanaSchema.index({ proyecto: 1, nombre: 1 }, { unique: true });

module.exports = mongoose.model('Manzana', manzanaSchema);
