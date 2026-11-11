// Abu Dhabi — o HOTEL W (o antigo Yas Hotel, Asymptote, 2009), a peça que é a cara de Yas Marina: dois prédios, um de cada lado da pista, ligados por
// uma ponte que passa POR CIMA da pista, e os dois cobertos pela casca de grade (gridshell) de aço e vidro, de painéis em losango, que de noite
// acendem em cores (LEDs em cada nó). Medidas: a casca tem 217 m de comprimento, 44 m de largura e 35 m de altura (schlaich bergermann partner);
// a ponte, curva, tem uns 40 m (Arup); 10 colunas em V sustentam a casca. Onde fica: Wikipedia, 24,467402 N, 54,606059 E, passado pelo encaixe
// da linha real (ferramentas/pista-real.js, o cache de ae-2009) para o mundo do jogo: x 5370, z 7010, a 0,837 da volta, 212 u (44 m) ao lado da
// pista. A casca atravessa a pista no ponto mais perto (o eixo comprido dela segue a normal da pista ali); medido: a pista ali é reta (só ela
// ocupa |l| < 60 u) e nenhum outro trecho chega a 100 u da planta. A altura dos prédios (uns 9 andares sob a casca) e a da ponte são das fotos.
import * as THREE from "three";
import { canvasTex } from "../../cena.js";
import { luzDaNoite } from "../bahrein/base.js";

const KM = 4.8; // u por metro
export const HOTEL = { x: 2937, z: 3834 }; // (na escala antiga, 2026-11-11: o mesmo ponto pelo encaixe na pista de agora, 0,836 da volta, 116 u ao lado da pista)
const COMP = 217 * KM, LARG = 44 * KM, ALTO = 35 * KM; // a casca
const TORRE = 32 * KM; // o alto dos prédios (sob a casca) e onde começam, contados da linha central (a pista + 10 m de cada lado)
const PONTE0 = 17.5 * KM, PONTE1 = 24.5 * KM; // o vão livre sob a ponte (5 andares) e o alto dela
const ATRAS = -30; // o hotel um pouco para trás ao longo da pista (os 100 u adiante, do lado de dentro, já são da curva seguinte)

// os losangos da casca: o aço claro e o vidro levemente fosco (alfa), e o mapa que acende de noite (só os painéis)
const texLosango = (aceso) => canvasTex(256, 256, (x, w, h) => {
  x.clearRect(0, 0, w, h);
  if (aceso) { x.fillStyle = "#000"; x.fillRect(0, 0, w, h); }
  const losango = (cx, cy, r) => { x.beginPath(); x.moveTo(cx, cy - r); x.lineTo(cx + r, cy); x.lineTo(cx, cy + r); x.lineTo(cx - r, cy); x.closePath(); };
  for (const [cx, cy] of [[0, 0], [w, 0], [0, h], [w, h], [w / 2, h / 2]]) {
    losango(cx, cy, w / 2 - 7);
    if (aceso) { const g = x.createRadialGradient(cx, cy, 2, cx, cy, w / 2); g.addColorStop(0, "#fff"); g.addColorStop(0.7, "#9a9a9a"); g.addColorStop(1, "#202020"); x.fillStyle = g; }
    else x.fillStyle = "rgba(214,226,236,0.62)";
    x.fill();
  }
  if (!aceso) { x.strokeStyle = "#eef1f4"; x.lineWidth = 9; for (const [cx, cy] of [[0, 0], [w, 0], [0, h], [w, h], [w / 2, h / 2]]) { losango(cx, cy, w / 2); x.stroke(); } }
}, false);

// a fachada dos prédios: as lajes brancas e as faixas de vidro escuro de cada andar (3,5 m)
const texFachada = () => canvasTex(128, 128, (x, w, h) => {
  x.fillStyle = "#1e2b36"; x.fillRect(0, 0, w, h);
  x.fillStyle = "#f2f2ee"; x.fillRect(0, 0, w, h * 0.22);
  x.fillStyle = "#3d5466"; for (let i = 0; i < 4; i++) x.fillRect(i * 32 + 2, h * 0.3, 28, h * 0.62);
  x.fillStyle = "#ffe6a8"; x.globalAlpha = 0.25; x.fillRect(66, h * 0.3, 28, h * 0.62);
});

