// Silverstone — THE WING, o prédio dos boxes de 2011, pelas fotos (a reta de largada, a Hamilton Straight): no térreo, as garagens das equipes
// (as do kit, kit/corredor-boxes.js, que mandam no pit stop: aqui elas viram o térreo do prédio); por cima delas, a faixa amarela da DHL
// correndo o prédio todo; o andar de cima todo de vidro, inclinado para a pista, com "SILVERSTONE" em letras grandes; as treliças vermelhas
// de aço em V, da laje até o teto; e o teto branco ondulado que avança sobre a faixa de trabalho e termina, nas duas pontas, em bicos
// afiados virados para cima (a "asa" que dá o nome). No muro dos boxes, os painéis amarelos da Pirelli virados para a pista.
// Em unidades do mundo (1 u = 0,2083 m: 4,8 u por metro). O prédio segue a reta pelo quadro do corredor (F1Regras.corredor: `u` em pontos
// da pista a partir de `i0`, `l` a distância da linha central, do lado `lado`). Medidas de ordem de grandeza das fotos (não há planta pública):
// o térreo das garagens 5,6 m (o do kit), a faixa da DHL 2 m, o vidro até 20 m, o teto a uns 21 m e as pontas a 28 m.
import * as THREE from "three";
import { M, canvasTex } from "../../cena.js";
import { marcaTex } from "../marcas.js";

