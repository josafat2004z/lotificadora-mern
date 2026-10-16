import { useMemo } from 'react';

// Colores de estado: los mismos que usa el sistema para los lotes
export const ESTADOS = [
  { clave: 'Disponible', color: '#4CC9A0' },
  { clave: 'Vendido', color: '#5B9CF0' },
  { clave: 'Reservado', color: '#F2B84B' },
  { clave: 'En mora', color: '#EF6A5B' },
];

// Plano decorativo: manzanas con sus lotes, como en un plano de lotificación.
// Los estados se reparten de forma fija (sin azar) para que el dibujo no cambie en cada carga.
export default function PlanoManzanas() {
  const lotes = useMemo(() => {
    const salida = [];
    const MANZANAS_X = 3, MANZANAS_Y = 3;
    const LOTES_X = 4, LOTES_Y = 2;
    const LOTE_W = 34, LOTE_H = 46, CALLE = 26;
    const MZ_W = LOTES_X * LOTE_W, MZ_H = LOTES_Y * LOTE_H;
    // pesos de reparto: la mayoría vendidos, algunos disponibles, pocos reservados/en mora
    const reparto = [1, 1, 0, 1, 1, 2, 1, 3, 1, 1, 0, 1, 1, 1, 2, 1];

    let n = 0;
    for (let my = 0; my < MANZANAS_Y; my++) {
      for (let mx = 0; mx < MANZANAS_X; mx++) {
        const ox = 40 + mx * (MZ_W + CALLE);
        const oy = 60 + my * (MZ_H + CALLE);
        for (let ly = 0; ly < LOTES_Y; ly++) {
          for (let lx = 0; lx < LOTES_X; lx++) {
            salida.push({
              x: ox + lx * LOTE_W + 1.5,
              y: oy + ly * LOTE_H + 1.5,
              w: LOTE_W - 3,
              h: LOTE_H - 3,
              estado: reparto[(n * 7 + mx + my * 3) % reparto.length],
              retraso: (n * 0.045).toFixed(2),
            });
            n++;
          }
        }
      }
    }
    return salida;
  }, []);

  return (
    <svg className="mapa" viewBox="0 0 560 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {/* retícula fina de topografía */}
      <defs>
        <pattern id="reticula" width="28" height="28" patternUnits="userSpaceOnUse">
          <path d="M28 0H0V28" fill="none" stroke="#8DB5A3" strokeOpacity="0.12" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="560" height="640" fill="url(#reticula)" />

      <g transform="translate(70 40)">
        {lotes.map((l, i) => (
          <rect
            key={i}
            className="lote lote-anim"
            style={{ animationDelay: `${l.retraso}s` }}
            x={l.x} y={l.y} width={l.w} height={l.h} rx="2"
            fill={ESTADOS[l.estado].color}
            fillOpacity={l.estado === 1 ? 0.55 : 0.85}
            stroke="#12342B" strokeWidth="1"
          />
        ))}
      </g>

      {/* norte */}
      <g transform="translate(500 70)" stroke="#BFD3C7" fill="none" strokeWidth="1.5">
        <circle r="16" strokeOpacity="0.6" />
        <path d="M0 -10 L5 6 L0 3 L-5 6 Z" fill="#BFD3C7" />
      </g>
    </svg>
  );
}

