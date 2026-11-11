// Abu Dhabi — o PRÉDIO DOS BOXES de Yas Marina (Tilke / Klein Associates; cobertura refeita pela BDP Pattern em 2023): as garagens do kit
// (kit/corredor-boxes.js, que mandam no pit stop) viram o térreo; por cima, dois andares de vidro com as lajes brancas em balanço sobre a
// faixa de trabalho, e no alto o terraço de hospitalidade da cobertura, com os toldos brancos tensionados (as fotos). Três andares de escritórios
// da direção de prova (tilke.de). O prédio segue o corredor (F1Regras.corredor: `u` em pontos da pista a partir de `i0`, `l` da linha central).
// Medidas das fotos: o térreo das garagens é o do kit (27 u, 5,6 m); cada andar de cima 4,2 m; a laje avança 3 m; o prédio tem 30 m de fundo.
import * as THREE from "three";
import { canvasTex } from "../../cena.js";

const KM = 4.8, T_GARAGEM = 27, ANDAR = 4.2 * KM, BALANCO = 3 * KM, FUNDO = 30 * KM;
export function predioDosBoxes(tr, add) {
  const F1 = window.F1Regras, cor = F1?.corredor(tr.t, tr.n, tr.W); if (!cor) return null;
  const { pts, n } = tr, lado = cor.lado, G = cor.garagemLat;
  const em = (u, l, y) => {
    const i = cor.i0 + Math.floor(u), f = u - Math.floor(u), a = pts[((i % n) + n) % n], b = pts[(((i + 1) % n) + n) % n];
    const nx = a.nx + (b.nx - a.nx) * f, ny = a.ny + (b.ny - a.ny) * f, h = a.h + (b.h - a.h) * f;
    return [a.x + (b.x - a.x) * f + nx * lado * l, h + y, a.y + (b.y - a.y) * f + ny * lado * l];
  };
  const lotes = new Map(), lote = (mat) => { if (!lotes.has(mat)) lotes.set(mat, { vs: [], uv: [], idx: [] }); return lotes.get(mat); };
  const quad = (mat, A, B, C, D, uv = [0, 0, 1, 0, 1, 1, 0, 1]) => { const L = lote(mat), k = L.vs.length / 3; L.vs.push(...A, ...B, ...C, ...D); L.uv.push(...uv); L.idx.push(k, k + 1, k + 2, k, k + 2, k + 3); };
  const vidro = new THREE.MeshStandardMaterial({ roughness: 0.1, metalness: 0.6, side: THREE.DoubleSide, map: canvasTex(128, 128, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#8fb3c9"); g.addColorStop(1, "#2a4458"); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = "#e8ecef"; x.fillRect(0, 0, 3, h); x.fillRect(w / 2 - 1, 0, 2, h);
  }) });
  const branco = new THREE.MeshStandardMaterial({ color: 0xf4f4f1, roughness: 0.45, side: THREE.DoubleSide }), cinza = new THREE.MeshStandardMaterial({ color: 0x4a4d52, roughness: 0.8, side: THREE.DoubleSide });
  const toldo = new THREE.MeshStandardMaterial({ color: 0xfbfbf8, roughness: 0.7, side: THREE.DoubleSide });
  const uA = -10, uB = cor.len + 10, passo = 2, lF = G - 2, lB = G + FUNDO, y1 = T_GARAGEM, y2 = y1 + ANDAR, y3 = y2 + ANDAR;
  for (let u = uA; u < uB; u += passo) {
    const v = Math.min(uB, u + passo), ru = (u - uA) * 6 / 24, rv = (v - uA) * 6 / 24, tuv = [ru, 0, rv, 0, rv, 1, ru, 1];
    quad(cinza, em(u, lF + 18, -12), em(v, lF + 18, -12), em(v, lF + 18, y1), em(u, lF + 18, y1)); // o fundo das garagens, até o chão
    for (const [ya, yb] of [[y1, y2], [y2, y3]]) {
      quad(vidro, em(u, lF + 6, ya + 1.5), em(v, lF + 6, ya + 1.5), em(v, lF + 6, yb), em(u, lF + 6, yb), tuv); // a fachada de vidro, recuada da laje
      quad(branco, em(u, lF - BALANCO, ya), em(v, lF - BALANCO, ya), em(v, lB, ya), em(u, lB, ya)); // a laje
      quad(branco, em(u, lF - BALANCO, ya), em(v, lF - BALANCO, ya), em(v, lF - BALANCO, ya + 1.5), em(u, lF - BALANCO, ya + 1.5)); // a borda branca da laje
    }
    quad(branco, em(u, lF - BALANCO, y3), em(v, lF - BALANCO, y3), em(v, lB, y3), em(u, lB, y3)); // a laje da cobertura (o terraço)
    quad(branco, em(u, lF - BALANCO, y3), em(v, lF - BALANCO, y3), em(v, lF - BALANCO, y3 + 5), em(u, lF - BALANCO, y3 + 5)); // o guarda-corpo do terraço
    quad(cinza, em(u, lB, -12), em(v, lB, -12), em(v, lB, y3), em(u, lB, y3)); // a parede do fundo
  }
  for (const uu of [uA, uB]) quad(cinza, em(uu, lF, -12), em(uu, lB, -12), em(uu, lB, y3), em(uu, lF, y3)); // as pontas
  // os toldos do terraço: velas brancas em fila (cada uma um losango esticado entre dois mastros altos e dois baixos), uma a cada 18 m
  const grupo = new THREE.Group(); grupo.name = "abudhabi-boxes";
  for (let u = uA + 6, k = 0; u < uB - 6; u += 18 * KM / 6, k++) {
    const w = 7 * KM / 6, alto = k % 2 ? 9 : 4, baixo = k % 2 ? 4 : 9, l0 = lF + 4, l1 = lF + FUNDO * 0.7;
    const A = em(u, l0, y3 + 14 + alto), B = em(u + w, l0, y3 + 14 + baixo), C = em(u + w, l1, y3 + 14 + alto), D = em(u, l1, y3 + 14 + baixo);
    quad(toldo, A, B, C, D);
    for (const [P, o] of [[A, alto], [B, baixo], [C, alto], [D, baixo]]) { const [x, y, z] = P, pe = y - 14 - o, m = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, y - pe), branco); m.position.set(x, (y + pe) / 2, z); grupo.add(m); } // (cada mastro do terraço até a ponta da vela)
  }
  for (const [mat, L] of lotes) {
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(L.vs, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(L.uv, 2)); g.setIndex(L.idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat); m.castShadow = m.receiveShadow = true; grupo.add(m);
  }
  add(grupo);
  tr.reservado ||= [];
  for (let u = uA; u <= uB; u += 8) { const [x, , z] = em(u, (lF + lB) / 2, 0); tr.reservado.push([x, z, FUNDO / 2 + 30]); }
  return { lado, lB, i0: cor.i0 + uA, i1: cor.i0 + uB };
}
