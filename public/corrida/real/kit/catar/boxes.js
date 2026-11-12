// Catar (Lusail) — o prédio dos boxes de 2023, o mais comprido do mundo: 402 m ao longo do corredor, com 50 garagens no térreo (Guinness, via Ashghal: marhaba.qa; Tilke, tilke.de/portfolio/lusail-race-track-qatar).
// Do projeto da Tilke: fachada retilínea e branca; no térreo, a grade de garagens interrompida pelas saliências do andar de cima; faixas horizontais brancas (as bordas das lajes) sobre o térreo e o primeiro andar; nos andares de cima,
// volumes cúbicos que avançam e que recuam, criando luz e sombra; a torre de controle de prova na ponta do sul (que, na reta que sobe para o noroeste, é a de entrada do corredor); e, na ponta do norte, os terraços do Paddock Club
// ligados por uma escada em espiral cercada de colunas de aço em V, mais uma plataforma de aço sobre a linha de largada (Tilke). Quatro telões ficam em cima do prédio, de frente para a arquibancada principal (oversteer48.com, Main Grandstand).
// Medidas: o comprimento (402 m = 1 930 u) e o número de garagens (50) são da fonte; o pé-direito das garagens (5 m), os andares de 4 m, a profundidade (31 m) e a torre (30 m) são ESTIMADAS das fotos (a fonte não dá).
// Cada garagem tem a sua cor de equipe e o seu jeito (aberta com a luz acesa, ou de porta fechada), os volumes do andar de cima são sorteados em grupos de 2 a 4 garagens: o prédio não repete um módulo em fila.
// Tudo em cor chapada por vértice (kit/montagem.js), dividido em regiões: algumas chamadas de desenho para o prédio inteiro. De noite as janelas, as garagens abertas e os telões acendem.
import * as THREE from "three";
import { vidro } from "../montagem.js";
import { recortar, sorteio } from "../comum.js";
import { moldura, Regiao, pintor, materialDaNoite } from "./base.js";

const EQUIPES = ["#e10600", "#27f4d2", "#ff8700", "#3671c6", "#229971", "#64c4ff", "#b6babd", "#6692ff", "#52e252", "#fd4bc7", "#0f2a52"];
const BRANCO = "#f4f5f5", CINZA = "#cfd2d5", FUNDO = "#a9adb1", VIDRO = "#22303d", ACO = "#4a5159";
const BAIA = 38.6; // 402,1 m ÷ 50 garagens = 8,04 m = 38,6 u

/**
 * @param {object} o { de, ate: o trecho da volta (frações; 402 m = 1 930 u = 161 estações de cada lado do meio do corredor), v0: a frente do prédio (W / 2 + 86 = 115 u: 18 u atrás das garagens que o jogo desenha, que vão até 97,5 u do eixo), fundo: a profundidade }
 */
