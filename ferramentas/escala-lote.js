#!/usr/bin/env node
// Escala real em lote (planos/escala-real.md): para cada pista, acha o `scale` que faz a volta de `Pistas.pontos(t, 6)` dar o comprimento real
// (1 u = 0,2083 m) e multiplica pelo mesmo fator o que está em unidade fixa: `minLap`, `flat` e `fall` (pistas.js), a zebra (`dentro`, `fora`)
// e a brita automática (`britaCurvas`) de gps/<id>.js e de SUPERFICIES_ESCAPE. Não mexe em `width`, relevo, muros nem cenário: isso é por pista.
//   node ferramentas/escala-lote.js silverstone=5891 melbourne=5278 ...      (o comprimento real em metros)
"use strict";
const fs = require("fs"), path = require("path");
const RAIZ = path.join(__dirname, ".."), ARQ = path.join(RAIZ, "public/corrida/pistas.js");
const P = require(ARQ), ESC = 0.2083;
// os vértices já vêm multiplicados pelo `scale` de quando o módulo carregou: para medir outro `scale`, multiplica pela razão
const medir = (t, s = t.scale) => P.pontos({ ...t, scale: s, points: t.points.map(([x, y, r]) => [x * s / t.scale, y * s / t.scale, r * s / t.scale]) }, 6).length * 6 * ESC;
let texto = fs.readFileSync(ARQ, "utf8");
const r1 = (x) => Math.round(x * 1000) / 1000, r0 = Math.round;
for (const arg of process.argv.slice(2)) {
  const [id, real] = arg.split("="), alvo = Number(real), t = P.PISTAS[id];
  if (!t || !(alvo > 1000)) { console.error("pista ou comprimento inválido:", arg); process.exit(1); }
  const s0 = t.scale, m0 = medir(t);
  let s = s0 * alvo / m0;
  for (let k = 0; k < 6; k++) s = s * alvo / medir(t, s);
  s = r1(s);
  const f = s / s0, m1 = medir(t, s);
  // a linha de `scale:` do bloco da pista
  const ini = texto.search(new RegExp(`\n  ${id}: \{`)), li = texto.indexOf("scale:", ini), fim = texto.indexOf("\n", li);
  let linha = texto.slice(li, fim);
  const troca = (campo, novo) => { linha = linha.replace(new RegExp(`(^|[ ,{])${campo}: [0-9.]+`), `$1${campo}: ${novo}`); };  troca("scale", s); troca("minLap", r0(t.minLap * f));
  if (t.flat != null) troca("flat", r0(t.flat * f));
  if (t.fall != null) troca("fall", r0(t.fall * f));
  texto = texto.slice(0, li) + linha + texto.slice(fim);
  // SUPERFICIES_ESCAPE: britaCurvas
  texto = texto.replace(new RegExp(`(\n  "${id}": \{[^\n]*?"britaCurvas": )([0-9.]+)`), (_, a, v) => a + r0(v * f));
  // gps/<id>.js: zebra e britaCurvas
  const gps = path.join(RAIZ, "public/corrida/gps", id + ".js");
  if (fs.existsSync(gps)) {
    let g = fs.readFileSync(gps, "utf8");
    g = g.replace(/(zebra: \{[^}]*?dentro: )([0-9.]+)(, fora: )([0-9.]+)/, (_, a, d, b, o) => a + r0(d * f) + b + r0(o * f));
    g = g.replace(/(britaCurvas: )([0-9.]+)/, (_, a, v) => a + r0(v * f));
    fs.writeFileSync(gps, g);
  }
  console.log(`${id}: scale ${s0} -> ${s} (x${f.toFixed(3)}), volta ${r0(m0)} -> ${r0(m1)} m (real ${alvo}), minLap ${t.minLap} -> ${r0(t.minLap * f)}`);
}
fs.writeFileSync(ARQ, texto);
