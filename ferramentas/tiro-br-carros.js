/* Carros de F1 do Battle royale. Montado depois de tiro-br-dupla.js no mesmo script do jogo.
   A frente é -z. O anfitrião arbitra a ocupação e os pontos de vida; o motorista publica a pose.
   O desenho é uma aproximação leve das proporções do F1 da Corrida, sem marcas reais. */
const BR_F1 = { carros: [], meu: null, pedido: null, tempo: 0, sync: 0, resolvendo: false, geos: [], mat: null };
NET_WSPECIAL.brCarro = 'Carro de F1';
const BR_F1_CORES = [[0.82, 0.13, 0.11], [0.12, 0.32, 0.75], [0.10, 0.48, 0.28], [0.86, 0.68, 0.10]];
const BR_F1_PONTOS = [
  [[-115, 49, Math.PI / 2], [-62, 50, Math.PI / 2], [-30, 50, Math.PI / 2], [15, 50, Math.PI / 2], [65, 50, Math.PI / 2], [100, 50, Math.PI / 2], [-115, -49, Math.PI / 2], [65, -50, Math.PI / 2]],
  [[-220, 0, Math.PI / 2], [-208, 0, Math.PI / 2], [-158, 0, Math.PI / 2], [-139, 18, 0], [-139, -18, 0], [-139, 60, 0], [-139, -60, 0]],
  [[200, 38, Math.PI / 2], [205, 38, Math.PI / 2], [210, 38, Math.PI / 2], [200, -38, Math.PI / 2], [205, -38, Math.PI / 2], [210, -38, Math.PI / 2], [225, 4, Math.PI / 2], [185, -4, Math.PI / 2]],
];
const _bfP = new V3(), _bfQ = new V3(), _bfR = new V3(), _bfBox = new THREE.Box3(new V3(-0.9, 0.12, -2.2), new V3(0.9, 0.82, 2.2));
const _bfRay = new THREE.Ray(), _bfInv = new THREE.Matrix4(), _bfHit = new V3();
function brF1Host() { return !MATCH.online || NET.role === 'host'; }
function brF1Id(e) { return MATCH.online ? netIdOf(e) : (e === PL.ent ? 'local' : 'bot:' + (e && e.id)); }
function brF1Pessoa(id) { return MATCH.online ? netEntity(id) : (id === 'local' ? PL.ent : null); }
function brF1Envia(ev, ent) { if (MATCH.online && NET.on) netEvent(ev, ent || PL.ent); }

