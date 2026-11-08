// Desempenho da pista (sobretudo Mônaco, que travava): conta, sem WebGL, o que o navegador teria de desenhar (tests/ajuda-cena/medir.mjs)
// e segura os tetos. Antes de juntar as malhas paradas (kit/fundir.js), Mônaco tinha 920 malhas e 371 chamadas de desenho por
// quadro na vista do jogo (414 com as sombras); agora tem ~270 malhas e ~160 chamadas. Os tetos têm uma folga de uns 25%.
const test = require("node:test");
const assert = require("node:assert/strict");

test("Mônaco: poucas malhas, poucas chamadas de desenho por quadro e poucos materiais", { timeout: 120000 }, async () => {
  const { medir } = await import("./ajuda-cena/medir.mjs");
  const m = await medir("monaco");
  // O teto de malhas da cena de Mônaco subiu de 340 para 380 (só para Mônaco, autorizado pelo Thiago): o cenário tem agora a galera, os fiscais, as hospitalidades, o Fairmont e o pit lane de verdade. As chamadas de
  // desenho por quadro (o que pesa na placa) continuam com os mesmos tetos abaixo, porque as malhas fora da câmera não são desenhadas.
  assert.ok(m.malhasNaCena <= 380, `${m.malhasNaCena} malhas (teto 380)`);
  assert.ok(m.camera.chamadas <= 200, `${m.camera.chamadas} chamadas por quadro na vista do jogo (teto 200)`);
  assert.ok(m.camera.chamadasTotalComSombra <= 240, `${m.camera.chamadasTotalComSombra} com as sombras (teto 240)`);
  assert.ok(m.camera.triangulos <= 330000, `${m.camera.triangulos} triângulos na vista (teto 330 mil)`);
  assert.ok(m.materiais <= 210, `${m.materiais} materiais (teto 210)`);
  assert.equal(m.luzesNaPista, 0, "a pista não tem luz própria: só o sol e o céu da cena");
});

test("as pistas do calendário e as antigas montam com um teto de malhas", { timeout: 600000 }, async (t) => {
  const { montar } = await import("./ajuda-cena/index.mjs");
  const { contar } = await import("./ajuda-cena/medir.mjs");
  const T = require("../public/corrida/pistas.js");
  for (const id of Object.keys(T.PISTAS)) {
    await t.test(id, async () => {
      const { tr, THREE } = await montar(id);
      const c = contar(THREE, tr.grp);
      assert.ok(c.malhas <= 520, `${id}: ${c.malhas} malhas (teto 520)`);
      const f = tr.fundido;
      assert.ok(f && f.malhasDepois - f.instanciadasExtras <= f.malhasAntes,
        `${id}: a fusão não pode aumentar as malhas fora da divisão por região (${f?.malhasAntes} -> ${f?.malhasDepois}, ${f?.instanciadasExtras} extras)`);
    });
  }
});
