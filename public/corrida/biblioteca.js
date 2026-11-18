// A BIBLIOTECA do editor de cenário (2026-11-16, o Thiago: "faz a biblioteca, e coloca lá coisas já prontas"): peças de pista montadas em
// código, sem baixar modelo, para pôr com um clique (editor/editor.js) e montar no jogo pelo cenario/<pista>.json ({ tipo: "kit", kit: <id> }).
// Tudo em unidades do jogo (1 m ≈ 4,8 u), apoiado em y = 0 e com a frente para +z. Materiais compartilhados por peça (o fundir.js junta).
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { patrocinioEm } from "./f1-capacetes.js";

const U = 4.8; // unidades por metro
const mats = new Map();
const M = (cor, o = {}) => { const k = cor + JSON.stringify(o); if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color: cor, roughness: 0.75, ...o })); return mats.get(k); };
function malha(g, geo, mat, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); return m; }
const caixa = (g, mat, w, h, d, x, y, z) => malha(g, new THREE.BoxGeometry(w, h, d), mat, x, y, z);
const cil = (g, mat, r, h, x, y, z, lados = 10, r2 = r) => malha(g, new THREE.CylinderGeometry(r2, r, h, lados), mat, x, y, z);
const sorteio = (s) => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };

const CINZA = M(0x8d9096), ESCURO = M(0x2c3036, { roughness: 0.6, metalness: 0.3 }), BRANCO = M(0xf2f2f0), VERMELHO = M(0xd62828), AMARELO = M(0xf2c230);
const VERDE = M(0x4e7a35, { flatShading: true }), VERDE2 = M(0x5f8f3e, { flatShading: true }), TRONCO = M(0x6b4a2f), AZUL = M(0x2a5bd6), LARANJA = M(0xff7a1a), BORRACHA = M(0x1d1f22, { roughness: 0.95 });
const VIDRO = new THREE.MeshStandardMaterial({ color: 0x9fc4d4, roughness: 0.15, metalness: 0.3, transparent: true, opacity: 0.5 }), LUZ = new THREE.MeshStandardMaterial({ color: 0xfff6d8, emissive: 0xfff1c0, emissiveIntensity: 0.8 });

export const KITS = {
  arquibancada: { nome: "Arquibancada", grupo: "Público", montar() {
    const g = new THREE.Group(), w = 40 * U, deg = 8, alt = 0.5 * U, fun = 0.8 * U;
    for (let k = 0; k < deg; k++) { caixa(g, CINZA, w, alt, fun, 0, alt * k + alt / 2, -k * fun); caixa(g, k % 2 ? AZUL : BRANCO, w, 0.45 * U, 0.35 * U, 0, alt * (k + 1) + 0.22 * U, -k * fun - 0.1 * U); }
    caixa(g, CINZA, w, alt * deg, 0.3 * U, 0, alt * deg / 2, -deg * fun);
    const cob = caixa(g, BRANCO, w + U, 0.3 * U, deg * fun + 2 * U, 0, alt * deg + 4 * U, -deg * fun / 2 + U); cob.rotation.x = -0.08;
    for (const x of [-w / 2, -w / 6, w / 6, w / 2]) cil(g, ESCURO, 0.2 * U, alt * deg + 4 * U, x, (alt * deg + 4 * U) / 2, -deg * fun);
    return g; } },
  poste: { nome: "Poste de luz", grupo: "Pista", montar() {
    const g = new THREE.Group(), h = 10 * U; cil(g, ESCURO, 0.15 * U, h, 0, h / 2, 0, 8, 0.1 * U);
    caixa(g, ESCURO, 2.4 * U, 0.15 * U, 0.15 * U, 0, h, 0.6 * U).rotation.x = 0.2; caixa(g, LUZ, 1.2 * U, 0.2 * U, 0.6 * U, 0, h - 0.1 * U, 1.1 * U); return g; } },
  holofote: { nome: "Torre de holofotes", grupo: "Pista", montar() {
    const g = new THREE.Group(), h = 22 * U; cil(g, CINZA, 0.4 * U, h, 0, h / 2, 0, 8, 0.25 * U); caixa(g, ESCURO, 5 * U, 3 * U, 0.4 * U, 0, h + 1.5 * U, 0);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) caixa(g, LUZ, 1.3 * U, 1.1 * U, 0.2 * U, (i - 1) * 1.6 * U, h + 0.8 * U + j * 1.4 * U, 0.3 * U); return g; } },
  arvore: { nome: "Árvore", grupo: "Natureza", montar() {
    const g = new THREE.Group(); cil(g, TRONCO, 0.25 * U, 3 * U, 0, 1.5 * U, 0, 7, 0.18 * U);
    const r = sorteio(7); for (let k = 0; k < 4; k++) malha(g, new THREE.IcosahedronGeometry((1.6 + r()) * U, 0), k % 2 ? VERDE : VERDE2, (r() - 0.5) * 1.6 * U, (3.6 + r() * 1.6) * U, (r() - 0.5) * 1.6 * U); return g; } },
  pinheiro: { nome: "Pinheiro", grupo: "Natureza", montar() {
    const g = new THREE.Group(); cil(g, TRONCO, 0.22 * U, 2 * U, 0, U, 0, 6);
    for (let k = 0; k < 3; k++) malha(g, new THREE.ConeGeometry((2.4 - k * 0.6) * U, 3 * U, 8), VERDE, 0, (2.6 + k * 1.6) * U, 0); return g; } },
  palmeira: { nome: "Palmeira", grupo: "Natureza", montar() {
    const g = new THREE.Group(), h = 8 * U, troncoM = M(0x8a7a6c, { flatShading: true }); cil(g, troncoM, 0.25 * U, h, 0, h / 2, 0, 7, 0.16 * U);
    for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2, f = malha(g, new THREE.ConeGeometry(0.45 * U, 3.6 * U, 4), k % 2 ? VERDE : VERDE2, Math.cos(a) * 1.4 * U, h - 0.4 * U, Math.sin(a) * 1.4 * U); f.rotation.set(0, -a, -1.9); f.scale.z = 0.25; } return g; } },
  arbusto: { nome: "Arbusto", grupo: "Natureza", montar() { const g = new THREE.Group(), r = sorteio(3); for (let k = 0; k < 3; k++) malha(g, new THREE.IcosahedronGeometry((0.7 + r() * 0.4) * U, 0), VERDE2, (r() - 0.5) * U, 0.6 * U, (r() - 0.5) * U); return g; } },
  pedra: { nome: "Pedra", grupo: "Natureza", montar() { const g = new THREE.Group(); const p = malha(g, new THREE.DodecahedronGeometry(1.2 * U, 0), M(0x7d7a75, { flatShading: true }), 0, 0.7 * U, 0); p.scale.set(1.3, 0.7, 1); return g; } },
  pneus: { nome: "Barreira de pneus", grupo: "Pista", montar() {
    const g = new THREE.Group(), geo = new THREE.TorusGeometry(0.32 * U, 0.14 * U, 6, 12);
    for (let i = 0; i < 8; i++) for (let k = 0; k < 3; k++) { const t = malha(g, geo, BORRACHA, (i - 3.5) * 0.66 * U, 0.15 * U + k * 0.28 * U, 0); t.rotation.x = Math.PI / 2; }
    caixa(g, AZUL, 5.4 * U, 0.3 * U, 0.05 * U, 0, 0.75 * U, 0.48 * U); return g; } },
  tecpro: { nome: "Barreira Tecpro", grupo: "Pista", montar() { const g = new THREE.Group(); for (let i = 0; i < 4; i++) caixa(g, i % 2 ? AZUL : VERMELHO, 1.2 * U, 1.1 * U, 1 * U, (i - 1.5) * 1.22 * U, 0.55 * U, 0); return g; } },
  grade: { nome: "Alambrado", grupo: "Pista", montar() {
    const g = new THREE.Group(), w = 10 * U, h = 4 * U, tela = new THREE.MeshStandardMaterial({ color: 0x9aa3ab, roughness: 0.5, metalness: 0.4, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
    malha(g, new THREE.PlaneGeometry(w, h), tela, 0, h / 2, 0); for (const x of [-w / 2, 0, w / 2]) cil(g, ESCURO, 0.06 * U, h, x, h / 2, 0, 6); caixa(g, ESCURO, w, 0.08 * U, 0.08 * U, 0, h, 0); return g; } },
  guardrail: { nome: "Guard-rail", grupo: "Pista", montar() { const g = new THREE.Group(), w = 10 * U, aco = M(0xc7ccd1, { metalness: 0.6, roughness: 0.35 }); for (const y of [0.55, 0.85]) caixa(g, aco, w, 0.3 * U, 0.08 * U, 0, y * U, 0); for (let x = -w / 2; x <= w / 2; x += 2 * U) caixa(g, ESCURO, 0.12 * U, U, 0.12 * U, x, 0.5 * U, -0.1 * U); return g; } },
  cone: { nome: "Cone", grupo: "Pista", montar() { const g = new THREE.Group(); caixa(g, LARANJA, 0.45 * U, 0.05 * U, 0.45 * U, 0, 0.025 * U, 0); cil(g, LARANJA, 0.18 * U, 0.7 * U, 0, 0.38 * U, 0, 10, 0.03 * U); cil(g, BRANCO, 0.12 * U, 0.12 * U, 0, 0.45 * U, 0, 10, 0.09 * U); return g; } },
  tenda: { nome: "Tenda", grupo: "Paddock", montar() {
    const g = new THREE.Group(), w = 6 * U, h = 3 * U; for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) cil(g, BRANCO, 0.06 * U, h, x * w / 2, h / 2, z * w / 2, 6);
    const teto = malha(g, new THREE.ConeGeometry(w * 0.72, 1.8 * U, 4), BRANCO, 0, h + 0.9 * U, 0); teto.rotation.y = Math.PI / 4;
    for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2, b = caixa(g, k % 2 ? VERMELHO : BRANCO, w, 0.5 * U, 0.05 * U, Math.sin(a) * w / 2, h - 0.25 * U, Math.cos(a) * w / 2); b.rotation.y = a; } return g; } },
  container: { nome: "Contêiner", grupo: "Paddock", montar() { const g = new THREE.Group(), c = M(0x2f6f9a); caixa(g, c, 6 * U, 2.6 * U, 2.4 * U, 0, 1.3 * U, 0); for (let k = -5; k <= 5; k++) caixa(g, M(0x285f84), 0.08 * U, 2.4 * U, 2.45 * U, k * 0.5 * U, 1.3 * U, 0); return g; } },
  cabine: { nome: "Cabine de fiscal", grupo: "Pista", montar() { const g = new THREE.Group(); caixa(g, BRANCO, 2 * U, 2.4 * U, 2 * U, 0, 1.2 * U, 0); caixa(g, VIDRO, 1.6 * U, 0.9 * U, 0.05 * U, 0, 1.6 * U, 1.01 * U); caixa(g, VERMELHO, 2.3 * U, 0.2 * U, 2.3 * U, 0, 2.5 * U, 0); return g; } },
  mastro: { nome: "Mastro com bandeira", grupo: "Público", montar() { const g = new THREE.Group(), h = 8 * U; cil(g, BRANCO, 0.06 * U, h, 0, h / 2, 0, 6); const b = new THREE.Mesh(new THREE.PlaneGeometry(1.8 * U, 1.1 * U), new THREE.MeshStandardMaterial({ color: 0xd62828, side: THREE.DoubleSide })); b.position.set(0.9 * U, h - 0.6 * U, 0); g.add(b); return g; } },
  grua: { nome: "Grua de câmera", grupo: "Paddock", montar() {
    const g = new THREE.Group(); caixa(g, ESCURO, 1.6 * U, 0.6 * U, 1.6 * U, 0, 0.3 * U, 0); cil(g, ESCURO, 0.12 * U, 3 * U, 0, 1.8 * U, 0, 8);
    const braco = caixa(g, AMARELO, 7 * U, 0.2 * U, 0.2 * U, 1.8 * U, 3.4 * U, 0); braco.rotation.z = 0.25; caixa(g, ESCURO, 0.6 * U, 0.4 * U, 0.4 * U, 5 * U, 4.3 * U, 0); return g; } },
  banco: { nome: "Banco", grupo: "Público", montar() { const g = new THREE.Group(), madeira = M(0x8a5a35); caixa(g, madeira, 1.8 * U, 0.08 * U, 0.45 * U, 0, 0.45 * U, 0); caixa(g, madeira, 1.8 * U, 0.4 * U, 0.06 * U, 0, 0.7 * U, -0.2 * U); for (const x of [-0.8, 0.8]) caixa(g, ESCURO, 0.06 * U, 0.45 * U, 0.45 * U, x * U, 0.22 * U, 0); return g; } },
  totem: { nome: "Totem de patrocínio", grupo: "Público", montar() { const g = new THREE.Group(); caixa(g, AZUL, 1.2 * U, 4 * U, 0.4 * U, 0, 2 * U, 0); caixa(g, BRANCO, 1 * U, 1 * U, 0.42 * U, 0, 3.2 * U, 0); return g; } },
  portico: { nome: "Pórtico (largada)", grupo: "Pista", montar() { const g = new THREE.Group(), w = 30 * U, h = 7 * U; for (const x of [-w / 2, w / 2]) caixa(g, CINZA, 0.8 * U, h, 0.8 * U, x, h / 2, 0); caixa(g, ESCURO, w, 1.4 * U, 0.6 * U, 0, h, 0); return g; } }, // (o semáforo saiu daqui: o pórtico do editor tem a opção)
};
// (2026-11-16, a imagem do Thiago) o prédio de faixas: seis andares com as lajes brancas saltadas, as paredes ocre, a pele de vidro azul com
// montantes na frente e no fundo, a cobertura chanfrada, a piscina de vidro e o terraço com os aparelhos de ar
KITS.predioFaixas = { nome: "Prédio de faixas", grupo: "Cidade", montar() {
  const g = new THREE.Group(), w = 24 * U, d = 14 * U, andar = 3.2 * U, n = 6, H = andar * n;
  const OCRE = M(0xb98a4c, { roughness: 0.85 }), LAJE = M(0xe9ebee, { roughness: 0.6 }), VIDRO_AZ = M(0x1f2f6e, { roughness: 0.15, metalness: 0.35 }), MONT = M(0x2a2f38, { roughness: 0.5, metalness: 0.3 });
  const PISCINA = new THREE.MeshStandardMaterial({ color: 0x8fc7f0, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.85 }), PISO = M(0xd9a385, { roughness: 0.9 });
  caixa(g, OCRE, w, H, d, 0, H / 2, 0); // o corpo
  for (const s of [-1, 1]) { // a pele de vidro na frente e no fundo, entre as paredes cheias das pontas, com os montantes
    const lv = w * 0.62; caixa(g, VIDRO_AZ, lv, H - 0.6 * U, 0.3 * U, 0, H / 2, s * (d / 2 + 0.05 * U));
    for (let k = 0; k <= 8; k++) caixa(g, MONT, 0.22 * U, H - 0.6 * U, 0.4 * U, -lv / 2 + (k * lv) / 8, H / 2, s * (d / 2 + 0.12 * U));
  }
  for (let k = 0; k <= n; k++) caixa(g, LAJE, w + 1.2 * U, 0.45 * U, d + 1.2 * U, 0, k * andar, 0); // as lajes saltadas (as faixas brancas)
  caixa(g, M(0xc98a5a), w * 0.7, 0.6 * U, 0.3 * U, 0, 0.6 * U, d / 2 + 0.4 * U); // o friso do térreo
  // a cobertura: a platibanda branca chanfrada em volta
  const plat = caixa(g, LAJE, w + 2 * U, 1.4 * U, d + 2 * U, 0, H + 0.9 * U, 0);
  const chanfro = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 1, 1, 4, 1).rotateY(Math.PI / 4), LAJE); chanfro.scale.set((w + 2 * U) / Math.SQRT2, 1 * U, (d + 2 * U) / Math.SQRT2); /* (o lado do quadrado de raio 1 mede √2) */ chanfro.position.y = H + 2.1 * U; chanfro.castShadow = true; g.add(chanfro);
  caixa(g, LAJE, w - 1 * U, 0.4 * U, d - 1 * U, 0, H + 2.4 * U, 0); // o piso da cobertura
  // a piscina de vidro de um lado e o terraço com os quatro aparelhos de ar do outro
  caixa(g, PISCINA, w * 0.5, 0.5 * U, d * 0.62, w * 0.2, H + 2.8 * U, 0);
  caixa(g, PISO, w * 0.36, 0.2 * U, d * 0.7, -w * 0.28, H + 2.7 * U, 0);
  for (const [ox, oz] of [[-0.36, -0.18], [-0.24, -0.18], [-0.36, 0.14], [-0.24, 0.14]]) {
    const x = ox * w, z = oz * d; cil(g, ESCURO, 0.25 * U, 0.6 * U, x, H + 3.1 * U, z, 6);
    const prato = malha(g, new THREE.SphereGeometry(0.9 * U, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), M(0x3c5d7a, { metalness: 0.5, roughness: 0.35 }), x, H + 3.4 * U, z); prato.scale.y = 0.45;
    caixa(g, ESCURO, 0.25 * U, 0.25 * U, 1.6 * U, x + 0.6 * U, H + 2.9 * U, z + 0.5 * U).rotation.y = 0.6;
  }
  return g; } };
