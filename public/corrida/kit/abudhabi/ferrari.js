// Abu Dhabi — o FERRARI WORLD, ao norte do circuito: o teto vermelho enorme e baixo (Benoy, no perfil lateral de um Ferrari GT), com o funil
// de vidro no meio. Medidas: uns 200 mil m² de teto e 2 200 m de borda (os estudos de caso do projeto); uma elipse com essa área e essa borda
// tem 1 040 × 244 m. Onde: 24,4837 N, 54,6072 E pelo encaixe da linha real: x 5935, z −1766 (a 594 m da pista, perto de 0,25 da volta). O eixo
// comprido fica de través para a pista mais perto (a elipse não chega nela) e, se algum trecho passar a menos de 200 u, ela encolhe.
// A altura (uns 48 m no meio, o funil acima disso) é das fotos.
import * as THREE from "three";
import { canvasTex } from "../../cena.js";

const KM = 4.8;
export const FERRARI = { x: 5935, z: -1766 };
const A = 520 * KM, B = 122 * KM, ALTO = 48 * KM, FUNIL = 55 * KM; // os semieixos, a altura do teto e o raio do funil no alto

export function ferrariWorld(tr, add) {
  const { pts, n, W } = tr;
  let mi = 0, md = Infinity; for (let i = 0; i < n; i++) { const d = Math.hypot(pts[i].x - FERRARI.x, pts[i].y - FERRARI.z); if (d < md) { md = d; mi = i; } }
  const p = pts[mi], ang = Math.atan2(p.ty, p.tx); // o eixo comprido ao longo da pista mais perto
  const ca = Math.cos(ang), sa = Math.sin(ang);
  // encolhe até nenhum ponto da pista ficar a menos de 200 u da borda
  let k = 1;
  for (; k > 0.3; k -= 0.05) {
    let livre = true;
    for (let i = 0; i < n && livre; i += 2) { const dx = pts[i].x - FERRARI.x, dz = pts[i].y - FERRARI.z, u = (dx * ca + dz * sa) / (A * k + 200 + W / 2), v = (-dx * sa + dz * ca) / (B * k + 200 + W / 2); if (u * u + v * v < 1) livre = false; }
    if (livre) break;
  }
  const a = A * k, b = B * k, NR = 40, NT = 96, vs = [], uv = [], idx = [];
  let base = Infinity; for (let t = 0; t < 16; t++) { const th = (t / 16) * Math.PI * 2, x = FERRARI.x + a * Math.cos(th) * ca - b * Math.sin(th) * sa, z = FERRARI.z + a * Math.cos(th) * sa + b * Math.sin(th) * ca; base = Math.min(base, tr.chao(x, z)); }
  base -= 3;
  // o teto: de r = 1 (a borda, no chão, com a saia) até r = raio do funil; o perfil sobe rápido da borda e fica quase plano em cima (as fotos)
  const r0 = FUNIL / a;
  for (let i = 0; i <= NR; i++) {
    const r = 1 - (i / NR) * (1 - r0), y = i === 0 ? 0 : ALTO * Math.pow(1 - Math.pow(r, 3), 0.5);
    for (let j = 0; j <= NT; j++) {
      const th = (j / NT) * Math.PI * 2, s = (r - r0) / (1 - r0), ex = (FUNIL + (a - FUNIL) * s) * Math.cos(th), ez = (FUNIL + (b - FUNIL) * s) * Math.sin(th); // (a borda é a elipse; o furo do funil, redondo)
      vs.push(FERRARI.x + ex * ca - ez * sa, base + y, FERRARI.z + ex * sa + ez * ca); uv.push(j / NT * 24, i / NR);
    }
  }
  for (let i = 0; i < NR; i++) for (let j = 0; j < NT; j++) { const q = i * (NT + 1) + j; idx.push(q, q + NT + 1, q + 1, q + 1, q + NT + 1, q + NT + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(vs, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  // o alumínio vermelho, em faixas que correm da borda para o meio
  const tex = canvasTex(256, 64, (x, w, h) => { x.fillStyle = "#c8101a"; x.fillRect(0, 0, w, h); x.fillStyle = "#a50d15"; for (let i = 0; i < w; i += 16) x.fillRect(i, 0, 3, h); x.fillStyle = "#e0232b"; for (let i = 8; i < w; i += 16) x.fillRect(i, 0, 1, h); });
  const teto = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4, metalness: 0.35, side: THREE.DoubleSide })); teto.name = "abudhabi-ferrari-world"; teto.receiveShadow = true;
  // o funil de vidro no meio: um cone que sobe do teto
  const funil = new THREE.Mesh(new THREE.CylinderGeometry(FUNIL * 0.45, FUNIL, ALTO * 0.55, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0x9fc4d8, roughness: 0.1, metalness: 0.7, transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
  funil.position.set(FERRARI.x, base + ALTO * Math.pow(1 - Math.pow(r0, 3), 0.5) + ALTO * 0.27 - 2, FERRARI.z); funil.name = "abudhabi-ferrari-funil";
  const grupo = new THREE.Group(); grupo.name = "abudhabi-ferrari"; grupo.add(teto, funil); add(grupo);
  tr.reservado ||= []; tr.reservado.push([FERRARI.x, FERRARI.z, a + 60]);
  tr.ferrariAD = { encolhe: +k.toFixed(2) };
}
