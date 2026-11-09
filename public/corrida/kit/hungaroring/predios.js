// Hungaroring — o prédio dos boxes (peça só desta pista), copiado do prédio de Spa (kit/spa/predios.js) e adaptado: painéis claros no térreo, faixa de vidro escuro, o Paddock Club recuado com o
// terraço e o teto branco, pontas de painel cinza com a faixa azul e a torre de controle de vidro. Só achei descrições em texto do circuito (o prédio dos boxes e a tribuna principal foram reconstruídos; a tribuna principal é a única coberta), nenhuma foto a que eu tivesse acesso:
// as cores são uma estimativa. A cor das garagens é a das equipes de hoje. Todo em `Montador` (kit 2: cor chapada por vértice), origem no chão, a frente para +z, as medidas em unidades do jogo (1 u = 0,2083 m).
import * as THREE from "three";
import { Montador, solido, vidro, comTextura, letreiro } from "../montagem.js";

const COR_PORTA = ["#e10600", "#ff8700", "#27f4d2", "#3671c6", "#229971", "#37bedd", "#ff87bc", "#6692ff", "#b6babd", "#d7172f"]; // as dez garagens, em cores de equipe

/**
 * O prédio das garagens do Hungaroring (reconstruído nos anos 2020: painéis claros, vidro escuro e o terraço do Paddock Club): origem no meio da FRENTE, no chão; a frente (as portas) para +z e o prédio para trás (-z); o comprimento ao longo de x.
 * @param {object} o { comprimento=600, fundo=46, torre=0 (x da torre de controle, ou null) }
 * @returns {THREE.Group} com userData.comprimento/fundo/alto
 */
