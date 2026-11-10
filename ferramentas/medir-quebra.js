// Mede, por pista, o desnível, a inclinação máxima e a maior QUEBRA de inclinação a cada 6 u (a receita: abaixo de 0,34% o carro não decola).
// node ferramentas/medir-quebra.js monza barcelona
"use strict";
const P = require("../public/corrida/pistas.js");
const ESC = 0.2083;
for (const id of process.argv.slice(2)) {
  const t = P.PISTAS[id];
  if (!t) { console.error("pista?", id); continue; }
  const pts = P.pontos(t, 6);
  const n = pts.length;
  // altura de cada ponto em metros
  const z = pts.map((p) => p.h * ESC);
  let dzMin = Infinity, dzMax = -Infinity;
  for (const v of z) { if (v < dzMin) dzMin = v; if (v > dzMax) dzMax = v; }
  // inclinação entre pontos consecutivos (6 u = 6*ESC metros)
  const d = 6 * ESC;
  const incl = [];
  for (let i = 0; i < n; i++) { const a = z[i], b = z[(i + 1) % n]; incl.push((b - a) / d); }
  let inclMax = 0, iMax = 0;
  incl.forEach((v, i) => { if (Math.abs(v) > inclMax) { inclMax = Math.abs(v); iMax = i; } });
  // quebra de inclinação a cada 6 u = diferença entre inclinações consecutivas
  let quebraMax = 0, iQ = 0;
  for (let i = 0; i < n; i++) { const q = Math.abs(incl[(i + 1) % n] - incl[i]); if (q > quebraMax) { quebraMax = q; iQ = i; } }
  console.log(`${id}: volta ${Math.round(n * 6 * ESC)} m, ${n} pontos`);
  console.log(`  desnivel ${(dzMax - dzMin).toFixed(1)} m`);
  console.log(`  inclinacao max ${(inclMax * 100).toFixed(2)}% em ${(iMax / n).toFixed(3)}`);
  console.log(`  quebra max a cada 6u ${(quebraMax * 100).toFixed(2)}% em ${(iQ / n).toFixed(3)} (limite Spa 0,34%)`);
}
