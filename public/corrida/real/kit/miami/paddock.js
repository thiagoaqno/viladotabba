// Miami — o prédio dos boxes temporário e o paddock: módulos brancos de dois andares com as portas das garagens (uma cor por equipe), o
// terraço de hospitalidade com toldos aqua e rosa, a torre de controle de vidro e os painéis no teto; e, atrás, os motorhomes e as carretas
// das equipes. Cor chapada por vértice (kit/montagem.js): cada peça fica em poucas chamadas de desenho. Origem no meio da frente, frente
// para +z (a pista), o prédio cresce para -z.
// Tamanho real (1 m = 4,8 u, planos/escala-real.md): andares de 3,5 a 4,2 m (térreo 20 u, primeiro andar 17 u), porta de garagem de 4,2 × 3,3 m a cada 5 m,
// parapeito de 1,1 m, torre de 2 andares de vidro (6 m) com mastro de 5,4 m; motorhome de 23 × 10 m e 8 m de altura; carreta de 16,5 m (baú de 13 m, 2,6 m de largura, 4 m de altura).
import * as THREE from "three";
import { Montador, solido, tom } from "../montagem.js";
import { marcaTex } from "../marcas.js";

const AQUA = "#0aa3ad", ROSA = "#ff5fa2", BRANCO = "#f4f2ec", VIDRO = "#1b2a36", AZUL_VIDRO = "#5f8fa8";
export const EQUIPES = ["#e10600", "#00a3e0", "#ffd100", "#ff7a00", "#00a86b", "#1e41ff", "#f4f4f4", "#7b2cbf", "#0aa3ad", "#ff5fa2", "#2a2f36"];

