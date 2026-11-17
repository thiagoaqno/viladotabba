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
export function montarKit(id) { const k = KITS[id]; if (!k) return null; const g = k.montar(); g.name = "kit-" + id; return g; }
