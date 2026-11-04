(function () {
  const $ = (id) => document.getElementById(id);
  const ASIST = { previa: 'Solo previa', boliche: 'Solo boliche', ambas: 'A las dos', no: 'No va' };
  const BEBIDAS = ['cerveza', 'gin', 'fernet', 'vodka'];
  const store = {
    get() { try { return sessionStorage.getItem('cumple.admin') || ''; } catch { return ''; } },
    set(v) { try { v ? sessionStorage.setItem('cumple.admin', v) : sessionStorage.removeItem('cumple.admin'); } catch {} },
  };

  let key = store.get();
  let guests = [];
  let tab = 'todos';

  const fmt = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };
  const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : '');
  const photoUrl = (g) => `/api/photo?id=${encodeURIComponent(g.id)}&key=${encodeURIComponent(key)}&v=${encodeURIComponent((g.pet && g.pet.updatedAt) || '')}`;

  const geoText = (geo) => (geo ? [geo.city, geo.region, geo.country].filter(Boolean).join(', ') || 'Sin datos' : '-');

  function el(tag, attrs, ...children) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === 'class') n.className = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    }
    for (const c of children) if (c != null) n.append(c);
    return n;
  }

  async function load() {
    const res = await fetch('/api/admin', { headers: { 'x-admin-key': key } });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) throw Object.assign(new Error('Clave incorrecta'), { auth: true });
    if (!res.ok) throw new Error(data.error || 'No se pudo cargar');
    guests = data.guests;
    render();
    $('updated').textContent = 'Actualizado ' + new Date().toLocaleTimeString('es-AR');
  }

  function showLogin(msg) {
    $('panel').classList.add('hidden');
    $('login').classList.remove('hidden');
    $('e-login').textContent = msg || '';
    $('pass').focus();
  }

  async function enter() {
    try {
      await load();
      $('login').classList.add('hidden');
      $('panel').classList.remove('hidden');
    } catch (err) {
      if (err.auth) { store.set(''); key = ''; }
      showLogin(err.message);
    }
  }

  $('f-login').addEventListener('submit', (e) => {
    e.preventDefault();
    key = $('pass').value;
    store.set(key);
    enter();
  });

  $('b-refresh').addEventListener('click', () => load().catch((e) => alert(e.message)));
  $('b-out').addEventListener('click', () => { store.set(''); key = ''; showLogin(); });
  $('b-csv').addEventListener('click', downloadCsv);
  // Copia las mascotas diseñadas como JSON (mismo formato que juegos-michi).
  $('b-json').addEventListener('click', async () => {
    const data = guests
      .filter((g) => g.pet && g.pet.design)
      .map((g) => ({ dueno: g.name, nombre: g.pet.name || '', ...g.pet.design }));
    const text = JSON.stringify(data, null, 2);
    const b = $('b-json');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const t = document.createElement('textarea');
      t.value = text;
      document.body.append(t);
      t.select();
      document.execCommand('copy');
      t.remove();
    }
    b.textContent = `Copiadas ${data.length} mascotas`;
    setTimeout(() => { b.textContent = 'Copiar mascotas (JSON)'; }, 2000);
  });
  $('tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]');
    if (!b) return;
    tab = b.dataset.tab;
    for (const x of $('tabs').children) x.classList.toggle('on', x === b);
    renderList();
  });

  function render() {
    const responded = guests.filter((g) => g.respondedAt);
    const count = (a) => responded.filter((g) => g.asistencia === a).length;
    const vienen = responded.filter((g) => g.asistencia !== 'no');
    const stats = [
      ['Entraron', guests.length, ''],
      ['Respondieron', responded.length, ''],
      ['Sin responder', guests.length - responded.length, 'red'],
      ['Solo previa', count('previa'), ''],
      ['Solo boliche', count('boliche'), ''],
      ['A las dos', count('ambas'), ''],
      ['En la previa', count('previa') + count('ambas'), 'red'],
      ['En el boliche', count('boliche') + count('ambas'), 'red'],
      ['No van', count('no'), ''],
      ['Mascotas', guests.filter((g) => g.pet).length, ''],
    ];
    const s = $('stats');
    s.textContent = '';
    for (const [label, n, cls] of stats) s.append(el('div', { class: 'stat ' + cls }, el('b', {}, String(n)), el('span', {}, label)));

    const bars = $('bars');
    bars.textContent = '';
    const max = Math.max(1, ...BEBIDAS.map((b) => vienen.filter((g) => g.bebida === b).length));
    for (const b of BEBIDAS) {
      const n = vienen.filter((g) => g.bebida === b).length;
      const fill = el('i');
      fill.style.width = (n / max) * 100 + '%';
      bars.append(el('div', { class: 'bar' }, el('span', {}, cap(b)), el('div', { class: 'track' }, fill), el('b', {}, String(n))));
    }
    renderList();
  }

  function zoom(src) {
    const z = el('div', { class: 'zoom', onclick: () => z.remove() }, el('img', { src, alt: '' }));
    document.body.append(z);
  }

  async function remove(g) {
    if (!confirm(`¿Borrar a ${g.name}? Se borra su respuesta y la foto de su mascota.`)) return;
    const res = await fetch('/api/admin?id=' + encodeURIComponent(g.id), { method: 'DELETE', headers: { 'x-admin-key': key } });
    if (!res.ok) return alert('No se pudo borrar');
    await load();
  }

  function renderList() {
    const box = $('lista');
    box.textContent = '';
    let rows = guests;
    if (tab === 'respondieron') rows = guests.filter((g) => g.respondedAt);
    if (tab === 'pendientes') rows = guests.filter((g) => !g.respondedAt);

    if (tab === 'mapa') {
      const pts = guests.filter((g) => g.geo && g.geo.lat != null && g.geo.lng != null);
      if (!pts.length) return box.append(el('div', { class: 'card empty' }, 'Todavía no hay ubicaciones. Se guardan al enviar el formulario (solo en Vercel, no en la compu).'));
      if (!window.L) return box.append(el('div', { class: 'card empty' }, 'No se pudo cargar el mapa.'));
      const div = el('div', { id: 'geo-map' });
      box.append(div, el('p', { class: 'muted small', style: 'margin-top:8px' }, 'Ubicación aproximada por IP: suele marcar la ciudad, no la casa. Con datos móviles puede salir otra ciudad.'));
      const map = L.map(div);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap' }).addTo(map);
      const bounds = [];
      pts.forEach((g, i) => {
        // separa un poco los pines que caen en el mismo punto
        const lat = g.geo.lat + ((i % 5) - 2) * 0.0015;
        const lng = g.geo.lng + (Math.floor(i / 5) % 5 - 2) * 0.0015;
        const pop = el('div', {}, el('b', {}, g.name), el('br'), geoText(g.geo), el('br'), ASIST[g.asistencia] || '');
        L.marker([lat, lng]).addTo(map).bindPopup(pop);
        bounds.push([lat, lng]);
      });
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
      return;
    }

    if (tab === 'mascotas') {
      const pets = guests.filter((g) => g.pet);
      if (!pets.length) return box.append(el('div', { class: 'card empty' }, 'Todavía nadie subió su mascota.'));
      const grid = el('div', { class: 'gallery' });
      for (const g of pets) {
        let media;
        if (g.pet.design) {
          media = el('div', { class: 'noimg' });
          media.innerHTML = Mascota.svg(g.pet.design, 140);
        } else if (g.pet.photo) {
          media = el('img', { src: photoUrl(g), alt: g.pet.name || 'Mascota', loading: 'lazy', onclick: () => zoom(photoUrl(g)) });
        } else media = el('div', { class: 'noimg' }, 'Sin diseño');
        grid.append(el('div', { class: 'pet' }, media, el('div', { class: 't' }, el('b', {}, g.pet.name || 'Sin nombre'), el('span', {}, 'de ' + g.name))));
      }
      return box.append(grid);
    }

    if (!rows.length) return box.append(el('div', { class: 'card empty' }, 'No hay nadie en esta lista.'));
    const tbody = el('tbody');
    for (const g of rows) {
      const asist = g.respondedAt
        ? el('span', { class: 'tag ' + g.asistencia }, ASIST[g.asistencia])
        : el('span', { class: 'tag pend' }, 'Sin responder');
      let pet = '-';
      if (g.noPet) pet = 'No tiene';
      else if (g.pet) {
        pet = el('span', {});
        if (g.pet.design) {
          const m = el('span', { class: 'thumb', style: 'display:inline-block;border:0' });
          m.innerHTML = Mascota.svg(g.pet.design, 40);
          pet.append(m);
        } else if (g.pet.photo) pet.append(el('img', { class: 'thumb', src: photoUrl(g), alt: '', loading: 'lazy', onclick: () => zoom(photoUrl(g)) }));
        pet.append(g.pet.name || 'Sin nombre');
      }
      tbody.append(
        el('tr', {},
          el('td', {}, el('b', {}, g.name)),
          el('td', {}, asist),
          el('td', {}, g.bebida ? cap(g.bebida) : '-'),
          el('td', {}, pet),
          el('td', {}, g.geo && g.geo.lat != null
            ? el('a', { class: 'link', style: 'margin:0', target: '_blank', rel: 'noopener', href: `https://www.google.com/maps?q=${g.geo.lat},${g.geo.lng}` }, geoText(g.geo))
            : geoText(g.geo)),
          el('td', {}, fmt(g.firstSeen)),
          el('td', {}, fmt(g.lastSeen)),
          el('td', {}, String(g.visits || 0)),
          el('td', {}, el('button', { class: 'del', type: 'button', onclick: () => remove(g) }, 'Borrar')),
        ),
      );
    }
    const head = el('tr', {}, ...['Nombre', 'Viene a', 'Toma', 'Mascota', 'Ubicación', 'Entró', 'Última vez', 'Visitas', ''].map((h) => el('th', {}, h)));
    box.append(el('div', { class: 'table-wrap' }, el('table', {}, el('thead', {}, head), tbody)));
  }

  function downloadCsv() {
    const esc = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const lines = [['Nombre', 'Viene a', 'Toma', 'Mascota', 'Tiene mascota', 'Ubicación', 'Latitud', 'Longitud', 'Entró', 'Última vez', 'Visitas', 'Respondió'].map(esc).join(',')];
    for (const g of guests) {
      lines.push([
        g.name,
        g.respondedAt ? ASIST[g.asistencia] : 'Sin responder',
        g.bebida ? cap(g.bebida) : '',
        g.pet ? g.pet.name || '' : '',
        g.noPet ? 'No' : g.pet ? 'Sí' : '',
        g.geo ? geoText(g.geo) : '',
        g.geo && g.geo.lat != null ? g.geo.lat : '',
        g.geo && g.geo.lng != null ? g.geo.lng : '',
        g.firstSeen || '',
        g.lastSeen || '',
        g.visits || 0,
        g.respondedAt || '',
      ].map(esc).join(','));
    }
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = el('a', { href: URL.createObjectURL(blob), download: 'invitados-guillegiu.csv' });
    document.body.append(a);
    a.click();
    a.remove();
  }

  if (key) enter();
  else showLogin();
})();
