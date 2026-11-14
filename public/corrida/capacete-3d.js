// Corrida da Galera — a prévia 3D do capacete no editor (sala e carreira): o mesmo capacete da pista (as geometrias e a viseira de f1-piloto.js,
// a pintura de f1-capacetes.js `pintarFolha`), girando devagar num fundo escuro; arrastar com o mouse ou o dedo gira na mão. Um renderer só
// para a prévia, que só desenha enquanto o canvas está na página e visível (nada de quadro gasto com a aba escondida).
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { geometriasDoCapacete, materialDaViseira, materialDaMoldura } from "./f1-piloto.js";
import { pintarFolha } from "./f1-capacetes.js";

// cv: o canvas; devolve { mostrar(cap, numero), soltar() } (ou null sem WebGL: o editor volta para a folha aberta)
export function previaDoCapacete(cv) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); } catch { return null; }
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const cena = new THREE.Scene(), pm = new THREE.PMREMGenerator(renderer);
  cena.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose(); // (os reflexos da viseira e do verniz do casco)
  cena.add(new THREE.HemisphereLight(0xdfe8ff, 0x20222a, 0.6));
  const sol = new THREE.DirectionalLight(0xffffff, 2.2); sol.position.set(-0.6, 0.9, -0.8); cena.add(sol);
  const contra = new THREE.DirectionalLight(0x9fb8ff, 1.1); contra.position.set(0.8, 0.3, 0.9); cena.add(contra);
  const cam = new THREE.PerspectiveCamera(30, 2, 0.05, 5); cam.position.set(0, 0.03, -0.62); cam.lookAt(0, 0, 0);

  const folha = document.createElement("canvas"); folha.width = 512; folha.height = 256;
  const tex = new THREE.CanvasTexture(folha); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const casco = new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.28, metalness: 0.08, clearcoat: 1, clearcoatRoughness: 0.08 });
  const G = geometriasDoCapacete(), pivo = new THREE.Group(), cab = new THREE.Mesh(G.capacete, casco), vis = new THREE.Mesh(G.viseira, materialDaViseira());
  if (G.moldura) pivo.add(new THREE.Mesh(G.moldura, materialDaMoldura())); // a borracha da borda e as dobradiças da viseira
  pivo.add(cab, vis); cena.add(pivo); pivo.rotation.y = -0.6; // (começa de três-quartos: a frente do capacete é −z, virada para a câmera, e a lateral aparece)

  let ang = pivo.rotation.y, arrasto = null, parado = 0, vivo = true, raf = 0;
  cv.style.touchAction = "pan-y"; cv.style.cursor = "grab";
  cv.addEventListener("pointerdown", (e) => { arrasto = { x: e.clientX, a: ang }; cv.setPointerCapture?.(e.pointerId); cv.style.cursor = "grabbing"; });
  cv.addEventListener("pointermove", (e) => { if (arrasto) ang = arrasto.a + (e.clientX - arrasto.x) * 0.012; });
  const solta = () => { if (arrasto) { arrasto = null; parado = performance.now(); cv.style.cursor = "grab"; } };
  cv.addEventListener("pointerup", solta); cv.addEventListener("pointercancel", solta);
  const reduz = matchMedia("(prefers-reduced-motion: reduce)");

  let ultimo = performance.now();
  function quadro(agora) {
    if (!vivo) return;
    raf = requestAnimationFrame(quadro);
    if (!cv.isConnected || cv.offsetParent === null || document.hidden) return; // (fora da tela: não desenha)
    const dt = Math.min(0.05, (agora - ultimo) / 1000); ultimo = agora;
    if (!arrasto && !reduz.matches && agora - parado > 2500) ang += dt * 0.45; // gira sozinho, e espera um pouco depois que a pessoa soltou
    pivo.rotation.y = ang;
    const w = cv.clientWidth | 0, h = cv.clientHeight | 0;
    if (w && h && (cv.width !== Math.round(w * renderer.getPixelRatio()) || cv.height !== Math.round(h * renderer.getPixelRatio()))) { renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
    renderer.render(cena, cam);
  }
  raf = requestAnimationFrame(quadro);

  return {
    // cap: { desenho, cores, viseira, bandeira, nome } (mods.capacete); numero: o do carro, se houver
    mostrar(cap, numero = null) {
      const pintar = () => { pintarFolha(folha.getContext("2d"), cap.cores, cap.desenho, numero, { bandeira: cap.bandeira, nome: cap.nome }, () => { pintar(); tex.needsUpdate = true; }); };
      pintar(); tex.needsUpdate = true; vis.material = materialDaViseira(cap.viseira);
    },
    soltar() { vivo = false; cancelAnimationFrame(raf); tex.dispose(); casco.dispose(); cena.environment?.dispose(); renderer.dispose(); },
  };
}
