// Catar (Lusail) — a linha de prédios no horizonte, a sudeste do circuito (a cidade de Lusail fica ao sul, uns 9 km da pista, e a Doha da Baía Oeste mais adiante; Wikipedia, "Lusail Stadium": estádio "a 20 km ao norte de Doha").
// Os marcos de verdade, de longe: as quatro Lusail Plaza Towers da Foster + Partners (duas de 301 m e duas de 215 m; Wikipedia, "Lusail Plaza Towers"), as Katara Towers (duas lâminas curvas que se cruzam como as espadas do brasão do Catar, 211 m;
// KHL, mymodernmet.com), o Lusail Stadium (a tigela dourada da Copa de 2022, Foster + Populous) e uns 90 prédios de vidro e pedra em volta, de alturas e formas diferentes. O diâmetro do estádio (260 m) e o formato dos topos são ESTIMADOS das fotos.
// O horizonte é comprimido: os 9 km reais viram uns 9 mil u (1,9 km) e as alturas vão a 45% da real (a 100%, a 1,9 km, uma torre de 300 m ocuparia o céu inteiro); a escala 0,2083 m/u vale, só o cenário de longe é menor.
// Sem a neblina do jogo (`fog: false`: a de 4 200 u apagava tudo); a bruma é pintada nos vértices, mais forte embaixo e nas peças mais distantes. As janelas acendem de noite (mapa emissivo ligado por luzDaNoite) e o estádio brilha em dourado.
// Cada grupo tem o seu chão (um quadrado de areia que se funde com a neblina do jogo) porque o terreno de pista.js acaba antes. Tudo parado, em três malhas: nada se mexe, nada cai na pista.
import * as THREE from "three";
import { canvasTex } from "../../../cena.js";
import { Montador } from "../montagem.js";
import { sorteio } from "../comum.js";
import { emissivoDaNoite } from "./base.js";

const ESCALA = 0.45, U = 4.8; // 4,8 u por metro; o horizonte a 45% da altura
const m2u = (m) => m * U * ESCALA, Y0 = -3; // a base dos prédios afunda 1 u no chão do grupo (y = -2)

// a pele dos prédios: vidro azul-acinzentado com a grade de janelas; o mapa emissivo acende uma parte delas de noite
function pele(tr, r) {
  const cel = 8, acesa = Array.from({ length: cel * cel }, () => r() < 0.45);
  const dia = canvasTex(64, 64, (x, w, h) => {
    x.fillStyle = "#9db2c2"; x.fillRect(0, 0, w, h);
    for (let a = 0; a < cel; a++) for (let c = 0; c < cel; c++) { x.fillStyle = (a + c) % 3 ? "#5f7f99" : "#6f90a8"; x.fillRect(c * 8 + 1, a * 8 + 1, 6, 6); }
  });
  const noite = canvasTex(64, 64, (x, w, h) => {
    x.fillStyle = "#000"; x.fillRect(0, 0, w, h);
    for (let a = 0; a < cel; a++) for (let c = 0; c < cel; c++) if (acesa[a * cel + c]) { x.fillStyle = (a * 3 + c) % 4 ? "#ffd990" : "#e8f2ff"; x.fillRect(c * 8 + 1, a * 8 + 1, 6, 6); }
  });
  const mat = new THREE.MeshStandardMaterial({ map: dia, emissiveMap: noite, emissive: 0xffffff, vertexColors: true, roughness: 0.4, metalness: 0.2, fog: false });
  return emissivoDaNoite(tr, mat, 0, 1.0);
}

// uma cunha: a caixa de base 1 × 1 e altura 1 com o topo cortado na diagonal (o alto da Lusail Plaza); a cunha desce de 1 (em -x) a `corte` (em +x)
function cunha(corte) {
  const g = new THREE.BufferGeometry(), v = [-0.5, 0, -0.5, 0.5, 0, -0.5, 0.5, 0, 0.5, -0.5, 0, 0.5, -0.5, 1, -0.5, 0.5, corte, -0.5, 0.5, corte, 0.5, -0.5, 1, 0.5];
  const q = [[0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7], [4, 5, 6, 7], [3, 2, 1, 0]], idx = [], uv = [], pos = [];
  q.forEach((f, k) => { const b = pos.length / 3; for (const i of f) pos.push(v[i * 3], v[i * 3 + 1], v[i * 3 + 2]); uv.push(0, 0, 1, 0, 1, 1, 0, 1); idx.push(b, b + 1, b + 2, b, b + 2, b + 3); });
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}

