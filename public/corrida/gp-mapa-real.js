// Corrida da Galera — o mapa real em volta da pista, no fundo da miniatura 3D (gp-miniatura.js): os prédios em blocos (com a altura do
// OpenStreetMap, exagerada como o relevo da TV), as ruas, a água e as áreas verdes. Os dados vêm prontos de public/corrida/mapas/<pista>.json
// (ferramentas/mapa-real.js, © colaboradores do OpenStreetMap, ODbL), nas unidades do traçado do jogo; aqui só viram malhas, poucas e juntas
// (uma para os prédios, uma para as ruas, uma para cada cor do chão), dentro do disco da miniatura e fora da faixa da pista.
import * as THREE from "three";

const cache = new Map();
const EXAGERO = 2; // os prédios ficam com o dobro da altura: na escala da miniatura, a altura real some
// as cores: a base escura de sempre (o resultado, a sala) e a clara e a escura da Central da carreira
const CORES = {
  padrao: { predio: 0x2b4466, topo: 0x3d5f8a, rua: 0x1d2938, ruaG: 0x2f4157, agua: 0x0f2a40, verde: 0x13281d },
  claro: { predio: 0xc9d0d9, topo: 0xe3e8ee, rua: 0xffffff, ruaG: 0xffffff, agua: 0xb4d6ea, verde: 0xd3e6c8 },
  escuro: { predio: 0x2c3442, topo: 0x3b4556, rua: 0x2a2d33, ruaG: 0x3a3e46, agua: 0x16263a, verde: 0x1a2a20 },
};
const GRANDES = new Set(["motorway", "trunk", "primary", "secondary"]);

// `grupo`: onde o mapa entra; `op`: { pista, s e cx, cy (a transformação do traçado para a cena: (x - cx) × s), raio (o disco), tema, v (os
// pontos da pista na cena, para tirar o que cai em cima dela), larg (a meia largura da faixa da pista) }. Devolve as malhas ou null.
export async function montarMapaReal(grupo, op) {
  let D = cache.get(op.pista);
  if (D === undefined) {
    try { const r = await fetch(`/corrida/mapas/${op.pista}.json`); D = r.ok ? await r.json() : null; } catch (e) { D = null; }
    cache.set(op.pista, D);
  }
  if (!D || !grupo.parent) return null;
  const C = CORES[op.tema] || CORES.padrao, s = op.s, R2 = op.raio * op.raio, alto = D.uPorMetro * s * EXAGERO;
  const X = (x) => (x - op.cx) * s, Z = (y) => (y - op.cy) * s;
  // perto da pista (na cena): o que cai a menos de `folga` da linha central fica de fora, para não furar a faixa nem a parede do relevo
  const folga2 = (op.larg * 2.2) ** 2, passo = Math.max(1, Math.floor(op.v.length / 300)), linha = op.v.filter((_, i) => i % passo === 0);
  const pertoDaPista = (x, z) => { for (const p of linha) { const dx = p.x - x, dz = p.z - z; if (dx * dx + dz * dz < folga2) return true; } return false; };
  const anelNaCena = (flat) => { const a = []; for (let i = 0; i < flat.length; i += 2) a.push(new THREE.Vector2(X(flat[i]), Z(flat[i + 1]))); return a; };
  const centro = (a) => a.reduce((m, p) => [m[0] + p.x / a.length, m[1] + p.y / a.length], [0, 0]);
  const malhas = [];

  // o chão: as áreas verdes e a água, triangulados, num plano logo acima do disco
  const chao = (lista, cor, y) => {
    const pos = [];
    for (const flat of lista) {
      const a = anelNaCena(flat); if (a.length < 3) continue;
      const [cx, cz] = centro(a); if (cx * cx + cz * cz > R2) continue;
      const tri = THREE.ShapeUtils.triangulateShape(a, []);
      for (const [i, j, k] of tri) for (const q of [a[i], a[j], a[k]]) { const d = Math.hypot(q.x, q.y), f = d > op.raio ? op.raio / d : 1; pos.push(q.x * f, y, q.y * f); }
    }
    if (!pos.length) return;
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: cor, side: THREE.DoubleSide, transparent: true, opacity: 0.9, depthWrite: false }));
    m.renderOrder = -1; malhas.push(m);
  };
  chao(D.verde || [], C.verde, 0.03); chao(D.agua || [], C.agua, 0.035);

  // as ruas: linhas (as grandes mais claras), só dentro do disco
  const ruas = [], cores = [], cP = new THREE.Color(C.rua), cG = new THREE.Color(C.ruaG);
  for (const [tipo, lista] of Object.entries(D.ruas || {})) {
    const c = GRANDES.has(tipo) ? cG : cP;
    for (const flat of lista) for (let i = 0; i + 3 < flat.length; i += 2) {
      const x1 = X(flat[i]), z1 = Z(flat[i + 1]), x2 = X(flat[i + 2]), z2 = Z(flat[i + 3]);
      if (x1 * x1 + z1 * z1 > R2 || x2 * x2 + z2 * z2 > R2) continue;
      ruas.push(x1, 0.05, z1, x2, 0.05, z2); cores.push(c.r, c.g, c.b, c.r, c.g, c.b);
    }
  }
  if (ruas.length) {
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(ruas, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(cores, 3));
    malhas.push(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85 })));
  }

  // os prédios: paredes e telhado de cada um, todos numa malha só (o telhado um pouco mais claro, para ler o volume de cima)
  const pos = [], cor = [], cW = new THREE.Color(C.predio), cT = new THREE.Color(C.topo);
  for (const [altM, ...flat] of D.predios || []) {
    const a = anelNaCena(flat); if (a.length < 3) continue;
    const [cx, cz] = centro(a); if (cx * cx + cz * cz > R2 * 0.94 || pertoDaPista(cx, cz)) continue;
    const hh = Math.max(0.12, altM * alto), y0 = 0.06, y1 = y0 + hh;
    for (let i = 0; i < a.length; i++) {
      const p = a[i], q = a[(i + 1) % a.length];
      pos.push(p.x, y0, p.y, q.x, y0, q.y, q.x, y1, q.y, p.x, y0, p.y, q.x, y1, q.y, p.x, y1, p.y);
      for (let k = 0; k < 6; k++) cor.push(cW.r, cW.g, cW.b);
    }
    for (const [i, j, k] of THREE.ShapeUtils.triangulateShape(a, [])) for (const v of [a[i], a[j], a[k]]) { pos.push(v.x, y1, v.y); cor.push(cT.r, cT.g, cT.b); }
  }
  if (pos.length) {
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(cor, 3));
    malhas.push(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide })));
  }
  if (!grupo.parent) { for (const m of malhas) { m.geometry.dispose(); m.material.dispose(); } return null; } // (a miniatura fechou enquanto baixava)
  for (const m of malhas) grupo.add(m);
  return { fonte: D.fonte, malhas };
}
