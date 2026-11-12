// Catar (Lusail) — as arquibancadas, só desta pista (não são as do kit). A principal (Main Grandstand, renovada para 2023) fica do lado de fora da reta, de frente para o prédio dos boxes: 14 fileiras, seis zonas (A a F) de quatro
// seções cada, cadeiras individuais de plástico, e o telhado cobre só a metade de trás (oversteer48.com, "Main Grandstand Qatar Lusail"; Ashghal/Gulf Times: 7 500 lugares na principal, 22 700 nas temporárias, 2 700 nas dos convidados).
// Largura da principal: 7 500 lugares ÷ 14 fileiras ≈ 536 por fileira; a 0,5 m por cadeira (estimativa minha) são ~268 m, os 1 290 u de `de`/`ate` em gps/catar.js. As cores dos assentos (grená e branco, as da bandeira) e a posição das
// arquibancadas temporárias (nas curvas lentas) também são estimadas: as fontes não dizem.
// Cada degrau é de verdade (espelho de concreto e piso de cadeiras), com o mesmo tamanho dos degraus do kit (9 × 6 u × tr.escala), e fica em `tr.arqDegraus` e `tr.arquibancadas`: é nele que vida.js senta a torcida e que o som da
// torcida lê. As seções são separadas por corredores de concreto; as fileiras de cada seção alternam dois tons de cadeira conforme a zona. As temporárias variam de tamanho, de fileiras e de cobertura, uma a uma.
import * as THREE from "three";
import { canvasTex, M } from "../../../cena.js";
import { marcaTex } from "../marcas.js";
import { recortar, sinalDaCurva, sorteio } from "../comum.js";

