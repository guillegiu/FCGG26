// Guardado de datos. En Vercel usa Vercel Blob; en la compu (sin token) usa la carpeta .data/
import { promises as fs } from 'node:fs';
import path from 'node:path';

const USE_BLOB = Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
const ACCESS = process.env.BLOB_ACCESS === 'public' ? 'public' : 'private';
const LOCAL_DIR = path.join(process.cwd(), '.data');

let blobLib = null;
async function blob() {
  if (!blobLib) blobLib = await import('@vercel/blob');
  return blobLib;
}

function localPath(pathname) {
  const full = path.join(LOCAL_DIR, pathname);
  if (!full.startsWith(LOCAL_DIR)) throw new Error('ruta invalida');
  return full;
}

async function streamToBuffer(stream) {
  const chunks = [];
  const reader = stream.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  return Buffer.concat(chunks.map((c) => Buffer.from(c)));
}

export async function putFile(pathname, buffer, contentType) {
  if (USE_BLOB) {
    const { put } = await blob();
    await put(pathname, buffer, {
      access: ACCESS,
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType,
      cacheControlMaxAge: 60,
    });
    return;
  }
  const full = localPath(pathname);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, buffer);
}

export async function getFile(pathname) {
  if (USE_BLOB) {
    const { get } = await blob();
    const res = await get(pathname, { access: ACCESS, useCache: false });
    if (!res || res.statusCode !== 200) return null;
    return { buffer: await streamToBuffer(res.stream), contentType: res.blob.contentType };
  }
  try {
    const buffer = await fs.readFile(localPath(pathname));
    const ext = path.extname(pathname).toLowerCase();
    const contentType = ext === '.json' ? 'application/json' : ext === '.png' ? 'image/png' : 'image/jpeg';
    return { buffer, contentType };
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

export async function putJSON(pathname, data) {
  await putFile(pathname, Buffer.from(JSON.stringify(data)), 'application/json');
}

export async function getJSON(pathname) {
  const file = await getFile(pathname);
  return file ? JSON.parse(file.buffer.toString('utf8')) : null;
}

export async function listPaths(prefix) {
  if (USE_BLOB) {
    const { list } = await blob();
    const out = [];
    let cursor;
    do {
      const page = await list({ prefix, cursor, limit: 1000 });
      for (const b of page.blobs) out.push(b.pathname);
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    return out;
  }
  try {
    const dir = localPath(prefix);
    const names = await fs.readdir(dir);
    return names.map((n) => prefix + n);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

export async function removeFile(pathname) {
  if (USE_BLOB) {
    const { del } = await blob();
    await del(pathname);
    return;
  }
  await fs.rm(localPath(pathname), { force: true });
}
