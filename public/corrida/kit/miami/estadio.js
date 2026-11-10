// Miami — o Hard Rock Stadium no meio do circuito (sem o nome da marca no desenho: o letreiro diz só "MIAMI GARDENS"): a fachada branca com as
// nervuras e a faixa de vidro, as arquibancadas em três cores (aqua, laranja e azul-marinho) em três níveis, a faixa de LED que corre em volta
// do anel, o gramado listrado, a cobertura branca em anel e os quatro mastros altos com os cabos que a seguram. Tamanho real (planos/escala-real.md):
// tudo é medido em metros e vira unidades por `UM(tr)` = 12 × `tr.escala` (4,8 u por metro). O anel tem 250 × 206 m por fora (o de verdade tem uns 270 m
// de comprimento, de memória), a bacia de assentos tem o degrau de 0,45 × 0,8 m, o campo é o de 105 × 68 m e a fachada tem andares de 3,5 m.
// Origem no chão, eixo comprido em x. Tudo é cenário: uma malha por material (o anel é uma fita em volta de uma elipse).
import * as THREE from "three";
import { canvasTex, M } from "../../cena.js";
import { Montador, solido, tom } from "../montagem.js";
import { marcaTex } from "../marcas.js";
import { instancias, sorteio, tinta } from "../comum.js";
import { nivelDoChao } from "./chao.js";
import { UM } from "./lugar.js";

// os semieixos de fora da fachada, em metros (A no eixo x, B no z), e o recuo da praça de concreto em volta
export const MEDIDAS_M = { A: 125, B: 103, praca: 16 };
export const medidasEstadio = (tr) => { const k = UM(tr); return { A: MEDIDAS_M.A * k, B: MEDIDAS_M.B * k, praca: MEDIDAS_M.praca * k, k }; };
const AQUA = "#0aa3ad", LARANJA = "#f26a1b", MARINHO = "#0b2a5b", BRANCO = "#f1efe8";

