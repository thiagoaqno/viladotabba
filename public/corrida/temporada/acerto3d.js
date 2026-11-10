// Corrida da Galera — o carro 3D da aba ACERTO da carreira (central-acerto.js): o MESMO modelo da corrida e da garagem (f1.js, montarF1),
// visto de lado, com a SUSPENSÃO de verdade: a carroceria sobe e desce sobre as rodas (as rodas ficam no chão) conforme a altura escolhida e,
// num laço, afunda como no fim da reta (a carga da asa), com as rodas girando mais rápido; e o flap da asa traseira inclina com a asa. O curso é mostrado 4 × maior que a
// conta (centímetros não se veem nessa distância). Precisa de window.F1Pilotos e do importmap do three na página.
import * as THREE from "three";
import { montarF1, coresDa, f1Pronto, TAM } from "/corrida/f1.js";

const ESCALA_M = TAM / 5.5;   // metros do carro de verdade (5,5 m) para as unidades do modelo (TAM)
const EXAGERO = 4;            // o curso desenhado é 4 × o da conta
const CICLO = 3600;           // ms: parado (0 a 40%), descendo, fim da reta (50 a 90%), subindo — o mesmo laço do rótulo "Parado / Fim da reta" (CSS)
export async function montarAcerto(palco, equipeId) {
  const cv = palco.querySelector("canvas"), eq = window.F1Pilotos?.EQUIPES?.[equipeId] || {};
  const r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, powerPreference: "low-power" });
  r.setClearColor(0x000000, 0); r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping;
  const cena = new THREE.Scene(), cam = new THREE.PerspectiveCamera(24, 16 / 9, 0.1, 100);
  cena.add(new THREE.HemisphereLight(0xffffff, 0x333a48, 1.6));
  const sol = new THREE.DirectionalLight(0xffffff, 2.6); sol.position.set(-3, 6, 6); cena.add(sol);
  const luz = new THREE.DirectionalLight(eq.cor || 0xff4a3a, 1.6); luz.position.set(4, 2, -5); cena.add(luz);
  // a sombra no chão: uma elipse macia (gradiente num canvas), sem borda
  const cs = document.createElement("canvas"); cs.width = cs.height = 128; const gx = cs.getContext("2d"), gr = gx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(0,0,0,0.55)"); gr.addColorStop(0.6, "rgba(0,0,0,0.25)"); gr.addColorStop(1, "rgba(0,0,0,0)"); gx.fillStyle = gr; gx.fillRect(0, 0, 128, 128);
  const somTex = new THREE.CanvasTexture(cs), sombra = new THREE.Mesh(new THREE.PlaneGeometry(TAM * 1.1, TAM * 0.32), new THREE.MeshBasicMaterial({ map: somTex, transparent: true, depthWrite: false }));
  sombra.rotation.x = -Math.PI / 2; sombra.rotation.z = Math.PI / 2 + 0.18; sombra.position.y = 0.004; cena.add(sombra);
  const [c1, c2] = coresDa(eq.pintura, eq.cor || "#e10600");
  await f1Pronto.catch(() => {});
  const k = montarF1({ cor: c1, cor2: c2, equipe: equipeId }); cena.add(k.g);
  k.g.rotation.y = Math.PI / 2 + 0.18; // de lado, um pouco virado para mostrar a asa
  // a câmera enquadra o carro inteiro (do bico à asa) para o tamanho do palco: `enquadrar` acha a distância pela largura e pela altura do carro
  const caixa = new THREE.Box3().setFromObject(k.g), centro = caixa.getCenter(new THREE.Vector3()), tam = caixa.getSize(new THREE.Vector3());
  function enquadrar() {
    const v = THREE.MathUtils.degToRad(cam.fov) / 2, hz = Math.atan(Math.tan(v) * cam.aspect), largura = Math.max(tam.x, tam.z) * 1.02, altura = tam.y * 1.7;
    const d = Math.max(largura / 2 / Math.tan(hz), altura / 2 / Math.tan(v)) + Math.min(tam.x, tam.z) / 2;
    cam.position.set(centro.x, centro.y + d * 0.08, centro.z + d); cam.lookAt(centro.x, centro.y * 0.85, centro.z);
  }
  // as rodas ficam no chão: cada pivô (filho de k.carro) desce o mesmo tanto que a carroceria sobe
  const pivos = k.rodas.map((x) => x.esterca || x.gira.parent).filter(Boolean), baseY = pivos.map((p) => p.position.y), carroY = k.carro.position.y;
  let parado = 0, rapido = 0, flap = 0, vivo = true, raf = 0, antes = 0;
  const movimento = matchMedia("(prefers-reduced-motion:reduce)"), t0 = performance.now();
  function laco(t) {
    raf = 0; if (!vivo || !cv.isConnected) return parar();
    const fase = ((t - t0) % CICLO) / CICLO, s = (x) => x * x * (3 - 2 * x);
    const u = movimento.matches ? 0 : fase < 0.4 ? 0 : fase < 0.5 ? s((fase - 0.4) / 0.1) : fase < 0.9 ? 1 : 1 - s((fase - 0.9) / 0.1);
    const dy = (parado + (rapido - parado) * u) * ESCALA_M * EXAGERO;
    k.carro.position.y = carroY + dy; pivos.forEach((p, i) => { p.position.y = baseY[i] - dy; });
    // as rodas girando (o mesmo eixo da corrida, f1.js animarF1): devagar com o carro "parado" e rápido no "fim da reta"
    const dt = antes ? Math.min(0.05, (t - antes) / 1000) : 0; antes = t;
    if (!movimento.matches) { const giro = (2.5 + 22 * u) * dt; for (const x of k.rodas) x.gira.rotation.x -= giro; }
    if (k.flap) k.flap.rotation.x = flap;
    r.render(cena, cam);
    raf = requestAnimationFrame(laco);
  }
  const ajusta = () => { if (!cv.clientWidth || !cv.clientHeight) return; r.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5)); r.setSize(cv.clientWidth, cv.clientHeight, false); cam.aspect = cv.clientWidth / cv.clientHeight; cam.updateProjectionMatrix(); enquadrar(); };
  const ro = new ResizeObserver(ajusta); ro.observe(cv); ajusta();
  function parar() { vivo = false; if (raf) cancelAnimationFrame(raf); raf = 0; ro.disconnect(); sombra.geometry.dispose(); sombra.material.dispose(); somTex.dispose(); r.dispose(); }
  raf = requestAnimationFrame(laco);
  return {
    canvas: cv,
    // `alturaParadaM` e `afundaM`: em metros, em volta do padrão (acerto-sugestao.js); `asa` de 0 a 1 inclina o flap (mais asa, mais em pé)
    ajustar({ alturaParadaM, afundaM, asa }) { parado = alturaParadaM; rapido = alturaParadaM - afundaM; flap = (0.5 - asa) * 0.7; },
    parar,
  };
}
