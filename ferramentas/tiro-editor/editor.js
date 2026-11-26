/* ==========================================================================
   EDITOR DE MAPAS DO TIRO (2026-11-26, pedido do Thiago: "um desenvolvedor de mapas parecido com o TabbaTracks").
   Abre com /tiro/?editor=1 por cima do jogo, com uma cena 3D própria (o mapa de verdade só se monta no "Jogar"):
   - câmera livre: botão direito arrastado olha, WASD anda, Q/E desce e sobe, Shift corre, roda do mouse muda a velocidade;
   - catálogo à esquerda: peças básicas (chão, parede, caixa, escada, luz), marcadores (nascer, pontos A/B/C, mecha) e todos
     os prefabs e objetos do jogo, desenhados de verdade (a malha do prefab, com as cores dele);
   - clique coloca a peça escolhida (Esc para de colocar); clique numa peça seleciona; arrastar move;
     setas e PageUp/PageDown empurram 25 cm (Shift: 1 m); R gira 90° (Shift+R: 15°, só prefab e objeto);
     Delete apaga; Ctrl+D duplica; Ctrl+Z desfaz; F centraliza a câmera na peça;
   - painel à direita: posição, tamanho, giro, matéria, cor e colisão da peça selecionada;
   - Salvar grava em ferramentas/tiro-mapas/editor/<id>.json pelo servidor do PC ("Editor de mapas do Tiro.bat"); no site, Baixar;
   - Jogar monta o mapa de verdade (mapa-json.js) e começa uma partida solo com bots. O rascunho fica guardado neste navegador.
   ========================================================================== */
const ED = { on: false, J: null, items: [], sel: null, tpl: null, ghost: null, hist: [], cam: { x: 0, y: 14, z: 30, yaw: 0, pitch: -0.45, v: 10 }, keys: new Set(), pf: new Map(), drag: null, snap: 0.25 };
const ED_BASICO = [
  { rot: 'Chão 4 x 4 (madeira)', P: { t: 'caixa', s: [4, 0.3, 4], m: 'wood', cor: [0.66, 0.46, 0.3] }, oy: -0.3 },
  { rot: 'Chão 8 x 8 (concreto)', P: { t: 'caixa', s: [8, 0.3, 8], m: 'concrete', cor: [0.75, 0.74, 0.72] }, oy: -0.3 },
  { rot: 'Parede 4 x 3', P: { t: 'caixa', s: [4, 3, 0.2], m: 'paint', cor: [0.95, 0.95, 0.94] } },
  { rot: 'Mureta 2 x 1 (cover baixo)', P: { t: 'caixa', s: [2, 1.05, 0.3], m: 'paint', cor: [0.9, 0.9, 0.9] } },
  { rot: 'Bloco 1 x 2 x 1 (cover alto)', P: { t: 'caixa', s: [1, 2, 1], m: 'steel', cor: [0.25, 0.27, 0.3] } },
  { rot: 'Coluna', P: { t: 'caixa', s: [0.5, 3, 0.5], m: 'paint', cor: [0.95, 0.95, 0.94] } },
  { rot: 'Teto / laje 4 x 4', P: { t: 'caixa', s: [4, 0.3, 4], m: 'paint', cor: [0.95, 0.95, 0.94] } },
  { rot: 'Parede invisível 4 x 4', P: { t: 'caixa', s: [4, 4, 0.1], m: 'glass', cor: [0.6, 0.8, 1], col: true, inv: true } },
  { rot: 'Escada (sobe 1,5 m)', P: { t: 'escada', s: [2, 1.5, 3], m: 'wood', cor: [0.66, 0.46, 0.3] } },
  { rot: 'Escada (sobe 3 m)', P: { t: 'escada', s: [2, 3, 5.5], m: 'wood', cor: [0.66, 0.46, 0.3] } },
  { rot: 'Luz', P: { t: 'luz', forca: 1.4, raio: 7, cor: [1, 0.85, 0.65] } },
  { rot: 'Grafite (texto na parede)', P: { t: 'grafite', s: [3, 1.2], texto: 'VILA DO TABBA', estilo: 'bomb', cor: [0.98, 0.8, 0.1], borda: [0.08, 0.08, 0.1] } },
  { rot: '▲ Nascer (time Alpha)', P: { t: 'nascer' } },
  { rot: '◆ Ponto de dominação', P: { t: 'dom' } },
  { rot: '■ Queda do mecha', P: { t: 'mecha' } },
];
const edEl = (tag, css, html) => { const e = document.createElement(tag); if (css) e.style.cssText = css; if (html != null) e.innerHTML = html; return e; };
const edSnap = (v, s = ED.snap) => Math.round(v / s) * s;
const edClone = (o) => JSON.parse(JSON.stringify(o));

/* ---------- modelo: o .json <-> as peças da cena ---------- */
const ED_EXTRA = ['poi', 'zonas', 'sniper', 'som', 'tipo', 'capa'];
function edDoJson(J) {
  const pecas = (J.pecas || []).map(edClone);
  for (const [x, z] of J.nascer || []) pecas.push({ t: 'nascer', p: [x, 0, z] });
  for (const [x, z, y] of J.dom || []) pecas.push({ t: 'dom', p: [x, y || 0, z] }); // 3º número: a altura do piso (morro, laje)
  for (const [x, z] of J.mecha || []) pecas.push({ t: 'mecha', p: [x, 0, z] });
  // campos que o editor não mexe (pontos dos bots, zonas, sniper, som, tipo, capa) passam direto de volta para o .json
  const extra = {}; for (const k of ED_EXTRA) if (J[k] !== undefined) extra[k] = edClone(J[k]);
  return { meta: { id: J.id, nome: J.nome || J.id, ceu: J.ceu || 'meltem', mar: J.mar || null, tag: J.tag || '', desc: J.desc || '', extra }, pecas };
}
function edParaJson() {
  const m = ED.J.meta, pecas = [], nascer = [], dom = [], mecha = [];
  for (const P of ED.J.pecas) {
    const xz = [+P.p[0].toFixed(2), +P.p[2].toFixed(2)];
    if (P.t === 'nascer') nascer.push(xz); else if (P.t === 'dom') dom.push(P.p[1] > 0.05 ? [...xz, +P.p[1].toFixed(2)] : xz); else if (P.t === 'mecha') mecha.push(xz);
    else { const Q = edClone(P); Q.p = Q.p.map((v) => +v.toFixed(3)); if (Q.s) Q.s = Q.s.map((v) => +v.toFixed(3)); pecas.push(Q); }
  }
  return Object.assign({ id: m.id, nome: m.nome, tag: m.tag || undefined, desc: m.desc || undefined, ceu: m.ceu, mar: m.mar, pecas, nascer, dom: dom.slice(0, 3), mecha: mecha.slice(0, 3) }, edClone(m.extra || {}));
}
function edNovo(nome = 'Mapa novo') {
  return { meta: { id: edIdDe(nome), nome, ceu: 'meltem', mar: null, tag: '', desc: '' },
    pecas: [{ t: 'caixa', p: [0, -0.3, 0], s: [16, 0.3, 40], m: 'concrete', cor: [0.75, 0.74, 0.72] }, ...[[-3, 16], [0, 16], [3, 16], [-1.5, 18], [1.5, 18]].map(([x, z]) => ({ t: 'nascer', p: [x, 0, z] }))] };
}
function edIdDe(nome) {
  let id = String(nome).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'mapa';
  if (MAP_DEFS[id] && !MAP_DEFS[id].editor) id += '-ed';
  return id;
}
const edGuardar = () => { try { localStorage.setItem('tiro_editor_rascunho', JSON.stringify(edParaJson())); } catch (e) { /* sem espaço */ } };
function edMudou(semHist) { if (!semHist) { ED.hist.push(JSON.stringify(ED.J)); if (ED.hist.length > 80) ED.hist.shift(); } edGuardar(); edRedesenhar(); edPainel(); }
function edAntes() { ED.hist.push(JSON.stringify(ED.J)); if (ED.hist.length > 80) ED.hist.shift(); }