export function predioDosBoxes({ comprimento = 560, fundo = 84, torre = 0, paineis = ["mimiami", "migp", "mimiami", "migp"] } = {}) {
  const m = new Montador(), S = solido(), L = comprimento, F = fundo, H1 = 20, H2 = 17, g = new THREE.Group();
  // o térreo (4,2 m): a caixa branca, as portas das garagens (4,2 × 3,3 m) com a faixa da cor da equipe e o friso aqua em cima
  m.caixa(S, [0, H1 / 2, -F / 2], [L, H1, F], { cor: BRANCO });
  const n = Math.floor((L - 60) / 24), x0 = -((n - 1) * 24) / 2;
  for (let k = 0; k < n; k++) {
    const x = x0 + k * 24, eq = EQUIPES[k % EQUIPES.length];
    m.caixa(S, [x, 8, 0.3], [20, 16, 0.8], { cor: "#242a31" }); // a porta
    for (let y = 2; y < 16; y += 2.4) m.caixa(S, [x, y, 0.8], [20, 0.4, 0.4], { cor: "#3a424b" });
    m.caixa(S, [x, 17.4, 0.7], [21, 2, 1], { cor: eq }); // a faixa da equipe
    m.caixa(S, [x + 12, H1 / 2, 0.3], [1.2, H1, 0.8], { cor: "#d9d6cd" }); // o pilar entre as portas
  }
  m.caixa(S, [0, H1 - 1, 0.5], [L, 2, 1.4], { cor: AQUA });
  // o terraço (a laje avança para a pista) com o parapeito de vidro (1,1 m)
  m.caixa(S, [0, H1 + 0.6, -F / 2 + 2], [L + 2, 1.2, F + 4], { cor: "#ffffff" });
  m.caixa(S, [0, H1 + 1.2 + 2.6, 1.8], [L, 5.2, 0.5], { cor: AZUL_VIDRO });
  for (let x = -L / 2 + 6; x <= L / 2 - 5; x += 22) m.caixa(S, [x, H1 + 1.2 + 2.6, 1.8], [0.8, 5.4, 0.9], { cor: "#e9e6df" });
  // o primeiro andar recuado (3,5 m): vidraça escura com montantes brancos, e os toldos que descem em rampa, alternando aqua e rosa
  const FD = F - 18, Y1 = H1 + 1.2, T = Y1 + H2; // T: a laje do teto, a 39 u (8,3 m) do chão
  m.caixa(S, [0, Y1 + H2 / 2, -F + FD / 2 + 2], [L - 16, H2, FD], { cor: BRANCO });
  m.caixa(S, [0, Y1 + H2 / 2 - 0.5, -F + FD + 2.3], [L - 18, H2 - 3, 0.9], { cor: VIDRO });
  for (let x = -L / 2 + 14; x <= L / 2 - 13; x += 12) m.caixa(S, [x, Y1 + H2 / 2 - 0.5, -F + FD + 2.8], [0.9, H2 - 2.5, 1.1], { cor: "#ffffff" });
  for (let k = 0, x = -L / 2 + 18; x <= L / 2 - 28; k++, x += 24) m.caixa(S, [x + 10, Y1 + H2 - 3.5, -F + FD + 8], [22, 0.9, 12], { cor: k % 2 ? ROSA : AQUA, rx: 0.34 });
  m.caixa(S, [0, T + 0.8, -F + FD / 2 + 2], [L - 10, 1.6, FD + 6], { cor: "#ffffff" }); // o teto
  m.caixa(S, [0, T + 2, -F + 4], [L - 10, 2, 1], { cor: AQUA }); // a platibanda do fundo
  const TOPO = T + 1.6;
  // as caixas de ar (3 × 1,2 × 2 m) no teto, e as escadas externas atrás (azul-claro, de andaime, 2,5 m de largura)
  for (let k = 0; k < 9; k++) m.caixa(S, [-L / 2 + 40 + k * ((L - 80) / 8), TOPO + 2.5, -F + 14 + (k % 2) * 6], [14, 5, 10], { cor: "#b9bec4" });
  for (const sx of [-1, 1]) for (const k of [0, 1]) m.caixa(S, [sx * (L / 2 - 8 - k * (L - 16) / 3), TOPO / 2, -F - 4], [12, TOPO, 8], { cor: "#d9d6cd" });
  // a torre de controle: dois andares de vidro (6 m) com a cobertura, o mastro das bandeiras (5,4 m) e a antena
  const tx = torre, tz = -F / 2 - 4, TW = 56, TD = 34, TH = 29;
  m.caixa(S, [tx, TOPO + TH / 2, tz], [TW, TH, TD], { cor: VIDRO });
  for (let k = 0; k < 11; k++) m.caixa(S, [tx - TW / 2 + 3 + k * ((TW - 6) / 10), TOPO + TH / 2, tz + TD / 2 + 0.4], [0.8, TH, 0.8], { cor: "#ffffff" });
  m.caixa(S, [tx, TOPO + TH / 2, tz + TD / 2 + 0.4], [TW, 1, 0.8], { cor: "#ffffff" });
  m.caixa(S, [tx, TOPO + TH + 1.2, tz], [TW + 4, 2.4, TD + 4], { cor: AQUA });
  const topoTorre = TOPO + TH + 2.4;
  m.cilindro(S, [tx + TW / 2 - 6, topoTorre + 13, tz], [0.7, 26], { cor: "#d9dde0", seg: 6 }); m.cilindro(S, [tx - TW / 2 + 6, topoTorre + 9, tz], [0.4, 18], { cor: "#9aa3aa", seg: 5 });
  m.caixa(S, [tx + TW / 2 + 0, topoTorre + 21, tz + 0.2], [12, 7, 0.4], { cor: "#f4f4f4" }); for (let a = 0; a < 4; a++) for (let b = 0; b < 2; b++) m.caixa(S, [tx + TW / 2 - 5 + a * 3, topoTorre + 19.3 + b * 3.5, tz + 0.5], [3, 3.5, 0.2], { cor: (a + b) % 2 ? "#111" : "#fff" }); // a bandeira quadriculada
  // os painéis de cima do teto (de frente para a pista), com dois pés até o teto
  const passo = Math.min(120, (L - 40) / paineis.length), pw = passo * 0.78, ph = pw / 4; // marcaTex tem proporção 4:1
  paineis.forEach((nome, k) => {
    const x = (k - (paineis.length - 1) / 2) * passo;
    for (const s of [-1, 1]) m.caixa(S, [x + s * (pw / 2 - 3), TOPO + 2, -F + FD + 4], [1.2, 4, 1.2], { cor: "#9aa3aa" });
  });
  g.add(m.montar("miami-boxes"));
  paineis.forEach((nome, k) => {
    const x = (k - (paineis.length - 1) / 2) * passo, p = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), new THREE.MeshBasicMaterial({ map: marcaTex(nome, 512, 128), side: THREE.DoubleSide }));
    p.position.set(x, TOPO + 4 + ph / 2, -F + FD + 4.4); g.add(p);
  });
  g.userData = { comprimento: L, fundo: F, alto: topoTorre + 26, teto: TOPO };
  return g;
}

