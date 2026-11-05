// Publico: las mascotas diseñadas (solo nombre de la mascota y el diseño).
import { getManyJSON, listPaths } from '../lib/store.js';
import { send } from '../lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { error: 'metodo no permitido' });
  try {
    const paths = (await listPaths('guests/')).filter((p) => p.endsWith('.json'));
    const { items: guests } = await getManyJSON(paths);
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
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
