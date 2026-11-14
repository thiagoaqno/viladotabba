// Corrida da Galera — a gravação da corrida para o replay da tela do resultado (resultado-analise.js, abas Replay e Ultrapassagens).
// A cada 250 ms (o laço de 100 ms das regras de F1 em corrida.js chama `passo`), uma amostra de cada carro em 6 bytes:
//   fração da volta (2 bytes, 0 a 65 535; 65 535 = fora da pista: abandonou ou já recebeu a bandeirada), velocidade (1 byte, km/h ÷ 2 na
//   escala do velocímetro, v × 0,75), acelerador e freio (1 byte cada, 0 a 255) e marcha (1 byte; +128 quando está no box).
// Com 22 carros dá 132 bytes por amostra, 528 bytes por segundo (a conta, não medido); o limite é 1 hora de corrida (14 400 amostras).
// As ultrapassagens saem da mesma amostra: a ordem na pista (voltas + fração) de cada par que troca de lugar fora do box e continua trocado
// 1,5 s depois. A volta de um retardatário (diferença de mais de meia volta) não conta.
const PASSO_MS = 250, MAX_AMOSTRAS = 14400, CAMPOS = 6, FORA = 65535, CONFIRMA_MS = 1500, KMH_POR_U = 0.75;

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
  const g = (room.grav ||= { t0: room.startAt, ids: room.order.slice(), amostras: [], ult: 0, ordem: new Map(), cand: new Map(), ultrapassagens: [] });
  if (agora - g.ult < PASSO_MS || g.amostras.length >= MAX_AMOSTRAS) return;
  g.ult = agora;
  const b = Buffer.alloc(g.ids.length * CAMPOS), prog = new Map();
  g.ids.forEach((id, k) => {
    const p = room.players[id], o = k * CAMPOS;
    if (!p || p.dnf || p.finish != null) { b.writeUInt16LE(FORA, o); return; }
    let f = null; try { const pt = onde(p); if (Number.isFinite(pt.idx) && pt.n) f = (((pt.idx / pt.n) % 1) + 1) % 1; } catch (e) { f = null; }
    if (f == null) { b.writeUInt16LE(FORA, o); return; }
    const c = (p.sim && p.sim.c) || (p.ia && p.ia.sim) || null, v = Math.abs((c && c.v) ?? (p.pos && p.pos.v) ?? 0) * KMH_POR_U;
    b.writeUInt16LE(Math.min(FORA - 1, Math.round(f * (FORA - 1))), o);
    b[o + 2] = Math.min(255, Math.round(v / 2));
    b[o + 3] = Math.round(Math.max(0, Math.min(1, (c && c.gasP) || 0)) * 255);
    b[o + 4] = Math.round(Math.max(0, Math.min(1, (c && c.brkP) || 0)) * 255);
    b[o + 5] = Math.min(127, (c && c.marcha) || 0) + (p.box ? 128 : 0);
    if (!p.box) prog.set(id, { pr: progresso(p, f, agora), f });
  });
  g.amostras.push(b);
  ultrapassagens(room, g, prog, agora);
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
    if (!g.cand.has(chave)) g.cand.set(chave, { a, b, em: agora, f: pa.f, sob: sobBandeira });
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
    g.ultrapassagens.push({ t: Math.round((c.em - g.t0) / 100) / 10, v: (pA ? pA.laps || 0 : 0) + 1, a: c.a, b: c.b, f: Math.round(c.f * 1000) / 1000, pos, sob: c.sob || undefined });
  }
}

const listaUltrapassagens = (room) => (room.grav ? room.grav.ultrapassagens.slice() : []);
// o replay para o navegador: os ids na ordem das colunas e todas as amostras juntas em base64
function replay(room) {
  const g = room.grav; if (!g || !g.amostras.length) return null;
  return { t0: g.t0, passo: PASSO_MS, campos: CAMPOS, ids: g.ids, n: g.amostras.length, dados: Buffer.concat(g.amostras).toString("base64") };
}

module.exports = { passo, limpar, replay, listaUltrapassagens, PASSO_MS, CAMPOS, FORA };