/* ---------- malhas da cena do editor ---------- */
function edPrefabGrupo(key, fazer) {
  if (!ED.pf.has(key)) {
    let g = null;
    try {
      const p = fazer(); g = new THREE.Group();
      for (const part of p.parts.values()) {
        const b = part.g; if (!b.ni) continue;
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(b.P.slice(0, b.nv * 3), 3));
        geo.setAttribute('normal', new THREE.BufferAttribute(b.N.slice(0, b.nv * 3), 3));
        geo.setAttribute('color', new THREE.BufferAttribute(b.C.slice(0, b.nv * 3), 3));
        geo.setIndex(new THREE.BufferAttribute(b.I.slice(0, b.ni), 1));
        g.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, metalness: 0.05 })));
      }
      if (!g.children.length) g = null;
    } catch (e) { g = null; }
    ED.pf.set(key, g);
  }
  const g = ED.pf.get(key); return g ? g.clone() : null;
}
const edCorHex = (c) => new THREE.Color().setRGB(c[0], c[1], c[2]);
/* ---------- superfícies: miniaturas da galeria e textura na cena do editor ----------
   As fotos do jogo vêm de tex/*.js (fetchTexPack); as nossas e as que o jogo desenha por shader ganham um desenho parecido. */
const ED_TEXP = new Map();
function edTexDesenho(k) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const fundo = { paint: '#d8d8d4', carpaint: '#c9ccd2', glass: '#7fa6b8', dark: '#232427', plastic: '#e8e8e6', rubber: '#3a3b3d', rug: '#8a2b26', tiles: '#cfc8b8',
    wood: '#9a7048', timber: '#8a6240', corrugated: '#9a9ea2', edChapa: '#7d8084', edListras: '#f0b81a', edAzulejo: '#eef2f4', edXadrez: '#dcdad4' }[k] || '#999';
  g.fillStyle = fundo; g.fillRect(0, 0, 128, 128);
  if (k === 'edListras') { g.fillStyle = '#111'; for (let i = -4; i < 8; i++) { g.beginPath(); g.moveTo(i * 26, 128); g.lineTo(i * 26 + 13, 128); g.lineTo(i * 26 + 141, 0); g.lineTo(i * 26 + 128, 0); g.fill(); } }
  else if (k === 'edAzulejo' || k === 'tiles') { g.strokeStyle = k === 'tiles' ? '#8d8676' : '#9a9a96'; g.lineWidth = 2; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 16, 0); g.lineTo(i * 16, 128); g.moveTo(0, i * 16); g.lineTo(128, i * 16); g.stroke(); } }
  else if (k === 'edXadrez') { g.fillStyle = '#1b1b1d'; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) g.fillRect(i * 32, j * 32, 32, 32); }
  else if (k === 'edChapa') { g.fillStyle = '#a3a6aa'; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.save(); g.translate(i * 16 + 8, j * 16 + 8); g.rotate((i + j) % 2 ? 0.785 : -0.785); g.fillRect(-6, -1.5, 12, 3); g.restore(); } }
  else if (k === 'wood' || k === 'timber') { g.strokeStyle = '#5e4128'; for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(0, i * 16); g.lineTo(128, i * 16); g.stroke(); } }
  else if (k === 'corrugated') { for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#b4b8bc' : '#7e8286'; g.fillRect(i * 8, 0, 8, 128); } }
  else if (k === 'rug') { g.strokeStyle = '#d9b46a'; g.lineWidth = 6; g.strokeRect(14, 14, 100, 100); }
  else if (k === 'carpaint' || k === 'glass') { const gr = g.createLinearGradient(0, 0, 128, 128); gr.addColorStop(0, '#fff8'); gr.addColorStop(0.5, '#fff0'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }
  return c.toDataURL();
}
function edTexUrl(k) {
  if (!ED_TEXP.has(k)) ED_TEXP.set(k, (TEX_PACKS[k] ? fetchTexPack(k).then((d) => (d && d.map) || null).catch(() => null) : Promise.resolve(null)).then((u) => u || edTexDesenho(k)));
  return ED_TEXP.get(k);
}
const ED_TEX3 = new Map();
function edTex3(k) {
  if (!ED_TEX3.has(k)) { const t = new THREE.Texture(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.encoding = THREE.sRGBEncoding; ED_TEX3.set(k, t);
    edTexUrl(k).then((u) => { const im = new Image(); im.onload = () => { t.image = im; t.needsUpdate = true; }; im.src = u; }); }
  return ED_TEX3.get(k);
}
// caixa com o uv em metros (cada face do tamanho dela), como no jogo
function edCaixaGeo(w, h, d, S) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let i = 0; i < uv.count; i++) { const f = dims[Math.floor(i / 4)]; uv.setXY(i, (uv.getX(i) * f[0]) / S, (uv.getY(i) * f[1]) / S); }
  return g;
}
const edEscalaTex = (P) => (TEXSCALE[P.m] || 2) * (P.tx || 1);
function edMalha(P) {
  let o;
  if (P.t === 'caixa') {
    const B = edCaixaBox(P), m = new THREE.MeshStandardMaterial({ color: edCorHex(P.cor || [0.9, 0.9, 0.9]), map: edTex3(P.m || 'paint'), roughness: 0.8, transparent: P.inv || P.col === false, opacity: P.inv ? 0.25 : P.col === false ? 0.6 : 1 });
    o = new THREE.Mesh(edCaixaGeo(B.x1 - B.x0, B.y1 - B.y0, B.z1 - B.z0, edEscalaTex(P)), m); o.position.set((B.x0 + B.x1) / 2, (B.y0 + B.y1) / 2, (B.z0 + B.z1) / 2);
    return o;
  }
  if (P.t === 'escada') {
    const B = edCaixaBox(P), q = B.q, axis = q % 2 ? 'x' : 'z', sobe = q < 2, h = B.y1 - B.y0, n = Math.max(2, Math.round(h / 0.2)), dh = h / n;
    o = new THREE.Group(); const mat = new THREE.MeshStandardMaterial({ color: edCorHex(P.cor || [0.66, 0.46, 0.3]), map: edTex3(P.m || 'wood'), roughness: 0.8 });
    const a0 = axis === 'z' ? B.z0 : B.x0, a1 = axis === 'z' ? B.z1 : B.x1;
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n, top = dh * (i + 1), s0 = sobe ? lerp(a0, a1, t0) : lerp(a1, a0, t1), s1 = sobe ? lerp(a0, a1, t1) : lerp(a1, a0, t0);
      const w = axis === 'z' ? B.x1 - B.x0 : Math.abs(s1 - s0), d = axis === 'z' ? Math.abs(s1 - s0) : B.z1 - B.z0;
      const m = new THREE.Mesh(edCaixaGeo(w, top, d, edEscalaTex(P)), mat);
      m.position.set(axis === 'z' ? (B.x0 + B.x1) / 2 : (s0 + s1) / 2, B.y0 + top / 2, axis === 'z' ? (s0 + s1) / 2 : (B.z0 + B.z1) / 2); o.add(m);
    }
    return o;
  }
  if (P.t === 'grafite') return edGrafiteMalha(P);
  const marcador = (cor, r, h, forma) => { const g = new THREE.Group(); const m = new THREE.Mesh(forma === 'cone' ? new THREE.ConeGeometry(r, h, 12) : new THREE.CylinderGeometry(r, r, h, 16), new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.75 })); m.position.y = h / 2; g.add(m); return g; };
  if (P.t === 'nascer') { o = marcador(0x3a8dde, 0.35, 1.8, 'cone'); const b = marcador(0xd84a3a, 0.35, 1.8, 'cone'); b.position.set(0, 0, -2 * P.p[2]); b.children[0].material.opacity = 0.35; o.add(b); }
  else if (P.t === 'dom') o = marcador(0x3ad86a, 2.0, 0.12);
  else if (P.t === 'mecha') o = marcador(0xf0a030, 1.4, 0.3);
  else if (P.t === 'luz') { o = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffd880 })); o.add(new THREE.PointLight(0xffd8a0, 1.2, P.raio || 7)); }
  else if (P.t === 'prefab') o = edPrefabGrupo('pf:' + P.nome + JSON.stringify(P.a || []), () => PF[P.nome](...(P.a || [])));
  else if (P.t === 'prop') o = edPrefabGrupo('prop:' + P.nome + JSON.stringify(P.a || []), () => propDef(P.nome, P.a || []).pf());
  if (!o) o = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), new THREE.MeshStandardMaterial({ color: 0xff00ff, wireframe: true }));
  o.position.set(P.p[0], P.p[1], P.p[2]); if (P.t !== 'nascer' && P.t !== 'dom' && P.t !== 'mecha') o.rotation.y = ((P.r || 0) * Math.PI) / 180;
  if (P.e) o.scale.setScalar(P.e);
  return o;
}
function edRedesenhar() {
  for (const it of ED.items) ED.scene.remove(it.o);
  ED.items = ED.J.pecas.map((P) => { const o = edMalha(P); o.traverse((c) => { c.userData.P = P; }); ED.scene.add(o); return { P, o }; });
  if (ED.box) { ED.scene.remove(ED.box); ED.box = null; }
  const it = ED.items.find((i) => i.P === ED.sel);
  if (it) { ED.box = new THREE.BoxHelper(it.o, 0xffcc33); ED.scene.add(ED.box); }
  if (ED.mar) ED.mar.visible = !!ED.J.meta.mar; if (ED.mar && ED.J.meta.mar) ED.mar.position.y = ED.J.meta.mar.y;
}

