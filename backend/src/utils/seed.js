// Script para crear el primer usuario administrador.
// Ejecutar con: npm run seed
require('dotenv').config();
const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');

async function sembrar() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lotificadora');

  const existente = await Usuario.findOne({ nombreUsuario: 'admin' });
  if (existente) {
    console.log('ℹ️  El usuario "admin" ya existe. No se creó uno nuevo.');
  } else {
    const contrasenaHash = await Usuario.hashearContrasena('admin123');
    await Usuario.create({
      nombreUsuario: 'admin',
      nombreCompleto: 'Administrador del Sistema',
      contrasenaHash,
      rol: 'Administrador',
    });
    console.log('✅ Usuario administrador creado:');
    console.log('   Usuario:    admin');
    console.log('   Contraseña: admin123');
    console.log('   (cambiala después de tu primer login)');
  }

  await mongoose.disconnect();
}

sembrar().catch((err) => {
  console.error('Error al sembrar datos:', err);
  process.exit(1);
});
