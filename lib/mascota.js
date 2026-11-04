// Valida el diseño de mascota que manda el invitado (mismas opciones que public/mascota.js).
const COLORES = ['naranja', 'gris', 'negro', 'blanco', 'crema', 'marron', 'azul', 'rosa', 'verde', 'lila'];
const VALIDOS = {
  especie: ['gato', 'perro'],
  color: COLORES,
  color2: COLORES,
  patron: ['liso', 'atigrado', 'manchas', 'frac', 'tricolor'],
  ojos: ['verde', 'ambar', 'celeste', 'marron', 'violeta'],
  accesorio: ['ninguno', 'mono', 'gorro', 'anteojos', 'corona', 'bufanda', 'vincha'],
};

export function limpiarDiseno(d) {
  if (!d || typeof d !== 'object') return null;
  const out = {};
  for (const [k, ops] of Object.entries(VALIDOS)) {
    if (!ops.includes(d[k])) return null;
    out[k] = d[k];
  }
  return out;
}
