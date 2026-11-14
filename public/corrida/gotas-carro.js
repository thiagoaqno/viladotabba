// Corrida da Galera — as GOTAS EM CIMA DO CARRO na chuva (pedido do Thiago, 2026-11-13: "gotas se acumulam gradualmente no carro" e "as
// gotas devem ficar em cima do carro"; depois: "hoje parecem bolhas e não água acumulada"). Cada gota é uma cúpula bem achatada DEITADA na
// pintura (orientada pela normal da superfície, não virada para a câmera), de tamanho e formato irregulares (umas alongadas), e o material
// é o da água: o miolo quase transparente (vê-se a pintura através), a borda reflete o céu (Fresnel) e o sol faz um brilho pequeno e forte.
// Acumulam aos poucos: enquanto chove o nível sobe (~30 s), cada gota nasce pequena quando o nível passa do limiar dela e vai crescendo
// (as que juntam água ficam maiores); quando para, somem devagar (~90 s). Só no carro que a câmera segue, nas superfícies viradas para cima
// (bico, asas, laterais, tampa do motor), sem rodas e sem o piloto. Um InstancedMesh só, preso no modelo (`kt.carro`, em metros), com um
// material dividido por todos, que entra no aquecimento da chuva (clima-visual.js `ligarChuvaDeEnsaio`) para não compilar na hora.
import * as THREE from "three";
import { sun, scene } from "./cena.js";

const MAX = 900, CELULA = 0.05; // gotas por carro; o quadradinho da busca da superfície de cima (m)
const R_MIN = 0.0025, R_MAX = 0.011; // o raio das gotas (m): muitas pequenas, poucas grandes
const lim = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const sorteio = (k) => (((Math.sin(k * 127.1 + 311.7) * 43758.5453) % 1) + 1) % 1;

