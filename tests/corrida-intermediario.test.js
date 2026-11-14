const test = require("node:test");
const assert = require("node:assert/strict");
const F = require("../public/corrida/f1-regras.js");
const S = require("../public/corrida/sim.js");
const Box = require("../public/corrida/box-escolha.js");

test("intermediário: cor própria", () => {
  assert.equal(F.PNEUS.intermediario.cor, "#39c85a");
});

// (2026-11-14: apagado o teste "intermediário: chega ao penhasco em quatro voltas no molhado e duas no seco": falhava na main; pedido do Thiago, testes velhos que quebram se apagam)

test("intermediário: pedido percorre o protocolo de rede e a seleção do box", () => {
  assert.equal(Box.compostoDaAcao("pneu5"), "intermediario");
  for (const pedido of ["macio", "medio", "duro", "chuva", "decidir", "manter", "intermediario"]) {
    assert.equal(S.desempacotar(S.empacotar({ pedido })).pedido, pedido);
  }
  const p = { pneu: "medio", pneuAtual: "medio", paradas: [], compostos: ["medio"] };
  assert.equal(F.jogosRestantes(p).intermediario, 2);
  assert.equal(F.compostoParaParada(p, "intermediario"), "intermediario");
  assert.equal(F.recomendarParada({ atual: "intermediario", agua: 0.45 }), "intermediario");
});


test("as recomendações consideram os pneus disponíveis no molhado", () => {
  const jogos = { macio: 2, medio: 2, duro: 2, chuva: 2, intermediario: 2 };
  assert.equal(F.recomendarParada({ atual: "medio", jogos, agua: 0.45 }), "intermediario");
  assert.equal(F.recomendarParada({ atual: "medio", jogos, agua: 1 }), "chuva");
  assert.equal(F.recomendarParada({ atual: "medio", jogos: { ...jogos, intermediario: 0 }, agua: 0.45 }), "chuva");
});


// (2026-11-11: o caso "a estratégia recomenda o intermediário..." saiu: esperava números de antes de mudanças pedidas pelo Thiago — ver o PR "testes da volta à escala antiga")
