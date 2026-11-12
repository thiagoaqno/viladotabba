"use strict";
// O autódromo vivo: tudo o que se mexe na Vila, e o laço de desenho (frame).
// - os carros de F1 dando volta (freiam nas curvas, trocam de faixa para passar e desviam do F1 de quem joga);
// - o F1 da Galera: quem para na frente de um carro parado (VAGAS_F1) pilota pelo mapa, com volta cronometrada;
// - a turma: torcedores passeando, mecânicos, fiscais com bandeira, fotógrafos no pódio, os líderes na porta dos boxes.
//   Eles cumprimentam quem chega perto, pulam para longe do carro e falam quando o mouse passa por cima;
// - a torcida das arquibancadas, que levanta quando um carro passa, com o mouse por cima e na ola;
// - pombos que voam, o helicóptero da TV, o dirigível, a roda-gigante, as bandeiras, o confete e o champanhe do pódio,
//   a rodovia, a fumaça dos food trucks, o painel de LED e a sombra das nuvens.
// Só o F1 de quem joga vai para o servidor (vila.js repassa a posição); o resto é enfeite de cada navegador.
const reduzVida = matchMedia("(prefers-reduced-motion: reduce)");
const rndV = (() => { let s = 12345; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
const naTela = (X, Y, m = 40) => X > camX - m && X < camX + viewW + m && Y > camY - m && Y < camY + viewH + m;

// ---------- o mouse ----------
const rato = { x: -1e6, y: -1e6, lugar: null }; // em pixels do mapa
cv.addEventListener("pointermove", (e) => { if (e.pointerType === "touch") return; rato.x = (e.clientX * dpr) / scale + camX; rato.y = (e.clientY * dpr) / scale + camY; });
cv.addEventListener("pointerleave", () => { rato.x = rato.y = -1e6; });
const pertoDoRato = (X, Y, r) => Math.abs(rato.x - X) < r && Math.abs(rato.y - Y) < r;

// ---------- as partículas (confete, faísca, poeira, champanhe, fumaça de pneu) ----------
const PART = [];
function solta(x, y, vx, vy, cor, vida, g = 0, tam = 2) { if (PART.length < 500 && !reduzVida.matches) PART.push({ x, y, vx, vy, cor, vida, t: 0, g, tam }); }
function passoPart(s) { for (let i = PART.length - 1; i >= 0; i--) { const p = PART[i]; p.t += s; if (p.t >= p.vida) { PART[i] = PART[PART.length - 1]; PART.pop(); continue; } p.vy += p.g * s; p.x += p.vx * s; p.y += p.vy * s; } }
function drawPart(c) { for (const p of PART) { c.globalAlpha = Math.min(1, (1 - p.t / p.vida) * 2); px(c, p.cor, Math.round(p.x), Math.round(p.y), p.tam, p.tam); } c.globalAlpha = 1; }
const CONFETE = ["#e10600", "#ffd23f", "#f4f4f0", "#1e5bc6", "#2ee06a", "#ff5fa2"];

// ---------- os carros da pista ----------
const FAIXAS_CARRO = [-1.25, 0, 1.25];
const CARROS = EQUIPES_F1.map((cores, i) => ({ spr: spriteCarro(cores), nome: cores[3], s: (PISTA.total - i * 9 + PISTA.total) % PISTA.total, v: 8, vmax: 12 + rndV() * 3, faixa: FAIXAS_CARRO[i % 3], alvo: FAIXAS_CARRO[i % 3], X: 0, Y: 0, a: 0 }));
const frente = (a, b) => { const d = b.s - a.s; return d < 0 ? d + PISTA.total : d; }; // quanto b está à frente de a
function passoCarros(s) {
  // o F1 de quem joga entra na conta como mais um carro, para os outros desviarem dele
  let todos = CARROS;
  if (player.car) { const [k, d] = pertoDaPista(meu.x, meu.y); if (d < 3.4) { const a = PISTA.ang[k], p = PISTA.pts[k]; todos = [...CARROS, { s: k * DS, faixa: -(meu.x - p[0]) * Math.sin(a) + (meu.y - p[1]) * Math.cos(a), v: Math.max(0, meu.v * Math.cos(meu.a - a)), eu: true }]; } }
  for (const car of CARROS) {
    const i = Math.floor(car.s / DS) % PISTA.N, vAlvo = car.vmax * PISTA.ritmo[i];
    car.v += Math.max(-14 * s, Math.min(5 * s, vAlvo - car.v));
    for (const o of todos) { // alguém logo à frente na mesma faixa: passa por outra faixa livre ou espera atrás
      if (o === car) continue;
      if (frente(car, o) < 2.4 && Math.abs(o.faixa - car.faixa) < 0.9) car.v = Math.min(car.v, o.v); // ainda trocando de faixa: não encosta
      if (frente(car, o) > 3.6 || Math.abs(o.faixa - car.alvo) > 0.9) continue;
      const livre = FAIXAS_CARRO.find((f) => Math.abs(f - o.faixa) > 1 && !todos.some((q) => q !== car && Math.abs(q.faixa - f) < 0.9 && (frente(car, q) < 3.6 || frente(q, car) < 2.4)));
      if (livre != null && o.v < car.v + 0.5) car.alvo = livre; else car.v = Math.min(car.v, o.v);
    }
    car.faixa += Math.max(-1.6 * s, Math.min(1.6 * s, car.alvo - car.faixa));
    car.s = ((car.s + car.v * s) % PISTA.total + PISTA.total) % PISTA.total;
    const f = car.s / DS, k = Math.floor(f) % PISTA.N, j = (k + 1) % PISTA.N, u = f - Math.floor(f), [x0, y0] = PISTA.pts[k], [x1, y1] = PISTA.pts[j];
    let a = PISTA.ang[k], b = PISTA.ang[j]; if (b - a > Math.PI) b -= 2 * Math.PI; else if (a - b > Math.PI) b += 2 * Math.PI; a += (b - a) * u;
    car.a = a; car.X = (x0 + (x1 - x0) * u - Math.sin(a) * car.faixa) * TS; car.Y = (y0 + (y1 - y0) * u + Math.cos(a) * car.faixa) * TS;
  }
}
function carimbo(c, spr, X, Y, a) {
  c.save(); c.translate(Math.round(X) + 2, Math.round(Y) + 3); c.rotate(a); c.fillStyle = "#00000044"; c.fillRect(-17, -7, 34, 14); c.restore();
  c.save(); c.translate(Math.round(X), Math.round(Y)); c.rotate(a); c.drawImage(spr, -18, -8); c.restore();
}
function drawCarros(c) {
  for (const car of CARROS) if (naTela(car.X, car.Y)) carimbo(c, car.spr, car.X, car.Y, car.a);
  for (const o of others.values()) if (o.car && o.cx != null && naTela(o.cx * TS, o.cy * TS)) carimbo(c, SPR_GALERA, o.cx * TS, o.cy * TS, o.ca);
  if (player.car) carimbo(c, SPR_GALERA, meu.x * TS, meu.y * TS, meu.a);
}

// ---------- o F1 de quem joga ----------
const meu = { x: 0, y: 0, a: 0, v: 0, vaga: -1, t0: 0, meio: false, ultima: 0, melhor: +store.get("vila_volta") || 0, enviado: 0, olhar: [0, 0] };
const MARCAS = []; // as marcas de pneu no chão: [x, y] em pixels
const VAGA_LUGAR = VAGAS_F1.map((_, i) => ({ tipo: "carro", vaga: i, icon: "🏎️", name: "F1 da Galera", verbo: "pilotar", botao: "Pilotar",
  desc: "Assuma o volante e ande pelo autódromo. Para a pista, entre pelo pit lane (ou pelo portão de serviço dos hangares). As setas aceleram, freiam e viram; Espaço desce do carro." }));
const vagaEm = (x, y) => { const i = VAGAS_F1.findIndex(([vx, vy]) => y === vy + 1 && (x === vx || x === vx + 1)); return i < 0 ? null : VAGA_LUGAR[i]; };
function entrarNoCarro(i) {
  const [vx, vy] = VAGAS_F1[i];
  Object.assign(meu, { x: vx + 1, y: vy + 0.5, a: 0, v: 0, vaga: i, t0: 0, meio: false });
  solid[vy][vx] = solid[vy][vx + 1] = false; vagaOcupada = i; pedacos.clear();
  player.car = true; player.moving = false; path = null; setHere(null); resize();
  document.body.classList.add("no-carro");
  toast("🏎️ Setas: acelerar, frear e virar · Espaço: descer do carro");
}
function sairDoCarro() {
  if (Math.abs(meu.v) > 2.5) return toast("Pare o carro para descer.");
  const [vx, vy] = VAGAS_F1[meu.vaga]; solid[vy][vx] = solid[vy][vx + 1] = true; // o carro volta para a vaga dele
  const bx = Math.floor(meu.x), by = Math.floor(meu.y); let melhor = null, md = 1e9;
  for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (walkable(bx + dx, by + dy) && ground[by + dy][bx + dx] !== "n") { const d = dx * dx + dy * dy; if (d < md) { md = d; melhor = [bx + dx, by + dy]; } }
  if (!melhor) { solid[vy][vx] = solid[vy][vx + 1] = false; return toast("Aqui não dá para descer: pare no pit lane, no paddock ou numa área livre."); }
  [player.x, player.y] = melhor; player.fx = player.x; player.fy = player.y; player.dir = "down"; player.car = false; player.moving = false;
  meu.vaga = -1; meu.v = 0; vagaOcupada = -1; pedacos.clear(); resize();
  document.body.classList.remove("no-carro");
  sendPos(); setHere(lugarEm(player.x, player.y));
}
function passoMeuCarro(s, agora) {
  const ac = held.includes("up"), fr = held.includes("down"), vira = (held.includes("right") ? 1 : 0) - (held.includes("left") ? 1 : 0);
  const [k, dP] = pertoDaPista(meu.x, meu.y), chao = ground[Math.floor(meu.y)]?.[Math.floor(meu.x)];
  const liso = dP <= ASFALTO + ZEBRA || "qkaer".includes(chao), vmax = liso ? 17 : chao === "c" || chao === "m" ? 9 : 6;
  if (ac) meu.v += (meu.v < 0 ? 26 : 13 * (1 - Math.max(0, meu.v) / (vmax + 4))) * s;
  else if (fr) meu.v -= (meu.v > 0 ? 28 : 7) * s;
  else meu.v -= Math.sign(meu.v) * Math.min(Math.abs(meu.v), 4 * s);
  if (meu.v > vmax) meu.v = Math.max(vmax, meu.v - 22 * s);
  meu.v = Math.max(-4, meu.v);
  meu.a += vira * 2.9 * s * Math.min(1, Math.abs(meu.v) / 3.5) * Math.sign(meu.v || 1);
  const co = Math.cos(meu.a), si = Math.sin(meu.a), cabe = (X, Y) => carroPassa(X, Y) && carroPassa(X + co * 0.9, Y + si * 0.9) && carroPassa(X - co * 0.7, Y - si * 0.7);
  const nx = meu.x + co * meu.v * s, ny = meu.y + si * meu.v * s, x0 = meu.x;
  if (cabe(nx, ny)) { meu.x = nx; meu.y = ny; }
  else { // raspou: escorrega pelo muro soltando faísca, ou bate e volta
    const batida = Math.abs(meu.v);
    if (cabe(nx, meu.y)) { meu.x = nx; meu.v *= 1 - 2.5 * s; } else if (cabe(meu.x, ny)) { meu.y = ny; meu.v *= 1 - 2.5 * s; } else meu.v *= -0.3;
    if (batida > 3) for (let i = 0; i < 3; i++) solta((meu.x + co * 0.9) * TS, (meu.y + si * 0.9) * TS, (rndV() - 0.5) * 80, (rndV() - 0.5) * 80, i ? "#ffd23f" : "#ffffff", 0.3, 0, 1);
  }
  // as marcas de pneu nas curvas fortes e a poeira fora do asfalto
  if (Math.abs(meu.v) > 9 && (vira || (fr && meu.v > 0)) && liso) { MARCAS.push([(meu.x - co * 0.8) * TS, (meu.y - si * 0.8) * TS]); if (MARCAS.length > 420) MARCAS.splice(0, 60); if (rndV() < 0.3) solta((meu.x - co) * TS, (meu.y - si) * TS, -co * 10, -si * 10 - 6, "#d6dade", 0.5, 0, 3); }
  if (!liso && Math.abs(meu.v) > 2 && rndV() < 0.5) solta((meu.x - co) * TS, (meu.y - si) * TS, (rndV() - 0.5) * 20, -8, chao === "c" ? "#e9ecf0" : "#cdb27a", 0.5, 0, 2);
  // encostou num carro da pista
  for (const car of CARROS) if (Math.abs(car.X - meu.x * TS) < 20 && Math.abs(car.Y - meu.y * TS) < 14 && Math.abs(meu.v - car.v) > 2) { meu.v += (car.v - meu.v) * 0.5; for (let i = 0; i < 6; i++) solta((car.X + meu.x * TS) / 2, (car.Y + meu.y * TS) / 2, (rndV() - 0.5) * 90, (rndV() - 0.5) * 90, "#ffd23f", 0.3, 0, 1); }
  // a volta: começa e termina na linha de chegada, e só vale passando pela reta oposta
  const f = k / PISTA.N; if (dP < LIMITE_CARRO && f > 0.42 && f < 0.6) meu.meio = true;
  const L = LARGADA + OX + 0.4;
  if (x0 < L && meu.x >= L && Math.abs(meu.y - (RETA_Y + OY)) < LIMITE_CARRO) {
    if (meu.t0 && meu.meio) {
      meu.ultima = (agora - meu.t0) / 1000; const recorde = !meu.melhor || meu.ultima < meu.melhor;
      if (recorde) { meu.melhor = meu.ultima; store.set("vila_volta", meu.melhor); }
      toast(`🏁 Volta em ${tempoVolta(meu.ultima)}${recorde ? " · a sua melhor!" : ""}`);
      for (let i = 0; i < 40; i++) solta(meu.x * TS + (rndV() - 0.5) * 60, meu.y * TS - 20, (rndV() - 0.5) * 60, -30 - rndV() * 40, CONFETE[i % 6], 1.4, 90);
    }
    meu.t0 = agora; meu.meio = false;
  }
  // o boneco "anda" junto: a casa dele é a do carro (para o minimapa, a câmera e o servidor)
  player.x = Math.floor(meu.x); player.y = Math.floor(meu.y); player.fx = meu.x - 0.5; player.fy = meu.y - 0.5;
  const q = ((Math.round(meu.a / (Math.PI / 2)) % 4) + 4) % 4; player.dir = ["right", "down", "left", "up"][q];
  if (agora - meu.enviado > 90 && myName) { meu.enviado = agora; socket.emit("move", { x: player.x, y: player.y, dir: player.dir, car: true, cx: +meu.x.toFixed(2), cy: +meu.y.toFixed(2), ca: +meu.a.toFixed(2) }); }
}
// o carro dos outros: a posição fina chega junto do "move" e é alisada aqui
socket.on("move", (d) => { const o = others.get(d.id); if (!o) return; if (d.car && d.cx != null) { o.alvo = [d.cx, d.cy, d.ca || 0]; if (o.cx == null) [o.cx, o.cy, o.ca] = o.alvo; } else o.alvo = null; });
function passoCarrosDosOutros(s) {
  for (const o of others.values()) {
    if (!o.car || !o.alvo) { o.cx = null; continue; }
    const k = Math.min(1, s * 10); o.cx += (o.alvo[0] - o.cx) * k; o.cy += (o.alvo[1] - o.cy) * k;
    let d = o.alvo[2] - o.ca; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; o.ca += d * k;
    o.fx = o.cx - 0.5; o.fy = o.cy - 0.5;
  }
}
// o painel do carro, em cima da tela: o tempo da volta, a última, a melhor e a barra de velocidade
function drawPainelCarro(c, agora) {
  const u = dpr, W = 250 * u, X = Math.round(cv.width / 2 - W / 2), Y = Math.round((innerWidth <= 560 ? 62 : 70) * u), H = 40 * u;
  c.fillStyle = "#0d0f12e0"; c.fillRect(X, Y, W, H); c.fillStyle = "#e10600"; c.fillRect(X, Y, W, 3 * u);
  c.textBaseline = "middle"; c.textAlign = "left"; c.font = FONTE_PLACA(800, 13 * u); c.fillStyle = "#ffffff";
  c.fillText(meu.t0 ? "VOLTA " + tempoVolta((agora - meu.t0) / 1000, 1) : "CRUZE A LINHA DE CHEGADA", X + 10 * u, Y + 15 * u);
  c.font = FONTE_PLACA(700, 10 * u); c.fillStyle = "#c3ccd8";
  c.fillText((meu.ultima ? "ÚLTIMA " + tempoVolta(meu.ultima) + "   " : "") + (meu.melhor ? "MELHOR " + tempoVolta(meu.melhor) : "sem volta ainda"), X + 10 * u, Y + 30 * u);
  const bx = X + W - 78 * u, bw = 68 * u, v = Math.min(1, Math.abs(meu.v) / 17);
  c.fillStyle = "#2b2f36"; c.fillRect(bx, Y + 11 * u, bw, 8 * u);
  c.fillStyle = v > 0.85 ? "#e10600" : v > 0.5 ? "#ffd23f" : "#2ee06a"; c.fillRect(bx, Y + 11 * u, bw * v, 8 * u);
  for (let i = 1; i < 8; i++) { c.fillStyle = "#0d0f12"; c.fillRect(bx + (bw * i) / 8, Y + 11 * u, u, 8 * u); }
}

// ---------- a turma ----------
const roupa = (k, cap, shirt, pants, hair = "#2a1a10") => ({ k, cap, shirt, pants, hair });
const ROUPAS_FA = CAMISAS.map((cor, i) => roupa("fa" + i, CAMISAS[(i * 3 + 1) % CAMISAS.length], cor, ["#2b3350", "#3a3a48", "#1d1d2b", "#5a4632"][i % 4], ["#3b2414", "#1b1b1b", "#8a4b22", "#e3b04b", "#b8322a"][i % 5]));
const ROUPA_FISCAL = roupa("fiscal", "#f4f4f0", "#ff7b2e", "#ff7b2e"), ROUPA_FOTO = roupa("foto", "#1b1f24", "#3a3f4a", "#1b1f24", "#3b2414");
const FALAS = {
  fa: ["Vai, Galera!", "Cadê o truco?", "Que corrida!", "Bora pra pista!", "Olha o F1!", "Hoje tem pódio!", "Partiu Fan Zone", "Quem fez a pole?", "Só no pastel", "Tô na torcida!"],
  mecanico: ["Pit stop em 2 s!", "Pneu macio!", "Box, box!", "Asa ajustada.", "Tá voando!", "Cuidado no pit!"],
  fiscal: ["Bandeira verde!", "Pista livre!", "Devagar no pit!"],
  foto: ["Olha o flash!", "Sorria!", "Xis!"],
  dono: ["Me desafia!", "Tô te esperando.", "Entra no box!"],
};
const OI = ["Oi!", "E aí!", "Fala!", "Opa!", "Salve!"], SUSTO = ["Eita!", "Opa!!", "Ui!", "Cuidado!", "Uou!"];
const andante = (x, y, tipo, look, extra) => Object.assign({ x, y, fx: x, fy: y, from: [x, y], t: 0, moving: false, steps: 0, dir: "down", look, tipo, espera: rndV() * 5, alvo: null, tent: 0, fala: "", falaAte: 0, pulo: 0, oi: 0 }, extra);
const livreNPC = (x, y) => walkable(x, y) && "cae".includes(ground[y][x]);
const TURMA = [];
{ // os torcedores: espalhados pelo piso livre da Fan Zone, do paddock, da esplanada e dos hangares
  const casas = []; for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (livreNPC(x, y) && ground[y][x] !== "e") casas.push([x, y]);
  for (let i = 0; i < 110; i++) { const [x, y] = casas[Math.floor(rndV() * casas.length)]; TURMA.push(andante(x, y, "fa", ROUPAS_FA[i % ROUPAS_FA.length])); }
}
// os mecânicos, na faixa de trabalho em frente a cada box, com o macacão da equipe
GAMES.filter((g) => g.estilo === "box").forEach((g, i) => { for (const dx of [-2, 2]) TURMA.push(andante(g.doors[0] + dx, g.doorY + 1, "mecanico", roupa("mec" + i, g.roof, g.roof, escurece(g.roof, 0.6)), { fixo: true, dir: dx < 0 ? "right" : "left" })); });
// os líderes e os treinadores, ao lado da porta do próprio box
GAMES.filter((g) => g.lider).forEach((g, i) => TURMA.push(andante(g.doors[0] - 1, g.doorY + 1, "dono", g.lider.look ?? (i % 6), { fixo: true, olha: i * 1.3 })));
// os fotógrafos, em duas fileiras de frente para o pódio
for (let r = 0; r < 2; r++) for (let x = PODIO.x; x < PODIO.x + PODIO.w; x++) if (hash(x, r, 3) % 4) TURMA.push(andante(x, PODIO.y + PODIO.h + 2 + r, "foto", (x + r) % 3 ? ROUPA_FOTO : ROUPAS_FA[(x * 3) % 10], { fixo: true, dir: "up", flash: 0 }));
// os fiscais de pista, do lado de fora das curvas, com a bandeira
for (let i = 0; i < 14; i++) {
  const k = Math.floor((i + 0.5) * PISTA.N / 14), a = PISTA.ang[k], [x, y] = PISTA.pts[k];
  for (const lado of [1, -1]) { const fx = Math.round(x - Math.sin(a) * 5.3 * lado - 0.5), fy = Math.round(y + Math.cos(a) * 5.3 * lado - 0.5); if (walkable(fx, fy) && "gc".includes(ground[fy][fx])) { TURMA.push(andante(fx, fy, "fiscal", ROUPA_FISCAL, { fixo: true, dir: "down", bandeira: 0 })); break; } }
}
function passoTurma(s, agora) {
  const px0 = player.fx, py0 = player.fy, carro = player.car && Math.abs(meu.v) > 3;
  for (const p of TURMA) {
    if (p.pulo > 0) p.pulo = Math.max(0, p.pulo - s * 3);
    if (p.moving) { p.t += s * (p.corre ? 8 : 3.2); if (p.t >= 1) { p.t = 1; p.moving = false; p.steps++; p.corre = false; } }
    const dx = px0 - p.fx, dy = py0 - p.fy, d = Math.abs(dx) + Math.abs(dy);
    if (d < 9) { // quem joga está por perto: o susto com o carro, ou o cumprimento
      if (carro && d < 2.6 && !p.pulo) {
        p.pulo = 1; p.fala = SUSTO[Math.floor(rndV() * SUSTO.length)]; p.falaAte = agora + 1100;
        const fx = p.x - Math.sign(dx || 1), fy = p.y - Math.sign(dy || 1);
        if (!p.fixo && !p.moving) for (const [nx, ny] of Math.abs(dx) > Math.abs(dy) ? [[p.x, fy], [fx, p.y]] : [[fx, p.y], [p.x, fy]]) if (livreNPC(nx, ny)) { p.from = [p.x, p.y]; p.x = nx; p.y = ny; p.moving = true; p.t = 0; p.corre = true; p.alvo = null; break; }
      } else if (!player.car && d < 1.8 && !p.moving && agora - p.oi > 9000) {
        p.oi = agora; p.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
        p.fala = OI[Math.floor(rndV() * OI.length)]; p.falaAte = agora + 1500; p.espera = Math.max(p.espera, 1.6); p.pulo = 0.6;
      }
      if (p.tipo === "foto" && Math.abs(dx) < 7 && rndV() < s * 1.5) p.flash = agora + 90; // de frente para o pódio, os flashes disparam
    }
    if (p.tipo === "foto" && rndV() < s * 0.12) p.flash = agora + 90;
    if (pertoDoRato(p.fx * TS + 8, p.fy * TS + 7, 9) && agora > p.falaAte + 600) { const f = FALAS[p.tipo] || FALAS.fa; p.fala = f[Math.floor(rndV() * f.length)]; p.falaAte = agora + 2200; p.espera = Math.max(p.espera, 2); p.pulo = 0.6; }
    if (!p.moving && !p.fixo) {
      if (p.espera > 0) p.espera -= s;
      else if (!p.alvo || p.tent > 3 || (p.alvo[0] === p.x && p.alvo[1] === p.y)) {
        if (p.alvo && p.tent <= 3) p.espera = 0.5 + rndV() * 5;
        p.alvo = null; p.tent = 0;
        for (let k = 0; k < 6 && !p.alvo; k++) { const tx = p.x + Math.floor(rndV() * 19) - 9, ty = p.y + Math.floor(rndV() * 11) - 5; if (livreNPC(tx, ty)) p.alvo = [tx, ty]; }
      } else {
        const ax = p.alvo[0] - p.x, ay = p.alvo[1] - p.y, passos = Math.abs(ax) >= Math.abs(ay) ? [[Math.sign(ax), 0], [0, Math.sign(ay)]] : [[0, Math.sign(ay)], [Math.sign(ax), 0]];
        const vai = passos.find(([mx, my]) => (mx || my) && livreNPC(p.x + mx, p.y + my));
        if (!vai) { p.tent = 9; } else { p.from = [p.x, p.y]; p.x += vai[0]; p.y += vai[1]; p.moving = true; p.t = 0; p.dir = vai[0] > 0 ? "right" : vai[0] < 0 ? "left" : vai[1] > 0 ? "down" : "up"; }
      }
    }
    if (p.olha != null && !p.fala) p.dir = ["down", "left", "down", "right"][Math.floor(agora / 2200 + p.olha) % 4];
    if (p.bandeira != null) p.bandeira = CARROS.some((c) => Math.abs(c.X - p.x * TS) < 90 && Math.abs(c.Y - p.y * TS) < 90) || (player.car && d < 7) ? agora : p.bandeira;
    p.fx = p.moving ? p.from[0] + (p.x - p.from[0]) * p.t : p.x; p.fy = p.moving ? p.from[1] + (p.y - p.from[1]) * p.t : p.y;
  }
}
function balao(c, cx, y, txt) { // o balãozinho de fala
  c.font = FONTE_PIXEL(6); const w = Math.ceil(c.measureText(txt).width) + 6, x = Math.round(cx - w / 2);
  px(c, TINTA, x - 1, y - 1, w + 2, 11); px(c, "#ffffff", x, y, w, 9); px(c, TINTA, cx - 2, y + 10, 4, 1); px(c, "#ffffff", cx - 1, y + 9, 2, 1); px(c, TINTA, cx - 1, y + 11, 2, 1);
  c.fillStyle = TINTA; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(txt, x + w / 2, y + 5); c.textAlign = "left";
}
function drawExtrasTurma(c, agora) { // por cima dos bonecos: as bandeiras dos fiscais, os flashes e as falas
  for (const p of TURMA) {
    const X = Math.round(p.fx * TS), Y = Math.round(p.fy * TS);
    if (!naTela(X, Y)) continue;
    if (p.bandeira != null) { const agita = agora - p.bandeira < 1500, alto = agita && Math.floor(agora / 140) % 2; px(c, TINTA, X + 13, Y - 4 - alto * 3, 1, 12); px(c, agita ? "#ffd23f" : "#2ee06a", X + 14, Y - 4 - alto * 3, 6, 5); }
    if (p.flash > agora) { px(c, "#ffffff", X + 5, Y - 5, 6, 6); px(c, "#ffffffaa", X + 2, Y - 3, 12, 2); px(c, "#ffffffaa", X + 7, Y - 8, 2, 12); }
    if (p.falaAte > agora) balao(c, X + 8, Y - 14, p.fala);
  }
}

// ---------- os pombos ----------
const POMBOS = [[92, 74], [113, 80], [76, 80], [100, 127], [126, 121], [45, 12], [128, 12], [150, 70], [190, 100], [66, 50]].map(([x, y]) => ({ x: (x + OX) * TS, y: (y + OY) * TS, voo: -1, volta: 0, aves: Array.from({ length: 5 }, () => [rndV() * 26 - 13, rndV() * 16 - 8, rndV() < 0.5 ? -1 : 1, rndV()]) }));
function passoPombos(s, agora) {
  for (const g of POMBOS) {
    if (g.voo >= 0) { g.voo += s; if (g.voo > 2.6) { g.voo = -1; g.volta = agora + 9000; } continue; }
    if (agora < g.volta) continue;
    const longe = (X, Y, r) => Math.abs(X - g.x) > r || Math.abs(Y - g.y) > r;
    if (!longe(player.fx * TS + 8, player.fy * TS + 8, player.car ? 60 : 34) || !longe(rato.x, rato.y, 20)) g.voo = 0;
  }
}
function drawPombos(c, agora) {
  for (const g of POMBOS) {
    if (!naTela(g.x, g.y, 200) || (g.voo < 0 && agora < g.volta)) continue;
    for (const [dx, dy, lado, fase] of g.aves) {
      if (g.voo < 0) { const X = Math.round(g.x + dx), Y = Math.round(g.y + dy), bica = Math.floor(agora / 300 + fase * 9) % 5 === 0 ? 1 : 0; px(c, "#00000030", X, Y + 3, 4, 1); px(c, "#8d949e", X, Y + bica, 4, 3); px(c, "#59606b", X + (lado > 0 ? 3 : -1), Y - 1 + bica * 2, 2, 2); px(c, "#ff7b2e", X + (lado > 0 ? 5 : -2), Y + bica * 2); }
      else { const X = Math.round(g.x + dx + lado * g.voo * (50 + fase * 30)), Y = Math.round(g.y + dy - g.voo * (60 + fase * 25)), bate = Math.floor(agora / 90 + fase * 5) % 2; c.globalAlpha = Math.max(0, 1 - g.voo / 2.6); px(c, "#59606b", X, Y, 3, 2); px(c, "#aab0b9", X - 3, Y - (bate ? 2 : 0), 3, 1); px(c, "#aab0b9", X + 3, Y - (bate ? 2 : 0), 3, 1); c.globalAlpha = 1; }
    }
  }
}

// ---------- a torcida das arquibancadas ----------
// Só quem levanta é desenhado aqui (por cima do desenho fixo): com um carro passando em frente, com o mouse por cima,
// com quem joga por perto e na ola que corre de tempos em tempos.
function drawTorcida(c, t) {
  if (reduzVida.matches) return;
  const jx = player.fx * TS + 8, jy = player.fy * TS + 8;
  for (const tr of TRIBUNAS) {
    if (tr.x > camX + viewW || tr.x + tr.w < camX || tr.y > camY + viewH || tr.y + tr.h < camY) continue;
    const xs = [];
    for (const car of CARROS) if (car.X > tr.x - 30 && car.X < tr.x + tr.w + 30 && Math.abs(car.Y - (tr.y + tr.h / 2)) < 150) xs.push(car.X);
    if (Math.abs(jy - (tr.y + tr.h / 2)) < (player.car ? 150 : 70)) xs.push(jx);
    const ola = ((t / 9) % (tr.w + 900)) - 40, noRato = rato.y > tr.y - 30 && rato.y < tr.y + tr.h + 30, fase = Math.floor(t / 130);
    assentos(tr, (x, y, h, k) => {
      let pula = Math.abs(x - ola) < 12 || (noRato && Math.abs(x - rato.x) < 34) || (h + fase * 7) % 211 === 0;
      for (let i = 0; i < xs.length && !pula; i++) if (Math.abs(x - xs[i]) < 30) pula = true;
      if (pula) pessoinha(c, x, y, h, 1 + ((fase + k) & 1));
      else if ((h * 13 + Math.floor(t / 80)) % 2600 === 0) px(c, "#ffffff", x, y - 1, 3, 3); // um flash de celular
    });
  }
}

// ---------- o helicóptero da TV e o dirigível ----------
const heli = { fase: "pousado", t: 6, alt: 0, x: 0, y: 0, a: 0 };
function passoHeli(s) {
  const [hx, hy] = HELI_POS(); heli.t += s;
  if (heli.fase === "pousado") { heli.x = hx; heli.y = hy; if (heli.t > 38 || (heli.t > 3 && pertoDoRato(hx, hy, 46))) { heli.fase = "subindo"; heli.t = 0; } }
  else if (heli.fase === "subindo") { heli.alt = Math.min(1, heli.t / 2.5); if (heli.alt >= 1) { heli.fase = "voando"; heli.t = 0; } }
  else if (heli.fase === "voando") { // uma volta larga por cima da pista
    const u = heli.t / 46, cx = (OX + 100) * TS, cy = (OY + 68) * TS, k = Math.min(1, heli.t / 4, (46 - heli.t) / 4), ang = u * Math.PI * 2 - 0.5;
    const tx = cx + Math.cos(ang) * 84 * TS, ty = cy + Math.sin(ang) * 44 * TS, nx = hx + (tx - hx) * k, ny = hy + (ty - hy) * k;
    if (Math.hypot(nx - heli.x, ny - heli.y) > 0.2) heli.a = Math.atan2(ny - heli.y, nx - heli.x);
    heli.x = nx; heli.y = ny; if (heli.t >= 46) { heli.fase = "descendo"; heli.t = 0; }
  } else { heli.alt = Math.max(0, 1 - heli.t / 2.5); if (heli.alt <= 0) { heli.fase = "pousado"; heli.t = 0; } }
}
function drawHeliVoando(c, t) {
  const X = Math.round(heli.x), Y = Math.round(heli.y - heli.alt * 26);
  if (!naTela(X, Y, 80)) return;
  c.fillStyle = "#0c1a1238"; c.beginPath(); c.ellipse(heli.x + heli.alt * 10, heli.y + 4 + heli.alt * 14, 16, 7, heli.a, 0, 7); c.fill();
  c.save(); c.translate(X, Y); c.rotate(heli.a);
  px(c, TINTA, -24, -2, 16, 4); px(c, "#e10600", -23, -1, 15, 2); px(c, TINTA, -27, -5, 4, 10); px(c, "#f4f4f0", -26, -4, 2, 8); // a cauda
  px(c, TINTA, -10, -7, 22, 14); px(c, "#f4f4f0", -9, -6, 20, 12); px(c, "#e10600", -9, 1, 20, 5); px(c, "#1b2a3a", 4, -5, 7, 10); px(c, "#6fb3dd", 6, -4, 4, 4);
  px(c, TINTA, -8, -10, 16, 1); px(c, TINTA, -8, 9, 16, 1);
  c.restore();
  const gira = reduzVida.matches ? 0.5 : t / (heli.fase === "pousado" ? 400 : 45);
  c.strokeStyle = "#1b1f24b0"; c.lineWidth = 2;
  for (const d of [0, Math.PI / 2]) { c.beginPath(); c.moveTo(X - Math.cos(gira + d) * 24, Y - Math.sin(gira + d) * 24); c.lineTo(X + Math.cos(gira + d) * 24, Y + Math.sin(gira + d) * 24); c.stroke(); }
  px(c, "#3a3f46", X - 2, Y - 2, 4, 4);
}
const dirigivel = { x: -200, y: (OY + 60) * TS };
function drawDirigivel(c, t, s) {
  dirigivel.x += 9 * s; if (dirigivel.x > MW * TS + 300) { dirigivel.x = -300; dirigivel.y = (OY + 20 + rndV() * 90) * TS; }
  const X = Math.round(dirigivel.x), Y = Math.round(dirigivel.y + Math.sin(t / 1400) * 3);
  if (!naTela(X, Y, 160)) return;
  c.fillStyle = "#0c1a1228"; c.beginPath(); c.ellipse(X + 40, Y + 120, 54, 14, 0, 0, 7); c.fill();
  c.fillStyle = TINTA; c.beginPath(); c.ellipse(X, Y, 61, 21, 0, 0, 7); c.fill();
  c.fillStyle = "#f4f4f0"; c.beginPath(); c.ellipse(X, Y, 60, 20, 0, 0, 7); c.fill();
  c.fillStyle = "#d3d8df"; c.beginPath(); c.ellipse(X, Y + 6, 56, 13, 0, 0, Math.PI); c.fill();
  c.fillStyle = "#e10600"; c.beginPath(); c.ellipse(X, Y, 60, 20, 0, -0.5, 0.5); c.fill(); px(c, "#e10600", X - 58, Y - 3, 116, 6);
  px(c, TINTA, X - 66, Y - 14, 10, 28); px(c, "#e10600", X - 65, Y - 13, 8, 26); px(c, TINTA, X - 12, Y + 19, 24, 8); px(c, "#59606b", X - 11, Y + 20, 22, 6); px(c, "#9bd0ee", X - 8, Y + 21, 16, 2);
  letreiro(c, "VILA DA GALERA", X - 4, Y - 9, 96, 10, "#1b1f24");
}

// ---------- a rodovia ----------
const TRANSITO = Array.from({ length: 14 }, (_, i) => { const ida = i % 2 === 0; return { x: rndV() * MW * TS, y: (RODOVIA.y0 + OY + (ida ? 0.75 : 3.25) + (i % 4 > 1 ? (ida ? 1 : -1) : 0) * 1) * TS, v: (ida ? 1 : -1) * (70 + rndV() * 50), cor: CORES_CARRO[i % CORES_CARRO.length], onibus: i % 7 === 3 }; });
function drawTransito(c, s) {
  for (const k of TRANSITO) {
    if (!reduzVida.matches) k.x += k.v * s; if (k.x > MW * TS + 60) k.x = -60; else if (k.x < -60) k.x = MW * TS + 60;
    if (!naTela(k.x, k.y, 60)) continue;
    const W = k.onibus ? 44 : 24, X = Math.round(k.x - W / 2), Y = Math.round(k.y), d = k.v > 0 ? 1 : 0;
    px(c, "#00000040", X + 2, Y + 3, W, 11); px(c, TINTA, X, Y, W, 12); px(c, k.onibus ? "#f4f4f0" : k.cor, X + 1, Y + 1, W - 2, 10); px(c, claro(k.cor, 0.35), X + 1, Y + 1, W - 2, 2);
    if (k.onibus) { px(c, k.cor, X + 1, Y + 7, W - 2, 3); for (let x = X + 4; x < X + W - 6; x += 7) px(c, "#1b2a3a", x, Y + 2, 5, 4); }
    else { px(c, "#1b2a3a", X + (d ? 13 : 5), Y + 2, 6, 8); px(c, "#6fb3dd", X + (d ? 17 : 5), Y + 2, 2, 8); px(c, "#1b2a3a", X + (d ? 4 : 16), Y + 2, 4, 8); }
    px(c, "#fff3c4", X + (d ? W - 2 : 1), Y + 1, 1, 2); px(c, "#fff3c4", X + (d ? W - 2 : 1), Y + 9, 1, 2); px(c, "#e10600", X + (d ? 1 : W - 2), Y + 1, 1, 2); px(c, "#e10600", X + (d ? 1 : W - 2), Y + 9, 1, 2);
  }
}

// ---------- por cima dos carros: as passarelas e o pórtico da largada ----------
function drawSobrePista(c, t) {
  for (const p of PONTES) {
    const X = p.x * TS, Y = p.y * TS, W = p.w * TS, H = p.h * TS;
    if (X > camX + viewW + 20 || X + W < camX - 20 || Y > camY + viewH + 20 || Y + H < camY - 20) continue;
    if (p.deitada) {
      px(c, "#00000038", X, Y + H, W, 6); px(c, TINTA, X - 1, Y - 1, W + 2, H + 2);
      px(c, "#d3d8df", X, Y, W, H); for (let xx = X + 3; xx < X + W; xx += 6) px(c, "#bfc5cd", xx, Y + 3, 1, H - 6);
      px(c, "#8a919b", X, Y, W, 3); px(c, "#8a919b", X, Y + H - 3, W, 3); for (let xx = X; xx < X + W; xx += 12) { px(c, TINTA, xx, Y - 3, 2, 6); px(c, TINTA, xx, Y + H - 3, 2, 5); }
      px(c, "#e10600", X + W / 2 - 30, Y + H - 3, 60, 3);
    } else {
      px(c, "#00000038", X + W, Y + 4, 7, H); px(c, TINTA, X - 1, Y - 1, W + 2, H + 2);
      px(c, "#d3d8df", X, Y, W, H); for (let yy = Y + 3; yy < Y + H; yy += 6) px(c, "#bfc5cd", X + 3, yy, W - 6, 1);
      px(c, "#8a919b", X, Y, 3, H); px(c, "#8a919b", X + W - 3, Y, 3, H); for (let yy = Y; yy < Y + H; yy += 12) { px(c, TINTA, X - 1, yy, 5, 2); px(c, TINTA, X + W - 4, yy, 5, 2); }
      const meio = Y + H / 2 - 7; px(c, TINTA, X - 3, meio - 1, W + 6, 16); px(c, "#e10600", X - 2, meio, W + 4, 14); letreiro(c, "VILA GP", X + W / 2, meio + 7.5, W, 9, "#ffffff");
    }
  }
  // o pórtico: as duas colunas, a viga por cima da reta e as cinco luzes vermelhas que acendem uma a uma e apagam
  const LX = (LARGADA + OX) * TS + 14, y0 = (RETA_Y + OY - MURO) * TS, y1 = (RETA_Y + OY + MURO) * TS;
  if (LX > camX - 30 && LX < camX + viewW + 30 && y1 > camY && y0 < camY + viewH) {
    px(c, "#00000038", LX + 8, y0 + 4, 6, y1 - y0);
    caixa(c, LX - 3, y0 - 6, 14, 10, "#59606b", 2); caixa(c, LX - 3, y1 - 4, 14, 10, "#59606b", 2);
    px(c, TINTA, LX - 1, y0, 10, y1 - y0); px(c, "#23262e", LX, y0, 8, y1 - y0); px(c, "#e10600", LX, y0, 2, y1 - y0);
    const fase = reduzVida.matches ? 0 : (t / 1000) % 9, acesas = fase < 5 ? Math.floor(fase) + 1 : fase < 6 ? 5 : 0;
    for (let k = 0; k < 5; k++) { const ly = (y0 + y1) / 2 - 24 + k * 10; px(c, "#0d0f12", LX + 2, ly - 1, 6, 8); px(c, k < acesas ? "#ff2a1a" : "#3a1512", LX + 3, ly, 4, 6); if (k < acesas) px(c, "#ff8a7a", LX + 3, ly, 2, 2); }
  }
}
// a roda-gigante da Fan Zone: gira mais rápido com o mouse em cima
const roda = { a: 0 };
function drawRoda(c, s) {
  const cx = (RODA.x + RODA.w / 2) * TS, base = (RODA.y + RODA.h) * TS - 10, R = 62, cy = base - R - 8;
  if (!reduzVida.matches) roda.a += s * (pertoDoRato(cx, cy, R + 8) ? 0.9 : 0.12);
  if (cx + R < camX || cx - R > camX + viewW || base < camY || cy - R - 10 > camY + viewH) return;
  c.strokeStyle = TINTA; c.lineWidth = 5; c.beginPath(); c.moveTo(cx - 34, base); c.lineTo(cx, cy); c.lineTo(cx + 34, base); c.stroke();
  c.strokeStyle = "#aab0b9"; c.lineWidth = 3; c.stroke();
  c.strokeStyle = "#e9ecf0"; c.lineWidth = 1;
  for (let k = 0; k < 12; k++) { const a = roda.a + (k * Math.PI) / 6; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); c.stroke(); }
  c.strokeStyle = TINTA; c.lineWidth = 4; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.stroke();
  c.strokeStyle = "#f4f4f0"; c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.stroke();
  c.strokeStyle = "#e10600"; c.lineWidth = 1; c.beginPath(); c.arc(cx, cy, R - 6, 0, 7); c.stroke();
  for (let k = 0; k < 12; k++) {
    const a = roda.a + (k * Math.PI) / 6, gx = Math.round(cx + Math.cos(a) * R), gy = Math.round(cy + Math.sin(a) * R), cor = CAMISAS[k % CAMISAS.length];
    px(c, "#5b6169", gx, gy, 1, 3); px(c, TINTA, gx - 5, gy + 2, 11, 10); px(c, cor, gx - 4, gy + 3, 9, 8); px(c, escuro(cor, 0.3), gx - 4, gy + 9, 9, 2); px(c, "#9bd0ee", gx - 3, gy + 4, 7, 3); px(c, PELES[k % 5], gx - 1, gy + 5, 2, 2);
  }
  c.fillStyle = TINTA; c.beginPath(); c.arc(cx, cy, 7, 0, 7); c.fill(); c.fillStyle = "#e10600"; c.beginPath(); c.arc(cx, cy, 5, 0, 7); c.fill(); px(c, "#ffd23f", cx - 1, cy - 1, 3, 3);
}
// as bandeiras tremulando nos mastros
function drawBandeiras(c, t) {
  for (const [x, y, cor] of BANDEIRAS) {
    const X = x * TS + 9, Y = y * TS - 29; if (!naTela(X, Y)) continue;
    for (let k = 0; k < 8; k++) { const dy = reduzVida.matches ? 0 : Math.round(Math.sin(t / 170 + k * 0.8 + x) * (k / 4)); px(c, TINTA, X + k * 2, Y + dy - 1, 2, 11); px(c, k % 4 < 2 ? cor : claro(cor, 0.25), X + k * 2, Y + dy, 2, 9); }
  }
}

// ---------- o pódio da F1 com os amigos ----------
// O palco com o fundo quadriculado, os painéis na cor da equipe dos três primeiros da estante (CAMPEOES_F1), os degraus
// 2-1-3 e os pilotos de macacão com a taça. Chegando perto cai confete, e o primeiro estoura o champanhe.
function drawPodio(c, t) {
  const X = PODIO.x * TS, W = PODIO.w * TS, base = (PODIO.y + PODIO.h) * TS - 2, r = CAMPEOES_F1.d?.ranking || [];
  if (X > camX + viewW + 20 || X + W < camX - 20 || base - 120 > camY + viewH || base + 20 < camY) return;
  const BY = base - 106, BH = 80, piso = base - 26;
  sombra(c, X, piso, W, 26, 5);
  px(c, TINTA, X + 7, BY - 1, W - 14, BH + 2); px(c, "#14161b", X + 8, BY, W - 16, BH);
  for (let j = 0; j < 7; j++) for (let i = 0; i < 15; i++) px(c, (i + j) % 2 ? "#f4f4f0" : "#16161a", X + 36 + i * 8, BY + 24 + j * 8, 8, 8);
  for (const x of [X + 8, X + W - 36]) { px(c, "#1b1f24", x, BY + 24, 28, BH - 24); px(c, "#e10600", x + 4, BY + 44, 20, 8); px(c, "#e10600", x + 8, BY + 56, 12, 4); }
  px(c, TINTA, X + W / 2 - 41, BY + 27, 82, 16); px(c, "#e10600", X + W / 2 - 40, BY + 28, 80, 14); letreiro(c, "PÓDIO DA GALERA", X + W / 2, BY + 35.5, 74, 9, "#ffffff");
  // o palco e a grade da frente
  px(c, TINTA, X - 1, piso - 1, W + 2, 28); px(c, "#3a3f4a", X, piso, W, 12); px(c, "#59606b", X, piso, W, 2); px(c, "#23262e", X, piso + 12, W, 14);
  for (let x = X + 4; x < X + W - 2; x += 10) { px(c, "#aab0b9", x, piso + 13, 2, 11); } px(c, "#e9ecf0", X, piso + 13, W, 2); px(c, "#aab0b9", X, piso + 19, W, 1);
  vasinho(c, X + 12, piso - 6); vasinho(c, X + W - 18, piso - 6);
  const larg = 38, cx0 = X + W / 2, xs = [cx0 - larg * 1.5, cx0 - larg / 2, cx0 + larg / 2], alt = [13, 20, 8], ordem = [1, 0, 2];
  c.textBaseline = "middle"; c.textAlign = "center";
  ordem.forEach((k, col) => {
    const quem = r[k], cor = quem?.cor || "#8a93a3", x = xs[col], topo = piso - alt[col];
    // o painel do alto, na cor da equipe, com o nome
    px(c, TINTA, x + 1, BY + 2, larg - 2, 20); px(c, cor, x + 2, BY + 3, larg - 4, 18); px(c, claro(cor, 0.35), x + 2, BY + 3, larg - 4, 2);
    c.font = FONTE_PLACA(800, 8); c.fillStyle = "#0d0f12"; c.fillText(quem ? String(quem.piloto).slice(0, 8) : "—", x + larg / 2 + 1, BY + 13); c.fillStyle = "#ffffff"; c.fillText(quem ? String(quem.piloto).slice(0, 8) : "—", x + larg / 2, BY + 12);
    // o degrau
    px(c, TINTA, x - 1, topo - 1, larg + 2, alt[col] + 1); px(c, "#e9ecf0", x, topo, larg, alt[col]); px(c, "#59606b", x, topo + 3, larg, alt[col] - 3); px(c, "#00000030", x + larg - 3, topo + 3, 3, alt[col] - 3);
    c.font = FONTE_PLACA(800, 9); c.fillStyle = "#ffffff"; c.fillText(String(k + 1), x + larg / 2, topo + 3 + (alt[col] - 3) / 2 + 0.5);
    if (!quem) return;
    // o piloto: o capacete, o macacão na cor da equipe e a taça (o primeiro levanta com as duas mãos)
    const cx = Math.round(x + larg / 2), pe = topo, sobe = k === 0 ? Math.round(Math.abs(Math.sin(t / 380)) * 2) : 0;
    px(c, TINTA, cx - 4, pe - 7, 8, 7); px(c, escuro(cor, 0.4), cx - 3, pe - 6, 2, 6); px(c, escuro(cor, 0.4), cx + 1, pe - 6, 2, 6);
    px(c, TINTA, cx - 5, pe - 15 - sobe, 10, 10); px(c, cor, cx - 4, pe - 14 - sobe, 8, 9); px(c, "#ffffff66", cx - 4, pe - 11 - sobe, 8, 1);
    px(c, TINTA, cx - 4, pe - 21 - sobe, 8, 7); px(c, PELES[k], cx - 3, pe - 20 - sobe, 6, 6); px(c, cor, cx - 3, pe - 20 - sobe, 6, 2); px(c, TINTA, cx - 2, pe - 17 - sobe, 1, 1); px(c, TINTA, cx + 1, pe - 17 - sobe, 1, 1);
    if (k === 0) {
      px(c, cor, cx - 6, pe - 22 - sobe, 2, 9); px(c, cor, cx + 4, pe - 22 - sobe, 2, 9);
      px(c, TINTA, cx - 4, pe - 32 - sobe, 8, 11); px(c, "#ffd34d", cx - 3, pe - 31 - sobe, 6, 5); px(c, "#fff3c4", cx - 3, pe - 31 - sobe, 2, 2); px(c, "#e0a800", cx - 1, pe - 26 - sobe, 2, 3); px(c, "#ffd34d", cx - 2, pe - 23 - sobe, 4, 1);
      if (Math.floor(t / 300) % 3 === 0) px(c, "#ffffff", cx + 4, pe - 33 - sobe, 2, 2);
    } else { px(c, cor, cx - 6, pe - 13, 2, 6); px(c, cor, cx + 4, pe - 15, 2, 6); px(c, "#ffd34d", cx + 5, pe - 20, 4, 4); px(c, "#e0a800", cx + 6, pe - 16, 2, 2); }
  });
  c.textAlign = "left";
}
function passoPodio(s) {
  const X = PODIO.x * TS, W = PODIO.w * TS, base = (PODIO.y + PODIO.h) * TS;
  if (!naTela(X + W / 2, base - 50, 200)) return;
  const perto = Math.abs(player.fx * TS - X - W / 2) < 150 && Math.abs(player.fy * TS - base) < 90;
  if (rndV() < s * (perto ? 26 : 3)) solta(X + rndV() * W, base - 112, (rndV() - 0.5) * 16, 14 + rndV() * 14, CONFETE[Math.floor(rndV() * 6)], 3.2, 6);
  if (perto && CAMPEOES_F1.d?.ranking?.[0] && rndV() < s * 14) solta(X + W / 2 + 6, base - 60, 10 + rndV() * 40, -50 - rndV() * 30, rndV() < 0.5 ? "#ffffff" : "#fff3c4", 0.9, 150, 1); // o champanhe
}

const NUVENS = Array.from({ length: 12 }, () => ({ x: rndV() * MW * TS, y: rndV() * MH * TS, rx: 70 + rndV() * 90, ry: 30 + rndV() * 30, v: 5 + rndV() * 6 }));
const LED_TEXTO = "  GRANDE PRÊMIO DA GALERA  ·  PEGUE UM F1 NO PIT LANE E FAÇA A SUA VOLTA  ·  TRUCO NA FAN ZONE  ·  DESAFIE OS 10 BOXES  ·  ";
function passoVida(dt, agora) {
  const s = Math.max(0, dt) / 1000, parado = reduzVida.matches; // o primeiro quadro pode vir com o tempo negativo
  if (player.car) passoMeuCarro(s, agora);
  passoCarrosDosOutros(s);
  if (parado) return;
  passoCarros(s); passoTurma(s, agora); passoPombos(s, agora); passoHeli(s); passoPodio(s); passoPart(s);
  for (const n of NUVENS) { n.x += n.v * s; if (n.x - n.rx > MW * TS) n.x = -n.rx; }
}
function drawVida(c, t, s) {
  const parado = reduzVida.matches;
  // a fumaça dos food trucks
  if (!parado) for (const [x, y] of FOODTRUCKS) if (naTela(x * TS, y * TS, 60)) for (let k = 0; k < 3; k++) { const f = ((t / 1800 + k / 3 + x * 0.1) % 1), X = x * TS + 32 + Math.sin(f * 6 + k) * 3, Y = y * TS - 4 - f * 18; c.fillStyle = `rgba(240,240,240,${0.5 * (1 - f)})`; c.beginPath(); c.arc(X, Y, 2 + f * 4, 0, 7); c.fill(); }
  // o letreiro de LED correndo
  { const X = PAINEL.x * TS + 3, Y = PAINEL.y * TS - 17, W = PAINEL.w * TS - 6; if (naTela(X + W / 2, Y, 120)) { c.save(); c.beginPath(); c.rect(X, Y, W, 18); c.clip();
    c.font = FONTE_PIXEL(11); c.textBaseline = "middle"; c.textAlign = "left"; const larg = c.measureText(LED_TEXTO).width, desl = parado ? 0 : (t / 30) % larg;
    c.fillStyle = ["#ffd23f", "#ffffff", "#ff3b2f"][Math.floor(t / 2500) % 3]; for (const k of [0, 1, 2]) c.fillText(LED_TEXTO, X - desl + k * larg, Y + 9.5);
    c.restore(); } }
  // a luz da antena da torre de controle, piscando
  { const p = PREDIOS.find((q) => q.estilo === "torre"); if (p && Math.floor(t / 600) % 2) px(c, "#ff2a1a", (p.x + p.w / 2) * TS - 1, p.y * TS - 85, 3, 3); }
  drawBandeiras(c, t); drawPart(c); drawPombos(c, t);
  if (!parado) { drawHeliVoando(c, t); drawDirigivel(c, t, s); }
  // as sombras das nuvens passando por cima de tudo (bem leves)
  if (!parado) { c.fillStyle = "#1a2a4012"; for (const n of NUVENS) { c.beginPath(); c.ellipse(n.x, n.y, n.rx, n.ry, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(n.x + n.rx * 0.5, n.y - n.ry * 0.3, n.rx * 0.6, n.ry * 0.7, 0, 0, 7); c.fill(); } }
}
// o que o mouse aponta: o prédio de um jogo ganha a moldura amarela piscando e o cursor de mão
function drawApontado(c, t) {
  const tx = Math.floor(rato.x / TS), ty = Math.floor(rato.y / TS), g = player.car ? null : buildingAt(tx, ty), vaga = !g && !player.car && VAGAS_F1.find(([vx, vy]) => ty === vy && (tx === vx || tx === vx + 1));
  cv.style.cursor = g || vaga ? "pointer" : "";
  const alvo = g ? [g.x * TS, g.y * TS - 6, g.w * TS, g.h * TS + 6] : vaga ? [vaga[0] * TS - 3, vaga[1] * TS - 3, 38, 22] : null;
  if (!alvo) return;
  const [X, Y, W, H] = alvo, e = Math.floor(t / 200) % 2;
  c.fillStyle = e ? "#ffe066" : "#ffffff"; for (const [x, y, w, h] of [[X - 3 - e, Y - 3 - e, 10, 2], [X - 3 - e, Y - 3 - e, 2, 10], [X + W - 7 + e, Y - 3 - e, 10, 2], [X + W + 1 + e, Y - 3 - e, 2, 10], [X - 3 - e, Y + H + 1 + e, 10, 2], [X - 3 - e, Y + H - 7 + e, 2, 10], [X + W - 7 + e, Y + H + 1 + e, 10, 2], [X + W + 1 + e, Y + H - 7 + e, 2, 10]]) c.fillRect(x, y, w, h);
  if (vaga) balao(c, X + 19, Y - 14, "Pilotar");
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(50, now - last), s = Math.max(0, dt) / 1000; last = now;
  update(dt);
  updateOthers(dt);
  passoVida(dt, now);
  const mw = MW * TS, mh = MH * TS;
  // de carro a câmera olha um pouco à frente
  const alvoX = player.car ? Math.cos(meu.a) * meu.v * 4 : 0, alvoY = player.car ? Math.sin(meu.a) * meu.v * 3 : 0, k = Math.min(1, s * 3);
  meu.olhar[0] += (alvoX - meu.olhar[0]) * k; meu.olhar[1] += (alvoY - meu.olhar[1]) * k;
  const tx = player.fx * TS + 8 - viewW / 2 + meu.olhar[0];
  const ty = player.fy * TS + 8 - viewH * (innerWidth <= 560 ? 0.6 : 0.54) + meu.olhar[1];
  camX = mw > viewW ? Math.max(0, Math.min(mw - viewW, tx)) : (mw - viewW) / 2;
  camY = mh > viewH ? Math.max(0, Math.min(mh - viewH, ty)) : (mh - viewH) / 2;
  camX = Math.round(camX * scale) / scale; camY = Math.round(camY * scale) / scale;
  // durante a batalha a vila fica escondida: não desenha nada (poupa bateria e memória do celular)
  if (btOpen()) { requestAnimationFrame(frame); return; }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#2b6837"; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.setTransform(scale, 0, 0, scale, -camX * scale, -camY * scale);
  ctx.imageSmoothingEnabled = false;
  for (let cy = Math.floor(camY / CHP); cy <= Math.floor((camY + viewH) / CHP); cy++) for (let cx = Math.floor(camX / CHP); cx <= Math.floor((camX + viewW) / CHP); cx++)
    if (cx >= 0 && cy >= 0 && cx * CH < MW && cy * CH < MH) ctx.drawImage(pedaco(cx, cy), cx * CHP, cy * CHP);
  ctx.fillStyle = "#16161a59"; for (const [mx, my] of MARCAS) ctx.fillRect(Math.round(mx) - 1, Math.round(my) - 1, 3, 3);
  drawTransito(ctx, s);
  drawCarros(ctx);
  drawSobrePista(ctx, now);
  drawTorcida(ctx, now);
  drawRoda(ctx, s);
  drawTelao(ctx, now);
  drawTorre(ctx, now);
  drawPodio(ctx, now);
  if (player.entering) { // a porta abre
    const g = player.entering;
    for (const d of g.doors) px(ctx, "#140c06", d * TS + (g.doors.length > 1 ? (d === g.doors[0] ? 2 : 0) : 2), g.doorY * TS + TS - 20, g.doors.length > 1 ? 14 : 12, 19);
  }
  drawDoorArrows(ctx, now);
  drawApontado(ctx, now);
  player.name = myName;
  const chars = [...others.values()].filter((o) => naMinhaZona(o) && !o.car).map((o) => [o, o.look]);
  if (!player.car) chars.push([player, outfit]);
  for (const p of TURMA) if (naTela(p.fx * TS, p.fy * TS)) chars.push([p, p.look]);
  chars.sort((a, b) => a[0].fy - b[0].fy);
  chars.forEach(([p, look]) => {
    if (p.pulo) { ctx.save(); ctx.translate(0, -Math.round(Math.sin(Math.min(1, p.pulo) * Math.PI) * 5)); drawChar(ctx, p, look); ctx.restore(); } else drawChar(ctx, p, look);
    if (ground[Math.round(p.fy)]?.[Math.round(p.fx)] === "h") drawMatoPorCima(ctx, p);
  });
  drawExtrasTurma(ctx, now);
  drawVida(ctx, now, s);
  GAMES.forEach((g) => { if (naTela((g.x + g.w / 2) * TS, (g.y + g.h) * TS, g.w * TS)) drawSign(ctx, g); });
  BAIRROS.forEach((b) => drawPlaca(ctx, b));
  chars.forEach(([p]) => { if (p.name) drawTag(ctx, p, p === player); });
  for (const o of others.values()) if (o.car && naMinhaZona(o)) drawTag(ctx, o, false);
  if (player.car) drawTag(ctx, player, true); else drawBubble(ctx, now);
  if (player.car) { ctx.setTransform(1, 0, 0, 1, 0, 0); drawPainelCarro(ctx, now); }
  drawMini(now);
  requestAnimationFrame(frame);
}