// uma fita extrudada ao longo das estações `faixas` ([[a, b], ...], b incluso): cada segmento do perfil [lat0, y0, lat1, y1] vira um degrau/parede (vértices próprios: arestas vivas). u: 0 a 1 de ponta a ponta do segmento; v: a distância ao longo / vLen.
function extrudar(tr, faixas, lado, segmentos, mat, { vLen = 4.8, nome = "catar-tribuna" } = {}) {
  const { pts, n } = tr, vs = [], uv = [], idx = [];
  for (const [a, b] of faixas) for (const [l0, y0, l1, y1] of segmentos) {
    const base = vs.length / 3;
    for (let i = a; i <= b; i++) {
      const p = pts[((i % n) + n) % n], d = (i - a) * 6;
      vs.push(p.x + p.nx * lado * l0, p.h + y0, p.y + p.ny * lado * l0, p.x + p.nx * lado * l1, p.h + y1, p.y + p.ny * lado * l1); uv.push(0, d / vLen, 1, d / vLen);
      if (i < b) { const k = base + (i - a) * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
    }
  }
  if (!idx.length) return null;
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(vs, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.castShadow = m.receiveShadow = true; m.name = nome; return m;
}

// o piso de cadeiras: duas cadeiras de plástico (o assento claro e o encosto), 2,4 u cada (0,5 m, estimado: o repeat do v é 4,8 u); u vai do assento ao encosto
const cadeiras = (assento, encosto) => new THREE.MeshStandardMaterial({ roughness: 0.75, side: THREE.DoubleSide, map: canvasTex(32, 64, (x, w, h) => {
  x.fillStyle = "#3b3d42"; x.fillRect(0, 0, w, h); // o piso entre as cadeiras
  for (let k = 0; k < 2; k++) {
    const y0 = k * 32 + 2; x.fillStyle = assento; x.fillRect(2, y0, 18, 28); x.fillStyle = encosto; x.fillRect(20, y0, 10, 28);
    x.fillStyle = "#00000038"; x.fillRect(2, y0 + 27, 28, 1); x.fillRect(20, y0, 1, 28); x.fillStyle = "#ffffff30"; x.fillRect(3, y0 + 1, 16, 2);
  }
}) });
const concretoMat = () => new THREE.MeshStandardMaterial({ roughness: 0.9, side: THREE.DoubleSide, map: canvasTex(32, 32, (x, w, h, rr) => {
  x.fillStyle = "#a9abae"; x.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { x.fillStyle = rr() < 0.5 ? "#00000018" : "#ffffff18"; x.fillRect(rr() * w, rr() * h, 3, 2); } x.fillStyle = "#00000030"; x.fillRect(0, h - 1, w, 1);
}) });
let _mats = null;
const mats0 = () => (_mats ||= { concreto: concretoMat(), parede: M(0xd7d9db, { roughness: 0.8, side: THREE.DoubleSide }), aco: M(0x5a6168, { roughness: 0.5, metalness: 0.4 }), telhaMat: M(0xf1f2f2, { roughness: 0.55, side: THREE.DoubleSide }), forro: M(0xc9ced2, { roughness: 0.8, side: THREE.DoubleSide }) });
const texCadeiras = new Map();
const cadeira = (a, e) => { const k = a + e; if (!texCadeiras.has(k)) texCadeiras.set(k, cadeiras(a, e)); return texCadeiras.get(k); };

/**
 * Uma arquibancada de degraus de verdade.
 * @param {object} tr · @param {Function} add
 * @param {object} o { de, ate (frações), lado, degraus, secoes (número) | zonas (secoes por zona), assentos: [[assento, encosto], ...] (um par por zona, em ordem), cobertura: 0 a 1 (a parte de trás coberta; 0 sem teto), placas: marcas da parede do fundo, nome }
 */
export function arquibancada(tr, add, { de, ate, lado, degraus = 10, secoes = 8, zonas = 1, assentos = [["#8a1538", "#6e0f2c"]], cobertura = 0, placas = ["qatar", "aramco"], nome = "arq", semente = 7 } = {}) {
  const { concreto, parede, aco, telhaMat, forro } = mats0();
  const { pts, n, W } = tr, E = tr.escala ?? 1, PROF = 9 * E, ALT = 6 * E, BASE = 4 * E, r = sorteio(semente * 977);
  let i0 = Math.floor(de * n), i1 = Math.floor(ate * n); if (i1 < i0) i1 += n;
  // o fundo da arquibancada fica atrás da barreira de escape mapeada (tr.latMuro) + 14 u, em toda a extensão: `l0` é um só (vida.js senta a torcida em cima de `l0`)
  let muro = 0; for (let i = i0; i <= i1; i++) { const m = tr.latMuro(lado, i % n); muro = Math.max(muro, Number.isFinite(m) ? m : W / 2 + 70); }
  const l0 = lado * Math.max(W / 2 + 84, muro + 14), L0 = Math.abs(l0), fundoTot = degraus * PROF;
  const rec = recortar(tr, i0, i1, [l0, l0 + lado * (fundoTot + 12)]); if (!rec) return null;
  ({ i0, i1 } = rec);
  if (i1 - i0 < 12) return null;
  const topoAlt = BASE + (degraus - 0.5) * ALT; // o piso da última fileira
  // as seções: faixas de estações entre os corredores de 1 estação (6 u = 1,25 m)
  const total = i1 - i0 + 1, nSec = Math.max(2, Math.round(secoes)), tam = total / nSec, secs = [], corr = [];
  let a = i0;
  for (let k = 0; k < nSec; k++) {
    const b = k === nSec - 1 ? i1 : Math.round(i0 + (k + 1) * tam) - 1; secs.push([a, b]);
    if (k < nSec - 1) corr.push([b, b + 1]); a = b + 1; // o corredor de uma estação (6 u = 1,25 m) entre as seções
  }
  const secoesPorZona = Math.max(1, Math.round(nSec / zonas)), zonaDe = (k) => Math.min(zonas - 1, Math.floor(k / secoesPorZona));
  // o perfil de degraus: o espelho (de baixo até o piso) e o piso de cada fileira; o piso da fileira f fica em BASE + (f + 0,5) × ALT, onde a torcida senta (vida.js)
  const pisoAlt = (f) => BASE + (f + 0.5) * ALT;
  const espelhos = [], pisos = [];
  for (let f = 0; f < degraus; f++) {
    const lat = L0 + f * PROF;
    espelhos.push([lat, f === 0 ? -8 : pisoAlt(f - 1), lat, pisoAlt(f)]);
    pisos.push([lat, pisoAlt(f), lat + PROF, pisoAlt(f)]);
  }
  const mats = secs.map((s, k) => cadeira(...assentos[zonaDe(k) % assentos.length]));
  const porMat = new Map(); secs.forEach((s, k) => { if (!porMat.has(mats[k])) porMat.set(mats[k], []); porMat.get(mats[k]).push(s); });
  for (const [mat, fs] of porMat) { const m = extrudar(tr, fs, lado, pisos.map(([a1, y1, a2, y2]) => [a1, y1, a2, y2]), mat, { nome: `catar-${nome}-cadeiras` }); if (m) add(m); }
  // o espelho e o corredor: concreto (o corredor tem o mesmo perfil de degraus, só que de concreto)
  const m1 = extrudar(tr, [[i0, i1]], lado, espelhos, concreto, { nome: `catar-${nome}-espelhos` }); if (m1) add(m1);
  if (corr.length) { const m2 = extrudar(tr, corr, lado, pisos, concreto, { vLen: 6, nome: `catar-${nome}-corredores` }); if (m2) add(m2); }
  // o fundo (parede de concreto com as placas dos patrocinadores) e as laterais
  const lat1 = L0 + fundoTot, alturaFundo = topoAlt + 14;
  const fundo = extrudar(tr, [[i0, i1]], lado, [[lat1, -8, lat1, alturaFundo]], parede, { vLen: 8, nome: `catar-${nome}-fundo` }); if (fundo) add(fundo);
  const perfil = [[L0, -8], ...pisos.flatMap(([l, y, l2]) => [[l, y], [l2, y]]), [lat1, alturaFundo], [lat1, -8]];
  const tri = THREE.ShapeUtils.triangulateShape(perfil.map(([l, y]) => new THREE.Vector2(l, y)), []);
  for (const i of [i0, i1]) { // as laterais
    const p = pts[i % n], vs = []; for (const [l, y] of perfil) vs.push(p.x + p.nx * lado * l, p.h + y, p.y + p.ny * lado * l);
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(vs, 3)); g.setIndex(tri.flat()); g.computeVertexNormals();
    const m = new THREE.Mesh(g, parede); m.castShadow = true; add(m);
  }
  // as placas de patrocínio no alto da parede do fundo, voltadas para a pista: uma por trecho, de largura sorteada
  const comp = (i1 - i0) * 6;
  for (let s = 6; s < comp - 30; ) {
    const w = 60 + r() * 60, marca = placas[Math.floor(r() * placas.length)]; if (s + w > comp - 6) break;
    const i = Math.min(i1, i0 + Math.round((s + w / 2) / 6)), p = pts[i % n], q = pts[(i + 2) % n];
    const x = p.x + p.nx * lado * (lat1 - 0.5), z = p.y + p.ny * lado * (lat1 - 0.5), ry = Math.atan2(p.nx * lado, p.ny * lado) + Math.PI;
    (tr.placasCT ||= []).push({ marca, x, y: p.h + topoAlt + 8, z, ry, w }); // uma malha instanciada por marca para todas as arquibancadas (arquibancadas() abaixo)
    s += w + 14 + r() * 40;
  }
  // o telhado (só a parte de trás): vigas e colunas de aço, a laje inclinada branca que sobe para trás, o forro mais escuro por baixo
  if (cobertura > 0) {
    const fCob = Math.round(degraus * (1 - cobertura)), latF = L0 + fCob * PROF - 4, latB = lat1 + 8, yF = pisoAlt(fCob) + 26, yB = topoAlt + 52;
    const alto = (l) => yF + ((l - latF) / (latB - latF)) * (yB - yF);
    const faixas = [[i0, i1]];
    const topo = extrudar(tr, faixas, lado, [[latF, alto(latF) + 2.2, latB, alto(latB) + 2.2]], telhaMat, { vLen: 12, nome: `catar-${nome}-telhado` });
    const baixo = extrudar(tr, faixas, lado, [[latF, alto(latF), latB, alto(latB)], [latF, alto(latF), latF, alto(latF) + 2.2], [latB, alto(latB), latB, alto(latB) + 2.2]], forro, { vLen: 12, nome: `catar-${nome}-forro` });
    if (topo) add(topo); if (baixo) add(baixo);
    // as colunas: de duas em duas seções, uma na frente do telhado (sobe do degrau) e uma atrás (do chão), mais a viga entre elas
    const cs = [];
    for (let k = 0; k < secs.length; k += 2) {
      const i = Math.floor((secs[k][0] + secs[k][1]) / 2), p = pts[i % n];
      for (const l of [latF + 3, latB - 4]) {
        const y0 = l < lat1 ? pisoAlt(Math.min(degraus - 1, Math.floor((l - L0) / PROF))) : -8;
        cs.push({ x: p.x + p.nx * lado * l, z: p.y + p.ny * lado * l, y0: p.h + y0, h: alto(l) - y0 });
      }
    }
    if (cs.length) {
      const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), aco, cs.length), d = new THREE.Object3D();
      cs.forEach((c, k) => { d.position.set(c.x, c.y0 + c.h / 2, c.z); d.scale.set(2.4, c.h, 2.4); d.rotation.set(0, 0, 0); d.updateMatrix(); im.setMatrixAt(k, d.matrix); });
      im.castShadow = true; im.name = `catar-${nome}-colunas`; add(im);
    }
  }
  tr.arquibancadas ||= []; tr.reservado ||= []; tr.arqDegraus ||= [];
  tr.arquibancadas.push([i0, i1]);
  tr.arqDegraus.push({ i0, i1, l0, lado, degraus, prof: PROF, alt: ALT, base: BASE }); // vida.js senta a torcida nos degraus
  for (let i = i0; i <= i1; i += 4) { const p = pts[i % n]; tr.reservado.push([p.x + p.nx * lado * (L0 + fundoTot / 2), p.y + p.ny * lado * (L0 + fundoTot / 2), fundoTot / 2 + 40]); }
  return { i0, i1, l0, lado, degraus, secoes: nSec, assentos: mats.length };
}

