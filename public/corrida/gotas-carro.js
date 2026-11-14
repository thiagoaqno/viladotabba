// Corrida da Galera — as GOTAS EM CIMA DO CARRO na chuva (pedido do Thiago, 2026-11-13: "gotas se acumulam gradualmente no carro" e "as
// gotas devem ficar em cima do carro"): gotinhas de água paradas na carroceria do carro que a câmera segue, só nas superfícies viradas para
// cima (bico, asas, laterais, tampa do motor). Elas vão aparecendo aos poucos enquanto chove (o nível sobe em ~30 s) e somem devagar quando
// para (~90 s). Um Points só, preso no modelo do carro (`kt.carro`, em metros), com um material dividido por todos.
// Os pontos saem dos vértices do modelo, uma vez por modelo: os mais altos de cada quadradinho de 6 cm, com a normal para cima
// (sem rodas e sem o piloto). O material entra no aquecimento da chuva (clima-visual.js `ligarChuvaDeEnsaio`), para não compilar na hora.
import * as THREE from "three";

const MAX = 420, CELULA = 0.06, TAM_M = 0.022; // gotas por carro; o quadradinho da busca (m); o tamanho de uma gota média (m)
const lim = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);

export const materialGotas = new THREE.ShaderMaterial({
  uniforms: { uNivel: { value: 0 }, uEscala: { value: 600 }, uMundo: { value: 1 } },
  vertexShader: /* glsl */ `
    attribute float aLim; attribute float aTam; uniform float uNivel; uniform float uEscala; uniform float uMundo; varying float vA;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
      float on = smoothstep(aLim, aLim + 0.06, uNivel); vA = on;
      gl_PointSize = on > 0.0 ? clamp(aTam * uMundo * uEscala / max(0.5, -mv.z), 0.0, 24.0) : 0.0;
    }`,
  fragmentShader: /* glsl */ `
    varying float vA;
    void main() {
      vec2 p = gl_PointCoord * 2.0 - 1.0; float r = dot(p, p); if (r > 1.0 || vA <= 0.0) discard;
      float borda = smoothstep(0.55, 1.0, r), brilho = 1.0 - smoothstep(0.0, 0.12, dot(p - vec2(-0.32, -0.36), p - vec2(-0.32, -0.36)));
      vec3 cor = mix(vec3(0.62, 0.7, 0.8), vec3(0.08, 0.1, 0.14), borda) + brilho * 0.9;
      gl_FragColor = vec4(cor, vA * (0.32 + 0.4 * borda + 0.5 * brilho));
    }`,
  transparent: true, depthWrite: false,
});

