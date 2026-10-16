const mongoose = require('mongoose');

const historialSchema = new mongoose.Schema(
  {
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    tipoAccion: {
      type: String,
      enum: [
        'CreacionContrato',
        'EdicionContrato',
        'EliminacionContrato',
        'RegistroPago',
        'EdicionPago',
        'EliminacionPago',
        'CambioEstado',
        'Otro',
      ],
      required: true,
    },
    entidad: { type: String, required: true }, // Ej: "Contrato", "Pago"
    entidadId: { type: mongoose.Schema.Types.ObjectId },
    descripcion: { type: String, required: true },
    fecha: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Historial', historialSchema);
