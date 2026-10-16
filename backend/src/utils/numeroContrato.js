const Contrato = require('../models/Contrato');

// Igual que en el sistema de escritorio: toma el número más alto existente (no el conteo),
// así nunca colisiona después de eliminar un contrato intermedio.
async function generarNumeroContrato() {
  const contratos = await Contrato.find({}, 'numeroContrato').lean();

  let maximo = 0;
  for (const c of contratos) {
    const match = /(\d+)$/.exec(c.numeroContrato || '');
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maximo) maximo = n;
    }
  }

  const siguiente = maximo + 1;
  return `CT-${String(siguiente).padStart(4, '0')}`;
}

module.exports = generarNumeroContrato;