/**
 * @param {object} tr · @param {Function} add
 * @param {object} o { centro: [x, z] (o meio do mundo), grupos: [{ nome, ang, raio }] lugares dos três grupos em graus (0 = leste, 90 = sul) e distância ao meio (u) }
 */
export function horizonteLusail(tr, add, { centro = [tr.t.world / 2, tr.t.world / 2], lusail = { ang: 49, raio: 7500 }, estadio = { ang: 38, raio: 7800 }, doha = { ang: 66, raio: 8800 } } = {}) {
  const r = sorteio(9137), fog = new THREE.Color(tr.look.fog), cor = new THREE.Color(), mFach = pele(tr, r);
  const CAIXA = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), geoCunha = cunha(0.82), tigela = new THREE.CylinderGeometry(1.28, 1, 1, 56, 1, true), tampo = new THREE.CylinderGeometry(1.28, 1.28, 1, 56, 1, false);
  const mVidro = new Montador(), mTopo = new Montador(), mOuro = new Montador();
  const ouro = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, metalness: 0.5, fog: false, emissive: 0xb8741c, emissiveIntensity: 0 }); emissivoDaNoite(tr, ouro, 0, 0.7);
  const aco = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.3, fog: false });
  const pos = (g) => [centro[0] + Math.cos((g.ang * Math.PI) / 180) * g.raio, centro[1] + Math.sin((g.ang * Math.PI) / 180) * g.raio];
  // a bruma pintada: a cor da peça puxada para a cor do ar (a neblina do dia) conforme a distância até o meio da pista
  const bruma = (hex, x, z, forca = 0) => cor.set(hex).lerp(fog, Math.min(0.85, 0.35 + Math.hypot(x - centro[0], z - centro[1]) / 22000 + forca)).getStyle();
  const pedra = ["#d9d2c2", "#c8c1b2", "#e4ddcf", "#b9b2a4", "#d6c8ad"], vidros = ["#ffffff", "#e8f0f6", "#d4e0ea", "#f0e8dc"];

  // ---- as Lusail Plaza Towers: duas de 301 m e duas de 215 m, topo cortado na diagonal, em dois pares ----
  const [lx, lz] = pos(lusail);
  const plaza = [[-150, -60, 301, 0.82, 0.3], [-60, 40, 301, 0.84, -0.3], [60, -50, 215, 0.8, 0.3], [150, 50, 215, 0.82, -0.3]];
  for (const [dx, dz, h, corte, ry] of plaza) {
    const x = lx + dx * 1.3, z = lz + dz * 1.3, alt = m2u(h), larg = m2u(46), prof = m2u(38);
    mVidro.geo(mFach, geoCunha, { x, y: Y0, z, sx: larg, sy: alt, sz: prof, ry, cor: bruma("#ffffff", x, z), uv: [4, Math.round(alt / 80)] });
  }
  // ---- as Katara Towers: duas lâminas curvas que se cruzam, de 211 m, com a ponta dourada ----
  const kx = lx - 520, kz = lz + 160, KH = m2u(211), seg = 16;
  for (const lado of [1, -1]) for (let k = 0; k < seg; k++) {
    const t0 = k / seg, t1 = (k + 1) / seg, xc = (t) => lado * (-130 * (1 - t) + 130 * t * t * 0.7) + lado * 60 * Math.sin(t * Math.PI), dxs = xc(t1) - xc(t0), dy = KH / seg, ang = Math.atan2(dxs, dy);
    const w = m2u(26) * (1 - 0.35 * t0), x = kx + xc((t0 + t1) / 2), z = kz + lado * 30;
    mTopo.caixa(aco, [x, Y0 + dy * (k + 0.5), z], [w, dy * 1.08, m2u(18)], { cor: bruma(k === seg - 1 ? "#d9b04a" : "#cfd6dc", x, z), rz: -ang });
  }
  // ---- o Lusail Stadium: a tigela dourada, o anel do teto escuro e o gramado de luz ----
  const [ex, ez] = pos(estadio), R = m2u(130), EH = m2u(50);
  mOuro.geo(ouro, tigela, { x: ex, y: Y0 + EH / 2, z: ez, sx: R, sy: EH, sz: R, cor: bruma("#c99a4a", ex, ez, -0.1) });
  mOuro.geo(aco, tampo, { x: ex, y: Y0 + EH + 2, z: ez, sx: R * 0.995, sy: 4, sz: R * 0.995, cor: bruma("#3b3d42", ex, ez) });
  for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; mTopo.caixa(aco, [ex + Math.cos(a) * R * 1.3, Y0 + EH * 0.5, ez + Math.sin(a) * R * 1.3], [m2u(6), EH * 1.05, m2u(6)], { cor: bruma("#e8d3a0", ex, ez), ry: -a }); } // as nervuras do aro
  // ---- os prédios em volta dos marcos e a Baía Oeste de Doha: altura, forma, material e posição sorteados ----
  const miolo = (cx, cz, n, largo, altos) => {
    for (let k = 0; k < n; k++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * largo, x = cx + Math.cos(a) * d * 1.5, z = cz + Math.sin(a) * d * 0.7; // o aglomerado é comprido
      if (Math.hypot(x - ex, z - ez) < R * 2.2 && cx !== ex) continue;
      const centro01 = 1 - Math.min(1, d / largo), h = m2u((r() < 0.25 ? 190 + r() * 130 : 60 + r() * 120) * (0.55 + 0.45 * centro01) * altos), l = m2u(26 + r() * 40), p = m2u(24 + r() * 36), ry = (r() - 0.5) * 0.9;
      const vidro = r() < 0.7;
      (vidro ? mVidro : mTopo).geo(vidro ? mFach : aco, vidro ? (r() < 0.4 ? geoCunha : CAIXA) : CAIXA, { x, y: Y0, z, sx: l, sy: h, sz: p, ry, cor: bruma(vidro ? vidros[(r() * 4) | 0] : pedra[(r() * 5) | 0], x, z), uv: [Math.max(1, Math.round(l / 45)), Math.max(1, Math.round(h / 70))] });
      if (vidro && r() < 0.3) mTopo.caixa(aco, [x, Y0 + h + m2u(12), z], [m2u(2), m2u(24), m2u(2)], { cor: bruma("#d8dde2", x, z) }); // a antena
    }
  };
  miolo(lx, lz, 46, m2u(650), 1);
  miolo(ex - 900, ez + 400, 14, m2u(380), 0.55);
  const [dx2, dz2] = pos(doha);
  miolo(dx2, dz2, 40, m2u(1100), 1.1);
  // ---- o chão de cada grupo e as três malhas ----
  const base = new THREE.MeshBasicMaterial({ color: tr.look.ground[0] }); // com neblina: de tão longe, vira a cor da neblina e emenda com o terreno de pista.js
  for (const [x, z, lado] of [[lx, lz, 3400], [ex, ez, 3000], [dx2, dz2, 3600]]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(lado, lado), base); p.rotation.x = -Math.PI / 2; p.position.set(x, -2, z); p.name = `${tr.id}-horizonte-chao`; add(p);
  }
  let tris = 0;
  for (const [mont, nome] of [[mVidro, "vidro"], [mTopo, "topos"], [mOuro, "estadio"]]) {
    const g = mont.montar(`${tr.id}-horizonte-${nome}`); g.traverse((o) => { if (o.isMesh) { o.castShadow = o.receiveShadow = false; o.frustumCulled = false; tris += o.geometry.index.count / 3; } }); add(g);
  }
  tr.horizonteCT = { triangulos: tris, lusail: [lx, lz], estadio: [ex, ez], doha: [dx2, dz2] };
}
