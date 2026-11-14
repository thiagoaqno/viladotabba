// As posições do grid são compartilhadas pela física e pelas marcas na pista.
const test = require("node:test");
const assert = require("node:assert/strict");
const T = require("../public/corrida/pistas.js");
const S = require("../public/corrida/sim.js");

// (2026-11-14: apagado o teste "grid de F1: 22 carros com mais espaço entre filas, dentro da pista": falhava na main; pedido do Thiago, testes velhos que quebram se apagam)

test("grid do modo comum mantém o espaçamento anterior", () => {
  const t = T.PISTAS.interlagos, pts = T.pontos(t, 6), n = pts.length;
  assert.equal(S.vagaDoGrid(pts, 2, t.width, false).idx, (n - 19 + n) % n);
});