/* ---------- interface ---------- */
function edAbrir() {
  if (ED.on) return; ED.on = true;
  const root = edEl('div', 'position:fixed;inset:0;z-index:2147483647;background:#111;font:13px system-ui,sans-serif;color:#e8e6e1;user-select:none'); root.id = 'edRoot';
  const cv = edEl('canvas', 'position:absolute;inset:0;width:100%;height:100%;display:block'); root.appendChild(cv);
  const bar = edEl('div', 'position:absolute;left:0;right:0;top:0;height:42px;display:flex;align-items:center;gap:8px;padding:0 10px;background:#1b1d20ee;border-bottom:1px solid #333');
  const esq = edEl('div', 'position:absolute;left:0;top:42px;bottom:26px;width:250px;background:#17191cee;border-right:1px solid #333;display:flex;flex-direction:column');
  const dir = edEl('div', 'position:absolute;right:0;top:42px;width:260px;max-height:calc(100% - 68px);overflow:auto;background:#17191cee;border-left:1px solid #333;padding:10px;box-sizing:border-box');
  const ajuda = edEl('div', 'position:absolute;left:0;right:0;bottom:0;height:26px;line-height:26px;padding:0 10px;background:#1b1d20ee;border-top:1px solid #333;font-size:12px;color:#aaa;white-space:nowrap;overflow:hidden',
    'Botão direito: olhar · WASD: andar · Q/E: descer/subir · Shift: correr · Clique: colocar/selecionar · Arrastar: mover · Setas/PgUp/PgDn: ajustar · R: girar · Del: apagar · Ctrl+D: duplicar · Ctrl+Z: desfazer · F: focar · Esc: parar de colocar');
  root.append(bar, esq, dir, ajuda); document.body.appendChild(root);
  Object.assign(ED, { root, cv, bar, esq, dir, ajuda });
  const css = edEl('style'); css.textContent = `#edRoot button,#edRoot select,#edRoot input{white-space:nowrap;font:inherit;color:#eee;background:#2a2d32;border:1px solid #44484f;border-radius:5px;padding:4px 8px}
#edRoot button:hover{background:#353941;cursor:pointer}#edRoot button.on{background:#f5b82e;color:#111;border-color:#f5b82e}#edRoot label{display:block;margin:8px 0 3px;color:#aaa;font-size:12px}
#edRoot .edl{flex:1;overflow:auto;padding:4px 6px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;align-content:start}#edRoot .edl button{display:flex;flex-direction:column;min-width:0;margin:0;padding:3px;text-align:center;white-space:normal}#edRoot .edl img,#edRoot .edl i{display:block;width:100%;aspect-ratio:4/3;border-radius:3px;background:#30353c}#edRoot .edl i{font:normal 10px system-ui;color:#888;display:flex;align-items:center;justify-content:center;padding:4px;box-sizing:border-box}#edRoot .edl span{display:block;font-size:11px;line-height:14px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#edRoot .edl button.mau{opacity:.45}#edRoot .edl button.on{color:#111}
#edRoot .edt{display:flex;gap:4px;padding:6px}#edRoot .edt button{flex:1;padding:4px 2px}#edRoot .row3{display:flex;gap:4px}#edRoot .row3 input{width:100%;min-width:0;box-sizing:border-box}
#edRoot .msg{position:absolute;top:52px;left:50%;transform:translateX(-50%);background:#000c;padding:6px 14px;border-radius:6px;display:none}`;
  root.appendChild(css); ED.msgEl = edEl('div'); ED.msgEl.className = 'msg'; root.appendChild(ED.msgEl);
  // cena própria
  ED.r = new THREE.WebGLRenderer({ canvas: cv, antialias: true }); ED.r.outputEncoding = THREE.sRGBEncoding;
  ED.scene = new THREE.Scene(); ED.scene.background = new THREE.Color(0x8fb4d6); ED.scene.fog = new THREE.Fog(0x8fb4d6, 120, 400);
  ED.scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x4a4030, 0.9)); const sol = new THREE.DirectionalLight(0xfff2dc, 1.6); sol.position.set(30, 60, 20); ED.scene.add(sol);
  ED.grid = new THREE.GridHelper(200, 200, 0x555555, 0x3a3a3a); ED.grid.material.transparent = true; ED.grid.material.opacity = 0.5; ED.scene.add(ED.grid);
  ED.mar = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), new THREE.MeshStandardMaterial({ color: 0x1d4a6a, roughness: 0.3, transparent: true, opacity: 0.85 })); ED.mar.rotation.x = -Math.PI / 2; ED.mar.visible = false; ED.scene.add(ED.mar);
  ED.camera = new THREE.PerspectiveCamera(60, 1, 0.05, 1500);
  // começa no rascunho, se houver
  let J0 = null; try { J0 = JSON.parse(localStorage.getItem('tiro_editor_rascunho') || 'null'); } catch (e) { J0 = null; }
  ED.J = J0 ? edDoJson(J0) : edNovo();
  edBarra(); edCatalogo('basico'); edRedesenhar(); edPainel(); edEventos();
  const loop = (t) => { if (!ED.on) return; requestAnimationFrame(loop); edTick(t); };
  requestAnimationFrame(loop);
  edListaServidor();
}
function edMsg(t, ms = 2500) { ED.msgEl.textContent = t; ED.msgEl.style.display = 'block'; clearTimeout(ED.msgT); ED.msgT = setTimeout(() => (ED.msgEl.style.display = 'none'), ms); }
function edBarra() {
  const b = ED.bar; b.innerHTML = '';
  const t = edEl('b', 'margin-right:6px;color:#f5b82e', 'Editor de mapas'); b.appendChild(t);
  ED.selMapa = edEl('select', 'max-width:170px'); ED.selMapa.title = 'Abrir um mapa'; b.appendChild(ED.selMapa); edOpcoesMapas();
  ED.selMapa.onchange = () => { const v = ED.selMapa.value; ED.selMapa.value = ''; if (v === 'novo') { const n = prompt('Nome do mapa novo:', 'Mapa novo'); if (n) { ED.J = edNovo(n); ED.sel = null; ED.hist = []; edMudou(true); edBarra(); } } else if (v) edAbrirMapa(v); };
  const nome = edEl('input', 'width:150px'); nome.value = ED.J.meta.nome; nome.title = 'Nome do mapa'; nome.onchange = () => { ED.J.meta.nome = nome.value.trim() || 'Mapa'; if (!ED.J.meta.salvo) ED.J.meta.id = edIdDe(ED.J.meta.nome); edGuardar(); }; b.appendChild(nome);
  const ceu = edEl('select'); ceu.title = 'Céu e luz (de um mapa do jogo)'; for (const m of MAPS) if (m.ok && !(MAP_DEFS[m.id] || {}).editor) ceu.appendChild(new Option('Céu: ' + m.name, m.id)); ceu.value = ED.J.meta.ceu; ceu.onchange = () => { ED.J.meta.ceu = ceu.value; edGuardar(); }; b.appendChild(ceu);
  const mar = edEl('label', 'display:flex;align-items:center;gap:4px;margin:0;color:#ddd'); const mk = edEl('input'); mk.type = 'checkbox'; mk.checked = !!ED.J.meta.mar; const my = edEl('input', 'width:52px'); my.type = 'number'; my.step = '0.1'; my.value = ED.J.meta.mar ? ED.J.meta.mar.y : -4; mar.append(mk, 'Mar em y', my);
  const mm = () => { ED.J.meta.mar = mk.checked ? { y: +my.value || 0 } : null; edMudou(); }; mk.onchange = mm; my.onchange = mm; b.appendChild(mar);
  const bt = (rot, f, tit) => { const x = edEl('button', '', rot); x.onclick = f; if (tit) x.title = tit; b.appendChild(x); return x; };
  b.appendChild(edEl('span', 'flex:1'));
  bt('Salvar', edSalvar, 'Grava no projeto (Editor de mapas do Tiro.bat)'); bt('Baixar .json', edBaixar); bt('Abrir .json', edAbrirArquivo);
  bt('▶ Jogar', edJogar, 'Monta o mapa de verdade e começa uma partida solo com bots'); bt('Sair', () => { location.href = location.pathname; });
}
function edOpcoesMapas() {
  const s = ED.selMapa; s.innerHTML = ''; s.appendChild(new Option('Abrir mapa…', '')); s.appendChild(new Option('+ Mapa novo', 'novo'));
  const vistos = new Set();
  for (const J of (typeof TIRO_MAPAS_JSON !== 'undefined' ? TIRO_MAPAS_JSON : [])) { vistos.add(J.id); s.appendChild(new Option(J.nome || J.id, 'jogo:' + J.id)); }
  for (const m of ED.servidor || []) if (!vistos.has(m.id)) s.appendChild(new Option(m.nome + ' (no PC)', 'pc:' + m.id));
}
async function edListaServidor() { try { const r = await fetch('/api/tiro/editor/mapas'); if (!r.ok) return; ED.servidor = (await r.json()).mapas || []; ED.temServidor = true; edOpcoesMapas(); } catch (e) { /* no site não há servidor do editor */ } }
async function edAbrirMapa(v) {
  let J = null;
  if (v.startsWith('jogo:')) J = TIRO_MAPAS_JSON.find((m) => m.id === v.slice(5));
  else if (v.startsWith('pc:')) { try { J = await (await fetch('/api/tiro/editor/mapa/' + encodeURIComponent(v.slice(3)))).json(); } catch (e) { J = null; } }
  if (!J) return edMsg('Não consegui abrir esse mapa.');
  ED.J = edDoJson(J); ED.J.meta.salvo = true; ED.sel = null; ED.hist = []; edMudou(true); edBarra(); edMsg('Aberto: ' + (J.nome || J.id));
}
async function edSalvar() {
  const J = edParaJson();
  if (!ED.temServidor) { edBaixar(); return edMsg('No site não dá para gravar: baixei o .json. No PC, use o "Editor de mapas do Tiro.bat".', 5000); }
  try {
    const r = await fetch('/api/tiro/editor/mapa/' + encodeURIComponent(J.id), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(J) });
    const d = await r.json(); if (!r.ok) throw new Error(d.erro || r.status);
    ED.J.meta.salvo = true; edMsg('Salvo em ferramentas/tiro-mapas/editor/' + J.id + '.json'); edListaServidor();
  } catch (e) { edMsg('Não salvou: ' + e.message, 5000); }
}
function edBaixar() { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(edParaJson(), null, 1)], { type: 'application/json' })); a.download = ED.J.meta.id + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
function edAbrirArquivo() {
  const i = document.createElement('input'); i.type = 'file'; i.accept = '.json,application/json';
  i.onchange = async () => { try { const J = JSON.parse(await i.files[0].text()); if (!J.id) throw new Error('sem id'); ED.J = edDoJson(J); ED.sel = null; ED.hist = []; edMudou(true); edBarra(); } catch (e) { edMsg('Arquivo inválido: ' + e.message); } };
  i.click();
}
// monta o mapa de verdade e começa uma partida solo
function edJogar() {
  const J = edParaJson();
  if (!J.nascer.length) return edMsg('Coloque pelo menos um "Nascer" (o time Bravo nasce espelhado em -z).');
  edGuardar();
  try { if (MAPL.id === J.id) mapUnload(); tiroMapaRegistrar(J); } catch (e) { return edMsg('Erro no mapa: ' + e.message, 5000); }
  Settings.map = J.id; saveSettings();
  ED.on = false; ED.root.remove(); ED.r.dispose();
  edMsgJogo();
  menuLaunch({ online: false, map: J.id, deploy: () => startMatch() });
}
function edMsgJogo() { const b = edEl('button', 'position:fixed;right:12px;top:12px;z-index:2147483000;padding:8px 12px;background:#f5b82e;color:#111;border:0;border-radius:6px;font:600 13px system-ui;cursor:pointer', '✎ Voltar ao editor'); b.onclick = () => { location.href = location.pathname + '?editor=1'; }; document.body.appendChild(b); }

