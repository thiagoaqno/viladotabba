// Hungaroring — a paisagem (peça só desta pista): o circuito fica no fundo de uma bacia de morros baixos, de grama seca e dourada no verão, com campos recortados e bosques de carvalho,
// choupo e acácia aqui e ali (não a mata fechada de Spa). Texto de referência: a imprensa chama o lugar de "bacia natural na encosta, no vale" (80% da pista se vê de qualquer ponto), com o solo
// arenoso e a poeira (por isso a grama é seca e a terra clara). Copiado de kit/spa/floresta.js e adaptado: sem abetos, árvores de 15 a 25 m (as de Spa tinham 35 a 62), cores secas.
//  1. `colinas`: os morros em volta da bacia (uma malha só, cor por vértice: capim seco, terra, restolho, plantação verde, bosque), longe do chão da pista;
//  2. `bosquetes`: as árvores perto da pista, em manchas (o ruído decide), sempre depois da barreira e fora do que está reservado;
//  3. `matoDeLonge`: as árvores de longe, em manchas por cima dos morros e da planície.
// Tudo em InstancedMesh, sem sombra própria e sem luz nova. As árvores afundam 3 u abaixo do chão analítico: o tronco nasce da malha e nunca flutua.
import * as THREE from "three";
import { M } from "../../cena.js";
import { livre, ocupado, sorteio } from "../comum.js";

const hash = (i, j, s) => { let h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(s, 1274126177); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
const suave = (t) => t * t * (3 - 2 * t);
function ruido(x, z, s) {
  const i = Math.floor(x), j = Math.floor(z), fx = suave(x - i), fz = suave(z - j), a = hash(i, j, s), b = hash(i + 1, j, s), c = hash(i, j + 1, s), d = hash(i + 1, j + 1, s);
  return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
}
const relevo = (x, z, s = 11) => ruido(x / 1500, z / 1500, s) * 0.55 + ruido(x / 640, z / 640, s + 1) * 0.3 + ruido(x / 260, z / 260, s + 2) * 0.15; // 0 a 1
const lim = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const passo01 = (a, b, v) => suave(lim((v - a) / (b - a)));

function dentroDaVolta(pts, x, z) {
  let d = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const a = pts[i], b = pts[j]; if ((a.y > z) !== (b.y > z) && x < ((b.x - a.x) * (z - a.y)) / (b.y - a.y) + a.x) d = !d; }
  return d;
}

/**
 * Os morros da bacia: começam a `inicio` do centro da pista e sobem até `fim`. A cor mistura o capim seco, a terra clara, o restolho dos campos, a plantação verde e o bosque.
 * @param {object} o { inicio=520, fim=1500, altura=230, margem=1500, passo=110, vazio: [[x, z, raio]], miolo=0.2 }
 */