// ---------- a leva de 2026-11-17 (as imagens do Thiago) ----------
// texturas desenhadas no canvas (repetidas pelo tamanho: as janelas não esticam)
const texs = new Map();
function texCanvas(chave, w, h, desenhar, rep = [1, 1]) {
  if (!texs.has(chave)) { const c = document.createElement("canvas"); c.width = w; c.height = h; desenhar(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; texs.set(chave, t); }
  const t = texs.get(chave).clone(); t.needsUpdate = true; t.repeat.set(rep[0], rep[1]); return t;
}
// a fachada de torre: o vão da janela azul, os montantes e a laje na cor da moldura
function fachadaTorre(moldura, parede, colunas, andares) {
  return new THREE.MeshStandardMaterial({ roughness: 0.6, map: texCanvas("torre" + moldura + parede, 64, 64, (x, w, h) => {
    x.fillStyle = parede; x.fillRect(0, 0, w, h); x.fillStyle = "#2c5274"; x.fillRect(8, 10, 48, 40); x.fillStyle = "#ffffff30"; x.fillRect(10, 12, 12, 36);
    x.fillStyle = moldura; x.fillRect(0, 54, w, 10); x.fillRect(30, 10, 4, 40); x.fillRect(4, 8, 4, 46); x.fillRect(56, 8, 4, 46);
  }, [colunas, andares]) });
}
function torre(parede, moldura, andares, larg = 22, fundo = 18) {
  const g = new THREE.Group(), w = larg * U, d = fundo * U, H = andares * 3.2 * U;
  const m = fachadaTorre(moldura, parede, Math.round(larg / 3.4), andares), m2 = fachadaTorre(moldura, parede, Math.round(fundo / 3.4), andares), topo = M(new THREE.Color(parede).multiplyScalar(0.92).getHex());
  malha(g, new THREE.BoxGeometry(w, H, d), [m2, m2, topo, topo, m, m], 0, H / 2, 0);
  caixa(g, M(new THREE.Color(moldura).getHex()), w + 0.8 * U, 1.2 * U, d + 0.8 * U, 0, H + 0.6 * U, 0); // a platibanda
  caixa(g, topo, w * 0.3, 3 * U, d * 0.3, w * 0.15, H + 1.5 * U, 0); // a casa de máquinas
  caixa(g, M(0x6b5a4a), w + 0.4 * U, 4 * U, d + 0.4 * U, 0, 2 * U, 0); // o térreo
  return g;
}
KITS.torreRosa = { nome: "Torre rosa", grupo: "Cidade", montar: () => torre("#f2d7c4", "#c9895f", 18) };
KITS.torreAmarela = { nome: "Torre amarela", grupo: "Cidade", montar: () => torre("#f6e7a8", "#d9a51e", 18) };
KITS.torreLilas = { nome: "Torre branca e lilás", grupo: "Cidade", montar: () => torre("#f4f2f6", "#c7a7d9", 20, 18, 16) };

// a arquibancada grande coberta (a reta de Barcelona): dois lances de cadeiras vermelhas e brancas, a cobertura inclinada presa nas
// costelas em "C" e a parede do fundo
KITS.arquibancadaGrande = { nome: "Arquibancada grande coberta", grupo: "Público", montar() {
  const g = new THREE.Group(), L = 110 * U, fun = 0.85 * U, alt = 0.45 * U, degraus = 14;
  const cadeiras = new THREE.MeshStandardMaterial({ roughness: 0.8, map: texCanvas("cadeiras", 64, 16, (x, w, h) => { for (let i = 0; i < 16; i++) { x.fillStyle = i % 5 === 0 ? "#f2f2f2" : "#c9302c"; x.fillRect(i * 4, 0, 3, h); } x.fillStyle = "#00000040"; x.fillRect(0, h - 3, w, 3); }, [L / (6 * U), 1]) });
  for (const [base, z0] of [[0, 0], [degraus * alt + 3 * U, -degraus * fun - 1.5 * U]]) {
    for (let k = 0; k < degraus; k++) { caixa(g, CINZA, L, alt, fun, 0, base + alt * k + alt / 2, z0 - k * fun); const c = caixa(g, cadeiras, L, 0.4 * U, 0.4 * U, 0, base + alt * (k + 1) + 0.2 * U, z0 - k * fun + 0.1 * U); c.castShadow = false; }
    caixa(g, ESCURO, L, 1.2 * U, 0.2 * U, 0, base + 0.6 * U, z0 + fun / 2 + 0.1 * U); // o guarda-corpo
  }
  const Htot = 2 * degraus * alt + 3 * U, Z = -2 * degraus * fun - 1.5 * U;
  caixa(g, M(0x4a4d52), L, Htot + 6 * U, 1 * U, 0, (Htot + 6 * U) / 2, Z - 0.5 * U); // a parede do fundo
  // a cobertura e as costelas em "C": o perfil (z para a frente, y para cima) sai do pé do fundo, curva para trás, sobe e avança por cima das cadeiras
  const topo = Htot + 9 * U, frente = 4 * U;
  const forma = new THREE.Shape(); forma.moveTo(Z, 0); forma.quadraticCurveTo(Z - 12 * U, topo * 0.5, Z + 1 * U, topo); forma.lineTo(frente, topo + 1.2 * U); forma.lineTo(frente, topo); forma.lineTo(Z + 2.6 * U, topo - 1.4 * U); forma.quadraticCurveTo(Z - 8.5 * U, topo * 0.5, Z + 1.6 * U, 0); forma.closePath();
  const costela = new THREE.ExtrudeGeometry(forma, { depth: 1.2 * U, bevelEnabled: false }).rotateY(-Math.PI / 2);
  for (let k = 0; k <= 6; k++) malha(g, costela, M(0x6b6f76), -L / 2 + (k * L) / 6 + 0.6 * U, 0, 0);
  const teto = caixa(g, M(0x5a5e66, { roughness: 0.7 }), L + 2 * U, 0.6 * U, frente - Z, 0, topo + 0.6 * U, (frente + Z) / 2); teto.rotation.x = -Math.atan2(1.2 * U, frente - Z);
  return g; } };

// os caminhões do paddock: o cavalo (a cabine com o defletor) e a carreta baú, ou a prancha vazia
function cavalo(g, cor, x0) {
  const C = M(cor, { roughness: 0.45, metalness: 0.2 }), P = M(0x1d1f22, { roughness: 0.95 }), V = M(0x1f2a33, { roughness: 0.1, metalness: 0.4 });
  caixa(g, C, 2.5 * U, 3 * U, 2.3 * U, 0, 2.3 * U, x0); caixa(g, V, 2.3 * U, 1 * U, 0.1 * U, 0, 2.9 * U, x0 + 1.16 * U); caixa(g, C, 2.4 * U, 0.9 * U, 1.2 * U, 0, 4.2 * U, x0 - 0.4 * U); // a cabine, o para-brisa e o defletor
  caixa(g, ESCURO, 2.2 * U, 0.6 * U, 6 * U, 0, 0.9 * U, x0 - 2 * U); // o chassi
  for (const z of [x0 + 0.2 * U, x0 - 2.6 * U, x0 - 3.9 * U]) for (const s of [-1, 1]) { const r = cil(g, P, 0.5 * U, 0.35 * U, s * 1.1 * U, 0.5 * U, z, 14); r.rotation.z = Math.PI / 2; }
}
function rodasCarreta(g, z0, n) { const P = M(0x1d1f22, { roughness: 0.95 }); for (let k = 0; k < n; k++) for (const s of [-1, 1]) { const r = cil(g, P, 0.5 * U, 0.35 * U, s * 1.1 * U, 0.5 * U, z0 - k * 1.4 * U, 14); r.rotation.z = Math.PI / 2; } }
KITS.caminhaoBau = { nome: "Caminhão baú", grupo: "Paddock", montar() { const g = new THREE.Group(); cavalo(g, 0xd62828, 6 * U); caixa(g, M(0xf2f2f0, { roughness: 0.6 }), 2.5 * U, 2.8 * U, 13.5 * U, 0, 2.6 * U, -2 * U); caixa(g, ESCURO, 2.2 * U, 0.4 * U, 13.5 * U, 0, 1.1 * U, -2 * U); rodasCarreta(g, -6 * U, 3); return g; } };
KITS.caminhaoCinza = { nome: "Caminhão baú cinza", grupo: "Paddock", montar() { const g = new THREE.Group(); cavalo(g, 0x6b6f76, 6 * U); caixa(g, M(0xe8e8e6, { roughness: 0.6 }), 2.5 * U, 2.8 * U, 13.5 * U, 0, 2.6 * U, -2 * U); caixa(g, ESCURO, 2.2 * U, 0.4 * U, 13.5 * U, 0, 1.1 * U, -2 * U); rodasCarreta(g, -6 * U, 3); return g; } };
KITS.caminhaoPrancha = { nome: "Carreta prancha", grupo: "Paddock", montar() { const g = new THREE.Group(); cavalo(g, 0x8d9096, 6 * U); caixa(g, M(0x9a8a6a, { roughness: 0.9 }), 2.5 * U, 0.3 * U, 13 * U, 0, 1.4 * U, -2 * U); caixa(g, ESCURO, 2.2 * U, 0.4 * U, 13 * U, 0, 1.1 * U, -2 * U); rodasCarreta(g, -6 * U, 3); return g; } };

// a torre de classificação da reta: o painel do patrocinador com o relógio em cima e as posições de 1 a 10
KITS.torreClassificacao = { nome: "Torre de classificação", grupo: "Pista", montar() {
  const g = new THREE.Group(), w = 3 * U, H = 14 * U;
  const lista = new THREE.MeshStandardMaterial({ roughness: 0.6, map: texCanvas("posicoes", 64, 256, (x, cw, ch) => { x.fillStyle = "#22262d"; x.fillRect(0, 0, cw, ch); x.font = "700 18px Arial"; x.textBaseline = "middle"; for (let k = 0; k < 10; k++) { x.fillStyle = "#ffffff"; x.fillText(String(k + 1), 6, 13 + k * 25.4); x.fillStyle = "#3a404a"; x.fillRect(28, 6 + k * 25.4, 32, 15); } }) });
  const painel = new THREE.MeshStandardMaterial({ roughness: 0.5, emissive: 0x2a2208, map: texCanvas("rolexpainel", 128, 192, (x, cw, ch) => {
    x.fillStyle = "#0b0c0e"; x.fillRect(0, 0, cw, ch); x.textAlign = "center"; x.fillStyle = "#d9b45a";
    for (const y of [40, 132]) { x.beginPath(); for (const dx of [-12, -6, 0, 6, 12]) { x.moveTo(64 + dx, y - 10); x.lineTo(64 + dx * 0.6, y); } x.lineWidth = 3; x.strokeStyle = "#d9b45a"; x.stroke(); x.fillRect(50, y, 28, 4); x.font = "700 22px Georgia, serif"; x.fillText("ROLEX", 64, y + 22); }
    x.fillStyle = "#1c2a1c"; x.fillRect(4, 170, cw - 8, 18); x.fillStyle = "#9df59d"; x.font = "700 16px monospace"; x.fillText("16:04:37", 64, 184);
  }) });
  caixa(g, M(0x1a1d22), w, H, 0.8 * U, 0, H / 2, 0); malha(g, new THREE.PlaneGeometry(w * 0.92, H * 0.92), lista, 0, H / 2, 0.41 * U);
  caixa(g, M(0x0b0c0e), w * 1.25, 6.5 * U, 1 * U, 0, H + 3.25 * U, 0); malha(g, new THREE.PlaneGeometry(w * 1.18, 6.3 * U), painel, 0, H + 3.25 * U, 0.51 * U);
  return g; } };

// o prédio de rotunda (como os da praça do Casino): a ponta redonda de sete andares com as faixas de pedra, as janelas com toldo, o
// terraço com guarda-corpo de vidro e a ala reta atrás
KITS.predioRotunda = { nome: "Prédio de rotunda", grupo: "Cidade", montar() {
  const g = new THREE.Group(), R = 11 * U, andares = 7, H = andares * 3.4 * U, PAR = "#e3d3a2";
  const fachada = new THREE.MeshStandardMaterial({ roughness: 0.8, map: texCanvas("rotunda", 64, 64, (x, w, h) => { x.fillStyle = PAR; x.fillRect(0, 0, w, h); x.fillStyle = "#cdbb88"; x.fillRect(0, 56, w, 8); x.fillStyle = "#3b4048"; x.fillRect(22, 18, 20, 30); x.fillStyle = "#f4f1e8"; for (let i = 0; i < 5; i++) x.fillRect(19 + i * 6, 12, 4, 7); x.fillStyle = "#cdbb88"; x.fillRect(18, 48, 28, 3); }, [16, andares]) });
  malha(g, new THREE.CylinderGeometry(R, R, H, 32, 1, false, 0, Math.PI), fachada, 0, H / 2, 0).rotation.y = Math.PI / 2;
  malha(g, new THREE.BoxGeometry(2 * R, H, 18 * U), [fachada, fachada, M(0xd6c795), M(0xd6c795), fachada, fachada], 0, H / 2, -9 * U);
  malha(g, new THREE.BoxGeometry(14 * U, H * 0.75, 22 * U), [fachada, fachada, M(0x3e4a5c), M(0x3e4a5c), fachada, fachada], 2 * R / 2 + 7 * U - 2 * U, H * 0.375, -12 * U); // a ala de mansarda ao lado
  caixa(g, M(0xb9a77a), 2 * R + 2 * U, 4 * U, 18 * U + 2 * U, 0, 2 * U, -9 * U); malha(g, new THREE.CylinderGeometry(R + U, R + U, 4 * U, 32, 1, false, 0, Math.PI), M(0xb9a77a), 0, 2 * U, 0).rotation.y = Math.PI / 2; // o embasamento
  malha(g, new THREE.CylinderGeometry(R + 0.3 * U, R + 0.3 * U, 0.6 * U, 32, 1, false, 0, Math.PI), M(0xe9e1c8), 0, H + 0.3 * U, 0).rotation.y = Math.PI / 2; // a laje do terraço
  caixa(g, M(0xe9e1c8), 2 * R + 0.6 * U, 0.6 * U, 18 * U, 0, H + 0.3 * U, -9 * U);
  const vidroG = new THREE.MeshStandardMaterial({ color: 0x9fc4d4, roughness: 0.1, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
  malha(g, new THREE.CylinderGeometry(R, R, 1.2 * U, 32, 1, true, 0, Math.PI), vidroG, 0, H + 1.2 * U, 0).rotation.y = Math.PI / 2; // o guarda-corpo de vidro
  malha(g, new THREE.CylinderGeometry(R * 0.6, R * 0.6, 3 * U, 24, 1, false, 0, Math.PI), M(0xe9e1c8), 0, H + 2 * U, -2 * U).rotation.y = Math.PI / 2; // o volume do terraço
  return g; } };

// a torre de controle da direção de prova (como a do Catar): três andares em degrau com as faixas de vidro, a pérgola branca rendada
// em cima e o terraço redondo com guarda-sóis
KITS.torreControle = { nome: "Torre de controle", grupo: "Paddock", montar() {
  const g = new THREE.Group(), BEGE = M(0xe2d6bf), VID = M(0x7fd3e8, { roughness: 0.1, metalness: 0.3 });
  for (let k = 0; k < 3; k++) { const w = (14 - k * 0.8) * U, y = 1 * U + k * 3.6 * U; caixa(g, BEGE, w, 3.2 * U, w, 0, y + 1.6 * U, 0); for (const r of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) { const v = caixa(g, VID, w * 0.55, 2 * U, 0.2 * U, 0, y + 1.6 * U, 0); v.position.set(Math.sin(r) * (w / 2 + 0.05 * U), y + 1.6 * U, Math.cos(r) * (w / 2 + 0.05 * U)); v.rotation.y = r; } caixa(g, BEGE, w + 1.6 * U, 0.4 * U, w + 1.6 * U, 0, y + 3.3 * U, 0); }
  const topo = 12 * U; for (const [x, z] of [[-4, -4], [4, -4], [-4, 4], [4, 4]]) cil(g, BRANCO, 0.2 * U, 4 * U, x * U, topo + 2 * U, z * U, 6);
  const renda = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, alphaTest: 0.5, map: texCanvas("renda", 256, 256, (x, w, h) => { x.clearRect(0, 0, w, h); x.strokeStyle = "#ffffff"; x.lineWidth = 5; x.beginPath(); x.arc(128, 128, 124, 0, Math.PI * 2); x.stroke(); let s = 9; const r = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff); for (let i = 0; i < 60; i++) { const a = r() * 6.28, b = r() * 6.28, ra = 20 + r() * 100, rb = 20 + r() * 100; x.beginPath(); x.moveTo(128 + Math.cos(a) * ra, 128 + Math.sin(a) * ra); x.lineTo(128 + Math.cos(b) * rb, 128 + Math.sin(b) * rb); x.stroke(); } }) });
  const disco = malha(g, new THREE.CircleGeometry(13 * U, 48), renda, 0, topo + 4 * U, 0); disco.rotation.x = -Math.PI / 2;
  malha(g, new THREE.CylinderGeometry(15 * U, 15 * U, 1 * U, 40), M(0xc9c9c4), 0, 0.5 * U, 0); // o terraço redondo
  malha(g, new THREE.CylinderGeometry(15 * U, 15 * U, 1 * U, 40, 1, true), new THREE.MeshStandardMaterial({ color: 0x9aa3ab, transparent: true, opacity: 0.4, side: THREE.DoubleSide }), 0, 1.5 * U, 0);
  for (let k = 0; k < 4; k++) { const a = Math.PI / 4 + k * Math.PI / 2, x = Math.cos(a) * 11 * U, z = Math.sin(a) * 11 * U; cil(g, BRANCO, 0.05 * U, 2.2 * U, x, 2.1 * U, z, 6); malha(g, new THREE.ConeGeometry(1.4 * U, 0.6 * U, 8), M(0xf3e9b8), x, 3.3 * U, z); cil(g, M(0x2c3036), 0.7 * U, 0.1 * U, x, 1.8 * U, z, 10); }
  return g; } };

// o prédio de hospitalidade (os boxes do Catar): o térreo das garagens, dois terraços corridos com colunas, guarda-sóis e a cobertura
KITS.hospitalidade = { nome: "Prédio de hospitalidade", grupo: "Paddock", montar() {
  const g = new THREE.Group(), L = 90 * U, d = 14 * U, BEGE = M(0xe8dcbf), CREM = M(0xf4f1e8), VID = M(0x7fc6d8, { roughness: 0.1, metalness: 0.3 });
  caixa(g, BEGE, L, 4 * U, d, 0, 2 * U, 0); for (let k = 0; k < 18; k++) caixa(g, VID, 3 * U, 2 * U, 0.2 * U, -L / 2 + 3 * U + k * (L - 6 * U) / 17, 2.2 * U, d / 2 + 0.05 * U);
  for (const [y, rec] of [[4.2, 0], [8, 2]]) { caixa(g, CREM, L - rec * U, 0.4 * U, d + 6 * U - rec * U, 0, y * U, 1.5 * U); caixa(g, new THREE.MeshStandardMaterial({ color: 0xbcc6cc, transparent: true, opacity: 0.4 }), L - rec * U, 1.1 * U, 0.1 * U, 0, (y + 0.75) * U, d / 2 + 4.4 * U - rec * U / 2); caixa(g, BEGE, L * 0.75, 3.4 * U, d * 0.6, 0, (y + 2) * U, -d * 0.2); }
  caixa(g, CREM, L + 2 * U, 0.6 * U, d + 10 * U, 0, 12 * U, 1 * U); caixa(g, M(0xc8a46a), L * 0.6, 0.2 * U, d * 0.7, L * 0.15, 12.4 * U, 0); // a cobertura com o terraço de cima
  for (let k = 0; k < 8; k++) cil(g, M(0xd9c79a), 0.4 * U, 8 * U, -L / 2 + 4 * U + k * 5 * U, 8 * U, d / 2 + 4 * U, 10); // as colunas da ponta
  const sombras = [0xf3e9b8, 0xf2b6c4, 0x2c3036, 0xf3e9b8]; for (let k = 0; k < 10; k++) { const x = -L / 2 + 6 * U + k * 8.5 * U, z = d / 2 + 2.5 * U; for (const y of [4.4, 8.2]) { cil(g, BRANCO, 0.05 * U, 2 * U, x, (y + 1) * U, z, 6); malha(g, new THREE.ConeGeometry(1.3 * U, 0.5 * U, 8), M(sombras[k % 4]), x, (y + 2.1) * U, z); } }
  return g; } };

// o manipulador telescópico (o "Manitou" amarelo dos fiscais)
KITS.telehandler = { nome: "Manipulador telescópico", grupo: "Pista", montar() {
  const g = new THREE.Group(), AM = M(0xf2c230, { roughness: 0.5 }), P = M(0x1d1f22, { roughness: 0.95 });
  caixa(g, AM, 2.2 * U, 1.2 * U, 4.5 * U, 0, 1.3 * U, 0); caixa(g, M(0x1f2a33, { roughness: 0.1, metalness: 0.4 }), 0.9 * U, 1.4 * U, 1.6 * U, -0.6 * U, 2.6 * U, -0.3 * U); caixa(g, AM, 1 * U, 0.1 * U, 1.7 * U, -0.6 * U, 3.35 * U, -0.3 * U);
  for (const z of [-1.5, 1.5]) for (const s of [-1, 1]) { const r = cil(g, P, 0.65 * U, 0.5 * U, s * 1.2 * U, 0.65 * U, z * U, 14); r.rotation.z = Math.PI / 2; }
  const lanca = caixa(g, AM, 0.5 * U, 0.5 * U, 7 * U, 0.5 * U, 3.2 * U, 2.6 * U); lanca.rotation.x = -0.45;
  caixa(g, AM, 1.2 * U, 0.12 * U, 0.6 * U, 0.5 * U, 4.75 * U, 5.9 * U); caixa(g, AM, 1.2 * U, 0.5 * U, 0.08 * U, 0.5 * U, 5.05 * U, 6.2 * U); // a plataforma pequena na ponta da lança
  return g; } };
// ---------- a segunda leva de 2026-11-17 (escolhida para as pistas de rua e o paddock) ----------
// a passarela de pedestres por cima da pista: dois pilares com escada, o tabuleiro coberto e a faixa de patrocínio
KITS.passarela = { nome: "Passarela sobre a pista", grupo: "Pista", montar() {
  const g = new THREE.Group(), vao = 44 * U, h = 7 * U, CINZ = M(0xd8dadd), AZ = M(0x2a5bd6);
  for (const s of [-1, 1]) { caixa(g, CINZ, 3 * U, h, 3 * U, s * vao / 2, h / 2, 0); const esc = caixa(g, CINZ, 2 * U, 0.4 * U, 9 * U, s * (vao / 2 + 2.5 * U), h / 2, 0); esc.rotation.x = -0.75; }
  caixa(g, CINZ, vao + 3 * U, 0.8 * U, 3.2 * U, 0, h + 0.4 * U, 0);
  for (const z of [-1.5, 1.5]) caixa(g, new THREE.MeshStandardMaterial({ color: 0x9fc4d4, roughness: 0.1, transparent: true, opacity: 0.4 }), vao + 3 * U, 2.4 * U, 0.1 * U, 0, h + 2 * U, z * U);
  caixa(g, M(0x6b6f76), vao + 4 * U, 0.3 * U, 4 * U, 0, h + 3.4 * U, 0); // a cobertura
  caixa(g, AZ, vao * 0.8, 1.2 * U, 0.15 * U, 0, h - 0.3 * U, 1.7 * U); caixa(g, AZ, vao * 0.8, 1.2 * U, 0.15 * U, 0, h - 0.3 * U, -1.7 * U); // a faixa do patrocínio
  return g; } };
// o arco inflável de patrocínio (o pórtico de largada das ruas)
KITS.arcoInflavel = { nome: "Arco inflável", grupo: "Público", montar() {
  const g = new THREE.Group(), r = 16 * U, ar = M(0xd62828, { roughness: 0.55 });
  const arco = malha(g, new THREE.TorusGeometry(r, 1.6 * U, 10, 32, Math.PI), ar, 0, 0, 0); arco.castShadow = true;
  for (const s of [-1, 1]) cil(g, ar, 1.8 * U, 1 * U, s * r, 0.5 * U, 0, 12);
  const faixa = caixa(g, BRANCO, 14 * U, 3 * U, 0.3 * U, 0, r + 0.4 * U, 1.6 * U); faixa.castShadow = false;
  return g; } };
// o iate do porto: o casco branco, as duas cobertas, os vidros escuros e a antena
KITS.iate = { nome: "Iate", grupo: "Porto", montar() {
  const g = new THREE.Group(), L = 32 * U, B = 7 * U, CASCO = M(0xf4f4f2, { roughness: 0.35 }), VID = M(0x1d2733, { roughness: 0.1, metalness: 0.4 });
  const forma = new THREE.Shape(); forma.moveTo(-L / 2, -B / 2); forma.lineTo(L * 0.25, -B / 2); forma.quadraticCurveTo(L / 2, -B * 0.15, L / 2 + 2 * U, 0); forma.quadraticCurveTo(L / 2, B * 0.15, L * 0.25, B / 2); forma.lineTo(-L / 2, B / 2); forma.closePath();
  const casco = malha(g, new THREE.ExtrudeGeometry(forma, { depth: 3 * U, bevelEnabled: false }), CASCO, 0, 3 * U, 0); casco.rotation.x = Math.PI / 2;
  caixa(g, M(0x1d3557), L, 0.6 * U, B + 0.05 * U, -0.5 * U, 0.4 * U, 0); // a linha d'água
  caixa(g, CASCO, L * 0.55, 2.4 * U, B * 0.8, -L * 0.08, 4.2 * U, 0); caixa(g, VID, L * 0.5, 1 * U, B * 0.82, -L * 0.05, 4.4 * U, 0);
  caixa(g, CASCO, L * 0.32, 2 * U, B * 0.65, -L * 0.12, 6.4 * U, 0); caixa(g, VID, L * 0.28, 0.8 * U, B * 0.67, -L * 0.1, 6.5 * U, 0);
  cil(g, M(0xd8dadd), 0.12 * U, 4 * U, -L * 0.12, 9.4 * U, 0, 6); caixa(g, M(0xd8dadd), 2 * U, 0.15 * U, 0.15 * U, -L * 0.12, 10.5 * U, 0);
  return g; } };
// o quiosque de café com o balcão, o toldo listrado, as mesas e os guarda-sóis
KITS.quiosque = { nome: "Quiosque com guarda-sóis", grupo: "Público", montar() {
  const g = new THREE.Group(), MAD = M(0x8a5a35), listra = new THREE.MeshStandardMaterial({ roughness: 0.8, map: texCanvas("toldoQ", 64, 16, (x, w, h) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? "#ffffff" : "#1f6fb5"; x.fillRect(i * 8, 0, 8, h); } }) });
  caixa(g, MAD, 5 * U, 2.6 * U, 3 * U, 0, 1.3 * U, 0); caixa(g, M(0xf4f1e8), 5.4 * U, 0.2 * U, 3.4 * U, 0, 2.7 * U, 0);
  const t = caixa(g, listra, 5.6 * U, 0.15 * U, 1.6 * U, 0, 2.9 * U, 2.2 * U); t.rotation.x = 0.35;
  const cores = [0xf3e9b8, 0xd62828, 0xf3e9b8, 0x1f6fb5];
  for (let k = 0; k < 4; k++) { const x = (k - 1.5) * 4 * U, z = 6 * U; cil(g, BRANCO, 0.05 * U, 2.4 * U, x, 1.2 * U, z, 6); malha(g, new THREE.ConeGeometry(1.6 * U, 0.6 * U, 8), M(cores[k]), x, 2.5 * U, z); cil(g, M(0xf4f4f2), 0.6 * U, 0.08 * U, x, 0.75 * U, z, 12); for (const s of [-1, 1]) caixa(g, M(0x2c3036), 0.4 * U, 0.45 * U, 0.4 * U, x + s * 0.9 * U, 0.22 * U, z); }
  return g; } };
// o prédio residencial de varandas (a beira-mar das pistas de rua): oito andares com as varandas de vidro e as lajes brancas
KITS.predioVarandas = { nome: "Prédio de varandas", grupo: "Cidade", montar() {
  const g = new THREE.Group(), w = 26 * U, d = 14 * U, andar = 3.1 * U, n = 8, H = andar * n;
  const fach = fachadaTorre("#e9e4da", "#f1ece2", Math.round(26 / 3.4), n), lado = fachadaTorre("#e9e4da", "#f1ece2", 4, n), topo = M(0xe4dfd4);
  malha(g, new THREE.BoxGeometry(w, H, d), [lado, lado, topo, topo, fach, fach], 0, H / 2, 0);
  const vg = new THREE.MeshStandardMaterial({ color: 0x9fc4d4, roughness: 0.1, transparent: true, opacity: 0.45 });
  for (let k = 1; k <= n; k++) { caixa(g, BRANCO, w, 0.35 * U, 2.2 * U, 0, k * andar - 0.2 * U, d / 2 + 1.1 * U); caixa(g, vg, w, 1.1 * U, 0.08 * U, 0, k * andar + 0.4 * U, d / 2 + 2.15 * U); }
  caixa(g, M(0xc98a5a), w + 0.6 * U, 0.8 * U, d + 2.6 * U, 0, H + 0.4 * U, 1 * U); // a platibanda terracota
  return g; } };
