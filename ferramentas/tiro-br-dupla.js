/* BATTLE ROYALE EM DUPLA do Tiro da Galera (2026-11-27, o Thiago: "cria um modo DUO para o BR. Caso um caia, o outro reanima").
   Entra no jogo montado por ferramentas/tiro-frontline.js logo depois do ferramentas/tiro-br.js, no mesmo script, e troca
   algumas funções de novo (chamando a anterior). Vale só com BR.duo (o modo 'brduo'); fora dele nada muda.
   Regras:
   - 6 duplas (12 no salão, robôs completando). As duplas saem da ordem de largada do jogo (openRank): no salão, as pessoas
     por ordem de identificador e depois os robôs do host; no solo, você e o primeiro robô. A conta é a mesma em todas as máquinas
     (netIdOf) e fica fixa no "Vai!";
   - o parceiro é aliado: não leva tiro seu, aparece em claro e no minimapa; a dupla cai perto uma da outra (3 m);
   - quem leva o tiro que mataria, com o parceiro de pé, CAI: fica agachado, sem atirar, com BR_CAIDO.tempo s de vida (que
     também cai com tiro); o parceiro fica perto (até BR_CAIDO.raio m) por BR_CAIDO.levantar s sem atirar e ele levanta com
     BR_CAIDO.volta de vida. Sangrou até o fim, levou o tiro final ou o parceiro morreu: morre de vez;
   - a dupla sai quando os dois morrem; a última dupla de pé vence (os dois ganham). O placar do fim é por dupla.
   Rede: cada máquina decide sobre os soldados dela (o jogador, e os robôs no host), como nas mortes. "Caiu"/"levantou" vão
   como evento 'brc' (c: 1 ou 0) do soldado; "reanimei o meu parceiro" como 'brv' (to: id dele), e a máquina dele levanta. */
const BR_CAIDO = { tempo: 30, raio: 1.9, levantar: 4, volta: 30 };

MODES.brduo = Object.assign({}, MODES.br, {
  name: 'Battle royale em dupla', btn: 'BR em dupla', sub: 'Battle royale em dupla, a última dupla vence', teams: 'Até 20 jogadores, 10 duplas',
  hint: 'Duplas de dois. Quem cai fica 30 s no chão: o parceiro chega perto e fica 4 s sem atirar para levantar ele. A última dupla de pé vence.',
});
MODE_IDS.push('brduo');

const brLocal = (e) => e.isPlayer || (!e.isRemote && (!MATCH.online || e.netBot));
const brDupla = (e) => (e && e.brDuo != null ? e.brDuo : -1);
function brParceiro(e) { const d = brDupla(e); if (d < 0) return null; for (const o of ffaList()) if (o !== e && o.brDuo === d) return o; return null; }
const brDePe = (e) => !!e && e.alive && !e.brOut && !e.brCaido;

/* ---------- as duplas ---------- */
// a mesma ordem do openRank (09i-modes.js), mas para todos (inclusive os de outras máquinas): pessoas por identificador, depois robôs
function brDuplasMontar() {
  const L = ffaList(); let ord;
  if (!MATCH.online) ord = L.slice().sort((a, b) => b.isPlayer - a.isPlayer || entities.indexOf(a) - entities.indexOf(b));
  else {
    const k = (e) => String(netIdOf(e) || ''), robo = (e) => k(e).includes('~b'), n = (e) => +k(e).split('~b')[1] || 0;
    ord = L.slice().sort((a, b) => robo(a) - robo(b) || (robo(a) ? n(a) - n(b) : k(a) < k(b) ? -1 : k(a) > k(b) ? 1 : 0));
  }
  let mudou = false;
  ord.forEach((e, i) => { const d = Math.floor(i / 2); if (e.brDuo !== d) { e.brDuo = d; mudou = true; } });
  if (mudou) soldierLookAll(); // o parceiro em claro, os outros em escuro
}

