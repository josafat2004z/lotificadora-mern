const mongoose = require('mongoose');

const cuotaSchema = new mongoose.Schema(
  {
    contrato: { type: mongoose.Schema.Types.ObjectId, ref: 'Contrato', required: true },
    numeroCuota: { type: Number, required: true },
    monto: { type: Number, required: true, min: 0 },
    montoPagado: { type: Number, required: true, min: 0, default: 0 },
    fechaVencimiento: { type: Date, required: true },
    estado: {
      type: String,
      enum: ['Pendiente', 'Parcial', 'Pagada', 'Vencida'],
      default: 'Pendiente',
    },
  },
  { timestamps: true }
);

cuotaSchema.virtual('saldo').get(function () {
  return Math.max(0, this.monto - this.montoPagado);
});
cuotaSchema.set('toJSON', { virtuals: true });

cuotaSchema.index({ contrato: 1, numeroCuota: 1 }, { unique: true });

module.exports = mongoose.model('Cuota', cuotaSchema);
