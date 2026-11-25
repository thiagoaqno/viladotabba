import test from 'node:test';
import assert from 'node:assert/strict';
import { inclinacao } from '../public/corrida/inclinacao.js';
const tr = { W: 100 }, sim = { quadro: (_tr, x, y) => ({ lat: y, h: 20 + x * 0.1 }) };
const terreno = (_tr, x, y) => 20 + x * 0.1 - Math.max(0, Math.abs(y) - 50) * 3;
// (2026-11-24: apagado o teste "na borda o carro acompanha o asfalto...", que quebrou na main com window is not defined; pedido do Thiago)
test('fora da pista ou no modo clássico continua acompanhando o terreno', () => {
  const fora = inclinacao(tr, 0, 75, 0, 0, 40, 40, 0, false, 0, true, sim, terreno);
  const classico = inclinacao(tr, 0, 49, 0, 0, 40, 20, 0, false, 0, false, sim, terreno);
  assert.ok(fora.roll < -0.1); assert.ok(classico.roll < -0.1);
});
