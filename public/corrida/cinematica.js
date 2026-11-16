// A cinemática da chegada (2026-11-16, o Thiago: "o carro passando rápido, igual na linha de chegada, porém num estúdio, e aparece o texto
// sendo arrastado atrás dele informando a posição final; em seguida muda para o tempo total; aí corta para a tela pós-corrida que já temos")
// Duas passadas do carro do jogador num estúdio escuro: na primeira o texto arrastado é a posição, na segunda o tempo total. Clique ou
// qualquer tecla pula. Usa um canvas e um renderizador próprios por cima de tudo e some sozinha no fim (chama `fim`).
import * as THREE from "three";

const PASSADA = 1.9; // segundos de cada passada
const TAM = 4.35; // o comprimento do carro no estúdio, em metros (o mesmo de f1.js)

const CSS = `.cine{position:fixed;inset:0;z-index:9999;background:#0b0c10;cursor:pointer;transition:opacity .4s}.cine.sai{opacity:0;pointer-events:none}
.cine canvas{width:100%;height:100%;display:block}.cine-txt{position:absolute;left:0;top:0;font:italic 900 clamp(64px,12vw,170px)/1 Barlow,system-ui,sans-serif;color:#fff;
letter-spacing:-.02em;white-space:nowrap;text-shadow:0 6px 30px #000a;pointer-events:none;will-change:transform}
.cine-pular{position:absolute;right:24px;bottom:18px;font:600 13px Barlow,system-ui,sans-serif;color:#fff8;letter-spacing:.08em;text-transform:uppercase}`;
let estilo = false;
export function tocarCinematica(kart, textos, fim) {
  if (!kart?.g || !textos?.length) { fim(); return; }
  if (!estilo) { estilo = true; const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st); }
  const raiz = document.createElement("div");
  raiz.className = "cine";
  raiz.innerHTML = `<canvas></canvas><div class="cine-txt"></div><div class="cine-pular">clique para pular</div>`;
  document.body.appendChild(raiz);
  const tela = raiz.querySelector("canvas"), txt = raiz.querySelector(".cine-txt");
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: tela, antialias: true }); } catch (e) { raiz.remove(); fim(); return; }
  renderer.setPixelRatio(Math.min(2, devicePixelRatio)); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.shadowMap.enabled = true;
  const cena = new THREE.Scene(); cena.background = new THREE.Color(0x0b0c10); cena.fog = new THREE.Fog(0x0b0c10, 14, 40);
  const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 100);

  // o estúdio: chão escuro brilhante (o carro se reflete de leve), fundo curvo e três faixas de luz no teto
  const chao = new THREE.Mesh(new THREE.PlaneGeometry(120, 40), new THREE.MeshStandardMaterial({ color: 0x16181d, roughness: 0.28, metalness: 0.5 }));
  chao.rotation.x = -Math.PI / 2; chao.receiveShadow = true; cena.add(chao);
  const fundo = new THREE.Mesh(new THREE.CylinderGeometry(22, 22, 14, 48, 1, true, Math.PI * 0.75, Math.PI * 0.5), new THREE.MeshStandardMaterial({ color: 0x1d2027, roughness: 0.9, side: THREE.BackSide }));
  fundo.position.set(0, 7, 8); cena.add(fundo);
  for (const z of [-3, 0, 3]) { const f = new THREE.Mesh(new THREE.BoxGeometry(60, 0.05, 0.25), new THREE.MeshBasicMaterial({ color: 0xffffff })); f.position.set(0, 6, z); cena.add(f); }
  cena.add(new THREE.HemisphereLight(0xcfd8ff, 0x101015, 0.7));
  const chave = new THREE.SpotLight(0xffffff, 260, 40, 0.6, 0.5); chave.position.set(-4, 9, -6); chave.castShadow = true; chave.shadow.mapSize.set(1024, 1024); cena.add(chave, chave.target);
  const recorte = new THREE.DirectionalLight(0x9ec4ff, 2.2); recorte.position.set(6, 4, 8); cena.add(recorte);

  // o carro: uma cópia do modelo do jogador (as mesmas peças e a mesma pintura), posto no tamanho de verdade, de lado para a câmera
  const carro = kart.g.clone(true);
  carro.position.set(0, 0, 0); carro.rotation.set(0, 0, 0); carro.scale.set(1, 1, 1); carro.visible = true;
  carro.traverse((o) => { o.visible = true; if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
  const caixa = new THREE.Box3().setFromObject(carro), tam = caixa.getSize(new THREE.Vector3());
  const escala = TAM / Math.max(tam.x, tam.z, 1e-3);
  const suporte = new THREE.Group(); carro.scale.setScalar(escala); carro.position.y = -caixa.min.y * escala;
  suporte.add(carro); suporte.rotation.y = -Math.PI / 2; // (a mesma conta do jogo, carros.js: rotação -a - 90°, com a = 0 andando para +x)
  cena.add(suporte);

  const ajustar = () => { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  ajustar(); addEventListener("resize", ajustar);
  const proj = new THREE.Vector3();
  let t0 = performance.now(), acabou = false, txtX = null;
  const terminar = () => {
    if (acabou) return; acabou = true; removeEventListener("resize", ajustar); removeEventListener("keydown", terminar, true);
    raiz.classList.add("sai"); fim();
    setTimeout(() => { renderer.dispose(); raiz.remove(); }, 450);
  };
  raiz.addEventListener("click", terminar); addEventListener("keydown", terminar, true);

  const quadro = () => {
    if (acabou) return;
    const t = (performance.now() - t0) / 1000, k = Math.floor(t / PASSADA);
    if (k >= textos.length) { terminar(); return; }
    const f = (t % PASSADA) / PASSADA; // 0..1 dentro da passada
    // o carro cruza da esquerda para a direita, rápido no meio (como passando pela linha de chegada) e um pouco mais lento nas pontas
    const s = f - 0.5, x = (s * 2 + Math.sign(s) * Math.pow(Math.abs(s * 2), 3) * 0.6) * 9;
    // cada passada num sentido (a segunda volta da direita para a esquerda, vista do outro lado)
    const lado = k % 2 ? -1 : 1, xc = x * lado;
    suporte.position.set(xc, 0, 0); suporte.rotation.y = lado > 0 ? -Math.PI / 2 : Math.PI / 2;
    cam.position.set(-lado * 1.5, 0.55, lado * 7.5); cam.lookAt(xc * 0.35, 0.5, 0);
    // o texto vem arrastado atrás do carro: segue a traseira dele com atraso e esticado pela velocidade
    proj.set(xc - lado * TAM * 0.9, 0.7, 0).project(cam);
    const alvo = (proj.x * 0.5 + 0.5) * innerWidth;
    txtX = txtX == null || f < 0.02 ? alvo - lado * 400 : txtX + (alvo - txtX) * 0.12;
    const vel = Math.abs(alvo - txtX);
    txt.textContent = textos[k];
    txt.style.transform = `translate(${txtX}px, ${(-proj.y * 0.5 + 0.5) * innerHeight}px) translate(-50%, -100%) skewX(${-lado * Math.min(25, vel * 0.08)}deg) scaleX(${1 + Math.min(0.5, vel / 900)})`;
    txt.style.opacity = f < 0.08 ? f / 0.08 : f > 0.9 ? (1 - f) / 0.1 : 1;
    renderer.render(cena, cam);
    requestAnimationFrame(quadro);
  };
  requestAnimationFrame(quadro);
}