export function predioDosBoxes(tr, add, { de = 0.9629, ate = 1.0371, v0 = tr.W / 2 + 86, fundo = 150 } = {}) {
  const { n } = tr, r = sorteio(4417);
  let i0 = Math.floor(de * n), i1 = Math.floor(ate * n);
  const rec = recortar(tr, i0, i1, [v0 - 60, v0 + fundo + 4]); if (!rec) return null;
  ({ i0, i1 } = rec);
  const F = moldura(tr, i0, i1, 1), reg = new Regiao(560), P = pintor(F, reg), S = P.S, V = vidro(), L = F.comprimento;
  const janela = materialDaNoite(tr, "#4f6f8a", "#ffd9a0", { side: THREE.DoubleSide });
  const abertas = materialDaNoite(tr, "#e6e3da", "#fff3cf"), fechadas = materialDaNoite(tr, "#2a2f36", "#3a3f48");
  const nb = Math.max(8, Math.round(L / BAIA)), baia = L / nb; // 50 garagens quando o prédio inteiro cabe
  const A1 = 24, LAJE = 2.4, ALT2 = A1 + LAJE + 19.6, TETO = ALT2 + LAJE + 19.6; // térreo de 5 m; andares de 4 m (estimativa)
  const ordem = EQUIPES.map((c, k) => [r(), c]).sort((a, b) => a[0] - b[0]).map((p) => p[1]); // a cor de cada equipe, em ordem sorteada

  // ---- o corpo e o térreo ----
  P.caixa(S, L / 2, v0 + fundo / 2, -30, [L + 0.4, 30, fundo], FUNDO); // a fundação, que desce até o chão
  P.caixa(S, L / 2, v0 + fundo / 2, 0, [L + 0.4, A1 + LAJE, fundo], CINZA); // o miolo do térreo, que vai até a frente (as portas ficam coladas nele)
  P.caixa(S, L / 2, v0 + 3 + (fundo - 3) / 2, A1 + LAJE, [L + 0.4, ALT2 - A1 - LAJE, fundo - 3], CINZA); // o do primeiro andar, de parede lisa, 3 u mais para trás (atrás do vidro)
  P.caixa(S, L / 2, v0 + 26 + (fundo - 26) / 2, ALT2, [L + 0.4, TETO - ALT2, fundo - 26], CINZA); // o do andar de cima, mais recuado: os cubos avançam e os terraços recuam em frente a ele
  for (let k = 0; k < nb; k++) {
    const s = (k + 0.5) * baia, aberta = r() < 0.4, cor = ordem[k % ordem.length];
    P.caixa(aberta ? abertas : fechadas, s, v0 - 0.35, 0.2, [baia * 0.78, A1 - 5.5, 0.5], "#ffffff"); // a porta da garagem
    P.caixa(S, s, v0 - 0.7, A1 - 5.2, [baia * 0.78, 2.6, 1.2], cor); // a testeira, na cor da equipe
    if (!aberta) for (let g = 0; g < 3; g++) P.caixa(S, s, v0 - 0.9, 3 + g * 5.5, [baia * 0.74, 0.5, 0.5], "#3b424a"); // as nervuras da porta de enrolar
    else { P.caixa(S, s - baia * 0.2, v0 + 4, 0.4, [10, 4, 4], "#17191c"); P.caixa(S, s + baia * 0.2, v0 + 4, 0.4, [10, 4, 4], "#17191c"); } // os pneus empilhados à vista
    P.caixa(S, k * baia + 0.5, v0 - 0.5, 0, [1.4, A1, 1.4], BRANCO); // o pilar entre as garagens
    if (r() < 0.22) { // uma saliência de térreo: a sala do chefe da equipe, que avança sobre o corredor e quebra a grade
      const w = baia * (r() < 0.5 ? 1 : 2) - 4, f = 4 + r() * 3; 
      P.caixa(S, s, v0 - f / 2 - 1, 0, [w, A1, f], BRANCO); P.caixa(V, s, v0 - f - 1.1, 5, [w - 2, 11, 0.4], VIDRO);
    }
  }
  P.caixa(S, L - 0.7, v0 - 0.5, 0, [1.4, A1, 1.4], BRANCO);
  // ---- a borda da laje do térreo: a faixa branca que corre o prédio inteiro, saindo para o corredor ----
  P.caixa(S, L / 2, v0 - 4.5, A1, [L + 0.4, LAJE, 11], BRANCO);
  P.caixa(S, L / 2, v0 - 9.5, A1 + 0.4, [L + 0.4, 1.4, 0.8], "#e4e6e8"); // o frisão da ponta
  // ---- o primeiro andar: vidro corrido atrás de montantes brancos, com a vitrine do hospitality ----
  P.caixa(S, L / 2, v0 + 3, A1 + LAJE, [L + 0.4, 19.6, 0.8], CINZA);
  P.caixa(janela, L / 2, v0 + 2.5, A1 + LAJE + 2.4, [L, 14, 0.4], "#ffffff");
  for (let s = 0; s <= L; s += baia / 2) P.caixa(S, s, v0 + 2.1, A1 + LAJE, [0.8, 19.6, 1.6], BRANCO); // os montantes, de meia em meia garagem
  P.caixa(S, L / 2, v0 - 3.8, A1 + LAJE, [L + 0.4, 1.2, 0.3], "#dfe2e4"); // o guarda-corpo da laje
  P.caixa(S, L / 2, v0 + 8, ALT2, [L + 0.4, LAJE, 36], BRANCO); // a laje do segundo andar, outra faixa branca na frente, e o piso dos terraços atrás
  // ---- o segundo andar: volumes cúbicos que avançam (A), ficam na linha (B) ou recuam e dão um terraço (C), em grupos sorteados ----
  let s = 0, ultimo = "";
  const volumes = [];
  while (s < L - 2) {
    const k = Math.min(nb - Math.round(s / baia), 2 + Math.floor(r() * 3)), w = k * baia; if (k <= 0) break;
    let tipo = ["A", "B", "C"][Math.floor(r() * 3)]; if (tipo === ultimo) tipo = ["A", "B", "C"][Math.floor(r() * 3)];
    ultimo = tipo; volumes.push({ s0: s, w, tipo }); s += w;
  }
  volumes.forEach(({ s0, w, tipo }, j) => {
    const c = s0 + w / 2, z0 = ALT2 + LAJE, h = TETO - z0;
    if (tipo === "A") { // o cubo que avança: caixa branca com uma faixa de janela e o beiral
      P.caixa(S, c, v0 - 1, z0, [w - 1, h, 14], BRANCO); P.caixa(janela, c, v0 - 8.1, z0 + 4, [w - 5, h - 9, 0.4], "#ffffff");
      P.caixa(S, c, v0 - 5, z0 + h, [w + 0.6, 1.6, 20], "#e9ebec");
    } else if (tipo === "B") { // na linha: vidro de ponta a ponta
      P.caixa(V, c, v0 + 4, z0, [w - 1, h, 1], VIDRO); P.caixa(janela, c, v0 + 3.4, z0 + 2.4, [w - 2, h - 5, 0.4], "#ffffff");
      for (let m = 1; m < Math.round(w / 12); m++) P.caixa(S, s0 + (m * w) / Math.round(w / 12), v0 + 3, z0, [0.7, h, 1.2], BRANCO);
    } else { // recuado: o terraço com guarda-corpo de vidro, o volume lá no fundo
      P.caixa(S, c, v0 + 24, z0, [w - 1, h, 2], CINZA); P.caixa(janela, c, v0 + 22.8, z0 + 3, [w - 3, h - 6, 0.4], "#ffffff");
      P.caixa(V, c, v0 - 3, z0, [w - 1, 3.8, 0.5], "#b8d2e6"); // o guarda-corpo de vidro na ponta da laje
      for (let m = 0; m < 2; m++) P.caixa(S, s0 + w * (0.3 + m * 0.4), v0 + 8, z0, [4.5, 2.4, 2.4], "#8a6f4a"); // os vasos de planta
    }
    // a cobertura de cada grupo: laje fina, com a borda mais avançada onde o volume avança
    P.caixa(S, c, v0 + fundo / 2, TETO, [w + 0.4, LAJE, fundo - 2], j % 2 ? "#eceeef" : BRANCO);
  });
  // ---- no teto: o telão de LED de cada lado do meio e nas pontas (quatro, de frente para a arquibancada principal), os aparelhos de ar e as antenas ----
  const telaD = materialDaNoite(tr, "#111418", "#bfe0ff"), telaF = materialDaNoite(tr, "#22262c", "#5a6572");
  const telas = [0.16, 0.38, 0.62, 0.84].map((f) => f * L);
  for (const c of telas) {
    P.caixa(telaF, c, v0 + 8, TETO + LAJE, [66, 33.6, 3], "#1c2026"); // 13,7 × 7 m (estimativa) de moldura
    P.caixa(telaD, c, v0 + 6.4, TETO + LAJE + 1.8, [62, 30, 0.4], "#ffffff");
    for (const dx of [-24, 24]) P.caixa(S, c + dx, v0 + 8, TETO + LAJE - 0.2, [2.4, 4, 2.4], ACO); // os pés do telão
  }
  for (let k = 0; k < 26; k++) {
    const c = r() * L, v = v0 + 24 + r() * (fundo - 50), tam = 7 + r() * 10; // os aparelhos de ar do teto, cada um num tamanho
    if (telas.some((t) => Math.abs(t - c) < 40)) continue;
    P.caixa(S, c, v, TETO + LAJE, [tam * 1.6, 4 + r() * 3, tam], r() < 0.5 ? "#c8ccd0" : "#9ea3a8");
  }
  for (let k = 0; k < 7; k++) P.mastro(r() * L, v0 + 30 + r() * 80, TETO + LAJE, 14 + r() * 14, "#d8dbde", 0.9);

  // ---- a torre de controle de prova, na ponta de entrada do corredor (o sul): três andares de escritório e a cabine de vidro por cima ----
  const sT = 2 * baia + 2, wT = baia * 2.4, vT = v0 + 12, dT = 66; // 3 andares de escritório, depois a cabine de vidro e a laje larga
  P.caixa(S, sT, vT + dT / 2, TETO, [wT, 40, dT], BRANCO); // o fuste, em cima do teto (andares 4 e 5: 8 m)
  P.caixa(janela, sT, vT - 0.3, TETO + 4, [wT - 4, 30, 0.4], "#ffffff");
  P.caixa(S, sT, vT + dT / 2, TETO + 40, [wT + 16, 3.2, dT + 16], "#eef0f1"); // a laje larga que cobre a cabine
  P.caixa(V, sT, vT + dT / 2, TETO + 43.2, [wT + 4, 24, dT + 4], VIDRO); P.caixa(janela, sT, vT - 2.4, TETO + 46, [wT, 17, 0.4], "#ffffff"); // a cabine de vidro da direção de prova
  P.caixa(S, sT, vT + dT / 2, TETO + 67.2, [wT + 12, 2.4, dT + 12], "#f4f5f5");
  P.mastro(sT + wT * 0.3, vT + dT / 2, TETO + 69.6, 34, "#dfe3e6", 1.4);
  P.caixa(S, sT - wT * 0.35, vT + dT / 2, TETO + 69.6, [5, 3, 5], "#9ea3a8");
  tr.torreControleCT = { s: sT, v: vT, alto: TETO + 70 + 34 };

  // ---- a ponta do norte: os terraços do Paddock Club, a escada em espiral com colunas de aço em V e a plataforma de aço sobre a linha de largada ----
  const sP = L - baia * 5; // o centro da escada
  for (let k = 0; k < 3; k++) { // os terraços escalonados, cada um mais recuado e mais alto
    const z = A1 + LAJE + k * 14, f = 22 - k * 6;
    P.caixa(S, L - baia * 2.6, v0 - f / 2 - 4, z, [baia * 5.2, 2.4, f], k % 2 ? "#eceeef" : BRANCO);
    P.caixa(V, L - baia * 2.6, v0 - f - 3.8, z + 2.4, [baia * 5.2, 3.6, 0.5], "#c4dcee"); // o guarda-corpo de vidro
    for (let m = 0; m < 4; m++) P.cil(S, L - baia * (0.8 + m * 1.2), v0 - f / 2 - 4, z + 2.4, [1.6, 2.2], "#7d5a3a", { seg: 8 }); // os vasos
  }
  escada(P, F, S, sP, v0 - 26);
  // a plataforma de aço sobre a linha de largada: uma laje comprida que sai do teto sobre o corredor, escorada por diagonais
  const sL = L / 2 - baia * 1.2, wL = baia * 3.8, vL = v0 - 40;
  P.caixa(S, sL, vL, TETO + LAJE - 1.2, [wL, 2.6, 62], ACO);
  P.caixa(V, sL, vL - 30.5, TETO + LAJE + 1.4, [wL, 4.2, 0.5], "#b8d2e6"); // a mureta de vidro
  for (const dx of [-wL * 0.42, 0, wL * 0.42]) {
    const q = F.at(sL + dx, vL + 6); // a escora inclinada, do pé do teto até a ponta da plataforma
    reg.de(q.x, q.z).caixa(S, [q.x, q.h + TETO - 14, q.z], [1.8, 42, 1.8], { cor: ACO, ry: q.ry, rx: 0.5 });
  }
  for (let m = 0; m < 3; m++) P.caixa(S, sL, vL + 4 + m * 9, TETO + LAJE + 1.4, [wL * 0.8, 1.8, 3.6], "#9aa0a6"); // os bancos de ripas
  tr.plataformaCT = { s: sL, v: vL, alto: TETO + LAJE };
  reg.montar(add, "catar-boxes");
  // o prédio entra em tr.reservado (as palmeiras, a pista de fora e os enfeites soltos não nascem em cima)
  tr.reservado ||= [];
  for (let c = 0; c <= L; c += 40) { const q = F.at(c, v0 + fundo / 2); tr.reservado.push([q.x, q.z, fundo / 2 + 30]); }
  tr.predioBoxes = { i0, i1, v0, fundo, comprimento: L, garagens: nb, teto: TETO };
  return { ...tr.predioBoxes, F, baia };
}