// o hotel de vidro curvo (como os de Abu Dhabi e Baku): a lâmina em arco de vidro azul com as faixas horizontais
KITS.hotelVidro = { nome: "Hotel de vidro curvo", grupo: "Cidade", montar() {
  const g = new THREE.Group(), R = 34 * U, H = 70 * U, ang = 1.1;
  const vid = new THREE.MeshStandardMaterial({ roughness: 0.12, metalness: 0.45, map: texCanvas("hotelvidro", 64, 64, (x, w, h) => { const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#5b8bb0"); gr.addColorStop(1, "#2c4f73"); x.fillStyle = gr; x.fillRect(0, 0, w, h); x.fillStyle = "#cfd9e0"; x.fillRect(0, 58, w, 6); x.fillRect(30, 0, 2, 58); }, [24, 22]) });
  malha(g, new THREE.CylinderGeometry(R, R, H, 40, 1, true, -ang / 2, ang), vid, 0, H / 2, -R).material.side = THREE.DoubleSide;
  malha(g, new THREE.CylinderGeometry(R - 8 * U, R - 8 * U, H, 40, 1, true, -ang / 2, ang), M(0xd8dde2), 0, H / 2, -R).material.side = THREE.DoubleSide;
  for (const s of [-1, 1]) { const x = Math.sin(s * ang / 2) * (R - 4 * U), z = Math.cos(s * ang / 2) * (R - 4 * U) - R; const p = caixa(g, M(0xd8dde2), 8 * U, H, 1 * U, x, H / 2, z); p.rotation.y = s * ang / 2 + Math.PI / 2; }
  const tampa = malha(g, new THREE.RingGeometry(R - 8 * U, R, 40, 1, Math.PI / 2 - ang / 2, ang), M(0xd8dde2), 0, H, -R); tampa.rotation.x = -Math.PI / 2;
  caixa(g, M(0x6b7178), 30 * U, 6 * U, 16 * U, 0, 3 * U, -2 * U); // o pódio da entrada
  return g; } };
// o telão: a tela em LED numa treliça, com a imagem da corrida
KITS.telao = { nome: "Telão", grupo: "Público", montar() {
  const g = new THREE.Group(), w = 12 * U, h = 7 * U, alto = 6 * U;
  const tela = new THREE.MeshStandardMaterial({ emissive: 0xffffff, emissiveIntensity: 0.55, roughness: 0.4, map: texCanvas("telao", 128, 72, (x, cw, ch) => { const gr = x.createLinearGradient(0, 0, 0, ch); gr.addColorStop(0, "#6fa8dc"); gr.addColorStop(0.55, "#b9d4ea"); gr.addColorStop(0.56, "#3a3d42"); gr.addColorStop(1, "#2c2f33"); x.fillStyle = gr; x.fillRect(0, 0, cw, ch); x.fillStyle = "#d62828"; x.fillRect(50, 46, 28, 8); x.fillStyle = "#111"; x.fillRect(48, 52, 6, 4); x.fillRect(74, 52, 6, 4); x.fillStyle = "#000000aa"; x.fillRect(0, 0, cw, 12); x.fillStyle = "#fff"; x.font = "700 9px Arial"; x.fillText("P1  VOLTA 12/20", 4, 9); }) });
  for (const s of [-1, 1]) { caixa(g, M(0x8d9096, { metalness: 0.5 }), 0.4 * U, alto + h, 0.4 * U, s * w * 0.4, (alto + h) / 2, -0.6 * U); }
  caixa(g, M(0x1a1d22), w + 0.6 * U, h + 0.6 * U, 0.6 * U, 0, alto + h / 2, 0); malha(g, new THREE.PlaneGeometry(w, h), tela, 0, alto + h / 2, 0.31 * U);
  return g; } };
// o guindaste de torre (de obra, no horizonte da cidade)
KITS.guindaste = { nome: "Guindaste de torre", grupo: "Cidade", montar() {
  const g = new THREE.Group(), H = 45 * U, AM = M(0xf2c230, { roughness: 0.5 }), trel = M(0xe0b228, { roughness: 0.5, wireframe: false });
  caixa(g, M(0x8d9096), 5 * U, 1.5 * U, 5 * U, 0, 0.75 * U, 0);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) caixa(g, AM, 0.25 * U, H, 0.25 * U, x * 1 * U, H / 2, z * 1 * U);
  for (let y = 2 * U; y < H; y += 3 * U) { caixa(g, trel, 2.2 * U, 0.12 * U, 0.12 * U, 0, y, 1 * U); caixa(g, trel, 2.2 * U, 0.12 * U, 0.12 * U, 0, y, -1 * U); caixa(g, trel, 0.12 * U, 0.12 * U, 2.2 * U, 1 * U, y, 0); caixa(g, trel, 0.12 * U, 0.12 * U, 2.2 * U, -1 * U, y, 0); }
  caixa(g, AM, 40 * U, 1.2 * U, 1.2 * U, 12 * U, H + 0.6 * U, 0); caixa(g, M(0x8d9096), 4 * U, 2 * U, 2 * U, -9 * U, H - 0.4 * U, 0); // a lança e o contrapeso
  caixa(g, M(0x2c3036), 2.4 * U, 2 * U, 2.4 * U, 0, H - 1.8 * U, 1.6 * U); cil(g, M(0x2c3036), 0.03 * U, 18 * U, 26 * U, H - 9 * U, 0, 4); caixa(g, AM, 1 * U, 0.6 * U, 1 * U, 26 * U, H - 18 * U, 0);
  return g; } };
// os carros de passeio (estacionados no paddock e nas ruas), em três cores
function sedan(cor) {
  const g = new THREE.Group(), C = M(cor, { roughness: 0.35, metalness: 0.3 }), V = M(0x1f2a33, { roughness: 0.1, metalness: 0.4 }), P = M(0x1d1f22, { roughness: 0.95 });
  caixa(g, C, 1.8 * U, 0.7 * U, 4.5 * U, 0, 0.65 * U, 0); caixa(g, C, 1.6 * U, 0.6 * U, 2.4 * U, 0, 1.3 * U, -0.2 * U); caixa(g, V, 1.62 * U, 0.42 * U, 2.2 * U, 0, 1.3 * U, -0.2 * U);
  for (const z of [-1.4, 1.4]) for (const s of [-1, 1]) { const r = cil(g, P, 0.33 * U, 0.25 * U, s * 0.85 * U, 0.33 * U, z * U, 12); r.rotation.z = Math.PI / 2; }
  return g;
}
KITS.carroBranco = { nome: "Carro branco", grupo: "Paddock", montar: () => sedan(0xf2f2f0) };
KITS.carroVermelho = { nome: "Carro vermelho", grupo: "Paddock", montar: () => sedan(0xb3262f) };
KITS.carroAzul = { nome: "Carro azul", grupo: "Paddock", montar: () => sedan(0x2a5bd6) };
// a ambulância da pista
KITS.ambulancia = { nome: "Ambulância", grupo: "Pista", montar() {
  const g = new THREE.Group(), B = M(0xf4f4f2, { roughness: 0.4 }), V = M(0x1f2a33, { roughness: 0.1, metalness: 0.4 }), P = M(0x1d1f22, { roughness: 0.95 });
  caixa(g, B, 2.1 * U, 2.4 * U, 3.6 * U, 0, 1.6 * U, -0.8 * U); caixa(g, B, 2 * U, 1.4 * U, 1.8 * U, 0, 1.1 * U, 1.9 * U); caixa(g, V, 1.9 * U, 0.6 * U, 0.1 * U, 0, 1.5 * U, 2.8 * U);
  caixa(g, VERMELHO, 2.12 * U, 0.35 * U, 3.6 * U, 0, 1.4 * U, -0.8 * U); caixa(g, M(0xff3b3b, { emissive: 0xff2020, emissiveIntensity: 0.6 }), 1.2 * U, 0.2 * U, 0.3 * U, 0, 2.9 * U, 0.4 * U); caixa(g, M(0x3b7bff, { emissive: 0x2050ff, emissiveIntensity: 0.6 }), 0.5 * U, 0.2 * U, 0.3 * U, 0.35 * U, 2.9 * U, 0.4 * U);
  for (const z of [-1.8, 1.8]) for (const s of [-1, 1]) { const r = cil(g, P, 0.42 * U, 0.3 * U, s * 1 * U, 0.42 * U, z * U, 12); r.rotation.z = Math.PI / 2; }
  return g; } };
// o heliponto com o helicóptero (a TV aérea)
KITS.heliponto = { nome: "Heliponto com helicóptero", grupo: "Paddock", montar() {
  const g = new THREE.Group(), pista = new THREE.MeshStandardMaterial({ roughness: 0.8, map: texCanvas("heliH", 128, 128, (x, w, h) => { x.fillStyle = "#3a3d42"; x.fillRect(0, 0, w, h); x.strokeStyle = "#f2c230"; x.lineWidth = 6; x.beginPath(); x.arc(64, 64, 54, 0, Math.PI * 2); x.stroke(); x.fillStyle = "#fff"; x.font = "900 64px Arial"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("H", 64, 68); }) });
  malha(g, new THREE.CylinderGeometry(9 * U, 9 * U, 0.4 * U, 32), [M(0x2c3036), pista, M(0x2c3036)], 0, 0.2 * U, 0);
  const C = M(0x1f3a6e, { roughness: 0.4, metalness: 0.3 });
  const corpo = malha(g, new THREE.SphereGeometry(1.4 * U, 16, 12), C, 0, 2 * U, 0.6 * U); corpo.scale.set(1, 1, 1.6);
  caixa(g, C, 0.4 * U, 0.4 * U, 5 * U, 0, 2.3 * U, -3 * U); caixa(g, C, 0.15 * U, 1.4 * U, 0.8 * U, 0, 2.8 * U, -5.4 * U);
  malha(g, new THREE.SphereGeometry(1.1 * U, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(0x1f2a33, { roughness: 0.1, metalness: 0.4 }), 0, 2.1 * U, 1.6 * U).scale.set(1, 0.8, 1.1);
  for (const a of [0, Math.PI / 2]) { const p = caixa(g, M(0x2c3036), 11 * U, 0.08 * U, 0.4 * U, 0, 3.6 * U, 0.4 * U); p.rotation.y = a + 0.3; }
  for (const s of [-1, 1]) caixa(g, M(0x2c3036), 0.15 * U, 0.15 * U, 3.4 * U, s * 1.1 * U, 0.6 * U, 0.4 * U);
  return g; } };
// a fileira de mastros com as bandeiras (a entrada do circuito)
KITS.bandeiras = { nome: "Fileira de bandeiras", grupo: "Público", montar() {
  const g = new THREE.Group(), cores = [0xd62828, 0xf2f2f2, 0x2a5bd6, 0x2e9e4f, 0xf2c230, 0x111111], h = 9 * U;
  for (let k = 0; k < 6; k++) { const x = (k - 2.5) * 4 * U; cil(g, BRANCO, 0.07 * U, h, x, h / 2, 0, 6); const b = new THREE.Mesh(new THREE.PlaneGeometry(2 * U, 1.3 * U), new THREE.MeshStandardMaterial({ color: cores[k], side: THREE.DoubleSide })); b.position.set(x + 1 * U, h - 0.8 * U, 0); b.castShadow = true; g.add(b); }
  return g; } };
// ---------- (2026-11-17, a imagem do Thiago: a pista low poly com a arquibancada curva de cadeiras amarelas) ----------
// as peças no estilo da imagem: arquibancadas de cadeiras (reta, curva, com toldo), a tenda arredondada, a mureta de concreto com alambrado,
// a zebra, o prédio dos boxes com camarote e a árvore de copa larga. As cadeiras e os degraus vão juntados numa malha por material (são centenas).
function juntar(g, mat, geos) { if (!geos.length) return null; const m = new THREE.Mesh(mergeGeometries(geos, false), mat); m.castShadow = m.receiveShadow = true; g.add(m); for (const x of geos) x.dispose(); return m; }
const _o = new THREE.Object3D();
function geoEm(geo, x, y, z, ry = 0, rx = 0) { _o.position.set(x, y, z); _o.rotation.set(rx, ry, 0); _o.updateMatrix(); return geo.applyMatrix4(_o.matrix); }
const CONCRETO = M(0xb9bcc0), CADEIRA = M(0xf2c230, { roughness: 0.55 }), GRADIL = M(0xdfe3e7, { metalness: 0.5, roughness: 0.35 });
// a arquibancada de cadeiras: `fileiras` degraus que sobem para trás, numa reta de `largura` m ou num arco de `angulo` graus com raio `raio` m
// (a frente para +z; o centro do arco fica na frente). `base`: a altura da primeira fileira, em cima de pilares.
function arquibancadaCadeiras({ largura = 40, raio = 0, angulo = 0, fileiras = 10, base = 3, cor = CADEIRA, pilares = true }) {
  const g = new THREE.Group(), fun = 0.85 * U, alt = 0.45 * U, b = base * U, R = raio * U, A = (angulo * Math.PI) / 180;
  const degraus = [], cad = [], encostos = [], trilhos = [], pil = [];
  // a posição e o giro de um ponto a `s` (de -1 a 1 ao longo da fileira) na fileira k (k = 0 é a da frente)
  const ponto = (s, k) => { if (!R) return { x: (s * largura * U) / 2, z: -k * fun, ry: 0 }; const r = R + k * fun, a = (s * A) / 2; return { x: r * Math.sin(a), z: R - r * Math.cos(a), ry: -a }; };
  const compr = (k) => (R ? (R + k * fun) * A : largura * U);
  for (let k = 0; k < fileiras; k++) {
    const L = compr(k), segs = Math.max(1, Math.ceil(L / (4 * U))), y = b + k * alt;
    for (let i = 0; i < segs; i++) { const p = ponto(((i + 0.5) / segs) * 2 - 1, k); degraus.push(geoEm(new THREE.BoxGeometry(L / segs + 0.05 * U, 0.25 * U, fun), p.x, y - 0.12 * U, p.z, p.ry)); }
    const n = Math.max(1, Math.floor(L / (0.55 * U)));
    for (let i = 0; i < n; i++) { const p = ponto(((i + 0.5) / n) * 2 - 1, k);
      cad.push(geoEm(new THREE.BoxGeometry(0.45 * U, 0.08 * U, 0.4 * U), p.x, y + 0.42 * U, p.z, p.ry));
      const tras = ponto(((i + 0.5) / n) * 2 - 1, k + 0.3); encostos.push(geoEm(new THREE.BoxGeometry(0.45 * U, 0.45 * U, 0.07 * U), tras.x, y + 0.66 * U, tras.z, tras.ry, -0.15)); }
  }
  // o gradil da frente e o de trás (barras finas), e a parede de trás
  const yTopo = b + fileiras * alt;
  for (const [k, y] of [[-0.45, b + 0.9 * U], [fileiras - 0.4, yTopo + 1 * U]]) { const L = compr(Math.max(0, k)), segs = Math.max(1, Math.ceil(L / (3 * U)));
    for (let i = 0; i < segs; i++) { const s = ((i + 0.5) / segs) * 2 - 1, p = ponto(s, k); trilhos.push(geoEm(new THREE.BoxGeometry(L / segs, 0.06 * U, 0.06 * U), p.x, y, p.z, p.ry)); const p2 = ponto((i / segs) * 2 - 1, k); trilhos.push(geoEm(new THREE.BoxGeometry(0.05 * U, 1 * U, 0.05 * U), p2.x, y - 0.5 * U, p2.z, p2.ry)); } }
  { const L = compr(fileiras), segs = Math.max(1, Math.ceil(L / (4 * U))); for (let i = 0; i < segs; i++) { const p = ponto(((i + 0.5) / segs) * 2 - 1, fileiras - 0.4); degraus.push(geoEm(new THREE.BoxGeometry(L / segs + 0.05 * U, 0.6 * U, 0.15 * U), p.x, yTopo + 0.3 * U, p.z, p.ry)); } }
  // embaixo: a laje inclinada (a "barriga") e os pilares até o chão, na frente e atrás, a cada 5 m
  if (b > 0 && pilares) { const L = compr(0), n = Math.max(2, Math.round(L / (5 * U)) + 1);
    for (let i = 0; i < n; i++) { const s = (i / (n - 1)) * 2 - 1;
      for (const [k, hgt] of [[0, b - 0.25 * U], [fileiras - 1, b + (fileiras - 1) * alt - 0.25 * U]]) { const p = ponto(s * 0.98, k); pil.push(geoEm(new THREE.CylinderGeometry(0.22 * U, 0.22 * U, hgt, 8), p.x, hgt / 2, p.z)); }
      const p0 = ponto(s * 0.98, 0), p1 = ponto(s * 0.98, fileiras - 1), dz = Math.hypot(p1.x - p0.x, p1.z - p0.z), dy = (fileiras - 1) * alt;
      pil.push(geoEm(new THREE.BoxGeometry(0.3 * U, 0.4 * U, Math.hypot(dz, dy)), (p0.x + p1.x) / 2, b - 0.45 * U + dy / 2, (p0.z + p1.z) / 2, p0.ry, Math.atan2(dy, dz))); }
  } else if (b > 0) { const L = compr(0), segs = Math.max(1, Math.ceil(L / (4 * U))); for (let i = 0; i < segs; i++) { const p = ponto(((i + 0.5) / segs) * 2 - 1, -0.5); degraus.push(geoEm(new THREE.BoxGeometry(L / segs + 0.05 * U, b, 0.2 * U), p.x, b / 2, p.z, p.ry)); } }
  juntar(g, CONCRETO, degraus); juntar(g, cor, cad); juntar(g, cor, encostos); juntar(g, GRADIL, trilhos); juntar(g, CINZA, pil);
  g.userData.ponto = ponto; g.userData.yTopo = yTopo; return g;
}
const F = (filtro, k) => Object.assign(k, { filtro });
KITS.arqCadeirasCurva = F("Arquibancadas", { nome: "Arquibancada curva de cadeiras", grupo: "Público", angulo: 75, montar: (a = 75) => arquibancadaCadeiras({ raio: 28, angulo: a, fileiras: 12, base: 4 }) });
KITS.arqCadeirasCurvaBaixa = F("Arquibancadas", { nome: "Arquibancada curva baixa", grupo: "Público", angulo: 60, montar: (a = 60) => arquibancadaCadeiras({ raio: 20, angulo: a, fileiras: 6, base: 1.2, pilares: false }) });
KITS.arqCadeirasReta = F("Arquibancadas", { nome: "Arquibancada reta de cadeiras", grupo: "Público", montar: () => arquibancadaCadeiras({ largura: 40, fileiras: 12, base: 4 }) });
KITS.arqCadeirasBaixa = F("Arquibancadas", { nome: "Arquibancada baixa de cadeiras", grupo: "Público", montar: () => arquibancadaCadeiras({ largura: 24, fileiras: 6, base: 1, pilares: false }) });
// a arquibancada com toldo branco (as do fundo da imagem): cadeiras, pilares atrás e a lona curva por cima
KITS.arqCadeirasToldo = F("Arquibancadas", { nome: "Arquibancada com toldo", grupo: "Público", montar() {
  const fil = 8, g = arquibancadaCadeiras({ largura: 20, fileiras: fil, base: 1, pilares: false }), w = 20 * U, prof = fil * 0.85 * U, topo = g.userData.yTopo + 3 * U;
  for (const x of [-w / 2, 0, w / 2]) cil(g, ESCURO, 0.15 * U, topo, x, topo / 2, -prof, 8);
  const lona = malha(g, new THREE.CylinderGeometry(prof * 0.62, prof * 0.62, w + U, 16, 1, true, 0, Math.PI), M(0xf7f7f5, { side: THREE.DoubleSide, emissive: 0xffffff, emissiveIntensity: 0.12 }), 0, topo, -prof / 2);
  lona.rotation.set(0, 0, Math.PI / 2); lona.scale.set(0.35, 1, 1);
  return g; } });
// a tenda branca arredondada (as da frente da imagem): o teto em meia-cana com costelas, sobre muretas baixas
function tendaTunel(compr, larg) {
  const g = new THREE.Group(), L = compr * U, W = larg * U, lona = M(0xfafaf8, { side: THREE.DoubleSide, emissive: 0xffffff, emissiveIntensity: 0.15, roughness: 0.6 });
  const teto = malha(g, new THREE.CylinderGeometry(W / 2, W / 2, L, 20, 1, true, -Math.PI / 2, Math.PI), lona, 0, 1.4 * U, 0); teto.rotation.x = Math.PI / 2; teto.scale.set(1, 1, 0.55);
  for (const s of [-1, 1]) caixa(g, BRANCO, 0.25 * U, 1.4 * U, L, s * W / 2, 0.7 * U, 0);
  for (let k = 0; k <= Math.round(compr / 4); k++) { const z = -L / 2 + (k * L) / Math.round(compr / 4), c = malha(g, new THREE.TorusGeometry(W / 2, 0.08 * U, 4, 20, Math.PI), M(0xd8dadd, { metalness: 0.4 }), 0, 1.4 * U, z); c.scale.set(1, 0.55, 1); }
  caixa(g, M(0x6f747b), W * 0.6, 1.3 * U, 0.1 * U, 0, 0.65 * U, L / 2);
  return g;
}
KITS.tendaTunel = F("Paddock", { nome: "Tenda arredondada", grupo: "Paddock", montar: () => tendaTunel(16, 9) });
KITS.tendaTunelLonga = F("Paddock", { nome: "Tenda arredondada longa", grupo: "Paddock", montar: () => tendaTunel(36, 10) });
// a mureta de concreto (o "muro de Mônaco") com e sem o alambrado em cima, 10 m
function mureta(comAlambrado) {
  const g = new THREE.Group(), w = 10 * U, h = 1.1 * U, base = M(0xe4e5e2, { roughness: 0.85 });
  caixa(g, base, w, h, 0.6 * U, 0, h / 2, 0); caixa(g, base, w, 0.12 * U, 0.75 * U, 0, h, 0);
  caixa(g, VERMELHO, w, 0.25 * U, 0.02 * U, 0, 0.2 * U, 0.31 * U);
  if (comAlambrado) { const ht = 3.2 * U, tela = new THREE.MeshStandardMaterial({ color: 0x9aa3ab, roughness: 0.5, metalness: 0.4, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
    malha(g, new THREE.PlaneGeometry(w, ht), tela, 0, h + ht / 2, -0.15 * U);
    for (let x = -w / 2; x <= w / 2 + 1; x += 2.5 * U) { cil(g, ESCURO, 0.06 * U, ht, x, h + ht / 2, -0.15 * U, 6); const b = caixa(g, ESCURO, 0.06 * U, 0.06 * U, 0.8 * U, x, h + ht, 0.15 * U); b.rotation.x = -0.6; } }
  return g;
}
KITS.mureta = F("Contenção", { nome: "Mureta de concreto", grupo: "Pista", montar: () => mureta(false) });
KITS.muretaAlambrado = F("Contenção", { nome: "Mureta com alambrado", grupo: "Pista", montar: () => mureta(true) });
// a zebra solta (10 m, vermelha e branca), para enfeitar uma curva de cenário
KITS.zebra = F("Contenção", { nome: "Zebra (10 m)", grupo: "Pista", montar() {
  const g = new THREE.Group(); for (let k = 0; k < 10; k++) caixa(g, k % 2 ? BRANCO : VERMELHO, 1 * U, 0.08 * U, 1.2 * U, (k - 4.5) * U, 0.04 * U, 0); return g; } });
// o bloco de concreto (a barreira New Jersey) de 4 m
KITS.newJersey = F("Contenção", { nome: "Barreira de concreto", grupo: "Pista", montar() {
  const g = new THREE.Group(), s = new THREE.Shape([[-0.3, 0], [0.3, 0], [0.15, 0.25], [0.1, 0.8], [-0.1, 0.8], [-0.15, 0.25]].map(([x, y]) => new THREE.Vector2(x * U, y * U)));
  const geo = new THREE.ExtrudeGeometry(s, { depth: 4 * U, bevelEnabled: false }); geo.translate(0, 0, -2 * U); const m = malha(g, geo, M(0xd9dad6, { roughness: 0.9 })); m.rotation.y = Math.PI / 2; return g; } });
// o prédio dos boxes: as portas de garagem no térreo, o camarote de vidro em cima, a laje saltada e as bandeiras do teto
KITS.predioBoxes = F("Paddock", { nome: "Prédio dos boxes com camarote", grupo: "Paddock", montar() {
  const g = new THREE.Group(), n = 6, mod = 6 * U, w = n * mod, d = 14 * U, h1 = 5 * U, h2 = 4 * U, parede = M(0xeef0f2), porta = M(0x3a3f47, { metalness: 0.3 });
  caixa(g, parede, w, h1, d, 0, h1 / 2, 0);
  for (let i = 0; i < n; i++) { const x = (i - (n - 1) / 2) * mod; caixa(g, porta, mod - 1 * U, h1 - 1 * U, 0.1 * U, x, (h1 - 1 * U) / 2, d / 2 + 0.05 * U); caixa(g, VIDRO, mod - 0.5 * U, h2 - 0.8 * U, 0.1 * U, x, h1 + h2 / 2, d / 2 - 1.95 * U); }
  caixa(g, BRANCO, w + U, 0.4 * U, d + 3 * U, 0, h1 + 0.2 * U, 1.5 * U);
  caixa(g, parede, w, h2, d - 4 * U, 0, h1 + h2 / 2, -2 * U);
  caixa(g, BRANCO, w + 2 * U, 0.5 * U, d + 2 * U, 0, h1 + h2 + 0.25 * U, 0);
  for (let i = 0; i < n * 2; i++) cil(g, GRADIL, 0.04 * U, 1 * U, (i - n + 0.5) * (mod / 2), h1 + 0.9 * U, d / 2 + 2.9 * U, 4);
  caixa(g, GRADIL, w, 0.06 * U, 0.06 * U, 0, h1 + 1.4 * U, d / 2 + 2.9 * U);
  return g; } });
// a árvore de copa larga e chata (as da imagem)
KITS.arvoreCopa = F("Vegetação", { nome: "Árvore de copa larga", grupo: "Natureza", montar() {
  const g = new THREE.Group(), r = sorteio(11); cil(g, TRONCO, 0.3 * U, 4 * U, 0, 2 * U, 0, 6, 0.2 * U);
  for (let k = 0; k < 5; k++) { const c = malha(g, new THREE.IcosahedronGeometry((1.8 + r() * 0.8) * U, 0), k % 2 ? VERDE : VERDE2, (r() - 0.5) * 3 * U, (4.4 + r() * 0.8) * U, (r() - 0.5) * 3 * U); c.scale.y = 0.45; } return g; } });
KITS.gramado = F("Vegetação", { nome: "Gramado (20 × 20 m)", grupo: "Natureza", montar() { const g = new THREE.Group(); const m = malha(g, new THREE.PlaneGeometry(20 * U, 20 * U), M(0x3fa52c, { roughness: 0.95 }), 0, 0.3, 0); m.rotation.x = -Math.PI / 2; return g; } });
KITS.van = F("Automóveis", { nome: "Van", grupo: "Paddock", montar() {
  const g = new THREE.Group(), C = M(0xe9e9e6, { roughness: 0.4 }), V = M(0x1f2a33, { roughness: 0.1, metalness: 0.4 }), P = M(0x1d1f22, { roughness: 0.95 });
  caixa(g, C, 2 * U, 2.1 * U, 5.2 * U, 0, 1.45 * U, 0); caixa(g, V, 1.9 * U, 0.7 * U, 0.1 * U, 0, 1.9 * U, 2.6 * U); for (const s of [-1, 1]) caixa(g, V, 0.05 * U, 0.6 * U, 1.2 * U, s * 1.01 * U, 1.9 * U, 1.7 * U);
  for (const z of [-1.7, 1.7]) for (const s of [-1, 1]) { const r = cil(g, P, 0.36 * U, 0.25 * U, s * 0.9 * U, 0.36 * U, z * U, 12); r.rotation.z = Math.PI / 2; } return g; } });
KITS.carroAmarelo = F("Automóveis", { nome: "Carro amarelo", grupo: "Paddock", montar: () => sedan(0xe0b021) });
// ---------- (2026-11-17, as imagens do Thiago: um kit geral de autódromo) ----------
// barreiras em módulos (pneus coloridos, Tecpro, SAFER, guard-rail triplo, fardos de palha), os prédios do box (garagem, torre de controle,
// prédio dos boxes com terraço), a arquibancada de cobertura em balanço com mastros, as luzes (tripé, poste com bandeira de patrocínio,
// poste solar), o pórtico de treliça com a faixa, a grade com placas de patrocínio, o gazebo, a cabine e o grid da largada.
// Os módulos de barreira têm o comprimento ao longo de x (a Linha de itens os enfileira).
const corM = (c) => M(c, { roughness: 0.7 });
function paredePneus(cor, compr = 4) {
  const g = new THREE.Group(), L = compr * U, h = 0.9 * U, C = corM(cor), borr = M(0x1d1f22, { roughness: 0.95 }), pneu = new THREE.TorusGeometry(0.3 * U, 0.14 * U, 6, 12);
  caixa(g, C, L, h, 1.5 * U, 0, h / 2, 0); const n = Math.floor(L / (0.7 * U));
  for (let i = 0; i < n; i++) for (const s of [-1, 1]) { const t = malha(g, pneu, cor === 0x1d1f22 ? M(0x2a2c30) : C, (i - (n - 1) / 2) * (L / n), h + 0.06 * U, s * 0.36 * U); t.rotation.x = Math.PI / 2; malha(g, new THREE.CircleGeometry(0.17 * U, 10), borr, (i - (n - 1) / 2) * (L / n), h + 0.13 * U, s * 0.36 * U).rotation.x = -Math.PI / 2; }
  return g;
}
for (const [id, nome, cor] of [["pneusVermelho", "vermelhos", 0xd8321e], ["pneusBranco", "brancos", 0xf2f2f0], ["pneusVerde", "verdes", 0x2fae3c], ["pneusAmarelo", "amarelos", 0xf2c230], ["pneusPreto", "pretos", 0x1d1f22]])
  KITS[id] = F("Contenção", { nome: `Parede de pneus ${nome}`, grupo: "Pista", montar: () => paredePneus(cor) });
KITS.tecproModulo = F("Contenção", { nome: "Tecpro (módulos)", grupo: "Pista", montar() {
  const g = new THREE.Group(), cinza = M(0xc9cdd2, { roughness: 0.8 }), verm = M(0xd62828, { roughness: 0.7 });
  for (let i = 0; i < 4; i++) { const x = (i - 1.5) * 1.25 * U; for (let k = 0; k < 2; k++) caixa(g, cinza, 1.2 * U, 0.55 * U, 1.1 * U, x, 0.28 * U + k * 0.56 * U, 0); if (i % 2) for (let k = 0; k < 2; k++) caixa(g, verm, 1.1 * U, 0.3 * U, 0.6 * U, x, 1.27 * U + k * 0.31 * U, 0.25 * U); }
  return g; } });
KITS.safer = F("Contenção", { nome: "Muro SAFER", grupo: "Pista", montar() {
  const g = new THREE.Group(), C = M(0xe7e8e6, { roughness: 0.85 }), L = 8 * U; caixa(g, C, L, 1.2 * U, 0.5 * U, 0, 0.6 * U, 0); for (let k = 0; k < 4; k++) caixa(g, M(0xbfc2c4), L, 0.04 * U, 0.52 * U, 0, (0.2 + k * 0.25) * U, 0);
  for (let i = 0; i < 8; i++) caixa(g, C, 0.25 * U, 0.35 * U, 0.6 * U, (i - 3.5) * U, 1.37 * U, 0); return g; } });
KITS.guardrailTriplo = F("Contenção", { nome: "Guard-rail triplo", grupo: "Pista", montar() {
  const g = new THREE.Group(), w = 8 * U, aco = M(0xc7ccd1, { metalness: 0.6, roughness: 0.35 }); for (const y of [0.5, 0.85, 1.2]) caixa(g, aco, w, 0.3 * U, 0.1 * U, 0, y * U, 0.15 * U);
  for (let x = -w / 2; x <= w / 2; x += 2 * U) caixa(g, ESCURO, 0.14 * U, 1.4 * U, 0.14 * U, x, 0.7 * U, -0.05 * U); return g; } });
KITS.fardos = F("Contenção", { nome: "Fardos de palha", grupo: "Pista", montar() { const g = new THREE.Group(), P = M(0xc8a25a, { roughness: 1 }); for (const x of [-0.65, 0.65]) caixa(g, P, 1.2 * U, 0.6 * U, 0.6 * U, x * U, 0.3 * U, 0); return g; } });
KITS.muroConcretoTela = F("Contenção", { nome: "Muro de concreto com tela alta", grupo: "Pista", montar() {
  const g = new THREE.Group(), w = 6 * U, C = M(0xdfe0dc, { roughness: 0.9 }); caixa(g, C, w, 1.2 * U, 0.5 * U, 0, 0.6 * U, 0); caixa(g, M(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.3 }), w, 0.06 * U, 0.52 * U, 0, 1.2 * U, 0);
  const ht = 3 * U, tela = new THREE.MeshStandardMaterial({ color: 0x3a3f46, roughness: 0.5, metalness: 0.4, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false });
  malha(g, new THREE.PlaneGeometry(w, ht), tela, 0, 1.2 * U + ht / 2, 0); for (const x of [-w / 2, w / 2]) cil(g, ESCURO, 0.06 * U, ht, x, 1.2 * U + ht / 2, 0, 6); return g; } });
// os prédios do box
const PAREDE_BOX = M(0xeeeeec, { roughness: 0.8 }), PORTA_BOX = M(0xd8321e, { roughness: 0.6 });
function portaGaragem(g, x, z, w, h) { caixa(g, PORTA_BOX, w, h, 0.1 * U, x, h / 2, z); for (let k = 0; k < 4; k++) caixa(g, M(0x1d1f22), w * 0.12, 0.25 * U, 0.12 * U, x + (k - 1.5) * w * 0.22, h * 0.7, z); }
KITS.garagemBox = F("Paddock", { nome: "Garagem do box", grupo: "Paddock", montar() {
  const g = new THREE.Group(), w = 9 * U, d = 12 * U, h = 5 * U; caixa(g, PAREDE_BOX, w, h, d, 0, h / 2, 0); caixa(g, M(0xdadbd8), w + 0.4 * U, 0.4 * U, d + 0.4 * U, 0, h + 0.2 * U, 0); portaGaragem(g, 0, d / 2 + 0.05 * U, w * 0.75, h * 0.7); return g; } });
KITS.torreBox = F("Paddock", { nome: "Torre de controle do box", grupo: "Paddock", montar() {
  const g = new THREE.Group(), w = 24 * U, d = 14 * U, h1 = 5 * U, h2 = 11 * U, V = M(0x1f2a33, { roughness: 0.15, metalness: 0.4 }), R = M(0xd8321e);
  caixa(g, PAREDE_BOX, w, h1 + h2, d, 0, (h1 + h2) / 2, 0); for (let i = 0; i < 3; i++) portaGaragem(g, (i - 1.5) * 5 * U, d / 2 + 0.05 * U, 4 * U, 3.5 * U);
  for (const x of [-w / 2 + 4.5 * U, w / 2 - 3.5 * U]) { caixa(g, R, (x < 0 ? 8 : 6) * U, h2 - U, 0.2 * U, x, h1 + h2 / 2, d / 2 + 0.1 * U); caixa(g, V, (x < 0 ? 7.4 : 5.4) * U, h2 - 1.6 * U, 0.25 * U, x, h1 + h2 / 2, d / 2 + 0.12 * U);
    for (let k = 1; k < 4; k++) caixa(g, R, (x < 0 ? 7.4 : 5.4) * U, 0.15 * U, 0.3 * U, x, h1 + 0.5 * U + k * (h2 - U) / 4, d / 2 + 0.14 * U); }
  for (const x of [-1.2, 1.2]) caixa(g, V, 2 * U, 2 * U, 0.25 * U, x * U + 1 * U, h1 + h2 - 3 * U, d / 2 + 0.12 * U);
  caixa(g, M(0xd9dadb), w + 0.5 * U, 0.4 * U, d + 0.5 * U, 0, h1 + h2 + 0.2 * U, 0); for (let i = 0; i < 6; i++) caixa(g, M(0xa9adb2, { metalness: 0.4 }), 1.5 * U, 1 * U, 1 * U, (i - 2.5) * 3 * U, h1 + h2 + 0.9 * U, -2 * U);
  return g; } });
KITS.predioBoxesTerraco = F("Paddock", { nome: "Prédio dos boxes com terraço", grupo: "Paddock", montar() {
  const g = new THREE.Group(), n = 8, mod = 5 * U, w = n * mod, d = 12 * U, h1 = 4 * U, h2 = 4 * U, V = M(0x1f2a33, { roughness: 0.15, metalness: 0.4 });
  caixa(g, PAREDE_BOX, w, h1, d, 0, h1 / 2, 0); for (let i = 0; i < n; i++) caixa(g, PORTA_BOX, mod * 0.8, 0.9 * U, 0.12 * U, (i - (n - 1) / 2) * mod, h1 - 0.8 * U, d / 2 + 0.06 * U);
  caixa(g, PAREDE_BOX, w, h2, d * 0.6, 0, h1 + h2 / 2, -d * 0.2); caixa(g, V, w - U, h2 * 0.7, 0.2 * U, 0, h1 + h2 / 2, d * 0.1 + 0.1 * U); caixa(g, PORTA_BOX, 4 * U, h1 + h2, d, -w / 2 + 2 * U, (h1 + h2) / 2, 0.01 * U);
  const teto = caixa(g, M(0xb4b7bb, { metalness: 0.3 }), w + 2 * U, 0.3 * U, d + 3 * U, 0, h1 + h2 + 0.8 * U, 1 * U); teto.rotation.x = 0.06;
  for (let i = 0; i <= n; i += 2) cil(g, ESCURO, 0.15 * U, h2 + 0.8 * U, (i - n / 2) * mod, h1 + (h2 + 0.8 * U) / 2, d / 2 + 1.5 * U, 6);
  caixa(g, GRADIL, w, 0.06 * U, 0.06 * U, 0, h1 + 1.1 * U, d / 2 + 0.3 * U); return g; } });
// a arquibancada de cobertura em balanço: dois lances de cadeiras brancas com as escadas azuis, a cobertura presa por mastros e cabos
KITS.arqCobertaMastros = F("Arquibancadas", { nome: "Arquibancada coberta com mastros", grupo: "Público", montar() {
  const g = arquibancadaCadeiras({ largura: 36, fileiras: 14, base: 2, pilares: false, cor: M(0xf2f2f0, { roughness: 0.6 }) }), w = 36 * U, prof = 14 * 0.85 * U, topo = g.userData.yTopo + 4 * U;
  for (const x of [-w / 3, 0, w / 3]) caixa(g, M(0x6fa8dc), 1.2 * U, 0.1 * U, prof, x, g.userData.yTopo / 2 + 0.5 * U, -prof / 2).rotation.x = Math.atan2(14 * 0.45, 14 * 0.85);
  caixa(g, CONCRETO, w, topo, 0.6 * U, 0, topo / 2, -prof - 0.3 * U);
  const cob = caixa(g, M(0xc4c7ca, { metalness: 0.3 }), w + U, 0.35 * U, prof + 3 * U, 0, topo, -prof / 2 + 1.5 * U); cob.rotation.x = 0.07;
  for (const x of [-w / 2, -w / 6, w / 6, w / 2]) { cil(g, GRADIL, 0.15 * U, 6 * U, x, topo + 3 * U, -prof, 6); for (const z of [-prof * 0.1, -prof - 2 * U]) { const a = new THREE.Vector3(x, topo + 6 * U, -prof), b = new THREE.Vector3(x, topo, z), l = a.distanceTo(b); const c = cil(g, ESCURO, 0.03 * U, l, x, (a.y + b.y) / 2, (a.z + b.z) / 2, 4); c.rotation.x = Math.atan2(b.z - a.z, a.y - b.y); } }
  return g; } });
KITS.arqDuasCamadas = F("Arquibancadas", { nome: "Arquibancada de dois andares", grupo: "Público", montar() {
  const g = new THREE.Group(), baixo = arquibancadaCadeiras({ largura: 30, fileiras: 8, base: 1, pilares: false, cor: M(0x3346c8, { roughness: 0.6 }) }), cima = arquibancadaCadeiras({ largura: 30, fileiras: 10, base: 0, pilares: false, cor: M(0xf2f2f0, { roughness: 0.6 }) });
  g.add(baixo); cima.position.set(0, baixo.userData.yTopo + 3 * U, -8 * 0.85 * U - 2 * U); g.add(cima);
  caixa(g, CONCRETO, 30 * U, baixo.userData.yTopo + 3 * U, 2 * U, 0, (baixo.userData.yTopo + 3 * U) / 2, -8 * 0.85 * U - U);
  const ct = cima.position.y + cima.userData.yTopo + 3 * U; caixa(g, M(0x3a3d42), 31 * U, 0.4 * U, 12 * U, 0, ct, cima.position.z - 3 * U); for (const x of [-15, 0, 15]) cil(g, ESCURO, 0.2 * U, ct - cima.position.y, x * U, cima.position.y + (ct - cima.position.y) / 2, cima.position.z - 10 * 0.85 * U, 8);
  return g; } });
// as luzes
const POSTE = M(0x3a3e44, { metalness: 0.5, roughness: 0.45 }), REFL = new THREE.MeshStandardMaterial({ color: 0xf4f6e8, emissive: 0xfff6d0, emissiveIntensity: 0.9 });
function tripe(g, h) { for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2, p = cil(g, POSTE, 0.06 * U, 2.6 * U, Math.cos(a) * 0.9 * U, 1.1 * U, Math.sin(a) * 0.9 * U, 5); p.rotation.set(Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4); } cil(g, POSTE, 0.1 * U, h, 0, h / 2, 0, 8); }
function refletor(g, x, y, z) { caixa(g, POSTE, 1.2 * U, 0.9 * U, 0.3 * U, x, y, z); caixa(g, REFL, 1 * U, 0.7 * U, 0.05 * U, x, y, z + 0.16 * U); }
KITS.luzTripe = F("Geral", { nome: "Refletor no tripé", grupo: "Pista", montar() { const g = new THREE.Group(), h = 6 * U; tripe(g, h); refletor(g, 0, h + 0.4 * U, 0); return g; } });
KITS.luzTripe4 = F("Geral", { nome: "Torre de 4 refletores", grupo: "Pista", montar() { const g = new THREE.Group(), h = 7 * U; tripe(g, h); caixa(g, POSTE, 2.4 * U, 0.12 * U, 0.12 * U, 0, h, 0); for (const x of [-0.75, 0.75]) for (const y of [0.1, 1.1]) refletor(g, x * U, h + y * U, 0.1 * U); return g; } });
KITS.posteSolar = F("Geral", { nome: "Poste solar", grupo: "Pista", montar() { const g = new THREE.Group(), h = 8 * U; cil(g, POSTE, 0.12 * U, h, 0, h / 2, 0, 8); const p = caixa(g, M(0x22324a, { metalness: 0.5, roughness: 0.2 }), 0.8 * U, 0.08 * U, 3.5 * U, 0, h + 0.3 * U, 1.2 * U); p.rotation.x = -0.15; return g; } });
const texBandeira = (marca) => texCanvas("bandeira-" + marca, 128, 256, (x, w, hh) => { x.fillStyle = "#f4f4f2"; x.fillRect(0, 0, w, hh); x.save(); x.translate(w / 2, hh / 2); x.rotate(-Math.PI / 2); x.translate(-w / 2, -hh / 2); patrocinioEm(x, marca, w / 2, hh / 2, hh * 0.9, w * 0.8); x.restore(); });
function posteBandeira(marca) {
  const g = new THREE.Group(), h = 7 * U; cil(g, POSTE, 0.14 * U, h, 0, h / 2, 0, 8, 0.1 * U); const b = caixa(g, POSTE, 0.08 * U, 0.08 * U, 2 * U, 0, h - 0.2 * U, 1 * U); b.rotation.x = -0.25;
  malha(g, new THREE.SphereGeometry(0.5 * U, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), POSTE, 0, h - 0.6 * U, 2 * U); malha(g, new THREE.SphereGeometry(0.42 * U, 12, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M(0xf6e7c0, { emissive: 0xffe9b0, emissiveIntensity: 0.7 }), 0, h - 0.6 * U, 2 * U);
  if (marca) { const t = texBandeira(marca); malha(g, new THREE.BoxGeometry(1.1 * U, 2.4 * U, 0.04 * U), [POSTE, POSTE, POSTE, POSTE, new THREE.MeshStandardMaterial({ map: t }), new THREE.MeshStandardMaterial({ map: t })], 0, h * 0.5, 0.65 * U).rotation.y = Math.PI / 2; }
  return g;
}
KITS.posteLampiao = F("Geral", { nome: "Poste de lampião", grupo: "Pista", montar: () => posteBandeira(null) });
for (const [id, marca] of [["posteBandeiraPneus", "pneus"], ["posteBandeiraEnergia", "energia"], ["posteBandeiraGalera", "galera"], ["posteBandeiraVila", "vila"]])
  KITS[id] = F("Geral", { nome: "Poste com bandeira (" + marca + ")", grupo: "Pista", montar: () => posteBandeira(marca) });
// o pórtico de treliça com a faixa "seu patrocínio aqui" e a grade com placas
const texFaixa = (marca) => texCanvas("faixa-" + marca, 512, 64, (x, w, hh) => { const gr = x.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, "#111"); gr.addColorStop(0.5, "#2a2a2a"); gr.addColorStop(1, "#111"); x.fillStyle = gr; x.fillRect(0, 0, w, hh); patrocinioEm(x, marca, w / 2, hh / 2, w * 0.6, hh * 0.8); });
function trelica(g, x, h) { for (const dx of [-0.4, 0.4]) for (const dz of [-0.4, 0.4]) cil(g, GRADIL, 0.05 * U, h, x + dx * U, h / 2, dz * U, 5); for (let y = 0; y < h; y += 1.2 * U) caixa(g, GRADIL, 0.9 * U, 0.05 * U, 0.9 * U, x, y, 0); }
KITS.porticoTrelica = F("Geral", { nome: "Pórtico de treliça com faixa", grupo: "Pista", montar() {
  const g = new THREE.Group(), w = 16 * U, h = 5 * U; trelica(g, -w / 2, h); trelica(g, w / 2, h); caixa(g, GRADIL, w + U, 0.9 * U, 0.9 * U, 0, h + 0.45 * U, 0);
  const t = texFaixa("galera"); malha(g, new THREE.BoxGeometry(w * 0.9, 1.4 * U, 0.1 * U), [POSTE, POSTE, POSTE, POSTE, new THREE.MeshStandardMaterial({ map: t }), new THREE.MeshStandardMaterial({ map: t })], 0, h - 0.8 * U, 0.5 * U); return g; } });
KITS.gradePlacas = F("Contenção", { nome: "Grade com placa de patrocínio", grupo: "Pista", montar() {
  const g = new THREE.Group(), w = 6 * U, h = 1.1 * U; for (const x of [-w / 2, 0, w / 2]) cil(g, GRADIL, 0.04 * U, h, x, h / 2, 0, 5); caixa(g, GRADIL, w, 0.05 * U, 0.05 * U, 0, h, 0);
  const t = texFaixa("pneus"); malha(g, new THREE.BoxGeometry(w, 0.8 * U, 0.04 * U), [POSTE, POSTE, POSTE, POSTE, new THREE.MeshStandardMaterial({ map: t }), new THREE.MeshStandardMaterial({ map: t })], 0, 0.6 * U, 0.05 * U); return g; } });
KITS.gazebo = F("Paddock", { nome: "Gazebo branco", grupo: "Paddock", montar() {
  const g = new THREE.Group(), w = 3 * U, h = 2.2 * U, L = M(0xfafaf8, { side: THREE.DoubleSide }); for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) cil(g, GRADIL, 0.04 * U, h, x * w / 2, h / 2, z * w / 2, 5);
  const t = malha(g, new THREE.ConeGeometry(w * 0.72, 1.2 * U, 4, 1, true), L, 0, h + 0.6 * U, 0); t.rotation.y = Math.PI / 4; for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2, b = caixa(g, L, w, 0.3 * U, 0.03 * U, Math.sin(a) * w / 2, h - 0.15 * U, Math.cos(a) * w / 2); b.rotation.y = a; } return g; } });
KITS.cabineBranca = F("Geral", { nome: "Cabine de bandeirinha", grupo: "Pista", montar() { const g = new THREE.Group(); caixa(g, BRANCO, 1.4 * U, 2.2 * U, 1.2 * U, 0, 1.1 * U, 0); caixa(g, M(0x1d1f22), 1.1 * U, 1.3 * U, 0.05 * U, 0, 1.2 * U, 0.6 * U); for (const [k, c] of [0xd62828, 0xf2c230, 0x2fae3c].entries()) caixa(g, M(c), 0.2 * U, 0.6 * U, 0.04 * U, (k - 1) * 0.3 * U, 1.2 * U, 0.62 * U); return g; } });
KITS.gridLargada = F("Geral", { nome: "Posições do grid (2)", grupo: "Pista", montar() {
  const g = new THREE.Group(), t = texCanvas("grid", 128, 256, (x, w, hh) => { x.clearRect(0, 0, w, hh); x.strokeStyle = "#f4f4f2"; x.lineWidth = 8; x.beginPath(); x.moveTo(8, 60); x.lineTo(8, 8); x.lineTo(w - 8, 8); x.lineTo(w - 8, 60); x.stroke(); });
  const m = new THREE.MeshStandardMaterial({ map: t, transparent: true, polygonOffset: true, polygonOffsetFactor: -2 }); for (const [x, z] of [[-1, 0], [1, -1.6]]) { const p = malha(g, new THREE.PlaneGeometry(2.4 * U, 4.8 * U), m, x * 2.2 * U, 0.08 * U, z * 4.8 * U); p.rotation.x = -Math.PI / 2; } return g; } });
// ---------- (2026-11-17, as imagens do Thiago: o pacote de vegetação, o prédio da reta e o kit do GP do México) ----------
// VEGETAÇÃO low poly "realista": tronco com galhos, copa em vários blocos facetados de verdes variados (cada árvore com o seu sorteio),
// arbustos de tamanhos e flores diferentes, tufos de capim e forrações com flor.
const VERDES = [0x4d6b2a, 0x5f7f34, 0x6f8f3a, 0x3f5d24, 0x7a9a44].map((c) => M(c, { flatShading: true, roughness: 0.9 })), CASCA = M(0x6a5a48, { flatShading: true, roughness: 1 });
function galho(g, x0, y0, z0, x1, y1, z1, r) { const a = new THREE.Vector3(x0, y0, z0), b = new THREE.Vector3(x1, y1, z1), l = a.distanceTo(b), m = cil(g, CASCA, r, l, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, 5, r * 0.6); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); return m; }
// uma árvore folhosa: altura do tronco, raio e forma da copa (achatada, redonda, alta), quantos blocos, a semente
function folhosa({ tronco = 4, copa = 3, alta = 1, larga = 1, blocos = 9, semente = 1 }) {
  const g = new THREE.Group(), r = sorteio(semente), T = tronco * U, R = copa * U;
  galho(g, 0, 0, 0, 0, T, 0, 0.28 * U);
  for (let k = 0; k < 3; k++) { const a = r() * Math.PI * 2; galho(g, 0, T * (0.55 + r() * 0.3), 0, Math.cos(a) * R * 0.6 * larga, T + R * 0.3, Math.sin(a) * R * 0.6 * larga, 0.12 * U); }
  for (let k = 0; k < blocos; k++) { const a = r() * Math.PI * 2, d = r() * R * 0.75 * larga, s = (0.45 + r() * 0.35) * R;
    const b = malha(g, new THREE.IcosahedronGeometry(s, 1), VERDES[Math.floor(r() * VERDES.length)], Math.cos(a) * d, T + R * 0.35 + (r() - 0.3) * R * 0.9 * alta, Math.sin(a) * d); b.scale.set(1, 0.75 * alta, 1); b.rotation.set(r(), r(), r()); }
  return g;
}
const ARVORES = [["Árvore folhosa pequena", { tronco: 3, copa: 2.2, blocos: 7, semente: 3 }], ["Árvore de copa redonda", { tronco: 3.5, copa: 3.4, blocos: 10, semente: 5 }], ["Árvore folhosa alta", { tronco: 5, copa: 2.8, alta: 1.5, blocos: 10, semente: 8 }],
  ["Árvore de copa aberta", { tronco: 4.5, copa: 3.6, larga: 1.4, alta: 0.8, blocos: 11, semente: 13 }], ["Árvore grande", { tronco: 6, copa: 4.2, alta: 1.2, blocos: 13, semente: 21 }], ["Árvore de copa rala", { tronco: 5.5, copa: 3.2, larga: 1.2, blocos: 8, semente: 34 }]];
ARVORES.forEach(([nome, o], i) => { KITS["arvoreReal" + (i + 1)] = F("Vegetação", { nome, grupo: "Natureza", montar: () => folhosa(o) }); });
KITS.coqueiro = F("Vegetação", { nome: "Coqueiro", grupo: "Natureza", montar() {
  const g = new THREE.Group(), h = 11 * U; let x = 0; for (let k = 0; k < 5; k++) { const x1 = x + 0.25 * U; galho(g, x, (k * h) / 5, 0, x1, ((k + 1) * h) / 5, 0, (0.3 - k * 0.03) * U); x = x1; }
  const folha = M(0x5d8a2e, { flatShading: true, side: THREE.DoubleSide });
  for (let k = 0; k < 11; k++) { const a = (k / 11) * Math.PI * 2, f = malha(g, new THREE.PlaneGeometry(1 * U, 4.6 * U, 1, 4), folha, x, h, 0); const p = f.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const v = (p.getY(i) + 2.3 * U) / (4.6 * U); p.setZ(i, -v * v * 1.6 * U); p.setX(i, p.getX(i) * (1 - v * 0.7)); } f.geometry.translate(0, 2.3 * U, 0); f.geometry.computeVertexNormals(); f.rotation.set(-1.1, a, 0, "YXZ"); }
  return g; } });
