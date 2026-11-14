// Interlagos — a mata do autódromo: manchas de mata atlântica (copas largas e redondas, em verdes fechados) e fileiras de eucaliptos altos
// (tronco claro, copa estreita verde-acinzentada) na beira, atrás das barreiras, longe das arquibancadas, dos prédios e do lago. As manchas
// vêm de um ruído de valor (a mesma mata sempre); três InstancedMesh (copas, eucaliptos e troncos), sem sombra, para pesar pouco.
import * as THREE from "three";
import { livre, ocupado, sorteio } from "../comum.js";

const hash = (i, j, s) => { let h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(s, 1274126177); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
const suave = (t) => t * t * (3 - 2 * t);
function ruido(x, z, s) {
  const i = Math.floor(x), j = Math.floor(z), fx = suave(x - i), fz = suave(z - j), a = hash(i, j, s), b = hash(i + 1, j, s), c = hash(i, j + 1, s), d = hash(i + 1, j + 1, s);
  return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
}
const mataEm = (x, z) => Math.max(0, Math.min(1, (ruido(x / 420, z / 420, 31) - 0.38) / 0.3)); // 0 = gramado aberto, 1 = mata fechada

const VERDES_MATA = ["#2f6b2a", "#3b7a2e", "#27592a", "#4a8733", "#356f2c", "#1f4f24"];
const VERDES_EUCALIPTO = ["#6f8f62", "#7a9a6a", "#647f58"];
// a copa: três bolas achatadas juntas (icosaedros de 1 subdivisão), num raio 1 e altura 1
function geoCopa() {
  const gs = [[0, 0, 0, 0.75], [0.42, -0.1, 0.2, 0.55], [-0.36, -0.08, -0.26, 0.5]].map(([x, y, z, r]) => { const g = new THREE.IcosahedronGeometry(r, 1).toNonIndexed(); g.scale(1, 0.72, 1); g.translate(x, y, z); return g; });
  const pos = []; for (const g of gs) pos.push(...g.attributes.position.array);
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); return g;
}
function instanciar(add, geo, mat, lista, nome) {
  if (!lista.length) return null;
  const m = add(new THREE.InstancedMesh(geo, mat, lista.length)), d = new THREE.Object3D(), c = new THREE.Color();
  lista.forEach((o, k) => { d.position.set(o.x, o.y, o.z); d.rotation.set(0, o.r || 0, 0); d.scale.set(o.sx, o.sy, o.sz); d.updateMatrix(); m.setMatrixAt(k, d.matrix); m.setColorAt(k, c.set(o.c)); });
  if (m.instanceColor) m.instanceColor.needsUpdate = true;
  m.castShadow = false; m.receiveShadow = false; m.name = nome; return m;
}

/** A mata da beira, dos dois lados, de `recuo` a `recuo + fundo` da borda. `fora(x, z)` diz onde não pode (o lago); `arquibancadas` são os
 * trechos de gps/interlagos.js ({ de, ate, lado }): atrás deles, até `fundoArq` da borda, não entra árvore. */
export function mataDeInterlagos(tr, add, { recuo = 90, fundo = 420, passo = 3, semente = 5520, fora = () => false, arquibancadas = [], fundoArq = 300 } = {}) {
  const { pts, n, W } = tr, r = sorteio(semente), copas = [], eucaliptos = [], troncos = [];
  for (let i = 0; i < n; i += passo) {
    const p = pts[i];
    for (const lado of [-1, 1]) {
      const d = W / 2 + recuo + r() * r() * fundo, x = p.x + p.nx * lado * d + (r() - 0.5) * 30, z = p.y + p.ny * lado * d + (r() - 0.5) * 30;
      if (r() > mataEm(x, z)) continue; // o gramado fica aberto
      const f = i / n; if (d < W / 2 + fundoArq && arquibancadas.some((a) => a.lado === lado && (a.de <= a.ate ? f >= a.de - 0.004 && f <= a.ate + 0.004 : f >= a.de - 0.004 || f <= a.ate + 0.004))) continue;
      const eucalipto = r() < 0.22, alt = eucalipto ? 230 + r() * 110 : 110 + r() * 80, larg = eucalipto ? alt * 0.16 : alt * (0.42 + r() * 0.14);
      const rm = tr.murosEscape?.[lado]?.[i]; if (rm && d - larg < W / 2 + rm + 10) continue; // entre a pista e a barreira, nada
      if (!livre(tr, x, z, larg + 14) || ocupado(tr, x, z, i) || fora(x, z)) continue;
      const y = tr.chao(x, z) - 1.5;
      if (eucalipto) {
        eucaliptos.push({ x, y: y + alt * 0.72, z, sx: larg, sy: alt * 0.4, sz: larg, r: r() * 6, c: VERDES_EUCALIPTO[(r() * VERDES_EUCALIPTO.length) | 0] });
        troncos.push({ x, y: y + alt * 0.3, z, sx: alt * 0.014, sy: alt * 0.62, sz: alt * 0.014, c: "#d8d2c2" });
      } else {
        copas.push({ x, y: y + alt * 0.62, z, sx: larg, sy: alt * 0.5, sz: larg, r: r() * 6, c: VERDES_MATA[(r() * VERDES_MATA.length) | 0] });
        troncos.push({ x, y: y + alt * 0.22, z, sx: alt * 0.025, sy: alt * 0.46, sz: alt * 0.025, c: "#5a4532" });
      }
    }
  }
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.95, flatShading: true });
  instanciar(add, geoCopa(), mat, copas, "interlagos-mata-copas");
  instanciar(add, geoCopa(), mat, eucaliptos, "interlagos-eucaliptos");
  instanciar(add, new THREE.CylinderGeometry(0.8, 1, 1, 5), new THREE.MeshStandardMaterial({ roughness: 1 }), troncos, "interlagos-mata-troncos");
  return { copas: copas.length, eucaliptos: eucaliptos.length };
}