const T_GARAGEM = 55, T_FAIXA = 65, T_VIDRO = 124, T_TETO = 130, T_PONTA = 163; // alturas (u) acima do asfalto (+28 desde 2026-11-11: as garagens do kit, corredor-boxes.js, ficaram mais altas)
const BALANCO = 34, FUNDO = 140, PONTA = 70; // o teto avança 34 u (7 m) além da fachada; o prédio tem 140 u (29 m) de fundo; cada bico avança 70 u (15 m)
export function theWing(tr, add) {
  const F1 = window.F1Regras, cor = F1?.corredor(tr.t, tr.n, tr.W); if (!cor) return null;
  const { pts, n, W } = tr, lado = cor.lado, G = Math.abs(cor.garagemLat); // (o garagemLat já vem com o sinal do lado; aqui o lado é +1, mas fica certo nos dois)
  // o ponto u (pontos a partir de i0, fracionário) da reta, a `l` da linha central (com o lado) e `y` acima do asfalto daquele ponto
  const em = (u, l, y) => {
    const i = cor.i0 + Math.floor(u), f = u - Math.floor(u), a = pts[((i % n) + n) % n], b = pts[(((i + 1) % n) + n) % n];
    const nx = a.nx + (b.nx - a.nx) * f, ny = a.ny + (b.ny - a.ny) * f, h = a.h + (b.h - a.h) * f;
    return [a.x + (b.x - a.x) * f + nx * lado * l, h + y, a.y + (b.y - a.y) * f + ny * lado * l];
  };
  const G0 = new Map(), lote = (mat) => { if (!G0.has(mat)) G0.set(mat, { vs: [], uv: [], idx: [] }); return G0.get(mat); };
  // um quadrilátero (A, B, C, D em volta) com as coordenadas de textura dadas
  const quad = (mat, A, B, C, D, uv = [0, 0, 1, 0, 1, 1, 0, 1]) => { const L = lote(mat), k = L.vs.length / 3; L.vs.push(...A, ...B, ...C, ...D); L.uv.push(...uv); L.idx.push(k, k + 1, k + 2, k, k + 2, k + 3); };
  const tri = (mat, A, B, C) => { const L = lote(mat), k = L.vs.length / 3; L.vs.push(...A, ...B, ...C); L.uv.push(0, 0, 1, 0, 0.5, 1); L.idx.push(k, k + 1, k + 2); };

  // ---- os materiais ----
  const vidro = new THREE.MeshStandardMaterial({ roughness: 0.12, metalness: 0.55, side: THREE.DoubleSide, map: canvasTex(128, 256, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#9fbfd6"); g.addColorStop(0.55, "#4f7895"); g.addColorStop(1, "#22384c"); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = "#d9e2e8"; x.fillRect(0, 0, 3, h); x.fillRect(w / 2 - 1, 0, 2, h); for (const yy of [0, h * 0.5]) x.fillRect(0, yy, w, 4); // os montantes e o piso do andar do meio
    x.fillStyle = "#ffffff1c"; x.fillRect(8, 10, 22, h - 20);
  }) });
  const branco = M(0xf3f4f5, { roughness: 0.45, side: THREE.DoubleSide }), baixoTeto = M(0xc9ccd0, { roughness: 0.6, side: THREE.DoubleSide });
  const cinza = M(0x3b3e44, { roughness: 0.8, side: THREE.DoubleSide }), vermelho = M(0xc8102e, { roughness: 0.45, metalness: 0.3 });
  const dhl = new THREE.MeshBasicMaterial({ map: marcaTex("dhl", 512, 64), side: THREE.DoubleSide });
  const letras = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, map: canvasTex(2048, 160, (x, w, h) => {
    x.clearRect(0, 0, w, h); x.fillStyle = "#ffffffd9"; x.font = "500 132px 'Barlow', 'Segoe UI', Arial, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText("S I L V E R S T O N E", w / 2, h / 2 + 6);
  }, false) });
  const pirelli = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, map: canvasTex(512, 64, (x, w, h) => {
    x.fillStyle = "#ffd100"; x.fillRect(0, 0, w, h); x.fillStyle = "#111111"; x.font = "italic 900 46px 'Arial Black', Arial, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText("PIRELLI", w / 2, h / 2 + 2); x.fillStyle = "#d40511"; x.fillRect(0, h - 5, w, 5);
  }) });

  // ---- o corpo, ao longo da reta ----
  const uA = -14, uB = cor.len + 14, passo = 2; // o prédio passa um pouco das duas pontas do corredor
  const onda = (u) => 4 * Math.sin(((u - uA) / (uB - uA)) * Math.PI * 4); // o teto ondula de leve ao longo do prédio (as fotos)
  const lF = G - 2, lV = G - 10, lT = G - BALANCO, lB = G + FUNDO; // a fachada da faixa, o alto do vidro (inclinado para a pista), a borda do teto e o fundo
  for (let u = uA; u < uB; u += passo) {
    const v = Math.min(uB, u + passo), du = (v - u) * 6, ru = (u - uA) * 6;
    const yT = (uu) => T_TETO + onda(uu);
    quad(cinza, em(u, lF + 18, -12), em(v, lF + 18, -12), em(v, lF + 18, T_GARAGEM), em(u, lF + 18, T_GARAGEM)); // o fundo das garagens (atrás das do kit), até o chão
    quad(dhl, em(u, lF, T_GARAGEM), em(v, lF, T_GARAGEM), em(v, lF, T_FAIXA), em(u, lF, T_FAIXA), [ru / 96, 0, (ru + du) / 96, 0, (ru + du) / 96, 1, ru / 96, 1]); // a faixa da DHL
    quad(cinza, em(u, lF, T_FAIXA), em(v, lF, T_FAIXA), em(v, lB, T_FAIXA), em(u, lB, T_FAIXA)); // a laje do andar de cima
    quad(vidro, em(u, lF, T_FAIXA), em(v, lF, T_FAIXA), em(v, lV, T_VIDRO), em(u, lV, T_VIDRO), [ru / 30, 0, (ru + du) / 30, 0, (ru + du) / 30, 1, ru / 30, 1]); // o vidro, inclinado
    quad(baixoTeto, em(u, lV, T_VIDRO), em(v, lV, T_VIDRO), em(v, lT, yT(v)), em(u, lT, yT(u))); // por baixo do balanço do teto
    quad(branco, em(u, lT, yT(u)), em(v, lT, yT(v)), em(v, lT, yT(v) + 4), em(u, lT, yT(u) + 4)); // a borda fina da frente do teto
    quad(branco, em(u, lT, yT(u) + 4), em(v, lT, yT(v) + 4), em(v, lB, T_TETO - 8), em(u, lB, T_TETO - 8)); // o teto, caindo para trás
    quad(cinza, em(u, lB, -12), em(v, lB, -12), em(v, lB, T_TETO - 8), em(u, lB, T_TETO - 8)); // a parede do fundo
  }
  // as duas pontas: o bico do teto avança e sobe (a "asa"), e a parede fecha o prédio
  for (const [uu, s] of [[uA, -1], [uB, 1]]) {
    const bico = em(uu + s * (PONTA / 6), lT + 6, T_PONTA), yT = T_TETO + onda(uu);
    tri(branco, em(uu, lT, yT + 4), em(uu, lB, T_TETO - 8), bico); // a face de cima do bico
    tri(baixoTeto, em(uu, lT, yT), em(uu, lV, T_VIDRO), bico); // por baixo
    tri(branco, em(uu, lT, yT), em(uu, lT, yT + 4), bico); // a borda
    tri(baixoTeto, em(uu, lV, T_VIDRO), em(uu, lB, T_TETO - 8), bico); // o fechamento de trás do bico
    quad(cinza, em(uu, lF, -12), em(uu, lB, -12), em(uu, lB, T_TETO - 8), em(uu, lF, T_FAIXA)); // a parede da ponta
    tri(vidro, em(uu, lF, T_FAIXA), em(uu, lB, T_TETO - 8), em(uu, lV, T_VIDRO));
  }
  const grupo = new THREE.Group(); grupo.name = "silverstone-the-wing";
  for (const [mat, L] of G0) {
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(L.vs, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(L.uv, 2)); g.setIndex(L.idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat); m.castShadow = mat !== letras; m.receiveShadow = true; grupo.add(m);
  }
  // "SILVERSTONE" no vidro, no meio do prédio (um pouco à frente do vidro, na mesma inclinação)
  {
    const um = (uA + uB) / 2, meia = Math.min(60, (uB - uA) * 0.32), a = 0.42, b = 0.82, li = (t) => lF + (lV - lF) * t - 0.6, yi = (t) => T_FAIXA + (T_VIDRO - T_FAIXA) * t;
    // (o texto corre no sentido da pista; a normal aponta para a direita, então do lado +1 quem olha da pista o veria espelhado: o uv vira)
    const L = { vs: [], uv: lado > 0 ? [1, 0, 0, 0, 0, 1, 1, 1] : [0, 0, 1, 0, 1, 1, 0, 1], idx: [0, 1, 2, 0, 2, 3] };
    L.vs.push(...em(um - meia, li(a), yi(a)), ...em(um + meia, li(a), yi(a)), ...em(um + meia, li(b), yi(b)), ...em(um - meia, li(b), yi(b)));
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(L.vs, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(L.uv, 2)); g.setIndex(L.idx);
    const m = new THREE.Mesh(g, letras); m.renderOrder = 2; m.name = "silverstone-wing-letras"; grupo.add(m);
  }
  // as treliças vermelhas em V, da laje até a borda do teto, a cada ~25 m
  const barra = (A, B, r) => {
    const a = new THREE.Vector3(...A), b = new THREE.Vector3(...B), c = a.clone().add(b).multiplyScalar(0.5), len = a.distanceTo(b);
    const m = new THREE.Mesh(new THREE.BoxGeometry(r, r, len), vermelho); m.position.copy(c); m.lookAt(b); m.castShadow = true; grupo.add(m);
  };
  for (let u = uA + 10; u <= uB - 10; u += 20) {
    const pe = em(u, lF - 2, T_FAIXA), yT = T_TETO + onda(u);
    for (const s of [-1, 1]) barra(pe, em(u + s * 4, lT + 4, yT - 1), 2.2);
    barra(em(u - 4, lT + 4, yT - 1), em(u + 4, lT + 4, yT - 1), 1.6);
  }
  // os painéis da Pirelli no muro dos boxes, virados para a pista (o muro é o do kit: lado * (W/2 + 12,5), 3,6 u de altura)
  {
    const lm = W / 2 + 12.5 - 0.06, u0 = F1.RAMPA + 1, u1 = cor.len - F1.RAMPA - 1, L = { vs: [], uv: [], idx: [] };
    for (let u = u0; u < u1; u += 2) {
      const v = Math.min(u1, u + 2), k = L.vs.length / 3, a = (u - u0) * 6 / 40, b = (v - u0) * 6 / 40;
      L.vs.push(...em(u, lm, 0.4), ...em(v, lm, 0.4), ...em(v, lm, 3.3), ...em(u, lm, 3.3)); L.uv.push(a, 0, b, 0, b, 1, a, 1); L.idx.push(k, k + 1, k + 2, k, k + 2, k + 3);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(L.vs, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(L.uv, 2)); g.setIndex(L.idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, pirelli); m.name = "silverstone-muro-pirelli"; grupo.add(m);
  }
  add(grupo);
  // o espaço do prédio: nada do cenário automático entra nele
  tr.reservado ||= [];
  for (let u = uA; u <= uB; u += 8) { const [x, , z] = em(u, (lF + lB) / 2, 0); tr.reservado.push([x, z, FUNDO / 2 + 30]); }
  return { lado, L0: lB, i0: cor.i0 + Math.floor(uA), i1: cor.i0 + Math.ceil(uB), em };
}
