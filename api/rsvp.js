// Guarda la respuesta: si viene a la previa, al boliche o a ambas, que toma y su mascota.
import { getJSON, putJSON, putFile } from '../lib/store.js';
import { limpiarDiseno } from '../lib/mascota.js';
import { send, readJson, cleanText, validId, publicGuest, geoFromReq, nombreBloqueado, ASISTENCIA, BEBIDAS } from '../lib/http.js';

const MAX_PHOTO_BYTES = 2_500_000;

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'metodo no permitido' });
  try {
    const body = await readJson(req);
    const id = body.id;
    if (!validId(id)) return send(res, 400, { error: 'id invalido' });

    const path = `guests/${id}.json`;
    const guest = await getJSON(path);
    if (!guest) return send(res, 404, { error: 'primero pone tu nombre' });
    if (nombreBloqueado(guest.name)) return send(res, 403, { error: 'No estás invitado' });

    const asistencia = String(body.asistencia || '');
    if (!ASISTENCIA.includes(asistencia)) return send(res, 400, { error: 'elegi si venis' });
    const bebida = asistencia === 'no' ? null : String(body.bebida || '');
    if (bebida !== null && !BEBIDAS.includes(bebida)) return send(res, 400, { error: 'elegi que vas a tomar' });

    guest.asistencia = asistencia;
    guest.bebida = bebida;
    guest.noPet = Boolean(body.noPet);

    if (guest.noPet) {
      guest.pet = null;
    } else {
      const petName = cleanText(body.petName, 40);
      const pet = guest.pet || {};
      if (petName) pet.name = petName;
      const design = limpiarDiseno(body.petDesign);
      if (design) pet.design = design;
      if (body.petPhoto) {
        const match = /^data:image\/(jpeg|png|webp);base64,(.+)$/.exec(String(body.petPhoto));
        if (!match) return send(res, 400, { error: 'la foto tiene que ser una imagen' });
        const buffer = Buffer.from(match[2], 'base64');
        if (buffer.length > MAX_PHOTO_BYTES) return send(res, 400, { error: 'la foto es muy pesada' });
        const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
        const photoPath = `pets/${id}.${ext}`;
        await putFile(photoPath, buffer, `image/${match[1]}`);
        pet.photo = photoPath;
      }
      if (pet.name || pet.photo || pet.design) {
        pet.updatedAt = new Date().toISOString();
        guest.pet = pet;
      }
    }

    const geo = geoFromReq(req);
    if (geo) guest.geo = geo;
    guest.respondedAt = new Date().toISOString();
    guest.lastSeen = guest.respondedAt;
    await putJSON(path, guest);
    return send(res, 200, { guest: publicGuest(guest) });
  } catch (err) {
    console.error('rsvp', err);
    return send(res, 500, { error: 'no se pudo guardar' });
  }
}
