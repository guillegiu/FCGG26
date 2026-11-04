// Devuelve la foto de la mascota de un invitado. Solo para el admin.
import { getJSON, getFile } from '../lib/store.js';
import { send, isAdmin, validId } from '../lib/http.js';

export default async function handler(req, res) {
  if (!isAdmin(req)) return send(res, 401, { error: 'clave incorrecta' });
  try {
    const id = new URL(req.url, 'http://x').searchParams.get('id');
    if (!validId(id)) return send(res, 400, { error: 'id invalido' });
    const guest = await getJSON(`guests/${id}.json`);
    if (!guest || !guest.pet || !guest.pet.photo) return send(res, 404, { error: 'sin foto' });
    const file = await getFile(guest.pet.photo);
    if (!file) return send(res, 404, { error: 'sin foto' });
    res.statusCode = 200;
    res.setHeader('Content-Type', file.contentType || 'image/jpeg');
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.end(file.buffer);
  } catch (err) {
    console.error('photo', err);
    return send(res, 500, { error: 'error leyendo la foto' });
  }
}