function arbusto(cor, flor, tam, semente) {
  const g = new THREE.Group(), r = sorteio(semente), M1 = M(cor, { flatShading: true, roughness: 0.95 });
  for (let k = 0; k < 6; k++) { const s = (0.4 + r() * 0.35) * tam * U, b = malha(g, new THREE.IcosahedronGeometry(s, 1), k % 2 ? M1 : VERDES[k % 5], (r() - 0.5) * tam * U, s * 0.8, (r() - 0.5) * tam * U); b.scale.y = 0.8; }
  if (flor) { const F1 = M(flor, { roughness: 0.6 }); for (let k = 0; k < 18; k++) { const a = r() * Math.PI * 2, e = r() * 1.2; malha(g, new THREE.IcosahedronGeometry(0.09 * tam * U, 0), F1, Math.cos(a) * Math.cos(e) * tam * 0.55 * U, (0.5 + Math.sin(e) * 0.5) * tam * U, Math.sin(a) * Math.cos(e) * tam * 0.55 * U); } }
  return g;
}
for (const [id, nome, cor, flor, tam, s] of [["arbustoPequeno", "Arbusto pequeno", 0x55752e, null, 0.9, 2], ["arbustoMedio", "Arbusto médio", 0x4a6a28, null, 1.4, 4], ["arbustoGrande", "Arbusto grande", 0x3f5f24, null, 2.2, 6], ["arbustoRosa", "Arbusto com flor rosa", 0x5a6f30, 0xd98aa0, 1.3, 9], ["arbustoBranco", "Arbusto com flor branca", 0x55752e, 0xf2f0e6, 1.2, 11]])
  KITS[id] = F("Vegetação", { nome, grupo: "Natureza", montar: () => arbusto(cor, flor, tam, s) });
