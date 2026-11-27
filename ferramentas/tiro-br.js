/* BATTLE ROYALE do Tiro da Galera (2026-11-27). Entra no jogo montado por ferramentas/tiro-frontline.js, logo antes do boot,
   no mesmo script do jogo: troca algumas funções dele por versões que chamam a original e acrescentam o battle royale.
   Regras (primeira versão):
   - até 12 no salão (gente + robôs); ninguém renasce; o último vivo vence (o placar é a ordem de eliminação, depois os abates);
   - todo mundo começa só com a pistola da classe (os robôs com uma M9); as outras armas estão espalhadas pelo chão do mapa;
     com uma vaga livre, a arma do chão entra como segunda arma (E), sem largar a pistola;
   - a zona (parede azul) fecha em quatro etapas até sumir; fora dela a vida cai, cada etapa mais rápido;
   - sem séries de abates (helicóptero, mecha...);
   - morto, a câmera passa a seguir quem ainda está vivo.
   Por dentro a partida é um "cada um por si" (MATCH.mode = 'ffa'); BR.on diz que é battle royale. Em rede, a zona e as armas do
   chão saem da mesma semente em todo mundo (código do salão + mapa) e o relógio é o da partida (MATCH.timeLeft, que vem do host). */
const BR = { on: false, ordem: 0, armado: false, T0: 0, z: null, plano: null, malha: null, estado: '', botT: 0, ver: null, cam: null, hudFora: null, roTxt: null, aviso: null, lugar: 0 };
function brSolo(m) { return m === 'ffa' || m === 'br'; }
function netMax() { return NET.cfg && NET.cfg.mode === 'br' ? 12 : NET_MAX; }

MODES.br = {
  name: 'Battle royale', btn: 'Battle royale', sub: 'Battle royale, o último vivo vence', teams: 'Até 12 jogadores, sem renascer', lim: 'Jogadores', unit: 'jogadores',
  limits: [12], key: 'limitBr', respawn: 1e9, botRespawn: 1e9, prot: 2,
  hint: 'Ninguém renasce. Todo mundo começa com a pistola: as outras armas estão no chão. A zona fecha aos poucos e tira vida de quem fica fora. O último vivo vence.',
};
MODE_IDS.push('br');
if (Settings.limitBr !== 12) Settings.limitBr = 12;

/* ---------- sorteio com semente (igual em todo mundo do salão) ---------- */
function brHash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function brRng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/* ---------- a zona ---------- */
// etapas: espera, fechamento (s) e o raio que sobra (fração do raio inicial); a vida que cai por segundo fora, em cada etapa
const BR_ETAPAS = [[45, 40, 0.62], [35, 30, 0.36], [25, 25, 0.16], [20, 30, 0]];
const BR_DANO = [1.5, 3, 5, 9, 15];
function brPlano(rnd) {
  let C0x = (MAP.x0 + MAP.x1) / 2, C0z = (MAP.z0 + MAP.z1) / 2, R0 = Math.hypot(MAP.x1 - MAP.x0, MAP.z1 - MAP.z0) / 2 * 1.02;
  if (RING.on && RING.r < R0) { C0x = RING.x; C0z = RING.z; R0 = RING.r; } // Simoun: o deserto já é um círculo
  // o centro final: um ponto de passagem no chão, no miolo do mapa (sem ele, o meio)
  const mx = (MAP.x1 - MAP.x0) * 0.25, mz = (MAP.z1 - MAP.z0) * 0.25;
  const miolo = spawnField().filter(([x, z]) => x > MAP.x0 + mx && x < MAP.x1 - mx && z > MAP.z0 + mz && z < MAP.z1 - mz && Math.hypot(x - C0x, z - C0z) < R0 * 0.6);
  const F = miolo.length ? miolo[Math.floor(rnd() * miolo.length)] : [C0x, C0z];
  // mais tempo em mapa grande e em partida longa
  const k = clamp(R0 / 70, 1, 1.5) * clamp((BR.T0 || 600) / 600, 0.8, 1.3);
  const fases = []; let t = 0, f = 1;
  for (const [esp, fec, f1] of BR_ETAPAS) { fases.push({ a: t + esp * k, b: t + (esp + fec) * k, f0: f, f1 }); t += (esp + fec) * k; f = f1; }
  return { C0x, C0z, R0, Fx: F[0], Fz: F[1], fases };
}
// o centro anda em linha reta do meio do mapa até o centro final conforme o raio diminui: cada círculo fica dentro do anterior
function brCirculo(P, f) { const r = P.R0 * f, k = f; return { x: P.Fx + (P.C0x - P.Fx) * k, z: P.Fz + (P.C0z - P.Fz) * k, r }; }
function brZonaAgora() {
  const P = BR.plano; if (!P) return null;
  const t = Math.max(0, BR.T0 - MATCH.timeLeft);
  let f = 1, alvo = 1, estado = 'espera', falta = 0, i = 0;
  for (; i < P.fases.length; i++) {
    const F = P.fases[i];
    if (t < F.a) { f = F.f0; alvo = F.f1; estado = 'espera'; falta = F.a - t; break; }
    if (t < F.b) { const u = (t - F.a) / (F.b - F.a); f = F.f0 + (F.f1 - F.f0) * u; alvo = F.f1; estado = 'fechando'; falta = F.b - t; break; }
  }
  if (i === P.fases.length) { f = 0; alvo = 0; estado = 'fim'; }
  const c = brCirculo(P, f), A = brCirculo(P, alvo);
  return { x: c.x, z: c.z, r: c.r, dps: BR_DANO[Math.min(i + (estado === 'fechando' ? 1 : 0), BR_DANO.length - 1)], estado, falta, fase: i, alvo: A };
}
const brDentroZ = (z, x, zz, m = 1) => (x - z.x) ** 2 + (zz - z.z) ** 2 <= (z.r * m) ** 2;

