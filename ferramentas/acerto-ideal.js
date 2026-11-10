#!/usr/bin/env node
// O MELHOR ACERTO de cada pista (asa e altura, de 0 a 1), medido com a física do jogo: uma volta calculada (sem volante) com os números do
// carro de F1 de dinamica.js (massa, potência, pneu `mu`, carga `ClA`, arrasto `CdA`) e o acerto de sim.js (`extraDoAcerto`):
//   - em cada ponto da pista, a velocidade máxima que o pneu segura na curva, com a carga da asa naquela velocidade (v² k = mu (g + carga/m));
//   - para a frente, a aceleração da potência menos o arrasto; para trás, a freada que o pneu segura (com a carga); o menor dos três;
//   - sem teto de velocidade, como no jogo: a reta acaba onde a potência empata com o arrasto.
// Tenta 21 × 21 acertos e fica com o de menor tempo de volta. É a conta do jogo, mas sem o piloto: o tempo absoluto não é o de uma volta
// jogada; o que vale é a comparação entre acertos na mesma pista. Grava public/corrida/acerto-ideal.json (o estrategista lê dali).
//   node ferramentas/acerto-ideal.js [id ...]
"use strict";
const fs = require("fs"), path = require("path");
const RAIZ = path.join(__dirname, "..");
const P = require(path.join(RAIZ, "public/corrida/pistas.js"));
const D = require(path.join(RAIZ, "public/corrida/dinamica.js"));
const Sim = require(path.join(RAIZ, "public/corrida/sim.js"));
const F1 = require(path.join(RAIZ, "public/corrida/f1-regras.js"));
const Equipes = require(path.join(RAIZ, "public/corrida/f1-equipes.js"));
const ESC = D.ESC, G = D.G, RHO = D.RHO;
const spec = Equipes.specDaMontagem(Equipes.montagemPadrao ? Equipes.montagemPadrao() : { motor: 3, aero: 3, chassi: 3, freios: 3, suspensao: 3, confiab: 3 });
const pr = D.parametros(spec), vTeto = 150; // m/s: só um limite da conta (o jogo não tem mais teto: a velocidade final sai da potência contra o arrasto)

function curvaturas(pts) { // 1/m, pela circunferência por três pontos (i-3, i, i+3), média de 5
  const n = pts.length, k = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const a = pts[(i - 3 + n) % n], b = pts[i], c = pts[(i + 3) % n];
    const ab = Math.hypot(b.x - a.x, b.y - a.y), bc = Math.hypot(c.x - b.x, c.y - b.y), ca = Math.hypot(a.x - c.x, a.y - c.y);
    const area2 = Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
    k[i] = ab && bc && ca ? (2 * area2) / (ab * bc * ca) / ESC : 0;
  }
  const s = new Float64Array(n); for (let i = 0; i < n; i++) { let t = 0; for (let j = -2; j <= 2; j++) t += k[(i + j + n) % n]; s[i] = t / 5; }
  return s;
}
const ex = {};
const carga = (a, vm) => Sim.extraDoAcerto(a, vm / ESC, ex).carga;
const arrasto = (a, vm) => Sim.extraDoAcerto(a, vm / ESC, ex).arrasto;
function vCurva(a, k) { // a maior velocidade que o pneu segura nessa curvatura, com a carga dessa velocidade (3 voltas da conta)
  let v = vTeto;
  for (let it = 0; it < 4; it++) {
    const den = k - (pr.mu * 0.5 * RHO * pr.ClA * carga(a, v)) / pr.massa;
    v = den <= 0 ? vTeto : Math.min(vTeto, Math.sqrt((pr.mu * G) / den));
  }
  return v;
}
function volta(a, k, ds) {
  const n = k.length, lim = new Float64Array(n);
  for (let i = 0; i < n; i++) lim[i] = vCurva(a, k[i]);
  const v = Float64Array.from(lim);
  for (let passada = 0; passada < 2; passada++) { // a pista é uma volta: duas passadas acertam a emenda
    for (let i = 0; i < n; i++) { // acelerando
      const j = (i + 1) % n, u = Math.max(v[i], 5), q = 0.5 * RHO * u * u;
      const acc = (pr.eta * pr.Ppico / u - q * pr.CdA * arrasto(a, u) - pr.crr * (pr.W + q * pr.ClA * carga(a, u))) / pr.massa;
      v[j] = Math.min(v[j], Math.sqrt(Math.max(0, u * u + 2 * Math.max(0, acc) * ds)));
    }
    for (let i = n - 1; i >= 0; i--) { // freando (de trás para a frente)
      const j = (i + 1) % n, u = v[j], q = 0.5 * RHO * u * u;
      const dec = pr.mu * (G + (q * pr.ClA * carga(a, u)) / pr.massa) + (q * pr.CdA * arrasto(a, u)) / pr.massa;
      v[i] = Math.min(v[i], Math.sqrt(u * u + 2 * dec * ds));
    }
  }
  let t = 0; for (let i = 0; i < n; i++) t += ds / Math.max(1, (v[i] + v[(i + 1) % n]) / 2);
  return t;
}
const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(P.PISTAS);
const ARQ = path.join(RAIZ, "public/corrida/acerto-ideal.json");
const saida = fs.existsSync(ARQ) ? JSON.parse(fs.readFileSync(ARQ, "utf8")) : {};
for (const id of ids) {
  const t = P.PISTAS[id]; if (!t) continue;
  const pts = P.pontos(t, 6), k = curvaturas(pts), ds = 6 * ESC;
  let melhor = null;
  for (let ia = 0; ia <= 20; ia++) for (let ih = 0; ih <= 20; ih++) {
    const a = { asa: ia / 20, altura: ih / 20 }, tempo = volta(a, k, ds);
    if (!melhor || tempo < melhor.tempo - 1e-9) melhor = { ...a, tempo };
  }
  const padrao = volta(Sim.ACERTO_PADRAO, k, ds);
  saida[id] = { asa: melhor.asa, altura: melhor.altura, ganho: Math.round((padrao - melhor.tempo) * 1000) / 1000 };
  console.log(`${id.padEnd(12)} asa ${melhor.asa.toFixed(2)} altura ${melhor.altura.toFixed(2)}  ${melhor.tempo.toFixed(2)} s (padrão ${padrao.toFixed(2)} s, ganho ${(padrao - melhor.tempo).toFixed(2)} s)`);
}
fs.writeFileSync(ARQ, JSON.stringify(saida, null, 1) + "\n");