/* ---------- grupos dos prefabs no catálogo ----------
   Os prefabs se dividem em grupos (Favela, Navio, Cobertura...). Peça nova entra no grupo pelo nome: kcN... vai para o Navio,
   o resto das kc para a Favela, a não ser que esteja numa das listas abaixo; as do jogo original ficam em "Jogo original". */
const ED_GRUPOS = ['Favela', 'Navio', 'Praça e esporte', 'Veículos', 'Cobertura', 'Jogo original'];
const ED_GRUPO_LISTA = {
  'Praça e esporte': /^kc(Praca|Quadra|CampoFutebol|Arquibancada|BancoPraca|ArvoreCanteiro|GuardaSol|VasoPlanta|Arbusto|Bananeira)/,
  'Veículos': /^(kc(CarroVelho|Van|Moto$|CarroQueimado)|car$|truck$|busWreck$|boxcar$|snowplow$)/,
  'Cobertura': /^kc(Jersey|Sacos|Gabiao|MuroQuebrado|Pilar$|Carretel|Guarita|Tanque|Tapume|Paletes|BarreiraAgua|ConteinerAberto|Cavalete|Entulho|Manilhas|Prateleira|Tambores|Vigas|Alambrado|ArmarioEletrico|Blocos|PaleteEmPe|IBC|Pneus|Cone)/,
};
function edGrupoDe(n) {
  for (const [g, re] of Object.entries(ED_GRUPO_LISTA)) if (re.test(n)) return g;
  if (/^kcN([A-Z]|avio)/.test(n) || /^ia[A-Z]/.test(n)) return 'Navio';
  return /^kc/.test(n) ? 'Favela' : 'Jogo original';
}
/* ---------- catálogo ---------- */
function edCatalogo(aba) {
  const e = ED.esq; e.innerHTML = ''; ED.aba = aba;
  const tabs = edEl('div'); tabs.className = 'edt';
  for (const [k, rot] of [['basico', 'Básico'], ['prefab', 'Prefabs'], ['prop', 'Objetos']]) { const b = edEl('button', '', rot); if (k === aba) b.className = 'on'; b.onclick = () => edCatalogo(k); tabs.appendChild(b); }
  const busca = edEl('input', 'margin:0 6px 4px'); busca.placeholder = 'Buscar…'; e.append(tabs, busca);
  if (aba === 'prefab') { // os grupos: Todos ou um só
    const gr = edEl('div', 'display:flex;flex-wrap:wrap;gap:3px;padding:0 6px 4px');
    for (const g of ['Todos', ...ED_GRUPOS]) { const b = edEl('button', 'padding:2px 6px;font-size:11px', g); if ((ED.grupo || 'Todos') === g) b.className = 'on'; b.onclick = () => { ED.grupo = g; edCatalogo('prefab'); }; gr.appendChild(b); }
    e.appendChild(gr);
  }
  const lista = edEl('div'); lista.className = 'edl'; e.appendChild(lista);
  const itens = aba === 'basico' ? ED_BASICO.map((b) => ({ rot: b.rot, tpl: b }))
    : (aba === 'prefab' ? Object.keys(PF) : Object.keys(PROPT)).sort().map((n) => ({ rot: n, tpl: { rot: n, P: { t: aba, nome: n } }, g: aba === 'prefab' ? edGrupoDe(n) : '' }));
  if (aba === 'prefab') itens.sort((a, b) => ED_GRUPOS.indexOf(a.g) - ED_GRUPOS.indexOf(b.g) || a.rot.localeCompare(b.rot));
  const pinta = () => {
    const q = busca.value.trim().toLowerCase(); lista.innerHTML = ''; let gAtual = null;
    for (const it of itens) {
      const nome = aba === 'basico' ? it.rot : edNomeBonito(it.rot);
      if (q && !it.rot.toLowerCase().includes(q) && !nome.toLowerCase().includes(q)) continue;
      if (aba === 'prefab' && ED.grupo && ED.grupo !== 'Todos' && it.g !== ED.grupo) continue;
      if (aba === 'prefab' && it.g !== gAtual) { gAtual = it.g; lista.appendChild(edEl('div', 'grid-column:1/-1;margin:6px 0 1px;padding:2px 4px;font:600 12px system-ui;color:#f5b82e;border-bottom:1px solid #44484f', gAtual)); }
      const b = edEl('button'); b.title = it.rot; if (ED.tpl === it.tpl) b.className = 'on';
      // prefab que precisa de parâmetros (não se desenha sozinho): apagado no catálogo, sem prévia
      if (aba !== 'basico' && !edPrefabGrupo(aba + ':' + it.rot + '[]', () => (aba === 'prefab' ? PF[it.rot]() : propDef(it.rot, []).pf()))) {
        b.className = 'mau'; b.title = it.rot + ': precisa de parâmetros, ainda não dá para colocar pelo editor';
        b.append(edEl('i', '', 'precisa de parâmetros'), edEl('span', '', nome)); lista.appendChild(b); continue;
      }
      const img = edEl('img'); img.alt = ''; b.append(img, edEl('span', '', nome)); edMiniPedir(it.tpl, img);
      b.onclick = () => { ED.tpl = ED.tpl === it.tpl ? null : it.tpl; edFantasma(); pinta(); if (ED.tpl) edMsg('Clique na cena para colocar: ' + it.rot + ' (Esc para parar)'); };
      lista.appendChild(b);
    }
  };
  busca.oninput = pinta; pinta();
}
/* ---------- prévias do catálogo ----------
   Cada peça do catálogo ganha uma miniatura 3D, desenhada por um renderizador pequeno só delas (vista de 3/4 pela frente, +z),
   aos poucos (algumas por quadro) e guardada enquanto o editor estiver aberto. */
