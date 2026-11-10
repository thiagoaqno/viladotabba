#!/usr/bin/env node
// Lista os trechos de curva de uma pista (frações da volta, a partir da linha de chegada), para conferir as frações do cenário, de
// SUPERFICIES_ESCAPE, de `drs` e de gp-info.js depois de trocar o traçado.   node ferramentas/curvas-da-volta.js barcelona
"use strict";
const P = require("../public/corrida/pistas.js");
const ESC = 0.2083;
for (const id of process.argv.slice(2)) {
  const t = P.PISTAS[id], pts = P.pontos(t, 6), n = pts.length, lim = 1 / 700; // curva: raio abaixo de 700 u (146 m)
  const r3 = (x) => (Math.round(x * 1000) / 1000).toFixed(3);
  console.log(`${id}: ${n} pontos, ${Math.round(n * 6 * ESC)} m`);
  let i0 = -1, kmax = 0, iMax = 0, lado = 0;
  for (let i = 0; i <= n; i++) {
    const p = pts[i % n], k = p.k || 0, curva = i < n && k > lim;
    if (curva && i0 < 0) { i0 = i; kmax = 0; lado = 0; }
    if (curva) { if (k > kmax) { kmax = k; iMax = i; } const a = pts[(i + n - 1) % n], b = pts[(i + 1) % n]; lado += (a.tx * b.ty - a.ty * b.tx); }
    if (!curva && i0 >= 0) {
      if (i - i0 >= 3) console.log(`  ${r3(i0 / n)}-${r3(i / n)}  ápice ${r3(iMax / n)}  raio ${Math.round(1 / kmax * ESC)} m  ${lado > 0 ? "esq" : "dir"}  (${Math.round(i0 * 6 * ESC)} m)`);
      i0 = -1;
    }
  }
}
