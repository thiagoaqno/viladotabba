// Montreal — os muros de concreto colados na pista (a marca do circuito: quase não há área de escape), o alambrado em cima deles, os
// blocos vermelhos e brancos de proteção e o Muro dos Campeões, na saída da chicane final, com a inscrição "Bienvenue au Québec".
// Tudo é cenário (a física não muda): o muro fica a `muroLat(tr)` da linha central (W / 2 + 28, ou seja, 28 u = 5,8 m da BORDA do asfalto), depois da zebra e da faixa de escape do kit.
// Na escala real (1 u = 0,2083 m): muro de 1,25 m (antes 13 u = 2,7 m), alambrado de 3,1 m por cima, blocos de 1 m, o Muro dos Campeões de 1,5 m com a inscrição na altura dele e os pneus de 1 m de diâmetro.
//   muros(tr, add, trechos) · [{ de, ate, lado, lat, alto }] (frações da volta; lado 1 ou -1; `lat`: o deslocamento; `cerca`: false tira o alambrado)
//   blocos(tr, add, trechos) · os blocos de plástico/concreto vermelhos e brancos (a faixa que corre em frente do muro)
//   muroDosCampeoesMontreal(tr, add, f0, f1) · o muro branco com a inscrição e a pilha de pneus vermelhos e brancos na frente
// Referências (Wikimedia Commons): "Circuit Gilles Villeneuve Famous Wall" (a inscrição preta em cursiva, os pneus pintados e os blocos vermelhos e
// brancos na frente, o alambrado em cima), "Felipe Massa Canada 2012" e "Circuit Gilles-Villeneuve1" (concreto cinza claro com alambrado e
// bloco vermelho e branco nas curvas).
import * as THREE from "three";
import { canvasTex } from "../../../cena.js";
import { lotes, tira, recortar, sinalDaCurva, sorteio } from "../comum.js";
import { muroDosCampeoes } from "./marcas.js";
import { nivelDoChao } from "./chao.js";

export const MURO_FOLGA = 28; // da borda do asfalto até a face do muro (u)
export const muroLat = (tr) => tr.W / 2 + MURO_FOLGA; // da linha central (com a pista de 120 u de antes eram 88; com a de 58 u de hoje, 57: a mesma distância da borda)
const BASE = -0.6; // o pé do muro, enterrado na grama (a fita de chao.js fica de 0,1 abaixo a 0,7 acima da altura da pista)
const TILE = 24; // o comprimento de uma placa de concreto (5 m)

const matConcreto = () => new THREE.MeshStandardMaterial({ roughness: 0.95, side: THREE.DoubleSide, map: canvasTex(128, 64, (x, w, h, rr) => {
  x.fillStyle = "#d8d6d0"; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 500; i++) { x.fillStyle = rr() < 0.5 ? "#00000010" : "#ffffff16"; x.fillRect(rr() * w, rr() * h, 3, 2); }
  x.fillStyle = "#b3b1aa"; x.fillRect(0, 0, 2, h); x.fillRect(0, h - 6, w, 6); x.fillStyle = "#c8c6bf"; x.fillRect(0, 0, w, 3); // a junta das placas e a base manchada
}) });
const matTopo = () => new THREE.MeshStandardMaterial({ color: 0xc9c7c0, roughness: 0.9, side: THREE.DoubleSide });
const matAlambrado = () => new THREE.MeshStandardMaterial({ roughness: 0.7, metalness: 0.4, transparent: true, side: THREE.DoubleSide, depthWrite: false, alphaTest: 0.2, map: canvasTex(32, 32, (x, w, h) => {
  x.clearRect(0, 0, w, h); x.strokeStyle = "#8d9399"; x.lineWidth = 1.5;
  for (let k = -h; k < w + h; k += 8) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k + h, h); x.stroke(); x.beginPath(); x.moveTo(k, h); x.lineTo(k + h, 0); x.stroke(); }
  x.fillStyle = "#6e757c"; x.fillRect(0, 0, w, 3); x.fillRect(w - 2, 0, 2, h); // o poste (uma linha por repetição) e o fio de cima
}) });
const MALHA = 9.6; // a repetição do alambrado (4 losangos de 2,4 u = 0,5 m)
const matBloco = () => new THREE.MeshStandardMaterial({ roughness: 0.6, side: THREE.DoubleSide, map: canvasTex(16, 64, (x, w, h, rr) => { // o v corre ao longo do bloco: metade vermelha, metade branca
  x.fillStyle = "#f4f2ee"; x.fillRect(0, 0, w, h); x.fillStyle = "#d52b1e"; x.fillRect(0, 0, w, h / 2);
  for (let i = 0; i < 60; i++) { x.fillStyle = rr() < 0.5 ? "#00000012" : "#ffffff18"; x.fillRect(rr() * w, rr() * h, 2, 3); }
  x.fillStyle = "#00000030"; x.fillRect(0, 0, w, 1); x.fillRect(0, h / 2, w, 1);
}) });

