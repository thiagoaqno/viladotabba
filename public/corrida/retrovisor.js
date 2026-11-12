// Corrida da Galera — o RETROVISOR VIRTUAL: a faixa fina no alto e no centro da tela, como nos jogos de F1, com a pista atrás do carro
// espelhada. Configurações > Gráficos > Câmera (qualidade.js, `retroVirtual`): desligado, só em primeira pessoa ("dentro") ou sempre.
// Uma câmera atrás da asa traseira olha para trás e desenha numa imagem pequena (L × A) a cada dois quadros; depois que a cena já foi
// para a tela (jogo.js, `draw`), essa imagem é posta por cima, num retângulo do alto da tela, com a moldura em HTML (#retroMolde).
// Custa um desenho da cena a cada dois quadros, como os retrovisores do carro (espelhos.js), com o mesmo alcance (550 u).
import * as THREE from "three";
import { renderer, scene } from "./cena.js";
import { graficos } from "./qualidade.js";

const L = 512, A = 84, ALCANCE = 550, DE_DENTRO = new Set(["cockpit", "onboard", "bico"]);
let rt = null, camTras = null, cenaQuadro = null, camQuadro = null, molde = null, contador = 0, medidas = null;
const v = new THREE.Vector3(), d = new THREE.Vector3(), cima = new THREE.Vector3(), tam = new THREE.Vector2();

function montar() {
  rt = new THREE.WebGLRenderTarget(L, A, { generateMipmaps: false });
  camTras = new THREE.PerspectiveCamera(11, L / A, 1, ALCANCE); // (11° de altura × L/A: uns 60° de largura)
  cenaQuadro = new THREE.Scene(); camQuadro = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 1);
  const quadro = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: rt.texture, toneMapped: false, depthTest: false, side: THREE.DoubleSide }));
  quadro.scale.x = -1; // espelhado: o que está à direita atrás aparece à direita no retrovisor
  cenaQuadro.add(quadro);
  molde = document.createElement("div"); molde.id = "retroMolde"; molde.setAttribute("aria-hidden", "true");
  document.getElementById("race")?.appendChild(molde);
}
// a caixa do carro nas coordenadas dele (uma vez por modelo): a câmera fica logo atrás e um pouco acima da asa traseira
function medir(carro) {
  carro.updateWorldMatrix(true, true);
  const inv = new THREE.Matrix4().copy(carro.matrixWorld).invert(), caixa = new THREE.Box3(), b = new THREE.Box3(), m = new THREE.Matrix4();
  carro.traverse((o) => { if (!o.isMesh || !o.geometry) return; if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); b.copy(o.geometry.boundingBox).applyMatrix4(m.multiplyMatrices(inv, o.matrixWorld)); caixa.union(b); });
  return caixa.isEmpty() ? null : { y: caixa.max.y, z: caixa.max.z, alt: caixa.max.y - caixa.min.y };
}
// chamado por jogo.js depois que a cena foi para a tela; `modo`: a câmera do jogo
export function quadroRetrovisor(kart, modo) {
  const op = graficos().retroVirtual, ligado = op === "sempre" || (op === "dentro" && DE_DENTRO.has(modo));
  if (molde) molde.style.display = ligado ? "" : "none";
  if (!ligado || !kart || !kart.kt || !kart.kt.carro) return;
  if (!rt) montar();
  const carro = kart.kt.carro;
  if (!medidas || medidas.carro !== carro) { const md = medir(carro); if (!md) return; medidas = { carro, ...md }; }
  // a cada dois quadros, a imagem nova (atrás da asa, olhando para trás: +z no carro é para trás, como em espelhos.js)
  if (contador++ % 2 === 0) {
    v.set(0, medidas.y + medidas.alt * 0.15, medidas.z * 1.05).applyMatrix4(carro.matrixWorld);
    d.set(0, -0.05, 1).transformDirection(carro.matrixWorld);
    cima.set(0, 1, 0).transformDirection(carro.matrixWorld);
    camTras.position.copy(v); camTras.up.copy(cima); camTras.lookAt(v.x + d.x, v.y + d.y, v.z + d.z);
    const antes = renderer.getRenderTarget(), sombra = renderer.shadowMap.autoUpdate;
    renderer.shadowMap.autoUpdate = false;
    try { renderer.setRenderTarget(rt); renderer.render(scene, camTras); }
    finally { renderer.setRenderTarget(antes); renderer.shadowMap.autoUpdate = sombra; }
  }
  // por cima da tela: o retângulo do alto, no centro (o mesmo que a moldura em CSS, #retroMolde)
  const r = molde.getBoundingClientRect(), tela = renderer.domElement.getBoundingClientRect(); renderer.getSize(tam);
  if (!r.width || !tela.width) return;
  const k = tam.x / tela.width, x = (r.left - tela.left) * k, w = r.width * k, h = r.height * k, y = tam.y - (r.top - tela.top) * k - h;
  const limpa = renderer.autoClear;
  renderer.setRenderTarget(null); renderer.autoClear = false;
  renderer.setViewport(x, y, w, h); renderer.setScissor(x, y, w, h); renderer.setScissorTest(true);
  try { renderer.render(cenaQuadro, camQuadro); }
  finally { renderer.setScissorTest(false); renderer.setViewport(0, 0, tam.x, tam.y); renderer.autoClear = limpa; }
}
