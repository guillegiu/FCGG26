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
  let petDesign = null;

  // ---------- textos ----------
  $('temporada').textContent = E.temporada;
  $('capitulo').textContent = E.capitulo;
  $('logo').textContent = E.nombre;
  $('lema').textContent = E.lema;
  $('footer').textContent = `${E.nombre} · ${E.temporada}`;
  $('presentacion').textContent = E.presentacion;
  $('bebida-aviso').textContent = E.bebida || '';
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

  // El "Ej:" del nombre cambia segun la especie, eligiendo uno al azar.
  const EJEMPLOS = { gato: ['Musso', 'Toto'], perro: ['Yago', 'Roberta'] };
  let especieEj = null;
  const petEditor = Mascota.editor($('pet-editor'), null, (g) => {
    petDesign = g;
    if (g.especie !== especieEj) {
      especieEj = g.especie;
      const ops = EJEMPLOS[g.especie] || EJEMPLOS.gato;
      $('pet-name').placeholder = 'Ej: ' + ops[Math.floor(Math.random() * ops.length)];
    }
  });

  form.addEventListener('change', (e) => {
    if (e.target.name === 'asistencia') updateBebida();
  });

  function fillForm() {
    if (!guest) return;
    if (guest.asistencia) form.asistencia.value = guest.asistencia;
    if (guest.bebida) form.bebida.value = guest.bebida;
    if (guest.petName && !$('pet-name').value) $('pet-name').value = guest.petName;
    if (guest.petDesign) petEditor.set(guest.petDesign);
    updateBebida();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const asistencia = form.asistencia.value;
    const bebida = form.bebida.value;
    const petName = $('pet-name').value.trim();
    const err = $('e-rsvp');
    err.textContent = '';
    if (!asistencia) { err.textContent = 'Contame a qué venís'; return; }
    if (asistencia !== 'no' && !bebida) { err.textContent = 'Elegí qué vas a tomar'; return; }
    if (!petName) { err.textContent = 'Ponele nombre a tu mascota'; return; }
    $('b-rsvp').disabled = true;
    $('b-rsvp').textContent = 'Enviando...';
    try {
      const { guest: g } = await api('/api/rsvp', {
        id: guestId,
        asistencia,
        bebida: asistencia === 'no' ? null : bebida,
        petName,
        petDesign,
      });
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
    rows.push(['Mascota', guest.petName || 'Sin nombre']);
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
    if (guest.petDesign) {
      const li = document.createElement('li');
      li.className = 'pet-mini';
      li.style.justifyContent = 'center';
      li.innerHTML = Mascota.svg(guest.petDesign, 110);
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
    // El botón "Seguir" aparece a los 45 s, para dar tiempo a ver el video.
    $('b-video').classList.add('hidden');
    setTimeout(() => $('b-video').classList.remove('hidden'), 45000);
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
