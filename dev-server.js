// Servidor para probar en la compu: sirve public/ y las funciones de api/ como lo hace Vercel.
// Las respuestas se guardan en .data/ (no hace falta Vercel Blob).
import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const PORT = Number(process.env.PORT || 5240);
const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, 'public');

// Carga .env si existe (por ejemplo ADMIN_PASSWORD=...)
try {
  const env = await fs.readFile(path.join(ROOT, '.env'), 'utf8');
  for (const line of env.split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.mp4': 'video/mp4',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

async function serveStatic(req, res, pathname) {
  let file = path.join(PUBLIC, decodeURIComponent(pathname));
  if (!file.startsWith(PUBLIC)) return notFound(res);
  try {
    let stat = await fs.stat(file).catch(() => null);
    if (stat && stat.isDirectory()) file = path.join(file, 'index.html');
    else if (!stat) file += '.html';
    stat = await fs.stat(file);
    const type = TYPES[path.extname(file)] || 'application/octet-stream';
    const range = req.headers.range;
    if (range && type === 'video/mp4') {
      const [s, e] = range.replace('bytes=', '').split('-');
      const start = Number(s);
      const end = e ? Number(e) : stat.size - 1;
      res.writeHead(206, {
        'Content-Type': type,
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1,
      });
      const fh = await fs.open(file);
      fh.createReadStream({ start, end }).pipe(res).on('close', () => fh.close());
      return;
    }
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': stat.size, 'Accept-Ranges': 'bytes' });
    res.end(await fs.readFile(file));
  } catch {
    notFound(res);
  }
}

function notFound(res) {
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('no encontrado');
}

http
  .createServer(async (req, res) => {
    const { pathname } = new URL(req.url, 'http://localhost');
    const api = /^\/api\/([a-z]+)$/.exec(pathname);
    if (api) {
      const file = path.join(ROOT, 'api', `${api[1]}.js`);
      try {
        await fs.access(file);
      } catch {
        return notFound(res);
      }
      const mod = await import(pathToFileURL(file).href);
      return mod.default(req, res);
    }
    return serveStatic(req, res, pathname);
  })
  .listen(PORT, () => console.log(`Invitacion lista en http://localhost:${PORT}`));