const ED_MINI = { cache: new Map(), fila: [], r: null, cena: null, cam: null, W: 160, H: 120 };
const edNomeBonito = (n) => n.replace(/^kc/, '').replace(/([a-z])([A-Z0-9])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
function edMiniPedir(tpl, img) {
  const k = JSON.stringify(tpl.P), u = ED_MINI.cache.get(k);
  if (u) { img.src = u; return; }
  ED_MINI.fila.push({ tpl, img, k, t: 0 });
}
function edMiniDesenhar(tpl) {
  if (!ED_MINI.r) {
    const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); r.setPixelRatio(1); r.setSize(ED_MINI.W, ED_MINI.H, false); r.outputEncoding = THREE.sRGBEncoding;
    const cena = new THREE.Scene(); cena.background = new THREE.Color(0x30353c);
    cena.add(new THREE.HemisphereLight(0xe8eeff, 0x50483c, 1.0)); const sol = new THREE.DirectionalLight(0xfff2dc, 1.5); sol.position.set(4, 8, 6); cena.add(sol);
    Object.assign(ED_MINI, { r, cena, cam: new THREE.PerspectiveCamera(30, ED_MINI.W / ED_MINI.H, 0.01, 500) });
  }
  const P = Object.assign({ p: [0, 0, 0], r: 0 }, edClone(tpl.P)), o = edMalha(P), proprio = P.t !== 'prefab' && P.t !== 'prop';
  let falta = false; o.traverse((c) => { const m = c.material; if (m && m.map && m.map.image && m.map.image.complete === false) falta = true; });
  const solta = () => { if (proprio) o.traverse((c) => { if (c.geometry) c.geometry.dispose(); }); };
  if (falta) { solta(); return null; } // a textura ainda está carregando: tenta de novo depois
  const s = new THREE.Box3().setFromObject(o).getBoundingSphere(new THREE.Sphere()), cam = ED_MINI.cam;
  const d = (Math.max(s.radius, 0.2) / Math.sin((cam.fov * Math.PI) / 360)) * 1.02;
  cam.position.copy(s.center).addScaledVector(new THREE.Vector3(0.75, 0.55, 1).normalize(), d); cam.near = d / 50; cam.far = d * 4; cam.updateProjectionMatrix(); cam.lookAt(s.center);
  ED_MINI.cena.add(o); ED_MINI.r.render(ED_MINI.cena, cam); ED_MINI.cena.remove(o); solta();
  return ED_MINI.r.domElement.toDataURL('image/jpeg', 0.85);
}
function edMiniPasso() {
  const F = ED_MINI.fila, agora = performance.now(); let n = 0;
  for (let i = 0; i < F.length && n < 4;) {
    const f = F[i];
    if (!f.img.isConnected) { F.splice(i, 1); continue; }
    if (f.t > agora) { i++; continue; }
    const pronto = ED_MINI.cache.get(f.k); if (pronto) { f.img.src = pronto; F.splice(i, 1); continue; }
    let u = null; try { u = edMiniDesenhar(f.tpl); } catch (e) { u = ''; }
    n++;
    if (u === null) { f.t = agora + 500; i++; continue; }
    if (u) { ED_MINI.cache.set(f.k, u); f.img.src = u; }
    F.splice(i, 1);
  }
}
function edFantasma() {
  if (ED.ghost) { ED.scene.remove(ED.ghost); ED.ghost = null; }
  if (!ED.tpl) return;
  const P = Object.assign({ p: [0, 0, 0], r: 0 }, edClone(ED.tpl.P)); ED.ghost = edMalha(P);
  ED.ghost.traverse((c) => { if (c.material) { c.material = c.material.clone(); c.material.transparent = true; c.material.opacity = 0.45; c.material.depthWrite = false; } });
  ED.ghost.userData.fant = true; ED.scene.add(ED.ghost); ED.ghostP = P;
}

