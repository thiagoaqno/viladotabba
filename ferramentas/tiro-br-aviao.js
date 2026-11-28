/* AVIÃO da largada do Battle royale (2026-11-28, o Thiago: "para nascer, deve passar um avião lento por cima do mapa... aí as
   pessoas vão dropando do avião quando quiserem... o avião passa em sentidos aleatórios, mas sempre cruzando o meio do mapa").
   Entra no jogo montado por ferramentas/tiro-frontline.js depois do airdrop, no mesmo script.
   - no começo (a abertura, OPEN.on), todo soldado desta máquina entra no avião (e.brAviao, junto com e.brQueda: na queda já não se
     atira, não se pega nada e não se sobe em moto). A rota é uma reta que passa pelo meio do mapa, com o ângulo sorteado pela semente
     do salão (todo mundo vê o mesmo avião), de uma borda do mapa à outra, BR_AV.alto m acima do ponto mais alto embaixo dela;
   - na contagem o avião espera na borda; no "Vai!" anda a BR_AV.vel m/s. O jogador salta quando quiser com Espaço ou E (no tablet,
     pular ou pegar); no fim da rota, quem ainda está dentro salta sozinho. Dali segue a queda de antes: queda livre planando,
     paraquedas a BR_QUEDA.abre m do chão;
   - cada robô salta quando o avião passa mais perto do lugar de largada dele (os lugares espalhados de brSlots) e plana até lá;
   - quem está no avião não aparece (nem os de fora da máquina perto do avião) e a zona não tira vida dele. */
const BR_AV = { vel: 12, alto: 65, margem: 4 };

function brAvRota() {
  if (BR.av) return BR.av;
  const sem = MATCH.online ? brHash(String(netCodeNow() || '') + '|' + CURMAP.id + '|aviao') : (Math.random() * 4294967296) >>> 0;
  const rnd = brRng(sem), ang = rnd() * TAU, dx = Math.cos(ang), dz = Math.sin(ang);
  const cx = (MAP.x0 + MAP.x1) / 2, cz = (MAP.z0 + MAP.z1) / 2, hx = (MAP.x1 - MAP.x0) / 2, hz = (MAP.z1 - MAP.z0) / 2;
  // da borda à borda do mapa, passando pelo meio
  const L = Math.max(20, Math.min(Math.abs(dx) > 1e-3 ? hx / Math.abs(dx) : 1e9, Math.abs(dz) > 1e-3 ? hz / Math.abs(dz) : 1e9) - BR_AV.margem);
  const ax = cx - dx * L, az = cz - dz * L;
  let topo = -1e9;
  for (let i = 0; i <= 40; i++) { const x = ax + dx * 2 * L * i / 40, z = az + dz * 2 * L * i / 40; topo = Math.max(topo, groundHeight(x, z, gy0(x, z) + 300, 0.6)); }
  BR.av = { ax, az, dx, dz, L, y: topo + BR_AV.alto, T: (2 * L) / BR_AV.vel, t: 0, malha: null, aviso: false };
  return BR.av;
}
// onde o avião está no tempo t (passou do fim: continua reto, saindo do mapa)
function brAvPos(t) { const A = brAvRota(), s = t * BR_AV.vel; return [A.ax + A.dx * s, A.y, A.az + A.dz * s]; }
function brAvVoando() { const A = BR.av; return !!A && A.t < A.T + 12; }

