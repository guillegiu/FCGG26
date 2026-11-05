// Publico: las mascotas diseñadas (solo nombre de la mascota y el diseño). Lee un unico archivo indice.
import { leerIndice } from '../lib/pets-index.js';
import { send } from '../lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { error: 'metodo no permitido' });
  try {
    const mapa = await leerIndice();
    const pets = Object.values(mapa)
      .sort((a, b) => String(a.respondedAt).localeCompare(String(b.respondedAt)))
      .map((p) => ({ nombre: p.nombre, design: p.design }));
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600');
    return send(res, 200, { pets });
  } catch (err) {
    console.error('pets', err);
    return send(res, 500, { error: 'error leyendo los datos' });
  }
}
