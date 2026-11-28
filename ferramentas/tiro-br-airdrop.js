/* AIRDROP do Battle royale (2026-11-28, o Thiago: "um sistema de airdrop que cai em lugares aleatórios do mapa a cada 2,5 min de
   partida. No airdrop: a Barrett e a possibilidade de escolher um layout seu. A Barrett, por ser MUITO META, só no airdrop").
   Entra no jogo montado por ferramentas/tiro-frontline.js depois das motos, no mesmo script.
   - a cada BR_AIR.cada s de partida (o relógio da zona, o mesmo em todo o salão) cai uma caixa num ponto de chão sorteado dentro da
     zona que vem (a semente é a do salão: todo mundo vê a caixa no mesmo lugar). Ela desce de paraquedas de BR_AIR.alto m, com um
     facho de luz até o céu e um quadrado amarelo no minimapa; um aviso na tela diz que está caindo;
   - no chão, ao lado da caixa, fica uma Barrett M82 (a única do mapa: BR_ARMAS não tem mais ela). Como as outras armas do chão,
     não vai pela rede: quem pega primeiro na sua tela leva;
   - na caixa, a tecla de usar (E; no tablet, o botão Ramasser) dá o SEU LAYOUT: as armas e as granadas da classe escolhida (troque a
     classe no menu de pausa antes de pegar). Cada pessoa pega o seu uma vez por caixa. */
const BR_AIR = { cada: 150, alto: 85, desce: 7, raio: 2.3, lista: [], n: 0, geo: null };

