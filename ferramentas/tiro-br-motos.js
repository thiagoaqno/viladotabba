/* MOTOS do Battle royale (2026-11-28, o Thiago: "os únicos veículos para andar serem motos"; aproveita o rascunho dos carros de F1, #1082).
   Montado depois de tiro-br-dupla.js no mesmo script do jogo. A frente é -z. O anfitrião decide quem está em cada moto e a vida dela;
   o piloto simula a moto na máquina dele e publica a pose. Uma pessoa por moto, sentada e exposta (tiro acerta o piloto normalmente);
   o piloto não atira. Hitbox: a moto é uma cápsula fina (BR_MOTO_FORMA) no comprimento dela, para quem anda e para a física dela,
   e uma caixa baixa (só a moto, sem o piloto) para os tiros que acertam a moto. */
const BR_MOTO_FORMA = { meio: 0.62, raio: 0.42, caixa: [0.38, 0.12, 0.98, 1.0], vida: 150, vmax: 24, re: 4, acel: 9, freio: 14, curva: 1.9, inclina: 0.45 };
const BR_MOTO = { motos: [], meu: null, pedido: null, tempo: 0, sync: 0, resolvendo: false, geos: [], mat: null };
NET_WSPECIAL.brMoto = 'Moto';
const BR_MOTO_CORES = [[0.78, 0.12, 0.1], [0.12, 0.3, 0.72], [0.1, 0.1, 0.11], [0.88, 0.7, 0.12]];
// Favela Grande (272 x 212 m): avenida, ruas de divisa, Comércio, Campinho e Rodoviária
const BR_MOTO_PONTOS = [
  [[-112, 50, Math.PI / 2], [-66, 49, Math.PI / 2], [-18, 51, Math.PI / 2], [34, 49, Math.PI / 2], [76, 51, Math.PI / 2], [118, 50, Math.PI / 2], [-90, -50, Math.PI / 2], [10, -49, Math.PI / 2], [96, -51, Math.PI / 2]],
  [[-33, 24, 0], [33, 18, 0], [-93, 30, 0], [93, 12, 0], [-33, -30, 0], [33, -22, 0], [93, -34, 0], [-93, -14, 0]],
  [[62, 14, Math.PI / 2], [-70, 19.5, Math.PI / 2], [110, 2, Math.PI / 2], [62, -14, Math.PI / 2], [-58, -19.5, Math.PI / 2], [120, -2, Math.PI / 2]],
];
const _bmP = new V3(), _bmQ = new V3(), _bmR = new V3(), _bmBox = new THREE.Box3(new V3(-BR_MOTO_FORMA.caixa[0], BR_MOTO_FORMA.caixa[1], -BR_MOTO_FORMA.caixa[2]), new V3(BR_MOTO_FORMA.caixa[0], BR_MOTO_FORMA.caixa[3], BR_MOTO_FORMA.caixa[2]));
const _bmRay = new THREE.Ray(), _bmInv = new THREE.Matrix4(), _bmHit = new V3();
function brMotoHost() { return !MATCH.online || NET.role === 'host'; }
function brMotoId(e) { return MATCH.online ? netIdOf(e) : (e === PL.ent ? 'local' : 'bot:' + (e && e.id)); }
function brMotoPessoa(id) { return MATCH.online ? netEntity(id) : (id === 'local' ? PL.ent : null); }
function brMotoEnvia(ev, ent) { if (MATCH.online && NET.on) netEvent(ev, ent || PL.ent); }

