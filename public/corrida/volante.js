// Corrida da Galera — a sensibilidade do volante (só a ENTRADA do navegador: o servidor e a física recebem o mesmo `steer` de -1 a 1, só que já
// medido por esta curva). Puro e testável; controles.js aplica, teclas.js guarda e a tela Controles ajusta.
(function (root) {
const limite = (v, a, b) => Math.max(a, Math.min(b, v));

// Os limites de cada ajuste (a tela usa os mesmos): k = teclado e toque (o quanto o volante vira com a tecla apertada, 1 = tudo),
// p = controle (o ganho do analógico), zona = a zona morta do analógico.
const LIMITES = { k: [0.3, 1.5], p: [0.5, 1.5], zona: [0, 0.4] };
const PADRAO = { k: 1, p: 1, zona: 0.15 };
const ajustar = (campo, v) => (Number.isFinite(+v) ? limite(+v, LIMITES[campo][0], LIMITES[campo][1]) : PADRAO[campo]);

// O analógico: tira a zona morta, aplica a curva (CURVA: macio no centro, firme no fim) e o ganho `sens`; o resultado nunca passa de -1 a 1.
function analogico(x, zona = PADRAO.zona, sens = PADRAO.p) {
  const z = limite(zona, 0, 0.9), a = Math.abs(x || 0);
  if (a < z) return 0;
  return Math.sign(x) * limite(((a - z) / (1 - z)) ** CURVA * sens, 0, 1);
}
// Na escala real a pista ficou com ~metade da largura (12 m contra 25 m): cada toque passou a ocupar o dobro da pista. A física do volante
// e dos robôs não muda; só a ENTRADA do jogador é suavizada, para cada toque voltar a ocupar a mesma fração da pista que ocupava na pista antiga.
// (medido no McLaren padrão, deslocamento 0,6 s após o toque em fração da meia-pista; os números no PR da direção em escala real)
const CURVA = 1.8;              // analógico mais macio no meio do curso, ainda chega a 1 no batente (era 1,4; apertadinha ocupava o dobro da pista)
// O teclado vira em RAMPA (só a entrada do jogador, fora da física): SOBE por segundo até o batente e VOLTA (rápido) ao soltar. Um toque curto
// dá um volante pequeno — a "apertadinha" ocupa a mesma fração da pista estreita que ocupava na larga. Os robôs não passam por aqui.
const SOBE = 3.55, VOLTA = 10;
function rampa(alvo, atual, dt) {
  const d = alvo - atual, t = limite(dt || 0, 0, 0.1);
  const k = Math.abs(alvo) < Math.abs(atual) || alvo * atual < 0 ? VOLTA : SOBE; // voltando ao centro: rápido
  return atual + limite(d, -t * k, t * k);
}
// O teclado (ou o botão de toque): -1, 0 ou 1 vira o quanto o volante vira (`sens`, de 0,3 a 1,5; acima de 1 só limita em 1).
const teclado = (dir, sens = PADRAO.k) => limite((dir || 0) * sens, -1, 1);

const api = { LIMITES, PADRAO, ajustar, analogico, teclado, rampa, CURVA, SOBE, VOLTA };
if (typeof module !== "undefined" && module.exports) module.exports = api;
else root.Volante = api;
})(typeof self !== "undefined" ? self : this);