function capim(alto, n, cor, espiga, semente) {
  const g = new THREE.Group(), r = sorteio(semente), C = M(cor, { flatShading: true, side: THREE.DoubleSide, roughness: 1 });
  for (let k = 0; k < n; k++) { const h = (0.6 + r() * 0.5) * alto * U, f = malha(g, new THREE.ConeGeometry(0.06 * U, h, 3), C, (r() - 0.5) * 0.7 * U, h / 2, (r() - 0.5) * 0.7 * U); f.rotation.set((r() - 0.5) * 0.6, r() * 3, (r() - 0.5) * 0.6);
    if (espiga && r() < 0.35) malha(g, new THREE.CylinderGeometry(0.05 * U, 0.03 * U, 0.35 * U, 4), M(0xc9b77a), f.position.x * 1.3, h + 0.1 * U, f.position.z * 1.3); }
  return g;
}
KITS.capimBaixo = F("Vegetação", { nome: "Tufo de capim", grupo: "Natureza", montar: () => capim(0.6, 16, 0x7d9a44, false, 3) });
KITS.capimAlto = F("Vegetação", { nome: "Capim alto", grupo: "Natureza", montar: () => capim(1.3, 22, 0x8aa04c, true, 5) });
KITS.capimSeco = F("Vegetação", { nome: "Capim seco", grupo: "Natureza", montar: () => capim(1, 20, 0xa8a05a, true, 7) });
function forracao(flor, semente) {
  const g = new THREE.Group(), r = sorteio(semente), FO = M(0x4f7a2e, { flatShading: true, side: THREE.DoubleSide });
  for (let k = 0; k < 14; k++) { const f = malha(g, new THREE.CircleGeometry(0.3 * U, 5), FO, (r() - 0.5) * 2 * U, 0.15 * U + r() * 0.2 * U, (r() - 0.5) * 2 * U); f.rotation.set(-Math.PI / 2 + (r() - 0.5) * 0.8, 0, r() * 3); }
  if (flor) { const FL = M(flor, { roughness: 0.6 }); for (let k = 0; k < 12; k++) { const x = (r() - 0.5) * 1.8 * U, z = (r() - 0.5) * 1.8 * U, h = (0.3 + r() * 0.4) * U; cil(g, FO, 0.015 * U, h, x, h / 2, z, 3); malha(g, new THREE.IcosahedronGeometry(0.07 * U, 0), FL, x, h, z); } }
  return g;
}
KITS.forracaoVerde = F("Vegetação", { nome: "Forração verde", grupo: "Natureza", montar: () => forracao(null, 2) });
KITS.forracaoBranca = F("Vegetação", { nome: "Flores brancas", grupo: "Natureza", montar: () => forracao(0xf4f2ea, 4) });
KITS.forracaoRoxa = F("Vegetação", { nome: "Flores roxas", grupo: "Natureza", montar: () => forracao(0xb45cc8, 6) });
KITS.forracaoAmarela = F("Vegetação", { nome: "Flores amarelas", grupo: "Natureza", montar: () => forracao(0xf0c52a, 8) });
KITS.vasoPlanta = F("Vegetação", { nome: "Vaso com planta", grupo: "Natureza", montar() { const g = new THREE.Group(); caixa(g, M(0xf2f2f0), 0.8 * U, 0.8 * U, 0.8 * U, 0, 0.4 * U, 0); const p = capim(1.1, 14, 0x3f7a2e, false, 12); p.position.y = 0.8 * U; g.add(p); return g; } });

// O PRÉDIO DA RETA (a imagem do México): dois andares de arquibancada coberta na frente, os camarotes de vidro atrás de cada andar,
// a faixa de patrocínio na frente de cada laje, o telhado de terracota com as casas de máquinas
KITS.predioReta = F("Arquibancadas", { nome: "Prédio da reta (2 andares)", grupo: "Público", montar() {
  const g = new THREE.Group(), w = 60 * U, prof = 16 * U, andar = 6 * U, V = M(0x1f2a33, { roughness: 0.15, metalness: 0.4 }), PAR = M(0xd6d4cc, { roughness: 0.85 }), t = texFaixa("galera");
  const faixa = (y, z) => malha(g, new THREE.BoxGeometry(w, 0.9 * U, 0.1 * U), [ESCURO, ESCURO, ESCURO, ESCURO, new THREE.MeshStandardMaterial({ map: t }), new THREE.MeshStandardMaterial({ map: t })], 0, y, z);
  for (let a = 0; a < 2; a++) { const y0 = a * andar * 1.15, z0 = -a * 2 * U;
    const ar = arquibancadaCadeiras({ largura: 60, fileiras: 5, base: 0, pilares: false, cor: M(0x3a3f47, { roughness: 0.6 }) }); ar.position.set(0, y0 + 1.2 * U, z0); g.add(ar);
    faixa(y0 + 0.9 * U, z0 + 0.6 * U); caixa(g, V, w, andar * 0.55, 0.2 * U, 0, y0 + andar * 0.75 + 1.2 * U, z0 - 5 * 0.85 * U - 0.5 * U);
    caixa(g, PAR, w + U, 0.4 * U, prof, 0, y0 + andar + 1.4 * U, z0 - prof / 2 + 2 * U); }
  caixa(g, PAR, w, andar * 2.4, prof * 0.5, 0, andar * 1.2, -prof * 0.75); caixa(g, PAR, U, andar * 2.4, prof + 2 * U, -w / 2, andar * 1.2, -prof / 2 + U); caixa(g, PAR, U, andar * 2.4, prof + 2 * U, w / 2, andar * 1.2, -prof / 2 + U);
  caixa(g, M(0x9a5a3a, { roughness: 0.9 }), w + 2 * U, 0.5 * U, prof + 4 * U, 0, andar * 2.4 + 0.25 * U, -prof / 2);
  for (const x of [-20, 0, 20]) caixa(g, PAR, 6 * U, 2.4 * U, 4 * U, x * U, andar * 2.4 + 1.5 * U, -prof / 2);
  return g; } });

// O KIT DO GP DO MÉXICO: o padrão verde e vermelho (losangos e degraus), as faixas, a lona tensionada e as peças de pátio
const texMex = () => texCanvas("mexicano", 256, 64, (x, w, hh) => { x.fillStyle = "#0f5f3a"; x.fillRect(0, 0, w, hh); const cs = ["#c8202f", "#1d8a4f", "#0a3d26", "#e8e3d6"];
  for (let i = 0; i < 16; i++) { const cx = i * 16 + 8; x.fillStyle = cs[i % 4]; x.beginPath(); x.moveTo(cx, 8); x.lineTo(cx + 8, 32); x.lineTo(cx, 56); x.lineTo(cx - 8, 32); x.fill(); x.fillStyle = cs[(i + 2) % 4]; x.fillRect(cx - 3, 28, 6, 8); } });
const texFaixaMex = (marca) => texCanvas("faixa-mex-" + marca, 512, 64, (x, w, hh) => { x.fillStyle = "#16181c"; x.fillRect(0, 0, w, hh); const m = texMex().image; x.drawImage(m, 0, 0, 96, 64); x.drawImage(m, w - 96, 0, 96, 64); x.fillStyle = "#c8202f"; x.fillRect(w - 150, 0, 54, hh); patrocinioEm(x, marca, w / 2, hh / 2, w * 0.5, hh * 0.75); });
const matFaixa = (marca) => { const t = texFaixaMex(marca), m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.7 }); return [ESCURO, ESCURO, ESCURO, ESCURO, m, m]; };
// a lona tensionada: picos em fileira sobre uma grelha de mastros (o toldo de "tenda pagode")
function lonaPicos(g, w, d, y, n, alt) { const L = M(0xf4f3ef, { side: THREE.DoubleSide, roughness: 0.7 }); for (let i = 0; i < n; i++) { const c = malha(g, new THREE.ConeGeometry(Math.hypot(w / n, d) / 2, alt, 4, 1, true), L, -w / 2 + (i + 0.5) * (w / n), y + alt / 2, 0); c.rotation.y = Math.PI / 4; c.scale.set((w / n) / Math.hypot(w / n, d) * 1.414, 1, d / Math.hypot(w / n, d) * 1.414); } }
KITS.arqLonaMex = F("Arquibancadas", { nome: "Arquibancada com lona (México)", grupo: "Público", montar() {
  const g = arquibancadaCadeiras({ largura: 40, fileiras: 12, base: 3, pilares: false, cor: M(0x2a3a4a, { roughness: 0.6 }) }), w = 40 * U, prof = 12 * 0.85 * U, topo = g.userData.yTopo + 4 * U;
  malha(g, new THREE.BoxGeometry(w, 3 * U, 0.15 * U), matFaixa("galera"), 0, 1.5 * U, 0.6 * U);
  for (const x of [-w / 2, -w / 4, 0, w / 4, w / 2]) cil(g, GRADIL, 0.2 * U, topo, x, topo / 2, -prof - 0.3 * U, 8);
  const lona = new THREE.Group(); lonaPicos(lona, w, prof + 3 * U, 0, 6, 2.2 * U); lona.position.set(0, topo, -prof / 2 + 1 * U); lona.rotation.x = 0.08; g.add(lona);
  return g; } });
KITS.camaroteMex = F("Paddock", { nome: "Camarote de 2 andares com toldo", grupo: "Paddock", montar() {
  const g = new THREE.Group(), w = 16 * U, d = 10 * U, h = 4 * U, V = new THREE.MeshStandardMaterial({ color: 0x9fc4d4, roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.35 });
  caixa(g, ESCURO, w, h, d, 0, h / 2, 0); malha(g, new THREE.BoxGeometry(w + 0.1 * U, h * 0.8, d + 0.1 * U), matFaixa("galera"), 0, h * 1.25, 0);
  caixa(g, M(0xdedcd6), w, 0.3 * U, d, 0, h * 1.65, 0); for (const z of [-1, 1]) caixa(g, V, w, 1.1 * U, 0.05 * U, 0, h * 1.65 + 0.7 * U, z * d / 2);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) cil(g, GRADIL, 0.1 * U, 3.4 * U, x * w / 2, h * 1.65 + 1.7 * U, z * d / 2, 6);
  const t = malha(g, new THREE.ConeGeometry(Math.hypot(w, d) / 2 * 1.05, 2.4 * U, 4, 1, true), M(0xf4f3ef, { side: THREE.DoubleSide }), 0, h * 1.65 + 4.6 * U, 0); t.rotation.y = Math.PI / 4; t.scale.set(w / Math.hypot(w, d) * 1.414, 1, d / Math.hypot(w, d) * 1.414);
  for (const x of [-0.3, 0.2]) { cil(g, GRADIL, 0.04 * U, 2 * U, x * w, h * 1.65 + U, 0, 4); malha(g, new THREE.ConeGeometry(1.2 * U, 0.5 * U, 8), BRANCO, x * w, h * 1.65 + 2.1 * U, 0); }
  return g; } });
KITS.porticoMex = F("Geral", { nome: "Pórtico de treliça (México)", grupo: "Pista", montar() {
  const g = new THREE.Group(), w = 18 * U, h = 6 * U; trelica(g, -w / 2, h); trelica(g, w / 2, h); caixa(g, GRADIL, w + U, 0.9 * U, 0.9 * U, 0, h + 0.45 * U, 0);
  malha(g, new THREE.BoxGeometry(w * 0.95, 2 * U, 0.12 * U), matFaixa("galera"), 0, h - 1 * U, 0.5 * U); for (const x of [-w / 2, w / 2]) malha(g, new THREE.BoxGeometry(1.1 * U, h * 0.8, 1.1 * U), new THREE.MeshStandardMaterial({ map: texMex() }), x, h * 0.45, 0); return g; } });
KITS.tendaPagode = F("Paddock", { nome: "Tenda pagode (5 picos)", grupo: "Paddock", montar() {
  const g = new THREE.Group(), w = 25 * U, d = 5 * U, h = 2.8 * U, L = M(0xf4f3ef, { side: THREE.DoubleSide });
  for (let i = 0; i <= 5; i++) for (const z of [-1, 1]) cil(g, GRADIL, 0.07 * U, h, -w / 2 + (i * w) / 5, h / 2, z * d / 2, 5);
  caixa(g, L, w, 1.6 * U, 0.05 * U, 0, h * 0.75, -d / 2); for (const x of [-1, 1]) caixa(g, L, 0.05 * U, 1.6 * U, d, x * w / 2, h * 0.75, 0); lonaPicos(g, w, d, h, 5, 2.4 * U);
  for (let i = 0; i < 6; i++) caixa(g, M(0x1d1f22), 0.9 * U, 0.8 * U, 0.7 * U, -w / 2 + 2 * U + i * 4 * U, 0.4 * U, -d / 4); return g; } });
KITS.garagemAberta = F("Paddock", { nome: "Fileira de garagens abertas", grupo: "Paddock", montar() {
  const g = new THREE.Group(), n = 5, mod = 6 * U, w = n * mod, d = 12 * U, h = 5 * U, P = M(0xe9e9e6); caixa(g, ESCURO, w, h, 0.4 * U, 0, h / 2, -d / 2);
  for (let i = 0; i <= n; i++) caixa(g, P, 0.6 * U, h, d, -w / 2 + i * mod, h / 2, 0); caixa(g, ESCURO, w + 0.6 * U, 1.2 * U, d + 0.6 * U, 0, h + 0.6 * U, 0); caixa(g, M(0xa8acb2), w + 2 * U, 0.2 * U, d + 2 * U, 0, h + 1.3 * U, 0.5 * U);
  for (let i = 0; i < n; i++) { const x = -w / 2 + (i + 0.5) * mod; malha(g, new THREE.BoxGeometry(mod * 0.6, 0.5 * U, 0.05 * U), matFaixa("galera"), x, h - 0.6 * U, d / 2); caixa(g, M(0xc8202f), 1.4 * U, 1 * U, 0.6 * U, x - 1.5 * U, 0.5 * U, -d / 2 + 0.8 * U); caixa(g, M(0x1d1f22), 1 * U, 0.8 * U, 0.8 * U, x + 1.2 * U, 0.4 * U, -d / 2 + 1.2 * U); }
  caixa(g, M(0x6f747b, { roughness: 0.9 }), w, 0.1 * U, d, 0, 0.05 * U, 0); return g; } });
const texBandeiraMex = () => texCanvas("bandeira-mx", 96, 256, (x, w, hh) => { const t = hh / 3; x.fillStyle = "#0b6b3a"; x.fillRect(0, 0, w, t); x.fillStyle = "#f4f4f2"; x.fillRect(0, t, w, t); x.fillStyle = "#c8202f"; x.fillRect(0, 2 * t, w, t); x.fillStyle = "#8a6a2e"; x.beginPath(); x.arc(w / 2, hh / 2, w * 0.18, 0, Math.PI * 2); x.fill(); });
function bandeiraVertical(tex) { const g = new THREE.Group(), h = 6 * U; cil(g, GRADIL, 0.06 * U, h, 0, h / 2, 0, 6); caixa(g, GRADIL, 1.4 * U, 0.06 * U, 0.06 * U, 0.7 * U, h - 0.1 * U, 0); const b = new THREE.Mesh(new THREE.PlaneGeometry(1.3 * U, 3.6 * U), new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide })); b.position.set(0.7 * U, h - 1.95 * U, 0); b.castShadow = true; g.add(b); caixa(g, ESCURO, 0.8 * U, 0.2 * U, 0.8 * U, 0, 0.1 * U, 0); return g; }
KITS.bandeiraMexico = F("Geral", { nome: "Bandeira vertical do México", grupo: "Público", montar: () => bandeiraVertical(texBandeiraMex()) });
KITS.bandeiraPadrao = F("Geral", { nome: "Bandeira vertical (padrão mexicano)", grupo: "Público", montar: () => bandeiraVertical(texCanvas("mex-vert", 64, 256, (x, w, hh) => { const m = texMex().image; for (let y = 0; y < hh; y += 64) x.drawImage(m, 0, y, 256, 64); })) });
KITS.bandeiraPreta = F("Geral", { nome: "Bandeira vertical preta (marca)", grupo: "Público", montar: () => bandeiraVertical(texCanvas("preta-vert", 96, 256, (x, w, hh) => { x.fillStyle = "#16181c"; x.fillRect(0, 0, w, hh); x.save(); x.translate(w / 2, hh / 2); x.rotate(-Math.PI / 2); x.translate(-w / 2, -hh / 2); patrocinioEm(x, "galera", w / 2, hh / 2, hh * 0.8, w * 0.7); x.restore(); })) });
KITS.totemBandeira = F("Geral", { nome: "Totem com bandeira", grupo: "Público", montar() { const g = new THREE.Group(), h = 7 * U; caixa(g, ESCURO, 2.6 * U, 1 * U, 2.6 * U, 0, 0.5 * U, 0); for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) caixa(g, ESCURO, 0.2 * U, h, 0.2 * U, x * 1.2 * U, h / 2, z * 1.2 * U); caixa(g, ESCURO, 2.6 * U, 0.3 * U, 2.6 * U, 0, h, 0);
  const m = new THREE.MeshStandardMaterial({ map: texBandeiraMex() }); malha(g, new THREE.BoxGeometry(2.2 * U, 4 * U, 0.1 * U), [ESCURO, ESCURO, ESCURO, ESCURO, m, m], 0, h * 0.55, 0); return g; } });
KITS.telaoTrelica = F("Geral", { nome: "Telão em treliça", grupo: "Público", montar() { const g = new THREE.Group(), w = 12 * U, h = 7 * U; trelica(g, -w / 2, h); trelica(g, w / 2, h); caixa(g, GRADIL, w + U, 0.7 * U, 0.7 * U, 0, h, 0);
  caixa(g, ESCURO, w * 0.9, h * 0.6, 0.3 * U, 0, h * 0.55, 0); caixa(g, new THREE.MeshStandardMaterial({ map: texMex(), emissive: 0xffffff, emissiveIntensity: 0.25, emissiveMap: texMex() }), w * 0.86, h * 0.54, 0.05 * U, 0, h * 0.55, 0.18 * U);
  malha(g, new THREE.BoxGeometry(w * 1.05, 1.4 * U, 1.6 * U), matFaixa("galera"), 0, 0.7 * U, 0); return g; } });
KITS.cercaFaixaMex = F("Contenção", { nome: "Mureta com tela e faixa (México)", grupo: "Pista", montar() { const g = new THREE.Group(), w = 8 * U, C = M(0xdcdad4, { roughness: 0.9 }); caixa(g, C, w, 1.2 * U, 0.6 * U, 0, 0.6 * U, 0);
  malha(g, new THREE.BoxGeometry(w * 0.98, 0.9 * U, 0.05 * U), matFaixa("galera"), 0, 0.6 * U, 0.32 * U); const tela = new THREE.MeshStandardMaterial({ color: 0x9aa3ab, metalness: 0.4, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false });
  malha(g, new THREE.PlaneGeometry(w, 3 * U), tela, 0, 2.7 * U, -0.1 * U); for (const x of [-w / 2, 0, w / 2]) { cil(g, GRADIL, 0.06 * U, 3.4 * U, x, 2.9 * U, -0.1 * U, 6); const b = caixa(g, GRADIL, 0.05 * U, 0.05 * U, 0.7 * U, x, 4.5 * U, 0.15 * U); b.rotation.x = -0.6; } return g; } });
