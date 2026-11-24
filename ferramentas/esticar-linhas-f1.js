// Estica a linha de corrida já salva de cada pista (corrida-piloto.js, `esticarLinhaDaPista`): onde trocar um trecho pela reta entre as pontas baixa
// o tempo de volta, fica a reta (o "S" desnecessário numa chicane, por exemplo). Guarda em corrida-linhas-f1.json só se a volta ficou mais rápida.
// `node ferramentas/esticar-linhas-f1.js [pistas...]` (sem pistas: todas as salvas, menos Mônaco, que ficou com a linha antiga de propósito: #868)
"use strict";
const fs = require("fs"), path = require("path");
const T = require("../public/corrida/pistas.js"), F1 = require("../public/corrida/f1-regras.js"), Equipes = require("../public/corrida/f1-equipes.js");
const Piloto = require("../servidor/corrida/corrida-piloto.js");
const ARQ = path.join(__dirname, "..", "servidor", "corrida", "corrida-linhas-f1.json"), PASSO_NO = 8;
const salvo = JSON.parse(fs.readFileSync(ARQ, "utf8"));
const spec = Equipes.specDaEquipe("mclaren"), ref = F1.aderencia({ composto: "medio", desgaste: 0, temp: 1 });
const pedidas = process.argv.slice(2), pistas = pedidas.length ? pedidas : Object.keys(salvo).filter((id) => id !== "monaco" && T.PISTAS[id]);
for (const id of pistas) {
  T.usarEscala(id);
  const t = T.PISTAS[id], pts = T.pontos(t, 6), n = pts.length, inicio = Date.now();
  if (!salvo[id] || salvo[id].n !== n) { console.log(id, "sem linha salva para este traçado"); continue; }
  const lat0 = Piloto.linhaDaPista(id, t, pts, spec, ref), r = Piloto.esticarLinhaDaPista(t, pts, spec, ref, lat0, { passo: PASSO_NO });
  const ganho = r.antes - r.tempo, m = Math.floor(n / PASSO_NO);
  if (ganho > 0.005) salvo[id] = { n, nos: Array.from({ length: m }, (_, a) => Math.round(r.lat[Math.round((a * n) / m) % n] * 10) / 10) };
  fs.writeFileSync(ARQ, "{\n" + Object.keys(salvo).sort().map((k) => JSON.stringify(k) + ":" + JSON.stringify(salvo[k])).join(",\n") + "\n}\n");
  console.log(id.padEnd(12), "volta do modelo", r.antes.toFixed(3), "→", r.tempo.toFixed(3), "s", `(${ganho > 0.005 ? "−" + ganho.toFixed(3) + " s, guardada" : "sem ganho"})`, r.trocas, "trechos esticados", ((Date.now() - inicio) / 1000).toFixed(0) + " s");
}