export function hotelW(tr, add) {
  const { pts, n } = tr, VAO = tr.W / 2 + 20; // (onde começam os prédios: a meia largura da pista e mais 20 u, de cada lado)
  let hi = 0, hd = Infinity; for (let i = 0; i < n; i++) { const d = Math.hypot(pts[i].x - HOTEL.x, pts[i].y - HOTEL.z); if (d < hd) { hd = d; hi = i; } }
  const p = pts[hi], tx = p.tx, tz = p.ty, nx = p.nx, nz = p.ny, h0 = p.h;
  const lC = (HOTEL.x - p.x) * nx + (HOTEL.z - p.y) * nz; // o centro do hotel, de lado (medido: −212)
  const em = (al, l, y) => [p.x + tx * (ATRAS + al) + nx * l, h0 + y, p.y + tz * (ATRAS + al) + nz * l]; // al: ao longo da pista, l: de lado, y: acima do asfalto
  const grupo = new THREE.Group(); grupo.name = "abudhabi-hotel-w";

  // ---- a casca: uma superfície que sobe dos lados (a 8 m) até o alto (35 m) e estreita nas pontas ----
  const l0 = lC - COMP / 2, l1 = lC + COMP / 2, NS = 72, NV = 22, vs = [], uv = [], idx = [];
  for (let a = 0; a <= NS; a++) {
    const s = a / NS, l = l0 + (l1 - l0) * s, sobe = Math.sin(Math.PI * s), meia = (LARG / 2) * (0.72 + 0.28 * sobe), alto = ALTO * (0.7 + 0.3 * Math.pow(sobe, 0.6));
    // a beirada desce a 8 m sobre os prédios e sobe até a ponte (17,5 m) por cima da pista: quem passa vê a ponte e a casca no alto, sem nada baixo sobre o asfalto
    const perto = Math.max(0, Math.min(1, (VAO + 60 - Math.abs(l)) / 60)), baixo = 8 * KM + (PONTE0 - 8 * KM) * perto * perto * (3 - 2 * perto);
    for (let b = 0; b <= NV; b++) {
      const v = (b / NV) * 2 - 1, y = baixo + (alto - baixo) * Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(v), 2.2)));
      vs.push(...em(v * meia, l, y)); uv.push((l - l0) / (6 * KM), (v * meia) / (6 * KM) + 4);
    }
  }
  for (let a = 0; a < NS; a++) for (let b = 0; b < NV; b++) { const k = a * (NV + 1) + b; idx.push(k, k + 1, k + NV + 1, k + 1, k + NV + 2, k + NV + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(vs, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const repete = (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.needsUpdate = true; return t; };
  const casca = new THREE.MeshStandardMaterial({ map: repete(texLosango(false)), emissiveMap: repete(texLosango(true)), emissive: 0x7a4cff, emissiveIntensity: tr.noite ? 1.1 : 0.06, transparent: true, depthWrite: false, side: THREE.DoubleSide, roughness: 0.25, metalness: 0.5 });
  const mc = new THREE.Mesh(g, casca); mc.name = "abudhabi-hotel-casca"; mc.renderOrder = 2; grupo.add(mc);
  // de noite os LEDs trocam de cor devagar (os roteiros de luz da Asymptote): violeta, azul, ciano, magenta
  const L = luzDaNoite(tr);
  L.emissivos.push({ mat: casca, valores: [0.06, 1.1] });
  L.quadro.push((noite) => { if (noite) casca.emissive.setHSL((0.72 + 0.18 * Math.sin(performance.now() / 9000)) % 1, 0.85, 0.55); });

  // ---- os dois prédios, um de cada lado (do chão até sob a casca) e a ponte por cima da pista ----
  const fach = texFachada(), matPredio = new THREE.MeshStandardMaterial({ map: fach, roughness: 0.55, metalness: 0.1 });
  const caixa = (al0, al1, la, lb, y0, y1, mat, nome) => {
    const c = new THREE.Vector3(...em((al0 + al1) / 2, (la + lb) / 2, (y0 + y1) / 2)), w = lb - la, d = al1 - al0, hgt = y1 - y0;
    const geo = new THREE.BoxGeometry(d, hgt, w), uvs = geo.attributes.uv;
    // (depois do giro, o z da caixa segue a normal da pista: a extensão de lado `w` vai no z, a ao longo da pista `d` no x)
    // a fachada repete a cada 4 m de largura e 3,5 m de altura (um andar)
    for (let i = 0; i < uvs.count; i++) { const face = Math.floor(i / 4), larg = face < 2 ? w : d; uvs.setXY(i, uvs.getX(i) * larg / (4 * KM * 4), uvs.getY(i) * hgt / (3.5 * KM)); }
    fach.wrapS = fach.wrapT = THREE.RepeatWrapping;
    const m = new THREE.Mesh(geo, mat); m.position.copy(c); m.rotation.y = Math.atan2(nx, nz); m.castShadow = m.receiveShadow = true; m.name = nome; grupo.add(m); return m;
  };
  const chaoMin = (al0, al1, la, lb) => { let mn = Infinity; for (const al of [al0, al1]) for (const l of [la, lb]) { const [x, , z] = em(al, l, 0); mn = Math.min(mn, tr.chao(x, z)); } return mn - h0 - 3; };
  const fundo = 15 * KM; // a meia largura dos prédios ao longo da pista (30 m, dentro dos 44 m da casca)
  const torres = [[l0 + 20, -VAO], [VAO, l1 - 20]].filter(([a, b]) => b - a > 30);
  for (const [la, lb] of torres) caixa(-fundo, fundo, la, lb, chaoMin(-fundo, fundo, la, lb), TORRE, matPredio, "abudhabi-hotel-predio");
  const ponte = new THREE.MeshStandardMaterial({ color: 0xe9ecef, roughness: 0.35, metalness: 0.3 });
  caixa(-fundo * 0.8, fundo * 0.8, -VAO - 4, VAO + 4, PONTE0, PONTE1, matPredio, "abudhabi-hotel-ponte");
  caixa(-fundo * 0.8, fundo * 0.8, -VAO - 4, VAO + 4, PONTE0 - 1.2, PONTE0, ponte, "abudhabi-hotel-ponte-baixo"); // a laje branca por baixo, vista de quem passa

  // ---- as colunas em V (10) que levam a casca até o chão, nas duas beiras compridas, fora da pista ----
  const aco = new THREE.MeshStandardMaterial({ color: 0xdfe3e6, roughness: 0.4, metalness: 0.6 });
  const barra = (A, B, r) => { const a = new THREE.Vector3(...A), b = new THREE.Vector3(...B); const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, a.distanceTo(b), 8), aco); m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); m.castShadow = true; grupo.add(m); };
  const pontos = [l0 + COMP * 0.1, l0 + COMP * 0.3, l0 + COMP * 0.5, -VAO - 30, VAO + 30].filter((l) => l < l1 - 20);
  for (const l of pontos) for (const s of [-1, 1]) {
    const al = s * (LARG / 2) * 0.8, [x, , z] = em(al, l, 0), base = tr.chao(x, z) - h0 - 1;
    barra(em(al, l, base), em(al, l - 20, 8 * KM + 4), 1.6); barra(em(al, l, base), em(al, l + 20, 8 * KM + 4), 1.6);
  }
  add(grupo);
  // o espaço do hotel: nada do cenário automático entra nele
  tr.reservado ||= [];
  for (let l = l0; l <= l1; l += 60) { const [x, , z] = em(0, l, 0); tr.reservado.push([x, z, LARG / 2 + 40]); }
  return { i: hi, l0, l1 };
}