// o pedaço [de, ate] (frações) na lateral `lat`, sem passar por cima de outro trecho da pista (o grampo)
function trecho(tr, de, ate, lado, lat) {
  const { n } = tr, i0 = Math.floor(de * n), i1 = Math.floor((ate < de ? ate + 1 : ate) * n);
  return recortar(tr, i0, i1, [lado * lat], 3);
}

export function muros(tr, add, trechos, { alto = 6.7, cerca = 15 } = {}) { // alto: do pé até o topo, acima da altura da pista (1,25 m de muro à vista sobre a grama)
  const L = lotes(), concreto = matConcreto(), topo = matTopo(), alambrado = matAlambrado();
  let comprimento = 0;
  for (const t of trechos) {
    const lat = t.lat ?? muroLat(tr), h = t.alto ?? alto, r = trecho(tr, t.de, t.ate, t.lado, lat); if (!r) continue;
    const l = t.lado * lat, v1 = ((r.i1 - r.i0) * 6) / TILE;
    tira(tr, L.de(concreto), r.i0, r.i1, l, l, BASE, h, 0, v1); // a face, de frente para a pista (o material é de dois lados)
    tira(tr, L.de(topo), r.i0, r.i1, l - 1.6, l + 1.6, h, h, 0, 1);
    if (t.cerca !== false && cerca) tira(tr, L.de(alambrado), r.i0, r.i1, l, l, h, h + cerca, 0, ((r.i1 - r.i0) * 6) / MALHA, 0, cerca / MALHA);
    comprimento += (r.i1 - r.i0) * 6;
  }
  L.montar(add, `${tr.id}-muros`);
  tr.murosMontreal = (tr.murosMontreal || 0) + comprimento;
}

export function blocos(tr, add, trechos) {
  const L = lotes(), mat = matBloco(), r0 = sorteio(404);
  for (const t of trechos) {
    const lat = t.lat ?? muroLat(tr) - 6, r = trecho(tr, t.de, t.ate, t.lado, lat + 3); if (!r) continue; // (a frente do bloco a 22 u da borda, 6 u antes do muro)
    const l = t.lado * lat, v1 = ((r.i1 - r.i0) * 6) / 19.2, h = t.alto ?? 5.4, g = 4; // o bloco de plástico: 1 m de altura, 0,8 m de espessura, 2 m de cada cor
    tira(tr, L.de(mat), r.i0, r.i1, l, l, BASE, h, 0, v1); // a face de frente para a pista
    tira(tr, L.de(mat), r.i0, r.i1, l, l + t.lado * g, h, h, 0, v1); // o topo
    tira(tr, L.de(mat), r.i0, r.i1, l + t.lado * g, l + t.lado * g, h, BASE, 0, v1); // a face de trás
    void r0;
  }
  L.montar(add, `${tr.id}-blocos`);
}

/**
 * O Muro dos Campeões: no trecho que a física usa (`Pistas.muroCampeoes`, pistas.js: é nele que `tr.pneus` bate), no lado de fora da última curva. Devolve { lado, i0, i1, x, z } do meio da inscrição.
 * Onde a física o põe: o carro (o centro dele) para a W / 2 + 26 da linha central (`pneu` em sim.js e fisica.js) e a lateral dele chega a uns 4,6 u mais fora (1,9 m de largura); a frente dos pneus fica a W / 2 + 31
 * (1,2 u depois), a pilha de pneus tem 6 u de diâmetro (1,25 m) e 5 de altura (1,25 m), e a face do muro de concreto vem logo atrás, a W / 2 + 37,5. O concreto tem 1,5 m, com o alambrado de 3,1 m por cima.
 */
