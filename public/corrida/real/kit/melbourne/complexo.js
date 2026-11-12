// Melbourne — as construções da reta principal de Albert Park, montadas com o kit 2: a arquibancada longa de aço (Fangio) em
// frente aos boxes, o complexo dos boxes (andar de garagens, faixa de vidro e as arquibancadas de cobertura azul e vermelha, como
// nas fotos aéreas) e o paddock com as tendas brancas. As peças do kit são retas e de frente para +z: aqui cada uma é posta ao
// longo da reta, de frente para a pista, e só fica onde a beirada dela está onde foi desenhada (`distAt`).
// ESCALA REAL (1 u = 0,2083 m; passada visual de planos/escala-real.md): as arquibancadas são a `tribunaReal` (degrau de 6 × escala de altura e 9 × escala de fundo: 0,5 × 0,75 m, gente de 1,7 m, cobertura a 5,4 m do
// degrau; antes 4,6 × 7 u = 0,96 × 1,46 m com gente de 0,6 m); as garagens têm a porta de 3,3 m (antes 1,7 m) e o prédio 44 u = 9,2 m (térreo de 5 m e o andar das suítes de 3,3 m; antes 26 u = 5,4 m). Tudo pousa no chão que se
// vê (`nivelDoChao`: a fita de chao.js) e a distância é a da BORDA da pista (W / 2 + k): com os 120 u de largura de antes as peças ficavam a 99, 150 e 215 do eixo, 39, 90 e 155 u da borda.
import * as THREE from "three";
import { tendaPaddock } from "../coberturas.js";
import { tribunaReal } from "./tribuna.js";
import { nivelDoChao } from "./chao.js";
import { Montador, solido, vidro, tom } from "../montagem.js";
import { sorteio } from "../comum.js";

// o lugar de uma peça: centro da frente em (x, z) e a direção da frente (para a pista); retângulo para tr.ocupado
function lugar(tr, i, lado, lat) {
  const p = tr.pts[((i % tr.n) + tr.n) % tr.n], dx = -lado * p.nx, dz = -lado * p.ny;
  return { p, x: p.x + p.nx * lado * lat, z: p.y + p.ny * lado * lat, dx, dz, ry: Math.atan2(dx, dz) };
}
// põe o grupo `g` (comprimento L, profundidade P) com a frente em `lat`, centrado no ponto i. Devolve o retângulo ou null.
function colocar(tr, add, g, i, lado, lat, L, P, { y = 0, folga = 5, checar = true } = {}) {
  const o = lugar(tr, i, lado, lat), ex = [o.dz, -o.dx];
  if (checar) for (const s of [-1, 1]) for (const f of [0, 0.5, 1]) {
    const x = o.x + ex[0] * s * L / 2 - o.dx * f * P, z = o.z + ex[1] * s * L / 2 - o.dz * f * P;
    if (tr.distAt(x, z) < Math.abs(lat) - folga - (f ? 0 : 0)) return null;
  }
  g.position.set(o.x, nivelDoChao(tr, o.x, o.z) - 0.3 + y, o.z); g.rotation.y = o.ry; add(g);
  const r = { cx: o.x - o.dx * P / 2, cz: o.z - o.dz * P / 2, ex, ez: [o.dx, o.dz], a: L / 2, b: P / 2 };
  (tr.retangulosGP ||= []).push(r);
  for (let k = -1; k <= 1; k++) tr.reservado.push([r.cx + ex[0] * k * L / 3, r.cz + ex[1] * k * L / 3, Math.max(P, L / 3) * 0.7]); // os enfeites soltos não entram
  return r;
}
/** `tr.ocupado` do GP: dentro dos retângulos das construções (com uma margem) ou do que mais o GP quiser (`tr.outrosOcupados`). */
export function instalarOcupado(tr, extra) {
  tr.ocupado = (x, z) => {
    for (const r of tr.retangulosGP || []) { const rx = x - r.cx, rz = z - r.cz; if (Math.abs(rx * r.ex[0] + rz * r.ex[1]) < r.a + 8 && Math.abs(rx * r.ez[0] + rz * r.ez[1]) < r.b + 8) return true; }
    return !!extra?.(x, z);
  };
}

/**
 * A arquibancada longa em frente aos boxes (Fangio / Piastri): degraus de assentos escuros lotados, estrutura de aço e cobertura
 * escura sobre quase tudo. Peças de `comprimento` em fila, do ponto `de` ao `ate` (frações da volta).
 */
