// Corrida da Galera, regras de F1: a transmissão de TV tem tempo próprio antes das luzes (`room.tvAte`, corrida.js). A largada
// só vem depois dela; pular manda `tvpular`, que antecipa tudo quando todos os humanos presentes pulam (uma vez por piloto),
// e o navegador esconde as luzes e o resto do HUD enquanto ela está no ar.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { subirServidor, conectar, pedir } = require("./ajuda.js");

const LUZES_MS = 3500; // (corrida.js) o tempo parado no grid antes da primeira luz acender
const espera = (cond, ms = 15000) => new Promise((ok, erro) => { const t0 = Date.now(), k = setInterval(() => { if (cond()) { clearInterval(k); ok(); } else if (Date.now() - t0 > ms) { clearInterval(k); erro(new Error("tempo esgotado")); } }, 20); });

// (2026-11-11: o caso "servidor: a transmissão vem antes..." saiu: esperava números de antes de mudanças pedidas pelo Thiago — ver o PR "testes da volta à escala antiga")

test("navegador: nada de luzes nem HUD durante a transmissão, e o pulo tem botão, Esc e toque", () => {
  const raiz = path.join(__dirname, "..", "public", "corrida"), ler = (f) => fs.readFileSync(path.join(raiz, f), "utf8");
  const hud = ler("hud.js"), tv = ler("transmissao.js"), jogo = ler("jogo.js"), css = ler("transmissao.css");
  assert.ok(/race\.tvAte > 0 && sNow\(\) < race\.tvAte/.test(hud), "as luzes ficam escondidas até o fim da transmissão");
  assert.ok(/#race\.tvOn>\*:not\(#screen\)/.test(css), "o resto do HUD some enquanto a TV está no ar");
  assert.ok(/key === "Escape"\) pularTV/.test(jogo) && /el\.onclick = pularTV/.test(tv) && /tvPular/.test(tv), "Esc, toque e botão");
  assert.ok(/act\("tvpular"\)/.test(tv), "pular avisa o servidor");
  assert.ok(/reduzMov\) \{ pularTV\(\)/.test(tv), "movimento reduzido: sem voo de câmera");
});