function brAirPonto(n) {
  const z = BR.z, rnd = brRng((BR.semente || 1) ^ Math.imul(n + 1, 0x9e3779b1));
  const A = z ? z.alvo : null, L = spawnField().filter(([x, zz]) => !A || brDentroZ(A, x, zz, 0.8));
  const P = L.length ? L : spawnField();
  if (!P.length) return [0, 0];
  return P[Math.floor(rnd() * P.length)];
}
function brAirNovo(n) {
  const [x, z] = brAirPonto(n), chao = groundHeight(x, z, gy0(x, z) + 200, 0.6);
  const g = new THREE.Group();
  const caixa = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.95, 1.3), new THREE.MeshStandardMaterial({ color: 0x5a6b2e, roughness: 0.7, metalness: 0.2 }));
  caixa.position.y = 0.475; caixa.castShadow = true; g.add(caixa);
  const faixa = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.2, 1.34), new THREE.MeshStandardMaterial({ color: 0xf0b020, roughness: 0.6, emissive: 0xf0b020, emissiveIntensity: 0.3 }));
  faixa.position.y = 0.6; g.add(faixa);
  const para = new THREE.Mesh(new THREE.SphereGeometry(2.4, 16, 6, 0, TAU, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xe8e2d0, roughness: 0.8, side: THREE.DoubleSide }));
  para.scale.y = 0.55; para.position.y = 4.2; g.add(para);
  const luz = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 160, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0xffc040, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  luz.position.y = 80; luz.frustumCulled = false; g.add(luz);
  g.position.set(x, chao + BR_AIR.alto, z); scene.add(g);
  const a = { n, x, z, chao, g, para, luz, pousou: false, pegou: false };
  BR_AIR.lista.push(a);
  hudMsg('Airdrop caindo! Barrett e o seu layout (quadrado amarelo no minimapa)', 'xp', 4.5);
  return a;
}
function brAirPousar(a) {
  a.pousou = true; a.g.position.y = a.chao; a.para.visible = false;
  const def = WEAPONS.m82; if (!def) return;
  const q = new THREE.Quaternion().setFromAxisAngle(UP, (a.n * 1.7) % TAU);
  dropWeapon(def, def.mag, def.mag * 3, new V3(a.x + 1.4, a.chao + 0.6, a.z), q, new V3(0, 0.2, 0));
}
function brAirLimpa() { for (const a of BR_AIR.lista) scene.remove(a.g); BR_AIR.lista = []; BR_AIR.n = 0; }
function brAirPasso(dt) {
  if (!BR.on || MATCH.state !== 'playing' || !BR.plano) return;
  const t = Math.max(0, BR.T0 - MATCH.timeLeft), deve = Math.floor(t / BR_AIR.cada);
  while (BR_AIR.n < deve) { BR_AIR.n++; brAirNovo(BR_AIR.n); }
  for (const a of BR_AIR.lista) {
    if (a.pousou) continue;
    a.g.position.y = Math.max(a.chao, a.g.position.y - BR_AIR.desce * dt);
    if (a.g.position.y <= a.chao + 0.01) brAirPousar(a);
  }
}
// a caixa mais perto do jogador, pousada e ainda com o layout dele
function brAirPerto() {
  const e = PL.ent; if (!BR.on || !e || !e.alive || e.brQueda || e.brCaido || MATCH.state !== 'playing') return null;
  for (const a of BR_AIR.lista) if (a.pousou && !a.pegou && hyp(a.x - e.pos.x, a.z - e.pos.z) < BR_AIR.raio && Math.abs(a.chao - e.pos.y) < 1.6) return a;
  return null;
}
function brAirPegar(a) {
  classFix(); PL.classIdx = Settings.loadout;
  const ids = classWeapons(PL.classIdx), A = PL.ent.arms; if (!ids || !ids.length) return;
  A.slots = ids.map((def) => ({ def, mag: def.mag, reserve: def.reserve })); A.cur = 0; A.reload = null; A.switching = 0;
  vmEquip(A.slots[0].def); VM.lowerTarget = 0;
  const C = CLASSES[PL.classIdx]; if (C) { PL.nades = C.nades; PL.nadeType = NADE_TYPES[C.nade] ? C.nade : 'frag'; }
  a.pegou = true; sfxMech('pickup');
  hudMsg('Seu layout: ' + A.slots.map((s) => s.def.name).join(' + '), 'xp', 3);
}
// o minimapa: um quadrado amarelo em cada caixa (piscando enquanto cai)
function brAirMinimapa(g, s) {
  for (const a of BR_AIR.lista) {
    if (!a.pousou && Math.floor(MATCH.time * 3) % 2) continue;
    g.save(); g.fillStyle = a.pegou ? 'rgba(240,176,32,0.45)' : '#f0b020'; g.strokeStyle = 'rgba(0,0,0,0.8)'; g.lineWidth = 1.2;
    g.fillRect(a.x * s - 4.5, a.z * s - 4.5, 9, 9); g.strokeRect(a.x * s - 4.5, a.z * s - 4.5, 9, 9); g.restore();
  }
}
{
  // a Barrett só no airdrop: fora das armas do chão
  for (let i = BR_ARMAS.length - 1; i >= 0; i--) if (BR_ARMAS[i][0] === 'm82') BR_ARMAS.splice(i, 1);
  const inicio0 = brInicio;
  brInicio = function () { brAirLimpa(); inicio0(); BR.semente = MATCH.online ? brHash(String(netCodeNow() || '') + '|' + CURMAP.id + '|air') : (Math.random() * 4294967296) >>> 0; };
  const limpa0 = brLimpa;
  brLimpa = function () { brAirLimpa(); limpa0(); };
  const passo0 = brUpdate;
  brUpdate = function (dt) { passo0(dt); brAirPasso(dt); };
  const mm0 = brMinimapa;
  brMinimapa = function (g, s) { mm0(g, s); if (BR.on) brAirMinimapa(g, s); };
  const uso0 = mechaUse;
  mechaUse = function () { const a = brAirPerto(); if (a) { brAirPegar(a); return true; } return uso0(); };
  const perto0 = mechaNear;
  mechaNear = function () { return perto0() || brAirPerto() || null; };
  const aviso0 = mechaPrompt;
  mechaPrompt = function () { if (brAirPerto()) return `${actGlyph('use')} Pegar o seu layout (airdrop)`; return aviso0(); };
}
