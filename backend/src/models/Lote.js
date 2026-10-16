const mongoose = require('mongoose');

const loteSchema = new mongoose.Schema(
  {
    manzana: { type: mongoose.Schema.Types.ObjectId, ref: 'Manzana', required: true },
    numeroLote: { type: String, required: true, trim: true },
    areaM2: { type: Number, required: true, min: 0 },
    precio: { type: Number, required: true, min: 0, default: 0 },
    estado: {
      type: String,
      enum: ['Disponible', 'Reservado', 'Vendido', 'EnMora', 'Bloqueado'],
      default: 'Disponible',
    },
    observaciones: { type: String, trim: true },
  },
  { timestamps: true }
);

loteSchema.index({ manzana: 1, numeroLote: 1 }, { unique: true });

module.exports = mongoose.model('Lote', loteSchema);
