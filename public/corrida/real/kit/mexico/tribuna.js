// Cidade do México — a arquibancada de concreto sobre uma planta de verdade (peça só desta pista). `montarTribuna` recebe a borda da frente (uma linha, com cantos) e a profundidade e levanta,
// a partir dela, o corte da arquibancada: o muro do campo, a rampa de torcida, no estádio o corredor de concreto entre os dois andares, a rampa de cima, a parede de trás e a cobertura
// (o telhado só fica sobre a parte de trás). Nos cantos da linha a arquibancada dá a volta (um leque em volta do canto da frente, como o canto de fora do Foro Sol).
// Tudo assenta no chão que se vê (`nivelDoChao`): a frente fica rente a ele e as paredes descem 3 u por baixo, então nada flutua. Uma malha por material; a cobertura leva colunas em InstancedMesh.
import * as THREE from "three";
import { canvasTex, M } from "../../../cena.js";
import { desenharMarca } from "../marcas.js";
import { instancias } from "../comum.js";
import { nivelDoChao } from "./chao.js";

export const CORES_MX = { verde: "#006847", branco: "#f4f4f0", vermelho: "#ce1126" };
export const CAMISAS_MX = ["#0a7a4a", "#f4f4f0", "#ce1126", "#f4f4f0", "#0a7a4a", "#ce1126", "#1b1b1b", "#ffd23f"];
// os painéis do muro do campo: nomes de lugar e de comida de kit/mexico/marcas.js (quatro por textura)
const PAINEIS_MURO = ["mxforo", "mxmexico", "mxgp", "mxmixhuca", "mxtacos", "mxlucha", "mxchapultepec", "mxmariachi"];
const CHOCOLATE = "#d2691e"; // o `roof:colour=chocolate` do OpenStreetMap nas duas arquibancadas do estádio

// a textura da torcida: fileiras de camisa (verde, branco, vermelho) com a cabeça por cima; 16 pessoas por 8 fileiras
function torcidaTex() {
  return canvasTex(64, 128, (x, w, h, rr) => {
    x.fillStyle = "#3b3f46"; x.fillRect(0, 0, w, h);
    const linhas = 8, alt = h / linhas;
    for (let j = 0; j < linhas; j++) {
      x.fillStyle = "#2c3036"; x.fillRect(0, j * alt + alt - 2, w, 2);
      for (let i = 0; i < 16; i++) {
        if (rr() < 0.08) continue;
        const cx = i * 4 + 1;
        x.fillStyle = CAMISAS_MX[(rr() * CAMISAS_MX.length) | 0]; x.fillRect(cx, j * alt + alt * 0.42, 3, alt * 0.5);
        x.fillStyle = ["#f1c7a5", "#d9a37a", "#a8714a", "#7a4a2a", "#5a3820"][(rr() * 5) | 0]; x.fillRect(cx, j * alt + alt * 0.18, 3, alt * 0.26);
        if (rr() < 0.12) { x.fillStyle = "#ffd23f"; x.fillRect(cx - 1, j * alt + alt * 0.1, 5, 2); } // um chapéu de mariachi (sombrero) aqui e ali
      }
    }
  });
}
// o muro do campo: uma faixa de painéis de quatro em quatro (a textura repete a cada 4 painéis de 24 u)
function muroTex() {
  return canvasTex(1024, 64, (x, w, h) => { PAINEIS_MURO.slice(0, 4).forEach((nome, k) => desenharMarca(x, nome, (k * w) / 4, 0, w / 4, h)); });
}
function muroTex2() {
  return canvasTex(1024, 64, (x, w, h) => { PAINEIS_MURO.slice(4).forEach((nome, k) => desenharMarca(x, nome, (k * w) / 4, 0, w / 4, h)); });
}

// os materiais, um jogo só para a pista inteira (as arquibancadas dividem)
export function materiaisTribuna(tr) {
  if (tr.mxTribunaMat) return tr.mxTribunaMat;
  const tex = torcidaTex();
  return (tr.mxTribunaMat = {
    torcida: new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, side: THREE.DoubleSide }),
    concreto: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: THREE.DoubleSide }),
    muro: [new THREE.MeshStandardMaterial({ map: muroTex(), roughness: 0.7, side: THREE.DoubleSide }), new THREE.MeshStandardMaterial({ map: muroTex2(), roughness: 0.7, side: THREE.DoubleSide })],
    cobertura: M(CHOCOLATE, { roughness: 0.75, side: THREE.DoubleSide }),
    coberturaBranca: M(0xe6e4dc, { roughness: 0.7, side: THREE.DoubleSide }),
  });
}

