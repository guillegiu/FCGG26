# Invitación GUILLEGIU · Temporada 28

Página para los invitados: video de presentación, invitación (previa con mapa, boliche y plan de la noche), confirmación (previa / boliche / las dos / no puedo), bebida y foto de la mascota. En `/admin` se ve quién entró, quién respondió, totales y fotos.

## Archivos

- `public/config.js`: textos y datos de la noche (fecha, direcciones, horarios, plan). Lo único que hay que tocar para cambiar la invitación.
- `public/video.mp4` y `public/poster.jpg`: versión web del video (1280 px, unos 17 MB).
- `api/`: funciones de Vercel (`visit`, `rsvp`, `admin`, `photo`).
- `lib/store.js`: guarda en Vercel Blob si hay token y, si no, en la carpeta `.data/` de la compu.

## Probar en la compu

1. Crear `.env` con `ADMIN_PASSWORD=una-clave`.
2. `npm install` y `npm run dev`.
3. Abrir http://localhost:5240 y http://localhost:5240/admin

## Desplegar en Vercel

1. Importar la carpeta como proyecto (sin framework; `vercel.json` ya indica `public` como salida).
2. En el proyecto, Storage > Create > Blob, elegir acceso **Private** y conectarlo al proyecto. Eso agrega `BLOB_READ_WRITE_TOKEN` solo.
   - Si el store se crea como Public, agregar también la variable `BLOB_ACCESS=public`.
3. Agregar la variable `ADMIN_PASSWORD` con la clave del panel.
4. Volver a desplegar para que tome las variables.
