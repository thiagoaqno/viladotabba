// Corrida da Galera — o ANOITECER das corridas noturnas (Bahrein, Jeddah, Singapura, Las Vegas e qualquer corrida marcada "Noite"):
// a corrida larga no fim de tarde e vira noite fechada até a metade (pela volta do líder). A pista é montada já no modo noite
// (useTrack: os postes e o sombreador deles entram em todos os materiais e o aquecimento da largada compila tudo assim), e aqui só
// mexem valores que NÃO recompilam nada: a cor e a força do sol e do céu, a neblina, a força da luz dos postes (um uniforme) e o
// fundo, um degradê pintado num canvas pequeno que é repintado aos poucos. A luz da foto (scene.environment) não troca: trocar
// recompilaria tudo. Chamado por jogo.js: iniciarAnoitecer na largada, passoAnoitecer por quadro (antes do clima, que escurece
// por cima quando chove) e pararAnoitecer ao sair.
import * as THREE from "three";
import { renderer, scene, sun, hemi } from "./cena.js";
import { E } from "./estado.js";
import { LUZ, ambienteDaNoite } from "./kit/luz-postes.js";

const lim = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const suave = (a, b, x) => { const t = lim((x - a) / (b - a)); return t * t * (3 - 2 * t); };
// o céu: [altura no canvas (0 = topo), cor do fim de tarde, cor da noite]
const FAIXAS = [[0, "#3a5f9a", "#050912"], [0.3, "#6f86b4", "#0b1424"], [0.44, "#e0a27a", "#263140"], [0.5, "#ffb36b", "#55483e"], [0.54, "#9a7a6a", "#26303a"], [1, "#3b3a40", "#080e19"]];
const ca = new THREE.Color(), cb = new THREE.Color();
const mistura = (a, b, f) => "#" + ca.set(a).lerp(cb.set(b), f).getHexString();

let A = null; // o anoitecer desta corrida (ou null)
const cv = document.createElement("canvas"); cv.width = 512; cv.height = 256;
const tex = new THREE.CanvasTexture(cv); tex.mapping = THREE.EquirectangularReflectionMapping; tex.colorSpace = THREE.SRGBColorSpace;
function pintar(f) {
  const x = cv.getContext("2d"), g = x.createLinearGradient(0, 0, 0, cv.height);
  for (const [p, dia, noite] of FAIXAS) g.addColorStop(p, mistura(dia, noite, f));
  x.fillStyle = g; x.fillRect(0, 0, cv.width, cv.height); tex.needsUpdate = true;
}

// só nas corridas de F1 marcadas "Noite" (a classificação e as outras regras continuam de noite o tempo todo)
export function iniciarAnoitecer(tr, st) {
  pararAnoitecer();
  if (!st || st.config.hora !== "noite" || st.phase !== "race" || st.config.regras !== "f1" || !tr.look) return;
  const L = tr.look, amb = ambienteDaNoite(tr);
  A = {
    tr, f: 0, pintado: -1, fundoAntes: scene.background, brilhoAntes: scene.backgroundIntensity,
    dia: { fog: new THREE.Color(L.fog).lerp(new THREE.Color(0xe89a6a), 0.45), near: L.fogN, far: L.fogF, hemiC: new THREE.Color(L.hemi[0]).lerp(new THREE.Color(0xffc89a), 0.35), hemiG: new THREE.Color(L.hemi[1]), hemi: L.hemi[2] * 0.7, solC: new THREE.Color(0xffa060), sol: L.sun[1] * 0.75, ceu: 0.9 },
    noite: { fog: new THREE.Color(0x101b33), near: Math.min(L.fogN, 650), far: Math.min(L.fogF, 3400), hemiC: new THREE.Color(0x9eb9ee), hemiG: new THREE.Color(0x41445a), hemi: amb.hemi, solC: new THREE.Color(0xc9dcff), sol: amb.lua, ceu: 0.32 * amb.ceu },
  };
  scene.userData.anoitecer = 0;
  aplicar(0);
}
// o quanto já é noite (0 fim de tarde, 1 noite), pela volta do líder: escurece entre 10% e 50% da corrida
function alvo() {
  const S = E.S, total = S?.config?.voltas || 1; let v = 0;
  for (const p of S?.players || []) if (p.started) v = Math.max(v, p.laps || 0);
  return suave(0.1, 0.5, v / total);
}
function aplicar(f) {
  const d = A.dia, n = A.noite, fog = scene.fog;
  if (fog) { fog.color.copy(d.fog).lerp(n.fog, f); fog.near = d.near + (n.near - d.near) * f; fog.far = d.far + (n.far - d.far) * f; renderer.setClearColor(fog.color); }
  hemi.color.copy(d.hemiC).lerp(n.hemiC, f); hemi.groundColor.copy(d.hemiG).lerp(n.hemiG, f); hemi.intensity = d.hemi + (n.hemi - d.hemi) * f;
  sun.color.copy(d.solC).lerp(n.solC, f); sun.intensity = d.sol + (n.sol - d.sol) * f;
  if (scene.environment) scene.environmentIntensity = d.ceu + (n.ceu - d.ceu) * f;
  // os postes acendem no meio da transição. Nunca zero: com o fator em 0 os materiais que nascem no meio da corrida (a fumaça) sairiam
  // sem o sombreador dos postes e recompilariam depois (luzNoMaterial só liga com o fator > 0; o sombreador só acende acima de 0,001)
  if (A.tr.luzPostes) LUZ.uLuzPostesB.value.y = Math.max(0.0005, suave(0.25, 0.85, f));
  if (scene.background !== tex) scene.background = tex; // (a troca de fundo não recompila os materiais: só o do próprio fundo, uma vez)
  scene.backgroundIntensity = 1;
  if (Math.abs(f - A.pintado) > 0.02 || (f === 1 && A.pintado !== 1)) { A.pintado = f; pintar(f); }
  scene.userData.anoitecer = f;
}
export function passoAnoitecer(dt, race) {
  if (!A) return;
  if (!race || race.tr !== A.tr) { pararAnoitecer(); return; }
  A.f += (alvo() - A.f) * (1 - Math.exp(-dt / 8)); // devagar: uma volta a mais do líder não vira um degrau
  aplicar(A.f);
}
// ao sair: fica a noite completa (o estado que useTrack montou para esta pista), com o fundo de antes
export function pararAnoitecer() {
  if (!A) return;
  aplicar(1);
  if (A.fundoAntes) { scene.background = A.fundoAntes; scene.backgroundIntensity = A.brilhoAntes; }
  A = null; scene.userData.anoitecer = null;
}
