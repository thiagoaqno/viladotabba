#!/usr/bin/env node
// Escala real em lote, a segunda parte (planos/escala-real.md): cola em public/corrida/pistas.js o relevo e as barreiras que
// ferramentas/pista-real.js imprimiu para cada pista (um arquivo <id>.txt por pista numa pasta) e põe a largura nova.
//   node ferramentas/escala-relevo-lote.js <pasta das saídas> <largura em metros> <id> [id...]
// Regras da receita: `hills` da ferramenta com `hillsSuave: true`; `muros` da ferramenta só se a barreira mapeada faltar em menos de 30% da
// volta em CADA lado; senão a pista fica sem `muros` (a regra automática). `width` = metros ÷ 0,2083.
"use strict";
const fs = require("fs"), path = require("path");
const ARQ = path.join(__dirname, "../public/corrida/pistas.js");
const [pasta, metros, ...ids] = process.argv.slice(2);
if (!pasta || !(Number(metros) > 5) || !ids.length) { console.error("uso: node ferramentas/escala-relevo-lote.js <pasta> <metros> <id>..."); process.exit(1); }
const W = Math.round(Number(metros) / 0.2083);
let texto = fs.readFileSync(ARQ, "utf8");
const NL = texto.includes("\r\n") ? "\r\n" : "\n";
for (const id of ids) {
  const saida = fs.readFileSync(path.join(pasta, id + ".txt"), "utf8").split(/\r?\n/);
  const resumo = saida.filter((l) => l.startsWith("// ")), hills = saida.find((l) => l.startsWith("hills: ")), muros = saida.find((l) => l.startsWith("muros: "));
  const sem = /lado 1 sem barreira em (\d+)%, lado -1 em (\d+)%/.exec(saida.join("\n"));
  if (!hills || !sem) throw new Error(`${id}: saída da ferramenta incompleta`);
  const usaMuros = Number(sem[1]) < 30 && Number(sem[2]) < 30;
  // o bloco da pista: da linha `  id: {` até a linha `points: [`
  const ini = texto.search(new RegExp(`\\n  ${id}: \\{`)), fimBloco = texto.indexOf("points: [", ini);
  let bloco = texto.slice(ini, fimBloco);
  bloco = bloco.replace(/width: \d+/, `width: ${W}`);
  if (!/hillsSuave: true/.test(bloco)) bloco = bloco.replace(/(scale: [^\n]*?)(,?\r?\n)/, (_, a, b) => a.replace(/,\s*$/, "") + ", hillsSuave: true," + b.replace(/^,/, ""));
  bloco = bloco.replace(/ *hills: \[[^\n]*\n/, "").replace(/ *muros: \[[^\n]*\n/, "");
  const nota = `    // ESCALA REAL (lote): \`width\` ${W} u = ${metros} m (a largura do circuito não está publicada: ${metros} m é o mínimo da FIA, estimativa). Relevo e barreiras de ferramentas/pista-real.js ${resumo.length ? "(" + resumo.map((l) => l.slice(3)).join("; ") + ")" : ""}; ${usaMuros ? "`muros` da ferramenta (barreira mapeada em mais de 70% de cada lado)" : "sem `muros`: a barreira mapeada falta em 30% ou mais de um lado, vale a regra automática"}.`;
  const novo = nota + NL + "    " + hills + NL + (usaMuros ? "    " + muros + NL : "") + "    ";
  bloco = bloco.replace(/\s*$/, NL) ; // termina a parte de cima numa linha nova
  texto = texto.slice(0, ini) + bloco.replace(/ *$/, "") + novo + texto.slice(fimBloco);
  console.log(`${id}: width ${W}, ${usaMuros ? "muros da ferramenta" : "sem muros"} (sem barreira: ${sem[1]}% / ${sem[2]}%)`);
}
fs.writeFileSync(ARQ, texto);