// uma faixa entre duas elipses concêntricas do anel (a elipse a `d` para dentro da parede de fora), uma casa de cor por seção
function anelEl(A, B, d0, y0, d1, y1, { seg = 72, cor = () => "#ffffff", uvU = seg, uvV = 1 } = {}) {
  const pos = [], uv = [], col = [], idx = [], c = new THREE.Color();
  for (let k = 0; k < seg; k++) {
    const t0 = (k / seg) * Math.PI * 2, t1 = ((k + 1) / seg) * Math.PI * 2; c.set(cor(k));
    const base = pos.length / 3;
    for (const [t, u] of [[t0, (k / seg) * uvU], [t1, ((k + 1) / seg) * uvU]]) for (const [d, y, v] of [[d0, y0, 0], [d1, y1, uvV]]) {
      pos.push((A - d) * Math.cos(t), y, (B - d) * Math.sin(t)); uv.push(u, v); col.push(c.r, c.g, c.b);
    }
    idx.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
// um cabo (cilindro fino) de p0 a p1 num Montador
function cabo(m, mat, p0, p1, r, cor) {
  const dx = p1[0] - p0[0], dy = p1[1] - p0[1], dz = p1[2] - p0[2], L = Math.hypot(dx, dy, dz), hor = Math.hypot(dx, dz);
  m.cilindro(mat, [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2], [r, L], { cor, seg: 5, rx: Math.atan2(hor, dy), ry: Math.atan2(dx, dz) });
}

function texturas() {
  const assentos = canvasTex(128, 128, (x, w, h, rr) => {
    x.fillStyle = "#ffffff"; x.fillRect(0, 0, w, h);
    for (let r = 0; r < 4; r++) {
      const y0 = r * 32; x.fillStyle = "rgba(0,0,0,0.22)"; x.fillRect(0, y0, w, 3); x.fillStyle = "rgba(0,0,0,0.10)"; x.fillRect(0, y0 + 3, w, 9);
      for (let i = 0; i < 20; i++) if (rr() < 0.72) { x.fillStyle = ["#f4f4f2", "#2a2f3a", "#c93a2e", "#f1c7a5", "#ffd23f", "#1f6fc9"][(rr() * 6) | 0]; x.fillRect(i * 6.4 + rr() * 2, y0 + 12 + rr() * 2, 4, 9); }
    }
  });
  const fachada = canvasTex(128, 128, (x, w, h) => {
    x.fillStyle = "#ece9e2"; x.fillRect(0, 0, w, h);
    x.fillStyle = "#c9c6bd"; for (const px of [0, 62, 124]) x.fillRect(px, 0, 4, h); // as nervuras
    x.fillStyle = "#2b4756"; x.fillRect(8, 40, 108, 46); // a faixa de vidro
    x.fillStyle = "#6f94ad"; for (let k = 0; k < 4; k++) x.fillRect(10 + k * 27, 42, 24, 20);
    x.fillStyle = "#ffffff55"; for (let k = 0; k < 4; k++) x.fillRect(10 + k * 27, 42, 24, 4);
  });
  const gramado = canvasTex(256, 160, (x, w, h) => {
    for (let k = 0; k < 14; k++) { x.fillStyle = k % 2 ? "#3f9a3f" : "#4aa84a"; x.fillRect((k * w) / 14, 0, w / 14 + 1, h); }
    x.strokeStyle = "#ffffffcc"; x.lineWidth = 2; x.strokeRect(10, 8, w - 20, h - 16); x.beginPath(); x.moveTo(w / 2, 8); x.lineTo(w / 2, h - 8); x.stroke();
    x.beginPath(); x.arc(w / 2, h / 2, 20, 0, 6.3); x.stroke(); x.strokeRect(10, h / 2 - 34, 34, 68); x.strokeRect(w - 44, h / 2 - 34, 34, 68);
  }, false);
  return { assentos, fachada, gramado };
}
let _tex = null;

/** O estádio inteiro num Group (origem no chão, no centro; eixo comprido em x). `baseY` desce a base até o chão mais baixo; `escala` é `tr.escala`. */
export function estadio({ escala = 0.4, baseY = 8, semente = 11 } = {}) {
  const k = 12 * escala, m = (v) => v * k, { A: Am, B: Bm, praca: pm } = MEDIDAS_M, A = m(Am), B = m(Bm);
  const T = (_tex ||= texturas()), r = sorteio(semente), g = new THREE.Group(); g.name = "miami-estadio";
  // as medidas do anel, em metros (d: para dentro a partir da parede de fora; y: acima do gramado): a parede de 28 m, a bacia de cima de 8 a 36 m (de 30 m a 15 m de altura:
  // 28 m de fundo para 15 m de subida, 0,45 × 0,8 m por degrau), a faixa de LED, o corredor a 12 m, a bacia de baixo de 46 a 66 m (de 12 m a 1 m) e o campo a 67,5 m da parede
  const PAREDE = 28, TOPO = 40, MASTRO = 72, D_TOPO = 8, Y_TOPO = 30, D_FITA = 36, Y_FITA = 15, D_BAIXO = 46, Y_BAIXO = 12, D_CAMPO = 66, Y_CAMPO = 1;
  const add = (geo, mat, o = {}) => { const mm = new THREE.Mesh(geo, mat); mm.receiveShadow = true; mm.castShadow = !!o.sombra; g.add(mm); return mm; };
  const comp = (a, b) => Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b))); // o perímetro de uma elipse (Ramanujan)
  // a base: o aterro sob o estádio e a praça de concreto em volta
  const plinto = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, baseY + 1.4, 48), M(0xcfcac0, { roughness: 0.95 }));
  plinto.scale.set(A + m(pm), 1, B + m(pm)); plinto.position.y = -baseY / 2 + 0.7; plinto.receiveShadow = true; g.add(plinto);
  const praca = new THREE.Mesh(new THREE.CircleGeometry(1, 64), tinta(canvasTex(128, 128, (x, w, h, rr) => { x.fillStyle = "#d8d4ca"; x.fillRect(0, 0, w, h); x.strokeStyle = "#bdb8ac"; x.lineWidth = 1; for (let q = 0; q <= 8; q++) { x.beginPath(); x.moveTo((q * w) / 8, 0); x.lineTo((q * w) / 8, h); x.moveTo(0, (q * h) / 8); x.lineTo(w, (q * h) / 8); x.stroke(); } for (let q = 0; q < 120; q++) { x.fillStyle = `rgba(0,0,0,${rr() * 0.05})`; x.fillRect(rr() * w, rr() * h, 6, 6); } }), { roughness: 1, transparent: false, depthWrite: true }));
  praca.rotation.x = -Math.PI / 2; praca.scale.set(A + m(pm), B + m(pm), 1); praca.position.y = 1.5; praca.receiveShadow = true; g.add(praca);
  praca.material.map.repeat.set(Math.round((A + m(pm)) / m(8)), Math.round((B + m(pm)) / m(8))); // uma laje de 8 m de lado por repetição (8 juntas: lajes de 1 m)

  // a fachada: nervuras, faixa de vidro e as listras de aqua e laranja no pé; a textura repete a cada 10 m de largura e 10 m de altura (andares de 3,5 m)
  add(anelEl(A, B, 0, 0, 0, m(PAREDE), { seg: 72, cor: () => "#ffffff", uvU: Math.round(comp(A, B) / m(10)), uvV: PAREDE / 10 }), new THREE.MeshStandardMaterial({ map: T.fachada, vertexColors: true, side: THREE.DoubleSide, roughness: 0.7 }));
  // as listras de aqua e laranja no pé da parede (fora da textura, que repete a cada andar)
  add(anelEl(A, B, -m(0.1), 0, -m(0.1), m(1.2), { cor: () => AQUA }), new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.7 }));
  add(anelEl(A, B, -m(0.1), m(1.2), -m(0.1), m(1.8), { cor: () => LARANJA }), new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.7 }));
  // o topo da parede e o caminho de serviço
  add(anelEl(A, B, -m(0.5), m(PAREDE), m(D_TOPO), m(PAREDE)), M(0xdedbd2, { side: THREE.DoubleSide }));
  // as arquibancadas: o nível de cima (aqua, laranja e marinho, em seções), a faixa de LED, o corredor e o nível de baixo; a textura tem 4 fileiras (3,2 m) por repetição
  const secoes = (q) => [AQUA, BRANCO, LARANJA, MARINHO, AQUA, MARINHO][Math.floor(q / 4) % 6];
  const matAss = new THREE.MeshStandardMaterial({ map: T.assentos, vertexColors: true, side: THREE.DoubleSide, roughness: 0.85 });
  const uvAss = Math.round(comp(A - m(20), B - m(20)) / m(10)), fundoCima = Math.hypot(D_FITA - D_TOPO, Y_TOPO - Y_FITA), fundoBaixo = Math.hypot(D_CAMPO - D_BAIXO, Y_BAIXO - Y_CAMPO);
  add(anelEl(A, B, m(D_TOPO), m(Y_TOPO), m(D_FITA), m(Y_FITA), { cor: secoes, uvU: uvAss, uvV: fundoCima / 3.2 }), matAss);
  add(anelEl(A, B, m(D_FITA), m(Y_FITA), m(D_FITA), m(Y_BAIXO + 0.5), { cor: () => "#1a2230" }), M(0x1a2230, { side: THREE.DoubleSide }));
  // a faixa de LED que corre em volta do anel (texto repetido, vira a luz da câmera no fim da tarde): 2 m de altura, o texto tem 16 m de largura
  const led = new THREE.MeshBasicMaterial({ map: marcaTex("mimiami", 512, 64), side: THREE.DoubleSide, toneMapped: false });
  led.map.wrapS = THREE.RepeatWrapping; led.map.repeat.set(Math.round(comp(A - m(D_FITA), B - m(D_FITA)) / m(16)), 1);
  add(anelEl(A, B, m(D_FITA - 0.3), m(Y_FITA - 0.3), m(D_FITA - 0.3), m(Y_FITA - 2.3), { uvU: 1 }), led).userData.bloom = true;
  add(anelEl(A, B, m(D_FITA), m(Y_BAIXO + 0.5), m(D_BAIXO), m(Y_BAIXO), { cor: () => "#cfcac0" }), M(0xcfcac0, { side: THREE.DoubleSide }));
  add(anelEl(A, B, m(D_BAIXO), m(Y_BAIXO), m(D_CAMPO), m(Y_CAMPO), { cor: (q) => [AQUA, LARANJA, MARINHO, BRANCO, AQUA, LARANJA][Math.floor((q + 2) / 3) % 6], uvU: Math.round(comp(A - m(55), B - m(55)) / m(10)), uvV: fundoBaixo / 3.2 }), matAss);
  add(anelEl(A, B, m(D_CAMPO), m(Y_CAMPO), m(D_CAMPO + 1.5), m(0.6), {}), M(0x16355c, { side: THREE.DoubleSide }));
  // o gramado listrado, com as marcas do campo (115 × 71 m: o campo de 105 × 68 m e a sobra dos lados)
  const campo = add(new THREE.PlaneGeometry(2 * (A - m(D_CAMPO + 1.5)), 2 * (B - m(D_CAMPO + 1.5))), new THREE.MeshStandardMaterial({ map: T.gramado, roughness: 0.95 }));
  campo.rotation.x = -Math.PI / 2; campo.position.y = m(0.6);
  // a cobertura branca em anel: sai da beirada de fora, sobe e fecha em cima das arquibancadas de cima; a borda de dentro leva uma viga (3 m)
  const branco = new THREE.MeshStandardMaterial({ color: 0xf6f4ee, side: THREE.DoubleSide, roughness: 0.55, emissive: 0x2a2822 });
  add(anelEl(A, B, -m(8), m(TOPO + 1), m(D_BAIXO), m(TOPO - 4)), branco, { sombra: true });
  add(anelEl(A, B, m(D_BAIXO), m(TOPO - 4), m(D_BAIXO), m(TOPO - 7)), M(0xdedbd2, { side: THREE.DoubleSide }));
  add(anelEl(A, B, -m(8), m(TOPO + 1), -m(8), m(TOPO - 2)), M(0xe9e6de, { side: THREE.DoubleSide }));
  add(anelEl(A, B, m(18), m(TOPO - 2.2), m(D_BAIXO), m(TOPO - 5.2), { cor: () => "#9aa4ad" }), M(0xffffff, { vertexColors: true, side: THREE.DoubleSide })); // a treliça de baixo da cobertura (vista de dentro)

  // as portas de entrada (24, de 6 × 5 m), as marquises e os mastros com os cabos
  const mt = new Montador(), S = solido();
  for (let q = 0; q < 24; q++) {
    const t = ((q + 0.5) / 24) * Math.PI * 2, px = (A + m(0.3)) * Math.cos(t), pz = (B + m(0.3)) * Math.sin(t), ry = -Math.atan2((B / A) * Math.cos(t), -Math.sin(t)) + Math.PI / 2;
    mt.caixa(S, [px, m(2.5), pz], [m(6), m(5), m(1.4)], { cor: "#26323d", ry });
    mt.caixa(S, [px, m(5.3), pz], [m(8), m(0.6), m(3)], { cor: AQUA, ry });
  }
  const cantos = [[1, 1], [-1, 1], [1, -1], [-1, -1]];
  for (const [sx, sz] of cantos) {
    const bx = sx * (A * 0.8 + m(4)), bz = sz * (B * 0.84 + m(3)), tx = bx * 0.86, tz = bz * 0.86; // o mastro se inclina para dentro
    const N = 6;
    for (let q = 0; q < N; q++) {
      const f0 = q / N, f1 = (q + 1) / N, w = m(4.5 - 2.2 * f0), x = bx + (tx - bx) * (f0 + f1) / 2, z = bz + (tz - bz) * (f0 + f1) / 2;
      mt.caixa(S, [x, (m(MASTRO) * (f0 + f1)) / 2, z], [w, m(MASTRO) / N + 0.3, w], { cor: q % 2 ? "#ffffff" : "#ece9e2" });
    }
    mt.caixa(S, [tx, m(MASTRO + 1), tz], [m(1.6), m(2), m(1.6)], { cor: AQUA });
    // os cabos: do alto do mastro à borda da cobertura, em leque (e dois estais para o chão, do lado de fora)
    const ang = Math.atan2(sz * B, sx * A);
    for (let q = -3; q <= 3; q++) {
      const t = ang + q * 0.115, px = (A + m(1)) * Math.cos(t), pz = (B + m(1)) * Math.sin(t);
      cabo(mt, S, [tx, m(MASTRO - 1) - Math.abs(q) * m(0.8), tz], [px * 0.97, m(TOPO + 1), pz * 0.97], 0.6, "#e8e6df");
    }
    cabo(mt, S, [tx, m(MASTRO - 1.5), tz], [bx * 1.25, 0, bz * 1.25], 0.8, "#d4d1c8");
    cabo(mt, S, [tx, m(MASTRO - 4), tz], [bx * 1.12, 0, bz * 1.25], 0.8, "#d4d1c8");
  }
  g.add(mt.montar("miami-estadio-mastros"));
  g.userData = { A, B, alto: m(MASTRO + 2) };
  void r;
  return g;
}