// um motorhome de dois andares (8 m) com o terraço, o toldo e a faixa da equipe: 23 × 10 m
export function motorhome({ cor = "#0aa3ad", faixa = ROSA, c = 110, p = 48 } = {}) {
  const m = new Montador(), S = solido(), g = new THREE.Group();
  m.caixa(S, [0, 10, -p / 2], [c, 20, p], { cor: BRANCO });
  m.caixa(S, [0, 29.4, -p / 2 - 3], [c - 6, 18, p - 10], { cor: "#e9e6df" });
  m.caixa(S, [0, 10, 0.3], [c - 14, 9, 0.4], { cor: VIDRO }); m.caixa(S, [0, 29, -7.7], [c - 12, 11, 0.4], { cor: VIDRO });
  m.caixa(S, [0, 20.6, -p / 2], [c + 1, 1.2, p + 1], { cor: "#ffffff" }); m.caixa(S, [0, 39.4, -p / 2 - 3], [c - 4, 1.4, p - 8], { cor: tom(cor, 1.05) });
  m.caixa(S, [0, 3.2, 0.6], [c, 2.4, 0.4], { cor }); m.caixa(S, [0, 6, 0.6], [c, 1, 0.4], { cor: faixa });
  m.caixa(S, [0, 18, 6], [c - 14, 0.7, 12], { cor: faixa, rx: 0.3 });
  for (let x = -c / 2 + 6; x < c / 2 - 4; x += 10) m.caixa(S, [x, 22.2, 0.6], [0.5, 2.4, 0.5], { cor: "#cfd3d6" });
  g.add(m.montar("miami-motorhome")); g.userData = { largura: c, profundidade: p, alto: 40 };
  return g;
}

// uma carreta de equipe (cabine e baú) com a faixa colorida: 16,5 m de comprimento, baú de 13 m, 2,6 m de largura e 4 m de altura
export function carreta({ cor = "#0aa3ad", c = 80 } = {}) {
  const m = new Montador(), S = solido(), g = new THREE.Group(), W = 12.5, Lb = c - 18;
  m.caixa(S, [-c / 2 + Lb / 2, 9.5, -W / 2], [Lb, 19, W], { cor: "#f4f2ec" }); m.caixa(S, [-c / 2 + Lb / 2, 5.5, -W / 2], [Lb, 3, W + 0.4], { cor });
  m.caixa(S, [c / 2 - 7, 7.5, -W / 2], [14, 15, W - 0.5], { cor: tom(cor, 0.9) }); m.caixa(S, [c / 2 - 0.5, 10, -W / 2], [1.4, 6, W - 3], { cor: VIDRO });
  for (const x of [-c / 2 + 10, -c / 2 + 22, c / 2 - 8]) for (const z of [-0.8, -W + 0.8]) m.caixa(S, [x, 2.6, z], [5.2, 5.2, 2.2], { cor: "#1a1d22" });
  g.add(m.montar("miami-carreta")); g.userData = { largura: c, profundidade: W };
  return g;
}
