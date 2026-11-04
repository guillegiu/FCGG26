// Registra que alguien entro a la invitacion (con su nombre) y devuelve lo que ya respondio.
import { getJSON, putJSON } from '../lib/store.js';
import { send, readJson, cleanText, validId, publicGuest, nombreBloqueado } from '../lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'metodo no permitido' });
  try {
    const body = await readJson(req, 10_000);
    const id = body.id;
    const name = cleanText(body.name, 60);
    if (!validId(id)) return send(res, 400, { error: 'id invalido' });
    if (nombreBloqueado(name)) return send(res, 403, { error: 'No estás invitado' });

    const now = new Date().toISOString();
    const path = `guests/${id}.json`;
    const guest = (await getJSON(path)) || { id, firstSeen: now, visits: 0 };
    if (name) guest.name = name;
    if (!guest.name) return send(res, 400, { error: 'falta el nombre' });
    guest.lastSeen = now;
    guest.visits = (guest.visits || 0) + 1;
    await putJSON(path, guest);
    return send(res, 200, { guest: publicGuest(guest) });
  } catch (err) {
    console.error('visit', err);
    return send(res, 500, { error: 'no se pudo guardar' });
  }
}
