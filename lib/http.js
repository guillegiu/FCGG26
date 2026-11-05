import { timingSafeEqual } from 'node:crypto';

export function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (status !== 200 || !res.getHeader('Cache-Control')) res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

// En Vercel req.body ya viene parseado; en el servidor local hay que leerlo.
export async function readJson(req, maxBytes = 3_500_000) {
  if (req.body !== undefined) {
    if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
    if (Buffer.isBuffer(req.body)) return JSON.parse(req.body.toString('utf8') || '{}');
    return req.body || {};
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) throw new Error('demasiado grande');
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  return text ? JSON.parse(text) : {};
}

export function isAdmin(req) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const url = new URL(req.url, 'http://x');
  const given = String(req.headers['x-admin-key'] || url.searchParams.get('key') || '');
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function cleanText(value, max) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

// Nombres que no pueden entrar: tom, tomi, tomy, tomas, tomás, tomo, tomiii (sin importar mayúsculas, tildes ni letras repetidas).
const BLOQUEADOS = /^tom(i|y|as|o)?$/;
export function nombreBloqueado(name) {
  const palabras = String(name || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z\s]/g, ' ')
    .split(/\s+/).filter(Boolean)
    .map((w) => w.replace(/(.)\1+/g, '$1'));
  return palabras.some((w) => BLOQUEADOS.test(w));
}

export function validId(id) {
  return typeof id === 'string' && /^[a-zA-Z0-9-]{8,64}$/.test(id);
}

// Ubicación aproximada por IP que agrega Vercel en cada pedido (en la compu no viene).
export function geoFromReq(req) {
  const h = (n) => {
    const v = req.headers[n];
    if (!v) return null;
    try { return decodeURIComponent(String(v)); } catch { return String(v); }
  };
  const lat = parseFloat(h('x-vercel-ip-latitude'));
  const lng = parseFloat(h('x-vercel-ip-longitude'));
  const city = h('x-vercel-ip-city');
  if (!Number.isFinite(lat) && !city) return null;
  return {
    city,
    region: h('x-vercel-ip-country-region'),
    country: h('x-vercel-ip-country'),
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    at: new Date().toISOString(),
  };
}

// Lo que ve el invitado de su propia respuesta (sin rutas internas).
export function publicGuest(g) {
  if (!g) return null;
  return {
    id: g.id,
    name: g.name,
    asistencia: g.asistencia || null,
    bebida: g.bebida || null,
    noPet: Boolean(g.noPet),
    petName: g.pet ? g.pet.name : null,
    hasPetPhoto: Boolean(g.pet && g.pet.photo),
    petDesign: g.pet && g.pet.design ? g.pet.design : null,
    respondedAt: g.respondedAt || null,
  };
}

export const ASISTENCIA =['previa', 'boliche', 'ambas', 'no'];
export const BEBIDAS = ['cerveza', 'gin', 'fernet', 'vodka'];