/* ---------- cair, sangrar, levantar ---------- */
function brCair(v, a, weapon) {
  v.brCaido = true; v.brCaidoT = MATCH.time; v.health = 100; v.brCaidoPor = a && a !== v ? a : null; v.brCaidoArma = weapon; v.brRevT = 0;
  v.protT = 0; v.target = null;
  if (MATCH.online) netEvent({ k: 'brc', c: 1 }, v);
  if (v.isPlayer) { hudMsg('Você caiu! Seu parceiro pode te levantar', 'enemy', 3); PL.reload = null; }
  else if (a && a.isPlayer) hudMsg('Derrubado: ' + v.name, 'xp', 1.6);
}
function brLevantar(v) {
  if (!v.brCaido || !v.alive) return;
  v.brCaido = false; v.brRevT = 0; v.health = BR_CAIDO.volta;
  if (MATCH.online && brLocal(v)) netEvent({ k: 'brc', c: 0 }, v);
  if (v.isPlayer) { PL.crouchToggle = false; VM.lowerTarget = 0; hudMsg('Você foi levantado!', 'xp', 2); }
}
// morte de vez de quem estava caído (sangrou ou ficou sem parceiro): o abate é de quem derrubou
function brMorrerCaido(v) {
  v.health = 0; const a = v.brCaidoPor && entities.includes(v.brCaidoPor) ? v.brCaidoPor : v;
  killEnt(v, a, v.brCaidoArma || NET_WSPECIAL.zone, false, new V3(0, 0, -1));
}

/* ---------- a cada quadro ---------- */
function brDuplaUpdate(dt) {
  if (OPEN.on || playHold()) brDuplasMontar(); // até o "Vai!"
  const eu = PL.ent;
  let txt = '';
  for (const e of ffaList()) {
    if (!e.alive || e.brOut) continue;
    const p = brParceiro(e);
    // caído desta máquina: sangra; sem parceiro de pé (morto ou caído também), morre
    if (e.brCaido && brLocal(e)) {
      e.health -= (100 / BR_CAIDO.tempo) * dt;
      if (e.health <= 0 || !p || p.brOut || !p.alive) { brMorrerCaido(e); continue; }
      if (e.isPlayer) txt = `Caído: ${Math.ceil(e.health * BR_CAIDO.tempo / 100)} s · fique perto do parceiro para ele te levantar`;
    }
    // reanimar: o parceiro de pé, desta máquina, perto do caído e sem atirar
    if (!e.brCaido && brLocal(e) && p && p.brCaido && p.alive) {
      const perto = hyp(p.pos.x - e.pos.x, p.pos.z - e.pos.z) < BR_CAIDO.raio && Math.abs(p.pos.y - e.pos.y) < 1.5, quieto = MATCH.time - (e.lastShotT || -9) > 0.6;
      e.brRevT = perto && quieto ? (e.brRevT || 0) + dt : 0;
      if (e.isPlayer) txt = perto ? (quieto ? `Levantando ${p.name}: ${Math.max(0, BR_CAIDO.levantar - e.brRevT).toFixed(1)} s` : 'Pare de atirar para levantar o parceiro') : `${p.name} caiu: chegue perto para levantar`;
      if (e.brRevT >= BR_CAIDO.levantar) {
        e.brRevT = 0;
        if (brLocal(p)) brLevantar(p); else netEvent({ k: 'brv', to: netIdOf(p) }, e);
      }
    } else if (!e.brCaido) e.brRevT = 0;
  }
  // robôs desta máquina com o parceiro caído e sem inimigo à vista: vão até ele
  for (const b of ffaList()) {
    if (b.isPlayer || !brLocal(b) || !brDePe(b) || b.visible) continue;
    const p = brParceiro(b); if (!p || !p.brCaido || !p.alive) continue;
    if ((b.brIrT = (b.brIrT || 0) - dt) > 0) continue;
    b.brIrT = 1;
    if (hyp(p.pos.x - b.pos.x, p.pos.z - b.pos.z) > 1.2) { if (b.tactic !== 'roam') { releaseCover(b); b.tactic = 'roam'; } b.holdT = 0; setPath(b, new V3(p.pos.x, p.pos.y, p.pos.z)); }
  }
  if (eu.alive && !eu.brOut && txt) brAvisoDupla(txt); else if (!eu.brOut) brAvisoDupla('');
  brMarcasCaidos();
}
function brAvisoDupla(t) {
  if (!BR.avisoD) {
    BR.avisoD = document.createElement('div');
    BR.avisoD.style.cssText = 'position:fixed;left:50%;bottom:22%;transform:translateX(-50%);padding:.45em 1em;background:rgba(120,10,10,.72);color:#fff;font:600 16px/1.3 system-ui,sans-serif;border-radius:6px;z-index:60;pointer-events:none;text-align:center';
    document.body.appendChild(BR.avisoD);
  }
  if (BR.avisoDT === t) return; BR.avisoDT = t;
  BR.avisoD.style.display = t ? '' : 'none'; BR.avisoD.textContent = t;
}
// um anel vermelho no chão em volta de quem está caído (de todos), para achar e para saber que ele não atira
function brMarcasCaidos() {
  const P = BR.aneis || (BR.aneis = []); let n = 0;
  for (const e of entities) {
    if (!e.alive || e.off || !e.brCaido || e === PL.ent) continue;
    let m = P[n];
    if (!m) { m = P[n] = new THREE.Mesh(BR.anelGeo || (BR.anelGeo = new THREE.RingGeometry(0.7, 0.95, 32)), new THREE.MeshBasicMaterial({ color: 0xff3030, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false })); m.rotation.x = -Math.PI / 2; scene.add(m); }
    m.visible = true; m.material.color.setHex(e.brDuo === PL.ent.brDuo ? 0x40e0ff : 0xff3030); m.position.set(e.pos.x, e.pos.y + 0.06, e.pos.z); n++;
  }
  for (let i = n; i < P.length; i++) P[i].visible = false;
}

