// Publico: las mascotas diseñadas (solo nombre de la mascota y el diseño).
import { getJSON, listPaths } from '../lib/store.js';
import { send } from '../lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { error: 'metodo no permitido' });
  try {
    const paths = (await listPaths('guests/')).filter((p) => p.endsWith('.json'));
    const guests = (await Promise.all(paths.map((p) => getJSON(p)))).filter(Boolean);
    const pets = guests
      .filter((g) => g.pet && g.pet.design && g.asistencia !== 'no')
      .sort((a, b) => String(a.respondedAt).localeCompare(String(b.respondedAt)))
      .map((g) => ({
        nombre: g.pet.name || '',
        design: g.pet.design,
      }));
    return send(res, 200, { pets });
  } catch (err) {
    console.error('pets', err);
    return send(res, 500, { error: 'error leyendo los datos' });
  }
}