export function predioDosBoxes({ comprimento: L = 600, fundo: F = 46, torre = 0 } = {}) {
  const m = new Montador(), S = solido(), V = vidro(), concreto = "#d3d5d6", cinza = "#8d949b", branco = "#f1f2f3", tijolo = "#c5c9cd", escuro = "#2b2f36", azul = "#1d4f9a";
  const ponta = 38, meio = L - ponta * 2; // as pontas de painel claro e o miolo de vidro
  // o térreo: concreto, as vinte portas de garagem (cada uma com o friso na cor de uma equipe) e a marquise
  m.caixa(S, [0, 13, -F / 2], [L, 26, F], { cor: concreto });
  const ng = Math.max(4, Math.round(meio / 28));
  for (let k = 0; k < ng; k++) {
    const x = -meio / 2 + (k + 0.5) * (meio / ng);
    m.caixa(S, [x, 9.5, 0.35], [21, 18, 0.8], { cor: "#454b55" });
    for (let y = 2; y < 18; y += 3.2) m.caixa(S, [x, y, 0.8], [21, 0.5, 0.4], { cor: "#5a616c" }); // as réguas do portão enrolado
    m.caixa(S, [x, 19.6, 0.7], [21, 2, 1], { cor: COR_PORTA[k % COR_PORTA.length] });
  }
  m.caixa(S, [0, 27, 3], [meio + 6, 1.6, 8], { cor: branco }); // a marquise sobre as portas
  // o primeiro andar: faixa de vidro com os montantes, e o terraço do Paddock Club (a laje)
  m.caixa(V, [0, 36.5, -1], [meio, 17, 2], { cor: "#36586f" });
  for (let x = -meio / 2; x <= meio / 2 + 0.1; x += 13) m.caixa(S, [x, 36.5, 0.2], [0.9, 17, 1.2], { cor: cinza });
  m.caixa(S, [0, 28, 0.2], [meio, 1.2, 1.6], { cor: cinza }); m.caixa(S, [0, 45.3, 0.4], [meio, 1.2, 2], { cor: cinza });
  m.caixa(S, [0, 45.6, -F / 2 + 4], [meio, 1.2, F - 8], { cor: branco }); // a laje do terraço
  // o Paddock Club: recuado 8, também de vidro, com o parapeito do terraço e o teto branco
  m.caixa(V, [0, 54.5, -9], [meio - 20, 17, 1.6], { cor: "#3a5d75" });
  for (let x = -(meio - 20) / 2; x <= (meio - 20) / 2 + 0.1; x += 11) m.caixa(S, [x, 54.5, -8.4], [0.8, 17, 1], { cor: cinza });
  m.caixa(S, [0, 64.8, -F / 2 - 2], [meio - 16, 1.8, F - 12], { cor: "#f4f5f6" }); // o teto, com beiral para a frente
  m.caixa(S, [0, 66, -8.5], [meio - 14, 1.2, 1], { cor: branco }); // a testeira
  for (const x of [-meio * 0.31, meio * 0.18, meio * 0.38]) m.caixa(S, [x, 68, -F * 0.6], [24, 4.2, 12], { cor: "#cbd0d4" }); // as caixas de ar
  for (let x = -meio / 2; x <= meio / 2 + 0.1; x += 6) m.caixa(S, [x, 48, 0.6], [0.4, 2.6, 0.4], { cor: cinza }); // o guarda-corpo do terraço (postes)
  m.caixa(S, [0, 49.1, 0.6], [meio, 0.4, 0.5], { cor: cinza });
  // as duas duas pontas de painel cinza-claro com uma faixa azul, e a platibanda branca
  for (const s of [-1, 1]) {
    m.caixa(S, [s * (L / 2 - ponta / 2), 33, -F / 2], [ponta, 66, F], { cor: tijolo });
    m.caixa(S, [s * (L / 2 - ponta / 2), 66.6, -F / 2], [ponta + 1.6, 1.8, F + 1.6], { cor: branco });
    m.caixa(S, [s * (L / 2 - ponta / 2), 30, 0.4], [ponta - 6, 3, 0.8], { cor: azul }); // a faixa azul
    for (let y = 8; y < 60; y += 12) m.caixa(V, [s * (L / 2 - ponta / 2), y + 4, 0.35], [ponta - 14, 6, 0.6], { cor: "#2c3e4c" }); // as janelas estreitas
  }
  // a faixa do circuito no beiral do teto (de frente para os carros)
  const faixa = comTextura(letreiro("HUNGARORING  ·  MAGYAR NAGYDÍJ", { fundo: "#15161a", cor: "#ffd100", w: 1024, h: 64, traco: false }));
  m.plano(faixa, [0, 60, -8], [Math.min(meio - 40, 300), 6.4]);
  m.plano(faixa, [0, 60, -8.1], [Math.min(meio - 40, 300), 6.4], { ry: Math.PI });
  // a torre de controle: fuste de concreto, a cabine de vidro em volta, laje, mastro e antenas
  if (torre !== null) {
    const tz = -F / 2 - 2;
    m.caixa(S, [torre, 62, tz], [22, 124, 22], { cor: "#c9cbc8" });
    m.caixa(S, [torre, 126, tz], [34, 3, 34], { cor: "#7f858c" });
    m.caixa(V, [torre, 137, tz], [46, 17, 40], { cor: "#2f4b60" });
    for (let x = -22; x <= 22.1; x += 11) m.caixa(S, [torre + x, 137, tz + 20.2], [0.9, 17, 0.9], { cor: "#d7dce0" });
    m.caixa(S, [torre, 147, tz], [52, 2.4, 46], { cor: "#e6e8ea" });
    m.cilindro(S, [torre + 10, 168, tz], [0.9, 42], { cor: "#d9d9d9", seg: 6 });
    m.caixa(S, [torre - 12, 152, tz], [3, 5, 3], { cor: "#b3b8bd" });
    for (const [a, y] of [[0.5, 158], [-0.7, 162]]) m.caixa(S, [torre + 10 + a * 3, y, tz], [7, 0.6, 0.6], { cor: "#d9d9d9" });
    m.caixa(S, [torre, 116, tz + 11.6], [14, 4, 0.8], { cor: "#e10600" }); // a faixa vermelha na frente do fuste
  }
  const g = m.montar("hungaroring-predio-boxes"); g.userData = { comprimento: L, fundo: F, alto: 124 };
  return g;
}

