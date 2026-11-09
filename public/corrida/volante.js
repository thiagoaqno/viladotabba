// Corrida da Galera — a sensibilidade do volante (só a ENTRADA do navegador: o servidor e a física recebem o mesmo `steer` de -1 a 1, só que já
// medido por esta curva). Puro e testável; controles.js aplica, teclas.js guarda e a tela Controles ajusta.
(function (root) {
const limite = (v, a, b) => Math.max(a, Math.min(b, v));

// Os limites de cada ajuste (a tela usa os mesmos): k = teclado e toque (o quanto o volante vira com a tecla apertada, 1 = tudo),
// p = controle (o ganho do analógico), zona = a zona morta do analógico.
const LIMITES = { k: [0.3, 1.5], p: [0.5, 1.5], zona: [0, 0.4] };
const PADRAO = { k: 1, p: 1, zona: 0.15 };
const ajustar = (campo, v) => (Number.isFinite(+v) ? limite(+v, LIMITES[campo][0], LIMITES[campo][1]) : PADRAO[campo]);

// O analógico: tira a zona morta, aplica a curva (1,4: macio no centro, firme no fim) e o ganho `sens`; o resultado nunca passa de -1 a 1.
function analogico(x, zona = PADRAO.zona, sens = PADRAO.p) {
  const z = limite(zona, 0, 0.9), a = Math.abs(x || 0);
  if (a < z) return 0;
  return Math.sign(x) * limite(((a - z) / (1 - z)) ** CURVA * sens, 0, 1);
}
// (CURVA 1,8: o centro do analógico mais macio; era 1,4 e o Thiago achou a direção sensível demais, 2026-11-09)
const CURVA = 1.8;
// O teclado e o toque viram o volante em RAMPA, não de uma vez: SOBE por segundo até o batente (~0,4 s) e VOLTA ao soltar.
// Antes a tecla dava o volante inteiro na hora (só a rampa da física, 0,2 s). Toques curtos agora dão correções pequenas.
// O analógico ganha só uma suavização leve. `atual` é o valor do quadro anterior; devolve o novo.
const SOBE = 2.6, VOLTA = 7, SUAVE_ANALOGICO = 14;
function rampa(alvo, atual, dt, digital = true) {
  const d = alvo - atual, t = limite(dt || 0, 0, 0.1);
  if (!digital) return atual + d * Math.min(1, t * SUAVE_ANALOGICO);
  const k = Math.abs(alvo) < Math.abs(atual) || alvo * atual < 0 ? VOLTA : SOBE;
  return atual + limite(d, -t * k, t * k);
}
// O teclado (ou o botão de toque): -1, 0 ou 1 vira o quanto o volante vira (`sens`, de 0,3 a 1,5; acima de 1 só limita em 1).
const teclado = (dir, sens = PADRAO.k) => limite((dir || 0) * sens, -1, 1);

const api = { LIMITES, PADRAO, ajustar, analogico, teclado, rampa, CURVA, SOBE, VOLTA };
if (typeof module !== "undefined" && module.exports) module.exports = api;
else root.Volante = api;
})(typeof self !== "undefined" ? self : this);