// Uma geometria por pintura e uma chamada de desenho por carro; rodas, asas e casco compartilham material.
function brF1Geometria(cor) {
  if (BR_F1.geos[cor]) return BR_F1.geos[cor];
  const partes = [], principal = BR_F1_CORES[cor], preto = [0.055, 0.055, 0.065], claro = [0.86, 0.87, 0.88];
  const caixa = (w, h, d, x, y, z, rgb) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); partes.push([g, rgb]); };
  caixa(1.15, 0.25, 2.75, 0, 0.38, 0.25, principal); // monocoque e bico
  caixa(0.55, 0.23, 1.65, 0, 0.32, -1.45, principal);
  caixa(1.85, 0.12, 0.38, 0, 0.18, -2.08, preto); // asa dianteira
  caixa(1.72, 0.13, 0.4, 0, 0.88, 1.95, principal); // asa traseira
  caixa(0.13, 0.55, 0.2, -0.7, 0.64, 1.92, preto); caixa(0.13, 0.55, 0.2, 0.7, 0.64, 1.92, preto);
  caixa(1.38, 0.18, 1.2, 0, 0.3, 0.65, preto); caixa(0.45, 0.38, 0.85, 0, 0.61, 1.02, principal);
  caixa(0.13, 0.22, 0.95, -0.48, 0.61, -0.06, claro); caixa(0.13, 0.22, 0.95, 0.48, 0.61, -0.06, claro);
  for (const x of [-0.92, 0.92]) for (const z of [-1.35, 1.35]) {
    const g = new THREE.CylinderGeometry(0.34, 0.34, 0.34, 12); g.rotateZ(Math.PI / 2); g.translate(x, 0.34, z); partes.push([g, preto]);
  }
  let nv = 0, ni = 0; for (const [g] of partes) { nv += g.attributes.position.count; ni += g.index.count; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), cores = new Float32Array(nv * 3), idx = new Uint32Array(ni);
  let v = 0, n = 0;
  for (const [g, rgb] of partes) {
    const p = g.attributes.position, a = g.attributes.normal;
    for (let i = 0; i < p.count; i++) { pos.set([p.getX(i), p.getY(i), p.getZ(i)], (v + i) * 3); nor.set([a.getX(i), a.getY(i), a.getZ(i)], (v + i) * 3); cores.set(rgb, (v + i) * 3); }
    for (let i = 0; i < g.index.count; i++) idx[n++] = v + g.index.getX(i);
    v += p.count; g.dispose();
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('color', new THREE.BufferAttribute(cores, 3)); geo.setIndex(new THREE.BufferAttribute(idx, 1)); geo.computeBoundingSphere();
  return BR_F1.geos[cor] = geo;
}
function brF1Novo(x, y, z, yaw, cor) {
  if (!BR_F1.mat) BR_F1.mat = csmMaterial(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.65, metalness: 0.15 }));
  const mesh = new THREE.Mesh(brF1Geometria(cor), BR_F1.mat); mesh.castShadow = true; mesh.receiveShadow = true; mesh.position.set(x, y, z); mesh.rotation.y = yaw; scene.add(mesh);
  const c = { id: BR_F1.carros.length, p: new V3(x, y, z), alvo: new V3(x, y, z), yaw, alvoYaw: yaw, vel: 0, hp: 300, dono: '', versao: 0, mesh, morto: false, tiros: new Map() };
  BR_F1.carros.push(c); return c;
}
function brF1Livre(x, z) {
  if (x < MAP.x0 + 3 || x > MAP.x1 - 3 || z < MAP.z0 + 3 || z > MAP.z1 - 3) return null;
  const y = groundHeight(x, z, 0.5, 0.3);
  for (const a of queryBoxes(x - 2.4, z - 2.4, x + 2.4, z + 2.4)) {
    if (a.ray || a.y1 <= y + 0.15 || a.y0 >= y + 1.8) continue;
    if (a.x0 < x + 2.4 && a.x1 > x - 2.4 && a.z0 < z + 2.4 && a.z1 > z - 2.4) return null;
  }
  for (const a of BR_F1.carros) if (hyp(a.p.x - x, a.p.z - z) < 6) return null;
  return y;
}
function brF1Inicio() {
  if (!BR.on) return;
  const seed = MATCH.online ? brHash(String(netCodeNow() || '') + '|' + CURMAP.id) : (Math.random() * 4294967296) >>> 0;
  const rnd = brRng(seed ^ 0x6f13b52d);
  if (CURMAP.id === 'favela-grande') {
    const grupos = BR_F1_PONTOS.map((a) => a.slice());
    for (const a of grupos) for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    // Alterna os três bairros antes de repetir, evitando concentrar os carros numa única área.
    let progresso = true; while (BR_F1.carros.length < 9 && progresso) {
      progresso = false;
      for (const a of grupos) while (a.length && BR_F1.carros.length < 9) {
        const [x, z, r] = a.pop(), y = brF1Livre(x, z); if (y === null) continue;
        brF1Novo(x, y, z, r, Math.floor(rnd() * BR_F1_CORES.length)); progresso = true; break;
      }
    }
  } else {
    const ids = []; for (let i = 0; i < NAV.count; i++) if (!NAV.comp || NAV.comp[i] === NAV.mainComp) ids.push(i);
    for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    for (const i of ids) { if (BR_F1.carros.length >= 6) break; const x = NAV.nx[i], z = NAV.nz[i], y = brF1Livre(x, z); if (y !== null && Math.abs(NAV.ny[i] - y) < 0.4) brF1Novo(x, y, z, rnd() * TAU, Math.floor(rnd() * BR_F1_CORES.length)); }
  }
}
function brF1Limpa() {
  if (BR_F1.meu) brF1SairLocal(false, true);
  for (const c of BR_F1.carros) scene.remove(c.mesh);
  for (const g of BR_F1.geos) if (g) g.dispose();
  if (BR_F1.mat) BR_F1.mat.dispose(); BR_F1.geos = []; BR_F1.mat = null;
  BR_F1.carros = []; BR_F1.meu = null; BR_F1.pedido = null; BR_F1.sync = 0;
}
function brF1Perto() {
  const e = PL.ent; if (!BR.on || !e || !e.alive || e.brQueda || e.brCaido || KS.mode || PILOT.d || MECHA_P.me || MATCH.state !== 'playing') return null;
  let melhor = null, d = 3.8;
  for (const c of BR_F1.carros) { if (c.morto || c.dono) continue; const k = hyp(c.p.x - e.pos.x, c.p.z - e.pos.z); if (k < d && Math.abs(c.p.y - e.pos.y) < 1.5) { d = k; melhor = c; } }
  return melhor;
}
function brF1EntrarLocal(c) {
  if (BR_F1.meu || !PL.ent.alive || PL.ent.brQueda || PL.ent.brCaido) return;
  BR_F1.meu = c; BR_F1.pedido = null; c.vel = 0; PL.ent.pos.copy(c.p); PL.ent.vel.set(0, 0, 0);
  PL.held = PL.queued = PL.adsWant = false; PL.reload = null; PL.nadeState = null; PL.knifeT = 0; VM.action = null; VM.root.visible = false;
  PL.ent.crouch = true; PL.ent.crouchAmt = 1; hudMsg('Você entrou no carro. Use E para sair.', 'neutral', 2);
}
function brF1SairLocal(avisar = true, forcar = false) {
  const c = BR_F1.meu; if (!c) return;
  const e = PL.ent, a = c.yaw; let livre = null;
  for (const s of [1, -1]) {
    const p = new V3(c.p.x + s * Math.cos(a) * 2.6, c.p.y, c.p.z - s * Math.sin(a) * 2.6);
    BR_F1.resolvendo = true; try { collideCircle(p, 0.36, 1.75); } finally { BR_F1.resolvendo = false; }
    if (hyp(p.x - c.p.x, p.z - c.p.z) > 1.8 && lineClear(_bfP.set(c.p.x, c.p.y + 1, c.p.z), _bfQ.set(p.x, p.y + 1, p.z))) { p.y = groundHeight(p.x, p.z, p.y + 0.2, 0.3); livre = p; break; }
  }
  if (!livre && !forcar) { if (avisar) hudMsg('Não há espaço para sair aqui.', 'neutral', 1.4); return false; }
  BR_F1.meu = null; PL.held = PL.queued = PL.adsWant = false; e.crouch = false; e.crouchAmt = 0; e.vel.set(0, 0, 0);
  if (livre) e.pos.copy(livre);
  if (e.alive) { VM.root.visible = true; VM.holder.visible = true; }
  if (avisar) { if (brF1Host()) brF1Autoriza(c, ''); else brF1Envia({ k: 'bfSair', c: c.id }); } return true;
}
function brF1Autoriza(c, id) {
  c.dono = id; c.versao++; c.vel = id ? c.vel : 0;
  const ev = { k: 'bfDono', c: c.id, to: id, v: c.versao, x: c.p.x, y: c.p.y, z: c.p.z, r: c.yaw };
  brF1Envia(ev);
  if (id && id === brF1Id(PL.ent)) brF1EntrarLocal(c);
}
function brF1Pedir(c, e) {
  if (!c || c.morto || c.dono || !e || !e.alive || e.brQueda || e.brCaido || hyp(e.pos.x - c.p.x, e.pos.z - c.p.z) > 4.5 || Math.abs(e.pos.y - c.p.y) > 2) return false;
  brF1Autoriza(c, brF1Id(e)); return true;
}
function brF1Usar() {
  if (!BR.on) return false;
  if (BR_F1.meu) { if (Math.abs(BR_F1.meu.vel) < 2) brF1SairLocal(); else hudMsg('Pare o carro para sair.', 'neutral', 1.4); return true; }
  const c = brF1Perto(); if (!c) return false;
  if (brF1Host()) brF1Pedir(c, PL.ent);
  else { if (!BR_F1.pedido || BR_F1.pedido.id !== c.id || MATCH.time - BR_F1.pedido.t > 1) { BR_F1.pedido = { id: c.id, t: MATCH.time }; brF1Envia({ k: 'bfPedir', c: c.id }); hudMsg('Pedindo o carro…', 'neutral', 1); } }
  return true;
}
function brF1Rampa(x, z, r) { for (const p of RAMPS) if (x + r > p.x0 && x - r < p.x1 && z + r > p.z0 && z - r < p.z1) return true; return false; }
function brF1Dirigir(dt) {
  const c = BR_F1.meu, e = PL.ent; if (!c) return;
  if (!BR.on || c.morto || !e.alive || e.brCaido || e.brQueda) { brF1SairLocal(true, true); return; }
  PL.held = PL.queued = PL.adsWant = false; mouseDX = mouseDY = 0; e.busy = true; VM.root.visible = false;
  const fw = padClamp((TOUCH.on ? TOUCH.mz : (KEYS.KeyW || KEYS.ArrowUp ? 1 : 0) - (KEYS.KeyS || KEYS.ArrowDown ? 1 : 0)) + PAD.mz);
  const st = padClamp((TOUCH.on ? TOUCH.mx : (KEYS.KeyD || KEYS.ArrowRight ? 1 : 0) - (KEYS.KeyA || KEYS.ArrowLeft ? 1 : 0)) + PAD.mx);
  const alvo = fw > 0.05 ? 30 * fw : fw < -0.05 ? 10 * fw : 0, taxa = fw ? 7 : 3;
  c.vel += clamp(alvo - c.vel, -taxa * dt, taxa * dt); c.yaw -= st * clamp(Math.abs(c.vel) / 7, 0, 1) * (c.vel < 0 ? -1 : 1) * 1.2 * dt;
  const partes = Math.max(1, Math.ceil(Math.abs(c.vel * dt) / 0.35));
  for (let i = 0; i < partes; i++) {
    const passo = c.vel * dt / partes, x0 = c.p.x, z0 = c.p.z, sx = -Math.sin(c.yaw), sz = -Math.cos(c.yaw);
    const p = _bfP.set(x0 + sx * passo, c.p.y, z0 + sz * passo);
    if (brF1Rampa(p.x, p.z, 1.2)) { c.vel = 0; break; }
    BR_F1.resolvendo = true;
    try {
      for (const off of [-1.15, 1.15]) { const q = _bfQ.set(p.x + sx * off, p.y, p.z + sz * off), ox = q.x, oz = q.z; collideCircle(q, 1.05, 1.25); p.x += q.x - ox; p.z += q.z - oz; }
    } finally { BR_F1.resolvendo = false; }
    if (BR_F1.carros.some((o) => o !== c && !o.morto && Math.abs(o.p.y - p.y) < 1.5 && hyp(o.p.x - p.x, o.p.z - p.z) < 3.2)) { c.vel = 0; break; }
    const y = groundHeight(p.x, p.z, c.p.y + 0.25, 0.5);
    if (y > c.p.y + 0.25 || hyp(p.x - x0, p.z - z0) < Math.abs(passo) * 0.2) { c.vel = 0; break; }
    p.y = Math.max(y, c.p.y - 10 * dt / partes); c.p.copy(p);
  }
  e.pos.copy(c.p); e.vel.set(-Math.sin(c.yaw) * c.vel, 0, -Math.cos(c.yaw) * c.vel); e.yaw = c.yaw; e.pitch = 0; e.onGround = true;
  e.crouch = true; e.crouchAmt = 1; c.alvo.copy(c.p); c.alvoYaw = c.yaw; c.mesh.position.copy(c.p); c.mesh.rotation.y = c.yaw;
  if (ringCheck(e, dt) || voidCheck(e) || !e.alive) { brF1SairLocal(); return; }
  // Só a máquina do motorista decide o atropelamento, como os tiros do jogo.
  if (Math.abs(c.vel) > 8) for (const v of entities) {
    if (v === e || !v.alive || v.off || v.brQueda || allied(v, e)) continue;
    const d = hyp(v.pos.x - c.p.x, v.pos.z - c.p.z); if (d > 2.1 || Math.abs(v.pos.y - c.p.y) > 1.5 || MATCH.time - (c.tiros.get(v) || -99) < 1) continue;
    c.tiros.set(v, MATCH.time); applyDamage(v, clamp((Math.abs(c.vel) - 8) * 6, 0, 140), e, NET_WSPECIAL.brCarro, false, _bfR.set(-Math.sin(c.yaw), 0, -Math.cos(c.yaw)).clone());
  }
  const alvoCam = _bfQ.set(c.p.x, c.p.y + 1.05, c.p.z), dest = _bfR.set(c.p.x + Math.sin(c.yaw) * 6, c.p.y + 3.4, c.p.z + Math.cos(c.yaw) * 6);
  const d = dest.clone().sub(alvoCam), dist = d.length(); d.normalize(); const obst = rayWorld(alvoCam.x, alvoCam.y, alvoCam.z, d.x, d.y, d.z, dist, 0);
  if (obst) dest.copy(alvoCam).addScaledVector(d, Math.max(0.6, obst.t - 0.25));
  camera.position.lerp(dest, 1 - Math.exp(-9 * dt)); camera.lookAt(alvoCam); PL.yaw = c.yaw; PL.pitch = 0;
  if (MATCH.online && (BR_F1.tempo -= dt) <= 0) { BR_F1.tempo = 0.15; brF1Envia({ k: 'bfPose', c: c.id, x: +c.p.x.toFixed(2), y: +c.p.y.toFixed(2), z: +c.p.z.toFixed(2), r: +c.yaw.toFixed(3), s: +c.vel.toFixed(1) }); }
}

