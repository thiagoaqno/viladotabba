// Xangai — a tribuna coberta no tamanho real (peça só desta pista; cópia de ../melbourne/tribuna.js, que vem de ../silverstone/tribuna.js, que foi adaptada de `tribunaCoberta` de ../coberturas.js, que foi desenhada para o carro grande de antes: degrau de 1,25 × 1,77 m
// e a torcida com 0,86 m). Aqui o degrau é o de `tr.escala` (o mesmo do kit/arquibancadas.js: 6 × escala de altura e 9 × escala de fundo, 0,5 × 0,75 m com a escala 0,4), a pessoa tem uns 1,7 m
// (pernas, tronco e cabeça: 8,1 u, 4,8 u por metro) e a cobertura sobe 5 m acima do degrau, não 1,6 m. De frente para +z; o primeiro degrau fica em z = 0 e ela cresce para -z. Origem no chão:
// o `embutido` é um bloco sob o primeiro degrau (a tribuna não é inclinada e a pista é: assim a ponta mais baixa não fica no ar).
import { Montador, solido, tom } from "../montagem.js";

const rnd = (s) => () => ((s = (s * 16807) % 2147483647) / 2147483647);
const PELES = ["#f1c7a5", "#d9a37a", "#a8714a", "#7a4a2a"], CAMISAS = ["#ffffff", "#e63946", "#ffd23f", "#1b1b1b", "#ff7ad9", "#43a047", "#f4f4f4", "#ff8a1f"];

/**
 * @param {number} o.escala `tr.escala` (o degrau: 6 × escala de altura, 9 × escala de fundo)
 * @param {number} [o.comprimento] · @param {number} [o.degraus] · @param {string[]} [o.cores] assentos, alternando a cada seção · @param {number} [o.secoes]
 * @param {number} [o.folga=26] a cobertura acima do degrau da frente (e do de cima) · @param {number} [o.embutido=6] o bloco sob o primeiro degrau, para baixo
 * @returns {THREE.Group} com userData.largura/profundidade/alto
 */
export function tribunaReal({ escala = 1, comprimento = 200, degraus = 12, cores = ["#2f5fd0", "#6a45c8"], secoes = 4, cobertura = "#f6f6f4", estrutura = "#8a9096", vao = 58, publico = 0.3, semente = 7,
  alcance = 0.7, folga = 26, embutido = 6, camisas = CAMISAS } = {}) {
  const m = new Montador(), S = solido(), r = rnd(semente), L = comprimento, altura = 6 * escala, fundo = 9 * escala, D = degraus * fundo, sL = L / secoes, x0 = -L / 2;
  m.caixa(S, [0, -embutido / 2, -D / 2], [L, embutido, D], { cor: tom(estrutura, 0.7) }); // o bloco sob os degraus
  for (let k = 0; k < degraus; k++) {
    const top = (k + 1) * altura, zc = -(k + 0.5) * fundo;
    for (let s = 0; s < secoes; s++) {
      const cor = cores[s % cores.length], xc = x0 + (s + 0.5) * sL;
      m.caixa(S, [xc, top / 2, zc], [sL - 0.4, top, fundo], { cor: tom(cor, 0.78) }); // o espelho
      m.caixa(S, [xc, top + 0.06, zc + fundo * 0.12], [sL - 0.4, 0.2, fundo * 0.7], { cor: tom(cor, 1.18) }); // o assento
      if (publico > 0) for (let q = 0; q < sL - 3; q += 2.6) if (r() < Math.min(0.85, publico * 2.2)) { // (cheia: o `publico` de cada GP vale o dobro, até 85%)
        const px = xc - sL / 2 + 1.6 + q + r() * 0.6, pz = zc - fundo * 0.1, cor2 = camisas[(r() * camisas.length) | 0];
        m.caixa(S, [px, top + 1.7, pz], [1.6, 3.4, 1.3], { cor: "#2b3340" }); // as pernas
        m.caixa(S, [px, top + 3.4 + 1.6, pz], [2.4, 3.2, 1.6], { cor: cor2 }); // o tronco
        m.caixa(S, [px, top + 6.6 + 0.75, pz], [1.5, 1.5, 1.5], { cor: PELES[(r() * 4) | 0] }); // a cabeça
      }
    }
    for (let s = 1; s < secoes; s++) m.caixa(S, [x0 + s * sL, top / 2 + 0.1, zc], [0.6, top + 0.2, fundo], { cor: "#e6e8ea" }); // os corredores entre as seções
    if (k === 0) m.caixa(S, [0, 0.5, 0.6], [L, 1, 1.2], { cor: tom(estrutura, 0.9) });
  }
  // a cobertura sobe com os degraus e cobre só o fundo (`alcance`: a fração de trás); o resto fica a céu aberto, como na foto
  const alto0 = degraus * altura, zf = Math.min(4, -D * (1 - alcance) + 2), degrauEm = (z) => Math.max(0, Math.min(degraus, -z / fundo)) * altura;
  const yf = degrauEm(zf) + folga, yb = alto0 + folga;
  if (cobertura) {
    const zb = -D - 3, len = Math.hypot(zf - zb, yb - yf), ang = Math.atan2(yb - yf, zf - zb), zc = (zf + zb) / 2, yc = (yf + yb) / 2, nt = Math.max(3, Math.round(L / 22)), w = L / nt;
    m.caixa(S, [0, yc - 0.7, zc], [L + 1, 0.5, len], { cor: tom(estrutura, 0.8), rx: ang });
    for (let i = 0; i < nt; i++) m.caixa(S, [x0 + (i + 0.5) * w, yc + 0.1, zc], [w - 1.2, 0.9, len], { cor: cobertura, rx: ang });
    m.caixa(S, [0, yf - 0.3, zf + 0.2], [L + 1, 1.6, 1], { cor: "#ffffff" }); // a testeira do beiral
  }
  const nc = Math.max(1, Math.round(L / vao));
  for (let i = 0; i <= nc; i++) {
    const x = x0 + (L * i) / nc;
    if (cobertura) m.caixa(S, [x, (degrauEm(zf) + yf) / 2 - embutido / 2, zf], [1.2, yf - degrauEm(zf) + embutido, 1.2], { cor: estrutura }); // a coluna da frente desce até o bloco
    m.caixa(S, [x, yb / 2 + 2 - embutido / 2, -D - 2.5], [1.4, yb + 4 + embutido, 1.4], { cor: estrutura });
  }
  const g = m.montar("xangai-tribuna"); g.userData = { largura: L, profundidade: D, alto: yb + 2, torcida: true }; // (torcida: o som de quem passa, torcida-som.js)
  return g;
}