KITS.faixaBaixaMex = F("Contenção", { nome: "Faixa baixa de patrocínio (México)", grupo: "Pista", montar() { const g = new THREE.Group(); malha(g, new THREE.BoxGeometry(8 * U, 1 * U, 0.15 * U), matFaixa("galera"), 0, 0.5 * U, 0); return g; } });
KITS.barreiraLaranja = F("Contenção", { nome: "Barreira plástica laranja", grupo: "Pista", montar() { const g = new THREE.Group(), s = new THREE.Shape([[-0.3, 0], [0.3, 0], [0.18, 0.3], [0.12, 0.9], [-0.12, 0.9], [-0.18, 0.3]].map(([x, y]) => new THREE.Vector2(x * U, y * U)));
  const geo = new THREE.ExtrudeGeometry(s, { depth: 2 * U, bevelEnabled: false }); geo.translate(0, 0, -U); malha(g, geo, M(0xf06a1a, { roughness: 0.5 })).rotation.y = Math.PI / 2; return g; } });
KITS.cercaPainelConcreto = F("Contenção", { nome: "Painel de tela com base de concreto", grupo: "Pista", montar() { const g = new THREE.Group(), w = 3.5 * U; caixa(g, M(0xc9cac6, { roughness: 0.9 }), w, 0.4 * U, 0.5 * U, 0, 0.2 * U, 0);
  const tela = new THREE.MeshStandardMaterial({ color: 0x8f969c, metalness: 0.4, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }); malha(g, new THREE.PlaneGeometry(w, 2 * U), tela, 0, 1.4 * U, 0); caixa(g, GRADIL, w, 0.05 * U, 0.05 * U, 0, 2.4 * U, 0); for (const x of [-w / 2, w / 2]) cil(g, GRADIL, 0.04 * U, 2.1 * U, x, 1.4 * U, 0, 5); return g; } });
KITS.pilhaPneus = F("Paddock", { nome: "Pilhas de pneus", grupo: "Paddock", montar() { const g = new THREE.Group(), P = M(0x1d1f22, { roughness: 0.95 }), geo = new THREE.CylinderGeometry(0.34 * U, 0.34 * U, 0.3 * U, 12); for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 4; k++) malha(g, geo, P, (i - 2.5) * 0.75 * U, 0.15 * U + k * 0.31 * U, (j - 0.5) * 0.75 * U); return g; } });
KITS.casesTransporte = F("Paddock", { nome: "Cases de transporte", grupo: "Paddock", montar() { const g = new THREE.Group(), C = M(0x26282c, { roughness: 0.6 }), A = M(0x8d9096, { metalness: 0.6 }); for (const [x, y, z, w, h] of [[0, 0, 0, 1.2, 0.9], [1.3, 0, 0, 1.2, 0.9], [0.6, 0.9, 0, 1.2, 0.8], [-1.3, 0, 0.2, 1, 1.2]]) { caixa(g, C, w * U, h * U, 0.9 * U, x * U, (y + h / 2) * U, z * U); caixa(g, A, w * U + 0.02 * U, 0.06 * U, 0.92 * U, x * U, (y + h) * U - 0.03 * U, z * U); } return g; } });
KITS.empilhadeira = F("Automóveis", { nome: "Empilhadeira", grupo: "Paddock", montar() { const g = new THREE.Group(), A = M(0xf2c230, { roughness: 0.5 }), P = M(0x1d1f22); caixa(g, A, 1.2 * U, 1 * U, 2 * U, 0, 0.8 * U, 0); caixa(g, P, 1.1 * U, 0.8 * U, 0.6 * U, 0, 0.7 * U, -1.2 * U);
  for (const x of [-0.5, 0.5]) cil(g, P, 0.06 * U, 2.2 * U, x * U, 1.4 * U, -0.7 * U, 5); caixa(g, P, 1.1 * U, 0.06 * U, 0.06 * U, 0, 2.5 * U, -0.7 * U); for (const x of [-0.3, 0.3]) caixa(g, M(0x6b6f76), 0.12 * U, 0.05 * U, 1.1 * U, x * U, 0.15 * U, 1.4 * U); caixa(g, M(0x6b6f76), 1 * U, 1.4 * U, 0.1 * U, 0, 0.8 * U, 0.9 * U);
  for (const z of [-0.7, 0.6]) for (const s of [-1, 1]) cil(g, P, 0.3 * U, 0.25 * U, s * 0.62 * U, 0.3 * U, z * U, 10).rotation.z = Math.PI / 2; return g; } });
KITS.vanBau = F("Automóveis", { nome: "Caminhão baú pequeno", grupo: "Paddock", montar() { const g = new THREE.Group(), B = M(0xf2f2f0, { roughness: 0.45 }), V = M(0x1f2a33, { roughness: 0.1, metalness: 0.4 }), P = M(0x1d1f22);
  caixa(g, B, 2.2 * U, 2 * U, 1.8 * U, 0, 1.4 * U, 2.3 * U); caixa(g, V, 2 * U, 0.8 * U, 0.1 * U, 0, 1.9 * U, 3.2 * U); caixa(g, B, 2.4 * U, 2.6 * U, 4.4 * U, 0, 1.9 * U, -0.9 * U); caixa(g, M(0xc8202f), 2.42 * U, 0.4 * U, 3 * U, 0, 1.7 * U, -0.9 * U);
  for (const z of [-2, 2.2]) for (const s of [-1, 1]) cil(g, P, 0.42 * U, 0.3 * U, s * 1.05 * U, 0.42 * U, z * U, 12).rotation.z = Math.PI / 2; return g; } });
KITS.carretaMex = F("Automóveis", { nome: "Carreta com faixas (México)", grupo: "Paddock", montar() { const g = new THREE.Group(); cavalo(g, 0xf2f2f0, 6 * U); const B = M(0xf4f4f2, { roughness: 0.5 }); caixa(g, B, 2.5 * U, 2.9 * U, 13.5 * U, 0, 2.6 * U, -2 * U);
  for (const [c, dz] of [[0x0b6b3a, 0], [0xc8202f, 0.5]]) { const f = caixa(g, M(c), 2.52 * U, 0.35 * U, 4 * U, 0, 2.2 * U, (-6.5 + dz) * U); f.rotation.x = -0.5; } caixa(g, ESCURO, 2.2 * U, 0.4 * U, 13.5 * U, 0, 1.1 * U, -2 * U); rodasCarreta(g, -6 * U, 3); return g; } });
KITS.banheiroQuimico = F("Geral", { nome: "Banheiro químico", grupo: "Paddock", montar() { const g = new THREE.Group(), A = M(0x2a6fc0, { roughness: 0.5 }); caixa(g, A, 1.2 * U, 2.3 * U, 1.2 * U, 0, 1.15 * U, 0); malha(g, new THREE.CylinderGeometry(0.85 * U, 0.85 * U, 0.2 * U, 4), M(0xf2f2f0), 0, 2.4 * U, 0).rotation.y = Math.PI / 4; caixa(g, M(0x1f4f8a), 0.9 * U, 1.9 * U, 0.05 * U, 0, 1.1 * U, 0.62 * U); return g; } });
KITS.torreLuzReboque = F("Geral", { nome: "Torre de luz rebocável", grupo: "Pista", montar() { const g = new THREE.Group(), h = 6 * U; caixa(g, BRANCO, 1.4 * U, 1.1 * U, 2.2 * U, 0, 0.9 * U, 0); for (const s of [-1, 1]) cil(g, M(0x1d1f22), 0.35 * U, 0.2 * U, s * 0.8 * U, 0.35 * U, 0, 10).rotation.z = Math.PI / 2;
  caixa(g, ESCURO, 0.1 * U, 0.1 * U, 1.4 * U, 0, 0.5 * U, 1.7 * U); cil(g, POSTE, 0.1 * U, h, 0, h / 2 + U, -0.6 * U, 6); caixa(g, POSTE, 1.6 * U, 0.1 * U, 0.1 * U, 0, h + U, -0.6 * U); for (const x of [-0.45, 0.45]) for (const y of [0, 0.75]) refletor(g, x * U, h + U + 0.2 * U + y * U, -0.5 * U); return g; } });
KITS.posteBaixo = F("Geral", { nome: "Poste baixo", grupo: "Pista", montar() { const g = new THREE.Group(), h = 4 * U; cil(g, POSTE, 0.07 * U, h, 0, h / 2, 0, 6); caixa(g, POSTE, 0.5 * U, 0.15 * U, 0.3 * U, 0.15 * U, h, 0); caixa(g, LUZ, 0.4 * U, 0.05 * U, 0.25 * U, 0.15 * U, h - 0.09 * U, 0); return g; } });
KITS.gazeboMarca = F("Paddock", { nome: "Gazebo preto com marca", grupo: "Paddock", montar() { const g = new THREE.Group(), w = 3 * U, h = 2.2 * U; for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) cil(g, ESCURO, 0.04 * U, h, x * w / 2, h / 2, z * w / 2, 5);
  const t = malha(g, new THREE.ConeGeometry(w * 0.72, 1 * U, 4, 1, true), M(0xf4f4f2, { side: THREE.DoubleSide }), 0, h + 0.5 * U, 0); t.rotation.y = Math.PI / 4; for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2, b = malha(g, new THREE.BoxGeometry(w, 0.3 * U, 0.03 * U), matFaixa("galera"), Math.sin(a) * w / 2, h - 0.15 * U, Math.cos(a) * w / 2); b.rotation.y = a; } return g; } });
// ---------- (2026-11-17, as imagens do Thiago: o pacote de Mônaco) ----------
// os PRÉDIOS CLÁSSICOS da Riviera: a fachada em textura (janelas altas com venezianas, sacadas de ferro, frisos de pedra entre os andares,
// toldos), o térreo de arcos, a cornija e, conforme o prédio, a mansarda de ardósia, o canto redondo ou os terraços com plantas.
function texFachada(chave, { cor, pedra = "#e8dcc4", janela = "#2a3440", veneziana = null, toldo = null, colunas = 4, sacada = true }) {
  return texCanvas("fach-" + chave, 128, 128, (x, w, hh) => {
    x.fillStyle = cor; x.fillRect(0, 0, w, hh); x.fillStyle = pedra; x.fillRect(0, hh - 10, w, 10); x.fillRect(0, 0, w, 4);
    for (let i = 0; i < colunas; i++) { const cw = w / colunas, cx = i * cw + cw * 0.3, jw = cw * 0.4;
      x.fillStyle = pedra; x.fillRect(cx - 3, 18, jw + 6, 84); x.fillStyle = janela; x.fillRect(cx, 22, jw, 76); x.fillStyle = "#ffffff22"; x.fillRect(cx + 2, 24, jw * 0.3, 70);
      if (veneziana) { x.fillStyle = veneziana; x.fillRect(cx - jw * 0.45, 22, jw * 0.42, 76); x.fillRect(cx + jw * 1.03, 22, jw * 0.42, 76); }
      if (toldo) { x.fillStyle = toldo; x.beginPath(); x.moveTo(cx - 4, 22); x.lineTo(cx + jw + 4, 22); x.lineTo(cx + jw + 8, 40); x.lineTo(cx - 8, 40); x.fill(); }
      if (sacada) { x.fillStyle = "#1d1f22"; x.fillRect(cx - 6, 90, jw + 12, 3); for (let k = 0; k <= 6; k++) x.fillRect(cx - 6 + (k * (jw + 12)) / 6, 90, 1.5, 14); x.fillRect(cx - 6, 103, jw + 12, 2); } }
  }); }
function texTerreo(chave, cor, pedra = "#d9cdb2") { return texCanvas("terreo-" + chave, 128, 128, (x, w, hh) => { x.fillStyle = pedra; x.fillRect(0, 0, w, hh); x.fillStyle = "#00000014"; for (let y = 0; y < hh; y += 16) x.fillRect(0, y, w, 2);
  for (let i = 0; i < 3; i++) { const cx = 22 + i * 42; x.fillStyle = "#2a2522"; x.beginPath(); x.moveTo(cx - 14, hh); x.lineTo(cx - 14, 50); x.arc(cx, 50, 14, Math.PI, 0); x.lineTo(cx + 14, hh); x.fill(); x.fillStyle = cor; x.fillRect(cx - 16, 30, 4, 4); } }); }
// um prédio: largura, fundo, andares (3,2 m), as cores, colunas de janela por face; extras: mansarda, canto redondo, terraço com plantas
function predioClassico({ w = 14, d = 12, andares = 6, cor = "#e8cfa6", pedra = "#efe4cf", veneziana = null, toldo = null, mansarda = false, redondo = false, terraco = false, chave }) {
  const g = new THREE.Group(), W = w * U, D = d * U, A = 3.2 * U, H = andares * A, T = 4.2 * U;
  const fach = (larg) => { const t = texFachada(chave + larg, { cor, pedra, veneziana, toldo, colunas: Math.max(2, Math.round(larg / 3.5)) }); t.repeat.set(1, andares); return new THREE.MeshStandardMaterial({ map: t, roughness: 0.85 }); };
  const ter = (larg) => { const t = texTerreo(chave + larg, cor, pedra); t.repeat.set(Math.max(1, Math.round(larg / 10)), 1); return new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 }); };
  const topo = M(new THREE.Color(pedra).getHex(), { roughness: 0.9 });
  if (redondo) { const c = malha(g, new THREE.CylinderGeometry(W / 2, W / 2, H, 20), fach(w * 1.6), 0, T + H / 2, 0); c.material.map.repeat.set(3, andares); malha(g, new THREE.CylinderGeometry(W / 2 + 0.1 * U, W / 2 + 0.1 * U, T, 20), ter(w * 1.6), 0, T / 2, 0);
    for (let k = 1; k <= andares; k++) malha(g, new THREE.CylinderGeometry(W / 2 + 0.35 * U, W / 2 + 0.35 * U, 0.25 * U, 20), topo, 0, T + k * A - 0.1 * U, 0); return g; }
  malha(g, new THREE.BoxGeometry(W, H, D), [fach(d), fach(d), topo, topo, fach(w), fach(w)], 0, T + H / 2, 0);
  malha(g, new THREE.BoxGeometry(W + 0.2 * U, T, D + 0.2 * U), [ter(d), ter(d), topo, topo, ter(w), ter(w)], 0, T / 2, 0);
  for (let k = 0; k <= andares; k++) caixa(g, topo, W + (k === andares ? 0.9 : 0.4) * U, (k === andares ? 0.6 : 0.2) * U, D + (k === andares ? 0.9 : 0.4) * U, 0, T + k * A, 0); // os frisos e a cornija
  if (mansarda) { const m = malha(g, new THREE.CylinderGeometry(Math.hypot(W, D) / 2 * 0.62, Math.hypot(W, D) / 2 * 0.72, 2.6 * U, 4), M(0x4a4f57, { roughness: 0.7, flatShading: true }), 0, T + H + 1.6 * U, 0); m.rotation.y = Math.PI / 4; m.scale.set(W / Math.hypot(W, D) * 1.414, 1, D / Math.hypot(W, D) * 1.414);
    for (let i = 0; i < Math.round(w / 4); i++) caixa(g, M(0xf0e8d8), 1 * U, 1.2 * U, 0.8 * U, -W / 2 + (i + 0.5) * (W / Math.round(w / 4)), T + H + 1.4 * U, D / 2 - 0.6 * U); }
  if (terraco) { caixa(g, GRADIL, W, 0.08 * U, 0.08 * U, 0, T + H + 1.1 * U, D / 2); for (let i = 0; i < 4; i++) malha(g, new THREE.IcosahedronGeometry(0.8 * U, 0), VERDES[i % 5], -W / 2 + (i + 0.5) * W / 4, T + H + 0.9 * U, D / 2 - 0.8 * U); caixa(g, topo, W * 0.4, 2.4 * U, D * 0.4, 0, T + H + 1.2 * U, -D / 4); }
  return g;
}
for (const [id, nome, o] of [
  ["monacoPredioCreme", "Prédio clássico creme", { w: 12, d: 12, andares: 7, cor: "#ecd9b8" }],
  ["monacoPredioCoral", "Prédio coral de canto redondo", { w: 12, andares: 6, cor: "#e08a6a", redondo: true }],
  ["monacoPredioAmarelo", "Prédio amarelo com toldos verdes", { w: 13, d: 12, andares: 7, cor: "#f0c46a", toldo: "#2e7a4a", terraco: true }],
  ["monacoPredioVenezianas", "Prédio de venezianas verdes", { w: 12, d: 12, andares: 6, cor: "#efe2c8", veneziana: "#3d6b4a" }],
  ["monacoPredioMansarda", "Prédio belle époque com mansarda", { w: 16, d: 14, andares: 6, cor: "#f0dcc0", toldo: "#c0392b", mansarda: true }],
  ["monacoPredioRosa", "Prédio rosa de venezianas", { w: 14, d: 12, andares: 7, cor: "#e7a789", veneziana: "#3d6b4a", terraco: true }],
  ["monacoPredioEstreito", "Prédio estreito de pedra", { w: 9, d: 10, andares: 8, cor: "#ead9bd" }],
  ["monacoPredioGrande", "Prédio grande de esquina", { w: 24, d: 18, andares: 8, cor: "#ecdcc4", mansarda: true }],
]) KITS[id] = F("Geral", { nome, grupo: "Cidade", montar: () => predioClassico({ ...o, chave: id }) });
// (2026-11-18, o Thiago: "mais variações de construções, especialmente para Mônaco, como prédios e casas") mais prédios clássicos,
// as CASAS com telhado de telha (2 a 3 andares, venezianas, um pinheiro ou palmeira no jardim) e os prédios MODERNOS da encosta.
for (const [id, nome, o] of [
  ["monacoPredioOcre", "Prédio ocre de venezianas", { w: 13, d: 12, andares: 6, cor: "#d9a35c", veneziana: "#5a7a8a" }],
  ["monacoPredioBranco", "Prédio branco com toldos azuis", { w: 14, d: 12, andares: 7, cor: "#f3efe6", toldo: "#2a5b9a", terraco: true }],
  ["monacoPredioSalmao", "Prédio salmão alto", { w: 12, d: 12, andares: 10, cor: "#eaa585", veneziana: "#3d6b4a" }],
  ["monacoPredioLimao", "Prédio amarelo-limão", { w: 11, d: 11, andares: 5, cor: "#f2d877", veneziana: "#2e5d3e" }],
  ["monacoPredioTerracota", "Prédio terracota com mansarda", { w: 15, d: 12, andares: 6, cor: "#c97c62", toldo: "#f2f2ee", mansarda: true }],
  ["monacoPredioCinza", "Prédio de pedra cinza", { w: 14, d: 13, andares: 7, cor: "#cfccc5", pedra: "#e4e1da", veneziana: "#5c6168" }],
  ["monacoPredioBaixo", "Prédio baixo de lojas", { w: 18, d: 12, andares: 3, cor: "#ecd2a6", toldo: "#c0392b", terraco: true }],
  ["monacoPredioCantoAmarelo", "Prédio amarelo de canto redondo", { w: 11, andares: 7, cor: "#f0c46a", redondo: true }],
  ["monacoPredioCantoBranco", "Prédio branco de canto redondo", { w: 13, andares: 9, cor: "#f2ece0", redondo: true }],
  ["monacoHotel", "Hotel belle époque", { w: 30, d: 16, andares: 7, cor: "#f3e6cc", toldo: "#7a1f2b", mansarda: true }],
]) KITS[id] = F("Geral", { nome, grupo: "Cidade", montar: () => predioClassico({ ...o, chave: id }) });
// a CASA: o prédio clássico baixo com o telhado de quatro águas em telha e, às vezes, uma árvore no jardim
function casaRiviera({ w = 10, d = 9, andares = 2, cor, veneziana = "#3d6b4a", toldo = null, telha = 0xb5653d, arvore = null, chave }) {
  const g = predioClassico({ w, d, andares, cor, veneziana, toldo, chave }), H = 4.2 * U + andares * 3.2 * U, r = Math.hypot(w, d) / 2 * U;
  const t = malha(g, new THREE.CylinderGeometry(0.01, r * 1.08, 2.4 * U, 4), M(telha, { flatShading: true, roughness: 0.85 }), 0, H + 1.5 * U, 0); t.rotation.y = Math.PI / 4; t.scale.set((w * U) / r * 0.72, 1, (d * U) / r * 0.72);
  caixa(g, M(0xe9dcc4), 0.8 * U, 1.6 * U, 0.8 * U, w * 0.25 * U, H + 2 * U, -d * 0.15 * U); // (a chaminé)
  if (arvore) { const a = arvore === "palmeira" ? tamareira(9, 4) : pinheiroManso(11, 6); a.position.set((w / 2 + 3) * U, 0, (d / 2 - 2) * U); g.add(a); }
  return g;
}
for (const [id, nome, o] of [
  ["monacoCasaAmarela", "Casa amarela de telhado", { cor: "#f0c46a" }],
  ["monacoCasaRosa", "Casa rosa com palmeira", { cor: "#e7a789", arvore: "palmeira" }],
  ["monacoCasaBranca", "Casa branca de venezianas azuis", { cor: "#f3efe6", veneziana: "#3c6a9a" }],
  ["monacoCasaOcre", "Casa ocre com pinheiro", { cor: "#d9a35c", arvore: "pinheiro", andares: 3 }],
  ["monacoCasaTerracota", "Casa terracota com toldos", { cor: "#c97c62", toldo: "#f2f2ee", veneziana: "#f2f2ee" }],
  ["monacoVilla", "Villa grande de três andares", { w: 16, d: 12, andares: 3, cor: "#f0dcc0", arvore: "palmeira", toldo: "#2e7a4a" }],
  ["monacoCasaPequena", "Casinha de um andar", { w: 7, d: 7, andares: 1, cor: "#efe2c8" }],
]) KITS[id] = F("Geral", { nome, grupo: "Cidade", montar: () => casaRiviera({ ...o, chave: id }) });
// os MODERNOS: a torre residencial de varandas corridas (faixas brancas e vidro), em alturas diferentes
function torreVarandas({ w = 18, d = 16, andares = 12, cor = 0xf1ebe0, vidro = 0x2a3440 }) {
  const g = new THREE.Group(), W = w * U, D = d * U, A = 3.2 * U, B = M(cor, { roughness: 0.8 }), V = M(vidro, { roughness: 0.12, metalness: 0.5 });
  caixa(g, V, W * 0.96, andares * A, D * 0.96, 0, (andares * A) / 2, 0);
  for (let k = 0; k <= andares; k++) { caixa(g, B, W + 1.6 * U, 0.35 * U, D + 1.6 * U, 0, k * A, 0); if (k) caixa(g, M(0xdfe6ea, { transparent: true, opacity: 0.35 }), W + 1.5 * U, 1 * U, D + 1.5 * U, 0, k * A + 0.5 * U, 0); }
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) caixa(g, B, 0.6 * U, andares * A, 0.6 * U, (x * W) / 2, (andares * A) / 2, (z * D) / 2);
  caixa(g, B, W * 0.4, 3 * U, D * 0.4, 0, andares * A + 1.5 * U, 0); return g;
}
for (const [id, nome, o] of [
  ["monacoTorreBaixa", "Prédio moderno de varandas (8 andares)", { andares: 8 }],
  ["monacoTorreMedia", "Torre moderna de varandas (14 andares)", { andares: 14, w: 20 }],
  ["monacoTorreAlta", "Torre alta de vidro (24 andares)", { andares: 24, w: 22, d: 20, vidro: 0x3d5a73 }],
  ["monacoTorreBege", "Prédio moderno bege", { andares: 10, cor: 0xe6cfa6 }],
]) KITS[id] = F("Geral", { nome, grupo: "Cidade", montar: () => torreVarandas(o) });
// o prédio moderno de varandas curvas (o branco da imagem)
KITS.monacoVarandasCurvas = F("Geral", { nome: "Prédio de varandas curvas", grupo: "Cidade", montar() {
  const g = new THREE.Group(), W = 16 * U, D = 14 * U, A = 3.2 * U, n = 8, B = M(0xf1ebe0, { roughness: 0.8 }), V = M(0x2a3440, { roughness: 0.15, metalness: 0.4 });
  caixa(g, B, W, n * A, D, 0, (n * A) / 2, 0); caixa(g, V, W * 0.98, n * A * 0.95, D * 0.98, 0, (n * A) / 2, 0.02 * U);
  for (let k = 1; k <= n; k++) { const l = malha(g, new THREE.CylinderGeometry(W * 0.3, W * 0.3, 0.3 * U, 24, 1, false, -Math.PI / 2, Math.PI), B, -W / 2 + W * 0.3, k * A - 0.15 * U, D / 2 - 0.3 * U); l.scale.z = 0.6;
    const p = malha(g, new THREE.CylinderGeometry(W * 0.3, W * 0.3, 1 * U, 24, 1, true, -Math.PI / 2, Math.PI), new THREE.MeshStandardMaterial({ color: 0x9fc4d4, transparent: true, opacity: 0.35, side: THREE.DoubleSide }), -W / 2 + W * 0.3, k * A + 0.4 * U, D / 2 - 0.3 * U); p.scale.z = 0.6;
    caixa(g, B, W * 0.42, 0.3 * U, 1.6 * U, W * 0.27, k * A - 0.15 * U, D / 2 + 0.6 * U); }
  caixa(g, B, W + 0.6 * U, 0.6 * U, D + 0.6 * U, 0, n * A + 0.3 * U, 0); return g; } });