export const materialGotas = new THREE.ShaderMaterial({
  uniforms: { uCeu: { value: new THREE.Color(0.62, 0.68, 0.75) }, uSolDir: { value: new THREE.Vector3(0, 1, 0) }, uSolCor: { value: new THREE.Color(1, 1, 1) } },
  vertexShader: /* glsl */ `
    varying vec3 vN; varying vec3 vV;
    void main() {
      vec4 local = instanceMatrix * vec4(position, 1.0);
      vec4 mv = modelViewMatrix * local;
      vN = normalize(normalMatrix * (mat3(instanceMatrix) * normal)); vV = -mv.xyz;
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: /* glsl */ `
    uniform vec3 uCeu; uniform vec3 uSolDir; uniform vec3 uSolCor; varying vec3 vN; varying vec3 vV;
    void main() {
      vec3 N = normalize(vN), V = normalize(vV), R = reflect(-V, N);
      float nv = max(dot(N, V), 0.0), f = pow(1.0 - nv, 3.0);              // Fresnel: a borda reflete, o miolo deixa ver a pintura
      float spec = pow(max(dot(R, uSolDir), 0.0), 140.0);                    // o brilho do sol, pequeno e forte
      float ceu = 0.45 + 0.55 * clamp(R.y * 0.5 + 0.5, 0.0, 1.0);
      vec3 cor = uCeu * ceu * (0.25 + 1.2 * f) + uSolCor * spec * 2.5;
      float borda = smoothstep(0.55, 0.95, 1.0 - nv);                         // a lente escurece um pouco na beirada (a refração)
      cor = mix(cor, cor * 0.35, borda * 0.5);
      gl_FragColor = vec4(cor, clamp(0.05 + 0.55 * f + 0.25 * borda + spec, 0.0, 0.92));
    }`,
  transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, // (sem brigar de profundidade com a pintura de baixo)
});
// a gota: meia esfera bem achatada (a base fica na pintura)
const GEO = (() => { const g = new THREE.SphereGeometry(1, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(1, 0.3, 1); return g; })();

// os pontos de um modelo (cache pelo objeto do modelo): { P (posição), Nr (normal), L (limiar 0..1), T (raio), E (alongamento), A (giro) }
const CACHE = new WeakMap();
function pontosDe(kt) {
  const chave = kt.modelo || kt.carro; let r = CACHE.get(chave); if (r) return r;
  const carro = kt.carro; carro.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(carro.matrixWorld).invert(), M = new THREE.Matrix4(), N = new THREE.Matrix3(), v = new THREE.Vector3(), nrm = new THREE.Vector3();
  const fora = new Set(); for (const rd of kt.rodas || []) rd.traverse?.((o) => fora.add(o));
  const topo = new Map(), cand = [];
  carro.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || fora.has(o) || /piloto|antebraco|maos|lanterna|capacete|viseira|gotas/i.test(o.name || "") || /piloto|antebracos/i.test(o.parent?.name || "")) return;
    const g = o.geometry, P = g && g.attributes.position, Nn = g && g.attributes.normal; if (!P || !Nn) return;
    M.multiplyMatrices(inv, o.matrixWorld); N.getNormalMatrix(M);
    const passo = Math.max(1, Math.floor(P.count / 8000)); // (modelos pesados: uma amostra dos vértices basta)
    for (let i = 0; i < P.count; i += passo) {
      v.fromBufferAttribute(P, i).applyMatrix4(M); nrm.fromBufferAttribute(Nn, i).applyMatrix3(N).normalize();
      const k = Math.round(v.x / CELULA) + "," + Math.round(v.z / CELULA), t = topo.get(k);
      if (t === undefined || v.y > t) topo.set(k, v.y);
      if (nrm.y > 0.4) cand.push(v.x, v.y, v.z, nrm.x, nrm.y, nrm.z, k);
    }
  });
  const ok = [];
  for (let i = 0; i < cand.length; i += 7) if (cand[i + 1] >= topo.get(cand[i + 6]) - 0.012) ok.push(i);
  // sorteia até MAX (sempre os mesmos para o mesmo modelo: o sorteio é por índice)
  for (let i = ok.length - 1; i > 0; i--) { const j = Math.floor(sorteio(i) * (i + 1)); [ok[i], ok[j]] = [ok[j], ok[i]]; }
  const m = Math.min(MAX, ok.length), P = new Float32Array(m * 3), Nr = new Float32Array(m * 3), L = new Float32Array(m), T = new Float32Array(m), E = new Float32Array(m), A = new Float32Array(m);
  for (let k = 0; k < m; k++) {
    const i = ok[k]; P[k * 3] = cand[i]; P[k * 3 + 1] = cand[i + 1]; P[k * 3 + 2] = cand[i + 2]; Nr[k * 3] = cand[i + 3]; Nr[k * 3 + 1] = cand[i + 4]; Nr[k * 3 + 2] = cand[i + 5];
    L[k] = sorteio(k + 0.37) * 0.9; T[k] = R_MIN + (R_MAX - R_MIN) * Math.pow(sorteio(k + 0.71), 2.4); E[k] = 1 + 0.7 * Math.pow(sorteio(k + 0.13), 2); A[k] = sorteio(k + 0.93) * Math.PI;
  }
  r = { P, Nr, L, T, E, A }; CACHE.set(chave, r); return r;
}

let alvo = null, malha = null, dados = null, nivel = 0, aplicado = -1;
const mat4 = new THREE.Matrix4(), q = new THREE.Quaternion(), qg = new THREE.Quaternion(), pos = new THREE.Vector3(), nor = new THREE.Vector3(), esc = new THREE.Vector3(), CIMA = new THREE.Vector3(0, 1, 0);
// o tamanho de cada gota pelo nível: zero até o limiar dela; depois nasce pequena e cresce até o raio dela (a água acumulando)
function posicionar() {
  const { P, Nr, L, T, E, A } = dados;
  for (let k = 0; k < L.length; k++) {
    const x = lim((nivel - L[k]) / 0.25), s = x <= 0 ? 0 : T[k] * (0.35 + 0.65 * x);
    pos.set(P[k * 3], P[k * 3 + 1], P[k * 3 + 2]); nor.set(Nr[k * 3], Nr[k * 3 + 1], Nr[k * 3 + 2]);
    q.setFromUnitVectors(CIMA, nor).multiply(qg.setFromAxisAngle(CIMA, A[k])); // deitada na pintura, cada uma girada de um jeito
    esc.set(s * E[k], s, s); pos.addScaledVector(nor, 0.0006);
    mat4.compose(pos, q, esc); malha.setMatrixAt(k, mat4);
  }
  malha.instanceMatrix.needsUpdate = true; aplicado = nivel;
}
const solDir = new THREE.Vector3();
// por quadro (clima-visual.js): `kart` é o carro que a câmera segue (ou null); `chuva` a força da chuva agora (já suavizada); `coberto`: no túnel
export function passoGotasCarro(dt, kart, chuva, coberto, renderer, cam) {
  const meta = chuva > 0.02 && !coberto ? 0.35 + 0.65 * lim(chuva) : 0;
  nivel += (meta - nivel) * (1 - Math.exp(-dt / (meta > nivel ? 30 : 90)));
  if (nivel < 0.005 && meta === 0) { nivel = 0; if (malha) malha.visible = false; return; }
  const kt = kart && kart.kt; if (!kt || !kt.carro) { if (malha) malha.visible = false; return; }
  if (alvo !== kt) {
    if (malha) malha.removeFromParent();
    alvo = kt; malha = null; aplicado = -1;
    try {
      dados = pontosDe(kt); if (!dados.L.length) return;
      malha = new THREE.InstancedMesh(GEO, materialGotas, dados.L.length); malha.frustumCulled = false; malha.renderOrder = 4; malha.name = "gotas-carro";
      malha.castShadow = malha.receiveShadow = false; kt.carro.add(malha);
    } catch (e) { console.warn("Corrida: gotas no carro", e); return; }
  }
  if (!malha) return;
  malha.visible = true;
  if (Math.abs(nivel - aplicado) > 0.004) posicionar();
  // a luz da hora: o sol (direção na câmera, cor e força) e o céu (a cor da neblina, que a chuva já deixou cinza)
  const U = materialGotas.uniforms;
  solDir.copy(sun.position).sub(sun.target.position).normalize().transformDirection(cam.matrixWorldInverse); U.uSolDir.value.copy(solDir);
  U.uSolCor.value.copy(sun.color).multiplyScalar(Math.min(2, 0.35 + sun.intensity * 0.5));
  if (scene.fog) U.uCeu.value.copy(scene.fog.color);
}
export function limparGotasCarro() { if (malha) malha.removeFromParent(); malha = null; alvo = null; nivel = 0; aplicado = -1; }
// uma gota só, para o aquecimento da chuva compilar o material (com o mesmo jeito: InstancedMesh)
export const amostraGotas = (() => { const a = new THREE.InstancedMesh(GEO, materialGotas, 1); a.setMatrixAt(0, new THREE.Matrix4().makeScale(0.01, 0.01, 0.01)); a.frustumCulled = false; a.visible = false; return a; })();
