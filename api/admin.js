// Panel de admin: lista de invitados (GET) y borrar uno (DELETE ?id=). Pide ADMIN_PASSWORD.
import { getJSON, getManyJSON, listPaths, removeFile } from '../lib/store.js';
import { send, isAdmin, validId } from '../lib/http.js';
import { actualizarIndice } from '../lib/pets-index.js';

export default async function handler(req, res) {
  if (!process.env.ADMIN_PASSWORD) return send(res, 500, { error: 'falta configurar ADMIN_PASSWORD' });
  if (!isAdmin(req)) return send(res, 401, { error: 'clave incorrecta' });

  try {
    if (req.method === 'GET') {
      const paths = (await listPaths('guests/')).filter((p) => p.endsWith('.json'));
      const { items: guests, fallidos } = await getManyJSON(paths);
      guests.sort((a, b) => String(b.lastSeen).localeCompare(String(a.lastSeen)));
      return send(res, 200, { guests, fallidos });
    }

    if (req.method === 'DELETE') {
      const id = new URL(req.url, 'http://x').searchParams.get('id');
      if (!validId(id)) return send(res, 400, { error: 'id invalido' });
      const guest = await getJSON(`guests/${id}.json`);
      if (guest && guest.pet && guest.pet.photo) await removeFile(guest.pet.photo);
      await removeFile(`guests/${id}.json`);
      try { await actualizarIndice(id, null); } catch (err) { console.error('indice', err); }
      return send(res, 200, { ok: true });
    }

    return send(res, 405, { error: 'metodo no permitido' });
  } catch (err) {
    console.error('admin', err);
    return send(res, 500, { error: 'error leyendo los datos' });
  }
}