/**
 * Todas as arquibancadas do Catar: a principal, a do norte e as temporárias nas curvas lentas (a posição e o tamanho de cada uma são os de `lista`, em gps/catar.js).
 * @param {Array} lista [{ nome, de, ate, lado, degraus, secoes, zonas, cobertura, assentos }]; `lado: "fora"` põe no lado de fora da curva que passa em `de`..`ate`
 */
export function arquibancadas(tr, add, lista) {
  const out = [];
  lista.forEach((o, k) => {
    let lado = o.lado;
    if (lado === "fora") { const i = Math.floor(((o.de + o.ate) / 2) * tr.n) % tr.n; lado = -sinalDaCurva(tr.pts, tr.n, i); }
    const res = arquibancada(tr, add, { ...o, lado, semente: k + 3 }); if (res) out.push({ nome: o.nome, ...res });
  });
  // as placas de patrocínio da parede do fundo: um InstancedMesh por marca (e não uma malha por placa)
  const porMarca = new Map(); for (const o of tr.placasCT || []) { if (!porMarca.has(o.marca)) porMarca.set(o.marca, []); porMarca.get(o.marca).push(o); }
  const d = new THREE.Object3D();
  for (const [marca, ps] of porMarca) {
    const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 9.6), new THREE.MeshBasicMaterial({ map: marcaTex(marca, 512, 64), side: THREE.FrontSide }), ps.length);
    ps.forEach((o, k) => { d.position.set(o.x, o.y, o.z); d.rotation.set(0, o.ry, 0); d.scale.set(o.w, 1, 1); d.updateMatrix(); im.setMatrixAt(k, d.matrix); });
    im.name = `catar-placas-${marca}`; add(im);
  }
  delete tr.placasCT;
  tr.arqCatar = out;
  return out;
}