function brAvMalha() {
  const A = brAvRota(); if (A.malha) return A.malha;
  const g = new THREE.Group(), cinza = new THREE.MeshStandardMaterial({ color: 0x7d8790, roughness: 0.55, metalness: 0.35 });
  const escuro = new THREE.MeshStandardMaterial({ color: 0x3a4148, roughness: 0.6, metalness: 0.3 });
  const corpo = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.4, 18, 14), cinza); corpo.rotation.x = Math.PI / 2; g.add(corpo);
  const nariz = new THREE.Mesh(new THREE.SphereGeometry(1.6, 14, 8, 0, TAU, 0, Math.PI / 2), cinza); nariz.rotation.x = Math.PI / 2; nariz.position.z = 9; g.add(nariz);
  const asa = new THREE.Mesh(new THREE.BoxGeometry(26, 0.35, 3.4), cinza); asa.position.set(0, 0.9, 1); g.add(asa);
  const cauda = new THREE.Mesh(new THREE.BoxGeometry(8, 0.3, 2.2), cinza); cauda.position.set(0, 0.6, -8.2); g.add(cauda);
  const leme = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.6, 2.6), cinza); leme.position.set(0, 2.6, -8.2); g.add(leme);
  for (const x of [-6.5, 6.5]) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 3.2, 10), escuro); m.rotation.x = Math.PI / 2; m.position.set(x, 0.2, 2.6); g.add(m); }
  for (const c of g.children) c.castShadow = true;
  g.rotation.y = Math.atan2(A.dx, A.dz); // o nariz (+z do grupo) para a frente da rota
  scene.add(g); A.malha = g; return g;
}
function brAvLimpa() { if (BR.av && BR.av.malha) scene.remove(BR.av.malha); BR.av = null; if (BR.avAviso) BR.avAviso.style.display = 'none'; }

// no começo: para dentro do avião (o lugar de largada vira o alvo da queda)
function brPoeNoAviao(e) {
  const A = brAvRota();
  e.brAvAlvo = [e.pos.x, e.pos.z];
  const s = Math.max(0, Math.min(2 * A.L, (e.pos.x - A.ax) * A.dx + (e.pos.z - A.az) * A.dz));
  e.brAvSalta = e.isPlayer ? A.T : Math.max(1, Math.min(A.T, s / BR_AV.vel + (Math.random() - 0.5) * 2.5));
  e.brAviao = true; e.brQueda = true; e.vel.set(0, 0, 0); e.vy = 0; e.onGround = false; e.airVy = 0;
  const [x, y, z] = brAvPos(0); e.pos.set(x, y, z); e.brAlto = y;
}
function brAvSaltar(e) {
  const A = brAvRota(), [x, y, z] = brAvPos(A.t);
  e.brAviao = false; e.brQueda = true; e.pos.set(x, y - 2.5, z); e.brAlto = y - 2.5; e.vy = 0; e.airVy = 0; e.onGround = false;
  e.vel.set(A.dx * BR_AV.vel * 0.6, 0, A.dz * BR_AV.vel * 0.6);
  if (e.isPlayer) { BR.avSalta = false; hudMsg('Saltou! Ande para planar e escolher onde cair', 'xp', 3.5); BR.avisouQueda = true; }
}
function brAvTeclas() { return inputMode() === 'touch' ? 'Toque em pular ou pegar para saltar' : inputMode() === 'pad' ? 'Pule ou aperte o botão de usar para saltar do avião' : 'Espaço ou E: saltar do avião'; }
function brAvAviso(t) {
  if (!BR.avAviso) {
    BR.avAviso = document.createElement('div');
    BR.avAviso.style.cssText = 'position:fixed;left:50%;bottom:26%;transform:translateX(-50%);padding:.45em 1em;background:rgba(20,40,70,.75);color:#fff;font:600 16px/1.3 system-ui,sans-serif;border-radius:6px;z-index:60;pointer-events:none;text-align:center';
    document.body.appendChild(BR.avAviso);
  }
  BR.avAviso.style.display = t ? '' : 'none'; if (t && BR.avAviso.textContent !== t) BR.avAviso.textContent = t;
}