// o CASSINO: o palácio de pedra creme com o pavilhão central, as duas torres de cúpula, o relógio e a marquise de ferro
KITS.monacoCassino = F("Geral", { nome: "Cassino (palácio)", grupo: "Cidade", montar() {
  const g = new THREE.Group(), cor = "#efd2a2", pedra = "#f4e6cc", ardosia = M(0x5d7a6a, { roughness: 0.6, metalness: 0.2, flatShading: true }), P = M(0xf4e6cc, { roughness: 0.9 });
  const corpo = predioClassico({ w: 40, d: 20, andares: 2, cor, pedra, chave: "cassino" }); g.add(corpo);
  const centro = predioClassico({ w: 14, d: 22, andares: 3, cor, pedra, chave: "cassino-c" }); centro.position.z = 0.5 * U; g.add(centro);
  const H = 4.2 * U + 2 * 3.2 * U;
  for (const s of [-1, 1]) { const x = s * 9 * U; caixa(g, P, 5 * U, 8 * U, 5 * U, x, H + 4 * U, 9 * U); malha(g, new THREE.CylinderGeometry(2.3 * U, 2.6 * U, 1.5 * U, 8), P, x, H + 8.7 * U, 9 * U);
    const c = malha(g, new THREE.SphereGeometry(2.4 * U, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), ardosia, x, H + 9.4 * U, 9 * U); c.scale.y = 1.5; cil(g, P, 0.12 * U, 2.4 * U, x, H + 13.8 * U, 9 * U, 6); }
  caixa(g, P, 8 * U, 3 * U, 1 * U, 0, H + 3.2 * U + 1.5 * U, 11 * U); malha(g, new THREE.CircleGeometry(1.1 * U, 20), M(0xf8f4ea), 0, H + 3.2 * U + 1.6 * U, 11.52 * U);
  caixa(g, M(0x1d1f22, { metalness: 0.5 }), 12 * U, 0.3 * U, 3 * U, 0, 4.6 * U, 12.5 * U); for (const x of [-5.5, 5.5]) cil(g, M(0x1d1f22), 0.12 * U, 4.6 * U, x * U, 2.3 * U, 13.6 * U, 6);
  for (const x of [-16, -12, 12, 16]) { const m = malha(g, new THREE.CylinderGeometry(1.4 * U, 1.6 * U, 1.8 * U, 4), ardosia, x * U, H + 0.9 * U, 0); m.rotation.y = Math.PI / 4; }
  for (const x of [-6, 6]) { caixa(g, M(0xf2f2f0), 0.8 * U, 0.8 * U, 0.8 * U, x * U, 0.4 * U, 12 * U); malha(g, new THREE.IcosahedronGeometry(0.7 * U, 0), VERDES[1], x * U, 1.2 * U, 12 * U); }
  return g; } });
KITS.monacoIgreja = F("Geral", { nome: "Igreja com torre", grupo: "Cidade", montar() {
  const g = new THREE.Group(), C = M(0xf0d29a, { roughness: 0.85 }), P = M(0xf6e8cc), T = M(0xb5653d, { flatShading: true });
  caixa(g, C, 10 * U, 9 * U, 18 * U, 0, 4.5 * U, 0); const tel = malha(g, new THREE.CylinderGeometry(0.01, 7.5 * U, 3.5 * U, 4, 1), T, 0, 10.7 * U, 0); tel.rotation.y = Math.PI / 4; tel.scale.set(0.95, 1, 1.75);
  const front = new THREE.Shape([[-5.2, 0], [5.2, 0], [5.2, 11], [0, 14], [-5.2, 11]].map(([x, y]) => new THREE.Vector2(x * U, y * U))); const fg = malha(g, new THREE.ExtrudeGeometry(front, { depth: 0.6 * U, bevelEnabled: false }), C, 0, 0, 9 * U);
  caixa(g, M(0x4a2e22), 2.4 * U, 4 * U, 0.1 * U, 0, 2 * U, 9.65 * U); malha(g, new THREE.CircleGeometry(1.2 * U, 16), M(0x2a3440), 0, 8 * U, 9.65 * U);
  caixa(g, C, 4 * U, 16 * U, 4 * U, 6.5 * U, 8 * U, -6 * U); caixa(g, P, 4.6 * U, 0.5 * U, 4.6 * U, 6.5 * U, 16 * U, -6 * U); cil(g, C, 1.8 * U, 3 * U, 6.5 * U, 17.7 * U, -6 * U, 8);
  malha(g, new THREE.SphereGeometry(1.8 * U, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), P, 6.5 * U, 19.2 * U, -6 * U); caixa(g, M(0x2a2522), 0.15 * U, 1.4 * U, 0.15 * U, 6.5 * U, 21.6 * U, -6 * U); caixa(g, M(0x2a2522), 0.8 * U, 0.15 * U, 0.15 * U, 6.5 * U, 21.8 * U, -6 * U);
  for (const z of [-4, 2]) caixa(g, M(0x2a3440), 0.1 * U, 3 * U, 1.2 * U, 5.05 * U, 5 * U, z * U); void fg; return g; } });
// a casa sobre arcos de pedra (o muro de arrimo da encosta)
KITS.monacoCasaArcos = F("Geral", { nome: "Casa sobre arcos de pedra", grupo: "Cidade", montar() {
  const g = new THREE.Group(), pedra = M(0x9c8f7a, { roughness: 1, flatShading: true }), W = 20 * U, H = 6 * U;
  const s = new THREE.Shape([[-W / 2, 0], [W / 2, 0], [W / 2, H], [-W / 2, H]].map(([x, y]) => new THREE.Vector2(x, y)));
  for (let i = 0; i < 4; i++) { const cx = -W / 2 + (i + 0.5) * (W / 4), b = new THREE.Path(); b.moveTo(cx - 1.6 * U, 0); b.lineTo(cx - 1.6 * U, 2.8 * U); b.absarc(cx, 2.8 * U, 1.6 * U, Math.PI, 0, true); b.lineTo(cx + 1.6 * U, 0); s.holes.push(b); }
  malha(g, new THREE.ExtrudeGeometry(s, { depth: 6 * U, bevelEnabled: false }), pedra, 0, 0, -3 * U);
  const casa = predioClassico({ w: 12, d: 9, andares: 2, cor: "#e9b85c", veneziana: "#3d6b4a", toldo: "#c0392b", chave: "casa-arcos" }); casa.position.set(-3 * U, H, 0); g.add(casa);
  const tel = malha(g, new THREE.CylinderGeometry(0.01, 8 * U, 2.2 * U, 4), M(0xb5653d, { flatShading: true }), -3 * U, H + 4.2 * U + 6.4 * U + 1.1 * U, 0); tel.rotation.y = Math.PI / 4; tel.scale.set(1.05, 1, 0.8);
  caixa(g, GRADIL, 8 * U, 0.06 * U, 0.06 * U, 6 * U, H + 1.1 * U, 2.8 * U); for (const x of [4.5, 7.5]) { malha(g, new THREE.IcosahedronGeometry(1.4 * U, 1), VERDES[x > 5 ? 2 : 0], x * U, H + 2.2 * U, 0); cil(g, TRONCO, 0.15 * U, 1.4 * U, x * U, H + 0.7 * U, 0, 5); }
  return g; } });
// VEGETAÇÃO da Riviera: a tamareira (tronco grosso escamado), o pinheiro-manso (guarda-chuva), a cerca viva e as floreiras
function tamareira(h, semente) {
  const g = new THREE.Group(), r = sorteio(semente), H = h * U, esc = M(0x8a7458, { flatShading: true, roughness: 1 });
  for (let k = 0; k < 8; k++) cil(g, esc, (0.42 - k * 0.012) * U, H / 8 + 0.05 * U, 0, (k + 0.5) * (H / 8), 0, 7, (0.38 - k * 0.012) * U);
  const folha = M(0x4f7d2a, { flatShading: true, side: THREE.DoubleSide });
  for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2 + r() * 0.2, f = malha(g, new THREE.PlaneGeometry(0.9 * U, 3.8 * U, 1, 4), folha, 0, H, 0); const p = f.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) { const v = (p.getY(i) + 1.9 * U) / (3.8 * U); p.setZ(i, -v * v * (1 + r() * 0.3) * U); p.setX(i, p.getX(i) * (1 - v * 0.6)); } f.geometry.translate(0, 1.9 * U, 0); f.geometry.computeVertexNormals(); f.rotation.set(-0.7 - (k % 2) * 0.5, a, 0, "YXZ"); }
  return g;
}
KITS.tamareira = F("Vegetação", { nome: "Tamareira", grupo: "Natureza", montar: () => tamareira(8, 3) });
KITS.tamareiraBaixa = F("Vegetação", { nome: "Tamareira baixa", grupo: "Natureza", montar: () => tamareira(5, 5) });
KITS.tamareiraAlta = F("Vegetação", { nome: "Tamareira alta", grupo: "Natureza", montar: () => tamareira(11, 7) });
function pinheiroManso(h, semente) {
  const g = new THREE.Group(), r = sorteio(semente), H = h * U; galho(g, 0, 0, 0, 0.6 * U, H, 0.2 * U, 0.3 * U);
  for (let k = 0; k < 3; k++) { const a = r() * Math.PI * 2; galho(g, 0.5 * U, H * 0.85, 0.15 * U, Math.cos(a) * 2.5 * U, H + 0.6 * U, Math.sin(a) * 2.5 * U, 0.12 * U); }
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2, d = k ? 2.6 * U : 0, b = malha(g, new THREE.IcosahedronGeometry((1.8 + r() * 0.6) * U, 1), VERDES[k % 5], Math.cos(a) * d + 0.5 * U, H + 1.1 * U + r() * 0.5 * U, Math.sin(a) * d); b.scale.y = 0.42; }
  return g;
}
KITS.pinheiroManso = F("Vegetação", { nome: "Pinheiro-manso", grupo: "Natureza", montar: () => pinheiroManso(9, 4) });
KITS.pinheiroMansoBaixo = F("Vegetação", { nome: "Pinheiro-manso baixo", grupo: "Natureza", montar: () => pinheiroManso(6, 9) });
KITS.cercaViva = F("Vegetação", { nome: "Cerca viva (4 m)", grupo: "Natureza", montar() { const g = new THREE.Group(), r = sorteio(2); for (let k = 0; k < 6; k++) { const b = malha(g, new THREE.IcosahedronGeometry(0.7 * U, 1), VERDES[k % 5], (k - 2.5) * 0.7 * U, 0.6 * U, (r() - 0.5) * 0.2 * U); b.scale.set(1, 0.8, 0.8); } return g; } });
function floreira(flor) { const g = new THREE.Group(); caixa(g, M(0xe9dcc4, { roughness: 0.9 }), 3 * U, 0.8 * U, 1 * U, 0, 0.4 * U, 0); const p = arbusto(0x4a6a28, flor, 0.9, flor ? 14 : 15); p.scale.set(2, 0.8, 0.9); p.position.y = 0.6 * U; g.add(p); return g; }
KITS.floreiraVerde = F("Vegetação", { nome: "Floreira verde", grupo: "Natureza", montar: () => floreira(null) });
KITS.floreiraRosa = F("Vegetação", { nome: "Floreira com flores rosa", grupo: "Natureza", montar: () => floreira(0xc84a8a) });
KITS.oliveiraVaso = F("Vegetação", { nome: "Arvoreta no vaso", grupo: "Natureza", montar() { const g = new THREE.Group(); caixa(g, M(0xe9dcc4), 1.6 * U, 0.9 * U, 1.6 * U, 0, 0.45 * U, 0); const a = folhosa({ tronco: 2.2, copa: 1.4, blocos: 6, semente: 17 }); a.position.y = 0.9 * U; g.add(a); return g; } });
// O QUE FICA NA BEIRA DA PISTA EM MÔNACO
KITS.guardrailTela = F("Contenção", { nome: "Guard-rail triplo com tela e arame", grupo: "Pista", montar() {
  const g = KITS.guardrailTriplo.montar(), w = 8 * U, ht = 3.2 * U, tela = new THREE.MeshStandardMaterial({ color: 0x8f969c, metalness: 0.4, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false });
  malha(g, new THREE.PlaneGeometry(w, ht), tela, 0, 1.4 * U + ht / 2, -0.15 * U);
  for (let x = -w / 2; x <= w / 2 + 1; x += 4 * U) { cil(g, ESCURO, 0.07 * U, ht + 0.6 * U, x, 1.4 * U + ht / 2 + 0.3 * U, -0.15 * U, 6); const b = caixa(g, ESCURO, 0.06 * U, 0.06 * U, 0.9 * U, x, 1.4 * U + ht + 0.3 * U, 0.15 * U); b.rotation.x = -0.6; }
  for (let k = 0; k < 3; k++) caixa(g, GRADIL, w, 0.02 * U, 0.02 * U, 0, 1.4 * U + ht + 0.2 * U + k * 0.2 * U, 0.2 * U + k * 0.12 * U); return g; } });
KITS.barreiraVermBranca = F("Contenção", { nome: "Barreira vermelha e branca", grupo: "Pista", montar() { const g = new THREE.Group(); for (let i = 0; i < 2; i++) { const b = KITS.barreiraLaranja.montar(); b.traverse((o) => { if (o.isMesh) o.material = M(i ? 0xd62828 : 0xf2f2f0, { roughness: 0.5 }); }); b.position.x = (i - 0.5) * 2.05 * U; g.add(b); } return g; } });
KITS.posteRua = F("Geral", { nome: "Poste de rua moderno", grupo: "Pista", montar() { const g = new THREE.Group(), h = 9 * U; cil(g, POSTE, 0.12 * U, h, 0, h / 2, 0, 8, 0.09 * U); caixa(g, POSTE, 0.1 * U, 0.1 * U, 1.4 * U, 0, h, 0.6 * U); caixa(g, POSTE, 0.7 * U, 0.15 * U, 0.4 * U, 0, h - 0.05 * U, 1.3 * U); caixa(g, LUZ, 0.6 * U, 0.04 * U, 0.3 * U, 0, h - 0.14 * U, 1.3 * U); return g; } });
KITS.posteCamera = F("Geral", { nome: "Poste com câmera", grupo: "Pista", montar() { const g = new THREE.Group(), h = 6 * U; cil(g, M(0xd8dadd, { metalness: 0.4 }), 0.1 * U, h, 0, h / 2, 0, 8); caixa(g, BRANCO, 0.4 * U, 0.6 * U, 0.3 * U, 0, h * 0.55, 0.2 * U); const c = caixa(g, BRANCO, 0.3 * U, 0.3 * U, 0.6 * U, 0, h + 0.1 * U, 0.2 * U); c.rotation.x = 0.3; caixa(g, M(0x1d1f22), 0.2 * U, 0.2 * U, 0.05 * U, 0, h + 0.03 * U, 0.52 * U); return g; } });
KITS.cabineFiscal = F("Geral", { nome: "Cabine de fiscal com fiscal", grupo: "Pista", montar() {
  const g = new THREE.Group(), B = M(0xf2f2f0); caixa(g, B, 1.8 * U, 1 * U, 1.8 * U, 0, 0.5 * U, 0); for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) caixa(g, B, 0.12 * U, 1.3 * U, 0.12 * U, x * 0.84 * U, 1.65 * U, z * 0.84 * U);
  caixa(g, VIDRO, 1.7 * U, 1.2 * U, 0.04 * U, 0, 1.65 * U, 0.86 * U); caixa(g, B, 2 * U, 0.15 * U, 2 * U, 0, 2.35 * U, 0); caixa(g, M(0xd62828), 2.02 * U, 0.3 * U, 2.02 * U, 0, 2.2 * U, 0);
  cil(g, M(0xf07a1a), 0.2 * U, 0.7 * U, 0, 1.35 * U, 0.2 * U, 8); malha(g, new THREE.SphereGeometry(0.15 * U, 8, 6), M(0xd8b48a), 0, 1.85 * U, 0.2 * U); return g; } });
KITS.guindasteResgate = F("Automóveis", { nome: "Guindaste de resgate", grupo: "Pista", montar() { const g = new THREE.Group(), V = M(0xd62828, { roughness: 0.5 }); caixa(g, ESCURO, 2 * U, 0.6 * U, 2 * U, 0, 0.3 * U, 0); cil(g, V, 0.35 * U, 1 * U, 0, 1.1 * U, 0, 10);
  const b = caixa(g, V, 0.45 * U, 0.45 * U, 9 * U, 0, 5 * U, 1.8 * U); b.rotation.x = -1.1; caixa(g, V, 0.3 * U, 0.3 * U, 3 * U, 0, 7.6 * U, 5.8 * U).rotation.x = 0.4; cil(g, M(0x1d1f22), 0.02 * U, 3 * U, 0, 6 * U, 6.8 * U, 4); return g; } });
KITS.caixaEletrica = F("Geral", { nome: "Caixa elétrica", grupo: "Pista", montar() { const g = new THREE.Group(); caixa(g, M(0xe4e6e8, { metalness: 0.3 }), 1.2 * U, 1.5 * U, 0.6 * U, 0, 0.75 * U, 0); caixa(g, M(0xcfd2d5), 0.5 * U, 1.3 * U, 0.02 * U, -0.28 * U, 0.75 * U, 0.31 * U); caixa(g, M(0xcfd2d5), 0.5 * U, 1.3 * U, 0.02 * U, 0.28 * U, 0.75 * U, 0.31 * U); return g; } });
KITS.porticoBranco = F("Geral", { nome: "Pórtico branco de patrocínio", grupo: "Pista", montar() { const g = new THREE.Group(), w = 16 * U, h = 5.5 * U; for (const x of [-w / 2, w / 2]) { trelica(g, x, h); caixa(g, M(0x1d1f22), 1.2 * U, 1.6 * U, 2.4 * U, x, 0.8 * U, 0); }
  const t = texCanvas("pt-branco", 512, 96, (x, ww, hh) => { x.fillStyle = "#f6f6f4"; x.fillRect(0, 0, ww, hh); patrocinioEm(x, "vila", ww / 2, hh / 2, ww * 0.5, hh * 0.8); }), m = new THREE.MeshStandardMaterial({ map: t }); malha(g, new THREE.BoxGeometry(w * 0.95, 2.4 * U, 0.4 * U), [GRADIL, GRADIL, GRADIL, GRADIL, m, m], 0, h, 0); return g; } });
KITS.totemPreto = F("Geral", { nome: "Totem preto com marca", grupo: "Público", montar() { const g = new THREE.Group(), t = texCanvas("totem-preto", 96, 256, (x, w, hh) => { x.fillStyle = "#121316"; x.fillRect(0, 0, w, hh); patrocinioEm(x, "galera", w / 2, 50, w * 0.85, 40); }), m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.4 }); malha(g, new THREE.BoxGeometry(2.4 * U, 7 * U, 1.2 * U), [ESCURO, ESCURO, ESCURO, ESCURO, m, m], 0, 3.5 * U, 0); return g; } });
const texBandeiraMonaco = () => texCanvas("bandeira-mc", 128, 96, (x, w, hh) => { x.fillStyle = "#ce1126"; x.fillRect(0, 0, w, hh / 2); x.fillStyle = "#f6f6f4"; x.fillRect(0, hh / 2, w, hh / 2); });
const texQuadriculada = () => texCanvas("quadriculada", 128, 96, (x, w, hh) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 6; j++) { x.fillStyle = (i + j) % 2 ? "#111" : "#f4f4f4"; x.fillRect(i * 16, j * 16, 16, 16); } });
function mastro(tex) { const g = new THREE.Group(), h = 6 * U; cil(g, M(0xd8dadd, { metalness: 0.5 }), 0.06 * U, h, 0, h / 2, 0, 6); const b = new THREE.Mesh(new THREE.PlaneGeometry(2 * U, 1.4 * U), new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide })); b.position.set(1 * U, h - 0.8 * U, 0); b.castShadow = true; g.add(b); return g; }
KITS.bandeiraMonaco = F("Geral", { nome: "Bandeira de Mônaco", grupo: "Público", montar: () => mastro(texBandeiraMonaco()) });
KITS.bandeiraQuadriculada = F("Geral", { nome: "Bandeira quadriculada", grupo: "Público", montar: () => mastro(texQuadriculada()) });
KITS.placaMonteCarlo = F("Geral", { nome: "Placa Monte-Carlo", grupo: "Cidade", montar() { const g = new THREE.Group(), h = 3 * U; cil(g, POSTE, 0.06 * U, h, 0, h / 2, 0, 6);
  const t = texCanvas("placa-mc", 256, 64, (x, w, hh) => { x.fillStyle = "#e9e1cc"; x.fillRect(0, 0, w, hh); x.strokeStyle = "#2a2522"; x.lineWidth = 4; x.strokeRect(3, 3, w - 6, hh - 6); x.fillStyle = "#2a2522"; x.font = "bold 30px Arial"; x.textBaseline = "middle"; x.fillText("MONTE-CARLO", 14, hh / 2 + 2); x.beginPath(); x.moveTo(w - 40, 14); x.lineTo(w - 12, hh / 2); x.lineTo(w - 40, hh - 14); x.fill(); }), m = new THREE.MeshStandardMaterial({ map: t });
  malha(g, new THREE.BoxGeometry(2.6 * U, 0.65 * U, 0.06 * U), [POSTE, POSTE, POSTE, POSTE, m, m], 1.2 * U, h - 0.4 * U, 0); return g; } });
KITS.lampiaoDuplo = F("Geral", { nome: "Lampião antigo duplo", grupo: "Cidade", montar() { const g = new THREE.Group(), h = 4.5 * U, F1 = M(0x1d2b24, { metalness: 0.4, roughness: 0.5 }); cil(g, F1, 0.12 * U, h, 0, h / 2, 0, 8, 0.07 * U); cil(g, F1, 0.25 * U, 0.6 * U, 0, 0.3 * U, 0, 8);
  for (const s of [-1, 1]) { caixa(g, F1, 0.8 * U, 0.06 * U, 0.06 * U, s * 0.4 * U, h - 0.2 * U, 0); malha(g, new THREE.CylinderGeometry(0.22 * U, 0.15 * U, 0.6 * U, 6), new THREE.MeshStandardMaterial({ color: 0xfff1c8, emissive: 0xffe2a0, emissiveIntensity: 0.6, transparent: true, opacity: 0.85 }), s * 0.8 * U, h, 0); malha(g, new THREE.ConeGeometry(0.3 * U, 0.3 * U, 6), F1, s * 0.8 * U, h + 0.45 * U, 0); }
  malha(g, new THREE.ConeGeometry(0.22 * U, 0.4 * U, 6), F1, 0, h + 0.2 * U, 0); return g; } });