// os pontos de um modelo (cache pelo objeto do modelo): { pos, lim, tam }
const CACHE = new WeakMap();
function pontosDe(kt) {
  const chave = kt.modelo || kt.carro; let r = CACHE.get(chave); if (r) return r;
  const carro = kt.carro; carro.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(carro.matrixWorld).invert(), M = new THREE.Matrix4(), N = new THREE.Matrix3(), v = new THREE.Vector3(), nrm = new THREE.Vector3();
  const fora = new Set(); for (const rd of kt.rodas || []) rd.traverse?.((o) => fora.add(o));
  const topo = new Map(), cand = [];
  carro.traverse((o) => {
    if (!o.isMesh || fora.has(o) || /piloto|antebraco|maos|lanterna|capacete|viseira/i.test(o.name || "") || /piloto|antebracos/i.test(o.parent?.name || "")) return;
    const g = o.geometry, P = g && g.attributes.position, Nn = g && g.attributes.normal; if (!P || !Nn) return;
    M.multiplyMatrices(inv, o.matrixWorld); N.getNormalMatrix(M);
    const passo = Math.max(1, Math.floor(P.count / 6000)); // (modelos pesados: uma amostra dos vértices basta)
    for (let i = 0; i < P.count; i += passo) {
      v.fromBufferAttribute(P, i).applyMatrix4(M); nrm.fromBufferAttribute(Nn, i).applyMatrix3(N).normalize();
      const k = Math.round(v.x / CELULA) + "," + Math.round(v.z / CELULA), t = topo.get(k);
      if (t === undefined || v.y > t) topo.set(k, v.y);
      if (nrm.y > 0.55) cand.push(v.x, v.y, v.z, k);
    }
  });
  const pos = [];
  for (let i = 0; i < cand.length; i += 4) if (cand[i + 1] >= topo.get(cand[i + 3]) - 0.015) pos.push(cand[i], cand[i + 1] + 0.004, cand[i + 2]);
  // sorteia até MAX (sempre os mesmos para o mesmo modelo: o sorteio é por índice)
  const n = pos.length / 3, escolhidos = [];
  for (let i = 0; i < n; i++) escolhidos.push(i);
  for (let i = escolhidos.length - 1; i > 0; i--) { const j = Math.floor(((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1 * (i + 1)); [escolhidos[i], escolhidos[j]] = [escolhidos[j], escolhidos[i]]; }
  const m = Math.min(MAX, n), P = new Float32Array(m * 3), L = new Float32Array(m), T = new Float32Array(m);
  for (let k = 0; k < m; k++) { const i = escolhidos[k]; P.set(pos.slice(i * 3, i * 3 + 3), k * 3); L[k] = (k + 0.5) / m * 0.94; T[k] = TAM_M * (0.55 + 0.9 * (((Math.sin(k * 78.233) * 43758.5453) % 1 + 1) % 1)); }
  r = { P, L, T }; CACHE.set(chave, r); return r;
}

let alvo = null, pontos = null, nivel = 0;
const tamBuf = new THREE.Vector2(), escala = new THREE.Vector3();
// por quadro (clima-visual.js): `kart` é o carro que a câmera segue (ou null); `chuva` a força da chuva agora (já suavizada); `coberto`: no túnel
export function passoGotasCarro(dt, kart, chuva, coberto, renderer, cam) {
  const meta = chuva > 0.02 && !coberto ? 0.3 + 0.7 * lim(chuva) : 0;
  nivel += (meta - nivel) * (1 - Math.exp(-dt / (meta > nivel ? 30 : 90)));
  if (nivel < 0.005 && meta === 0) { nivel = 0; if (pontos) pontos.visible = false; return; }
  const kt = kart && kart.kt; if (!kt || !kt.carro) { if (pontos) pontos.visible = false; return; }
  if (alvo !== kt) {
    if (pontos) pontos.removeFromParent();
    alvo = kt; pontos = null;
    try {
      const { P, L, T } = pontosDe(kt); if (!L.length) return;
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(P, 3)); g.setAttribute("aLim", new THREE.BufferAttribute(L, 1)); g.setAttribute("aTam", new THREE.BufferAttribute(T, 1));
      pontos = new THREE.Points(g, materialGotas); pontos.frustumCulled = false; pontos.renderOrder = 4; pontos.name = "gotas-carro"; kt.carro.add(pontos);
    } catch (e) { console.warn("Corrida: gotas no carro", e); return; }
  }
  if (!pontos) return;
  pontos.visible = true; materialGotas.uniforms.uNivel.value = nivel;
  kt.carro.getWorldScale(escala); materialGotas.uniforms.uMundo.value = escala.x;
  renderer.getDrawingBufferSize(tamBuf); materialGotas.uniforms.uEscala.value = tamBuf.y / (2 * Math.tan((cam.fov * Math.PI) / 360));
}
export function limparGotasCarro() { if (pontos) pontos.removeFromParent(); pontos = null; alvo = null; nivel = 0; }
// um ponto só, para o aquecimento da chuva compilar o material
export const amostraGotas = (() => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3), 3)); g.setAttribute("aLim", new THREE.BufferAttribute(new Float32Array([0]), 1)); g.setAttribute("aTam", new THREE.BufferAttribute(new Float32Array([0.02]), 1)); const p = new THREE.Points(g, materialGotas); p.frustumCulled = false; p.visible = false; return p; })();
