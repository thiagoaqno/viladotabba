// Suzuka — o viaduto do cruzamento em "8" (peça nova, só desta pista). A reta de trás passa por cima do trecho depois da Degner:
// o traçado e a altura são os de pistas.js (`cruza`), isto é só o cenário em volta do tabuleiro: laje de concreto sobre vigas,
// mureta branca com a grade de aço por cima, postes de luz, pilares com a viga de apoio, os muros de arrimo dos dois lados do
// trecho de baixo (com a faixa vermelha e branca) e as faixas penduradas do lado de fora. Uma malha por material (montagem.js).
// Nada entra na pista: o tabuleiro só existe em cima da pista de cima, e os muros ficam a 8 u (1,7 m) da borda da de baixo.
//
// Escala real (1 u = 0,2083 m), medida em `Pistas.pontos(t, 6)` com o relevo novo: a pista de cima passa 41,4 u (8,6 m) acima da de baixo; o fundo das vigas fica 14,4 u (3 m) abaixo do asfalto de cima, então sobram 27 u (5,6 m)
// de vão livre sobre o asfalto de baixo; as pistas se cruzam a ~57° (o produto dos tangentes dá -0,54). O que mudou em relação ao desenho do vão de 11 m (53 u):
// 1. os pilares ficavam alinhados com a pista de BAIXO, mas o tabuleiro segue a de CIMA, que cruza de viés: de quatro pilares dois ficavam fora da laje (a 47 e a 75 u do eixo dela, para uma meia largura de 44) e os outros dois
//    paravam 2 a 10 u abaixo das vigas. Agora cada fileira de pilares fica a 22 u da borda da pista de baixo, na linha onde o eixo da de cima a cruza, com a viga de apoio ao longo da pista de baixo e do comprimento que a laje ocupa
//    nessa linha (2 × a meia largura ÷ o seno do ângulo), e sobe até o fundo das vigas lido na própria pista de cima, naquele ponto;
// 2. as cinco vigas por baixo ficavam a até 60 u do eixo, fora da laje (meia largura 44): agora dentro dela (de -40 a 40);
// 3. a mureta e a laje ficavam a 13 e 15 u da borda do asfalto de cima, e a física (pistas.js: `limiteViaduto`) para o carro em 29 u do eixo: sobrava um vão de 2,7 m de ar entre o carro e a mureta. Agora a mureta fica a 8 u e a laje a 12 u;
//    o mesmo nos muros de arrimo da pista de baixo (a física para o carro a 31 u, o muro estava a 44 u; agora a 39,5 u do eixo, a 8 u da borda), que também descem 9 u mais para se enfiar na malha do chão (que sob o asfalto de baixo fica 9 u abaixo dele).
import * as THREE from "three";
import { Montador, solido } from "../montagem.js";
import { marcaTex } from "../marcas.js";

