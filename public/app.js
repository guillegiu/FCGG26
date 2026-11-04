(function () {
  const E = window.EVENTO;
  const $ = (id) => document.getElementById(id);
  const ORDER = ['s-video', 's-nombre', 's-invitacion', 's-rsvp', 's-gracias'];
  const LABEL_ASIST = { previa: 'Solo previa', boliche: 'Solo boliche', ambas: 'A las dos', no: 'No puede ir' };
  const LABEL_BEBIDA = { cerveza: 'Cerveza', gin: 'Gin', fernet: 'Fernet', vodka: 'Vodka' };

  // ---------- almacenamiento local (tolerante a modo privado) ----------
  const local = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  };

  function newId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
  }

  let guestId = local.get('cumple.id') || newId();
  local.set('cumple.id', guestId);
  let guest = null;
  let petPhotoData = null;

  // ---------- textos ----------
  $('temporada').textContent = E.temporada;
  $('capitulo').textContent = E.capitulo;
  $('logo').textContent = E.nombre;
  $('lema').textContent = E.lema;
  $('footer').textContent = `${E.nombre} · ${E.temporada}`;
  $('presentacion').textContent = E.presentacion;
  if (E.fecha) { $('fecha').textContent = E.fecha; $('fecha').classList.remove('hidden'); }

  $('previa-hora').textContent = E.previa.hora;
  $('previa-titulo').textContent = E.previa.titulo;
  $('previa-detalle').textContent = E.previa.detalle;
  $('previa-direccion').textContent = `${E.previa.direccion}, ${E.previa.ciudad}`;
  const q = encodeURIComponent(E.previa.mapa);
  $('mapa').src = `https://www.google.com/maps?q=${q}&z=16&output=embed`;
  $('mapa-link').href = `https://www.google.com/maps/search/?api=1&query=${q}`;
  if (E.noEsAca) {
    $('noes-direccion').textContent = `${E.noEsAca.direccion}, ${E.noEsAca.ciudad}`;
    $('mapa-noes').src = `https://www.google.com/maps?q=${encodeURIComponent(E.noEsAca.mapa)}&z=17&output=embed`;
  } else {
    document.querySelector('.card.wrong').classList.add('hidden');
  }


  const plan = $('plan');
  for (const item of E.plan) {
    const li = document.createElement('li');
    const b = document.createElement('b');
    b.textContent = item.hora;
    const span = document.createElement('span');
    span.textContent = item.texto;
    li.append(b, span);
    plan.append(li);
  }

  // ---------- navegacion ----------
  function show(id) {
    for (const s of document.querySelectorAll('.screen')) s.classList.toggle('active', s.id === id);
    const idx = Math.min(ORDER.indexOf(id), 3);
    $('steps').querySelectorAll('span').forEach((el, i) => el.classList.toggle('on', i <= idx));
    document.querySelector('.brand').classList.toggle('hidden', id === 's-video');
    if (id !== 's-video') $('video').pause();
    if (id === 's-rsvp') fillForm();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.addEventListener('click', (e) => {
    const go = e.target.closest('[data-go]');
    if (go) show(go.dataset.go);
  });

  async function api(path, body) {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Algo falló, probá de nuevo');
    return data;
  }

  function setGuest(g) {
    guest = g;
    $('saludo').textContent = `Hola, ${g.name.split(' ')[0]}`;
  }

  // ---------- 1. nombre ----------
  $('f-nombre').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = $('nombre').value.trim();
    if (name.length < 2) { $('e-nombre').textContent = 'Poné tu nombre'; return; }
    $('b-nombre').disabled = true;
    $('e-nombre').textContent = '';
    try {
      const { guest: g } = await api('/api/visit', { id: guestId, name });
      local.set('cumple.name', g.name);
      setGuest(g);
      show(g.respondedAt ? 's-gracias' : 's-invitacion');
      if (g.respondedAt) renderGracias();
    } catch (err) {
      $('e-nombre').textContent = err.message;
    } finally {
      $('b-nombre').disabled = false;
    }
  });

  // ---------- 4. confirmacion ----------
  const form = $('f-rsvp');

  function updateBebida() {
    const a = form.asistencia.value;
    $('q-bebida').classList.toggle('hidden', a === 'no');
  }

  function updatePet() {
    const off = $('no-pet').checked;
    $('pet-name').disabled = off;
    document.querySelector('.pet-pick').style.opacity = off ? 0.4 : 1;
    document.querySelector('.pet-pick').style.pointerEvents = off ? 'none' : '';
  }

  form.addEventListener('change', (e) => {
    if (e.target.name === 'asistencia') updateBebida();
    if (e.target.id === 'no-pet') updatePet();
  });

  function fillForm() {
    if (!guest) return;
    if (guest.asistencia) form.asistencia.value = guest.asistencia;
    if (guest.bebida) form.bebida.value = guest.bebida;
    if (guest.petName && !$('pet-name').value) $('pet-name').value = guest.petName;
    $('no-pet').checked = guest.noPet;
    if (guest.hasPetPhoto && !petPhotoData) $('pet-photo-label').textContent = 'Ya subiste una foto (tocá para cambiarla)';
    updateBebida();
    updatePet();
  }

  // Achica la foto en el celular antes de subirla (max 1280 px, jpg).
  function compress(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const max = 1280;
        const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.round(img.naturalWidth * scale);
        const h = Math.round(img.naturalHeight * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No pude leer esa foto, probá con otra')); };
      img.src = url;
    });
  }

  $('pet-photo').addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    $('e-rsvp').textContent = '';
    $('pet-photo-label').textContent = 'Procesando...';
    try {
      petPhotoData = await compress(file);
      $('pet-thumb').style.backgroundImage = `url("${petPhotoData}")`;
      $('pet-thumb').textContent = '';
      $('pet-photo-label').textContent = 'Foto lista (tocá para cambiarla)';
    } catch (err) {
      petPhotoData = null;
      $('pet-photo-label').textContent = 'Elegir foto';
      $('e-rsvp').textContent = err.message;
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const asistencia = form.asistencia.value;
    const bebida = form.bebida.value;
    const noPet = $('no-pet').checked;
    const petName = $('pet-name').value.trim();
    const err = $('e-rsvp');
    err.textContent = '';
    if (!asistencia) { err.textContent = 'Contame a qué venís'; return; }
    if (asistencia !== 'no' && !bebida) { err.textContent = 'Elegí qué vas a tomar'; return; }
    if (!noPet && !petName && !petPhotoData && !guest.petName) {
      err.textContent = 'Poné el nombre de tu mascota o marcá que no tenés';
      return;
    }
    $('b-rsvp').disabled = true;
    $('b-rsvp').textContent = 'Enviando...';
    try {
      const { guest: g } = await api('/api/rsvp', {
        id: guestId,
        asistencia,
        bebida: asistencia === 'no' ? null : bebida,
        noPet,
        petName: noPet ? '' : petName,
        petPhoto: noPet ? null : petPhotoData,
      });
      petPhotoData = null;
      setGuest(g);
      renderGracias();
      show('s-gracias');
    } catch (ex) {
      err.textContent = ex.message;
    } finally {
      $('b-rsvp').disabled = false;
      $('b-rsvp').textContent = 'Enviar';
    }
  });

  // ---------- 5. gracias ----------
  function renderGracias() {
    const viene = guest.asistencia !== 'no';
    $('gracias-titulo').textContent = viene ? 'Nos vemos' : 'Te vamos a extrañar';
    $('gracias-texto').textContent = viene
      ? 'Tu respuesta quedó guardada. Si cambiás de plan, podés modificarla cuando quieras.'
      : 'Gracias por avisar. Si al final podés, cambiá tu respuesta acá mismo.';
    const rows = [['Nombre', guest.name], ['Viene a', LABEL_ASIST[guest.asistencia]]];
    if (guest.bebida) rows.push(['Toma', LABEL_BEBIDA[guest.bebida]]);
    rows.push(['Mascota', guest.noPet ? 'No tiene' : (guest.petName || 'Sin nombre') + (guest.hasPetPhoto ? ' (con foto)' : '')]);
    const ul = $('resumen');
    ul.textContent = '';
    for (const [k, v] of rows) {
      const li = document.createElement('li');
      const a = document.createElement('span');
      const b = document.createElement('span');
      a.textContent = k;
      b.textContent = v;
      li.append(a, b);
      ul.append(li);
    }
  }

  // ---------- arranque ----------
  // Siempre arranca con el video. Si ya vino antes, al seguir va directo a su parte.
  $('b-video').addEventListener('click', () => {
    if (!guest) { show('s-nombre'); $('nombre').focus(); return; }
    if (guest.respondedAt) { renderGracias(); show('s-gracias'); }
    else show('s-invitacion');
  });

  async function start() {
    show('s-video');
    // El botón "Seguir" aparece a los 30 s, para dar tiempo a ver el video.
    $('b-video').classList.add('hidden');
    setTimeout(() => $('b-video').classList.remove('hidden'), 30000);
    const savedName = local.get('cumple.name');
    if (!savedName) return;
    $('nombre').value = savedName;
    try {
      const { guest: g } = await api('/api/visit', { id: guestId, name: savedName });
      setGuest(g);
    } catch {}
  }

  start();
})();
