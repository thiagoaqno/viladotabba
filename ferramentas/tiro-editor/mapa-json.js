/* ==========================================================================
   MAPAS DO EDITOR (Tiro da Galera, 2026-11-26). Um mapa feito no editor (?editor=1) é um .json em ferramentas/tiro-mapas/editor/;
   o tiro-frontline.js junta todos em TIRO_MAPAS_JSON e este arquivo transforma cada um num mapa do jogo (MAP_DEFS, MAPS).
   Formato (guia completo em docs/tiro-editor-de-mapas.md):
   { id, nome, tag, desc, ceu: id de um mapa do jogo (céu e luz dele), mar: { y } ou null,
     pecas: [ { t: 'caixa'|'escada'|'prefab'|'prop'|'luz', p: [x, y, z] (centro embaixo), s: [larg, alt, prof], r: graus, ... } ],
     nascer: [[x, z], ...] (time Alpha; o Bravo nasce espelhado em -z), dom: [[x, z] x 3], mecha: [[x, z] x 3], poi: [[x, y, z]] }
   Mapa sem chão: só existe o que foi colocado (quem cai, morre). As apariçoes usam o chão em y = 0 perto delas.
   ========================================================================== */
const TIRO_TEX = ['wood', 'steel', 'canvas', 'concrete', 'plaster', 'stone', 'timber', 'paintwood', 'pavers'];
// caixa girada só de 90 em 90 graus (as colisões do jogo são alinhadas aos eixos)
function edCaixaBox(P) {
  const [x, y, z] = P.p, q = (((Math.round((P.r || 0) / 90) % 4) + 4) % 4), [w0, h, d0] = P.s || [1, 1, 1];
  const w = q % 2 ? d0 : w0, d = q % 2 ? w0 : d0;
  return { x0: x - w / 2, x1: x + w / 2, y0: y, y1: y + h, z0: z - d / 2, z1: z + d / 2, q };
}
// escada: sobe para +z quando r = 0 (90: +x, 180: -z, 270: -x); rampa por onde se anda e degraus que se veem
function edEscada(P) {
  const B = edCaixaBox(P), q = B.q, axis = q % 2 ? 'x' : 'z', sobe = q === 0 || q === 1, h = (P.s || [1, 1, 1])[1];
  const lo = B.y0, hi = B.y1, a0 = axis === 'z' ? B.z0 : B.x0, a1 = axis === 'z' ? B.z1 : B.x1;
  RAMPS.push({ x0: B.x0, x1: B.x1, z0: B.z0, z1: B.z1, axis, h0: sobe ? lo : hi, h1: sobe ? hi : lo });
  const n = Math.max(2, Math.round(h / 0.2)), dh = h / n, key = P.m || 'wood', tint = P.cor || [0.66, 0.46, 0.3];
  for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 1) / n, top = lo + dh * (i + 1);
    const s0 = sobe ? lerp(a0, a1, t0) : lerp(a1, a0, t1), s1 = sobe ? lerp(a0, a1, t1) : lerp(a1, a0, t0);
    const bx = axis === 'z' ? [B.x0, B.x1, Math.min(s0, s1), Math.max(s0, s1)] : [Math.min(s0, s1), Math.max(s0, s1), B.z0, B.z1];
    DECOR.col(bx[0], bx[1], lo, top, bx[2], bx[3], 'wood', true);
    box(key, bx[0], bx[1], lo, top, bx[2], bx[3], { collide: false, tint, uv: edUv(P) });
  }
}
// tamanho de um prefab (x0, x1, z0, z1 da peça), medido na malha dele; guardado por nome
const ED_PF_TAM = new Map();
function edPrefabTam(nome) {
  if (!ED_PF_TAM.has(nome)) {
    let t = null;
    try {
      const p = PF[nome](); let a = 1e9, b = -1e9, c = 1e9, d = -1e9, e = 1e9, f = -1e9;
      for (const part of p.parts.values()) { const g = part.g; for (let i = 0; i < g.nv; i++) { const x = g.P[i * 3], y = g.P[i * 3 + 1], z = g.P[i * 3 + 2]; if (x < a) a = x; if (x > b) b = x; if (z < c) c = z; if (z > d) d = z; if (y < e) e = y; if (y > f) f = y; } }
      if (a < b) t = [a, b, c, d, e, f]; // x0, x1, z0, z1, y0, y1
    } catch (e) { t = null; }
    ED_PF_TAM.set(nome, t);
  }
  return ED_PF_TAM.get(nome);
}
function edLimites(J, preciso) {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, z0 = 1e9, z1 = -1e9;
  for (const P of J.pecas || []) {
    let B = P.t === 'caixa' || P.t === 'escada' ? edCaixaBox(P) : { x0: P.p[0] - 1, x1: P.p[0] + 1, y0: P.p[1], z0: P.p[2] - 1, z1: P.p[2] + 1 };
    const T = preciso && P.t === 'prefab' && PF[P.nome] && !(P.a && P.a.length) ? edPrefabTam(P.nome) : null;
    if (T) { // a caixa do prefab girada e na escala dele (raio pelo canto mais longe: vale para qualquer giro)
      const e = P.e || 1, r = Math.max(...T.slice(0, 4).map(Math.abs)) * e * Math.SQRT2;
      const q = (((Math.round((P.r || 0) / 90) % 4) + 4) % 4), exato = Math.abs((P.r || 0) - Math.round((P.r || 0) / 90) * 90) < 0.5;
      if (exato) { const c = [1, 0, -1, 0][q], s = [0, 1, 0, -1][q], xs = [], zs = []; for (const x of [T[0], T[1]]) for (const z of [T[2], T[3]]) { xs.push(P.p[0] + e * (x * c + z * s)); zs.push(P.p[2] + e * (-x * s + z * c)); } B = { x0: Math.min(...xs), x1: Math.max(...xs), y0: P.p[1], z0: Math.min(...zs), z1: Math.max(...zs) }; }
      else B = { x0: P.p[0] - r, x1: P.p[0] + r, y0: P.p[1], z0: P.p[2] - r, z1: P.p[2] + r };
    }
    x0 = Math.min(x0, B.x0); x1 = Math.max(x1, B.x1); y0 = Math.min(y0, B.y0); z0 = Math.min(z0, B.z0); z1 = Math.max(z1, B.z1);
  }
  for (const [x, z] of (J.nascer || [])) { x0 = Math.min(x0, x - 2); x1 = Math.max(x1, x + 2); z0 = Math.min(z0, -Math.abs(z) - 2); z1 = Math.max(z1, Math.abs(z) + 2); }
  if (x0 > x1) { x0 = -20; x1 = 20; z0 = -20; z1 = 20; y0 = 0; }
  return { x0: Math.floor(x0 - 1), x1: Math.ceil(x1 + 1), y0, z0: Math.floor(z0 - 1), z1: Math.ceil(z1 + 1) };
}
// pontos de interesse dos bots: os do editor, ou o topo de cada chão grande, os pontos de dominação e o meio de cada time
function edPois(J, L) {
  if (J.poi && J.poi.length) return J.poi.map(([x, y, z, h]) => [x, y, z, x < L.x0 + (L.x1 - L.x0) / 3 ? 'L' : x > L.x1 - (L.x1 - L.x0) / 3 ? 'E' : 'M', h ? 1 : 0]); // 4º número 1: o bot segura a posição
  const out = [], lane = (x) => (x < L.x0 + (L.x1 - L.x0) / 3 ? 'L' : x > L.x1 - (L.x1 - L.x0) / 3 ? 'E' : 'M');
  for (const P of J.pecas || []) if (P.t === 'caixa' && P.col !== false) { const B = edCaixaBox(P); if (B.x1 - B.x0 >= 2.5 && B.z1 - B.z0 >= 2.5 && B.y1 < 9) out.push([(B.x0 + B.x1) / 2, B.y1, (B.z0 + B.z1) / 2, lane((B.x0 + B.x1) / 2)]); }
  for (const [x, z] of (J.dom || [])) out.push([x, 0, z, lane(x)]);
  for (const [x, z] of (J.nascer || []).slice(0, 2)) { out.push([x, 0, z, lane(x)]); out.push([x, 0, -z, lane(x)]); }
  return out;
}
// mar em volta (como o do iate): grade de água fina perto, larga longe; o campo de espuma fica centrado (troca no tiro-frontline.js)
function edMarGeometry() {
  const W = WATER, side = (fine) => { const out = [0]; for (let v = 0, s = 0.8; v < 900;) { if (v > fine) s = Math.min(s * 1.07, 45); v = Math.min(900, v + s); out.push(v); } return out.slice(1).map((v) => -v).reverse().concat(out); };
  const xs = side(30), zs = side(70), nx = xs.length, nz = zs.length;
  const P = new Float32Array(nx * nz * 3), idx = new Uint32Array((nx - 1) * (nz - 1) * 6);
  for (let j = 0, o = 0; j < nz; j++) for (let i = 0; i < nx; i++, o += 3) { P[o] = xs[i]; P[o + 1] = W.y; P[o + 2] = zs[j]; }
  let k = 0;
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nx * nz * 3).fill(0), 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeBoundingSphere();
  return g;
}
{ const orig = waterGeometry; waterGeometry = function () { return CURMAP.def && CURMAP.def.mar ? edMarGeometry() : orig(); }; }

