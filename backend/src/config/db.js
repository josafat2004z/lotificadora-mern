const mongoose = require('mongoose');

async function conectarDB() {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lotificadora';
    await mongoose.connect(uri);
    console.log(`✅ MongoDB conectado: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error.message);
    process.exit(1);
  }
}

module.exports = conectarDB;
