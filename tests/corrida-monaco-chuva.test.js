const test = require('node:test');
const assert = require('node:assert/strict');
const T = require('../public/corrida/pistas.js');
const F1 = require('../public/corrida/f1-regras.js');
const Robos = require('../corrida-robos.js');
const Direcao = require('../corrida-f1-direcao.js');

test('Mônaco: a descida continua pelo grampo até Portier', () => {
  const pts = T.pontos(T.PISTAS.monaco, 6), n = pts.length;
  const h = f => pts[Math.round(f * n)].h;
  assert.ok(h(.27) > h(.3534) && h(.3534) > h(.3888) && h(.3888) > h(.4353));
  let maior = 0, variacao = 0;
  for (let i = Math.round(.27 * n); i < Math.round(.44 * n); i++) {
    assert.ok(pts[i + 1].h <= pts[i].h + 0.001, `subida inesperada em ${i / n}`);
    maior = Math.max(maior, Math.abs(pts[i + 1].h - pts[i].h));
    if (i > Math.round(.27 * n)) variacao = Math.max(variacao, Math.abs(pts[i + 1].h - 2 * pts[i].h + pts[i - 1].h));
  }
  assert.ok(maior < 1.2, `inclinação excessiva: ${maior}`);
  assert.ok(variacao < .06, `mudança abrupta da inclinação: ${variacao}`);
});

// (2026-11-11: o caso "Mônaco molhado: pelotão passa pelo grampo sem sair da pista" saiu, a pedido do Thiago: o limite de 90 contatos não fazia
// sentido — na main já davam 176 — e em Mônaco os robôs passaram a andar com mais cuidado, corrida-robos.js `transito`)