export function colinas(tr, add, { inicio = 520, fim = 1500, altura = 230, margem = 1500, passo = 110, vazio = [], miolo = 0.2 } = {}) {
  const { pts } = tr, mundo = tr.t.world, x0 = -margem, nn = Math.ceil((mundo + margem * 2) / passo), lado = nn + 1;
  const alt = new Float32Array(lado * lado);
  const capim = new THREE.Color("#b3a85a"), seco = new THREE.Color("#c4b36a"), terra = new THREE.Color("#a58a5c"), restolho = new THREE.Color("#d2c27a"), plantacao = new THREE.Color("#79a043"), bosque = new THREE.Color("#5d7a3a"), cor = new THREE.Color();
  const pos = new Float32Array(lado * lado * 3), cores = new Float32Array(lado * lado * 3);
  for (let j = 0; j < lado; j++) for (let i = 0; i < lado; i++) {
    const x = x0 + i * passo, z = x0 + j * passo, d = tr.distAt(x, z);
    let m = passo01(inicio, fim, d);
    if (m > 0 && d < 2600 && dentroDaVolta(pts, x, z)) m *= miolo;
    for (const [cx, cz, r] of vazio) m *= passo01(r * 0.75, r * 1.5, Math.hypot(x - cx, z - cz));
    const f = relevo(x, z), h = m * (24 + altura * f * f), k = j * lado + i;
    alt[k] = h; pos[k * 3] = x; pos[k * 3 + 1] = h - 3; pos[k * 3 + 2] = z;
    // a cor: capim seco e terra clara; campos em retalhos (restolho dourado, terra arada, plantação verde) nas encostas suaves; bosque escuro nas dobras
    const t = lim(h / (altura * 0.7)), campo = ruido(x / 330, z / 330, 23), retalho = ruido(x / 140, z / 140, 61), mata = ruido(x / 420, z / 420, 77);
    cor.copy(capim).lerp(seco, passo01(0.3, 0.7, ruido(x / 200, z / 200, 5)));
    if (campo > 0.5 && t < 0.7) cor.lerp(retalho < 0.33 ? restolho : retalho < 0.62 ? terra : plantacao, passo01(0.5, 0.58, campo));
    if (mata > 0.66) cor.lerp(bosque, passo01(0.66, 0.78, mata) * 0.8);
    cor.multiplyScalar(0.92 + ruido(x / 90, z / 90, 3) * 0.16);
    cores[k * 3] = cor.r; cores[k * 3 + 1] = cor.g; cores[k * 3 + 2] = cor.b;
  }
  const idx = [];
  for (let j = 0; j < nn; j++) for (let i = 0; i < nn; i++) {
    const a = j * lado + i, b = a + 1, c = a + lado, d = c + 1;
    if (alt[a] + alt[b] + alt[c] + alt[d] < 0.5) continue;
    if (Math.abs(alt[a] - alt[d]) < Math.abs(alt[b] - alt[c])) idx.push(a, c, d, a, d, b); else idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(cores, 3)); g.setIndex(idx); g.computeVertexNormals();
  const malha = add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true })));
  malha.name = `${tr.id}-colinas`; malha.receiveShadow = false; malha.castShadow = false;
  const alturaEm = (x, z) => {
    const u = (x - x0) / passo, v = (z - x0) / passo; if (u < 0 || v < 0 || u >= nn || v >= nn) return 0;
    const i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j, a = alt[j * lado + i], b = alt[j * lado + i + 1], c = alt[(j + 1) * lado + i], d = alt[(j + 1) * lado + i + 1];
    return a + (b - a) * fu + (c - a) * fv + (a - b - c + d) * fu * fv;
  };
  tr.colinasHU = { alturaEm, triangulos: idx.length / 3 };
  return { alturaEm, malha };
}

// ---- as árvores ----
function instanciar(add, geo, mat, lista, nome) {
  if (!lista.length) return null;
  const m = add(new THREE.InstancedMesh(geo, mat, lista.length)), d = new THREE.Object3D();
  lista.forEach((o, k) => { d.position.set(o.x, o.y, o.z); d.rotation.set(0, o.r || 0, 0); d.scale.set(o.sx ?? 1, o.sy ?? 1, o.sz ?? 1); d.updateMatrix(); m.setMatrixAt(k, d.matrix); m.setColorAt(k, new THREE.Color(o.c)); });
  m.instanceColor.needsUpdate = true; m.castShadow = false; m.receiveShadow = false; m.name = nome; return m;
}
function juntar(gs) {
  const pos = [], nor = [], idx = []; let base = 0;
  for (const g0 of gs) { const g = g0.index ? g0.toNonIndexed() : g0; g.computeVertexNormals(); const p = g.attributes.position, n = g.attributes.normal; for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); idx.push(base + i); } base += p.count; }
  const r = new THREE.BufferGeometry(); r.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); r.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); r.setIndex(idx); return r;
}
// a copa de folhosa (carvalho, choupo): três esferas facetadas juntas, de ~1 de largura e 1 de altura (a base fica em y = 0)
const geoCopa = () => juntar([[0, 0.5, 0, 0.5], [0.3, 0.34, 0.1, 0.34], [-0.26, 0.38, -0.12, 0.32]].map(([x, y, z, r]) => { const s = new THREE.IcosahedronGeometry(r, 0); s.translate(x, y, z); return s; }));
const VERDES = ["#6f8f3a", "#7f9a3f", "#5f8334", "#8d9a3a", "#a39a3c", "#6b7f33"]; // folhagem de fim de verão: alguma já amarelando
const material = () => new THREE.MeshStandardMaterial({ roughness: 0.95, flatShading: true });
const TRONCO = (alt) => ({ sx: Math.max(1.1, alt * 0.03), sy: alt * 0.42, sz: Math.max(1.1, alt * 0.03) });

