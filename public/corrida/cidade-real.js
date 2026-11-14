// Corrida da Galera — a cidade real ao fundo do cenário 3D de um GP (o Thiago, 2026-11-14): os prédios de verdade em volta do circuito, do
// mapa real (public/corrida/mapas/<pista>.json, ferramentas/mapa-real.js: © colaboradores do OpenStreetMap, ODbL), que já vem nas unidades do
// traçado do jogo e encaixado nele. Só um pano de fundo, pela escala antiga (a pista do jogo é bem mais larga que a real, e o encaixe erra alguns
// metros): fica de fora tudo num corredor em volta da pista (onde estão as arquibancadas, os boxes e o parque do cenário próprio) e tudo fora
// do chão do mundo; cada prédio afunda a base abaixo do terreno mais baixo sob ele (nada flutua) e tem a altura real. Uma malha só, sem sombra.
// Cada GP liga no próprio cenário (gps/<pista>.js): `cidadeReal(tr, ctx, "monza")`. Sem o arquivo, não faz nada.
import * as THREE from "three";

const CORREDOR_M = 180; // metros além da borda da pista sem prédio
const cache = new Map();
const dados = (pista) => { if (!cache.has(pista)) cache.set(pista, fetch(`/corrida/mapas/${pista}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null)); return cache.get(pista); };
// as cores: paredes de reboco claro e bege, telhados de terracota e cinza (variam por prédio, sempre o mesmo para o mesmo prédio)
const PAREDES = [0xd9d2c5, 0xcfc6b6, 0xe2ddd2, 0xbfb6a8, 0xd6cbb4, 0xc4c0b8], TELHADOS = [0x9a5a42, 0x8a4f3c, 0x6f6c69, 0x7d7a74, 0xa86a4e];

export function cidadeReal(tr, ctx, pista, op = {}) {
  dados(pista).then((D) => { if (D && D.predios) montar(tr, ctx, D, op); });
}

function montar(tr, ctx, D, op) {
  const world = (tr.t && tr.t.world) || 0, u = D.uPorMetro || 2.6, folga = (tr.W || 120) / 2 + (op.corredor ?? CORREDOR_M) * u, pad = ((ctx.size || world) - world) / 2;
  const min = -pad + 60, max = world + pad - 60; // o chão do mundo (pista.js: de −pad a WORLD + pad)
  const pos = [], cor = [], cP = new THREE.Color(), cT = new THREE.Color();
  let n = 0;
  for (const [altM, ...flat] of D.predios) {
    const a = []; for (let i = 0; i < flat.length; i += 2) a.push(new THREE.Vector2(flat[i], flat[i + 1]));
    if (a.length < 3) continue;
    if (a.some((p) => p.x < min || p.y < min || p.x > max || p.y > max)) continue;
    const cx = a.reduce((s, p) => s + p.x, 0) / a.length, cy = a.reduce((s, p) => s + p.y, 0) / a.length;
    if (tr.distAt(cx, cy) < folga || a.some((p) => tr.distAt(p.x, p.y) < folga * 0.9)) continue;
    // a base: o terreno mais baixo sob o prédio, afundada (nada flutua); o topo: a altura real
    let chao = Infinity; for (const p of a) chao = Math.min(chao, ctx.hAt(p.x, p.y)); chao = Math.min(chao, ctx.hAt(cx, cy));
    const y0 = chao - 2, y1 = chao + Math.max(6, altM) * u;
    const k = Math.abs(Math.round(cx * 7 + cy * 13)); cP.setHex(PAREDES[k % PAREDES.length]); cT.setHex(TELHADOS[(k >> 3) % TELHADOS.length]);
    for (let i = 0; i < a.length; i++) {
      const p = a[i], q = a[(i + 1) % a.length], sombra = 0.82 + 0.18 * Math.abs(Math.cos(Math.atan2(q.y - p.y, q.x - p.x))); // (as paredes viradas para um lado ficam um pouco mais escuras)
      pos.push(p.x, y0, p.y, q.x, y0, q.y, q.x, y1, q.y, p.x, y0, p.y, q.x, y1, q.y, p.x, y1, p.y);
      for (let j = 0; j < 6; j++) cor.push(cP.r * sombra, cP.g * sombra, cP.b * sombra);
    }
    for (const [i, j, kk] of THREE.ShapeUtils.triangulateShape(a, [])) for (const v of [a[i], a[j], a[kk]]) { pos.push(v.x, y1, v.y); cor.push(cT.r, cT.g, cT.b); }
    n++;
  }
  if (!pos.length) return;
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(cor, 3)); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }));
  m.name = "cidade-real"; m.castShadow = false; m.receiveShadow = false; m.matrixAutoUpdate = false; m.updateMatrix();
  ctx.add(m);
  if (op.aoMontar) op.aoMontar(n);
}