export function arquibancadaLonga(tr, add, { de, ate, lado = -1, lat = tr.W / 2 + 39, comprimento = 240, degraus = 20, publico = 0.34, cobertura = "#2d3238", cores = ["#243b73", "#3a3f48", "#7a2a2a"], secoes = 5 } = {}) {
  const { n } = tr, E = tr.escala ?? 1, passo = Math.round(comprimento / 6) + 1; let a = Math.floor(de * n), b = Math.floor(ate * n); if (b < a) b += n;
  let k = 0, feitas = 0;
  for (let i = a + (passo >> 1); i <= b - (passo >> 1) + 1; i += passo, k++) {
    const g = tribunaReal({ escala: E, comprimento, degraus, cores, secoes, cobertura, estrutura: "#59616b", publico, alcance: 0.62, semente: 11 + k });
    const r = colocar(tr, add, g, i, lado, lat, comprimento, g.userData.profundidade + 6); if (!r) continue;
    feitas++; tr.arquibancadas ||= []; tr.arquibancadas.push([i - (passo >> 1), i + (passo >> 1)]);
  }
  tr.arquibancadaLongaGP = feitas;
}

const EQUIPES = ["#ff8700", "#e8002d", "#27f4d2", "#3671c6", "#6692ff", "#229971", "#37bedd", "#d7172f", "#ff87bc", "#c6cbd0"];
/**
 * O complexo dos boxes atrás das garagens do corredor: o prédio de garagens (faixas na cor das equipes, vidros, platibanda) e, em
 * cima, as arquibancadas de cobertura azul e vermelha. Centrado no ponto `centro` (índice), `pecas` peças de `comprimento`.
 */
export function complexoDosBoxes(tr, add, { centro = 0, lado = 1, lat = tr.W / 2 + 90, pecas = 4, comprimento = 150, prof = 56, alto = 44 } = {}) {
  const E = tr.escala ?? 1;
  const passo = Math.round(comprimento / 6), S = solido(), V = vidro();
  for (let k = 0; k < pecas; k++) {
    const i = centro + Math.round((k - (pecas - 1) / 2) * passo);
    const g = new THREE.Group(), m = new Montador();
    m.caixa(S, [0, alto / 2, -prof / 2], [comprimento, alto, prof], { cor: "#d4d7da" }); // o volume
    m.caixa(S, [0, 1, 0.8], [comprimento, 2, 1.6], { cor: "#8a9096" }); // o rodapé
    for (let q = 0; q < 6; q++) { // as faixas das equipes sobre as portas das garagens
      const x = -comprimento / 2 + (q + 0.5) * comprimento / 6;
      m.caixa(S, [x, 10, 0.4], [comprimento / 6 - 3, 16, 0.8], { cor: "#23272d" }); m.caixa(S, [x, 20.5, 0.9], [comprimento / 6 - 3, 3, 1.2], { cor: EQUIPES[(k * 6 + q) % 10] }); // (a porta de 3,3 m e a faixa da equipe de 0,6 m)
    }
    m.caixa(V, [0, 32, 0.5], [comprimento - 2, 16, 0.8], { cor: "#26303a" }); // o andar de vidro das suítes (3,3 m)
    for (let q = 0; q <= 15; q++) m.caixa(S, [-comprimento / 2 + 1 + q * (comprimento - 2) / 15, 32, 1], [0.7, 16.4, 0.8], { cor: "#f2f4f5" });
    m.caixa(S, [0, alto + 0.6, -prof / 2 + 1], [comprimento + 2, 1.4, prof + 2], { cor: tom("#9aa0a6", 1) }); // o teto
    g.add(m.montar("complexo-boxes"));
    // as arquibancadas de cima: cobertura azul e vermelha alternadas
    const t = tribunaReal({ escala: E, comprimento, degraus: 12, cores: ["#2f5fd0", "#6a45c8"], secoes: 3, cobertura: k % 2 ? "#c8102e" : "#1d4e9e", estrutura: "#8a9096", publico: 0.3, alcance: 0.85, embutido: 0, semente: 40 + k });
    t.position.set(0, alto + 1.4, -2); g.add(t);
    colocar(tr, add, g, i, lado, lat, comprimento, prof, { checar: false });
  }
}

/** O paddock: tendas brancas em fileiras atrás do complexo (poucas com letreiro, para não pesar), mais uma grande de hospitalidade. */
export function paddock(tr, add, { centro = 0, lado = 1, lat = tr.W / 2 + 155, fileiras = 3, tendas = 7, passo = 24, textos = ["AUSTRALIAN GP", "PADDOCK CLUB", "HEINEKEN", "ROLEX"] } = {}) {
  const r = sorteio(77); let feitos = 0;
  for (let f = 0; f < fileiras; f++) for (let k = 0; k < tendas; k++) {
    if (r() < 0.2) continue;
    const mod = 2 + ((r() * 3) | 0), fil = 2, texto = f === 0 && textos[k % textos.length] && k % 2 === 0 ? textos[k % textos.length] : "";
    const g = tendaPaddock({ modulos: mod, filas: fil, texto, corFaixa: ["#c8102e", "#0e1f4a", "#007a3d"][(r() * 3) | 0], mesas: r() < 0.7, corMesas: "#c8102e" });
    const L = mod * 34, P = fil * 34, i = centro + Math.round((k - (tendas - 1) / 2) * (passo + 6));
    if (colocar(tr, add, g, i, lado, lat + f * 78 + P, L, P, { folga: 8 })) feitos++;
  }
  tr.paddockGP = feitos;
}