function brF1Explodir(c, atacante) {
  if (c.morto) return;
  c.morto = true; c.hp = 0; c.mesh.visible = false;
  const ocupante = c === BR_F1.meu ? PL.ent : brF1Pessoa(c.dono), local = ocupante === PL.ent;
  if (local) { brF1SairLocal(false, true); if (ocupante.alive) { ocupante.protT = 0; killEnt(ocupante, atacante || ocupante, NET_WSPECIAL.brCarro, false, new V3(0, 1, 0)); } }
  c.dono = '';
  const quem = atacante || PL.ent, p = new V3(c.p.x, c.p.y + 0.5, c.p.z);
  explode(p, quem, NET_WSPECIAL.brCarro, 5, 110);
}
function brF1DanoHost(c, dano, atacante) {
  if (!brF1Host() || !c || c.morto || !atacante) return;
  c.hp = Math.max(0, c.hp - clamp(dano, 0, 200));
  c.atacante = brF1Id(atacante);
  brF1Envia({ k: 'bfVida', c: c.id, h: Math.round(c.hp), by: c.atacante, to: c.dono });
  if (c.hp <= 0) brF1Explodir(c, atacante);
}
function brF1Dano(c, dano, atacante) {
  if (brF1Host()) brF1DanoHost(c, dano, atacante);
  else if (atacante && netIsLocal(atacante)) brF1Envia({ k: 'bfDano', c: c.id, d: Math.round(dano) }, atacante);
}
function brF1Ray(o, dir, max, atirador) {
  let melhor = null, dist = max;
  for (const c of BR_F1.carros) {
    if (c.morto || (c.dono && c.dono === brF1Id(atirador))) continue;
    c.mesh.updateMatrixWorld(); _bfInv.copy(c.mesh.matrixWorld).invert();
    _bfRay.set(o, dir).applyMatrix4(_bfInv); const h = _bfRay.intersectBox(_bfBox, _bfHit); if (!h) continue;
    const t = _bfRay.origin.distanceTo(h); if (t < dist) { dist = t; melhor = c; }
  }
  return melhor ? { carro: melhor, t: dist } : null;
}
function brF1Passo(dt) {
  if (!BR.on) return;
  if (BR_F1.pedido && MATCH.time - BR_F1.pedido.t > 3) { BR_F1.pedido = null; hudMsg('O carro não está disponível.', 'neutral', 1.5); }
  for (const c of BR_F1.carros) {
    if (c.morto) continue;
    if (brF1Host() && c.dono) { const e = brF1Pessoa(c.dono); if (!e || !e.alive || e.brCaido) { if (c === BR_F1.meu) brF1SairLocal(false, true); brF1Autoriza(c, ''); } }
    if (c !== BR_F1.meu) { const k = 1 - Math.exp(-10 * dt); c.p.lerp(c.alvo, k); c.yaw += angDiff(c.yaw, c.alvoYaw) * k; c.mesh.position.copy(c.p); c.mesh.rotation.y = c.yaw; }
  }
  // Um participante que entra tarde ou se reconecta recebe ocupação, vida e posição mesmo após os eventos originais expirarem.
  if (MATCH.online && NET.role === 'host' && (BR_F1.sync -= dt) <= 0) {
    BR_F1.sync = 2;
    brF1Envia({ k: 'bfSync', a: BR_F1.carros.map((c) => [c.id, c.versao, c.dono, Math.round(c.hp), +c.p.x.toFixed(2), +c.p.y.toFixed(2), +c.p.z.toFixed(2), +c.yaw.toFixed(3), c.atacante || '']) });
  }
}
{
  const inicio0 = brInicio;
  brInicio = function () { inicio0(); brF1Inicio(); };
  const limpa0 = brLimpa;
  brLimpa = function () { brF1Limpa(); limpa0(); };
  const passo0 = brUpdate;
  brUpdate = function (dt) { passo0(dt); brF1Passo(dt); };
  const player0 = updatePlayer;
  updatePlayer = function (dt, now) { if (BR.on && BR_F1.meu && PL.ent.alive) return brF1Dirigir(dt); return player0(dt, now); };
  const uso0 = mechaUse;
  mechaUse = function () { return brF1Usar() || uso0(); };
  const perto0 = mechaNear;
  mechaNear = function () { return perto0() || (BR.on && (BR_F1.meu || brF1Perto())) || null; };
  const aviso0 = mechaPrompt;
  mechaPrompt = function () { if (BR.on && (BR_F1.meu || brF1Perto())) return `${actGlyph('use')} ${BR_F1.meu ? 'Sair do carro' : 'Entrar no carro'}`; return aviso0(); };
  const toque0 = touchTick;
  touchTick = function () { toque0(); if (BR.on && (BR_F1.meu || brF1Perto()) && TC.el.pick) TC.el.pick.setAttribute('aria-label', BR_F1.meu ? 'Sair do carro' : 'Entrar no carro'); };
  const tecla0 = onKey;
  onKey = function (ev, down) {
    if (!BR.on || !BR_F1.meu || MATCH.state !== 'playing' || !pointerActive()) return tecla0(ev, down);
    const k = keyCanon(ev.code); if (!k) return;
    if (k === 'Escape' || k === 'Tab') return tecla0(ev, down);
    const anterior = KEYS[k]; KEYS[k] = down;
    if (k === 'KeyE' && down && !anterior) brF1Usar();
    if (k === 'Space' || k.startsWith('Arrow')) ev.preventDefault();
  };
  const nade0 = cookNade;
  cookNade = function () { if (BR.on && BR_F1.meu) return; return nade0.apply(this, arguments); };
  const faca0 = knifeButton;
  knifeButton = function () { if (BR.on && BR_F1.meu) return; return faca0.apply(this, arguments); };
  const troca0 = switchWeapon;
  switchWeapon = function () { if (BR.on && BR_F1.meu) return; return troca0.apply(this, arguments); };
  // Carro estacionado é obstáculo de gente e bots. A física do próprio carro consulta só as paredes do mapa.
  const colisao0 = collideCircle;
  collideCircle = function (pos, r, h) {
    colisao0(pos, r, h); if (!BR.on || BR_F1.resolvendo) return;
    for (const c of BR_F1.carros) {
      if (c.morto || Math.abs(c.p.y - pos.y) > 1.5) continue;
      let dx = pos.x - c.p.x, dz = pos.z - c.p.z, d = hyp(dx, dz), limite = r + 2.05;
      if (d >= limite) continue; if (d < 0.001) { dx = 1; dz = 0; d = 1; } pos.x += dx / d * (limite - d); pos.z += dz / d * (limite - d);
    }
  };
  const bot0 = updateBot;
  updateBot = function (b, dt, now) {
    const r = bot0(b, dt, now); if (!BR.on || !b.alive || b.isRemote || b.brQueda || b.brCaido || b.visible || now < (b.brF1Desvio || 0)) return r;
    for (const c of BR_F1.carros) {
      if (c.morto || c.dono || hyp(c.p.x - b.pos.x, c.p.z - b.pos.z) > 4 || !b.goal) continue;
      const vx = b.goal.x - b.pos.x, vz = b.goal.z - b.pos.z, cx = c.p.x - b.pos.x, cz = c.p.z - b.pos.z;
      if (vx * cx + vz * cz <= 0) continue;
      const l = hyp(vx, vz) || 1, s = vx * cz - vz * cx >= 0 ? -1 : 1;
      setPath(b, new V3(c.p.x - vz / l * 4 * s, c.p.y, c.p.z + vx / l * 4 * s)); b.brF1Desvio = now + 2; break;
    }
    return r;
  };
  // Um raio acerta a carroceria antes de chamar o tiro normal; acima dela a cabine fica aberta ao soldado.
  const tiro0 = fireRay;
  fireRay = function (atirador, origem, dir, def, boca, tracante, multiplicador = 1) {
    if (!BR.on || atirador.isRemote || !BR_F1.carros.length) return tiro0.apply(this, arguments);
    const hit = brF1Ray(origem, dir, 300, atirador); if (!hit) return tiro0.apply(this, arguments);
    const mundo = rayWorld(origem.x, origem.y, origem.z, dir.x, dir.y, dir.z, hit.t, 1), soldado = rayEntities(origem, dir, hit.t, atirador);
    if (mundo || soldado) return tiro0.apply(this, arguments);
    const fim = origem.clone().addScaledVector(dir, hit.t), dano = propDamage(def, hit.t) * multiplicador;
    brF1Dano(hit.carro, dano, atirador); if (tracante && boca) FX.tracers.add(boca, fim);
    impactFx(fim, dir.clone().negate(), 'metal', false, true); if (atirador.isPlayer) { PL.actT = MATCH.time; sfxImpact(fim, 'metal'); hitFeedback(false, false); }
    return null;
  };
  const matar0 = killEnt;
  killEnt = function (v, a, arma, head, dir, life) { if (v === PL.ent && BR_F1.meu) brF1SairLocal(true, true); return matar0(v, a, arma, head, dir, life); };
  const rede0 = netEventIn;
  netEventIn = function (e, ev) {
    if (!BR.on || !ev || !/^bf/.test(ev.k || '')) return rede0(e, ev);
    if (ev.k === 'bfSync') {
      if (brF1Host() || !e || netIdOf(e) !== NET.hostId || !Array.isArray(ev.a)) return;
      for (const a of ev.a.slice(0, 10)) {
        if (!Array.isArray(a)) continue; const c = BR_F1.carros[a[0] | 0]; if (!c || c.morto || (a[1] | 0) < c.versao) continue;
        c.versao = a[1] | 0; c.dono = typeof a[2] === 'string' ? a[2] : ''; c.hp = clamp(+a[3] || 0, 0, 300);
        if (!c.hp) { brF1Explodir(c, brF1Pessoa(a[8]) || e); continue; }
        if (c.dono !== NET.me) { c.alvo.set(clamp(+a[4] || 0, MAP.x0, MAP.x1), clamp(+a[5] || 0, -50, 300), clamp(+a[6] || 0, MAP.z0, MAP.z1)); c.alvoYaw = clamp(+a[7] || 0, -1e4, 1e4); if (c === BR_F1.meu) brF1SairLocal(false, true); }
        else if (!BR_F1.meu) brF1EntrarLocal(c);
      }
      return;
    }
    const c = BR_F1.carros[ev.c | 0]; if (!c || !e) return;
    const id = netIdOf(e);
    if (ev.k === 'bfPedir') { if (brF1Host()) brF1Pedir(c, e); return; }
    if (ev.k === 'bfSair') { if (brF1Host() && c.dono === id) brF1Autoriza(c, ''); return; }
    if (ev.k === 'bfDono') {
      if (brF1Host() || id !== NET.hostId || (ev.v | 0) <= c.versao) return;
      c.versao = ev.v | 0; c.dono = typeof ev.to === 'string' ? ev.to : ''; c.alvo.set(clamp(+ev.x || 0, MAP.x0, MAP.x1), clamp(+ev.y || 0, -50, 300), clamp(+ev.z || 0, MAP.z0, MAP.z1)); c.alvoYaw = +ev.r || 0;
      if (c.dono === NET.me) brF1EntrarLocal(c); else if (c === BR_F1.meu) brF1SairLocal(false, true);
      return;
    }
    if (ev.k === 'bfPose') {
      if (c.morto || !c.dono || c.dono !== id) return;
      c.alvo.set(clamp(+ev.x || 0, MAP.x0, MAP.x1), clamp(+ev.y || 0, -50, 300), clamp(+ev.z || 0, MAP.z0, MAP.z1)); c.alvoYaw = clamp(+ev.r || 0, -1e4, 1e4); c.vel = clamp(+ev.s || 0, -10, 30); return;
    }
    if (ev.k === 'bfDano') { if (brF1Host()) brF1DanoHost(c, +ev.d || 0, e); return; }
    if (ev.k === 'bfVida') {
      if (brF1Host() || id !== NET.hostId || c.morto) return;
      c.hp = clamp(+ev.h || 0, 0, 300); if (c.hp <= 0) { if (!c.dono && typeof ev.to === 'string') c.dono = ev.to; brF1Explodir(c, brF1Pessoa(ev.by) || e); } return;
    }
  };
}
