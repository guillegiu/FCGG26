// Mascota en SVG estilo chibi (gato o perro), portada de juegos-michi.
// Expone window.Mascota con las opciones, el dibujo y el editor.
(function () {
  const ESPECIES = [{ id: 'gato', nombre: 'Gato' }, { id: 'perro', nombre: 'Perro' }];
  const COLORES = [
    { id: 'naranja', hex: '#f2a65a' }, { id: 'gris', hex: '#9aa3ad' }, { id: 'negro', hex: '#3b3740' },
    { id: 'blanco', hex: '#f4f1ea' }, { id: 'crema', hex: '#efd9b4' }, { id: 'marron', hex: '#9b6a45' },
    { id: 'azul', hex: '#7f9cc4' }, { id: 'rosa', hex: '#eaa6b8' }, { id: 'verde', hex: '#9cc79a' },
    { id: 'lila', hex: '#b9a3d9' },
  ];
  const PATRONES = [
    { id: 'liso', nombre: 'Liso' }, { id: 'atigrado', nombre: 'Atigrado' }, { id: 'manchas', nombre: 'Manchas' },
    { id: 'frac', nombre: 'Frac' }, { id: 'tricolor', nombre: 'Tricolor' },
  ];
  const OJOS = [
    { id: 'verde', hex: '#5fb36b' }, { id: 'ambar', hex: '#e0a92e' }, { id: 'celeste', hex: '#59a9d9' },
    { id: 'marron', hex: '#7a4e2d' }, { id: 'violeta', hex: '#8f6ad1' },
  ];
  const ACCESORIOS = [
    { id: 'ninguno', nombre: 'Nada' }, { id: 'mono', nombre: 'Moño' }, { id: 'gorro', nombre: 'Gorro' },
    { id: 'anteojos', nombre: 'Anteojos' }, { id: 'corona', nombre: 'Corona' }, { id: 'bufanda', nombre: 'Bufanda' },
    { id: 'vincha', nombre: 'Vincha' },
  ];
  const LISTAS = { especie: ESPECIES, color: COLORES, color2: COLORES, patron: PATRONES, ojos: OJOS, accesorio: ACCESORIOS };

  const elegir = (l) => l[Math.floor(Math.random() * l.length)].id;
  function azar() {
    const color = elegir(COLORES);
    let color2 = elegir(COLORES);
    if (color2 === color) color2 = color === 'blanco' ? 'negro' : 'blanco';
    return {
      especie: Math.random() < 0.6 ? 'gato' : 'perro',
      color, color2, patron: elegir(PATRONES), ojos: elegir(OJOS), accesorio: elegir(ACCESORIOS),
    };
  }
  function normalizar(g) {
    const base = azar();
    const out = {};
    for (const k of Object.keys(LISTAS)) out[k] = g && LISTAS[k].some((o) => o.id === g[k]) ? g[k] : base[k];
    return out;
  }

  const hex = (l, id) => (l.find((c) => c.id === id) || l[0]).hex;
  function tono(h, f) {
    const n = parseInt(h.slice(1), 16);
    const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f));
    return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
  }
  const T = '#2b2233';
  let uidN = 0;

  function svg(gIn, size = 96) {
    const g = normalizar(gIn);
    const uid = 'm' + (++uidN);
    const perro = g.especie === 'perro';
    const base = hex(COLORES, g.color);
    const sec = hex(COLORES, g.color2);
    const borde = tono(base, -0.45);
    const raya = tono(base, -0.3);
    const ojos = hex(OJOS, g.ojos);
    const CAB = perro
      ? 'M50 18 C72 18 80 32 80 46 C80 62 68 72 50 72 C32 72 20 62 20 46 C20 32 28 18 50 18 Z'
      : 'M50 20 C73 20 81 33 81 47 C81 62 68 71 50 71 C32 71 19 62 19 47 C19 33 27 20 50 20 Z';
    const cola = perro ? 'M69 82 Q82 74 80 64' : 'M68 86 Q90 86 86 66 Q84 58 78 60';
    const p = [];
    p.push(`<defs><clipPath id="c${uid}"><path d="${CAB}"/></clipPath><clipPath id="b${uid}"><ellipse cx="50" cy="80" rx="21" ry="16"/></clipPath></defs>`);
    p.push('<ellipse cx="50" cy="96" rx="24" ry="3.5" fill="#000" opacity="0.18"/>');
    p.push(`<path d="${cola}" stroke="${borde}" stroke-width="${perro ? 9 : 8}" fill="none" stroke-linecap="round"/>`);
    p.push(`<path d="${cola}" stroke="${base}" stroke-width="${perro ? 6 : 5}" fill="none" stroke-linecap="round"/>`);
    p.push(`<ellipse cx="50" cy="80" rx="21" ry="16" fill="${base}" stroke="${borde}" stroke-width="2.2"/>`);
    p.push(`<g clip-path="url(#b${uid})">`);
    if (g.patron === 'atigrado') p.push(`<g stroke="${raya}" stroke-width="3" stroke-linecap="round"><path d="M31 74 L38 76"/><path d="M30 82 L38 83"/><path d="M69 74 L62 76"/><path d="M70 82 L62 83"/></g>`);
    if (g.patron === 'manchas') p.push(`<g fill="${sec}"><circle cx="36" cy="78" r="5"/><circle cx="62" cy="86" r="6"/></g>`);
    if (g.patron === 'frac' || g.patron === 'tricolor') p.push(`<ellipse cx="50" cy="86" rx="10" ry="13" fill="${g.patron === 'frac' ? sec : '#f4f1ea'}"/>`);
    if (g.patron === 'tricolor') p.push(`<circle cx="66" cy="76" r="8" fill="${sec}"/>`);
    p.push('</g>');
    p.push(`<ellipse cx="41" cy="94" rx="6" ry="3.6" fill="${base}" stroke="${borde}" stroke-width="2"/><ellipse cx="59" cy="94" rx="6" ry="3.6" fill="${base}" stroke="${borde}" stroke-width="2"/>`);
    if (g.accesorio === 'bufanda') p.push(`<g><path d="M30 68 Q50 78 70 68 L70 74 Q50 84 30 74 Z" fill="#d9534f" stroke="${T}" stroke-width="1.5"/><path d="M58 74 L62 90 L55 90 L53 76 Z" fill="#d9534f" stroke="${T}" stroke-width="1.5"/></g>`);
    if (perro) {
      const o = tono(base, -0.2);
      p.push(`<ellipse cx="22" cy="44" rx="8" ry="17" transform="rotate(18 22 44)" fill="${o}" stroke="${borde}" stroke-width="2.2"/><ellipse cx="78" cy="44" rx="8" ry="17" transform="rotate(-18 78 44)" fill="${o}" stroke="${borde}" stroke-width="2.2"/>`);
    } else {
      p.push(`<g stroke-linejoin="round"><path d="M22 36 L25 8 L45 23 Z" fill="${g.patron === 'tricolor' ? sec : base}" stroke="${borde}" stroke-width="2.2"/><path d="M78 36 L75 8 L55 23 Z" fill="${base}" stroke="${borde}" stroke-width="2.2"/><path d="M27 31 L28 15 L39 24 Z" fill="#f3b3c2"/><path d="M73 31 L72 15 L61 24 Z" fill="#f3b3c2"/></g>`);
    }
    p.push(`<path d="${CAB}" fill="${base}" stroke="${borde}" stroke-width="2.2"/>`);
    p.push(`<g clip-path="url(#c${uid})">`);
    if (g.patron === 'atigrado') p.push(`<g stroke="${raya}" stroke-width="3" stroke-linecap="round" fill="none"><path d="M50 21 L50 31"/><path d="M42 22 L44 30"/><path d="M58 22 L56 30"/><path d="M19 45 L28 47"/><path d="M81 45 L72 47"/><path d="M20 53 L28 53"/><path d="M80 53 L72 53"/></g>`);
    if (g.patron === 'manchas') p.push(`<g fill="${sec}"><circle cx="30" cy="30" r="8"/><circle cx="70" cy="62" r="7"/><circle cx="64" cy="27" r="4"/></g>`);
    if (g.patron === 'tricolor') p.push(`<circle cx="28" cy="34" r="15" fill="${sec}"/><circle cx="74" cy="30" r="10" fill="${tono(base, -0.35)}"/>`);
    if (g.patron === 'frac' || perro) p.push(`<ellipse cx="50" cy="62" rx="16" ry="12" fill="${g.patron === 'frac' ? sec : tono(base, 0.45)}"/>`);
    p.push('</g>');
    // ojos abiertos
    p.push(`<ellipse cx="37" cy="44" rx="6.2" ry="7.4" fill="${T}"/><ellipse cx="63" cy="44" rx="6.2" ry="7.4" fill="${T}"/><ellipse cx="37" cy="45" rx="4.4" ry="5.6" fill="${ojos}"/><ellipse cx="63" cy="45" rx="4.4" ry="5.6" fill="${ojos}"/><ellipse cx="37" cy="45.5" rx="2" ry="4" fill="${T}"/><ellipse cx="63" cy="45.5" rx="2" ry="4" fill="${T}"/><circle cx="35" cy="41.5" r="1.9" fill="#fff"/><circle cx="61" cy="41.5" r="1.9" fill="#fff"/>`);
    p.push(perro
      ? `<ellipse cx="50" cy="56" rx="5" ry="3.6" fill="${T}"/>`
      : `<path d="M46.5 54 L53.5 54 L50 58 Z" fill="#e57d95" stroke="${T}" stroke-width="1" stroke-linejoin="round"/>`);
    p.push(`<path d="M43 60 Q50 68 57 60 Z" fill="#c0465f" stroke="${T}" stroke-width="1.6" stroke-linejoin="round"/>`);
    if (!perro) p.push(`<g stroke="${T}" stroke-width="1.1" stroke-linecap="round" opacity="0.7"><path d="M36 57 L22 55"/><path d="M36 60 L23 62"/><path d="M64 57 L78 55"/><path d="M64 60 L77 62"/></g>`);
    p.push('<ellipse cx="32" cy="60" rx="4.5" ry="2.6" fill="#f08aa3" opacity="0.45"/><ellipse cx="68" cy="60" rx="4.5" ry="2.6" fill="#f08aa3" opacity="0.45"/>');
    p.push(accesorio(g.accesorio));
    return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" overflow="visible" aria-hidden="true">${p.join('')}</svg>`;
  }

  function accesorio(t) {
    switch (t) {
      case 'mono': return `<g transform="translate(66 22) rotate(18)" stroke="${T}" stroke-width="1.4" stroke-linejoin="round"><path d="M0 0 L-11 -7 L-11 7 Z" fill="#e8577a"/><path d="M0 0 L11 -7 L11 7 Z" fill="#e8577a"/><circle r="3.4" fill="#f27c98"/></g>`;
      case 'gorro': return `<g stroke="${T}" stroke-width="1.5" stroke-linejoin="round"><path d="M37 24 L52 -2 L64 23 Z" fill="#5b8def"/><path d="M41 17 L60 15" stroke="#ffd34d" stroke-width="3"/><path d="M46 8 L57 7" stroke="#ffd34d" stroke-width="3"/><circle cx="52" cy="-1" r="4" fill="#ffd34d"/></g>`;
      case 'anteojos': return `<g stroke="${T}" stroke-width="2.2" fill="rgba(255,255,255,0.18)"><circle cx="37" cy="44" r="9"/><circle cx="63" cy="44" r="9"/><path d="M46 43 Q50 40 54 43" fill="none"/></g>`;
      case 'corona': return `<g stroke="${T}" stroke-width="1.5" stroke-linejoin="round"><path d="M35 24 L36 8 L43 16 L50 4 L57 16 L64 8 L65 24 Z" fill="#ffcf3f"/><circle cx="50" cy="17" r="2.4" fill="#e8577a"/></g>`;
      case 'vincha': {
        const flores = [0, 72, 144, 216, 288].map((a) => `<circle cx="${(Math.cos(a * Math.PI / 180) * 4).toFixed(2)}" cy="${(Math.sin(a * Math.PI / 180) * 4).toFixed(2)}" r="3.2" fill="#fff" stroke="${T}" stroke-width="1"/>`).join('');
        return `<g><path d="M23 32 Q50 12 77 32" fill="none" stroke="${T}" stroke-width="7" stroke-linecap="round"/><path d="M23 32 Q50 12 77 32" fill="none" stroke="#3fc1a5" stroke-width="4.5" stroke-linecap="round"/><g transform="translate(30 25)">${flores}<circle r="2.4" fill="#ffcf3f"/></g></g>`;
      }
      default: return '';
    }
  }

  // Editor: vista previa + selectores. onChange recibe el diseño nuevo.
  function editor(root, inicial, onChange) {
    let g = normalizar(inicial);
    const filas = [
      ['Especie', 'especie', 'chip'], ['Pelaje', 'color', 'color'], ['Dibujo', 'patron', 'chip'],
      ['Color del dibujo', 'color2', 'color'], ['Ojos', 'ojos', 'color'], ['Accesorio', 'accesorio', 'chip'],
    ];
    function pintar() {
      root.textContent = '';
      const prev = document.createElement('div');
      prev.className = 'ed-preview';
      prev.innerHTML = svg(g, 150);
      const az = document.createElement('button');
      az.type = 'button';
      az.className = 'ed-azar';
      az.textContent = 'Al azar';
      az.onclick = () => { g = azar(); onChange(g); pintar(); };
      prev.append(az);
      root.append(prev);
      const ops = document.createElement('div');
      ops.className = 'ed-ops';
      for (const [titulo, k, tipo] of filas) {
        if (k === 'color2' && (g.patron === 'liso' || g.patron === 'atigrado')) continue;
        const fila = document.createElement('div');
        fila.className = 'ed-fila';
        const t = document.createElement('div');
        t.className = 'ed-titulo';
        t.textContent = titulo;
        const box = document.createElement('div');
        box.className = 'ed-opciones';
        for (const o of LISTAS[k]) {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = (tipo === 'color' ? 'ed-color' : 'ed-chip') + (g[k] === o.id ? ' on' : '');
          if (tipo === 'color') { b.style.background = o.hex; b.setAttribute('aria-label', o.id); }
          else b.textContent = o.nombre;
          b.onclick = () => { g = { ...g, [k]: o.id }; onChange(g); pintar(); };
          box.append(b);
        }
        fila.append(t, box);
        ops.append(fila);
      }
      root.append(ops);
    }
    pintar();
    onChange(g);
    return { get: () => g, set: (n) => { g = normalizar(n); pintar(); } };
  }

  window.Mascota = { svg, editor, azar, normalizar };
})();