/* ---------- as funções que mudam ---------- */
{
  const modeDef1 = modeDef;
  modeDef = function () { return BR.on && BR.duo && MATCH.mode === 'ffa' ? MODES.brduo : modeDef1(); };
  const allied1 = allied;
  allied = function (a, b) { return BR.on && BR.duo ? a === b || (!!a && !!b && a.brDuo != null && a.brDuo === b.brDuo) : allied1(a, b); };
  const soundFoe1 = soundFoe;
  soundFoe = function (s, b) { return BR.on && BR.duo ? !allied(s.who, b) : soundFoe1(s, b); };
  const brInicio1 = brInicio;
  brInicio = function () { for (const e of entities) { e.brDuo = null; e.brCaido = false; e.brRevT = 0; } brInicio1(); if (BR.duo) brDuplasMontar(); };
  const brLimpa1 = brLimpa;
  brLimpa = function () { brLimpa1(); for (const m of BR.aneis || []) scene.remove(m); BR.aneis = []; brAvisoDupla(''); for (const e of entities) { e.brCaido = false; e.brDuo = null; } };
  const brUpdate1 = brUpdate;
  brUpdate = function (dt) { brUpdate1(dt); if (BR.on && BR.duo && MATCH.state === 'playing') brDuplaUpdate(dt); };
  // largadas: 6 lugares espalhados, a dupla junta (o segundo 3 m ao lado do primeiro, onde tiver céu aberto)
  const brSlots1 = brSlots;
  brSlots = function (rnd) {
    const S = brSlots1(rnd); if (!BR.duo || S.length < 2) return S;
    const base = S.slice(0, Math.ceil(BR_MAX / 2)), out = [];
    const aberto = (x, z) => { const y = gy0(x, z); return Math.abs(groundHeight(x, z, y + BR_QUEDA.alto, 0.35) - y) < 0.6; };
    for (const [x, z] of base) {
      out.push([x, z]);
      const lado = [[3, 0], [-3, 0], [0, 3], [0, -3]].find(([dx, dz]) => aberto(x + dx, z + dz)) || [1.5, 0];
      out.push([x + lado[0], z + lado[1]]);
    }
    return out;
  };
  // tiro que mataria alguém desta máquina com o parceiro de pé: ele cai em vez de morrer
  const killEnt1 = killEnt;
  killEnt = function (v, a, weapon, head, dir, life) {
    if (BR.on && BR.duo && v.alive && !v.brCaido && brLocal(v) && weapon !== NET_WSPECIAL.fall && (MATCH.state === 'playing' || MATCH.state === 'paused') && !MATCH.fin && brDePe(brParceiro(v))) { brCair(v, a, weapon); return; }
    if (BR.on && BR.duo) { v.brCaido = false; v.brRevT = 0; }
    return killEnt1(v, a, weapon, head, dir, life);
  };
  // caído: o jogador não atira, não mira e fica agachado; o robô fica parado, agachado, sem pensar
  // (2026-11-27, o Thiago: "faz não ser possível atirar enquanto você cai de paraquedas") na queda também: sem tiro, mira nem grenada
  const updatePlayer1 = updatePlayer;
  updatePlayer = function (dt, now) {
    const e = PL.ent, caido = BR.on && BR.duo && e.alive && e.brCaido, queda = BR.on && e.alive && e.brQueda;
    if (caido || queda) { PL.held = false; PL.queued = false; PL.runShot = false; PL.adsWant = false; VM.lowerTarget = 1; if (caido) PL.crouchToggle = true; }
    const r = updatePlayer1(dt, now);
    if (queda && !e.brQueda) VM.lowerTarget = 0; // pousou: a arma sobe
    return r;
  };
  const cookNade1 = cookNade;
  cookNade = function () { if (BR.on && PL.ent.alive && (PL.ent.brQueda || PL.ent.brCaido)) return; return cookNade1.apply(this, arguments); };
  const updateBot1 = updateBot;
  updateBot = function (b, dt, now) {
    if (BR.on && b.alive && b.brQueda && !playHold()) { // caindo de paraquedas: sem pensar nem atirar, só cai (a queda está no ringCheck)
      const I = b.input; I.mx = 0; I.mz = 0; I.sprint = false; I.jump = false; I.fire = false; I.firePressed = false; I.ads = false;
      ctlMove(b, dt); animSoldier(b, dt); if (voidCheck(b) || ringCheck(b, dt)) return; return;
    }
    if (BR.on && BR.duo && b.alive && b.brCaido) {
      const I = b.input; I.mx = 0; I.mz = 0; I.sprint = false; I.jump = false; I.fire = false; I.firePressed = false; I.ads = false; I.crouch = true; b.wantCrouch = true;
      ctlMove(b, dt); animSoldier(b, dt); if (voidCheck(b) || ringCheck(b, dt)) return; return;
    }
    return updateBot1(b, dt, now);
  };
  // os eventos da dupla que chegam pela rede
  const netEventIn1 = netEventIn;
  netEventIn = function (e, ev) {
    if (ev && ev.k === 'brc') { if (BR.on && BR.duo && e) { e.brCaido = !!ev.c; if (!ev.c) e.brRevT = 0; } return; }
    if (ev && ev.k === 'brv') { if (BR.on && BR.duo) { const t = netLocal(ev.to); if (t && t.brCaido && brParceiro(t) === e) brLevantar(t); } return; }
    return netEventIn1(e, ev);
  };
  // fim, placar e o que se lê no placar: por dupla
  const ffaAcabou1 = ffaAcabou;
  ffaAcabou = function () {
    if (!(BR.on && BR.duo)) return ffaAcabou1();
    const L = ffaList(), duplas = new Set(L.map(brDupla)), vivas = new Set(L.filter((e) => !e.brOut).map(brDupla));
    return duplas.size >= 2 && vivas.size <= 1;
  };
  const brCmp1 = brCmp;
  const saidaDupla = (e) => { const p = brParceiro(e); return !e.brOut || (p && !p.brOut) ? 1e9 : Math.max(e.brOut, p ? p.brOut : 0); };
  brCmp = function (a, b) { return BR.on && BR.duo ? saidaDupla(b) - saidaDupla(a) || brCmp1(a, b) : brCmp1(a, b); };
  const brLinha1 = brLinha;
  brLinha = function () {
    if (!(BR.on && BR.duo)) return brLinha1();
    const n = new Set(brVivos().map(brDupla)).size, t = brLinha1().replace(/^\d+ vivos/, '');
    return `${n} ${n === 1 ? 'dupla viva' : 'duplas vivas'}${t}`;
  };
  // morto: segue o parceiro primeiro; o lugar é o da dupla, e só conta quando os dois saem
  const brEspectar1 = brEspectar;
  brEspectar = function (dt) {
    const p = BR.on && BR.duo ? brParceiro(PL.ent) : null, vivo = !!p && p.alive && !p.brOut;
    if (BR.on && BR.duo) { if (vivo) BR.ver = p; else BR.lugar = new Set(brVivos().map(brDupla)).size + 1; }
    brEspectar1(dt);
    if (vivo && BR.aviso) BR.aviso.textContent = 'Seu parceiro continua · assistindo ' + p.name;
  };
  const brDeathTxt1 = brDeathTxt;
  brDeathTxt = function () {
    const p = BR.on && BR.duo ? brParceiro(PL.ent) : null;
    if (p && p.alive && !p.brOut && PL.ent.brOut) { const s = $('death').querySelector('.skip'); if (s) hudHtml(s, esc('Seu parceiro continua: a câmera segue ele')); return; }
    return brDeathTxt1();
  };
  const matchOutcome1 = matchOutcome;
  matchOutcome = function () {
    const o = matchOutcome1();
    if (!(BR.on && BR.duo) || MATCH.mode !== 'ffa') return o;
    const top = ffaList().sort(ffaCmp)[0], win = !!top && brDupla(top) === brDupla(PL.ent), p = brParceiro(PL.ent);
    return Object.assign(o, { result: win ? 'win' : 'loss', sub: win ? 'Sua dupla venceu' + (p ? ' com ' + p.name : '') : `A dupla de ${top ? top.name : '?'} venceu` });
  };
}