// Uma geometria por pintura e uma chamada de desenho por moto; rodas, quadro e tanque compartilham material.
function brMotoGeometria(cor) {
  if (BR_MOTO.geos[cor]) return BR_MOTO.geos[cor];
  const partes = [], principal = BR_MOTO_CORES[cor], preto = [0.05, 0.05, 0.06], metal = [0.62, 0.63, 0.66], banco = [0.12, 0.1, 0.09];
  const caixa = (w, h, d, x, y, z, rgb) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); partes.push([g, rgb]); };
  for (const z of [-0.72, 0.72]) { const g = new THREE.CylinderGeometry(0.33, 0.33, 0.14, 16); g.rotateZ(Math.PI / 2); g.translate(0, 0.33, z); partes.push([g, preto]); } // rodas
  caixa(0.26, 0.26, 0.95, 0, 0.55, 0.05, metal);           // quadro e motor
  caixa(0.34, 0.24, 0.5, 0, 0.82, -0.22, principal);       // tanque
  caixa(0.3, 0.1, 0.62, 0, 0.86, 0.32, banco);             // banco
  caixa(0.3, 0.16, 0.45, 0, 0.72, 0.72, principal);        // rabeta e para-lama
  caixa(0.08, 0.6, 0.08, 0, 0.72, -0.62, metal);           // garfo
  caixa(0.72, 0.05, 0.05, 0, 1.03, -0.56, preto);          // guidão
  caixa(0.2, 0.18, 0.1, 0, 0.92, -0.72, principal);        // farol e carenagem
  caixa(0.1, 0.1, 0.5, 0.17, 0.38, 0.45, metal);           // escapamento
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
  return BR_MOTO.geos[cor] = geo;
}
function brMotoNovo(x, y, z, yaw, cor) {
  if (!BR_MOTO.mat) BR_MOTO.mat = csmMaterial(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.65, metalness: 0.15 }));
  const mesh = new THREE.Mesh(brMotoGeometria(cor), BR_MOTO.mat); mesh.castShadow = true; mesh.receiveShadow = true; mesh.position.set(x, y, z); mesh.rotation.y = yaw; scene.add(mesh);
  const c = { id: BR_MOTO.motos.length, p: new V3(x, y, z), alvo: new V3(x, y, z), yaw, alvoYaw: yaw, vel: 0, hp: BR_MOTO_FORMA.vida, dono: '', versao: 0, mesh, morto: false, tiros: new Map() };
  BR_MOTO.motos.push(c); return c;
}
function brMotoLivre(x, z) {
  if (x < MAP.x0 + 3 || x > MAP.x1 - 3 || z < MAP.z0 + 3 || z > MAP.z1 - 3) return null;
  const y = groundHeight(x, z, 0.5, 0.3);
  for (const a of queryBoxes(x - 1.4, z - 1.4, x + 1.4, z + 1.4)) {
    if (a.ray || a.y1 <= y + 0.15 || a.y0 >= y + 1.8) continue;
    if (a.x0 < x + 1.4 && a.x1 > x - 1.4 && a.z0 < z + 1.4 && a.z1 > z - 1.4) return null;
  }
  for (const a of BR_MOTO.motos) if (hyp(a.p.x - x, a.p.z - z) < 4) return null;
  return y;
}
function brMotoInicio() {
  if (!BR.on) return;
  const seed = MATCH.online ? brHash(String(netCodeNow() || '') + '|' + CURMAP.id) : (Math.random() * 4294967296) >>> 0;
  const rnd = brRng(seed ^ 0x6f13b52d);
  if (CURMAP.id === 'favela-grande') {
    const grupos = BR_MOTO_PONTOS.map((a) => a.slice());
    for (const a of grupos) for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    // Alterna os três bairros antes de repetir, evitando concentrar os motos numa única área.
    let progresso = true; while (BR_MOTO.motos.length < 10 && progresso) {
      progresso = false;
      for (const a of grupos) while (a.length && BR_MOTO.motos.length < 10) {
        const [x, z, r] = a.pop(), y = brMotoLivre(x, z); if (y === null) continue;
        brMotoNovo(x, y, z, r, Math.floor(rnd() * BR_MOTO_CORES.length)); progresso = true; break;
      }
    }
  } else {
    const ids = []; for (let i = 0; i < NAV.count; i++) if (!NAV.comp || NAV.comp[i] === NAV.mainComp) ids.push(i);
    for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    for (const i of ids) { if (BR_MOTO.motos.length >= 6) break; const x = NAV.nx[i], z = NAV.nz[i], y = brMotoLivre(x, z); if (y !== null && Math.abs(NAV.ny[i] - y) < 0.4) brMotoNovo(x, y, z, rnd() * TAU, Math.floor(rnd() * BR_MOTO_CORES.length)); }
  }
}
function brMotoLimpa() {
  if (BR_MOTO.meu) brMotoSairLocal(false, true);
  for (const c of BR_MOTO.motos) scene.remove(c.mesh);
  for (const g of BR_MOTO.geos) if (g) g.dispose();
  if (BR_MOTO.mat) BR_MOTO.mat.dispose(); BR_MOTO.geos = []; BR_MOTO.mat = null;
  BR_MOTO.motos = []; BR_MOTO.meu = null; BR_MOTO.pedido = null; BR_MOTO.sync = 0;
}
function brMotoPerto() {
  const e = PL.ent; if (!BR.on || !e || !e.alive || e.brQueda || e.brCaido || KS.mode || PILOT.d || MECHA_P.me || MATCH.state !== 'playing') return null;
  let melhor = null, d = 2.4;
  for (const c of BR_MOTO.motos) { if (c.morto || c.dono) continue; const k = hyp(c.p.x - e.pos.x, c.p.z - e.pos.z); if (k < d && Math.abs(c.p.y - e.pos.y) < 1.5) { d = k; melhor = c; } }
  return melhor;
}
function brMotoEntrarLocal(c) {
  if (BR_MOTO.meu || !PL.ent.alive || PL.ent.brQueda || PL.ent.brCaido) return;
  BR_MOTO.meu = c; BR_MOTO.pedido = null; c.vel = 0; PL.ent.pos.copy(c.p); PL.ent.vel.set(0, 0, 0);
  PL.held = PL.queued = PL.adsWant = false; PL.reload = null; PL.nadeState = null; PL.knifeT = 0; VM.action = null; VM.root.visible = false;
  PL.ent.crouch = true; PL.ent.crouchAmt = 1; hudMsg('Você subiu na moto. E para descer.', 'neutral', 2);
}
function brMotoSairLocal(avisar = true, forcar = false) {
  const c = BR_MOTO.meu; if (!c) return;
  const e = PL.ent, a = c.yaw; let livre = null;
  for (const s of [1, -1]) {
    const p = new V3(c.p.x + s * Math.cos(a) * 1.3, c.p.y, c.p.z - s * Math.sin(a) * 1.3);
    BR_MOTO.resolvendo = true; try { collideCircle(p, 0.36, 1.75); } finally { BR_MOTO.resolvendo = false; }
    if (hyp(p.x - c.p.x, p.z - c.p.z) > 0.9 && lineClear(_bmP.set(c.p.x, c.p.y + 1, c.p.z), _bmQ.set(p.x, p.y + 1, p.z))) { p.y = groundHeight(p.x, p.z, p.y + 0.2, 0.3); livre = p; break; }
  }
  if (!livre && !forcar) { if (avisar) hudMsg('Não há espaço para descer aqui.', 'neutral', 1.4); return false; }
  BR_MOTO.meu = null; PL.held = PL.queued = PL.adsWant = false; e.crouch = false; e.crouchAmt = 0; e.vel.set(0, 0, 0);
  if (livre) e.pos.copy(livre);
  if (e.alive) { VM.root.visible = true; VM.holder.visible = true; }
  if (avisar) { if (brMotoHost()) brMotoAutoriza(c, ''); else brMotoEnvia({ k: 'bmSair', c: c.id }); } return true;
}
function brMotoAutoriza(c, id) {
  c.dono = id; c.versao++; c.vel = id ? c.vel : 0;
  const ev = { k: 'bmDono', c: c.id, to: id, v: c.versao, x: c.p.x, y: c.p.y, z: c.p.z, r: c.yaw };
  brMotoEnvia(ev);
  if (id && id === brMotoId(PL.ent)) brMotoEntrarLocal(c);
}
function brMotoPedir(c, e) {
  if (!c || c.morto || c.dono || !e || !e.alive || e.brQueda || e.brCaido || hyp(e.pos.x - c.p.x, e.pos.z - c.p.z) > 3.2 || Math.abs(e.pos.y - c.p.y) > 2) return false;
  brMotoAutoriza(c, brMotoId(e)); return true;
}
function brMotoUsar() {
  if (!BR.on) return false;
  if (BR_MOTO.meu) { if (Math.abs(BR_MOTO.meu.vel) < 2) brMotoSairLocal(); else hudMsg('Pare a moto para descer.', 'neutral', 1.4); return true; }
  const c = brMotoPerto(); if (!c) return false;
  if (brMotoHost()) brMotoPedir(c, PL.ent);
  else { if (!BR_MOTO.pedido || BR_MOTO.pedido.id !== c.id || MATCH.time - BR_MOTO.pedido.t > 1) { BR_MOTO.pedido = { id: c.id, t: MATCH.time }; brMotoEnvia({ k: 'bmPedir', c: c.id }); hudMsg('Pedindo a moto…', 'neutral', 1); } }
  return true;
}
function brMotoRampa(x, z, r) { for (const p of RAMPS) if (x + r > p.x0 && x - r < p.x1 && z + r > p.z0 && z - r < p.z1) return true; return false; }
function brMotoDirigir(dt) {
  const c = BR_MOTO.meu, e = PL.ent; if (!c) return;
  if (!BR.on || c.morto || !e.alive || e.brCaido || e.brQueda) { brMotoSairLocal(true, true); return; }
  PL.held = PL.queued = PL.adsWant = false; mouseDX = mouseDY = 0; e.busy = true; VM.root.visible = false;
  const fw = padClamp((TOUCH.on ? TOUCH.mz : (KEYS.KeyW || KEYS.ArrowUp ? 1 : 0) - (KEYS.KeyS || KEYS.ArrowDown ? 1 : 0)) + PAD.mz);
  const st = padClamp((TOUCH.on ? TOUCH.mx : (KEYS.KeyD || KEYS.ArrowRight ? 1 : 0) - (KEYS.KeyA || KEYS.ArrowLeft ? 1 : 0)) + PAD.mx);
  const F = BR_MOTO_FORMA, alvo = fw > 0.05 ? F.vmax * fw : fw < -0.05 ? F.re * fw : 0, taxa = fw < -0.05 && c.vel > 0.5 ? F.freio : fw ? F.acel : 4;
  c.vel += clamp(alvo - c.vel, -taxa * dt, taxa * dt); c.yaw -= st * clamp(Math.abs(c.vel) / 5, 0, 1) * (c.vel < 0 ? -1 : 1) * F.curva * dt;
  c.lean = damp(c.lean || 0, -st * F.inclina * clamp(Math.abs(c.vel) / 10, 0, 1), 8, dt); // inclina na curva
  const partes = Math.max(1, Math.ceil(Math.abs(c.vel * dt) / 0.35));
  for (let i = 0; i < partes; i++) {
    const passo = c.vel * dt / partes, x0 = c.p.x, z0 = c.p.z, sx = -Math.sin(c.yaw), sz = -Math.cos(c.yaw);
    const p = _bmP.set(x0 + sx * passo, c.p.y, z0 + sz * passo);
    if (brMotoRampa(p.x, p.z, 0.6)) { c.vel = 0; break; }
    BR_MOTO.resolvendo = true;
    try {
      for (const off of [-BR_MOTO_FORMA.meio, 0, BR_MOTO_FORMA.meio]) { const q = _bmQ.set(p.x + sx * off, p.y, p.z + sz * off), ox = q.x, oz = q.z; collideCircle(q, BR_MOTO_FORMA.raio, 1.2); p.x += q.x - ox; p.z += q.z - oz; }
    } finally { BR_MOTO.resolvendo = false; }
    if (BR_MOTO.motos.some((o) => o !== c && !o.morto && Math.abs(o.p.y - p.y) < 1.5 && hyp(o.p.x - p.x, o.p.z - p.z) < 1.8)) { c.vel = 0; break; }
    const y = groundHeight(p.x, p.z, c.p.y + 0.25, 0.5);
    if (y > c.p.y + 0.25 || hyp(p.x - x0, p.z - z0) < Math.abs(passo) * 0.2) { c.vel = 0; break; }
    p.y = Math.max(y, c.p.y - 10 * dt / partes); c.p.copy(p);
  }
  e.pos.copy(c.p); e.vel.set(-Math.sin(c.yaw) * c.vel, 0, -Math.cos(c.yaw) * c.vel); e.yaw = c.yaw; e.pitch = 0; e.onGround = true;
  e.crouch = true; e.crouchAmt = 1; c.alvo.copy(c.p); c.alvoYaw = c.yaw; c.mesh.position.copy(c.p); c.mesh.rotation.set(0, c.yaw, c.lean || 0, 'YXZ');
  if (ringCheck(e, dt) || voidCheck(e) || !e.alive) { brMotoSairLocal(); return; }
  // Só a máquina do motorista decide o atropelamento, como os tiros do jogo.
  if (Math.abs(c.vel) > 8) for (const v of entities) {
    if (v === e || !v.alive || v.off || v.brQueda || allied(v, e)) continue;
    const d = hyp(v.pos.x - c.p.x, v.pos.z - c.p.z); if (d > 1.3 || Math.abs(v.pos.y - c.p.y) > 1.5 || MATCH.time - (c.tiros.get(v) || -99) < 1) continue;
    c.tiros.set(v, MATCH.time); applyDamage(v, clamp((Math.abs(c.vel) - 8) * 5, 0, 110), e, NET_WSPECIAL.brMoto, false, _bmR.set(-Math.sin(c.yaw), 0, -Math.cos(c.yaw)).clone());
  }
  const alvoCam = _bmQ.set(c.p.x, c.p.y + 1.05, c.p.z), dest = _bmR.set(c.p.x + Math.sin(c.yaw) * 4.6, c.p.y + 2.6, c.p.z + Math.cos(c.yaw) * 4.6);
  const d = dest.clone().sub(alvoCam), dist = d.length(); d.normalize(); const obst = rayWorld(alvoCam.x, alvoCam.y, alvoCam.z, d.x, d.y, d.z, dist, 0);
  if (obst) dest.copy(alvoCam).addScaledVector(d, Math.max(0.6, obst.t - 0.25));
  camera.position.lerp(dest, 1 - Math.exp(-9 * dt)); camera.lookAt(alvoCam); PL.yaw = c.yaw; PL.pitch = 0;
  if (MATCH.online && (BR_MOTO.tempo -= dt) <= 0) { BR_MOTO.tempo = 0.15; brMotoEnvia({ k: 'bmPose', c: c.id, x: +c.p.x.toFixed(2), y: +c.p.y.toFixed(2), z: +c.p.z.toFixed(2), r: +c.yaw.toFixed(3), s: +c.vel.toFixed(1) }); }
}