/* ---------- painel da peça ---------- */
function edPainel() {
  const d = ED.dir, P = ED.sel; d.innerHTML = '';
  const n = ED.J.pecas, cont = (t) => n.filter((p) => p.t === t).length;
  d.appendChild(edEl('div', 'color:#aaa;font-size:12px;line-height:1.5', `<b style="color:#eee">${ED.J.meta.nome}</b> · id ${ED.J.meta.id}<br>${n.length} peças · ${cont('nascer')} nascer (+${cont('nascer')} Bravo espelhado) · ${cont('dom')}/3 pontos · ${cont('mecha')}/3 mecha`));
  if (!P) { d.appendChild(edEl('p', 'color:#888;margin-top:14px', 'Escolha uma peça no catálogo e clique na cena, ou clique numa peça para mexer nela.<br><br>O chão das aparições tem de estar em y = 0. O time Bravo nasce espelhado (z vira -z).')); return; }
  d.appendChild(edEl('h4', 'margin:14px 0 4px', P.t === 'prefab' || P.t === 'prop' ? P.nome : { caixa: 'Caixa', escada: 'Escada', luz: 'Luz', grafite: 'Grafite', nascer: 'Nascer (Alpha)', dom: 'Ponto de dominação', mecha: 'Queda do mecha' }[P.t]));
  const vec = (rot, arr, step, f) => { d.appendChild(edEl('label', '', rot)); const r = edEl('div'); r.className = 'row3'; arr.forEach((v, i) => { const x = edEl('input'); x.type = 'number'; x.step = step; x.value = +(+v).toFixed(3); x.onchange = () => { edAntes(); f(i, +x.value); edMudou(true); }; r.appendChild(x); }); d.appendChild(r); };
  vec('Posição x · y · z (m)', P.p, 0.25, (i, v) => { P.p[i] = v; });
  if (P.s) vec(P.t === 'grafite' ? 'Tamanho larg · alt (m)' : 'Tamanho larg · alt · prof (m)', P.s, 0.25, (i, v) => { P.s[i] = Math.max(0.05, v); });
  if (!['nascer', 'dom', 'mecha'].includes(P.t)) vec('Giro (graus)' + (P.t === 'caixa' || P.t === 'escada' ? ' — de 90 em 90' : ''), [P.r || 0], P.t === 'caixa' || P.t === 'escada' ? 90 : 15, (i, v) => { P.r = v; });
  if (P.t === 'prefab' || P.t === 'prop') vec('Escala', [P.e || 1], 0.1, (i, v) => { P.e = v === 1 ? undefined : Math.max(0.1, v); });
  if (P.t === 'caixa' || P.t === 'escada') {
    const atual = P.m || (P.t === 'escada' ? 'wood' : 'paint'), item = ED_SUPERF.find((x) => x[0] === atual);
    d.appendChild(edEl('label', '', 'Superfície: <b style="color:#eee">' + (item ? item[1] : atual) + '</b>'));
    const gal = edEl('div', 'display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;max-height:300px;overflow-y:auto;overflow-x:hidden;padding-right:2px');
    let grupo = '';
    for (const [k, nome, gr] of ED_SUPERF) {
      if (gr !== grupo) { grupo = gr; gal.appendChild(edEl('div', 'grid-column:1/-1;color:#888;font-size:11px;margin-top:4px', gr)); }
      const t = edEl('div', 'min-width:0;cursor:pointer;border:2px solid ' + (k === atual ? '#f5b82e' : 'transparent') + ';border-radius:4px;overflow:hidden;background:#222');
      t.title = nome; const im = edEl('img', 'display:block;width:100%;aspect-ratio:1;object-fit:cover'); edTexUrl(k).then((u) => { im.src = u; });
      t.append(im, edEl('div', 'font-size:9px;color:#ccc;padding:1px 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis', nome));
      t.onclick = () => { edAntes(); P.m = k; edMudou(true); }; gal.appendChild(t);
    }
    d.appendChild(gal);
    vec('Tamanho da textura (1 = normal)', [P.tx || 1], 0.25, (i, v) => { P.tx = v === 1 ? undefined : Math.max(0.1, v); });
  }
  if (P.t === 'caixa' || P.t === 'escada' || P.t === 'luz') {
    d.appendChild(edEl('label', '', 'Cor'));
    const c = edEl('input', 'width:100%;height:30px;padding:0'); c.type = 'color'; c.value = '#' + edCorHex(P.cor || [0.9, 0.9, 0.9]).getHexString(); c.onchange = () => { edAntes(); const k = new THREE.Color(c.value); P.cor = [+k.r.toFixed(3), +k.g.toFixed(3), +k.b.toFixed(3)]; edMudou(true); }; d.appendChild(c);
  }
  if (P.t === 'caixa') {
    const l = edEl('label', 'display:flex;gap:6px;align-items:center;color:#ddd'); const k = edEl('input'); k.type = 'checkbox'; k.checked = P.col !== false; k.onchange = () => { edAntes(); P.col = k.checked ? undefined : false; edMudou(true); }; l.append(k, 'Colide (segura gente e bala)'); d.appendChild(l);
  }
  if (P.t === 'grafite') {
    d.appendChild(edEl('label', '', 'Texto (até 40 letras)'));
    const t = edEl('input', 'width:100%;box-sizing:border-box'); t.value = P.texto || ''; t.maxLength = 40;
    t.onchange = () => { edAntes(); P.texto = t.value; edMudou(true); }; d.appendChild(t);
    d.appendChild(edEl('label', '', 'Estilo'));
    const es = edEl('select', 'width:100%'); for (const [k, nome] of ED_GRAF_ESTILOS) es.appendChild(new Option(nome, k)); es.value = P.estilo || 'bomb';
    es.onchange = () => { edAntes(); P.estilo = es.value; edMudou(true); }; d.appendChild(es);
    for (const [rot, campo, pad] of [['Cor', 'cor', [0.98, 0.8, 0.1]], ['Contorno e sombra', 'borda', [0.08, 0.08, 0.1]]]) {
      d.appendChild(edEl('label', '', rot));
      const c = edEl('input', 'width:100%;height:30px;padding:0'); c.type = 'color'; c.value = '#' + edCorHex(P[campo] || pad).getHexString();
      c.onchange = () => { edAntes(); const k = new THREE.Color(c.value); P[campo] = [+k.r.toFixed(3), +k.g.toFixed(3), +k.b.toFixed(3)]; edMudou(true); }; d.appendChild(c);
    }
    d.appendChild(edEl('p', 'color:#888;font-size:11px;margin:6px 0 0', 'Encoste na parede: a pintura fica na frente da peça (+z). Não colide nem segura bala.'));
  }
  if (P.t === 'luz') { vec('Força · alcance (m)', [P.forca || 1.4, P.raio || 7], 0.1, (i, v) => { if (i) P.raio = v; else P.forca = v; }); }
  const bts = edEl('div', 'display:flex;gap:6px;margin-top:14px'); const dup = edEl('button', '', 'Duplicar'); dup.onclick = edDuplicar; const del = edEl('button', 'color:#f88', 'Apagar'); del.onclick = edApagar; bts.append(dup, del); d.appendChild(bts);
}