/**
 * As árvores perto da pista, em manchas: só depois de `recuo` da borda (a barreira do escape, as arquibancadas e o prédio ficam antes) e só onde `livre` e `ocupado` deixam.
 * @param {object} cfg { recuo=130, fundo=420, passo=3, chance=0.5, alturas=[75, 125], semente, evitar: [{ f0, f1, lado, lat0, lat1 }] }
 */
export function bosquetes(tr, add, cfg = {}) {
  const { pts, n, W } = tr, r = sorteio(cfg.semente ?? 4242), d0 = W / 2 + (cfg.recuo ?? 130), fundo = cfg.fundo ?? 420, [aMin, aMax] = cfg.alturas || [75, 125], passo = cfg.passo ?? 3, evitar = cfg.evitar || [];
  const copas = [], troncos = [];
  for (let i = 0; i < n; i += passo) {
    const p = pts[i];
    for (const lado of [-1, 1]) {
      const d = d0 + r() * r() * fundo, x = p.x + p.nx * lado * d + (r() - 0.5) * 30, z = p.y + p.ny * lado * d + (r() - 0.5) * 30;
      const mancha = ruido(x / 300, z / 300, 8); if (mancha < 0.56 || r() > (cfg.chance ?? 0.5) * (0.5 + mancha)) continue;
      const alt = aMin + r() * (aMax - aMin), larg = alt * (0.5 + r() * 0.15);
      if (evitar.some((q) => q.lado === lado && i >= q.f0 * n && i <= q.f1 * n && d + larg > q.lat0 - 10 && d - larg < q.lat1 + 14)) continue;
      if (!livre(tr, x, z, larg + 14) || ocupado(tr, x, z, i % n)) continue;
      const y = tr.chao(x, z) - 3, c = VERDES[(r() * VERDES.length) | 0];
      copas.push({ x, y: y + alt * 0.4, z, sx: larg, sy: alt * 0.62, sz: larg, r: r() * 6, c });
      troncos.push({ x, y, z, ...TRONCO(alt), c: "#5b4a38" });
    }
  }
  const mat = material();
  instanciar(add, geoCopa(), mat, copas, `${tr.id}-copas`);
  instanciar(add, new THREE.CylinderGeometry(0.8, 1, 1, 5).translate(0, 0.5, 0), M(0xffffff, { roughness: 1 }), troncos, `${tr.id}-troncos`);
  tr.bosquetesHU = { arvores: copas.length };
  return tr.bosquetesHU;
}

/** As árvores de longe, em manchas por cima dos morros e da planície (o ruído decide onde é bosque e onde é campo aberto). */
export function matoDeLonge(tr, add, rel, { passo = 110, minDist = 320, densidade = 1, semente = 5171, ext = 1400 } = {}) {
  const r = sorteio(semente), mundo = tr.t.world, copas = [], troncos = [];
  for (let x = -ext; x < mundo + ext; x += passo) for (let z = -ext; z < mundo + ext; z += passo) {
    const px = x + (r() - 0.5) * passo * 0.9, pz = z + (r() - 0.5) * passo * 0.9, d = tr.distAt(px, pz);
    if (d < minDist) continue;
    const mata = ruido(px / 420, pz / 420, 91), prob = lim((d - minDist) / 400, 0.1, 1) * densidade * passo01(0.5, 0.66, mata) * 0.8;
    if (r() > prob || ocupado(tr, px, pz)) continue;
    const y = Math.max(tr.chao(px, pz), rel.alturaEm(px, pz) - 3) - 3, alt = 80 + r() * 60, w = alt * (0.5 + r() * 0.15);
    copas.push({ x: px, y: y + alt * 0.4, z: pz, sx: w, sy: alt * 0.62, sz: w, r: r() * 6, c: VERDES[(r() * VERDES.length) | 0] });
    troncos.push({ x: px, y, z: pz, ...TRONCO(alt), c: "#5b4a38" });
  }
  const mat = material();
  instanciar(add, geoCopa(), mat, copas, `${tr.id}-copas-longe`);
  instanciar(add, new THREE.CylinderGeometry(0.8, 1, 1, 5).translate(0, 0.5, 0), M(0xffffff, { roughness: 1 }), troncos, `${tr.id}-troncos-longe`);
  tr.matoHU = { arvores: copas.length };
  return tr.matoHU;
}