export function viaduto(tr, { add }, { marcas = ["suzuka", "japangp"], extensao = 46, muroBaixo = 34 } = {}) {
  const { pts, n, W, t } = tr, cruz = t.cruza?.[0]; if (!cruz) return null;
  const [baixo, cima] = cruz, ib = Math.floor(baixo * n), ic = Math.floor(cima * n), S = solido(), m = new Montador();
  const CONCRETO = "#b9b5ab", ESCURO = "#8f8c84", BRANCO = "#ece9e2", ACO = "#8a9199", PRETO = "#2c3036";
  const meia = W / 2 + 12, mur = W / 2 + 8, passoVigas = (meia - 4) / 2; // a meia largura da laje, a mureta e o espaço entre as cinco vigas (de -(meia - 4) a (meia - 4))
  // ---- o tabuleiro, ponto a ponto da pista de cima ----
  for (let k = -extensao; k <= extensao; k++) {
    const p = pts[(ic + k + n) % n], q = pts[(ic + k + 1 + n) % n], comp = Math.hypot(q.x - p.x, q.y - p.y) + 0.5, a = Math.atan2(q.y - p.y, q.x - p.x), ry = -a;
    const cx = (p.x + q.x) / 2, cz = (p.y + q.y) / 2, ph = (p.h + q.h) / 2, no = (l, y) => [cx + p.nx * l, ph + y, cz + p.ny * l];
    m.caixa(S, no(0, -3.4), [comp, 6, 2 * meia], { cor: CONCRETO, ry }); // a laje
    for (let v = -2; v <= 2; v++) m.caixa(S, no(v * passoVigas, -10.4), [comp, 8, 5], { cor: ESCURO, ry }); // as vigas por baixo
    for (const s of [-1, 1]) {
      m.caixa(S, no(s * mur, 3.4), [comp, 8.4, 2.6], { cor: BRANCO, ry }); // a mureta
      m.caixa(S, no(s * mur, 8.1), [comp, 1, 3.4], { cor: "#d4d1c9", ry }); // o capeamento
      m.caixa(S, no(s * mur, -6.4), [comp, 2, 4], { cor: ESCURO, ry }); // a aba da laje, mais escura
      // a grade de aço: dois tubos corridos e um poste a cada 5 pontos
      m.caixa(S, no(s * mur, 15), [comp, 0.7, 0.7], { cor: ACO, ry }); m.caixa(S, no(s * mur, 11.5), [comp, 0.5, 0.5], { cor: ACO, ry });
      if (k % 5 === 0) m.caixa(S, no(s * mur, 12), [0.8, 8, 0.8], { cor: ACO, ry });
      // o poste de luz de 8 em 8 pontos, com o braço virado para a pista
      if (k % 8 === 0 && Math.abs(k) < extensao - 4) { m.caixa(S, no(s * (mur + 2), 28), [1.3, 40, 1.3], { cor: PRETO, ry }); m.caixa(S, no(s * (mur - 3), 47), [10, 1, 1], { cor: PRETO, ry }); m.caixa(S, no(s * (mur - 7), 46), [3.5, 1.6, 2.4], { cor: "#fff4d2", ry }); }
    }
  }
  // ---- os pilares: duas fileiras, uma de cada lado da pista de baixo, na linha onde o eixo da pista de cima a cruza ----
  const pb = pts[ib], latPilar = W / 2 + 22, senoCruz = Math.max(0.35, Math.abs(pb.tx * pts[ic].ty - pb.ty * pts[ic].tx)), angB = -Math.atan2(pb.ty, pb.tx);
  const lateralDe = (q) => (q.x - pb.x) * pb.nx + (q.y - pb.y) * pb.ny, aoLongoDe = (q) => (q.x - pb.x) * pb.tx + (q.y - pb.y) * pb.ty;
  const pilares = [];
  for (const s of [-1, 1]) {
    let q0 = null; // a estação da pista de cima mais perto da linha do pilar (lateral s × latPilar, no sistema da pista de baixo)
    for (let k = -extensao; k <= extensao; k++) { const q = pts[(ic + k + n) % n], e = Math.abs(lateralDe(q) - s * latPilar); if (!q0 || e < q0.e) q0 = { e, q }; }
    const d0 = aoLongoDe(q0.q), comprimento = (2 * (meia - 3)) / senoCruz, pos = (d, y) => [pb.x + pb.nx * s * latPilar + pb.tx * d, y, pb.y + pb.ny * s * latPilar + pb.ty * d];
    // o fundo das vigas, lido na pista de cima no ponto de cada pilar (e a viga de apoio logo abaixo, no mais baixo dos dois)
    const fundo = (d) => { const [x, , z] = pos(d, 0); let mm = Infinity, h = 0; for (let k = -extensao; k <= extensao; k++) { const q = pts[(ic + k + n) % n], e = (q.x - x) ** 2 + (q.y - z) ** 2; if (e < mm) { mm = e; h = q.h; } } return h - 14.4; };
    const cols = [d0 - comprimento * 0.33, d0 + comprimento * 0.33], topo = Math.min(...cols.map(fundo), fundo(d0)) - 0.2;
    for (const d of cols) pilares.push({ x: pos(d, 0)[0], z: pos(d, 0)[2], topo });
    for (const d of cols) m.caixa(S, pos(d, (topo - 4 + (pb.h - 14)) / 2), [9, topo - 4 - (pb.h - 14), 9], { cor: CONCRETO, ry: angB }); // do chão (14 u abaixo do asfalto de baixo, enterrado na malha) até a viga de apoio
    m.caixa(S, pos(d0, topo - 2), [12, 4, comprimento], { cor: ESCURO, ry: angB }); // a viga de apoio, por cima dos dois pilares e sob as vigas do tabuleiro
  }
  // ---- os muros de arrimo dos dois lados do trecho de baixo: concreto com a faixa vermelha e branca no topo, a 8 u da borda do asfalto, da malha do chão (9 u abaixo do asfalto) até 23 u acima dele ----
  const alturaMuro = 35, baseMuro = -12;
  for (let k = -muroBaixo; k <= muroBaixo; k++) {
    const p = pts[(ib + k + n) % n], q = pts[(ib + k + 1 + n) % n], comp = Math.hypot(q.x - p.x, q.y - p.y) + 0.4, ry = -Math.atan2(q.y - p.y, q.x - p.x), cx = (p.x + q.x) / 2, cz = (p.y + q.y) / 2, ph = (p.h + q.h) / 2;
    for (const s of [-1, 1]) {
      const l = s * (W / 2 + 10);
      m.caixa(S, [cx + p.nx * l, ph + baseMuro + alturaMuro / 2, cz + p.ny * l], [comp, alturaMuro, 3], { cor: CONCRETO, ry });
      m.caixa(S, [cx + p.nx * l, ph + baseMuro + alturaMuro - 1.2, cz + p.ny * l], [comp, 2.4, 3.6], { cor: k % 2 ? "#d8312b" : "#f4f2ec", ry });
    }
  }
  const g = m.montar(`${tr.id}-viaduto`); add(g);
  // ---- as faixas penduradas do lado de fora da mureta, no meio do tabuleiro: de frente para quem passa pela pista de baixo ----
  marcas.forEach((nome, j) => {
    const p = pts[(ic + (j ? 18 : -18) + n) % n];
    for (const s of [-1, 1]) {
      const faixa = new THREE.Mesh(new THREE.PlaneGeometry(64, 8), new THREE.MeshBasicMaterial({ map: marcaTex(nome, 1024, 128), side: THREE.FrontSide }));
      faixa.position.set(p.x + p.nx * s * (mur + 1.5), p.h + 3.4, p.y + p.ny * s * (mur + 1.5)); faixa.rotation.y = Math.atan2(p.nx * s, p.ny * s); add(faixa); // a face (+z local) olha para o lado de fora da mureta
    }
  });
  tr.reservado ||= [];
  for (let k = -extensao; k <= extensao; k += 6) { const p = pts[(ic + k + n) % n]; tr.reservado.push([p.x, p.y, W / 2 + 70]); }
  for (let k = -muroBaixo - 8; k <= muroBaixo + 8; k += 8) { const p = pts[(ib + k + n) % n]; tr.reservado.push([p.x, p.y, W / 2 + 50]); }
  tr.viadutoSuzuka = { baixo: ib, cima: ic, extensao, muroBaixo, pilares };
  return g;
}
