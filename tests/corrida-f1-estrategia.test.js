// Corrida: os pneus na estratégia (public/corrida/f1-regras.js, f1-pneus-ritmo.js e a tabela f1-pneus-tabela.js). O simulador de stint
// (ferramentas/pneus-fisica.js) dá a volta com a física do carro e o piloto ideal, com cada composto em cada estado de desgaste:
// a vida em voltas, o ganho do macio, o penhasco, a parada e a corrida inteira de cada estratégia. Se este arquivo falha depois de
// mexer nos pneus ou na física, rode `node ferramentas/pneus-tabela.js` para medir a tabela de novo.
const test = require("node:test");
const assert = require("node:assert/strict");
const F1 = require("../public/corrida/f1-regras.js");
const Ritmo = require("../public/corrida/f1-pneus-ritmo.js");
const P = require("../ferramentas/pneus-fisica.js");
const Robos = require("../servidor/corrida/corrida-robos.js");
const Itens = require("../servidor/corrida/corrida-itens.js");
const T = require("../public/corrida/pistas.js");

const L = { macio: "S", medio: "M", duro: "H" };
const sig = (p) => [p.largada, ...p.paradas.map((q) => q.composto)].map((c) => L[c]).join("");
const volta = (pista, composto, desgaste = 0) => P.voltaFixa(pista, { composto, desgaste, temp: 1 });
const melhor = (tab, voltas, filtro) => Ritmo.planos(tab, voltas).find(filtro);

test("estratégia (física): o piloto ideal gasta o pneu na vida de cada composto, em voltas", () => {
  for (const pista of ["interlagos", "monaco", "monza"]) {
    const vida = (c) => F1.PENHASCO / volta(pista, c).desgaste;
    for (const c of F1.SECOS) {
      const medida = vida(c), esperada = F1.PNEUS[c].vida / P.SPEC.desgaste;
      assert.ok(medida / esperada > 0.65 && medida / esperada < 1.15, `${pista} ${c} ${medida}`);
    }
  }
});

// (2026-11-21, apagado: "estratégia (física): passou da vida…" fixava o comportamento antigo; o Thiago pediu para tirar esses testes)

test("estratégia (física): a parada custa de verdade uns 6 s (entrada + limitador + parada + saída)", () => {
  for (const pista of ["interlagos", "monaco", "monza"]) { const p = P.medirParada(pista); assert.ok(p.perda > 4.5 && p.perda < 8.5, `${pista}: ${p.perda.toFixed(2)} s`); }
});

// (2026-11-21, apagado: "estratégia: as boas estratégias terminam…" fixava o comportamento antigo; o Thiago pediu para tirar esses testes)

test("robôs: a estratégia sai da conta do simulador, perto do melhor plano, com variação pela semente e pelo nível", () => {
  const tab = Ritmo.tabelaDe("interlagos"), melhores = new Map(), melhorTempo = (voltas) => { if (!melhores.has(voltas)) melhores.set(voltas, Ritmo.planos(tab, voltas, { janela: 0.01, max: 1, exigirDois: true })[0].tempo); return melhores.get(voltas); };
  for (const voltas of [2, 3, 5, 10, 21]) for (const nivel of ["facil", "medio", "dificil"]) {
    const limite = { facil: 6, medio: 3.5, dificil: 2 }[nivel], visto = new Set();
    for (let semente = 1; semente <= 40; semente++) {
      const e = F1.estrategia(voltas, nivel, semente, "interlagos"), compostos = [e.largada, ...e.paradas.map((q) => q.composto)];
      void compostos; // (sem a regra dos dois compostos)
      e.paradas.forEach((q, k) => { assert.ok(q.volta >= 1 && q.volta <= voltas - 1); if (k) assert.ok(q.volta > e.paradas[k - 1].volta); });
      const t = Ritmo.simular(tab, voltas, e).tempo;
      assert.ok(t - melhorTempo(voltas) <= limite + 0.01, `${voltas}/${nivel}/${semente}: +${(t - melhorTempo(voltas)).toFixed(1)}`);
      visto.add(JSON.stringify(e));
    }
    if (voltas >= 5 && nivel !== "dificil") assert.ok(visto.size >= 3, `${voltas}/${nivel}: ${visto.size} estratégias`);
  }
  assert.deepEqual(F1.estrategia(5, "medio", 9, "monza"), F1.estrategia(5, "medio", 9, "monza"));
  const e = F1.estrategia(5, "medio", 9, "pista-que-nao-existe"); assert.ok(F1.PNEUS[e.largada]); // sem tabela, usa a de Interlagos
});

test("robôs: o pneu que acaba antes do plano faz o robô parar antes, na volta certa", { timeout: 60000 }, () => {
  const agora = Date.now; let relogio = agora(); Date.now = () => relogio;
  try {
    const room = { config: { pista: "interlagos", caixas: false, robos: 1, nivel: "medio", voltas: 5, regras: "f1" }, players: {}, order: [], phase: "race", startAt: relogio, semente: 5 };
    Robos.preparar(room, ["#a"], () => "z");
    const p = room.players[room.order[0]]; Object.assign(p, { grid: 0, laps: 0, sector: T.SECTORS - 1, started: false, finish: null });
    Itens.start(room); Robos.largar(room);
    p.ia.plano = { largada: "macio", paradas: [{ volta: 4, composto: "medio" }] }; p.ia.pneu = F1.pneuNovo("macio"); p.ia.sim.pneu = p.ia.pneu; p.pneu = p.pneuAtual = "macio"; p.compostos = ["macio"];
    let parou = null;
    const setor = (q, s) => { q.sector = s; if (s === 0) { if (!q.started) q.started = true; else q.laps++; } };
    const emit = (e, d) => { if (e === "box" && parou == null) parou = d.volta; };
    for (let t = 0; t < 400 && parou == null; t += 0.05) { relogio += 50; Robos.passo(room, 0.05, setor, emit); }
    assert.ok(parou != null && parou <= 3, `parou na volta ${parou}: o macio acabou antes da 4ª volta planejada`);
  } finally { Date.now = agora; }
});
