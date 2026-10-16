const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const proyectoRoutes = require('./routes/proyectoRoutes');
const manzanaRoutes = require('./routes/manzanaRoutes');
const loteRoutes = require('./routes/loteRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const contratoRoutes = require('./routes/contratoRoutes');
const pagoRoutes = require('./routes/pagoRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const portalRoutes = require('./routes/portalRoutes');
const manejadorErrores = require('./middleware/manejadorErrores');

const app = express();

// Detrás del proxy de Render/Netlify, así req.ip es la IP real del visitante
// (necesario para el límite de intentos del portal).
app.set('trust proxy', 1);

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/salud', (_req, res) => res.json({ estado: 'ok', mensaje: 'API de Lotificadora funcionando' }));

app.use('/api/auth', authRoutes);
app.use('/api/proyectos', proyectoRoutes);
app.use('/api/manzanas', manzanaRoutes);
app.use('/api/lotes', loteRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/contratos', contratoRoutes);
app.use('/api/pagos', pagoRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/portal', portalRoutes); // ruta pública, sin login

app.use((req, res) => {
  res.status(404).json({ mensaje: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

app.use(manejadorErrores);

module.exports = app;
