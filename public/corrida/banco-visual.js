// Corrida da Galera — as curvas inclinadas no desenho (`banking` de pistas.js: a Hugenholtz e a Arie Luyendyk de Zandvoort, a La Monumental de Madri).
// A cena da pista é montada plana como sempre (asfalto, zebras, escape, chão, muros, arquibancadas, enfeites) e, no fim de `buildWorld`, esta passada
// levanta tudo o que fica perto de um trecho inclinado pela MESMA altura que a física usa (Pistas.alturaDoBanco, a mesma conta de sim.js):
//   · as malhas compridas e só delas (o asfalto, as zebras, o chão, o escape, os muros: geometria que nenhuma outra peça usa e maior que PECA) têm
//     cada vértice levantado onde ele está: o asfalto vira o plano inclinado, sem vão entre ele, as zebras e o chão (o chão afunda 9 u embaixo da
//     pista, pista.js, e continua afundado);
//   · as peças pequenas, as de geometria repetida e os grupos pequenos (uma arquibancada, um poste, uma placa, cada cópia de um InstancedMesh) sobem
//     inteiros pela altura do lugar onde estão: ficam em pé e apoiados, sem entortar.
// Depois da passada, `tr.bancoFeito` liga e `groundH` (pista.js) passa a somar o banco: o que entra depois (a vida da pista, os carros) já nasce na altura
// certa. Pista sem `banking`: nada disto roda.
import * as THREE from "three";

const PECA = 12;   // (u) o raio a partir do qual uma malha de geometria só dela é "comprida" e tem os vértices levantados um a um
const GRUPO = 40;  // (u) o tamanho (no chão) até o qual um grupo sobe inteiro, como uma peça só

export function levantarBanco(tr) {
  const P = window.Pistas, bk = P.bancoDaPista(tr);
  if (!bk) return;
  const { pts, n, W } = tr;
  // as caixas no chão dos trechos inclinados, com a sobra do barranco: fora delas nada muda (e nem se calcula)
  const caixas = [];
  let cx = null;
  for (let i = 0; i < n; i++) {
    if (!bk.s[i]) { cx = null; continue; }
    const p = pts[i], R = W / 2 + bk.ext[i] + bk.fade[i] + 4;
    if (!cx) caixas.push((cx = { x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity }));
    cx.x0 = Math.min(cx.x0, p.x - R); cx.x1 = Math.max(cx.x1, p.x + R); cx.z0 = Math.min(cx.z0, p.y - R); cx.z1 = Math.max(cx.z1, p.y + R);
  }
  const perto = (x, z) => caixas.some((c) => x >= c.x0 && x <= c.x1 && z >= c.z0 && z <= c.z1);
  const sobe = (x, z) => (perto(x, z) ? P.alturaDoBanco(tr, x, z, tr.indiceAt(x, z)) : 0);
  const caixaDe = (o) => new THREE.Box3().setFromObject(o);
  const tocaCaixa = (b) => caixas.some((c) => b.max.x >= c.x0 && b.min.x <= c.x1 && b.max.z >= c.z0 && b.min.z <= c.z1);

  tr.grp.updateMatrixWorld(true);
  const usos = new Map();
  tr.grp.traverse((o) => { if (o.geometry) usos.set(o.geometry, (usos.get(o.geometry) || 0) + 1); });
  const v = new THREE.Vector3(), m4 = new THREE.Matrix4(), inv = new THREE.Matrix4(), esc = new THREE.Vector3();

  // a peça inteira sobe pela altura do lugar onde está
  const mover = (o) => {
    o.getWorldPosition(v);
    const d = sobe(v.x, v.z);
    if (!d) return;
    v.y += d; o.parent.worldToLocal(v); o.position.copy(v); o.updateMatrixWorld(true);
  };
  // cada cópia de um InstancedMesh sobe pela altura dela
  const instancias = (o) => {
    let mexeu = false;
    for (let k = 0; k < o.count; k++) {
      o.getMatrixAt(k, m4); m4.premultiply(o.matrixWorld);
      const x = m4.elements[12], z = m4.elements[14], d = sobe(x, z);
      if (!d) continue;
      m4.elements[13] += d; inv.copy(o.matrixWorld).invert(); m4.premultiply(inv); o.setMatrixAt(k, m4); mexeu = true;
    }
    if (mexeu) { o.instanceMatrix.needsUpdate = true; o.computeBoundingSphere?.(); o.computeBoundingBox?.(); }
  };
  // a malha comprida: vértice por vértice
  const deformar = (o) => {
    const pos = o.geometry.attributes.position;
    inv.copy(o.matrixWorld).invert();
    let mexeu = false;
    for (let k = 0; k < pos.count; k++) {
      v.fromBufferAttribute(pos, k).applyMatrix4(o.matrixWorld);
      const d = sobe(v.x, v.z);
      if (!d) continue;
      v.y += d; v.applyMatrix4(inv); pos.setXYZ(k, v.x, v.y, v.z); mexeu = true;
    }
    if (mexeu) { pos.needsUpdate = true; if (o.geometry.attributes.normal && !o.isPoints && !o.isLine) o.geometry.computeVertexNormals(); o.geometry.computeBoundingSphere(); o.geometry.computeBoundingBox(); }
  };
  const visitar = (o) => {
    if (o === tr.sky || o.userData?.semBanco) return;
    if (o.isInstancedMesh) { instancias(o); return; }
    if (o.geometry && o.geometry.attributes?.position) {
      const g = o.geometry; if (!g.boundingSphere) g.computeBoundingSphere(); if (!g.boundingBox) g.computeBoundingBox();
      const bb = new THREE.Box3().copy(g.boundingBox).applyMatrix4(o.matrixWorld);
      if (!tocaCaixa(bb) && !o.children.length) return; // (longe de toda curva inclinada)
      o.getWorldScale(esc);
      const raio = g.boundingSphere.radius * Math.max(Math.abs(esc.x), Math.abs(esc.y), Math.abs(esc.z));
      if (usos.get(g) === 1 && raio > PECA && !o.isSprite) { deformar(o); for (const f of [...o.children]) visitar(f); }
      else if (!o.children.length || tamanhoNoChao(caixaDe(o)) <= GRUPO) mover(o);
      else for (const f of [...o.children]) visitar(f); // (uma peça pequena com filhos grandes: ela fica, os filhos cuidam de si)
      return;
    }
    if (!o.children.length) { mover(o); return; } // luzes e marcadores sem malha
    const b = caixaDe(o);
    if (b.isEmpty() || !tocaCaixa(b)) return;
    if (tamanhoNoChao(b) <= GRUPO) { mover(o); return; }
    for (const f of [...o.children]) visitar(f);
  };
  for (const o of [...tr.grp.children]) visitar(o);
}
const tamanhoNoChao = (b) => (b.isEmpty() ? 0 : Math.max(b.max.x - b.min.x, b.max.z - b.min.z));
