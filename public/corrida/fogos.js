// Corrida da Galera — FOGOS DE ARTIFÍCIO nas pistas de noite (2026-11-23, o Thiago: "coloca fogos nas pistas de noite, coloca bloom neles").
// Com a sala de noite (tr.noite: Las Vegas, Singapura, Baku, Bahrein, Abu Dhabi, Catar... ou qualquer pista com a hora "noite"), de tempos em
// tempos sobe um foguete de algum lado da pista, perto de quem a câmera segue, e estoura no céu; na bandeirada (a minha, ou a tela do
// resultado) vem a salva grande. Tudo num Points só (até MAX faíscas), com mistura aditiva e sem ajuste de tons: a cor passa de 1 no pós e o
// bloom (pos.js, userData.bloom) faz o brilho. Quatro tipos de estouro: a peônia (esfera), o anel, o salgueiro (dourado, cai devagar e
// demora a apagar) e o crisântemo (crepita no fim). O som (sons.js, Sound.fogos) chega atrasado pela distância, como o trovão.
// Com "reduzir movimento": bem menos fogos, sem a salva.
import * as THREE from "three";
import { scene } from "./cena.js";
import { Sound } from "./sons.js";

const MAX = 3000, G = 60; // as faíscas, a gravidade (u/s²: 1 u ≈ 0,21 m)
const P = new Float32Array(MAX * 3), V = new Float32Array(MAX * 3), C = new Float32Array(MAX * 3), C0 = new Float32Array(MAX * 3), vida = new Float32Array(MAX), vida0 = new Float32Array(MAX), arrasto = new Float32Array(MAX), pisca = new Uint8Array(MAX);
let usadas = 0;
const geo = new THREE.BufferGeometry();
const aPos = new THREE.BufferAttribute(P, 3).setUsage(THREE.DynamicDrawUsage), aCor = new THREE.BufferAttribute(C, 3).setUsage(THREE.DynamicDrawUsage);
geo.setAttribute("position", aPos); geo.setAttribute("color", aCor); geo.setDrawRange(0, 0);
const ponto = (() => { const cv = document.createElement("canvas"); cv.width = cv.height = 32; const x = cv.getContext("2d"), g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, "#fff"); g.addColorStop(0.25, "#ffffffcc"); g.addColorStop(1, "#ffffff00"); x.fillStyle = g; x.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(cv); })();
const mat = new THREE.PointsMaterial({ size: 9, map: ponto, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false, sizeAttenuation: true });
mat.userData.bloom = 3;
const nuvem = new THREE.Points(geo, mat); nuvem.frustumCulled = false; nuvem.name = "fogos"; nuvem.renderOrder = 5;

const CORES = [[1, 0.25, 0.2], [1, 0.75, 0.2], [0.3, 0.6, 1], [0.35, 1, 0.45], [0.9, 0.35, 1], [1, 1, 1], [1, 0.45, 0.75], [0.3, 1, 1]];
const OURO = [1, 0.7, 0.3];
const reduz = matchMedia("(prefers-reduced-motion: reduce)");
let foguetes = [], proximo = 3, trAtual = null, fimVisto = false, salva = 0;

