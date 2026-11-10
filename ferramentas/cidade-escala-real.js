#!/usr/bin/env node
// Escala real das pistas de rua com mundo de verdade (Baku, Singapura, Las Vegas): o cenário delas vem de kit/<id>/dados.js (OpenStreetMap e
// relevo), gerado numa régua própria (`projecao.k` unidades por metro: Baku 2,41, ou seja 1 u = 0,415 m), e a pista (pistas.js) foi desenhada
// na mesma régua. A física usa 1 u = 0,2083 m (4,8 u por metro). Esta ferramenta passa a cidade INTEIRA para a régua da física: multiplica
// pelo fator f = 4,8 / k todas as coordenadas de dados.js (prédios, mar, parques, árvores, marcos, a grade do relevo) e o `scale` da pista, e
// põe a régua vertical em 4,8 u por metro (`vk`), com o `hills` da pista multiplicado na mesma razão. Assim a pista e o cenário crescem
// juntos e continuam alinhados; as peças que medem em `projecao.k` (prédios, marcos) já saem no tamanho novo.
//   node ferramentas/cidade-escala-real.js <id>
// Depois: `minLap`, `flat` e `fall` (× f), `width` e a linha dos robôs são à parte (ver planos/escala-real.md).
"use strict";
const fs = require("fs"), path = require("path");
const RAIZ = path.join(__dirname, ".."), U_POR_M = 1 / 0.2083;
const id = process.argv[2];
// as regras de cada cidade: como cada chave de dados.js guarda as coordenadas
//   "pt": [x, z] · "pts": [[x, z], ...] · "listaPts": [[[x, z], ...], ...] · "plano:n": [a0..a(n-1), x0, z0, x1, z1, ...] (as n primeiras não são coordenadas)
//   "marcosLV": [{ cx, cz, w, d (unidades), h (metros) }] · "nomePt": [nome, x, z, ...] · "objsP": [{ ..., P: [[x, z], ...] }] (a largura `larg` é em metros) · "mapaPt": { nome: [x, z] } · "grade": { x0, z0 } (o passo é em metros) · "manter": não mexe
const REGRAS = {
  lasvegas: { marcos: "marcosLV", relevo: "grade", lagos: "listaPts", verde: "plano:1", fontes: "pts", arvores: "pts", vias: "plano:2", predios: "plano:2", lugares: "nomePt", frac: "manter", versao: "manter" },
  singapura: { marcos: "mapaPt", frac: "manter", agua: "listaPts", rios: "objsP", pontes: "objsP", piers: "listaPts", verde: "plano:1", campos: "plano:1", arvores: "pts", predios: "plano:2", versao: "manter" },
  baku: { marcos: "mapaPt", relevo: "grade", mar: "pts", piers: "listaPts", verde: "plano:1", muralha: "listaPts", arvores: "pts", predios: "plano:2", frac: "manter", versao: "manter" },
};
const regras = REGRAS[id];
if (!regras) { console.error("cidade sem regras:", id); process.exit(1); }
const ARQ = path.join(RAIZ, `public/corrida/kit/${id}/dados.js`);
const texto = fs.readFileSync(ARQ, "utf8"), i0 = texto.indexOf("export default ");
const cabeca = texto.slice(0, i0), D = JSON.parse(texto.slice(i0 + 15).trim().replace(/;$/, ""));
const k0 = D.projecao.k, vk0 = D.projecao.vk, f = U_POR_M / k0, fv = U_POR_M / vk0;
const r1 = (v) => Math.round(v * 10) / 10;
const pt = (p) => { p[0] = r1(p[0] * f); p[1] = r1(p[1] * f); };
for (const [chave, v] of Object.entries(D)) {
  if (chave === "projecao") continue;
  const r = regras[chave];
  if (!r) { console.error("chave sem regra:", chave); process.exit(1); }
  if (r === "manter") continue;
  if (r === "pt") pt(v);
  else if (r === "pts") v.forEach(pt);
  else if (r === "listaPts") v.forEach((l) => l.forEach(pt));
  else if (r === "marcosLV") v.forEach((m) => { m.cx = r1(m.cx * f); m.cz = r1(m.cz * f); m.w = r1(m.w * f); m.d = r1(m.d * f); });
  else if (r === "nomePt") v.forEach((a) => { a[1] = r1(a[1] * f); a[2] = r1(a[2] * f); });
  else if (r === "objsP") v.forEach((o) => o.P.forEach(pt));
  else if (r === "mapaPt") Object.values(v).forEach(pt);
  else if (r === "grade") { v.x0 = r1(v.x0 * f); v.z0 = r1(v.z0 * f); }
  else if (r.startsWith("plano:")) { const n = Number(r.slice(6)); for (const a of v) for (let i = n; i < a.length; i++) a[i] = r1(a[i] * f); }
}
const P = D.projecao;
P.k = Math.round(P.k * f * 10000) / 10000; P.vk = Math.round(U_POR_M * 10000) / 10000; P.mundo = Math.round(P.mundo * f);
if (P.scale) P.scale = Math.round(P.scale * f * 1000) / 1000;
if (P.cx != null) { P.cx *= f; P.cy *= f; }
fs.writeFileSync(ARQ, cabeca.replace(/1 unidade = [\d.]+ m/, `1 unidade = ${(1 / P.k).toFixed(4)} m`) + "export default " + JSON.stringify(D) + ";\n");
// a pista: o `scale` e o relevo (`hills`: [fração, altura em unidades])
const ARQP = path.join(RAIZ, "public/corrida/pistas.js");
let tp = fs.readFileSync(ARQP, "utf8");
const ini = tp.indexOf(`\n  ${id}: {`), fim = tp.indexOf("\n  },", ini);
let bloco = tp.slice(ini, fim);
bloco = bloco.replace(/scale: ([\d.]+)/, (_, s) => `scale: ${Math.round(Number(s) * f * 1000) / 1000}`);
bloco = bloco.replace(/hills: (\[\[.*?\]\]),/, (_, h) => `hills: ${JSON.stringify(JSON.parse(h).map(([q, a]) => [q, Math.round(a * fv * 10) / 10]))},`);
tp = tp.slice(0, ini) + bloco + tp.slice(fim);
fs.writeFileSync(ARQP, tp);
console.log(JSON.stringify({ id, f: Math.round(f * 10000) / 10000, fv: Math.round(fv * 10000) / 10000, k: P.k, vk: P.vk }));
