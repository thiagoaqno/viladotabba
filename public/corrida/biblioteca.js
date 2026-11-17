// A BIBLIOTECA do editor de cenário (2026-11-16, o Thiago: "faz a biblioteca, e coloca lá coisas já prontas"): peças de pista montadas em
// código, sem baixar modelo, para pôr com um clique (editor/editor.js) e montar no jogo pelo cenario/<pista>.json ({ tipo: "kit", kit: <id> }).
// Tudo em unidades do jogo (1 m ≈ 4,8 u), apoiado em y = 0 e com a frente para +z. Materiais compartilhados por peça (o fundir.js junta).
import * as THREE from "three";

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
  portico: { nome: "Pórtico (largada)", grupo: "Pista", montar() { const g = new THREE.Group(), w = 30 * U, h = 7 * U; for (const x of [-w / 2, w / 2]) caixa(g, CINZA, 0.8 * U, h, 0.8 * U, x, h / 2, 0); caixa(g, ESCURO, w, 1.4 * U, 0.6 * U, 0, h, 0); for (let i = 0; i < 5; i++) cil(g, VERMELHO, 0.25 * U, 0.1 * U, (i - 2) * 1.2 * U, h, 0.35 * U, 12).rotation.x = Math.PI / 2; return g; } },
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
export function montarKit(id) { const k = KITS[id]; if (!k) return null; const g = k.montar(); g.name = "kit-" + id; return g; }
