const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const contratoSchema = new mongoose.Schema(
  {
    numeroContrato: { type: String, required: true, unique: true, trim: true },
    codigoPublico: { type: String, default: uuidv4, unique: true }, // link del portal del cliente
    cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true },
    lote: { type: mongoose.Schema.Types.ObjectId, ref: 'Lote', required: true },

    precioTotal: { type: Number, required: true, min: 0 },
    prima: { type: Number, required: true, min: 0, default: 0 },
    numeroCuotas: { type: Number, required: true, min: 1 },
    valorCuota: { type: Number, required: true, min: 0 },
    frecuencia: {
      type: String,
      enum: ['Semanal', 'Quincenal', 'Mensual'],
      default: 'Mensual',
    },
    fechaContrato: { type: Date, required: true, default: Date.now },
    fechaPrimeraCuota: { type: Date, required: true },

    estado: {
      type: String,
      enum: ['Activo', 'EnMora', 'Finalizado', 'Cancelado'],
      default: 'Activo',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Contrato', contratoSchema);
