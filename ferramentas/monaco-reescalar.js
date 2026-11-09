#!/usr/bin/env node
// Reescala os dados reais de Mônaco (public/corrida/kit/monaco/dados.js) por um fator, sem baixar nada: o mundo todo cresce (ou encolhe) por igual,
// na horizontal e na altura, como o `scale` da pista em pistas.js. Foi como Mônaco foi para a escala real (volta de 3.337 m com 1 u = 0,2083 m):
//
//   node ferramentas/monaco-reescalar.js 1.05306     (= 3.612 ÷ 3.43, o `scale` novo ÷ o antigo)
//
// Multiplica: as posições (marcos, relevo.x0/z0, mar, píeres, piscinas, parques, árvores, prédios), `projecao.k` (unidades por metro), `projecao.vk` (altura por metro)
// e `projecao.mundo`. Não mexe nas alturas dos prédios (meios metros), nas altitudes do relevo (decímetros) nem nas frações da volta.
// Depois, em pistas.js, o `scale` da pista e os números em unidades de altura (`hills`, `alturasMonaco`) levam o mesmo fator. Para gerar do zero (com internet), use monaco-dados.js.
"use strict";
const fs = require("fs");
const path = require("path");

const f = Number(process.argv[2]);
if (!(f > 0.5 && f < 2)) { console.error("uso: node ferramentas/monaco-reescalar.js <fator>"); process.exit(1); }
const arq = path.join(__dirname, "../public/corrida/kit/monaco/dados.js");
const texto = fs.readFileSync(arq, "utf8"), ini = texto.indexOf("export default ");
const cabecalho = texto.slice(0, ini), D = JSON.parse(texto.slice(ini + "export default ".length).replace(/;\s*$/, ""));
const r = Math.round, par = (a) => [r(a[0] * f), r(a[1] * f)];
const lista = (v, de) => v.map((x, i) => (i < de ? x : r(x * f))); // os `de` primeiros são rótulos (altura, tipo...), o resto vem em pares x, z

D.projecao.k = Math.round(D.projecao.k * f * 1e4) / 1e4;
D.projecao.vk = Math.round(D.projecao.vk * f * 1e4) / 1e4;
D.projecao.mundo = Math.round(D.projecao.mundo * f * 10) / 10;
for (const k of Object.keys(D.marcos)) D.marcos[k] = par(D.marcos[k]);
D.relevo.x0 = r(D.relevo.x0 * f); D.relevo.z0 = r(D.relevo.z0 * f);
D.mar = D.mar.map(par);
D.piers = D.piers.map((p) => p.map(par));
D.piscinas = D.piscinas.map((p) => p.map(par));
D.arvores = D.arvores.map(par);
D.verde = D.verde.map((v) => lista(v, 1));
D.predios = D.predios.map((v) => lista(v, 2));

const metros = Math.round((1 / D.projecao.k) * 1e4) / 1e4;
const novo = cabecalho.replace(/1 unidade = [0-9.]+ m/, `1 unidade = ${metros} m`);
fs.writeFileSync(arq, novo + "export default " + JSON.stringify(D) + ";\n");
console.log(`fator ${f}: k ${D.projecao.k} u/m, vk ${D.projecao.vk}, mundo ${D.projecao.mundo}`);