/* ---------- armas no chão ---------- */
const BR_ARMAS = [['m4', 4], ['ak47', 4], ['scarh', 3], ['famas', 3], ['mp5', 4], ['mp7', 3], ['ump45', 3], ['vector', 3], ['m1014', 2], ['rem870', 2], ['aa12', 1], ['l96', 1.5], ['svd', 1.5], ['m82', 1]];
const BR_LOOT_LONGE = 6, BR_LOOT_TETO = 8, BR_LOOT_LAJE = 1.5;
// pontos de navegação (os que os robôs alcançam: a parte principal da malha) dentro de construção ou em cima de laje: [x, y, z]
function brLootPontos() {
  const out = []; if (!NAV.count || !NAV.comp) return out;
  for (let id = 0; id < NAV.count; id++) {
    if (NAV.comp[id] !== NAV.mainComp) continue;
    const x = NAV.nx[id], y = NAV.ny[id], z = NAV.nz[id];
    const teto = ceilingAbove(x, z, y + 0.3, 0.3) < y + BR_LOOT_TETO;
    if (teto || y > gy0(x, z) + BR_LOOT_LAJE) out.push([x, y, z]);
  }
  return out;
}
function brLoot(rnd) {
  const lista = BR_ARMAS.filter(([id]) => WEAPONS[id]), soma = lista.reduce((s, [, p]) => s + p, 0);
  const sorteia = () => { let x = rnd() * soma; for (const [id, p] of lista) { x -= p; if (x <= 0) return WEAPONS[id]; } return WEAPONS[lista[0][0]]; };
  const area = (MAP.x1 - MAP.x0) * (MAP.z1 - MAP.z0), n = Math.round(clamp(area / 350, 14, 30));
  const q = new THREE.Quaternion(), v = new V3(0, 0.2, 0), p = new V3();
  // (2026-11-27, o Thiago: "faz as armas spawnarem só dentro de construções e lajes") os lugares são pontos de navegação dos robôs
  // (onde dá para andar e chegar), com teto em cima (dentro de casa, prédio, galpão) ou bem acima do chão sem teto (laje, terraço);
  // espalhados: cada um a pelo menos BR_LOOT_LONGE m dos outros (a distância cai se não couber). Mapa quase sem construção
  // (menos de 6 lugares assim): o resto vai para os pontos de passagem, como antes.
  const dentro = brLootPontos();
  for (let i = dentro.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [dentro[i], dentro[j]] = [dentro[j], dentro[i]]; }
  const escolhidos = [];
  for (let longe = BR_LOOT_LONGE; longe >= 1.5 && escolhidos.length < n; longe *= 0.6)
    for (const c of dentro) { if (escolhidos.length >= n) break; if (!escolhidos.includes(c) && escolhidos.every((o) => hyp(o[0] - c[0], o[2] - c[2]) >= longe || Math.abs(o[1] - c[1]) > 2.5)) escolhidos.push(c); }
  if (escolhidos.length >= 6) {
    for (const [x, y, z] of escolhidos) { const def = sorteia(); p.set(x, y + 0.5, z); q.setFromAxisAngle(UP, rnd() * TAU); dropWeapon(def, def.mag, def.mag * 2, p, q, v); }
    return;
  }
  const pts = [...escolhidos, ...POI.map((p) => [p[0], p[1], p[2]])];
  for (let i = pts.length - 1; i > escolhidos.length; i--) { const j = escolhidos.length + Math.floor(rnd() * (i - escolhidos.length + 1)); [pts[i], pts[j]] = [pts[j], pts[i]]; }
  for (let i = 0; i < n && pts.length; i++) {
    const [x, y, z] = pts[i % pts.length], volta = i >= pts.length; // pontos de sobra: mais uma arma perto do mesmo ponto
    const dx = volta ? (rnd() - 0.5) * 4 : (rnd() - 0.5) * 1.2, dz = volta ? (rnd() - 0.5) * 4 : (rnd() - 0.5) * 1.2;
    const def = sorteia();
    p.set(x + dx, y + 0.5, z + dz); q.setFromAxisAngle(UP, rnd() * TAU);
    dropWeapon(def, def.mag, def.mag * 2, p, q, v);
  }
}

