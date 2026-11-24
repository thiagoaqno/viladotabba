#!/usr/bin/env node
// Mede a tabela de pneus de cada pista com o simulador de stint (ferramentas/pneus-fisica.js: o piloto ideal com a física do
// carro) e grava public/corrida/f1-pneus-tabela.js, que os robôs leem (public/corrida/f1-pneus-ritmo.js) para escolher a
// estratégia. Roda de novo sempre que os pneus (f1-regras.js) ou a física mudam: o teste de tests/corrida-f1-estrategia.test.js
// confere se a tabela ainda bate com a física.
//
//   node ferramentas/pneus-tabela.js                  (todas as pistas)
//   node ferramentas/pneus-tabela.js interlagos monza (só essas; as outras ficam como estão)
"use strict";
const fs = require("fs");
const path = require("path");
const { Worker, isMainThread, parentPort, workerData } = require("worker_threads");

const ARQUIVO = path.join(__dirname, "..", "public", "corrida", "f1-pneus-tabela.js");

if (!isMainThread) {
  const P = require("./pneus-fisica.js");
  const feito = {}, falhas = [];
  for (const id of workerData.ids) {
    if (!P.temBox(id)) { falhas.push(id); continue; } // pista sem corredor dos boxes não tem parada: os robôs usam a conta padrão
    try { feito[id] = P.tabelaDaPista(id); } catch (e) { console.warn(e.message); falhas.push(id); }
  }
  parentPort.postMessage({ feito, falhas });
} else {
  const T = require("../public/corrida/pistas.js");
  const pedidas = process.argv.slice(2), ids = pedidas.length ? pedidas : Object.keys(T.PISTAS);
  const filas = Array.from({ length: Math.min(4, ids.length) }, () => []);
  ids.forEach((id, i) => filas[i % filas.length].push(id));
  let atual = {};
  try { atual = require(ARQUIVO).TABELAS; } catch (e) { /* primeira vez */ }
  const novas = {}, semTabela = [];
  Promise.all(filas.map((fila) => new Promise((ok, erro) => {
    const w = new Worker(__filename, { workerData: { ids: fila } });
    w.on("message", (m) => { Object.assign(novas, m.feito); semTabela.push(...m.falhas); ok(); }); w.on("error", erro);
  }))).then(() => {
    // (2026-11-21) a escala do robô: o piloto ideal do simulador de stint é bem mais lento que o robô de hoje (Suzuka 70 s contra 44,7 s do
    // `idealDe` da McLaren), mas a parada sai em segundos: a conta achava que parar custava 9% de uma volta, e medido com um robô sozinho custa
    // ~21% (8,7 a 9,0 s em Suzuka, Melbourne e Monza). Os tempos de volta vão para a escala do robô (k = ideal / volta) e o trecho do corredor
    // (`semParada`, medido contra a volta lenta) é dividido por k; o tempo parado fica. A conta dá 8,6 / 8,2 / 8,6 s contra os 8,9 / 8,7 / 9,0 medidos.
    try {
      const Robos = require("../servidor/corrida/corrida-robos.js"), Equipes = require("../public/corrida/f1-equipes.js"), r3 = (x) => Math.round(x * 1000) / 1000;
      for (const [id, tab] of Object.entries(novas)) {
        const k = Robos.idealDe(id, Equipes.specDaEquipe("mclaren")) / tab.volta; if (!(k > 0.3 && k < 1.5)) continue;
        for (const c of Object.values(tab.compostos)) { c.tempos = c.tempos.map((x) => r3(x * k)); c.frio = r3(c.frio * k); }
        const parado = tab.parada - tab.semParada; tab.semParada = r3(tab.semParada / k); tab.parada = r3(parado + tab.semParada); tab.volta = r3(tab.volta * k); tab.escala = r3(k);
      }
    } catch (e) { console.warn("sem a escala do robô:", e.message); }
    const todas = { ...atual, ...novas }; for (const id of semTabela) delete todas[id];
    const ordem = Object.keys(T.PISTAS).filter((id) => todas[id]);
    const linhas = ordem.map((id) => `  ${/^[A-Za-z_$][\w$]*$/.test(id) ? id : JSON.stringify(id)}: ${JSON.stringify(todas[id])},`);
    const txt = `// GERADO por ferramentas/pneus-tabela.js (o simulador de stint com a física do carro): não edite à mão. Para cada pista, o
// tempo da volta de cada composto a cada desgaste (GRADE de f1-pneus-ritmo.js), quanto o piloto ideal gasta o pneu por volta, o
// que o pneu frio perde e o que uma parada custa de verdade.
(function (root) {
const TABELAS = {
${linhas.join("\n")}
};
const api = { TABELAS };
if (typeof module !== "undefined" && module.exports) module.exports = api;
else root.F1PneusTabela = api;
})(typeof window !== "undefined" ? window : globalThis);
`;
    fs.writeFileSync(ARQUIVO, txt.replace(/\r?\n/g, "\r\n"));
    console.log(`gravou ${ordem.length} pistas em ${path.relative(process.cwd(), ARQUIVO)} (${Object.keys(novas).length} medidas agora)`);
  }).catch((e) => { console.error(e); process.exit(1); });
}