// a escada em espiral do Paddock Club: o eixo de aço, 38 degraus (um giro e meio) com as colunas de aço em V em volta, a rampa de acesso e o corrimão
function escada(P, F, S, s0, v0, { raio = 15, giros = 1.5, alto = 66, passos = 38 } = {}) {
  P.cil(S, s0, v0, 0, [2.2, alto + 6], ACO, { seg: 10 }); // o eixo central
  for (let k = 0; k < passos; k++) {
    const a = (k / passos) * giros * Math.PI * 2, y = 1 + (k / passos) * alto, q = F.at(s0 + Math.cos(a) * raio * 0.55, v0 + Math.sin(a) * raio * 0.55);
    P.caixa(S, s0 + Math.cos(a) * raio * 0.55, v0 + Math.sin(a) * raio * 0.55, y, [raio * 1.1, 0.9, 5.4], "#e7e9eb", { ry: q.ry - a }); // o degrau, que sai do eixo
    const o = F.at(s0 + Math.cos(a) * raio * 1.1, v0 + Math.sin(a) * raio * 1.1); // o corrimão: um balaústre na ponta de cada degrau
    P.caixa(S, s0 + Math.cos(a) * raio * 1.1, v0 + Math.sin(a) * raio * 1.1, y, [0.6, 7, 0.6], "#cfd3d6", { ry: o.ry });
  }
  for (let k = 0; k < 8; k++) { // as colunas de aço em V: dois montantes que se abrem, em oito pontos em volta
    const a = (k / 8) * Math.PI * 2, x = s0 + Math.cos(a) * raio * 1.7, z = v0 + Math.sin(a) * raio * 1.7, q = F.at(x, z), h = alto * 0.55;
    for (const d of [-1, 1]) P.caixa(S, x, z, 0, [1.6, h, 1.6], ACO, { ry: q.ry - a, rz: d * 0.3 }); // o V visto de lado
  }
  P.cil(S, s0, v0, alto + 2, [raio * 1.5, 1.6], "#f1f2f3", { seg: 24 }); // o patamar do alto
}