/* ---------- caixas de colete e de cura (2026-11-27) ----------
   Espalhadas pelos pontos de passagem como as armas, com a mesma semente. Pega-se passando por cima, só quando precisa:
   colete (azul): +50 de colete, até 100; o colete segura 60% de cada dano de tiro, grenada ou faca até acabar (a zona passa por ele);
   cura (branca, cruz vermelha): +50 de vida, até 100. Os robôs também pegam, e vão atrás de cura quando estão machucados.
   Como as armas do chão, nada disso vai pela rede: a caixa que outro jogador pisou some aqui também, mas o efeito é só na máquina dele. */
const BR_CAIXAS = { colete: { cor: '#2f6fd6', ganho: 50, max: 100 }, cura: { cor: '#f3f1ea', ganho: 50, max: 100 } };
const BR_COLETE_SEGURA = 0.6;
function brCaixaMat(tipo) {
  BR.mats = BR.mats || {};
  if (BR.mats[tipo]) return BR.mats[tipo];
  const c = document.createElement('canvas'); c.width = c.height = 64; const q = c.getContext('2d');
  q.fillStyle = BR_CAIXAS[tipo].cor; q.fillRect(0, 0, 64, 64);
  q.strokeStyle = 'rgba(0,0,0,.35)'; q.lineWidth = 4; q.strokeRect(2, 2, 60, 60);
  if (tipo === 'cura') { q.fillStyle = '#d8262b'; q.fillRect(26, 12, 12, 40); q.fillRect(12, 26, 40, 12); }
  else { q.fillStyle = '#fff'; q.beginPath(); q.moveTo(32, 10); q.lineTo(52, 18); q.lineTo(48, 42); q.lineTo(32, 54); q.lineTo(16, 42); q.lineTo(12, 18); q.closePath(); q.fill(); }
  const t = new THREE.CanvasTexture(c); if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
  return (BR.mats[tipo] = new THREE.MeshStandardMaterial({ map: t, roughness: 0.7, metalness: 0, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.25 }));
}
function brCaixasPoe(rnd) {
  BR.caixas = [];
  const pts = POI.map((p) => [p[0], p[1], p[2]]);
  for (let i = pts.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pts[i], pts[j]] = [pts[j], pts[i]]; }
  const area = (MAP.x1 - MAP.x0) * (MAP.z1 - MAP.z0), n = Math.round(clamp(area / 350, 14, 30));
  const nc = Math.round(n * 0.35), nk = Math.round(n * 0.45), geo = BR.geo || (BR.geo = new THREE.BoxGeometry(0.55, 0.32, 0.4));
  for (let i = 0; i < nc + nk && pts.length; i++) {
    const tipo = i < nc ? 'colete' : 'cura', [px, py, pz] = pts[i % pts.length];
    // longe do ponto exato (onde a arma pode ter caído) e um pouco mais solta nas voltas
    const a = rnd() * TAU, r = (i >= pts.length ? 2.5 : 1.3) + rnd() * 1.2, x = px + Math.cos(a) * r, z = pz + Math.sin(a) * r;
    const y = groundHeight(x, z, py + 1, 0.25);
    if (!(y > py - 3)) continue; // caiu num buraco ou fora do chão: sem caixa
    const m = new THREE.Mesh(geo, brCaixaMat(tipo)); m.position.set(x, y + 0.16, z); m.rotation.y = rnd() * TAU; m.castShadow = true;
    scene.add(m); BR.caixas.push({ tipo, m, x, y, z });
  }
}
function brCaixasTira() { for (const c of BR.caixas || []) scene.remove(c.m); BR.caixas = []; }
function brPrecisa(e, tipo) { return tipo === 'cura' ? e.health < BR_CAIXAS.cura.max : (e.brColete || 0) < BR_CAIXAS.colete.max; }
function brCaixasUpdate() {
  const L = BR.caixas; if (!L || !L.length) return;
  for (let i = L.length - 1; i >= 0; i--) {
    const c = L[i];
    for (const e of entities) {
      if (!e.alive || e.off || Math.abs(e.pos.y - c.y) > 1.3 || hyp(e.pos.x - c.x, e.pos.z - c.z) > (e.isPlayer ? 1.1 : 1.3)) continue;
      const local = e.isPlayer || (!e.isRemote && (!MATCH.online || e.netBot));
      if (local && !brPrecisa(e, c.tipo)) continue;
      if (local) {
        const B = BR_CAIXAS[c.tipo];
        if (c.tipo === 'cura') e.health = Math.min(B.max, e.health + B.ganho); else e.brColete = Math.min(B.max, (e.brColete || 0) + B.ganho);
        if (e.isPlayer) { hudMsg(c.tipo === 'cura' ? '+50 de vida' : `Colete ${Math.round(e.brColete)}`, 'xp', 1.6); sfxMech('pickup'); }
      }
      scene.remove(c.m); L.splice(i, 1); break;
    }
  }
}
function brColeteHud() {
  const hp = $('hp'); if (!hp) return;
  if (!BR.cvBar) {
    const b = document.createElement('div'); b.className = 'hpbar'; b.style.marginTop = '3px';
    const f = document.createElement('div'); f.style.cssText = 'height:100%;background:#4aa3ff;transform-origin:left;transform:scaleX(0)';
    b.appendChild(f); hp.appendChild(b); BR.cvBar = b; BR.cvFill = f; BR.cvV = -1;
  }
  const v = BR.on && PL.ent.alive ? Math.round(PL.ent.brColete || 0) : 0;
  if (v !== BR.cvV) { BR.cvV = v; BR.cvBar.style.display = v > 0 ? '' : 'none'; BR.cvFill.style.transform = `scaleX(${v / 100})`; }
}