export function muroDosCampeoesMontreal(tr, add, f0, f1, fa = 0.95) {
  const { pts, n, W } = tr, fis = window.Pistas?.muroCampeoes?.(pts);
  const i0 = fis ? fis.i0 : Math.floor(f0 * n), i1 = fis ? fis.i1 : Math.floor(f1 * n), lado = fis ? fis.lado : -sinalDaCurva(pts, n, Math.floor(fa * n)); // o lado de fora da curva da saída
  const r = fis ? { i0, i1 } : recortar(tr, i0, i1, [lado * (W / 2 + 37.5)], 3); if (!r) return null;
  const lat = W / 2 + 37.5, ALTO = 7.4, L = lotes(), concreto = matConcreto(), topo = matTopo(), alambrado = matAlambrado(), l = lado * lat;
  tira(tr, L.de(concreto), r.i0, r.i1, l, l, BASE, ALTO, 0, ((r.i1 - r.i0) * 6) / TILE);
  tira(tr, L.de(topo), r.i0, r.i1, l - 1.8, l + 1.8, ALTO, ALTO, 0, 1);
  tira(tr, L.de(alambrado), r.i0, r.i1, l, l, ALTO, ALTO + 15, 0, ((r.i1 - r.i0) * 6) / MALHA, 0, 15 / MALHA);
  L.montar(add, `${tr.id}-muro-dos-campeoes`);
  // a inscrição: um quadro reto no trecho de trás (a pista é reta ali), de frente para quem sai da chicane. Do tamanho do muro (1,3 m de altura, 8 m de comprimento)
  const meio = Math.floor((r.i0 + r.i1) / 2), p = pts[meio % n], alt = 6.1, larg = Math.min(alt * 1024 / 160, (r.i1 - r.i0) * 6 - 20), tx = p.tx, ty = p.ty;
  const cx = p.x + p.nx * lado * (lat - 0.4) + tx * 8, cz = p.y + p.ny * lado * (lat - 0.4) + ty * 8;
  const quadro = new THREE.Mesh(new THREE.PlaneGeometry(larg, larg * 0.156), new THREE.MeshStandardMaterial({ map: muroDosCampeoes(), roughness: 0.9, side: THREE.FrontSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  quadro.position.set(cx, p.h + 0.9 + alt / 2, cz);
  // a frente (+z do plano) aponta para a pista: do muro para o centro, ou seja, -lado·n
  quadro.rotation.y = Math.atan2(-lado * p.nx, -lado * p.ny); quadro.name = `${tr.id}-inscricao-muro`; add(quadro);
  // a pilha de pneus pintados de vermelho e branco, na frente do muro (de 31 a 37 u da borda), 5 pneus de altura, um por ponto da pista
  const pneu = new THREE.TorusGeometry(2.4, 0.6, 6, 12); pneu.rotateX(Math.PI / 2); // 1,25 m de diâmetro, 0,25 m de espessura
  const maximo = (r.i1 - r.i0 + 2) * 5;
  const brancos = new THREE.InstancedMesh(pneu, new THREE.MeshStandardMaterial({ color: 0xf1efe9, roughness: 0.85 }), maximo), vermelhos = new THREE.InstancedMesh(pneu, new THREE.MeshStandardMaterial({ color: 0xc8261b, roughness: 0.85 }), maximo), d = new THREE.Object3D();
  let nb = 0, nv = 0;
  for (let i = r.i0; i <= r.i1; i += 1) {
    const q = pts[i % n], x = q.x + q.nx * lado * (W / 2 + 34), z = q.y + q.ny * lado * (W / 2 + 34), chao = nivelDoChao(tr, x, z);
    for (let k = 0; k < 5; k++) {
      d.position.set(x, chao + 0.6 + k * 1.2, z); d.rotation.set(0, 0, 0); d.updateMatrix();
      if ((i + k) % 2) { brancos.setMatrixAt(nb++, d.matrix); } else { vermelhos.setMatrixAt(nv++, d.matrix); }
    }
  }
  brancos.count = nb; vermelhos.count = nv; brancos.castShadow = vermelhos.castShadow = true; brancos.name = `${tr.id}-pneus-brancos`; vermelhos.name = `${tr.id}-pneus-vermelhos`; add(brancos); add(vermelhos);
  return { lado, i0: r.i0, i1: r.i1, x: cx, z: cz, meio };
}