// um estacionamento: asfalto com as vagas pintadas (2,7 m de largura) e os carros parados (4,5 × 1,8 × 1,5 m) em InstancedMesh (carroçaria e vidro, cada um da sua cor)
export function estacionamento(tr, add, { x, z, rot = 0, a = 130, b = 60, semente = 5, lotacao = 0.7 }) {
  const rr = sorteio(semente), k = UM(tr), hs = [], fil = Math.max(2, Math.round((2 * b) / (7.5 * k))), nv = Math.round((2 * a) / (2.7 * k));
  const c = Math.cos(rot), s = Math.sin(rot);
  let hi = -1e9, lo = 1e9; for (const u of [-a, 0, a]) for (const v of [-b, 0, b]) { const h = nivelDoChao(tr, x + c * u - s * v, z + s * u + c * v); hi = Math.max(hi, h); lo = Math.min(lo, h); }
  const asf = new THREE.Mesh(new THREE.PlaneGeometry(2 * a, 2 * b), tinta(canvasTex(512, 256, (cx, w, h, q) => {
    cx.fillStyle = "#3a3b40"; cx.fillRect(0, 0, w, h); for (let q2 = 0; q2 < 900; q2++) { cx.fillStyle = `rgba(255,255,255,${q() * 0.05})`; cx.fillRect(q() * w, q() * h, 2, 2); }
    cx.strokeStyle = "#e9e6dc"; cx.lineWidth = 2;
    for (let f = 0; f < fil; f++) { const y0 = ((f + 0.1) * h) / fil, y1 = ((f + 0.9) * h) / fil; for (let q2 = 0; q2 <= nv; q2++) { cx.beginPath(); cx.moveTo((q2 * w) / nv, y0); cx.lineTo((q2 * w) / nv, y1); cx.stroke(); } }
  }, false), { roughness: 0.95, transparent: false, depthWrite: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
  asf.rotation.x = -Math.PI / 2; asf.rotation.z = -rot; asf.position.set(x, hi + 0.5, z); asf.receiveShadow = true; add(asf);
  // o chão sob o asfalto: um bloco que desce até o terreno mais baixo
  const fundo = hi - lo + 8, bloco = new THREE.Mesh(new THREE.BoxGeometry(2 * a, fundo, 2 * b), M(0x3a3b40, { roughness: 1 })); bloco.position.set(x, hi + 0.5 - fundo / 2, z); bloco.rotation.y = -rot; add(bloco);
  const cores = ["#e9e9ec", "#1d1f24", "#b3262e", "#274c8f", "#9aa0a8", "#d9b24a", "#2f6b4a", "#ff5fa2", "#0aa3ad"];
  const corpos = [], vidros = [];
  for (let f = 0; f < fil; f++) for (let q = 0; q < nv; q++) {
    if (rr() > lotacao) continue;
    const u = -a + ((q + 0.5) * 2 * a) / nv, v = -b + ((f + 0.5) * 2 * b) / fil, px = x + c * u - s * v, pz = z + s * u + c * v, py = hi + 0.6;
    const ry = -rot + Math.PI / 2 + (rr() < 0.5 ? 0 : Math.PI), esc = 0.46 + rr() * 0.06; // o modelo tem 44 × 8 u e 14 u com o vidro: × 0,46 a 0,52 dá 4,2 a 4,8 m de comprimento e 1,4 a 1,5 m de altura
    hs.push(py);
    corpos.push({ x: px, y: py + 4 * esc, z: pz, sx: esc * 1.0, sy: esc, sz: esc, r: ry, cor: cores[(rr() * cores.length) | 0] });
    vidros.push({ x: px, y: py + 11 * esc, z: pz, sx: esc, sy: esc, sz: esc, r: ry });
  }
  const geoC = new THREE.BoxGeometry(44, 8, 18), geoV = new THREE.BoxGeometry(22, 6.5, 16);
  const mc = instancias(add, geoC, new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.2 }), corpos, { sombra: false, nome: "miami-carros" });
  if (mc) { const col = new THREE.Color(); corpos.forEach((o, q) => mc.setColorAt(q, col.set(o.cor))); mc.instanceColor.needsUpdate = true; }
  instancias(add, geoV, M(0x1c2630, { roughness: 0.2, metalness: 0.4 }), vidros, { sombra: false, nome: "miami-vidros" });
  return { carros: corpos.length };
}
