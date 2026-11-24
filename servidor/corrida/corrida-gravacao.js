// Corrida da Galera — a gravação da corrida para o replay da tela do resultado (resultado-analise.js, abas Replay e Ultrapassagens).
// A cada 250 ms (o laço de 100 ms das regras de F1 em corrida.js chama `passo`), uma amostra de cada carro em 6 bytes:
//   fração da volta (2 bytes, 0 a 65 535; 65 535 = fora da pista: abandonou ou já recebeu a bandeirada), velocidade (1 byte, km/h ÷ 2 na
//   escala do velocímetro, v × 0,75), acelerador e freio (1 byte cada, 0 a 255) e marcha (1 byte; +128 quando está no box).
// Desde o replay 3D (2026-11-21) cada amostra leva mais 6 bytes: x e y do carro (2 bytes cada, de `mundo.x0`/`mundo.y0` em passos de `mundo.e`,
//   a pista e uma margem de meio mundo em volta) e a direção do carro (2 bytes com sinal, −π a π). O replay antigo, de 6 bytes, continua lido
//   (o `campos` vai junto): a miniatura usa só os 6 primeiros.
// Com 22 carros dá 264 bytes por amostra, 1 056 bytes por segundo (a conta, não medido); o limite é 1 hora de corrida (14 400 amostras).
// As ultrapassagens saem da mesma amostra: a ordem na pista (voltas + fração) de cada par que troca de lugar fora do box e continua trocado
// 1,5 s depois. A volta de um retardatário (diferença de mais de meia volta) não conta.
const PASSO_MS = 250, MAX_AMOSTRAS = 14400, CAMPOS = 12, FORA = 65535, CONFIRMA_MS = 1500, KMH_POR_U = 0.75;
let T = null; try { T = require("../../public/corrida/pistas.js"); } catch (e) { T = null; }
// o quadro das posições: o mundo da pista com meio mundo de margem para cada lado (o box e as áreas de escape ficam dentro), em 65 534 passos
function mundoDe(pista) {
  const w = (T && T.PISTAS[pista] && T.PISTAS[pista].world) || 1600 * 8;
  return { x0: -w / 2, y0: -w / 2, e: (w * 2) / 65534 };
}
const u16 = (v, x0, e) => Math.max(0, Math.min(65534, Math.round((v - x0) / e)));

function limpar(room) { room.grav = null; }

// o progresso na corrida: voltas + fração. Perto da linha a volta (contada pelos setores) e a fração (o ponto da pista) podem discordar por um
// instante: a fração já zerou e a volta ainda não subiu, ou o contrário. A hora da última volta desfaz a dúvida.
function progresso(p, f, agora) {
  let v = p.laps || 0;
  if (f > 0.75 && p.lapStart && agora - p.lapStart < 8000) v -= 1;
  else if (f < 0.25 && p.lapStart && agora - p.lapStart > 20000) v += 1;
  return v + f;
}

