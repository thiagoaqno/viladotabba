// Corrida da Galera — partículas: os cacos coloridos da caixa, a explosão da bomba, as faíscas da derrapagem e do
// muro e o brilho da estrela. Só enfeite: nada disso vai para o servidor.
import * as THREE from "three";
import { scene } from "./cena.js";

const pedacos = [], geo = new THREE.BoxGeometry(1, 1, 1), mats = new Map();
const mat = (c) => { if (!mats.has(c)) mats.set(c, new THREE.MeshBasicMaterial({ color: c, transparent: true, depthWrite: false })); return mats.get(c); };
const reduz = matchMedia("(prefers-reduced-motion: reduce)");
// n pedaços saindo de (x, y, z) (no 3D: y é a altura), cores alternadas
export function estourar(x, y, z, cores, n = 20, vel = 60, vida = 0.8, grav = 90, tam = 2.2) {
  if (reduz.matches) n = Math.ceil(n / 4);
  for (let i = 0; i < n; i++) {
    if (pedacos.length > 420) { const o = pedacos.shift(); scene.remove(o.m); }
    const m = new THREE.Mesh(geo, mat(cores[i % cores.length])); m.position.set(x, y, z); m.scale.setScalar(tam * (0.5 + Math.random() * 0.8));
    const a = Math.random() * Math.PI * 2, s = vel * (0.35 + Math.random() * 0.65), u = Math.random();
    pedacos.push({ m, vx: Math.cos(a) * s, vy: vel * (0.25 + u * 0.75), vz: Math.sin(a) * s, t: vida * (0.6 + Math.random() * 0.4), grav, giro: (Math.random() - 0.5) * 14, chao: y - 30 });
    scene.add(m);
  }
}
// bola de fogo que cresce e some, com fumaça e cacos
const bolas = [];
export function explodir(x, y, z, raio = 70) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshBasicMaterial({ color: 0xffa020, transparent: true, opacity: 0.9, depthWrite: false }));
  m.position.set(x, y + 6, z); scene.add(m); bolas.push({ m, t: 0, raio });
  estourar(x, y + 8, z, ["#ff8a00", "#ffd84a", "#ff3b1f", "#3a3a3a"], 46, 110, 1.1, 120, 4);
}
// FAÍSCAS (o assoalho raspando, a derrapagem, o carro com estrela): riscos de luz, não cubos. Cada faísca é um segmento de linha da
// posição até onde ela estava 0,03 s antes (o rastro que o olho vê numa faísca de verdade), com mistura aditiva e sem ajuste de tons:
// nasce branca-quente e esfria para a cor (laranja, no titânio do assoalho) e depois para o vermelho escuro, e a claridade acima de 1
// é o que o bloom do pós (pos.js) pega, um brilho leve. Ela sai com a velocidade do carro (op.vx, op.vz: u/s, o mundo), freia no ar,
// cai e quica no asfalto. Uma malha só para todas (LineSegments, até MAX_FAISCAS): uma chamada de desenho.
const MAX_FAISCAS = 700, RASTRO = 0.03, fPos = new Float32Array(MAX_FAISCAS * 6), fCor = new Float32Array(MAX_FAISCAS * 6), fs = [];
const fGeo = new THREE.BufferGeometry();
fGeo.setAttribute("position", new THREE.BufferAttribute(fPos, 3).setUsage(THREE.DynamicDrawUsage));
fGeo.setAttribute("color", new THREE.BufferAttribute(fCor, 3).setUsage(THREE.DynamicDrawUsage));
fGeo.setDrawRange(0, 0);
const fMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
const fLinhas = new THREE.LineSegments(fGeo, fMat); fLinhas.frustumCulled = false; fLinhas.renderOrder = 5; fLinhas.name = "faiscas";
scene.add(fLinhas);
const _c = new THREE.Color(), BRANCO = new THREE.Color(1, 0.96, 0.86), BRASA = new THREE.Color(0.55, 0.06, 0.01);
export function faiscas(x, y, z, cor, n = 3, vel = 30, op = {}) {
  if (reduz.matches) n = Math.ceil(n / 3);
  const base = new THREE.Color(cor), cvx = op.vx || 0, cvz = op.vz || 0;
  for (let i = 0; i < n; i++) {
    if (fs.length >= MAX_FAISCAS) fs.shift();
    const a = Math.random() * Math.PI * 2, s = vel * (0.4 + Math.random() * 1.2), vida = 0.22 + Math.random() * 0.38, k = 0.7 + Math.random() * 0.25;
    fs.push({ x, y, z, vx: cvx * k + Math.cos(a) * s, vy: vel * (0.3 + Math.random() * 1.1), vz: cvz * k + Math.sin(a) * s, t: vida, t0: vida, chao: y - 1.5, base });
  }
}
function passoFaiscas(dt) {
  const ar = Math.exp(-dt * 2.6);
  let j = 0;
  for (let i = 0; i < fs.length; i++) {
    const p = fs[i]; p.t -= dt; if (p.t <= 0) continue;
    p.vx *= ar; p.vz *= ar; p.vy -= 75 * dt;
    p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
    if (p.y < p.chao) { p.y = p.chao; p.vy = Math.abs(p.vy) * 0.3; p.vx *= 0.75; p.vz *= 0.75; } // quica no asfalto
    fs[j++] = p;
    const u = p.t / p.t0, quente = u * u; // 1 = acabou de nascer
    _c.copy(BRASA).lerp(p.base, Math.min(1, u * 1.6)).lerp(BRANCO, Math.max(0, quente - 0.35) * 1.5).multiplyScalar(0.25 + 2.6 * u); // branca-quente → a cor → brasa, e apagando
    const o = (j - 1) * 6;
    fPos[o] = p.x; fPos[o + 1] = p.y; fPos[o + 2] = p.z;
    fPos[o + 3] = p.x - p.vx * RASTRO; fPos[o + 4] = p.y - p.vy * RASTRO; fPos[o + 5] = p.z - p.vz * RASTRO;
    fCor[o] = _c.r; fCor[o + 1] = _c.g; fCor[o + 2] = _c.b; fCor[o + 3] = _c.r * 0.15; fCor[o + 4] = _c.g * 0.15; fCor[o + 5] = _c.b * 0.15; // a ponta de trás do risco, quase apagada
  }
  fs.length = j;
  fGeo.setDrawRange(0, j * 2);
  if (j) { fGeo.attributes.position.needsUpdate = true; fGeo.attributes.color.needsUpdate = true; }
}
// o "POW!" de história em quadrinhos em cima de quem foi atingido: cresce num pulo e some
const powTex = (() => {
  const c = document.createElement("canvas"); c.width = 256; c.height = 160; const x = c.getContext("2d");
  x.translate(128, 80); x.beginPath(); for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2, r = i % 2 ? 52 : 78; x.lineTo(Math.cos(a) * r * 1.5, Math.sin(a) * r); } x.closePath();
  x.fillStyle = "#ffd23f"; x.fill(); x.lineWidth = 7; x.strokeStyle = "#1b1440"; x.stroke();
  x.font = "900 64px Bungee, Impact, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.lineWidth = 10; x.strokeText("POW!", 0, 4); x.fillStyle = "#e63946"; x.fillText("POW!", 0, 4);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
const pows = [];
export function pow(x, y, z) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: powTex, transparent: true, depthTest: false })); s.position.set(x, y, z); s.renderOrder = 6; scene.add(s); pows.push({ s, t: 0 });
}
// Uma peça escondida de cada efeito, para a largada já compilar os shaders deles (aquecerPista, em jogo.js): sem isso, o
// primeiro caco, a primeira explosão e o primeiro "POW!" da corrida travavam um quadro.
export function amostrasDeEfeitos() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geo, mat("#ffffff")));
  { const gl = new THREE.BufferGeometry(); gl.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3)); gl.setAttribute("color", new THREE.BufferAttribute(new Float32Array(6), 3)); g.add(new THREE.LineSegments(gl, fMat)); } // o sombreador das faíscas
  g.add(new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffa020, transparent: true, opacity: 0.9, depthWrite: false })));
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: powTex, transparent: true, depthTest: false })); s.renderOrder = 6; g.add(s);
  g.traverse((o) => { o.visible = false; });
  return g;
}
export function passoEfeitos(dt) {
  passoFaiscas(dt);
  for (let i = pows.length - 1; i >= 0; i--) {
    const p = pows[i]; p.t += dt;
    if (p.t > 0.9) { scene.remove(p.s); p.s.material.dispose(); pows.splice(i, 1); continue; }
    const k = Math.min(1, p.t / 0.15), e = k < 1 ? k * 1.25 : 1.25 - Math.min(0.25, (p.t - 0.15) * 2); // estoura maior e assenta
    p.s.scale.set(34 * e, 21 * e, 1); p.s.position.y += dt * 10; p.s.material.opacity = p.t > 0.6 ? (0.9 - p.t) / 0.3 : 1; p.s.material.rotation = Math.sin(p.t * 20) * 0.08;
  }
  for (let i = pedacos.length - 1; i >= 0; i--) {
    const p = pedacos[i]; p.t -= dt;
    if (p.t <= 0) { scene.remove(p.m); pedacos.splice(i, 1); continue; }
    p.vy -= p.grav * dt; p.m.position.x += p.vx * dt; p.m.position.y = Math.max(p.chao, p.m.position.y + p.vy * dt); p.m.position.z += p.vz * dt;
    p.m.rotation.x += p.giro * dt; p.m.rotation.y += p.giro * dt;
    if (p.t < 0.2) p.m.scale.multiplyScalar(0.88);
  }
  for (let i = bolas.length - 1; i >= 0; i--) {
    const b = bolas[i]; b.t += dt; const k = b.t / 0.55;
    if (k >= 1) { scene.remove(b.m); b.m.geometry.dispose(); b.m.material.dispose(); bolas.splice(i, 1); continue; }
    b.m.scale.setScalar(b.raio * Math.sqrt(k)); b.m.material.opacity = 0.9 * (1 - k); b.m.material.color.setHSL(0.08 - k * 0.06, 1, 0.55 - k * 0.2);
  }
}
export function limparEfeitos() { fs.length = 0; fGeo.setDrawRange(0, 0); for (const p of pows) scene.remove(p.s); pows.length = 0; for (const p of pedacos) scene.remove(p.m); pedacos.length = 0; for (const b of bolas) scene.remove(b.m); bolas.length = 0; }
