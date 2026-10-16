const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema(
  {
    nombreUsuario: { type: String, required: true, unique: true, trim: true },
    nombreCompleto: { type: String, required: true, trim: true },
    contrasenaHash: { type: String, required: true },
    rol: {
      type: String,
      enum: ['Administrador', 'Vendedor', 'Cobrador'],
      default: 'Vendedor',
    },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

usuarioSchema.methods.compararContrasena = function (contrasenaPlano) {
  return bcrypt.compare(contrasenaPlano, this.contrasenaHash);
};

usuarioSchema.statics.hashearContrasena = function (contrasenaPlano) {
  return bcrypt.hash(contrasenaPlano, 10);
};

// Nunca exponer el hash al convertir a JSON
usuarioSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.contrasenaHash;
    return ret;
  },
});

module.exports = mongoose.model('Usuario', usuarioSchema);