function passo(room, agora, onde) {
  if (room.phase !== "race" || !room.startAt || agora < room.startAt) return;
  const g = (room.grav ||= { t0: room.startAt, ids: room.order.slice(), amostras: [], ordem: new Map(), cand: new Map(), ultrapassagens: [], mundo: mundoDe(room.config.pista) });
  // a próxima amostra é marcada no relógio (t0 + k × 250 ms), não 250 ms depois da última: o laço é de 100 ms, e "250 ms depois" virava 300 ms,
  // o que atrasava o replay em relação ao tempo da corrida (o "Ver no replay" caía segundos depois da ultrapassagem)
  // (2026-11-21, o Thiago: "o replay 3D é travoso, parece que o carro teleporta") a amostra saía no primeiro passo do laço depois da hora dela: até
  // 100 ms atrasada (150 a 280 ms quando o laço atrasava, no servidor.log dele), e o replay punha a posição atrasada na hora certa: o carro pulava.
  // Com o laço atrasado mais de 250 ms, a amostra do meio nem existia e o tempo do replay encolhia. Agora cada amostra é a posição NA HORA dela,
  // entre o estado do passo de antes e o de agora (interpolada), e todas as que ficaram para trás são escritas.
  const agoraE = estados(room, g, onde, agora), ant = g.ant; g.ant = agoraE;
  while (g.amostras.length < MAX_AMOSTRAS && agora >= g.t0 + g.amostras.length * PASSO_MS) {
    const T = g.t0 + g.amostras.length * PASSO_MS, b = Buffer.alloc(g.ids.length * CAMPOS), prog = new Map();
    g.ids.forEach((id, k) => {
      const o = k * CAMPOS, e1 = agoraE.lista[k], e0 = ant && ant.lista[k];
      if (!e1) { b.writeUInt16LE(FORA, o); return; }
      const u = e0 && agoraE.t > ant.t ? Math.max(0, Math.min(1, (T - ant.t) / (agoraE.t - ant.t))) : 1, e = e0 ? misturar(e0, e1, u) : e1;
      escrever(b, o, e, g.mundo);
      if (!e.box) prog.set(id, { pr: progresso(room.players[id], e.f, T), f: e.f });
    });
    g.amostras.push(b);
    ultrapassagens(room, g, prog, T);
  }
}
// o estado de cada carro neste passo (null: fora da pista, chegou ou abandonou)
function estados(room, g, onde, agora) {
  return { t: agora, lista: g.ids.map((id) => {
    const p = room.players[id];
    if (!p || p.dnf || p.finish != null) return null;
    let f = null; try { const pt = onde(p); if (Number.isFinite(pt.idx) && pt.n) f = (((pt.idx / pt.n) % 1) + 1) % 1; } catch (e) { f = null; }
    if (f == null) return null;
    const c = (p.sim && p.sim.c) || (p.ia && p.ia.sim) || null;
    const x = (c && Number.isFinite(c.x)) ? c.x : p.pos && p.pos.x, y = (c && Number.isFinite(c.y)) ? c.y : p.pos && p.pos.y, a = (c && Number.isFinite(c.a)) ? c.a : p.pos && p.pos.a;
    return { f, v: Math.abs((c && c.v) ?? (p.pos && p.pos.v) ?? 0) * KMH_POR_U, gas: Math.max(0, Math.min(1, (c && c.gasP) || 0)), brk: Math.max(0, Math.min(1, (c && c.brkP) || 0)),
      marcha: Math.min(127, (c && c.marcha) || 0), box: !!p.box, x, y, a };
  }) };
}
// entre dois estados: a fração da volta e o giro pelo caminho mais curto; um salto grande (o carro voltou para a pista) não mistura
function misturar(e0, e1, u) {
  if (u >= 1) return e1;
  const temPos = Number.isFinite(e0.x) && Number.isFinite(e1.x) && Number.isFinite(e0.y) && Number.isFinite(e1.y);
  if (temPos && Math.hypot(e1.x - e0.x, e1.y - e0.y) > 400) return u < 0.5 ? e0 : e1;
  let df = e1.f - e0.f; if (df > 0.5) df -= 1; else if (df < -0.5) df += 1;
  const da = Number.isFinite(e0.a) && Number.isFinite(e1.a) ? Math.atan2(Math.sin(e1.a - e0.a), Math.cos(e1.a - e0.a)) : 0, L = (a, b) => a + (b - a) * u;
  return { f: ((e0.f + df * u) % 1 + 1) % 1, v: L(e0.v, e1.v), gas: L(e0.gas, e1.gas), brk: L(e0.brk, e1.brk), marcha: u < 0.5 ? e0.marcha : e1.marcha, box: u < 0.5 ? e0.box : e1.box,
    x: temPos ? L(e0.x, e1.x) : e1.x, y: temPos ? L(e0.y, e1.y) : e1.y, a: Number.isFinite(e0.a) ? e0.a + da * u : e1.a };
}
function escrever(b, o, e, M) {
  b.writeUInt16LE(Math.min(FORA - 1, Math.round(e.f * (FORA - 1))), o);
  b[o + 2] = Math.min(255, Math.round(e.v / 2));
  b[o + 3] = Math.round(e.gas * 255); b[o + 4] = Math.round(e.brk * 255);
  b[o + 5] = e.marcha + (e.box ? 128 : 0);
  if (Number.isFinite(e.x) && Number.isFinite(e.y)) { b.writeUInt16LE(u16(e.x, M.x0, M.e), o + 6); b.writeUInt16LE(u16(e.y, M.y0, M.e), o + 8); }
  else { b.writeUInt16LE(FORA, o + 6); b.writeUInt16LE(FORA, o + 8); }
  b.writeInt16LE(Number.isFinite(e.a) ? Math.round(Math.atan2(Math.sin(e.a), Math.cos(e.a)) / Math.PI * 32767) : 0, o + 10);
}