function faisca(x, y, z, vx, vy, vz, cor, t, dr = 1.6, br = 1) {
  let i = usadas < MAX ? usadas++ : Math.floor(Math.random() * MAX); // (cheio: troca uma qualquer)
  const o = i * 3; P[o] = x; P[o + 1] = y; P[o + 2] = z; V[o] = vx; V[o + 1] = vy; V[o + 2] = vz;
  C0[o] = cor[0] * br; C0[o + 1] = cor[1] * br; C0[o + 2] = cor[2] * br; vida[i] = vida0[i] = t; arrasto[i] = dr; pisca[i] = 0; return i;
}
function estourar(f, cam) {
  const tipo = f.tipo, cor = f.cor, cor2 = f.cor2, n = tipo === "anel" ? 110 : tipo === "salgueiro" ? 160 : 190, vel = 95 + Math.random() * 45;
  const ex = Math.random() * 6.28, ey = Math.random() * 6.28; // (a inclinação do anel)
  for (let k = 0; k < n; k++) {
    let dx, dy, dz;
    if (tipo === "anel") { const a = (k / n) * 6.2832; dx = Math.cos(a); dy = Math.sin(a) * Math.cos(ex); dz = Math.sin(a) * Math.sin(ex) + Math.cos(a) * 0.15 * Math.sin(ey); }
    else { const u = Math.random() * 2 - 1, a = Math.random() * 6.2832, r = Math.sqrt(1 - u * u); dx = r * Math.cos(a); dy = u; dz = r * Math.sin(a); }
    const s = vel * (tipo === "anel" ? 1 : 0.75 + Math.random() * 0.25), c = tipo === "salgueiro" ? OURO : (k % 3 === 0 && cor2 ? cor2 : cor);
    const i = faisca(f.x, f.y, f.z, dx * s, dy * s, dz * s, c, tipo === "salgueiro" ? 3.2 + Math.random() : 1.5 + Math.random() * 0.6, tipo === "salgueiro" ? 2.6 : 1.7, tipo === "salgueiro" ? 1.6 : 2.2);
    if (tipo === "crisantemo") pisca[i] = 1;
  }
  for (let k = 0; k < 14; k++) faisca(f.x, f.y, f.z, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30, [1, 1, 1], 0.18, 4, 4); // o clarão do estouro
  const d = cam ? Math.hypot(cam.position.x - f.x, cam.position.y - f.y, cam.position.z - f.z) : 1500;
  Sound.fogos?.(tipo, d * 0.2083);
}
function lancar(tr, cam, idx) {
  const n = tr.n || tr.pts.length, i = ((idx + Math.floor((Math.random() * 2 - 1) * 160)) % n + n) % n, q = tr.pts[i]; if (!q) return;
  const lado = Math.random() < 0.5 ? -1 : 1, off = (tr.W || 120) / 2 + 350 + Math.random() * 900, chao = q.h || 0;
  const x = q.x + (q.nx || 0) * lado * off, z = q.y + (q.ny || 0) * lado * off, alt = chao + 280 + Math.random() * 260;
  const tipos = ["peonia", "peonia", "anel", "salgueiro", "crisantemo"], cor = CORES[(Math.random() * CORES.length) | 0];
  foguetes.push({ x, y: chao + 5, z, alvo: alt, vy: 260 + Math.random() * 60, tipo: tipos[(Math.random() * tipos.length) | 0], cor, cor2: Math.random() < 0.4 ? CORES[(Math.random() * CORES.length) | 0] : null, rastro: 0 });
  if (cam) Sound.fogosSobe?.(Math.hypot(cam.position.x - x, cam.position.z - z) * 0.2083);
}
// a cada quadro (jogo.js, depois do clima): `fim` = a bandeirada (a minha ou a tela do resultado), `idx` = o ponto da pista de quem a câmera segue
export function passoFogos(dt, race, cam, idx, fim) {
  const tr = race && race.tr;
  if (tr !== trAtual) { limparFogos(); trAtual = tr; fimVisto = false; }
  const noite = !!(tr && tr.noite);
  if (!noite && !usadas && !foguetes.length) { if (nuvem.parent) nuvem.removeFromParent(); return; }
  if (!nuvem.parent) scene.add(nuvem);
  if (noite) {
    if (fim && !fimVisto) { fimVisto = true; salva = reduz.matches ? 0 : 16; } // a salva da bandeirada: ~16 s de fogos seguidos
    if (salva > 0) salva -= dt;
    proximo -= dt;
    if (proximo <= 0) {
      const n = salva > 0 ? 2 + ((Math.random() * 3) | 0) : Math.random() < 0.25 ? 3 : 1;
      for (let k = 0; k < n; k++) lancar(tr, cam, idx);
      proximo = salva > 0 ? 0.35 + Math.random() * 0.5 : (reduz.matches ? 14 : 4) + Math.random() * (reduz.matches ? 20 : 7);
    }
  }
  // os foguetes subindo, com o rastro
  for (let k = foguetes.length - 1; k >= 0; k--) {
    const f = foguetes[k]; f.y += f.vy * dt; f.vy = Math.max(60, f.vy - G * 0.8 * dt); f.rastro -= dt;
    if (f.rastro <= 0) { f.rastro = 0.025; faisca(f.x + (Math.random() - 0.5) * 2, f.y, f.z + (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 6, -10, (Math.random() - 0.5) * 6, OURO, 0.5, 2, 1.4); }
    if (f.y >= f.alvo) { estourar(f, cam); foguetes.splice(k, 1); }
  }
  // as faíscas: andam, caem, freiam no ar e apagam (o crisântemo crepita no fim)
  let vivas = 0;
  for (let i = 0; i < usadas; i++) {
    if (vida[i] <= 0) continue;
    vida[i] -= dt; const o = i * 3, t = Math.max(0, vida[i] / vida0[i]), a = Math.exp(-arrasto[i] * dt);
    V[o] *= a; V[o + 1] = V[o + 1] * a - G * dt; V[o + 2] *= a;
    P[o] += V[o] * dt; P[o + 1] += V[o + 1] * dt; P[o + 2] += V[o + 2] * dt;
    let b = t < 0.35 ? t / 0.35 : 1; if (pisca[i] && t < 0.45) b *= Math.random() < 0.5 ? 1.6 : 0.1;
    C[o] = C0[o] * b; C[o + 1] = C0[o + 1] * b; C[o + 2] = C0[o + 2] * b;
    if (vida[i] <= 0) { C[o] = C[o + 1] = C[o + 2] = 0; P[o + 1] = -1e5; } else vivas++;
  }
  if (!vivas && !foguetes.length) usadas = 0;
  geo.setDrawRange(0, usadas); aPos.needsUpdate = true; aCor.needsUpdate = true;
}
export function limparFogos() { foguetes = []; usadas = 0; vida.fill(0); geo.setDrawRange(0, 0); proximo = 3; salva = 0; if (nuvem.parent) nuvem.removeFromParent(); }