{
  const limpa0 = brLimpa;
  brLimpa = function () { brAvLimpa(); BR.avSalta = false; for (const e of entities) { e.brAviao = false; e.brAvAlvo = null; } limpa0(); };
  const spawn0 = spawnEntity;
  spawnEntity = function (e) {
    const r = spawn0(e);
    if (BR.on && OPEN.on && !e.isRemote && e.alive) brPoeNoAviao(e);
    return r;
  };
  // dentro do avião: preso a ele; saltou: a queda de antes (os robôs planam até o lugar deles)
  const queda0 = brQuedaPasso;
  brQuedaPasso = function (e, dt) {
    if (e.brAviao) {
      if (!e.alive || !BR.on) { e.brAviao = false; return queda0(e, dt); }
      const A = brAvRota(), quer = e.isPlayer && (e.input.jump || BR.avSalta);
      if (!playHold() && (A.t >= e.brAvSalta || (quer && A.t > 0.4))) { brAvSaltar(e); return; }
      const [x, y, z] = brAvPos(playHold() ? 0 : A.t);
      e.pos.set(x, y, z); e.vel.set(0, 0, 0); e.vy = 0; e.airVy = 0; e.onGround = false; e.brAlto = y;
      return;
    }
    queda0(e, dt);
    if (!e.isPlayer && e.brQueda && e.brAvAlvo && !playHold()) {
      const alt = e.pos.y - brChao(e), [tx, tz] = e.brAvAlvo, wx = tx - e.pos.x, wz = tz - e.pos.z, d = hyp(wx, wz);
      if (alt < 4 || d < 0.8) { e.vel.x = damp(e.vel.x, 0, 3, dt); e.vel.z = damp(e.vel.z, 0, 3, dt); return; }
      const v = Math.min(alt < BR_QUEDA.abre ? BR_QUEDA.planaPara : BR_QUEDA.planaLivre, d * 0.8);
      e.vel.x = damp(e.vel.x, wx / d * v, 3, dt); e.vel.z = damp(e.vel.z, wz / d * v, 3, dt);
    }
    if (!e.brQueda) e.brAvAlvo = null;
  };
  // no avião a zona não tira vida (a rota vai de borda a borda)
  const ring1 = ringCheck;
  ringCheck = function (e, dt) {
    if (BR.on && e.brAviao) { brQuedaPasso(e, dt); if (e.brAviao) return false; }
    return ring1(e, dt);
  };
  // a tecla de usar dentro do avião: salta
  const uso1 = mechaUse;
  mechaUse = function () { const e = PL.ent; if (BR.on && e && e.alive && e.brAviao) { BR.avSalta = true; return true; } return uso1(); };
  // ninguém aparece dentro do avião
  const anim1 = animSoldier;
  animSoldier = function (e, dt) {
    const r = anim1(e, dt);
    if (BR.on && e.model && e.alive && brAvVoando()) {
      let dentro = e.brAviao;
      if (!dentro && e.isRemote) { const [x, y, z] = brAvPos(BR.av.t); dentro = Math.abs(e.pos.y - y) < 6 && hyp(e.pos.x - x, e.pos.z - z) < 12; }
      if (dentro) e.model.root.visible = false;
    }
    return r;
  };
  // o relógio e a malha do avião, e o aviso de saltar
  const passo1 = brUpdate;
  brUpdate = function (dt) {
    passo1(dt);
    const A = BR.av;
    if (!BR.on || !A) { if (BR.avAviso) brAvAviso(''); return; }
    if (MATCH.state === 'playing' && !playHold()) A.t += dt;
    if (brAvVoando()) {
      const g = brAvMalha(), [x, y, z] = brAvPos(playHold() ? 0 : A.t); g.position.set(x, y + 1.2, z); g.visible = true;
    } else if (A.malha) { scene.remove(A.malha); A.malha = null; }
    const e = PL.ent, dentro = e && e.alive && e.brAviao;
    if (dentro && !playHold() && !A.aviso) { A.aviso = true; hudMsg('O avião está passando: salte quando quiser', 'xp', 4); }
    brAvAviso(dentro ? brAvTeclas() + (playHold() ? '' : ` · ${Math.max(0, Math.ceil(A.T - A.t))} s`) : '');
  };
  // no minimapa: a rota tracejada e um triângulo no avião
  const mm1 = brMinimapa;
  brMinimapa = function (g, s) {
    mm1(g, s);
    const A = BR.av; if (!BR.on || !A || !brAvVoando() || A.t > A.T) return;
    g.save(); g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 1.5; g.setLineDash([5, 5]);
    g.beginPath(); g.moveTo(A.ax * s, A.az * s); g.lineTo((A.ax + A.dx * 2 * A.L) * s, (A.az + A.dz * 2 * A.L) * s); g.stroke(); g.setLineDash([]);
    const [x, , z] = brAvPos(playHold() ? 0 : A.t), a = Math.atan2(A.dz, A.dx);
    g.translate(x * s, z * s); g.rotate(a); g.fillStyle = '#fff'; g.strokeStyle = 'rgba(0,0,0,0.8)'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(7, 0); g.lineTo(-5, -5); g.lineTo(-5, 5); g.closePath(); g.fill(); g.stroke(); g.restore();
  };
}
