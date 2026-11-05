// Un solo archivo con todas las mascotas, para que /api/pets haga 1 lectura en vez de una por invitado.
import { getJSON, putJSON, getManyJSON, listPaths } from './store.js';

const INDEX = 'pets-index.json';

function entrada(g) {
  if (!g || !g.pet || !g.pet.design || g.asistencia === 'no') return null;
  return { nombre: g.pet.name || '', design: g.pet.design, respondedAt: g.respondedAt || '' };
}

async function reconstruir() {
  const paths = (await listPaths('guests/')).filter((p) => p.endsWith('.json'));
  const { items } = await getManyJSON(paths);
  const mapa = {};
  for (const g of items) {
    const e = entrada(g);
    if (e) mapa[g.id] = e;
  }
  await putJSON(INDEX, mapa);
  return mapa;
}

export async function leerIndice() {
  return (await getJSON(INDEX)) || (await reconstruir());
}

// Actualiza (o borra si guest es null) la entrada de un invitado.
export async function actualizarIndice(id, guest) {
  const mapa = (await getJSON(INDEX)) || (await reconstruir());
  const e = entrada(guest);
  if (e) mapa[id] = e; else delete mapa[id];
  await putJSON(INDEX, mapa);
}