function brMotoExplodir(c, atacante) {
  if (c.morto) return;
  c.morto = true; c.hp = 0; c.mesh.visible = false;
  const ocupante = c === BR_MOTO.meu ? PL.ent : brMotoPessoa(c.dono), local = ocupante === PL.ent;
  if (local) { brMotoSairLocal(false, true); if (ocupante.alive) { ocupante.protT = 0; killEnt(ocupante, atacante || ocupante, NET_WSPECIAL.brMoto, false, new V3(0, 1, 0)); } }
  c.dono = '';
  const quem = atacante || PL.ent, p = new V3(c.p.x, c.p.y + 0.5, c.p.z);
  explode(p, quem, NET_WSPECIAL.brMoto, 3.5, 70);
}
function brMotoDanoHost(c, dano, atacante) {
  if (!brMotoHost() || !c || c.morto || !atacante) return;
  c.hp = Math.max(0, c.hp - clamp(dano, 0, 200));
  c.atacante = brMotoId(atacante);
  brMotoEnvia({ k: 'bmVida', c: c.id, h: Math.round(c.hp), by: c.atacante, to: c.dono });
  if (c.hp <= 0) brMotoExplodir(c, atacante);
}
function brMotoDano(c, dano, atacante) {
  if (brMotoHost()) brMotoDanoHost(c, dano, atacante);
  else if (atacante && netIsLocal(atacante)) brMotoEnvia({ k: 'bmDano', c: c.id, d: Math.round(dano) }, atacante);
}
function brMotoRay(o, dir, max, atirador) {
  let melhor = null, dist = max;
  for (const c of BR_MOTO.motos) {
    if (c.morto || (c.dono && c.dono === brMotoId(atirador))) continue;
    c.mesh.updateMatrixWorld(); _bmInv.copy(c.mesh.matrixWorld).invert();
    _bmRay.set(o, dir).applyMatrix4(_bmInv); const h = _bmRay.intersectBox(_bmBox, _bmHit); if (!h) continue;
    const t = _bmRay.origin.distanceTo(h); if (t < dist) { dist = t; melhor = c; }
  }
  return melhor ? { carro: melhor, t: dist } : null;
}
function brMotoPasso(dt) {
  if (!BR.on) return;
  if (BR_MOTO.pedido && MATCH.time - BR_MOTO.pedido.t > 3) { BR_MOTO.pedido = null; hudMsg('A moto não está disponível.', 'neutral', 1.5); }
  for (const c of BR_MOTO.motos) {
    if (c.morto) continue;
    if (brMotoHost() && c.dono) { const e = brMotoPessoa(c.dono); if (!e || !e.alive || e.brCaido) { if (c === BR_MOTO.meu) brMotoSairLocal(false, true); brMotoAutoriza(c, ''); } }
    if (c !== BR_MOTO.meu) { const k = 1 - Math.exp(-10 * dt); c.p.lerp(c.alvo, k); c.yaw += angDiff(c.yaw, c.alvoYaw) * k; c.mesh.position.copy(c.p); c.mesh.rotation.y = c.yaw; }
  }
  // Um participante que entra tarde ou se reconecta recebe ocupação, vida e posição mesmo após os eventos originais expirarem.
  if (MATCH.online && NET.role === 'host' && (BR_MOTO.sync -= dt) <= 0) {
    BR_MOTO.sync = 2;
    brMotoEnvia({ k: 'bmSync', a: BR_MOTO.motos.map((c) => [c.id, c.versao, c.dono, Math.round(c.hp), +c.p.x.toFixed(2), +c.p.y.toFixed(2), +c.p.z.toFixed(2), +c.yaw.toFixed(3), c.atacante || '']) });
  }
}
{
  const inicio0 = brInicio;
  brInicio = function () { inicio0(); brMotoInicio(); };
  const limpa0 = brLimpa;
  brLimpa = function () { brMotoLimpa(); limpa0(); };
  const passo0 = brUpdate;
  brUpdate = function (dt) { passo0(dt); brMotoPasso(dt); };
  const player0 = updatePlayer;
  updatePlayer = function (dt, now) { if (BR.on && BR_MOTO.meu && PL.ent.alive) return brMotoDirigir(dt); return player0(dt, now); };
  const uso0 = mechaUse;
  mechaUse = function () { return brMotoUsar() || uso0(); };
  const perto0 = mechaNear;
  mechaNear = function () { return perto0() || (BR.on && (BR_MOTO.meu || brMotoPerto())) || null; };
  const aviso0 = mechaPrompt;
  mechaPrompt = function () { if (BR.on && (BR_MOTO.meu || brMotoPerto())) return `${actGlyph('use')} ${BR_MOTO.meu ? 'Descer da moto' : 'Subir na moto'}`; return aviso0(); };
  const toque0 = touchTick;
  touchTick = function () { toque0(); if (BR.on && (BR_MOTO.meu || brMotoPerto()) && TC.el.pick) TC.el.pick.setAttribute('aria-label', BR_MOTO.meu ? 'Descer da moto' : 'Subir na moto'); };
  const tecla0 = onKey;
  onKey = function (ev, down) {
    if (!BR.on || !BR_MOTO.meu || MATCH.state !== 'playing' || !pointerActive()) return tecla0(ev, down);
    const k = keyCanon(ev.code); if (!k) return;
    if (k === 'Escape' || k === 'Tab') return tecla0(ev, down);
    const anterior = KEYS[k]; KEYS[k] = down;
    if (k === 'KeyE' && down && !anterior) brMotoUsar();
    if (k === 'Space' || k.startsWith('Arrow')) ev.preventDefault();
  };
  const nade0 = cookNade;
  cookNade = function () { if (BR.on && BR_MOTO.meu) return; return nade0.apply(this, arguments); };
  const faca0 = knifeButton;
  knifeButton = function () { if (BR.on && BR_MOTO.meu) return; return faca0.apply(this, arguments); };
  const troca0 = switchWeapon;
  switchWeapon = function () { if (BR.on && BR_MOTO.meu) return; return troca0.apply(this, arguments); };
  // Moto estacionada é obstáculo de gente e bots (a cápsula). A física da própria moto consulta só as paredes do mapa.
  const colisao0 = collideCircle;
  collideCircle = function (pos, r, h) {
    colisao0(pos, r, h); if (!BR.on || BR_MOTO.resolvendo) return;
    for (const c of BR_MOTO.motos) {
      if (c.morto || Math.abs(c.p.y - pos.y) > 1.5) continue;
      // a cápsula da moto: o ponto mais perto no eixo dela, de -meio a +meio
      const fx = -Math.sin(c.yaw), fz = -Math.cos(c.yaw), M = BR_MOTO_FORMA, t = clamp((pos.x - c.p.x) * fx + (pos.z - c.p.z) * fz, -M.meio, M.meio);
      const qx = c.p.x + fx * t, qz = c.p.z + fz * t; let dx = pos.x - qx, dz = pos.z - qz, d = hyp(dx, dz); const limite = r + M.raio;
      if (d >= limite) continue; if (d < 0.001) { dx = -fz; dz = fx; d = 1; } pos.x += dx / d * (limite - d); pos.z += dz / d * (limite - d);
    }
  };
  const bot0 = updateBot;
  updateBot = function (b, dt, now) {
    const r = bot0(b, dt, now); if (!BR.on || !b.alive || b.isRemote || b.brQueda || b.brCaido || b.visible || now < (b.brMotoDesvio || 0)) return r;
    for (const c of BR_MOTO.motos) {
      if (c.morto || c.dono || hyp(c.p.x - b.pos.x, c.p.z - b.pos.z) > 2.6 || !b.goal) continue;
      const vx = b.goal.x - b.pos.x, vz = b.goal.z - b.pos.z, cx = c.p.x - b.pos.x, cz = c.p.z - b.pos.z;
      if (vx * cx + vz * cz <= 0) continue;
      const l = hyp(vx, vz) || 1, s = vx * cz - vz * cx >= 0 ? -1 : 1;
      setPath(b, new V3(c.p.x - vz / l * 2 * s, c.p.y, c.p.z + vx / l * 2 * s)); b.brMotoDesvio = now + 2; break;
    }
    return r;
  };
  // Um raio acerta a moto (a caixa baixa) antes de chamar o tiro normal; o piloto, por cima dela, leva o tiro normal.
  const tiro0 = fireRay;
  fireRay = function (atirador, origem, dir, def, boca, tracante, multiplicador = 1) {
    if (!BR.on || atirador.isRemote || !BR_MOTO.motos.length) return tiro0.apply(this, arguments);
    const hit = brMotoRay(origem, dir, 300, atirador); if (!hit) return tiro0.apply(this, arguments);
    const mundo = rayWorld(origem.x, origem.y, origem.z, dir.x, dir.y, dir.z, hit.t, 1), soldado = rayEntities(origem, dir, hit.t, atirador);
    if (mundo || soldado) return tiro0.apply(this, arguments);
    const fim = origem.clone().addScaledVector(dir, hit.t), dano = propDamage(def, hit.t) * multiplicador;
    brMotoDano(hit.carro, dano, atirador); if (tracante && boca) FX.tracers.add(boca, fim);
    impactFx(fim, dir.clone().negate(), 'metal', false, true); if (atirador.isPlayer) { PL.actT = MATCH.time; sfxImpact(fim, 'metal'); hitFeedback(false, false); }
    return null;
  };
  const matar0 = killEnt;
  killEnt = function (v, a, arma, head, dir, life) { if (v === PL.ent && BR_MOTO.meu) brMotoSairLocal(true, true); return matar0(v, a, arma, head, dir, life); };
  const rede0 = netEventIn;
  netEventIn = function (e, ev) {
    if (!BR.on || !ev || !/^bm/.test(ev.k || '')) return rede0(e, ev);
    if (ev.k === 'bmSync') {
      if (brMotoHost() || !e || netIdOf(e) !== NET.hostId || !Array.isArray(ev.a)) return;
      for (const a of ev.a.slice(0, 10)) {
        if (!Array.isArray(a)) continue; const c = BR_MOTO.motos[a[0] | 0]; if (!c || c.morto || (a[1] | 0) < c.versao) continue;
        c.versao = a[1] | 0; c.dono = typeof a[2] === 'string' ? a[2] : ''; c.hp = clamp(+a[3] || 0, 0, BR_MOTO_FORMA.vida);
        if (!c.hp) { brMotoExplodir(c, brMotoPessoa(a[8]) || e); continue; }
        if (c.dono !== NET.me) { c.alvo.set(clamp(+a[4] || 0, MAP.x0, MAP.x1), clamp(+a[5] || 0, -50, 300), clamp(+a[6] || 0, MAP.z0, MAP.z1)); c.alvoYaw = clamp(+a[7] || 0, -1e4, 1e4); if (c === BR_MOTO.meu) brMotoSairLocal(false, true); }
        else if (!BR_MOTO.meu) brMotoEntrarLocal(c);
      }
      return;
    }
    const c = BR_MOTO.motos[ev.c | 0]; if (!c || !e) return;
    const id = netIdOf(e);
    if (ev.k === 'bmPedir') { if (brMotoHost()) brMotoPedir(c, e); return; }
    if (ev.k === 'bmSair') { if (brMotoHost() && c.dono === id) brMotoAutoriza(c, ''); return; }
    if (ev.k === 'bmDono') {
      if (brMotoHost() || id !== NET.hostId || (ev.v | 0) <= c.versao) return;
      c.versao = ev.v | 0; c.dono = typeof ev.to === 'string' ? ev.to : ''; c.alvo.set(clamp(+ev.x || 0, MAP.x0, MAP.x1), clamp(+ev.y || 0, -50, 300), clamp(+ev.z || 0, MAP.z0, MAP.z1)); c.alvoYaw = +ev.r || 0;
      if (c.dono === NET.me) brMotoEntrarLocal(c); else if (c === BR_MOTO.meu) brMotoSairLocal(false, true);
      return;
    }
    if (ev.k === 'bmPose') {
      if (c.morto || !c.dono || c.dono !== id) return;
      c.alvo.set(clamp(+ev.x || 0, MAP.x0, MAP.x1), clamp(+ev.y || 0, -50, 300), clamp(+ev.z || 0, MAP.z0, MAP.z1)); c.alvoYaw = clamp(+ev.r || 0, -1e4, 1e4); c.vel = clamp(+ev.s || 0, -10, 30); return;
    }
    if (ev.k === 'bmDano') { if (brMotoHost()) brMotoDanoHost(c, +ev.d || 0, e); return; }
    if (ev.k === 'bmVida') {
      if (brMotoHost() || id !== NET.hostId || c.morto) return;
      c.hp = clamp(+ev.h || 0, 0, BR_MOTO_FORMA.vida); if (c.hp <= 0) { if (!c.dono && typeof ev.to === 'string') c.dono = ev.to; brMotoExplodir(c, brMotoPessoa(ev.by) || e); } return;
    }
  };
}