/* ---------- ações ---------- */
function edApagar() { if (!ED.sel) return; edAntes(); ED.J.pecas.splice(ED.J.pecas.indexOf(ED.sel), 1); ED.sel = null; edMudou(true); }
function edDuplicar() { if (!ED.sel) return; edAntes(); const Q = edClone(ED.sel); Q.p[0] += 1; ED.J.pecas.push(Q); ED.sel = Q; edMudou(true); }
function edDesfazer() { const s = ED.hist.pop(); if (!s) return; ED.J = JSON.parse(s); ED.sel = null; edGuardar(); edRedesenhar(); edPainel(); }
function edRaio(ev) {
  const r = ED.cv.getBoundingClientRect(), v = new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  const rc = new THREE.Raycaster(); rc.setFromCamera(v, ED.camera); return rc;
}
function edAcerto(ev, ignorar) {
  const rc = edRaio(ev), objs = ED.items.filter((i) => i.P !== ignorar).map((i) => i.o);
  const h = rc.intersectObjects(objs, true)[0];
  const plano = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), pt = new THREE.Vector3();
  const hp = rc.ray.intersectPlane(plano, pt) ? pt : null;
  if (h && (!hp || h.distance < rc.ray.origin.distanceTo(hp))) return { p: h.point, P: h.object.userData.P, n: h.face ? h.face.normal.clone().transformDirection(h.object.matrixWorld) : null };
  return hp ? { p: hp, P: null } : null;
}
function edEventos() {
  const cv = ED.cv;
  cv.addEventListener('contextmenu', (e) => e.preventDefault());
  cv.addEventListener('mousedown', (e) => {
    if (e.button === 2) { ED.olhar = { x: e.clientX, y: e.clientY }; return; }
    if (e.button !== 0) return;
    if (ED.tpl) {
      const a = edAcerto(e); if (!a) return;
      edAntes(); const P = Object.assign(edClone(ED.tpl.P), { p: [edSnap(a.p.x), +(a.p.y + (ED.tpl.oy || 0)).toFixed(3), edSnap(a.p.z)] });
      if (P.t !== 'nascer' && P.t !== 'dom' && P.t !== 'mecha') P.r = ED.ghostP ? ED.ghostP.r || 0 : 0;
      ED.J.pecas.push(P); ED.sel = P; edMudou(true); return;
    }
    const a = edAcerto(e); ED.sel = a && a.P ? a.P : null; edRedesenhar(); edPainel();
    if (ED.sel) ED.drag = { P: ED.sel, y: ED.sel.p[1], ini: false, x0: e.clientX, y0: e.clientY };
  });
  addEventListener('mousemove', (e) => {
    if (!ED.on) return;
    if (ED.olhar) { ED.cam.yaw -= (e.clientX - ED.olhar.x) * 0.004; ED.cam.pitch = clamp(ED.cam.pitch - (e.clientY - ED.olhar.y) * 0.004, -1.5, 1.5); ED.olhar = { x: e.clientX, y: e.clientY }; return; }
    if (ED.drag) {
      if (!ED.drag.ini && Math.hypot(e.clientX - ED.drag.x0, e.clientY - ED.drag.y0) < 4) return;
      if (!ED.drag.ini) { edAntes(); ED.drag.ini = true; }
      const rc = edRaio(e), pt = new THREE.Vector3(); if (!rc.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -ED.drag.y), pt)) return;
      ED.drag.P.p[0] = edSnap(pt.x); ED.drag.P.p[2] = edSnap(pt.z); edRedesenhar(); return;
    }
    if (ED.ghost && e.target === cv) { const a = edAcerto(e); if (a) { ED.ghost.position.set(edSnap(a.p.x), a.p.y + (ED.tpl.oy || 0), edSnap(a.p.z)); ED.ghostP.p = [ED.ghost.position.x, ED.ghost.position.y, ED.ghost.position.z]; } }
  });
  addEventListener('mouseup', (e) => { if (!ED.on) return; if (e.button === 2) ED.olhar = null; if (e.button === 0 && ED.drag) { const ini = ED.drag.ini; ED.drag = null; if (ini) { edGuardar(); edPainel(); } } });
  cv.addEventListener('wheel', (e) => { e.preventDefault(); ED.cam.v = clamp(ED.cam.v * (e.deltaY > 0 ? 0.85 : 1.18), 1, 80); edMsg('Velocidade da câmera: ' + ED.cam.v.toFixed(1) + ' m/s', 900); }, { passive: false });
  const tecla = (e) => {
    if (!ED.on) return;
    const campo = /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName);
    e.stopPropagation(); // o jogo não vê as teclas enquanto o editor está aberto
    if (campo) return;
    const k = e.code, P = ED.sel, passo = e.shiftKey ? 1 : 0.25;
    if (e.type === 'keyup') { ED.keys.delete(k); return; }
    ED.keys.add(k);
    if (k === 'Escape') { ED.tpl = null; edFantasma(); edCatalogo(ED.aba); }
    else if ((e.ctrlKey || e.metaKey) && k === 'KeyZ') { e.preventDefault(); edDesfazer(); }
    else if ((e.ctrlKey || e.metaKey) && k === 'KeyD') { e.preventDefault(); edDuplicar(); }
    else if (k === 'KeyR') {
      const alvo = P || ED.ghostP; if (!alvo || ['nascer', 'dom', 'mecha'].includes(alvo.t)) return;
      const fino = e.shiftKey && (alvo.t === 'prefab' || alvo.t === 'prop'); if (P) edAntes(); alvo.r = (((alvo.r || 0) + (fino ? 15 : 90)) % 360);
      if (P) edMudou(true); else { ED.ghost.rotation.y = (alvo.r * Math.PI) / 180; if (alvo.t === 'caixa' || alvo.t === 'escada') edFantasma(); }
    }
    else if (!P) return;
    else if (k === 'Delete' || k === 'Backspace') edApagar();
    else if (k === 'KeyF') { ED.cam.x = P.p[0]; ED.cam.z = P.p[2] + 8; ED.cam.y = P.p[1] + 5; ED.cam.yaw = 0; ED.cam.pitch = -0.5; }
    else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown'].includes(k)) {
      e.preventDefault(); edAntes();
      // setas relativas à câmera (o "para cima" é para onde ela olha)
      const fx = -Math.sin(ED.cam.yaw), fz = -Math.cos(ED.cam.yaw), ax = Math.abs(fx) > Math.abs(fz);
      const fw = ax ? [Math.sign(fx), 0] : [0, Math.sign(fz)], rt = [-fw[1], fw[0]];
      const d = k === 'ArrowUp' ? fw : k === 'ArrowDown' ? [-fw[0], -fw[1]] : k === 'ArrowRight' ? rt : k === 'ArrowLeft' ? [-rt[0], -rt[1]] : null;
      if (d) { P.p[0] += d[0] * passo; P.p[2] += d[1] * passo; } else P.p[1] += (k === 'PageUp' ? 1 : -1) * passo;
      P.p = P.p.map((v) => +v.toFixed(3)); edMudou(true);
    }
  };
  addEventListener('keydown', tecla, true); addEventListener('keyup', tecla, true);
  addEventListener('blur', () => ED.keys.clear());
}
function edTick(t) {
  const dt = Math.min(0.05, (t - (ED.t || t)) / 1000); ED.t = t;
  const w = ED.cv.clientWidth, h = ED.cv.clientHeight;
  if (ED.cv.width !== Math.round(w * devicePixelRatio) || ED.cv.height !== Math.round(h * devicePixelRatio)) { ED.r.setPixelRatio(devicePixelRatio); ED.r.setSize(w, h, false); ED.camera.aspect = w / h; ED.camera.updateProjectionMatrix(); }
  const c = ED.cam, K = ED.keys, v = c.v * (K.has('ShiftLeft') || K.has('ShiftRight') ? 3 : 1) * dt;
  const fx = -Math.sin(c.yaw), fz = -Math.cos(c.yaw);
  if (!ED.sel || !K.has('ArrowUp')) {
    if (K.has('KeyW')) { c.x += fx * v; c.z += fz * v; } if (K.has('KeyS')) { c.x -= fx * v; c.z -= fz * v; }
    if (K.has('KeyA')) { c.x += fz * v; c.z -= fx * v; } if (K.has('KeyD') && !K.has('ControlLeft')) { c.x -= fz * v; c.z += fx * v; }
    if (K.has('KeyE')) c.y += v; if (K.has('KeyQ')) c.y -= v;
  }
  ED.camera.position.set(c.x, c.y, c.z); ED.camera.rotation.set(c.pitch, c.yaw, 0, 'YXZ');
  if (ED.box) ED.box.update();
  ED.r.render(ED.scene, ED.camera);
  if (ED_MINI.fila.length) edMiniPasso();
}
if (/[?&]editor=1\b/.test(location.search)) { const go = () => setTimeout(() => { try { edAbrir(); } catch (e) { console.error('editor', e); } }, 300); if (document.readyState === 'complete') go(); else addEventListener('load', go); }