// escadas que vêm dentro de um prefab (KC_ESCADAS[nome], em coordenadas da peça, registradas pelo pecas.js): viram rampas do jogo
// (por onde o jogador e os bots sobem) e degraus que colidem, girados junto com a peça. Só giro de 90 em 90 graus.
function edEscadasPrefab(P) {
  const E = typeof KC_ESCADAS !== 'undefined' && KC_ESCADAS[P.nome];
  if (!E || !E.length) return;
  const r = P.r || 0, q = (((Math.round(r / 90) % 4) + 4) % 4);
  if (Math.abs(r - Math.round(r / 90) * 90) > 0.5) console.warn('escada do prefab', P.nome, 'só funciona girada de 90 em 90 graus');
  const c = [1, 0, -1, 0][q], s = [0, 1, 0, -1][q], [px, py, pz] = P.p;
  const tr = (x, z) => [px + x * c + z * s, pz - x * s + z * c]; // o mesmo giro do rotation.y do three
  for (const e of E) {
    const a = tr(e.x0, e.z0), b = tr(e.x1, e.z1);
    const x0 = Math.min(a[0], b[0]), x1 = Math.max(a[0], b[0]), z0 = Math.min(a[1], b[1]), z1 = Math.max(a[1], b[1]);
    const axis = q % 2 ? (e.axis === 'z' ? 'x' : 'z') : e.axis;
    const ponta0 = e.axis === 'z' ? tr((e.x0 + e.x1) / 2, e.z0) : tr(e.x0, (e.z0 + e.z1) / 2); // onde fica o h0 da peça
    const noComeco = axis === 'x' ? ponta0[0] < (x0 + x1) / 2 : ponta0[1] < (z0 + z1) / 2;
    const h0 = py + (noComeco ? e.h0 : e.h1), h1 = py + (noComeco ? e.h1 : e.h0);
    RAMPS.push({ x0, x1, z0, z1, axis, h0, h1 });
    const n = Math.max(2, Math.round(Math.abs(h1 - h0) / 0.2)), dh = Math.abs(h1 - h0) / n;
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n, top = lerp(h0, h1, (t0 + t1) / 2) + dh / 2;
      if (axis === 'x') DECOR.col(lerp(x0, x1, t0), lerp(x0, x1, t1), py, top, z0, z1, 'concrete', true);
      else DECOR.col(x0, x1, py, top, lerp(z0, z1, t0), lerp(z0, z1, t1), 'concrete', true);
    }
  }
}
// prefabs do jogo que não trazem colisão (nos mapas deles ela é posta à parte): no editor ganham uma caixa do tamanho da malha
const ED_COL_AUTO = new Set(['busWreck', 'truck', 'car', 'boxcar', 'snowplow']);
function edColAuto(P, x, y, z, ry) {
  if (!ED_COL_AUTO.has(P.nome) || (P.a && P.a.length)) return;
  const T = edPrefabTam(P.nome); if (!T) return;
  DECOR.save().move(x, y, z).rotY(ry); if (P.e && P.e !== 1) DECOR.scl(P.e);
  DECOR.col(T[0] + 0.05, T[1] - 0.05, Math.max(0, T[4]), T[5], T[2] + 0.05, T[3] - 0.05, 'metal');
  DECOR.restore();
}
// paredes invisíveis que vêm dentro de um prefab (KC_INVIS[nome]: [x0, x1, y0, y1, z0, z1] da peça): seguram gente, não bala
function edInvPrefab(P) {
  const E = typeof KC_INVIS !== 'undefined' && KC_INVIS[P.nome];
  if (!E || !E.length) return;
  const q = (((Math.round((P.r || 0) / 90) % 4) + 4) % 4), c = [1, 0, -1, 0][q], s = [0, 1, 0, -1][q], [px, py, pz] = P.p;
  const tr = (x, z) => [px + x * c + z * s, pz - x * s + z * c];
  for (const [x0, x1, y0, y1, z0, z1] of E) { const a = tr(x0, z0), b = tr(x1, z1); glassWall(a[0], b[0], py + y0, py + y1, a[1], b[1]); }
}
// Os vidros do prefab são props independentes: desaparecem e deixam de colidir ao quebrar.
function edVidrosPrefab(P) {
  const E = typeof KC_VIDROS !== 'undefined' && KC_VIDROS[P.nome];
  if (!E) return;
  const a = (P.r || 0) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), e = P.e || 1, [px, py, pz] = P.p;
  for (const [x, y, z, w, h, r] of E) DECOR.dyn('iaVidro', px + e * (x * c + z * s), py + e * y, pz + e * (-x * s + z * c), a + r, { a: [w * e, h * e] });
}
/* ---------- grafite: texto pintado com spray numa parede (peça "grafite" do editor) ----------
   { t: 'grafite', p: [x, y, z] (centro de baixo), r: graus, s: [largura, altura], texto, estilo, cor: [r,g,b], borda: [r,g,b] }
   estilo: 'bomb' (letra gorda com contorno e sombra), 'pixo' (pichação reta, letra alta e fina), 'escorre' (com tinta
   escorrendo) ou 'tag' (assinatura rabiscada). Desenhado num canvas na hora: o .json só guarda o texto, o estilo e as cores. */
