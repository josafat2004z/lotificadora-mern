// Limitador de intentos muy simple, en memoria (sin dependencias extra).
// Como la búsqueda por número de lote es pública y los números son fáciles de
// adivinar, esto frena que alguien recorra lote por lote de forma automática.
function limitarIntentos({ ventanaMs = 15 * 60 * 1000, maximo = 30 } = {}) {
  const intentos = new Map(); // ip -> { cuenta, expira }

  return (req, res, next) => {
    const ahora = Date.now();
    const ip = req.ip;
    const registro = intentos.get(ip);

    if (!registro || registro.expira < ahora) {
      intentos.set(ip, { cuenta: 1, expira: ahora + ventanaMs });
      return next();
    }

    registro.cuenta += 1;
    if (registro.cuenta > maximo) {
      return res.status(429).json({ mensaje: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.' });
    }
    next();
  };
}

module.exports = limitarIntentos;
