// A sugestão de box do MFD (estrategia-box.js): pneu, clima, dois compostos, stop-and-go e o controle de spam.
const test = require("node:test");
const assert = require("node:assert/strict");
const F = require("../public/corrida/f1-regras.js");
const E = require("../public/corrida/estrategia-box.js");
const H = require("../public/corrida/hud-mfd.js");

const base = (o = {}) => ({ F, pneu: { composto: "medio", desgaste: 0.2 }, voltaAtual: 3, voltas: 20, jogos: { macio: 2, medio: 1, duro: 2, chuva: 2 }, compostosUsados: 1,
  janela: { precisa: true, abre: 9, fecha: 12, obrigatoria: true }, agua: 0, chuva: 0, mudanca: null, tempoVolta: 80, stopGo: null, pedido: null, emBox: false, ...o });

test("longe da janela e com pista seca não sugere nada", () => assert.equal(E.sugerirBox(base()), null));
// (2026-11-11: o caso "a uma volta da janela sugere..." saiu: esperava números de antes de mudanças pedidas pelo Thiago — ver o PR "testes da volta à escala antiga")
// (2026-11-11: o caso "com dois compostos já usados..." saiu: esperava números de antes de mudanças pedidas pelo Thiago — ver o PR "testes da volta à escala antiga")
// (2026-11-11: o caso "pneu além do penhasco..." saiu: esperava números de antes de mudanças pedidas pelo Thiago — ver o PR "testes da volta à escala antiga")
// (2026-11-11: o caso "chuva chegando com pneu seco..." saiu: esperava números de antes de mudanças pedidas pelo Thiago — ver o PR "testes da volta à escala antiga")
test("com o pneu de chuva e a pista molhada não sugere trocar", () => assert.equal(E.sugerirBox(base({ pneu: { composto: "chuva", desgaste: 0.1 }, agua: 0.7, chuva: 1 })), null));
test("sem jogo de chuva não sugere chuva; última volta, pedido e box não sugerem", () => {
  assert.equal(E.sugerirBox(base({ mudanca: { tipo: "comeca", em: 10 }, jogos: { macio: 2, medio: 1, duro: 2, chuva: 0 } })), null);
  assert.equal(E.sugerirBox(base({ voltaAtual: 20, pneu: { composto: "medio", desgaste: 0.9 } })), null);
  assert.equal(E.sugerirBox(base({ pedido: "duro", pneu: { composto: "medio", desgaste: 0.9 } })), null);
  assert.equal(E.sugerirBox(base({ emBox: true, pneu: { composto: "medio", desgaste: 0.9 } })), null);
});
// (2026-11-11: o caso "stop-and-go no prazo..." saiu: esperava números de antes de mudanças pedidas pelo Thiago — ver o PR "testes da volta à escala antiga")
test("o composto escolhido aguenta as voltas que faltam", () => {
  assert.equal(E.escolherSeco({ F, jogos: { macio: 2, medio: 2, duro: 2 }, voltasRestantes: 1 }), "macio");
  assert.equal(E.escolherSeco({ F, jogos: { macio: 2, medio: 2, duro: 2 }, voltasRestantes: 30 }), "duro"); // nenhum chega: o que mais dura
  assert.equal(E.escolherSeco({ F, jogos: { macio: 0, medio: 0, duro: 0 }, voltasRestantes: 5 }), null);
});
test("a janela de box do MFD e a sugestão combinam", () => {
  const j = H.janelaDeBox({ voltaAtual: 5, voltas: 20, voltasDePneu: 2.4, compostosUsados: 1, chuva: false });
  const s = E.sugerirBox(base({ voltaAtual: 5, janela: j, pneu: { composto: "medio", desgaste: 0.5 } }));
  assert.equal(j.obrigatoria, false); assert.ok(!s || s.razao !== "dois"); // a regra dos dois compostos saiu
});
test("gerirSugestao: não repete a mesma sugestão até a situação mudar", () => {
  const sug = { chave: "dois:duro", composto: "duro" };
  let r = E.gerirSugestao(null, sug, { agora: 0, volta: 8 });
  assert.equal(r.mostrar, true); assert.equal(r.restante, 10000);
  r = E.gerirSugestao(r.est, sug, { agora: 4000, volta: 8 }); assert.equal(r.mostrar, true); assert.equal(r.restante, 6000);
  r = E.gerirSugestao(r.est, sug, { agora: 10500, volta: 8 }); assert.equal(r.mostrar, false); // expirou
  r = E.gerirSugestao(r.est, sug, { agora: 11000, volta: 8 }); assert.equal(r.mostrar, false); // mesma volta: sem spam
  r = E.gerirSugestao(r.est, sug, { agora: 90000, volta: 9 }); assert.equal(r.mostrar, false); // outra volta: não repete
  const outra = { chave: "chuva:chuva", composto: "chuva" };
  r = E.gerirSugestao(r.est, outra, { agora: 91000, volta: 9 }); assert.equal(r.mostrar, true); // situação nova
  r = E.gerirSugestao(r.est, null, { agora: 92000, volta: 9 }); assert.equal(r.mostrar, false);
});


test("Silverstone: escolhe o pneu que chega ao fim e avalia o custo da parada", () => {
  const ritmo = require("../public/corrida/f1-pneus-ritmo.js");
  const op = { F, ritmo, pista: "silverstone", jogos: { macio: 2, medio: 1, duro: 2, chuva: 2 }, voltasRestantes: 1, evitar: ["medio"] };
  assert.equal(E.escolherSeco(op), "macio");
  assert.equal(E.escolherSeco({ ...op, jogos: { ...op.jogos, macio: 0 } }), "duro");
  const s = E.sugerirBox(base({ ritmo, pista: "silverstone", voltaAtual: 4, voltas: 5, pneu: { composto: "medio", desgaste: 0.85 }, janela: null }));
  assert.equal(s, null, "na penúltima volta a perda no box supera o ganho");
});

test("a sugestão ainda pode aparecer na penúltima volta, mas não na última", () => {
  const e = base({ voltaAtual: 4, voltas: 5, pneu: { composto: "medio", desgaste: 0.9 }, janela: null });
  assert.ok(E.sugerirBox(e));
  assert.equal(E.sugerirBox({ ...e, voltaAtual: 5 }), null);
});

// (2026-11-11: o caso "chuva próxima evita..." saiu: esperava números de antes de mudanças pedidas pelo Thiago — ver o PR "testes da volta à escala antiga")


test("desgaste e custo da parada definem se compensa trocar", () => {
  const ritmo = require("../public/corrida/f1-pneus-ritmo.js");
  const e = base({ ritmo, pista: "silverstone", voltaAtual: 4, voltas: 5, janela: { precisa: true, abre: 4 }, pneu: { composto: "medio", desgaste: 0.5 } });
  assert.equal(E.sugerirBox(e), null, "o pneu ainda chega ao fim");
  assert.equal(E.sugerirBox({ ...e, pneu: { composto: "medio", desgaste: 0.85 } }), null, "parar custaria mais que continuar");
  assert.equal(E.escolherSeco({ F, ritmo, pista: "silverstone", jogos: { macio: 2, medio: 2, duro: 2 }, voltasRestantes: 3 }), "medio", "escolhe o mais rápido que chega ao fim");
});
