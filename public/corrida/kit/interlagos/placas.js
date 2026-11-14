// Interlagos — as placas com o nome de cada curva, na beira de fora (ou de dentro, se fora não couber), atrás da barreira e de frente para quem vem.
// As frações são as de gps/interlagos.js (o meio de cada trecho). Uma malha só para as placas (um atlas no canvas) e uma para os postes.
import * as THREE from "three";
import { canvasTex } from "../../cena.js";
import { ocupado, sinalDaCurva } from "../comum.js";
import { Montador, solido } from "../montagem.js";

const CURVAS = [["S DO SENNA", 0.085], ["CURVA DO SOL", 0.145], ["DESCIDA DO LAGO", 0.34], ["FERRADURA", 0.47], ["LARANJINHA", 0.497],
  ["PINHEIRINHO", 0.565], ["BICO DE PATO", 0.635], ["MERGULHO", 0.68], ["JUNÇÃO", 0.75], ["CAFÉ", 0.78]];
const indice = (tr, f) => ((Math.floor(f * tr.n) % tr.n) + tr.n) % tr.n;

export function placasDasCurvas(tr, { add }) {
  const { pts, n, W } = tr, vs = [], uv = [], idx = [], m = new Montador(), S = solido();
  // o atlas: 4 colunas × 3 linhas de 256 × 128, a faixa verde e amarela em cima e o nome em azul
  const atlas = canvasTex(1024, 384, (x) => {
    CURVAS.forEach(([nome], k) => {
      const x0 = (k % 4) * 256, y0 = Math.floor(k / 4) * 128;
      x.fillStyle = "#f6f6f2"; x.fillRect(x0, y0, 256, 128);
      x.fillStyle = "#009c3b"; x.fillRect(x0, y0, 256, 18); x.fillStyle = "#ffdf00"; x.fillRect(x0, y0 + 18, 256, 7);
      x.fillStyle = "#002776"; x.textAlign = "center"; x.textBaseline = "middle"; x.font = "900 40px Arial, sans-serif"; x.fillText(nome, x0 + 128, y0 + 78, 232);
      x.strokeStyle = "#002776"; x.lineWidth = 4; x.strokeRect(x0 + 2, y0 + 2, 252, 124);
    });
  }, false);
  CURVAS.forEach(([, f], k) => {
    const i = indice(tr, f), p = pts[i], fora = -sinalDaCurva(pts, n, i);
    let escolhido = null;
    for (const lado of [fora, -fora]) {
      for (const d of [W / 2 + 56, W / 2 + 78, W / 2 + 100, W / 2 + 130, W / 2 + 170, W / 2 + 220]) {
        const x = p.x + p.nx * lado * d, z = p.y + p.ny * lado * d, rm = tr.murosEscape?.[lado]?.[i] || 0;
        if (d < W / 2 + rm + 10) continue; // a placa fica atrás da barreira
        const gx = -lado * p.nx - 0.55 * p.tx, gz = -lado * p.ny - 0.55 * p.ty, gl = Math.hypot(gx, gz), qx = (gz / gl) * 48, qz = (-gx / gl) * 48; // as pontas também ficam fora da pista
        if (tr.distAt(x, z) >= d - 8 && tr.distAt(x + qx, z + qz) >= W / 2 + 16 && tr.distAt(x - qx, z - qz) >= W / 2 + 16 && !ocupado(tr, x, z)) { escolhido = [lado, x, z]; break; }
      }
      if (escolhido) break;
    }
    if (!escolhido) return;
    const [lado, x, z] = escolhido, y = tr.chao(x, z) - 1.5;
    // a frente aponta para a pista e um pouco contra o sentido da volta (para quem vem)
    const nx = -lado * p.nx - 0.55 * p.tx, nz = -lado * p.ny - 0.55 * p.ty, len = Math.hypot(nx, nz), ex = nz / len, ez = -nx / len;
    const w = 96, h = 36, y0 = y + 22, c = k % 4, rr = Math.floor(k / 4), base = vs.length / 3;
    for (const [a, b] of [[-1, 0], [1, 0], [-1, 1], [1, 1]]) { vs.push(x + ex * a * w / 2, y0 + b * h, z + ez * a * w / 2); uv.push(((a + 1) / 2 + c) / 4, 1 - (rr + 1 - b) / 3); }
    idx.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
    for (const s of [-1, 1]) m.caixa(S, [x + ex * s * (w / 2 - 6), y + 13, z + ez * s * (w / 2 - 6)], [2.4, 28, 2.4], { cor: "#d9dbdd", ry: Math.atan2(ex, ez) });
    tr.reservado.push([x, z, 28]);
  });
  if (!idx.length) return 0;
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(vs, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const placa = add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: atlas, roughness: 0.6, side: THREE.DoubleSide }))); placa.castShadow = true; placa.name = "interlagos-placas-curvas";
  add(m.montar("interlagos-placas-curvas-postes"));
  return idx.length / 6;
}