KITS.lancha = F("Automóveis", { nome: "Iate pequeno", grupo: "Porto", montar() { const g = new THREE.Group(), B = M(0xf6f6f4, { roughness: 0.3 }), V = M(0x1f2a33, { roughness: 0.1, metalness: 0.4 });
  const casco = new THREE.Shape([[-1.6, -5], [1.6, -5], [1.8, 2], [0, 6], [-1.8, 2]].map(([x, z]) => new THREE.Vector2(x * U, z * U))); const c = malha(g, new THREE.ExtrudeGeometry(casco, { depth: 1.6 * U, bevelEnabled: false }), B, 0, 1.6 * U, 0); c.rotation.x = Math.PI / 2;
  caixa(g, M(0x1d3a6e), 3.7 * U, 0.2 * U, 9 * U, 0, 0.3 * U, -0.5 * U); caixa(g, B, 2.8 * U, 1.2 * U, 4.5 * U, 0, 2.2 * U, -1 * U); caixa(g, V, 2.85 * U, 0.6 * U, 4 * U, 0, 2.3 * U, -1 * U); caixa(g, B, 2 * U, 0.8 * U, 2.4 * U, 0, 3.2 * U, -1.6 * U); cil(g, B, 0.06 * U, 1.6 * U, 0, 4.2 * U, -2 * U, 5); return g; } });
// ---------- (2026-11-17, a imagem do Thiago: a topografia de Mônaco) ----------
// a ROCHA calcária facetada (um icosaedro subdividido, deformado por um ruído fixo e achatado no chão), com o mato e as árvores por cima,
// e os MUROS da encosta: de pedra com balaustrada (reto e curvo), de concreto com pilastras, curvo com grade e escada, e o de arrimo inclinado.
const ROCHA = M(0xcbb79a, { flatShading: true, roughness: 1 }), ROCHA2 = M(0xb9a687, { flatShading: true, roughness: 1 }), MATO = M(0x5f7a34, { flatShading: true, roughness: 1 });
function rocha(w, h, d, semente, aspereza = 0.22) {
  const r = sorteio(semente), geo = new THREE.IcosahedronGeometry(1, 3), p = geo.attributes.position, ruido = new Map();
  const n = (x, y, z) => { const k = `${Math.round(x * 40)},${Math.round(y * 40)},${Math.round(z * 40)}`; if (!ruido.has(k)) ruido.set(k, r()); return ruido.get(k); }; // (o mesmo vértice repetido ganha o mesmo tremor: sem rachar a malha)
  for (let i = 0; i < p.count; i++) { let x = p.getX(i), y = p.getY(i), z = p.getZ(i); const f = 1 + (n(x, y, z) - 0.5) * aspereza * 2 + Math.sin(x * 5 + y * 3) * aspereza * 0.4;
    x *= f; z *= f; y = Math.max(-0.02, y * f); if (y > 0.55) y = 0.55 + (y - 0.55) * 0.35; // (o topo achata: dá para pôr mato e árvore)
    p.setXYZ(i, (x * w) / 2, (y / 0.75) * h, (z * d) / 2); }
  geo.computeVertexNormals(); return geo;
}
function topoVerde(g, w, d, h, n, semente, comArvores = true) {
  const r = sorteio(semente + 99); const m = malha(g, new THREE.CylinderGeometry(w * 0.36, w * 0.4, 0.6 * U, 9), MATO, 0, h * 0.98, 0); m.scale.z = d / w;
  for (let k = 0; k < n; k++) { const a = r() * Math.PI * 2, t = Math.sqrt(r()) * 0.3, x = Math.cos(a) * w * t, z = Math.sin(a) * d * t;
    const o = comArvores && k % 2 === 0 ? pinheiroManso(3 + r() * 3, semente + k) : arbusto(0x4f6b2c, null, 1 + r(), semente + k); o.position.set(x, h * 0.98, z); o.rotation.y = r() * 6; g.add(o); }
}
function arbustosNaRocha(g, w, d, h, n, semente) { const r = sorteio(semente + 7); for (let k = 0; k < n; k++) { const a = r() * Math.PI * 2, y = (0.15 + r() * 0.6) * h, o = arbusto(0x4a6a28, null, 0.9 + r() * 0.8, semente + 30 + k); o.position.set(Math.cos(a) * w * 0.47 * (1 - y / h * 0.3), y, Math.sin(a) * d * 0.47 * (1 - y / h * 0.3)); g.add(o); } }
function penhasco(w, h, d, semente, arvores = 8) { const g = new THREE.Group(); malha(g, rocha(w * U, h * U, d * U, semente), semente % 2 ? ROCHA : ROCHA2); topoVerde(g, w * U, d * U, h * U, arvores, semente); arbustosNaRocha(g, w * U, d * U, h * U, Math.round(arvores * 0.8), semente); return g; }
KITS.penhascoAlto = F("Geral", { nome: "Penhasco alto", grupo: "Relevo", montar: () => penhasco(24, 26, 20, 3, 8) });
KITS.penhascoMedio = F("Geral", { nome: "Penhasco médio com árvores", grupo: "Relevo", montar: () => penhasco(22, 16, 18, 6, 10) });
KITS.penhascoLargo = F("Geral", { nome: "Penhasco largo", grupo: "Relevo", montar: () => penhasco(40, 18, 26, 9, 12) });
KITS.rochaSolta = F("Geral", { nome: "Rocha grande", grupo: "Relevo", montar() { const g = new THREE.Group(); malha(g, rocha(14 * U, 12 * U, 11 * U, 12, 0.3), ROCHA2); arbustosNaRocha(g, 14 * U, 11 * U, 12 * U, 6, 12); return g; } });
// o rochedo: a encosta comprida em dois patamares, com mato, árvores, a fileira de prédios coloridos e o forte no alto
KITS.rochedo = F("Geral", { nome: "Rochedo com forte e casario", grupo: "Relevo", montar() {
  const g = new THREE.Group(), W = 120 * U;
  const base = malha(g, rocha(W, 14 * U, 40 * U, 21, 0.15), ROCHA); base.scale.z = 1;
  const meio = malha(g, rocha(70 * U, 34 * U, 30 * U, 22, 0.2), ROCHA2); meio.position.set(10 * U, 0, -4 * U);
  topoVerde(g, 120 * U, 40 * U, 14 * U, 14, 23);
  const alto = new THREE.Group(); topoVerde(alto, 70 * U, 30 * U, 34 * U, 10, 24); alto.position.set(10 * U, 0, -4 * U); g.add(alto);
  for (let i = 0; i < 5; i++) { const cores = ["#e08a6a", "#ecd9b8", "#e7a789", "#f0c46a", "#efe2c8"], p = predioClassico({ w: 9, d: 8, andares: 3 + (i % 3), cor: cores[i], chave: "rochedo" + i }); p.scale.setScalar(0.8); p.position.set(-50 * U + i * 9 * U, 13 * U + i * 2.5 * U, 4 * U); g.add(p); }
  const forte = new THREE.Group(), P = M(0xe9dcc4, { roughness: 0.95 }); caixa(forte, P, 22 * U, 7 * U, 12 * U, 0, 3.5 * U, 0); caixa(forte, P, 7 * U, 11 * U, 7 * U, -9 * U, 5.5 * U, 0); caixa(forte, P, 6 * U, 9 * U, 6 * U, 10 * U, 4.5 * U, -2 * U);
  for (let i = 0; i < 11; i++) caixa(forte, P, 1 * U, 1 * U, 12.4 * U, -10 * U + i * 2 * U, 7.5 * U, 0); const tel = malha(forte, new THREE.CylinderGeometry(0.01, 5 * U, 2.5 * U, 4), M(0xb5653d, { flatShading: true }), -9 * U, 12.3 * U, 0); tel.rotation.y = Math.PI / 4;
  forte.position.set(12 * U, 33 * U, -6 * U); g.add(forte);
  return g; } });
// a encosta com a estrada subindo, presa por um muro de arrimo de pedra
KITS.encostaEstrada = F("Geral", { nome: "Encosta com estrada e muro de arrimo", grupo: "Relevo", montar() {
  const g = penhasco(60, 14, 22, 31, 10), L = 60 * U, asf = M(0x4a4d52, { roughness: 0.95 });
  const rampa = caixa(g, asf, L, 0.4 * U, 7 * U, 0, 6 * U, 13 * U); rampa.rotation.z = Math.atan2(10 * U, L);
  const muro = caixa(g, new THREE.MeshStandardMaterial({ map: (() => { const t = texPedra(); t.repeat.set(12, 2); return t; })(), roughness: 1 }), L, 10 * U, 1 * U, 0, 1 * U, 16.6 * U); muro.rotation.z = Math.atan2(10 * U, L);
  caixa(g, M(0xe7e0d0), L, 0.6 * U, 1.2 * U, 0, 6.5 * U, 16.6 * U).rotation.z = Math.atan2(10 * U, L); return g; } });
// os muros
const texPedra = () => texCanvas("pedra-muro", 128, 128, (x, w, hh) => { x.fillStyle = "#a89b86"; x.fillRect(0, 0, w, hh); const r = sorteio(5);
  for (let y = 0; y < hh; y += 16) for (let xx = -(y % 32 ? 12 : 0); xx < w; xx += 18 + r() * 12) { const c = 150 + r() * 40 | 0; x.fillStyle = `rgb(${c + 10},${c},${c - 15})`; x.fillRect(xx + 1, y + 1, 16 + r() * 10, 14); } });
const PEDRA_M = () => { const t = texPedra(); t.repeat.set(4, 2); return new THREE.MeshStandardMaterial({ map: t, roughness: 1 }); };
const ARENITO = M(0xe7e0d0, { roughness: 0.9 });
function balaustrada(g, L, y, z, curvo = 0) {
  const n = Math.round(L / (0.45 * U));
  for (let i = 0; i <= n; i++) { const t = i / n - 0.5, [x, zz, a] = curvo ? [Math.sin(t * curvo) * L / curvo, z + (1 - Math.cos(t * curvo)) * L / curvo, t * curvo] : [t * L, z, 0]; const b = cil(g, ARENITO, 0.12 * U, 0.8 * U, x, y + 0.4 * U, zz, 6, 0.08 * U); b.rotation.y = a; }
  const segs = curvo ? 12 : 1; for (let k = 0; k < segs; k++) { const t0 = k / segs - 0.5, t1 = (k + 1) / segs - 0.5, P = (t) => curvo ? [Math.sin(t * curvo) * L / curvo, z + (1 - Math.cos(t * curvo)) * L / curvo] : [t * L, z];
    const [x0, z0] = P(t0), [x1, z1] = P(t1), c = caixa(g, ARENITO, Math.hypot(x1 - x0, z1 - z0) + 0.05 * U, 0.2 * U, 0.5 * U, (x0 + x1) / 2, y + 0.9 * U, (z0 + z1) / 2); c.rotation.y = -Math.atan2(z1 - z0, x1 - x0); }
}
KITS.muroPedraBalaustrada = F("Contenção", { nome: "Muro de pedra com balaustrada", grupo: "Cidade", montar() { const g = new THREE.Group(), L = 10 * U, h = 3.2 * U; caixa(g, PEDRA_M(), L, h, 0.8 * U, 0, h / 2, 0); caixa(g, ARENITO, L + 0.2 * U, 0.25 * U, 1 * U, 0, h, 0);
  for (const x of [-L / 2, L / 2]) caixa(g, ARENITO, 0.8 * U, h + 1.4 * U, 1 * U, x, (h + 1.4 * U) / 2, 0); balaustrada(g, L - 0.8 * U, h, 0); return g; } });
KITS.muroPedraCurvo = F("Contenção", { nome: "Muro de pedra curvo com balaustrada", grupo: "Cidade", angulo: 144, montar(graus = 144) {
  const g = new THREE.Group(), R = 6 * U, h = 3 * U, A = (Math.min(340, Math.max(10, graus)) * Math.PI) / 180, w = malha(g, new THREE.CylinderGeometry(R, R, h, 20, 1, true, -A / 2 + Math.PI, A), PEDRA_M(), 0, h / 2, R); w.material.side = THREE.DoubleSide;
  balaustrada(g, R * A, h, 0, A); for (const s of [-1, 1]) caixa(g, ARENITO, 0.8 * U, h + 1.4 * U, 0.8 * U, Math.sin((s * A) / 2) * R, (h + 1.4 * U) / 2, R - Math.cos((s * A) / 2) * R); return g; } });
KITS.muroConcretoPilastras = F("Contenção", { nome: "Muro de concreto com pilastras", grupo: "Cidade", montar() { const g = new THREE.Group(), L = 12 * U, h = 3.6 * U, C = M(0xc9c4b8, { roughness: 0.95 }); caixa(g, C, L, h, 0.6 * U, 0, h / 2, 0);
  for (let i = 0; i <= 3; i++) { const x = -L / 2 + (i * L) / 3; caixa(g, C, 0.9 * U, h + 0.4 * U, 0.9 * U, x, (h + 0.4 * U) / 2, 0); caixa(g, ARENITO, 1.1 * U, 0.25 * U, 1.1 * U, x, h + 0.5 * U, 0); } caixa(g, ARENITO, L, 0.2 * U, 0.75 * U, 0, h, 0); return g; } });
KITS.muroCurvoEscada = F("Contenção", { nome: "Muro curvo com grade e escada", grupo: "Cidade", angulo: 99, montar(graus = 99) {
  const g = new THREE.Group(), R = 7 * U, h = 3.4 * U, A = (Math.min(340, Math.max(10, graus)) * Math.PI) / 180, C = M(0xc9c4b8, { roughness: 0.95, side: THREE.DoubleSide }); malha(g, new THREE.CylinderGeometry(R, R, h, 16, 1, true, -A / 2 + Math.PI, A), C, 0, h / 2, R);
  for (let i = 0; i <= 14; i++) { const t = i / 14 - 0.5, x = Math.sin(t * A) * R, z = R - Math.cos(t * A) * R; cil(g, M(0x2c3a33, { metalness: 0.4 }), 0.04 * U, 1 * U, x, h + 0.5 * U, z, 4); }
  for (let k = 0; k < 10; k++) caixa(g, ARENITO, 1.6 * U, 0.34 * U, 0.6 * U, Math.sin(A / 2) * R + 1 * U, (k + 0.5) * 0.34 * U, R - Math.cos(A / 2) * R - k * 0.6 * U + 3 * U); return g; } });
KITS.muroArrimo = F("Contenção", { nome: "Muro de arrimo de pedra", grupo: "Cidade", montar() { const g = new THREE.Group(), L = 10 * U, h = 5 * U, s = new THREE.Shape([[0, 0], [1.6, 0], [0.6, 5], [0, 5]].map(([x, y]) => new THREE.Vector2(x * U, y * U)));
  const m = malha(g, new THREE.ExtrudeGeometry(s, { depth: L, bevelEnabled: false }), PEDRA_M(), -L / 2, 0, 0); m.rotation.y = Math.PI / 2; m.position.set(-L / 2, 0, 0.8 * U); return g; } });
// (2026-11-18, o Thiago: "um muro de arrimo com balaustrada como cerca, que fica curvo ao longo da pista") o arrimo inclinado de pedra com a
// cornija e a balaustrada em cima, 10 m; na Barreira na beira os módulos se emendam pela curva
KITS.muroArrimoBalaustrada = F("Contenção", { nome: "Muro de arrimo com balaustrada", grupo: "Cidade", montar() {
  const g = KITS.muroArrimo.montar(), L = 10 * U, h = 5 * U; caixa(g, ARENITO, L, 0.3 * U, 1.2 * U, 0, h + 0.15 * U, 0.5 * U); balaustrada(g, L, h + 0.3 * U, 0.5 * U); /* (o topo do arrimo vai de z 0,2 a 0,8 m: a cornija e a balaustrada no meio dele) */ return g; } });
KITS.muroPedraBaixoBalaustrada = F("Contenção", { nome: "Muro de pedra baixo com balaustrada", grupo: "Cidade", montar() { const g = new THREE.Group(), L = 10 * U, h = 1.4 * U; caixa(g, PEDRA_M(), L, h, 0.7 * U, 0, h / 2, 0); caixa(g, ARENITO, L + 0.1 * U, 0.2 * U, 0.85 * U, 0, h, 0); balaustrada(g, L, h + 0.1 * U, 0); return g; } });
// os penhascos com muro em cima (o terraço da imagem)
KITS.penhascoTerraco = F("Geral", { nome: "Penhasco com terraço e muro", grupo: "Relevo", montar() { const g = penhasco(30, 12, 22, 41, 6), m = KITS.muroPedraBalaustrada.montar(); m.scale.set(2.2, 1.4, 1); m.position.set(-2 * U, 11.5 * U, 6 * U); g.add(m); return g; } });
// (2026-11-18, o Thiago: "precisamos de uma ponte/pontilhão") as PONTES por cima da pista (vão de 30 a 40 m; a pista tem ~25 m): o pontilhão
// de pedra em arco com balaustrada, o viaduto de concreto em pilares, a passarela de pedestres de treliça e a ponte de ferro em arco
function vaoDeArco(L, h, flecha, prof) {
  const s = new THREE.Shape([[-L / 2 - 4 * U, 0], [L / 2 + 4 * U, 0], [L / 2 + 4 * U, h], [-L / 2 - 4 * U, h]].map(([x, y]) => new THREE.Vector2(x, y))), b = new THREE.Path();
  const topo = h - 1.6 * U, base = topo - flecha, r = (L * L / 4 + flecha * flecha) / (2 * flecha), yc = topo - r, a0 = Math.asin(L / 2 / r);
  b.moveTo(-L / 2, 0); b.lineTo(-L / 2, base); b.absarc(0, yc, r, Math.PI / 2 + a0, Math.PI / 2 - a0, true); b.lineTo(L / 2, 0); b.lineTo(-L / 2, 0); s.holes.push(b);
  const geo = new THREE.ExtrudeGeometry(s, { depth: prof, bevelEnabled: false, curveSegments: 24 }); geo.translate(0, 0, -prof / 2); return geo;
}
KITS.pontilhaoPedra = F("Geral", { nome: "Pontilhão de pedra em arco", grupo: "Cidade", montar() {
  const g = new THREE.Group(), L = 30 * U, h = 12 * U, P = 7 * U; malha(g, vaoDeArco(L, h, 4 * U, P), PEDRA_M());
  caixa(g, ARENITO, L + 8.4 * U, 0.4 * U, P + 0.4 * U, 0, h + 0.2 * U, 0); for (const z of [-P / 2 + 0.3 * U, P / 2 - 0.3 * U]) balaustrada(g, L + 8 * U, h + 0.4 * U, z);
  for (const x of [-L / 2, L / 2]) caixa(g, ARENITO, 1.2 * U, h, P + 0.6 * U, x + Math.sign(x) * 0.6 * U, h / 2, 0); return g; } });
KITS.viadutoConcreto = F("Geral", { nome: "Viaduto de concreto", grupo: "Cidade", montar() {
  const g = new THREE.Group(), L = 40 * U, h = 9 * U, P = 10 * U, C = M(0xbfbcb5, { roughness: 0.95 }); caixa(g, C, L, 1.6 * U, P, 0, h + 0.8 * U, 0); caixa(g, M(0x3b3c3e, { roughness: 0.95 }), L, 0.1 * U, P - 1 * U, 0, h + 1.65 * U, 0);
  for (const x of [-L / 2 + 2 * U, L / 2 - 2 * U]) for (const z of [-P / 3, P / 3]) cil(g, C, 0.7 * U, h, x, h / 2, z, 12);
  for (const z of [-P / 2 + 0.2 * U, P / 2 - 0.2 * U]) { caixa(g, C, L, 1 * U, 0.3 * U, 0, h + 2.1 * U, z); caixa(g, GRADIL, L, 0.06 * U, 0.06 * U, 0, h + 3 * U, z); } return g; } });
KITS.passarela = F("Geral", { nome: "Passarela de pedestres", grupo: "Público", montar() {
  const g = new THREE.Group(), L = 32 * U, h = 7 * U, P = 3 * U, B = M(0xf2f2f0, { metalness: 0.3, roughness: 0.5 }); caixa(g, B, L, 0.4 * U, P, 0, h, 0);
  for (const z of [-P / 2, P / 2]) { for (const y of [h + 0.2 * U, h + 2.6 * U]) caixa(g, B, L, 0.25 * U, 0.25 * U, 0, y, z); for (let i = 0; i <= 16; i++) { const d = caixa(g, B, 0.15 * U, 2.6 * U, 0.15 * U, -L / 2 + (i * L) / 16, h + 1.4 * U, z); if (i % 2) d.rotation.z = 0.5; } }
  caixa(g, VIDRO, L, 2.4 * U, P, 0, h + 1.5 * U, 0); caixa(g, B, L, 0.2 * U, P + 0.3 * U, 0, h + 2.8 * U, 0);
  for (const x of [-L / 2, L / 2]) { caixa(g, B, 3 * U, h, 3 * U, x + Math.sign(x) * 1.5 * U, h / 2, 0); caixa(g, VIDRO, 3.1 * U, h * 0.8, 3.1 * U, x + Math.sign(x) * 1.5 * U, h * 0.5, 0); } return g; } });
KITS.ponteFerro = F("Geral", { nome: "Ponte de ferro em arco", grupo: "Cidade", montar() {
  const g = new THREE.Group(), L = 36 * U, h = 8 * U, P = 8 * U, FE = M(0x3d5a4c, { metalness: 0.6, roughness: 0.45 }), C = M(0xbfbcb5, { roughness: 0.95 }); caixa(g, C, L, 1 * U, P, 0, h, 0);
  for (const x of [-L / 2, L / 2]) caixa(g, C, 3 * U, h + 0.5 * U, P + 1 * U, x, (h + 0.5 * U) / 2, 0);
  for (const z of [-P / 2, P / 2]) { const n = 20; let ant = null; for (let i = 0; i <= n; i++) { const t = i / n, x = -L / 2 + t * L, y = h + 0.5 * U + Math.sin(t * Math.PI) * 7 * U;
    if (ant) { const d = Math.hypot(x - ant[0], y - ant[1]), b = caixa(g, FE, d + 0.1 * U, 0.6 * U, 0.6 * U, (x + ant[0]) / 2, (y + ant[1]) / 2, z); b.rotation.z = Math.atan2(y - ant[1], x - ant[0]); }
    if (i && i < n) caixa(g, FE, 0.15 * U, y - h - 0.5 * U, 0.15 * U, x, (y + h + 0.5 * U) / 2, z); ant = [x, y]; } }
  return g; } });
// os FILTROS do editor (2026-11-17, o Thiago): cada peça num tipo de construção. As que não dizem o filtro caem pelo id ou pelo grupo.
export const FILTROS = ["Arquibancadas", "Automóveis", "Contenção", "Paddock", "Vegetação", "Geral"];
const PELO_ID = { arquibancada: "Arquibancadas", arquibancadaGrande: "Arquibancadas", pneus: "Contenção", tecpro: "Contenção", grade: "Contenção", guardrail: "Contenção", cone: "Contenção",
  carroBranco: "Automóveis", carroVermelho: "Automóveis", carroAzul: "Automóveis", caminhaoBau: "Automóveis", caminhaoCinza: "Automóveis", caminhaoPrancha: "Automóveis", ambulancia: "Automóveis", telehandler: "Automóveis", iate: "Automóveis",
  tenda: "Paddock", container: "Paddock", torreControle: "Paddock", hospitalidade: "Paddock", grua: "Paddock", heliponto: "Paddock" };
export function filtroDoKit(id) { const k = KITS[id]; return k?.filtro || PELO_ID[id] || (k?.grupo === "Natureza" ? "Vegetação" : "Geral"); }
// (2026-11-18, TabbaTracks: desempenho) cada peça é MONTADA uma vez só (as malhas, os materiais e as texturas de canvas) e as próximas são cópias
// que dividem a geometria e o material: uma fileira de 300 módulos de guard-rail montava 300 vezes tudo. Ninguém mexe na geometria no lugar (o
// enxugar e o fundir.js fazem cópias) e quem tinge clona o material antes. As peças não têm sorteio: a cópia é igual a uma montagem nova.
const moldes = new Map();
// (2026-11-18, o Thiago: "nas peças curvas, poder escolher o ângulo, mais aberto ou fechado") a peça com `angulo` (graus) aceita outro ângulo
export function montarKit(id, angulo) {
  const k = KITS[id]; if (!k) return null;
  const a = k.angulo && angulo != null && +angulo !== k.angulo ? +angulo : null, chave = a == null ? id : id + "@" + a;
  let m = moldes.get(chave); if (!m) { m = a == null ? k.montar() : k.montar(a); m.name = "kit-" + id; moldes.set(chave, m); }
  return m.clone(true);
}
