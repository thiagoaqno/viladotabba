#!/usr/bin/env node
// (2026-11-16, o Thiago: "os bots são os goats do qualify: fazem ritmos que não fazem na corrida nunca, por exemplo em Baku") A volta do qualify
// dos robôs é CALCULADA (corrida-robos.js voltaLancada: o limite do traçado com pneu macio novo); na corrida eles PILOTAM pela física. Esta
// ferramenta mede, em cada pista, a melhor volta pilotada de 10 robôs numa corrida de 6 voltas (pneu do plano, trânsito, batidas) contra a volta
// do qualify de cada um, e grava a média em public/corrida/quali-fator.json; voltaLancada multiplica a volta calculada por ela.
//   node ferramentas/quali-fator.js [pista ...]   (sem pista: as da carreira, PISTAS_TRABALHADAS)
const R = require("path").join(__dirname, "..") + "/";
const T = require(R + "public/corrida/pistas.js"), F1 = require(R + "public/corrida/f1-regras.js"), Eq = require(R + "public/corrida/f1-equipes.js");
const Robos = require(R + "servidor/corrida/corrida-robos.js"), Direcao = require(R + "servidor/corrida/corrida-f1-direcao.js");
function medir(pista, nb = 10, nivel = "medio") {
const agora = Date.now; let relogio = 1e6; Date.now = () => relogio; Math.random = F1.sorteio("c:" + pista);
Robos.usarFonte(() => []);
const room = { config: { pista, regras: "f1", caixas: false, robos: nb, nivel, voltas: 6 }, players: {}, order: [], phase: "race", startAt: relogio, semente: 4321, finishOrder: [] };
Robos.preparar(room, Array.from({ length: nb }, (_, i) => "#" + i), () => "x");
const eqs = Object.keys(Eq.EQUIPES);
room.order.forEach((id, i) => { const p = room.players[id]; p.spec = Eq.specDaEquipe(eqs[i % eqs.length]); Object.assign(p, { grid: i, laps: 0, sector: T.SECTORS - 1, started: false, finish: null }); });
Robos.largar(room); Direcao.iniciar(room);
const quali = {}; room.order.forEach((id, i) => { quali[id] = Robos.voltaLancada(room, room.players[id], 0, i, nb).tempo; });
const n = Robos.perfil(pista, room.players[room.order[0]].spec, 0).n, cruz = {}, ult = {}; let batidas = 0;
const setor = (x, s) => { if (s === (x.sector + 1) % T.SECTORS) x.sector = s; };
for (let t = 0; t < 900; t += 1 / 60) {
  relogio += 1000 / 60; Robos.passo(room, 1 / 60, setor, (e) => { if (e === "batida") batidas++; });
  for (const id of room.order) { const c = room.players[id].ia.sim, lap = Math.floor(c.prog / n); if (lap !== ult[id]) { (cruz[id] ||= []).push(t); ult[id] = lap; } }
  if (room.order.every((id) => (cruz[id] || []).length >= 6)) break;
}
Date.now = agora;
let soma = 0, k = 0; const linhas = [];
for (const id of room.order) {
  const v = cruz[id].slice(1).map((t, i) => t - cruz[id][i]).slice(1); if (!v.length) continue;
  const melhor = Math.min(...v), media = v.reduce((a, b) => a + b, 0) / v.length; soma += melhor / quali[id]; k++;
  linhas.push(`${room.players[id].piloto ? room.players[id].piloto.curto : id}: quali ${quali[id].toFixed(2)} · melhor da corrida ${melhor.toFixed(2)} · média ${media.toFixed(2)} (${v.length} voltas)`);
}
return { fator: Math.round((soma / k) * 1000) / 1000, batidas };
}

const fs = require("fs"), arq = require("path").join(__dirname, "..", "public", "corrida", "quali-fator.json");
const lista = process.argv.slice(2).length ? process.argv.slice(2) : require(R + "public/corrida/temporada/regras.js").PISTAS_TRABALHADAS;
const atual = fs.existsSync(arq) ? JSON.parse(fs.readFileSync(arq, "utf8")) : {};
for (const pista of lista) { const t0 = performance.now(); const r = medir(pista); atual[pista] = r.fator; console.log(`${pista}: fator ${r.fator} · batidas ${r.batidas} · ${((performance.now() - t0) / 1000).toFixed(0)} s`); fs.writeFileSync(arq, JSON.stringify(atual, null, 1) + String.fromCharCode(10)); }