const ED_GRAF_ESTILOS = [['bomb', 'Grafite gordo'], ['pixo', 'Pixo reto'], ['escorre', 'Escorrendo'], ['tag', 'Tag (assinatura)']];
const edRgb = (c, a = 1) => 'rgba(' + Math.round(c[0] * 255) + ',' + Math.round(c[1] * 255) + ',' + Math.round(c[2] * 255) + ',' + a + ')';
function edGrafiteCanvas(G) {
  const [w, h] = G.s || [3, 1.2], W = 1024, H = Math.max(96, Math.min(1024, Math.round((W * h) / w)));
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  const txt = String(G.texto || ' ').slice(0, 40), est = G.estilo || 'bomb', cor = G.cor || [0.98, 0.8, 0.1], bor = G.borda || [0.08, 0.08, 0.1];
  const R = rngOf(txt.length * 31 + (txt.charCodeAt(0) || 1));
  const fontes = { bomb: '900 {s}px Impact, "Arial Black", sans-serif', escorre: '900 {s}px Impact, "Arial Black", sans-serif', pixo: '700 {s}px "Arial Narrow", Impact, sans-serif', tag: 'italic 700 {s}px "Segoe Script", "Brush Script MT", cursive' };
  const fonte = fontes[est] || fontes.bomb, texto = est === 'tag' ? txt : txt.toUpperCase(), estica = est === 'pixo' ? 1.9 : 1; // o pixo é alto e fino
  g.font = fonte.replace('{s}', 100);
  const larg = g.measureText(texto).width || 1;
  const s = Math.min(H * (est === 'pixo' ? 0.48 : 0.72), (W * 0.9 * 100) / larg); g.font = fonte.replace('{s}', Math.round(s));
  g.save(); g.translate(W / 2, H / 2 + (est === 'pixo' ? 0 : s * 0.05)); g.rotate(est === 'tag' ? -0.12 : est === 'pixo' ? 0 : -0.05); g.scale(1, estica);
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = edRgb(cor, 0.55); g.shadowBlur = s * 0.12; // névoa do spray em volta
  if (est === 'bomb' || est === 'escorre') {
    g.fillStyle = edRgb(bor, 0.55); g.fillText(texto, s * 0.07, s * 0.07); // sombra
    g.shadowBlur = s * 0.06; g.lineWidth = s * 0.18; g.strokeStyle = edRgb(bor); g.strokeText(texto, 0, 0);
    const gr = g.createLinearGradient(0, -s / 2, 0, s / 2); gr.addColorStop(0, edRgb(cor.map((v) => Math.min(1, v * 1.25 + 0.1)))); gr.addColorStop(1, edRgb(cor.map((v) => v * 0.75)));
    g.shadowBlur = 0; g.fillStyle = gr; g.fillText(texto, 0, 0);
    g.fillStyle = 'rgba(255,255,255,0.85)'; for (let i = 0; i < 6; i++) { const x = (R() - 0.5) * W * 0.7, y = (R() - 0.7) * s * 0.4; g.beginPath(); g.arc(x, y, s * R.range(0.02, 0.045), 0, TAU); g.fill(); }
  } else if (est === 'pixo') {
    g.shadowBlur = s * 0.04; g.lineWidth = s * 0.06; g.strokeStyle = edRgb(cor); g.strokeText(texto, 0, 0); g.fillStyle = edRgb(cor); g.fillText(texto, 0, 0);
  } else {
    g.lineWidth = s * 0.05; g.strokeStyle = edRgb(bor, 0.8); g.strokeText(texto, 0, 0); g.fillStyle = edRgb(cor); g.fillText(texto, 0, 0);
    const lt = (larg * s) / 100; g.lineWidth = s * 0.06; g.strokeStyle = edRgb(cor); g.beginPath(); g.moveTo(-lt * 0.5, s * 0.45); g.quadraticCurveTo(0, s * 0.62, lt * 0.55, s * 0.38); g.stroke();
  }
  g.restore();
  if (est === 'escorre') { // tinta escorrendo de baixo das letras
    g.fillStyle = edRgb(cor.map((v) => v * 0.85)); const base = H / 2 + s * 0.3;
    for (let i = 0; i < 14; i++) { const x = W * 0.08 + R() * W * 0.84, L = R.range(0.08, 0.38) * H, r = s * R.range(0.012, 0.03); g.fillRect(x - r, base - s * 0.1, 2 * r, L); g.beginPath(); g.arc(x, base - s * 0.1 + L, r * 1.4, 0, TAU); g.fill(); }
  }
  g.fillStyle = edRgb(cor, 0.6); // pontinhos de spray soltos
  for (let i = 0; i < 260; i++) { const x = W / 2 + (R() - 0.5) * W * 0.95, y = H / 2 + (R() - 0.5) * H * 0.85; g.fillRect(x, y, R.range(1, 2.6), R.range(1, 2.6)); }
  return cv;
}
const ED_GRAF_TEX = new Map();
function edGrafiteMaterial(G) {
  const k = JSON.stringify([G.texto, G.estilo, G.cor, G.borda, G.s]);
  if (!ED_GRAF_TEX.has(k)) { const t = new THREE.CanvasTexture(edGrafiteCanvas(G)); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; ED_GRAF_TEX.set(k, t); }
  return new THREE.MeshStandardMaterial({ map: ED_GRAF_TEX.get(k), transparent: true, depthWrite: false, roughness: 0.92, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
}
// a malha do grafite: um plano encostado na frente (+z) da posição, com o pé no y da peça
function edGrafiteMalha(G) {
  const [w, h] = G.s || [3, 1.2], m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), edGrafiteMaterial(G));
  const ry = ((G.r || 0) * Math.PI) / 180; m.position.set(G.p[0] + Math.sin(ry) * 0.02, G.p[1] + h / 2, G.p[2] + Math.cos(ry) * 0.02); m.rotation.y = ry;
  return m;
}
// monta as peças (também usado pelo botão "Jogar" do editor)
function edConstruir(J) {
  for (const P of J.pecas || []) {
    try {
      const [x, y, z] = P.p, ry = ((P.r || 0) * Math.PI) / 180;
      if (P.t === 'caixa' && P.inv) { const B = edCaixaBox(P); glassWall(B.x0, B.x1, B.y0, B.y1, B.z0, B.z1); } // parede invisível: só segura gente
      else if (P.t === 'caixa') { const B = edCaixaBox(P); box(P.m || 'paint', B.x0, B.x1, B.y0, B.y1, B.z0, B.z1, { tint: P.cor || [0.9, 0.9, 0.9], collide: P.col !== false, uv: edUv(P) }); }
      else if (P.t === 'escada') edEscada(P);
      else if (P.t === 'prefab' && PF[P.nome]) { DECOR.place(PF[P.nome](...(P.a || [])), x, y, z, ry, P.e ? { s: P.e } : undefined); edEscadasPrefab(P); edInvPrefab(P); edColAuto(P, x, y, z, ry); edVidrosPrefab(P); }
      else if (P.t === 'prop' && PROPT[P.nome]) DECOR.dyn(P.nome, x, y, z, ry, P.a ? { a: P.a } : {});
      else if (P.t === 'grafite') { const m = edGrafiteMalha(P); m.updateMatrix(); m.matrixAutoUpdate = false; (MAPL.root || scene).add(m); }
      else if (P.t === 'luz') { DECOR.lamp(x, y, z, P.cor || [1, 0.85, 0.65], P.forca || 1.4, P.raio || 7, 0.6); }
    } catch (e) { console.warn('peça do mapa', P, e); }
  }
}
function tiroMapaRegistrar(J) {
  const base = MAP_DEFS[J.ceu] || MAP_DEFS.meltem || Object.values(MAP_DEFS)[0], L = edLimites(J), mar = J.mar && typeof J.mar.y === 'number' ? J.mar : null;
  const sx = L.x1 - L.x0, sz = L.z1 - L.z0, raio = Math.max(sx, sz) / 2;
  const dom = J.dom && J.dom.length === 3 ? J.dom : null;
  MAP_DEFS[J.id] = {
    type: J.tipo || 'mid', mar: !!mar, editor: true,
    void: { kill: Math.min(L.y0, mar ? mar.y : L.y0) - 1.5 },
    // limites com o tamanho de verdade de cada prefab, medidos só quando o mapa começa (para não montar prefab ao abrir a página)
    get bounds() { if (!this._lim) { const M = edLimites(J, true); this._lim = { x0: M.x0, x1: M.x1, z0: M.z0, z1: M.z1 }; } return this._lim; },
    textures: edTexturasDoMapa(J), surfaces: mar ? ['ripple', ...ED_TEX_NOSSAS] : ED_TEX_NOSSAS.slice(),
    sound: mar ? { pack: 'amb_embruns', bed: 0.5, water: () => 0, loops: [[L.x0, -4, 0], [L.x1, -4, 0]].map((p) => ({ id: 'a_waves', p, gain: 0.4, ref: 6, roll: 1.3, max: 120 })), spots: [] }
      : { pack: base.sound && base.sound.pack, bed: 0.5, loops: [], spots: [] },
    materials: () => {},
    art: { cam: [L.x0 - 8, 10, L.z1 + 8], look: [0, 1, 0], fov: 55 },
    splat: { x0: -128, z0: -128, w: 256, d: 256, ppm: 2 }, far: 600,
    build() {
      if (mar) waterSetup({ y: mar.y, box: [-2000, 2000, -2000, 2000], open: [-260, -120], east: 900 }); edConstruir(J); if (mar) waterLand(L.x0, L.x1, L.z0, L.z1); },
    after: mar ? () => waterBuild({ deep: [0.0, 0.03, 0.1], shallow: [0.0, 0.08, 0.14], scatter: [0.01, 0.07, 0.11], foam: [0.85, 0.88, 0.88], refl: 1.0, caus: 0, foamK: 0.6 }) : undefined,
    ready: mar ? () => waterReady({ from: [L.x0 - 30, mar.y + 2.5, 0] }) : undefined,
    spawns: (J.nascer && J.nascer.length ? J.nascer : [[0, Math.max(4, L.z1 - 4)]]).map(([x, z]) => [x, z]),
    poi: edPois(J, L),
    dom, mecha: J.mecha && J.mecha.length === 3 ? J.mecha : dom,
    lane: (x) => (x < L.x0 + sx / 3 ? 'L' : x > L.x1 - sx / 3 ? 'E' : 'M'),
    sniper: J.sniper || [0, 3, 0], coverZ: Math.max(8, L.z1 - 4), heli: [Math.max(20, raio), 50], cam: Math.max(30, raio * 1.1),
    surface: () => J.som || 'wood',
    zones: J.zonas && J.zonas.length ? J.zonas : [[J.nome || J.id, L.x0, L.x1, L.z0, L.z1]],
    atmo: base.atmo,
  };
  const ja = MAPS.find((m) => m.id === J.id), info = { id: J.id, name: J.nome || J.id, tag: J.tag || 'Mapa do editor', ok: true, desc: J.desc || '' };
  if (ja) Object.assign(ja, info); else MAPS.push(info);
  if (J.capa) MAP_ART[J.id] = J.capa;
  return MAP_DEFS[J.id];
}
// "ativo": false tira o mapa da lista do jogo (continua no editor, que abre e joga pelo Jogar)
for (const J of (typeof TIRO_MAPAS_JSON !== 'undefined' ? TIRO_MAPAS_JSON : [])) { if (J.ativo === false) continue; try { tiroMapaRegistrar(J); } catch (e) { console.error('mapa do editor', J && J.id, e); } }
