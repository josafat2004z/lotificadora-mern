const mongoose = require('mongoose');

const pagoSchema = new mongoose.Schema(
  {
    contrato: { type: mongoose.Schema.Types.ObjectId, ref: 'Contrato', required: true },
    cuota: { type: mongoose.Schema.Types.ObjectId, ref: 'Cuota', default: null }, // null = abono general / prima
    monto: { type: Number, required: true, min: 0.01 },
    fecha: { type: Date, required: true, default: Date.now },
    metodo: {
      type: String,
      enum: ['Efectivo', 'Transferencia', 'Deposito', 'Cheque', 'Otro'],
      default: 'Efectivo',
    },
    numeroRecibo: { type: String, trim: true },
    observacion: { type: String, trim: true },
    registradoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Pago', pagoSchema);
