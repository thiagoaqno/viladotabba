// Corrida da Galera — a imagem de satélite embaixo da pista na miniatura 3D (gp-miniatura.js), como o mapa da transmissão: os tiles do
// Sentinel-2 cloudless 2016 (EOX IT Services, dados Copernicus, licença CC BY 4.0) que cobrem o disco da miniatura, juntados num canvas e
// colados no chão com cada ponto no lugar certo. O traçado do jogo volta para latitude e longitude pela conta de `geo` em mapas/<pista>.json
// (ferramentas/mapa-real.js: o encaixe da linha real na do jogo). Nada fica no jogo: os tiles vêm da internet na hora; sem eles (sem internet,
// servidor fora), devolve null e a miniatura usa o mapa desenhado do OpenStreetMap (gp-mapa-real.js).
import * as THREE from "three";

const TILE = (z, x, y) => `https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/${z}/${y}/${x}.jpg`;
const R = 6371000, ZMAX = 15, LADO_MAX = 2048; // (o Sentinel-2 tem 10 m por pixel: o zoom 15, com uns 5 m, já é ampliado)
const cacheGeo = new Map(), cacheImg = new Map();
export const CREDITO = "Imagem: Sentinel-2 cloudless 2016 (EOX), dados Copernicus · CC BY 4.0";

async function geoDe(pista) {
  if (!cacheGeo.has(pista)) cacheGeo.set(pista, fetch(`/corrida/mapas/${pista}.json`).then((r) => (r.ok ? r.json() : null)).then((d) => (d && d.geo) || null).catch(() => null));
  return cacheGeo.get(pista);
}
// do traçado do jogo (x, y) para [lon, lat] (a conta inversa do encaixe)
function paraMundo(g, x, y) {
  const u = (x - g.mb[0]) / g.s, v = (y - g.mb[1]) / g.s;
  const mx = g.c * u + g.d * v + g.ma[0]; let my = -g.d * u + g.c * v + g.ma[1]; if (g.espelho) my = -my;
  return [((mx / (R * Math.cos((g.lat0 * Math.PI) / 180))) * 180) / Math.PI, ((my / R) * 180) / Math.PI];
}
// [lon, lat] para o pixel do mapa da web (Web Mercator) no zoom z
const pixel = (lon, lat, z) => { const n = 256 * 2 ** z, la = (lat * Math.PI) / 180; return [((lon + 180) / 360) * n, ((1 - Math.log(Math.tan(la) + 1 / Math.cos(la)) / Math.PI) / 2) * n]; };
const carregar = (url) => new Promise((ok) => { const im = new Image(); im.crossOrigin = "anonymous"; im.onload = () => ok(im); im.onerror = () => ok(null); im.src = url; });

// `grupo`: onde o chão entra; `op`: { pista, s, cx, cy (a cena: (x − cx) × s), raio, tema }. Devolve { malha } ou null.
export async function montarSatelite(grupo, op) {
  const g = await geoDe(op.pista); if (!g || !grupo.parent) return null;
  // o disco da miniatura no mundo: a borda e o centro, para achar o retângulo de tiles e o zoom
  const doCena = (X, Z) => paraMundo(g, X / op.s + op.cx, Z / op.s + op.cy);
  const borda = []; for (let k = 0; k < 48; k++) { const a = (k / 48) * Math.PI * 2; borda.push(doCena(Math.cos(a) * op.raio, Math.sin(a) * op.raio)); }
  let z = ZMAX, caixa;
  for (; z >= 10; z--) {
    const px = borda.map(([lo, la]) => pixel(lo, la, z)), x0 = Math.min(...px.map((p) => p[0])), x1 = Math.max(...px.map((p) => p[0])), y0 = Math.min(...px.map((p) => p[1])), y1 = Math.max(...px.map((p) => p[1]));
    caixa = { x0, y0, w: x1 - x0, h: y1 - y0 }; if (Math.max(caixa.w, caixa.h) <= LADO_MAX) break;
  }
  const chave = `${op.pista}:${z}`;
  if (!cacheImg.has(chave) && cacheImg.size >= 2) cacheImg.delete(cacheImg.keys().next().value); // (cada imagem montada tem uns 20 MB: guarda só as duas últimas pistas)
  if (!cacheImg.has(chave)) cacheImg.set(chave, (async () => {
    const tx0 = Math.floor(caixa.x0 / 256), tx1 = Math.floor((caixa.x0 + caixa.w) / 256), ty0 = Math.floor(caixa.y0 / 256), ty1 = Math.floor((caixa.y0 + caixa.h) / 256);
    const cv = document.createElement("canvas"); cv.width = (tx1 - tx0 + 1) * 256; cv.height = (ty1 - ty0 + 1) * 256;
    const ctx = cv.getContext("2d"), pedidos = [];
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) pedidos.push(carregar(TILE(z, tx, ty)).then((im) => { if (im) ctx.drawImage(im, (tx - tx0) * 256, (ty - ty0) * 256); return !!im; }));
    const ok = await Promise.all(pedidos);
    if (ok.filter(Boolean).length < ok.length * 0.8) return null; // (faltou muito: melhor o mapa desenhado)
    return { cv, ox: tx0 * 256, oy: ty0 * 256 };
  })());
  const img = await cacheImg.get(chave);
  if (!img || !grupo.parent) { if (!img) cacheImg.delete(chave); return null; }
  // o disco do chão: cada vértice com o UV do pixel dele na imagem (a conta é quase linear no tamanho de um circuito: o disco basta)
  const geo = new THREE.CircleGeometry(op.raio, 128), pos = geo.getAttribute("position"), uv = geo.getAttribute("uv");
  for (let i = 0; i < pos.count; i++) {
    const X = pos.getX(i), Z = -pos.getY(i), [lo, la] = doCena(X, Z), [px, py] = pixel(lo, la, z); // (o disco é deitado: o y dele vira −Z na cena)
    uv.setXY(i, (px - img.ox) / img.cv.width, 1 - (py - img.oy) / img.cv.height);
  }
  uv.needsUpdate = true;
  const tex = new THREE.CanvasTexture(img.cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  // no tema escuro (o padrão e o escuro da Central), a imagem fica um pouco mais escura, para a pista e os carros saltarem
  const mat = new THREE.MeshBasicMaterial({ map: tex, color: op.tema === "claro" ? 0xffffff : 0xb8bfc8 });
  const malha = new THREE.Mesh(geo, mat); malha.rotation.x = -Math.PI / 2; malha.position.y = 0.02;
  grupo.add(malha);
  return { malha };
}