/* ---------- entrada caindo de cima (2026-11-27) ----------
   No começo (a abertura, OPEN.on, até o "Vai!"), cada soldado desta máquina nasce BR_QUEDA.alto m acima do seu lugar, se o céu
   em cima dele estiver aberto (quem nasce embaixo de um teto nasce no chão, como antes). Durante a contagem fica parado no ar,
   olhando o mapa; depois cai rápido e, a BR_QUEDA.abre m do chão, abre o paraquedas e desce devagar. No ar, as teclas de andar
   fazem planar, para escolher onde pousar. Os robôs caem em linha reta no lugar deles. O paraquedas aparece em todo mundo que
   está descendo (os de fora da máquina pela altura que chega pela rede). */
// (2026-11-27, o Thiago: "o paraquedas abrir mais alto") abre a 35 m (era 18) e o começo subiu para 75 m (era 60), para sobrar queda livre
const BR_QUEDA = { alto: 75, abre: 35, livre: -16, para: -5.5, planaLivre: 10, planaPara: 7 };
/* Lugares de largada do Battle royale (2026-11-27, o Thiago: "os nascimentos serem mais distribuídos"). Os do cada um por si
   (ffaSlots) começam sempre na base do Alpha e só se afastam até 60 m: num mapa grande ficavam todos de um lado. Aqui: todos os
   pontos de chão com céu aberto em cima (para cair de cima), o primeiro sorteado e cada um dos seguintes o mais longe possível
   dos já escolhidos, sem limite de distância. A semente é a mesma do salão, então todo mundo calcula os mesmos lugares. */
function brSlots(rnd) {
  const abertos = (L) => L.filter(([x, z]) => { const y = gy0(x, z); return Math.abs(groundHeight(x, z, y + BR_QUEDA.alto, 0.35) - y) < 0.6; });
  let left = abertos(SPAWNS[0].concat(SPAWNS[1], spawnField()));
  if (left.length < 12) left = SPAWNS[0].concat(SPAWNS[1], spawnField());
  left = left.filter((c, i, a) => a.findIndex((d) => hyp(d[0] - c[0], d[1] - c[1]) < 1.5) === i); // pontos repetidos
  const out = []; if (!left.length) return out;
  out.push(left.splice(Math.floor(rnd() * left.length), 1)[0]);
  while (out.length < 12 && left.length) {
    let bi = 0, bd = -1;
    left.forEach((c, i) => { const d = Math.min(...out.map((o) => hyp(o[0] - c[0], o[1] - c[1]))); if (d > bd + 1e-6) { bd = d; bi = i; } });
    out.push(left.splice(bi, 1)[0]);
  }
  // a ordem de quem pega cada lugar (o jogador é o primeiro no solo): embaralhada, para ninguém cair sempre no mesmo canto
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}
function brChao(e) { return groundHeight(e.pos.x, e.pos.z, e.pos.y + 0.1, 0.3); }
function brPoeNoAlto(e) {
  const y0 = e.pos.y, topo = groundHeight(e.pos.x, e.pos.z, y0 + BR_QUEDA.alto, 0.35);
  if (Math.abs(topo - y0) > 0.6) return; // tem teto, sacada ou árvore em cima: nasce no chão
  e.brQueda = true; e.brAlto = y0 + BR_QUEDA.alto; e.pos.y = e.brAlto; e.vy = 0; e.onGround = false; e.airVy = 0;
}
// depois do passo de cada soldado desta máquina (o mesmo lugar do ringCheck): parado no ar na contagem, depois queda e paraquedas
function brQuedaPasso(e, dt) {
  if (!e.brQueda) return;
  if (!e.alive) { e.brQueda = false; return; }
  if (playHold()) { e.pos.y = e.brAlto; e.vy = 0; e.onGround = false; e.vel.x = e.vel.z = 0; return; }
  if (e.onGround) { e.brQueda = false; return; }
  const alt = e.pos.y - brChao(e), aberto = alt < BR_QUEDA.abre;
  e.vy = Math.max(e.vy, aberto ? BR_QUEDA.para : BR_QUEDA.livre); e.airVy = Math.max(e.airVy || 0, -5.9); // pousa sem o tranco de queda
  if (e.isPlayer) {
    const I = e.input, fx = -Math.sin(e.yaw), fz = -Math.cos(e.yaw), rx = Math.cos(e.yaw), rz = -Math.sin(e.yaw);
    let wx = fx * I.mz + rx * I.mx, wz = fz * I.mz + rz * I.mx; const wl = hyp(wx, wz); if (wl > 1) { wx /= wl; wz /= wl; }
    const v = aberto ? BR_QUEDA.planaPara : BR_QUEDA.planaLivre;
    e.vel.x = damp(e.vel.x, wx * v, 3, dt); e.vel.z = damp(e.vel.z, wz * v, 3, dt);
  }
}
function brParaquedas() {
  const P = BR.paras || (BR.paras = []);
  let n = 0;
  if (MATCH.time - (MATCH.startAt || 0) < 90) for (const e of entities) {
    if (!e.alive || e.off) continue;
    const alt = e.pos.y - brChao(e);
    if (e.isRemote) { if (alt > 8) e.brAr = true; else if (alt < 0.3) e.brAr = false; }
    const desce = (e.brQueda || e.brAr) && !playHold() && alt > 0.6 && alt < BR_QUEDA.abre + 1;
    if (!desce) continue;
    let m = P[n];
    if (!m) {
      const geo = BR.paraGeo || (BR.paraGeo = new THREE.SphereGeometry(1.7, 16, 6, 0, TAU, 0, Math.PI / 2));
      const mat = BR.paraMat || (BR.paraMat = new THREE.MeshStandardMaterial({ color: 0xf08a24, roughness: 0.8, side: THREE.DoubleSide }));
      m = P[n] = new THREE.Mesh(geo, mat); m.scale.y = 0.55; scene.add(m);
    }
    m.visible = true; m.position.set(e.pos.x, e.pos.y + 3.3, e.pos.z); n++;
  }
  for (let i = n; i < P.length; i++) P[i].visible = false;
}