function ultrapassagens(room, g, prog, agora) {
  const d = room.direcao, sobBandeira = !!(d && (d.safety || d.amarelo));
  // a última ordem certa de cada par (empate não muda nada): quando ela vira, nasce a candidata
  const ordem = (g.ordem ||= new Map()), ids = [...prog.keys()];
  for (const k of ordem.keys()) { const [x, y] = k.split("|"); if (!prog.has(x) || !prog.has(y)) ordem.delete(k); } // no box (ou fora): a troca de lugar no pit não é ultrapassagem
  for (let i = 0; i < ids.length; i++) for (let k = i + 1; k < ids.length; k++) {
    const x = ids[i], y = ids[k], px = prog.get(x), py = prog.get(y), dif = px.pr - py.pr;
    if (dif === 0 || Math.abs(dif) > 0.5) { if (Math.abs(dif) > 0.5) ordem.delete(x + "|" + y); continue; } // mais de meia volta: retardatário, a ordem recomeça
    const chavePar = x + "|" + y, agoraSinal = dif > 0 ? 1 : -1, antes = ordem.get(chavePar); ordem.set(chavePar, agoraSinal);
    if (antes == null || antes === agoraSinal) continue;
    const [a, b, pa] = agoraSinal > 0 ? [x, y, px] : [y, x, py], chave = a + ">" + b;
    g.cand.delete(b + ">" + a);
    if (!g.cand.has(chave)) g.cand.set(chave, { a, b, em: agora, j: g.amostras.length - 1, f: pa.f, sob: sobBandeira }); // j: a amostra em que trocaram
  }
  // confirma o que continua trocado depois de 1,5 s; desiste do que voltou
  for (const [chave, c] of g.cand) {
    const pa = prog.get(c.a), pb = prog.get(c.b);
    if (!pa || !pb || pa.pr <= pb.pr) { g.cand.delete(chave); continue; }
    if (agora - c.em < CONFIRMA_MS) continue;
    g.cand.delete(chave);
    if (g.ultrapassagens.length >= 400) continue;
    const pos = 1 + [...prog.values()].filter((x) => x.pr > pa.pr).length + room.order.filter((id) => { const p = room.players[id]; return p && p.finish != null; }).length;
    const pA = room.players[c.a];
    g.ultrapassagens.push({ t: Math.round((c.em - g.t0) / 100) / 10, j: c.j, v: (pA ? pA.laps || 0 : 0) + 1, a: c.a, b: c.b, f: Math.round(c.f * 1000) / 1000, pos, sob: c.sob || undefined });
  }
}

const listaUltrapassagens = (room) => (room.grav ? room.grav.ultrapassagens.slice() : []);
// o replay para o navegador: os ids na ordem das colunas e todas as amostras juntas em base64
function replay(room) {
  const g = room.grav; if (!g || !g.amostras.length) return null;
  return { t0: g.t0, passo: PASSO_MS, campos: CAMPOS, mundo: g.mundo, pista: room.config.pista, ids: g.ids, n: g.amostras.length, dados: Buffer.concat(g.amostras).toString("base64") };
}

// para o save da carreira: os ids da sala viram os do save (`chave(p)`: "voce", "h:<pessoa>" ou o id do piloto real) nas ultrapassagens e nas
// colunas do replay; o replay vai cru (Buffer), e o bd.js comprime
function paraSave(room, chave) {
  const g = room.grav, troca = new Map();
  for (const id of room.order) { const p = room.players[id]; if (p) { try { troca.set(id, chave(p)); } catch (e) { troca.set(id, id); } } }
  const novo = (id) => troca.get(id) || id;
  const ultrapassagens = g ? g.ultrapassagens.map((u) => ({ ...u, a: novo(u.a), b: novo(u.b) })) : [];
  const replay = g && g.amostras.length ? { t0: g.t0, passo: PASSO_MS, campos: CAMPOS, mundo: g.mundo, pista: room.config.pista, ids: g.ids.map(novo), n: g.amostras.length, dados: Buffer.concat(g.amostras) } : null;
  return { ultrapassagens, replay };
}

module.exports = { passo, limpar, replay, listaUltrapassagens, paraSave, PASSO_MS, CAMPOS, FORA };