const lote = () => ({ pos: [], uv: [], col: [], idx: [] });
function malha(l, mat, nome, comCor = false) {
  if (!l.idx.length) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(l.pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(l.uv, 2));
  if (comCor) g.setAttribute("color", new THREE.Float32BufferAttribute(l.col, 3));
  g.setIndex(l.idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.castShadow = m.receiveShadow = true; m.name = nome; return m;
}
const quad = (l, a, b, c, d, ua, ub, uc, ud, cor) => { // a-b na frente, c-d atrás (cada um [x, y, z]); uv [u, v]
  const k = l.pos.length / 3; l.pos.push(...a, ...b, ...c, ...d); l.uv.push(...ua, ...ub, ...uc, ...ud);
  if (cor) for (let i = 0; i < 4; i++) l.col.push(cor.r, cor.g, cor.b);
  l.idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
};

/**
 * @param {object} tr · @param {Function} add
 * @param {object} o
 *  frente: [[x, z], ...] a borda da frente (a linha que o muro do campo segue); `fora`: [dx, dz] para onde a arquibancada sobe (de preferência) ou `foco`: [x, z] um ponto do lado do campo
 *  D: profundidade em u · tipo: "estadio" (dois andares com o corredor no meio) ou "simples" (uma rampa) · cobertura: null | "chocolate" | "branca" · vaoCobertura: fração do fundo coberta
 *  passo: espaçamento das colunas da malha (60) · nome
 * Devolve { colunas: [{ x, z, dx, dz, y, ... }], topo, fundo: D, perfil, pontasDe } para quem põe bandeiras, torres e reservas.
 */
export function montarTribuna(tr, add, { frente, fora = null, foco = null, D, tipo = "simples", cobertura = null, vaoCobertura = 0.55, passo = 60, nome = "tribuna", muroPainel = 0 }) {
  const E = tr.escala ?? 0.4, K = 0.5 / 0.75; // a inclinação do degrau do kit: 0,5 m de altura por 0,75 m de fundo
  const MURO = 1.25 * 12 * E, CORREDOR = 12 * E * 2.5, LARG_CORREDOR = 5 * 12 * E; // muro de campo 1,25 m, o corredor entre os andares 2,5 m acima do fim da rampa de baixo e 5 m de largura
  const mat = materiaisTribuna(tr);
  // o perfil: [d, y, material] (o segmento que chega ao nó). Os y são a partir do chão que se vê na frente.
  const nos = [[0, -3, null], [0, MURO, "muro"]];
  let yTopo, dCobertura;
  if (tipo === "estadio") {
    const dL = 0.42 * D, y1 = MURO + K * dL;
    nos.push([dL, y1, "torcida"], [dL, y1 + CORREDOR, "concreto"], [dL + LARG_CORREDOR, y1 + CORREDOR, "concreto"]);
    yTopo = y1 + CORREDOR + K * (D - dL - LARG_CORREDOR); nos.push([D, yTopo, "torcida"]);
  } else { yTopo = MURO + K * D; nos.push([D, yTopo, "torcida"]); }
  const alturaNa = (d) => { for (let j = 2; j < nos.length; j++) if (d <= nos[j][0] + 1e-6 && nos[j][0] > nos[j - 1][0] + 1e-6) { const [d0, y0] = nos[j - 1], [d1, y1] = nos[j]; return y0 + ((y1 - y0) * (d - d0)) / (d1 - d0); } return yTopo; };
  // as colunas: nas pernas retas a cada `passo`; nos cantos, um leque em volta do canto da frente
  const orient = (a, b) => { // a normal de fora da perna a->b
    const tx = b[0] - a[0], tz = b[1] - a[1], L = Math.hypot(tx, tz) || 1; let nx = tz / L, nz = -tx / L;
    const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
    if (fora) { if (nx * fora[0] + nz * fora[1] < 0) { nx = -nx; nz = -nz; } } else if (foco) { if ((mx - foco[0]) * nx + (mz - foco[1]) * nz < 0) { nx = -nx; nz = -nz; } }
    return [nx, nz];
  };
  const cols = []; let s = 0;
  const poe = (x, z, dx, dz, ds) => { s += ds; cols.push({ x, z, dx, dz, s, b: nivelDoChao(tr, x, z) + 0.15 }); };
  for (let i = 0; i + 1 < frente.length; i++) {
    const a = frente[i], b = frente[i + 1], [nx, nz] = orient(a, b), L = Math.hypot(b[0] - a[0], b[1] - a[1]), m = Math.max(1, Math.ceil(L / passo));
    if (i > 0) { // o leque do canto: da normal da perna anterior para a desta, pelo caminho curto
      const [px, pz] = orient(frente[i - 1], a); let a0 = Math.atan2(pz, px), a1 = Math.atan2(nz, nx), dl = a1 - a0; while (dl > Math.PI) dl -= Math.PI * 2; while (dl < -Math.PI) dl += Math.PI * 2;
      const K2 = Math.max(2, Math.ceil(Math.abs(dl) / 0.2));
      for (let k = 1; k < K2; k++) { const t = a0 + (dl * k) / K2; poe(a[0], a[1], Math.cos(t), Math.sin(t), (Math.abs(dl) / K2) * D * 0.5); }
    }
    for (let k = 0; k <= m; k++) poe(a[0] + ((b[0] - a[0]) * k) / m, a[1] + ((b[1] - a[1]) * k) / m, nx, nz, k === 0 ? 0 : L / m);
  }
  const P = (c, d, y) => [c.x + c.dx * d, c.b + y, c.z + c.dz * d];
  const chao = (c, d) => nivelDoChao(tr, c.x + c.dx * d, c.z + c.dz * d);
  const L = { torcida: lote(), concreto: lote(), muro: lote(), roof: lote(), roofB: lote() };
  const corDeg = new THREE.Color("#c9ccd0"), corFundo = new THREE.Color("#a9adb3"), corCapa = new THREE.Color("#b4b8be"), corMuro = new THREE.Color("#14502f");
  // 1. as faixas do perfil, coluna a coluna
  let comp = 0;
  for (let j = 1; j < nos.length; j++) {
    const [d0, y0] = nos[j - 1], [d1, y1, tp] = nos[j], seg = Math.hypot(d1 - d0, y1 - y0); if (!tp || seg < 1e-6) { comp += seg; continue; }
    const alvo = tp === "muro" ? L.muro : tp === "torcida" ? L.torcida : L.concreto, cor = tp === "concreto" ? corDeg : null;
    for (let c = 0; c + 1 < cols.length; c++) {
      const A = cols[c], B = cols[c + 1]; if (B.s - A.s < 1e-6 && Math.hypot(B.x - A.x, B.z - A.z) < 1e-6 && Math.abs(B.dx - A.dx) + Math.abs(B.dz - A.dz) < 1e-6) continue;
      const ua = A.s / 38.4, ub = B.s / 38.4, va = comp / 28.8, vb = (comp + seg) / 28.8;
      if (tp === "muro") quad(alvo, P(A, d0, y0), P(B, d0, y0), P(A, d1, y1), P(B, d1, y1), [A.s / 96, 0], [B.s / 96, 0], [A.s / 96, 1], [B.s / 96, 1]);
      else quad(alvo, P(A, d0, y0), P(B, d0, y0), P(A, d1, y1), P(B, d1, y1), [ua, va], [ub, va], [ua, vb], [ub, vb], cor);
    }
    comp += seg;
  }
  // 2. a parede de trás: do topo da rampa até 3 u abaixo do chão que se vê atrás
  for (let c = 0; c + 1 < cols.length; c++) {
    const A = cols[c], B = cols[c + 1];
    quad(L.concreto, P(A, D, yTopo), P(B, D, yTopo), [A.x + A.dx * D, chao(A, D) - 3, A.z + A.dz * D], [B.x + B.dx * D, chao(B, D) - 3, B.z + B.dz * D], [0, 0], [0, 0], [0, 0], [0, 0], corFundo);
  }
  // 3. as tampas das pontas (o corte inteiro, com o fundo seguindo o chão)
  for (const [c, lado] of [[cols[0], 0], [cols[cols.length - 1], 1]]) {
    const contorno = nos.map(([d, y]) => new THREE.Vector2(d, y)), ds = [...new Set(nos.map((n) => n[0]))].reverse();
    for (const d of ds) contorno.push(new THREE.Vector2(d, chao(c, d) - 3 - c.b));
    const lim = contorno.filter((p, i) => i === 0 || p.distanceTo(contorno[i - 1]) > 1e-4);
    const tris = THREE.ShapeUtils.triangulateShape(lim, []);
    const k = L.concreto.pos.length / 3;
    for (const p of lim) { L.concreto.pos.push(c.x + c.dx * p.x, c.b + p.y, c.z + c.dz * p.x); L.concreto.uv.push(0, 0); L.concreto.col.push(corCapa.r, corCapa.g, corCapa.b); }
    for (const t of tris) L.concreto.idx.push(k + t[0], k + t[1], k + t[2]);
  }
  // 4. a cobertura: uma lâmina inclinada sobre a parte de trás, com a beirada e as colunas
  const colunas = [];
  if (cobertura) {
    const dr = D * (1 - vaoCobertura), livre = 6 * 12 * E, folga = 8, y0 = alturaNa(dr) + livre, y1 = yTopo + livre + folga, espessura = 4;
    for (let c = 0; c + 1 < cols.length; c++) {
      const A = cols[c], B = cols[c + 1]; if (Math.hypot(B.x - A.x, B.z - A.z) < 1e-6 && Math.abs(B.dx - A.dx) + Math.abs(B.dz - A.dz) < 1e-6) continue;
      quad(L.roof, P(A, dr, y0), P(B, dr, y0), P(A, D + 6, y1), P(B, D + 6, y1), [0, 0], [0, 0], [0, 0], [0, 0]);
      quad(L.roof, P(A, dr, y0 - espessura), P(B, dr, y0 - espessura), P(A, dr, y0), P(B, dr, y0), [0, 0], [0, 0], [0, 0], [0, 0]); // a beirada da frente
    }
    for (let c = 0; c < cols.length; c++) {
      const A = cols[c]; if (c > 0 && Math.hypot(A.x - cols[c - 1].x, A.z - cols[c - 1].z) < 1e-6) continue;
      const ponto = P(A, dr, 0), base = A.b + alturaNa(dr) - 1;
      colunas.push({ x: ponto[0], y: (base + y0 - espessura) / 2, z: ponto[2], sx: 1.6, sy: y0 - espessura - base, sz: 1.6 });
    }
  }
  // 5. põe tudo na cena
  const g = new THREE.Group(); g.name = nome;
  const mm = [malha(L.torcida, mat.torcida, nome + "-torcida"), malha(L.concreto, mat.concreto, nome + "-concreto", true), malha(L.muro, mat.muro[muroPainel % 2], nome + "-muro"), malha(L.roof, cobertura === "branca" ? mat.coberturaBranca : mat.cobertura, nome + "-cobertura")];
  for (const m of mm) if (m) g.add(m);
  add(g);
  if (colunas.length) instancias(add, new THREE.BoxGeometry(1, 1, 1), M(0xaeb4ba, { roughness: 0.6 }), colunas, { nome: nome + "-colunas" });
  // 6. o que a pista vai querer saber: onde ficam o topo da parede de trás e o círculo de cada coluna (reserva)
  const topos = cols.map((c) => ({ x: c.x + c.dx * D, z: c.z + c.dz * D, y: c.b + yTopo, dx: c.dx, dz: c.dz, frente: [c.x, c.z], b: c.b }));
  tr.reservado ||= [];
  for (let c = 0; c < cols.length; c++) { if (c > 0 && Math.hypot(cols[c].x - cols[c - 1].x, cols[c].z - cols[c - 1].z) < 1e-6 && c % 2) continue; const q = cols[c]; tr.reservado.push([q.x + q.dx * D * 0.5, q.z + q.dz * D * 0.5, D * 0.62 + 18]); }
  return { colunas: cols.length, topos, yTopo, D, passo, alturaNa };
}