/* ---------- começo e fim ---------- */
function brLimpa() {
  if (BR.malha) { scene.remove(BR.malha); BR.malha.geometry.dispose(); BR.malha.material.dispose(); BR.malha = null; }
  const el = $('ringOut');
  if (el && BR.roTxt) { el.querySelector('b').textContent = BR.roTxt[0]; el.querySelector('span').textContent = BR.roTxt[1]; el.classList.remove('show'); }
  BR.roTxt = null; BR.hudFora = null;
  if (BR.aviso) BR.aviso.style.display = 'none';
  DROP.life = 90; DROP.max = 14;
  for (const e of entities) { if (e.brArma) { e.weapon = e.brArma; e.brArma = null; } e.brColete = 0; }
  brCaixasTira(); if (BR.cvBar) brColeteHud();
  for (const m of BR.paras || []) scene.remove(m);
  BR.paras = [];
  for (const e of entities) { e.brQueda = false; e.brAr = false; }
}
function brInicio() {
  BR.ordem = 0; BR.armado = false; BR.avisouQueda = false; BR.T0 = MATCH.timeLeft; BR.estado = ''; BR.botT = 0; BR.ver = null; BR.cam = null; BR.lugar = 0;
  for (const e of entities) { e.brOut = 0; e.brT = 0; }
  DROP.life = 1e9; DROP.max = 80;
  const seed = MATCH.online ? brHash(String(netCodeNow() || '') + '|' + CURMAP.id) : (Math.random() * 4294967296) >>> 0;
  BR.plano = brPlano(brRng(seed));
  brLoot(brRng(seed ^ 0x9e3779b9));
  brCaixasPoe(brRng(seed ^ 0x51ed270b));
  BR.slots = brSlots(brRng(seed ^ 0x2545f491));
  const g = new THREE.CylinderGeometry(1, 1, 1, 128, 1, true);
  const m = new THREE.MeshBasicMaterial({ color: 0x3d9bff, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  BR.malha = new THREE.Mesh(g, m); BR.malha.renderOrder = 5; BR.malha.frustumCulled = false; scene.add(BR.malha);
  BR.z = brZonaAgora(); brMalha();
}
function brMalha() {
  const M = BR.malha, z = BR.z; if (!M || !z) return;
  M.visible = z.r > 0.5; M.position.set(z.x, 20, z.z); M.scale.set(Math.max(z.r, 0.5), 240, Math.max(z.r, 0.5));
}
function brVivos() { return ffaList().filter((e) => !e.brOut); }
function ffaAcabou() {
  if (!BR.on) return ffaList().some((e) => e.kills >= MATCH.limit);
  const L = ffaList(); return L.length >= 2 && L.filter((e) => !e.brOut).length <= 1;
}
// classificação: quem está vivo, depois quem caiu por último; o resto (abates, mortes) segue a regra do cada um por si
function brCmp(a, b) { return (b.brOut || 1e9) - (a.brOut || 1e9); }
function brLinha() {
  const z = BR.z, n = brVivos().length;
  if (!z) return `${n} vivos`;
  return `${n} vivos · ${z.estado === 'fechando' ? 'zona fechando' : z.estado === 'fim' ? 'zona fechada' : 'zona fecha em ' + fmtTime(z.falta)}`;
}

/* ---------- a cada quadro ---------- */
function brUpdate(dt) {
  if (!BR.on || MATCH.state !== 'playing') return;
  const z = BR.z = brZonaAgora(); if (!z) return;
  brMalha();
  const est = z.estado + z.fase;
  if (est !== BR.estado) { if (BR.estado && z.estado === 'fechando') hudMsg('A zona está fechando!', 'xp', 3); BR.estado = est; }
  brCaixasUpdate(); brColeteHud(); brParaquedas();
  if (PL.ent.brQueda && !playHold() && !BR.avisouQueda) { BR.avisouQueda = true; hudMsg('Ande para planar e escolher onde cair', 'xp', 4); }
  // robôs desta máquina (fora do jogo online, ou os do host): pegam arma do chão e fogem da zona
  BR.botT -= dt; const pensa = BR.botT <= 0; if (pensa) BR.botT = 0.25;
  for (const b of entities) {
    if (b.isPlayer || b.isRemote || b.off || !b.alive) continue;
    if (MATCH.online && !b.netBot) continue;
    if (b.weapon && b.weapon.cat === 'pistol') {
      for (const d of DROP.list) {
        if (!d.landed || d.def.cat === 'pistol') continue;
        const o = d.obj.position; if (Math.abs(o.y - b.pos.y) > 1.6 || hyp(o.x - b.pos.x, o.z - b.pos.z) > 2.2) continue;
        brBotPega(b, d); break;
      }
    }
    if (!pensa || (b.brT -= 0.25) > 0) continue;
    const fora = !brDentroZ(z, b.pos.x, b.pos.z), A = z.alvo, longe = !brDentroZ(A, b.pos.x, b.pos.z, 0.92);
    if (!fora && !longe) continue;
    const g = b.goal, gFora = !g || !brDentroZ(A, g.x, g.z, 0.85);
    if (!gFora) continue;
    if (fora || b.tactic === 'roam') {
      if (b.tactic !== 'roam') { releaseCover(b); b.tactic = 'roam'; }
      b.holdT = 0; setPath(b, brDentro(b, A)); b.brT = 1;
    }
  }
}
function brDentro(b, A) {
  const L = POI.filter((p) => brDentroZ(A, p[0], p[2], 0.75)).map((p) => [hyp(p[0] - b.pos.x, p[2] - b.pos.z), p]).sort((u, v) => u[0] - v[0]);
  if (!L.length) return new V3(A.x, gy0(A.x, A.z), A.z);
  const p = L[Math.floor(Math.random() * Math.min(3, L.length))][1];
  return new V3(p[0], p[1], p[2]);
}
function brBotPega(b, d) {
  removeDrop(d);
  if (!b.brArma) b.brArma = b.weapon;
  b.weapon = d.def; b.arms = makeArms([d.def.id], 60);
  if (b.model && b.model.gunKey !== d.def.key) setSoldierGun(b.model, d.def.key);
  sfxMech && b.pos.distanceTo(PL.ent.pos) < 6 && sfxMech('pickup');
}
// morto: depois da killcam, a câmera segue um vivo (o que matou, se ainda estiver de pé)
function brEspectar(dt) {
  let t = BR.ver;
  if (!t || !t.alive || t.brOut || !entities.includes(t)) {
    const V = brVivos().filter((e) => e !== PL.ent && e.alive);
    t = BR.ver = PL.killer && V.includes(PL.killer) ? PL.killer : V[0] || null;
    BR.cam = null;
  }
  const d = $('death'); if (d && d.classList.contains('show')) d.classList.remove('show');
  if (!BR.aviso) {
    BR.aviso = document.createElement('div');
    BR.aviso.style.cssText = 'position:fixed;left:50%;bottom:14%;transform:translateX(-50%);padding:.5em 1.1em;background:rgba(0,0,0,.6);color:#fff;font:600 16px/1.3 system-ui,sans-serif;border-radius:6px;z-index:60;pointer-events:none;text-align:center';
    document.body.appendChild(BR.aviso);
  }
  BR.aviso.style.display = '';
  BR.aviso.textContent = `Você ficou em ${BR.lugar}º` + (t ? ` · assistindo ${t.name}` : '');
  if (!t) return;
  const y = t.yaw || 0, fx = -Math.sin(y), fz = -Math.cos(y);
  const alvo = new V3(t.pos.x - fx * 4, t.pos.y + 2.4, t.pos.z - fz * 4);
  if (!BR.cam) BR.cam = alvo.clone(); else BR.cam.lerp(alvo, 1 - Math.exp(-6 * dt));
  camera.position.copy(BR.cam); camera.lookAt(t.pos.x, t.pos.y + 1.4, t.pos.z);
}

/* ---------- as funções do jogo que mudam ---------- */
{
  const modeStart0 = modeStart;
  modeStart = function (mode) { brLimpa(); BR.on = mode === 'br'; const D = modeStart0(BR.on ? 'ffa' : mode); if (BR.on) brInicio(); return BR.on ? MODES.br : D; };
  const openSlots0 = openSlots;
  openSlots = function (e) { return BR.on && BR.slots && BR.slots.length ? BR.slots : openSlots0(e); };
  const modeDef0 = modeDef;
  modeDef = function () { return BR.on && MATCH.mode === 'ffa' ? MODES.br : modeDef0(); };
  const modeUpdate0 = modeUpdate;
  modeUpdate = function (dt) { modeUpdate0(dt); brUpdate(dt); };
  const modeEnd0 = modeEnd;
  modeEnd = function () { modeEnd0(); if (BR.on) brLimpa(); }; // BR.on fica até a próxima partida: a tela do fim usa a classificação
  // o colete segura parte do dano de quem é desta máquina (em rede, cada um aplica o dano que leva: netApply 'hit')
  const applyDamage0 = applyDamage;
  applyDamage = function (victim, dmg, attacker, weapon, head, dir, srcPos, life) {
    if (BR.on && victim && victim.alive && !victim.isRemote && victim.brColete > 0 && dmg > 0 && !(victim.protT > 0) && (MATCH.state === 'playing' || MATCH.state === 'paused')) {
      const s = Math.min(victim.brColete, dmg * BR_COLETE_SEGURA); victim.brColete -= s; dmg -= s;
    }
    return applyDamage0(victim, dmg, attacker, weapon, head, dir, srcPos, life);
  };
  // quem atira não sabe o colete do outro: no battle royale a morte não é prevista, vem do aviso de quem morreu
  const netPredHealth0 = netPredHealth;
  netPredHealth = function (v) { return netPredHealth0(v) + (BR.on ? 100 : 0); };
  const killEnt0 = killEnt;
  killEnt = function (v, a, weapon, head, dir, life) {
    if (BR.on) v.brColete = 0;
    if (BR.on && !v.brOut && (MATCH.state === 'playing' || MATCH.state === 'paused') && !MATCH.fin) { v.brOut = ++BR.ordem; if (v.isPlayer) BR.lugar = brVivos().length + 1; }
    return killEnt0(v, a, weapon, head, dir, life);
  };
  const respawnPlayer0 = respawnPlayer;
  respawnPlayer = function () { if (BR.on && PL.ent.brOut && (MATCH.state === 'playing' || MATCH.state === 'paused')) return; return respawnPlayer0(); };
  const spawnEntity0 = spawnEntity;
  spawnEntity = function (e) {
    spawnEntity0(e);
    if (BR.on && OPEN.on && !e.isRemote) brPoeNoAlto(e);
    if (!BR.on || e.isPlayer || e.isRemote || !WEAPONS.m9) return;
    const p = WEAPONS.m9; if (!e.brArma) e.brArma = e.weapon;
    e.weapon = p; e.arms = makeArms([p.id], 60);
    if (e.model && e.model.gunKey !== p.key) setSoldierGun(e.model, p.key);
  };
  const giveLoadout0 = giveLoadout;
  giveLoadout = function () {
    if (BR.on && BR.armado) return; // trocar de classe no meio da partida não devolve as armas
    giveLoadout0();
    if (!BR.on) return;
    BR.armado = true;
    const A = PL.ent.arms; let s = A.slots.filter((x) => x.def.cat === 'pistol');
    if (!s.length && WEAPONS.m9) s = [{ def: WEAPONS.m9, mag: WEAPONS.m9.mag, reserve: WEAPONS.m9.reserve }];
    if (!s.length) return;
    A.slots = s.slice(0, 1); A.cur = 0; vmEquip(A.slots[0].def);
  };
  const swapWithDrop0 = swapWithDrop;
  swapWithDrop = function () {
    const d = DROP.cur, P = PL.ent, A = P.arms;
    if (BR.on && d && A.slots.length < 2 && dropSwapAllowed() && MATCH.state === 'playing' && !A.slots.some((s) => s.def.cat === d.def.cat)) {
      PL.knifeOut = false; removeDrop(d);
      A.slots.push({ def: d.def, mag: d.mag, reserve: d.reserve });
      sfxMech('pickup'); P.busy = false; ctlSwitch(P, A.slots.length - 1);
      return;
    }
    return swapWithDrop0();
  };
  const streakKill0 = streakKill;
  streakKill = function (a, weapon, life) { return !BR.on && streakKill0(a, weapon, life); };
  const pickGoal0 = pickGoal;
  pickGoal = function (b, now) {
    if (!BR.on || !BR.z) return pickGoal0(b, now);
    const A = BR.z.alvo;
    // com a pistola ainda, vai atrás de uma arma no chão perto (dentro da zona que vem)
    if (b.weapon && b.weapon.cat === 'pistol' && Math.random() < 0.75) {
      let best = null, bd = 45;
      for (const d of DROP.list) {
        if (!d.landed || d.def.cat === 'pistol') continue;
        const o = d.obj.position, dd = hyp(o.x - b.pos.x, o.z - b.pos.z);
        if (dd < bd && brDentroZ(A, o.x, o.z, 0.9)) { bd = dd; best = o; }
      }
      if (best) return new V3(best.x, best.y, best.z);
    }
    // machucado, vai atrás de uma cura perto; sem colete, às vezes atrás de um
    for (const [tipo, quer] of [['cura', b.health < 60 ? 0.8 : 0], ['colete', !(b.brColete > 0) ? 0.35 : 0]]) {
      if (!quer || Math.random() > quer) continue;
      let best = null, bd = 35;
      for (const c of BR.caixas || []) { if (c.tipo !== tipo) continue; const dd = hyp(c.x - b.pos.x, c.z - b.pos.z); if (dd < bd && brDentroZ(A, c.x, c.z, 0.9)) { bd = dd; best = c; } }
      if (best) return new V3(best.x, best.y, best.z);
    }
    const g = pickGoal0(b, now);
    return g && !brDentroZ(A, g.x, g.z, 0.85) ? brDentro(b, A) : g;
  };
  const ringCheck0 = ringCheck;
  ringCheck = function (e, dt) {
    if (BR.on) brQuedaPasso(e, dt);
    if (BR.on && BR.z && e.alive && (MATCH.state === 'playing' || MATCH.state === 'paused') && !brDentroZ(BR.z, e.pos.x, e.pos.z)) {
      e.health -= BR.z.dps * dt;
      if (e.isPlayer) PL.lastDmgT = MATCH.time; else e.lastHitT = MATCH.time; // fora da zona a vida não volta
      if (e.health <= 0) { e.health = 0; zoneDeath(e); if (!e.alive) return true; }
    }
    return ringCheck0(e, dt);
  };
  const ringHud0 = ringHud;
  ringHud = function (e) {
    if (!BR.on) return ringHud0(e);
    const el = $('ringOut'), z = BR.z; if (!el) return;
    const fora = !!(z && e && e.alive && MATCH.state === 'playing' && !brDentroZ(z, e.pos.x, e.pos.z));
    if (fora !== BR.hudFora) {
      BR.hudFora = fora; el.classList.toggle('show', fora);
      if (!BR.roTxt) BR.roTxt = [el.querySelector('b').textContent, el.querySelector('span').textContent];
      el.querySelector('b').textContent = 'Fora da zona'; el.querySelector('span').textContent = 'A zona tira vida: volte pra dentro da parede azul';
    }
    if (fora) { el.style.setProperty('--k', '0.55'); $('ringN').textContent = Math.ceil(Math.max(0, e.health) / z.dps); }
  };
  const updateDeadPlayer0 = updateDeadPlayer;
  updateDeadPlayer = function (dt) {
    updateDeadPlayer0(dt);
    if (BR.on && PL.ent.brOut && !KC.active && !KC.pending && PL.deathT > 4 && MATCH.state === 'playing') brEspectar(dt);
  };
  const showDeathScreen0 = showDeathScreen;
  showDeathScreen = function (a, weapon, head) {
    showDeathScreen0(a, weapon, head);
    if (!BR.on) return;
    if (weapon === NET_WSPECIAL.zone && (!a || a === PL.ent)) $('deathBy').innerHTML = '<b>Pego pela zona</b>';
    brDeathTxt();
  };
  // minimapa (2026-11-27): domMinimap desenha nas coordenadas do mapa (já giradas e centradas no jogador), logo depois do plano
  const domMinimap0 = domMinimap;
  domMinimap = function (g, scale, yaw) { domMinimap0(g, scale, yaw); if (BR.on && BR.z && MATCH.state === 'playing') brMinimapa(g, scale); };
  const deathPrompt0 = deathPrompt;
  deathPrompt = function () { deathPrompt0(); brDeathTxt(); };
}
/* A zona no minimapa: fora dela escurece em azul, a borda atual é uma linha azul cheia e a próxima (para onde ela vai fechar) uma
   linha branca tracejada. Fora da zona, um tracejado azul liga o jogador ao ponto mais perto da borda. */
function brMinimapa(g, s) {
  const z = BR.z, A = z.alvo, e = PL.ent;
  g.save();
  if (z.r > 0.5) {
    g.fillStyle = 'rgba(30,90,200,0.28)';
    g.beginPath(); g.arc(z.x * s, z.z * s, 4000, 0, TAU); g.arc(z.x * s, z.z * s, z.r * s, 0, TAU, true); g.fill();
    g.strokeStyle = 'rgba(80,170,255,0.95)'; g.lineWidth = 2.2;
    g.beginPath(); g.arc(z.x * s, z.z * s, z.r * s, 0, TAU); g.stroke();
  } else { g.fillStyle = 'rgba(30,90,200,0.28)'; g.fillRect(-4000, -4000, 8000, 8000); }
  if (A.r > 0.5 && A.r < z.r - 0.5) {
    g.setLineDash([5, 4]); g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 1.6;
    g.beginPath(); g.arc(A.x * s, A.z * s, A.r * s, 0, TAU); g.stroke();
  }
  if (e && e.alive && z.r > 0.5 && !brDentroZ(z, e.pos.x, e.pos.z)) {
    const dx = z.x - e.pos.x, dz = z.z - e.pos.z, d = Math.hypot(dx, dz) || 1, k = (d - z.r) / d;
    g.setLineDash([4, 3]); g.strokeStyle = 'rgba(80,170,255,0.95)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(e.pos.x * s, e.pos.z * s); g.lineTo((e.pos.x + dx * k) * s, (e.pos.z + dz * k) * s); g.stroke();
  }
  g.restore();
}
function brDeathTxt() {
  if (!BR.on || !PL.ent.brOut) return;
  const s = $('death').querySelector('.skip'); if (s) hudHtml(s, esc(`Você ficou em ${BR.lugar}º · a partida segue sem você`));
}
