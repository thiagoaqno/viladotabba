// Livery Studio, passo 5 (2026-11-18): EXPORTAR o carro em .glb com a pintura gravada numa textura comum, para abrir no Blender ou em outro
// motor. No jogo a pintura não está no UV: o shader (f1-pintura.js LIV_FRAG_MAIN) projeta a folha pela posição (`pcar` = x, y, s) e pela normal
// (`ncar`) de cada ponto. Aqui a mesma conta vira UV de verdade: cada triângulo da carroceria escolhe UMA vista (a da maior componente da
// normal média, para não rasgar o triângulo entre duas vistas) e os três vértices recebem a coordenada da folha nessa vista. O que é carbono
// (`mcar` < 0,5) e a barriga apontam para uma faixa preta acrescentada embaixo da folha. As outras peças (rodas, carbono, volante) vão como estão.
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";

const K = 1024 / 4.4, FW = 1024, FH = 1152, EXTRA = 16, H = FH + EXTRA; // (a faixa preta do carbono: 16 px embaixo da folha)
const dentro = (x, y, r) => [Math.min(Math.max(x, r[0] + 1.5), r[2] - 1.5), Math.min(Math.max(y, r[1] + 1.5), r[3] - 1.5)];
// a coordenada na folha (pixels) de um ponto (x, y, s) na vista v
function naFolha(v, x, y, s) {
  if (v === "A") return dentro((4.4 - s) * K, (1.1 - y) * K, [0, 0, 1024, 256]);
  if (v === "B") return dentro(s * K, 256 + (1.1 - y) * K, [0, 256, 1024, 512]);
  if (v === "T") return dentro(s * K, 704 - x * K, [0, 512, 1024, 896]);
  if (v === "F") return dentro(256 - x * K, 896 + (1.1 - y) * K, [0, 896, 512, 1152]);
  if (v === "R") return dentro(768 + x * K, 896 + (1.1 - y) * K, [512, 896, 1024, 1152]);
  return [512, FH + EXTRA / 2]; // (o carbono)
}
// a carroceria com UV: geometria nova, sem índice (cada triângulo com os seus vértices)
function geometriaComUV(g0) {
  const g = g0.index ? g0.toNonIndexed() : g0.clone(), P = g.attributes.pcar, N = g.attributes.ncar, M = g.attributes.mcar;
  if (!P || !N) return null;
  const uv = new Float32Array(g.attributes.position.count * 2);
  for (let t = 0; t < g.attributes.position.count; t += 3) {
    let nx = 0, ny = 0, nz = 0, m = 0;
    for (let k = 0; k < 3; k++) { nx += N.getX(t + k); ny += N.getY(t + k); nz += N.getZ(t + k); m += M ? M.getX(t + k) : 1; }
    const ax = Math.abs(nx), ay = Math.abs(ny), az = Math.abs(nz);
    const v = m < 1.5 || (ay >= ax && ay >= az && ny < 0) ? "C" : ax >= ay && ax >= az ? (nx > 0 ? "A" : "B") : ay >= az ? "T" : nz < 0 ? "F" : "R";
    for (let k = 0; k < 3; k++) { const [px, py] = naFolha(v, P.getX(t + k), P.getY(t + k), P.getZ(t + k)); uv[(t + k) * 2] = px / FW; uv[(t + k) * 2 + 1] = 1 - py / H; }
  }
  for (const nome of ["pcar", "ncar", "mcar", "fcar"]) g.deleteAttribute(nome);
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); return g;
}
// k: o carro montado (f1.js montarF1); folha: o canvas da pintura (1024 × 1152); P: os dados (o acabamento vai para o material)
export async function exportarGLB(k, folha, P) {
  const cv = document.createElement("canvas"); cv.width = FW; cv.height = H; const x = cv.getContext("2d");
  x.drawImage(folha, 0, 0, FW, FH); x.fillStyle = "#0c0d10"; x.fillRect(0, FH, FW, EXTRA);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.flipY = false;
  // (o GLTF lê a textura sem virar: o v do UV é medido de cima; acerto aqui para não depender do flipY)
  const mat = new THREE.MeshPhysicalMaterial({ map: tex, metalness: (P.met ?? 30) / 100, roughness: (P.rug ?? 35) / 100, clearcoat: (P.cc ?? 100) / 100, clearcoatRoughness: (P.ccr ?? 38) / 100 });
  const copia = k.carro.clone(true); let corpos = 0;
  copia.traverse((o) => {
    if (!o.isMesh) return;
    if (o.material === k.pintura || (Array.isArray(o.material) && o.material.includes(k.pintura))) {
      const g = geometriaComUV(o.geometry); if (!g) return;
      const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i)); // (flipY = false: v de cima para baixo)
      o.geometry = g; o.material = mat; corpos++;
    } else if (o.material) { // (os shaders próprios do jogo não vão para o arquivo: fica o material básico deles)
      o.material = [].concat(o.material).map((m) => { const c = m.clone(); c.onBeforeCompile = () => {}; return c; }); if (o.material.length === 1) o.material = o.material[0];
    }
  });
  if (!corpos) throw Error("não achei a carroceria pintada neste modelo");
  copia.name = "carro-" + (P.carro || "livery");
  return new GLTFExporter().parseAsync(copia, { binary: true });
}
