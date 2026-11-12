// Catar (Lusail) — o que fica atrás do prédio dos boxes e em volta dele: o paddock e as dezesseis vilas das equipes (grupos de quatro, com a frente curva e telas de LED no primeiro andar; Tilke), as sombras de aço que parecem galhos de
// árvore (Tilke: "metal shading canopies"), o edifício VVIP no ápice da Curva 1, o centro de mídia, a Lusail Hill (o morro gramado da curva 1 para o público geral, a "arquibancada natural" de 2 100 lugares; Ashghal/Gulf Times e Peninsula Qatar) e o
// verde do circuito (180 mil m² de áreas verdes, 2 577 árvores e quase 27 mil arbustos: Peninsula Qatar). Em volta de tudo, o deserto plano do Catar: moitas de mato seco e pedras soltas.
// Medidas ESTIMADAS (as fontes só dão que são 16 vilas em grupos de quatro e a sala de imprensa de 400 lugares): a vila de 12,5 × 9 m, dois andares de 4 m; a sombra de 7,5 m; a colina de 117 × 42 m e 5,8 m de altura (feita para caberem as 2 100 pessoas da arquibancada natural).
// Tudo em regiões (uma malha por material e por região) e InstancedMesh para as árvores e as moitas; nada se mexe. Cada peça pousa no chão que se vê (`nivelDoChao`) e respeita `livre`/`ocupado`.
import * as THREE from "three";
import { canvasTex, M } from "../../../cena.js";
import { livre, ocupado, sorteio, sinalDaCurva, instancias } from "../comum.js";
import { solido, vidro } from "../montagem.js";
import { Regiao, pintor, piso, materialDaNoite } from "./base.js";
import { nivelDoChao } from "./chao.js";

const BRANCO = "#f3f4f4", CINZA = "#cfd2d5", ACO = "#4a5159", VIDRO = "#22303d";
const EQUIPES = ["#e10600", "#27f4d2", "#ff8700", "#3671c6", "#229971", "#64c4ff", "#b6babd", "#6692ff", "#52e252", "#fd4bc7", "#0f2a52", "#c8a24a", "#7a1fa2", "#111111", "#ff5a1f", "#1f8a8a"];

// a cor do concreto do paddock, com juntas e manchas (ladrilho de 40 u)
const concretoPaddock = () => new THREE.MeshStandardMaterial({ roughness: 0.95, map: canvasTex(64, 64, (x, w, h, rr) => {
  x.fillStyle = "#b6b7b3"; x.fillRect(0, 0, w, h); for (let i = 0; i < 120; i++) { x.fillStyle = rr() < 0.5 ? "#00000012" : "#ffffff12"; x.fillRect(rr() * w, rr() * h, 3 + rr() * 5, 2 + rr() * 3); }
  x.fillStyle = "#00000030"; x.fillRect(0, 0, w, 1); x.fillRect(0, 0, 1, h);
}), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
const gramaMat = (cor = "#4c8a3a") => new THREE.MeshStandardMaterial({ roughness: 1, map: canvasTex(64, 64, (x, w, h, rr) => {
  x.fillStyle = cor; x.fillRect(0, 0, w, h); for (let i = 0; i < 700; i++) { const k = rr(); x.fillStyle = k < 0.4 ? "#5da048" : k < 0.75 ? "#3b7330" : "#6bb056"; x.fillRect(rr() * w, rr() * h, 1, 2); }
}), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });

/**
 * O paddock atrás do prédio dos boxes: o piso de concreto, as dezesseis vilas, as sombras de aço, o centro de mídia e as árvores.
 * @param {object} boxes o que `predioDosBoxes` devolveu ({ F, v0, fundo, comprimento, baia })
 */
export function paddock(tr, add, boxes) {
  if (!boxes) return null;
  const { F, v0, fundo, comprimento: L, baia } = boxes, r = sorteio(6271), reg = new Regiao(360), P = pintor(F, reg), S = solido(), V = vidro();
  const noite = materialDaNoite(tr, "#2a3038", "#d6ecff"), led = materialDaNoite(tr, "#14181d", "#8fd0ff");
  const vp = v0 + fundo + 26, vf = vp + 270, s0 = baia * 3, s1 = L - baia * 3; // o paddock: de 26 u atrás do prédio até 270 u mais
  // o piso: concreto em cima do terreno (uma grade que segue o relevo), uns 0,2 u acima do chão que se vê
  const pisoMat = concretoPaddock(); pisoMat.map.repeat.set(1, 1);
  const grade = piso(tr, add, F, [s0 - 30, s1 + 30, vp - 20, vf + 20], pisoMat, { y: -1.2, passo: 40, uv: [(s1 - s0 + 60) / 40, (vf - vp + 40) / 40], nome: "catar-paddock-piso" });
  const solo = (s, v) => { const q = F.at(s, v); return nivelDoChao(tr, q.x, q.z) - q.h; }; // a altura do chão em relação à pista (o pintor soma a da pista)
  const chao = (s, v) => solo(s, v) - 0.4;
  // ---- as dezesseis vilas: quatro grupos de quatro, cada vila de um tamanho e de uma cor de acento; a frente é curva, voltada para o prédio dos boxes ----
  const grupos = 4, vilas = [];
  for (let g = 0; g < grupos; g++) {
    const cs = s0 + ((g + 0.5) / grupos) * (s1 - s0), larg = (s1 - s0) / grupos - 40;
    for (let k = 0; k < 4; k++) {
      const w = 52 + r() * 14, d = 40 + r() * 10, alto = r() < 0.7 ? 2 : 3, sv = cs - larg / 2 + ((k + 0.5) / 4) * larg + (r() - 0.5) * 6, vv = vp + 40 + (k % 2) * 6 + r() * 6;
      vilas.push({ s: sv, v: vv, w, d, alto, cor: EQUIPES[(g * 4 + k) % EQUIPES.length] });
    }
  }
  vilas.forEach(({ s, v, w, d, alto, cor }, k) => {
    const h = alto * 22, y = chao(s, v), R = w / 2, vFrente = v - d / 2, q0 = F.at(s, vFrente);
    P.caixa(S, s, v, y - 30, [w, 30 + 0.4, d], "#a9adb1"); // a base, que desce até o chão
    P.caixa(S, s, v, y, [w, h, d], k % 3 ? BRANCO : CINZA); // o corpo
    // a frente curva: meio cilindro voltado para o prédio dos boxes (para o lado de menor v), com a parede de vidro e a tela de LED do primeiro andar
    const meio = new THREE.CylinderGeometry(1, 1, 1, 22, 1, false, Math.PI / 2, Math.PI), faixa = new THREE.CylinderGeometry(1, 1, 1, 22, 1, true, Math.PI / 2 + 0.35, Math.PI - 0.7);
    const reg0 = reg.de(q0.x, q0.z), yy = q0.h + y;
    reg0.geo(S, meio, { x: q0.x, y: yy + h / 2, z: q0.z, sx: R, sy: h, sz: R * 0.85, ry: q0.ry, cor: k % 3 ? BRANCO : "#e6e8ea" });
    reg0.geo(V, faixa, { x: q0.x, y: yy + 8, z: q0.z, sx: R + 0.35, sy: 13, sz: R * 0.85 + 0.35, ry: q0.ry, cor: VIDRO }); // o térreo de vidro
    if (alto >= 2) reg0.geo(led, faixa, { x: q0.x, y: yy + 22 + 10, z: q0.z, sx: R + 0.5, sy: 12, sz: R * 0.85 + 0.5, ry: q0.ry, cor: "#ffffff" }); // a tela de LED, para as equipes passarem a marca
    P.caixa(S, s, vFrente, y + h, [w + 1, 1.6, 0.2], BRANCO); // (o beiral reto atrás do meio cilindro)
    reg0.geo(S, new THREE.CylinderGeometry(1, 1, 1, 22, 1, false, Math.PI / 2, Math.PI), { x: q0.x, y: yy + h + 0.8, z: q0.z, sx: R + 3, sy: 1.6, sz: (R + 3) * 0.85, ry: q0.ry, cor: cor }); // a laje do teto, na cor da equipe
    P.caixa(noite, s, v + d / 2 + 0.2, y + 3, [w * 0.5, 9, 0.4], "#ffffff"); // a porta dos fundos, que acende de noite
    P.caixa(S, s, v + 4, y + h + 1.6, [w * 0.5, 4 + r() * 4, d * 0.4], "#9ea3a8"); // o ar-condicionado do teto
  });
  // ---- as sombras de aço, parecidas com árvores: uma coluna central, quatro braços que abrem e a cobertura de ripas ----
  const sombras = [];
  for (let k = 0; k < 26; k++) {
    const s = s0 + r() * (s1 - s0), v = vp + 90 + r() * (vf - vp - 90); // entre as vilas e a beirada do fundo
    if (vilas.some((a) => Math.abs(a.s - s) < a.w / 2 + 34 && Math.abs(a.v - v) < a.d / 2 + 34) || sombras.some((b) => Math.hypot(b.s - s, b.v - v) < 60)) continue;
    sombras.push({ s, v, lado: 22 + r() * 18, alto: 30 + r() * 12 });
  }
  for (const { s, v, lado, alto } of sombras) {
    const y = chao(s, v), q = F.at(s, v);
    P.cil(S, s, v, y, [1.2, alto], ACO, { seg: 8 }); // a coluna central
    for (let a = 0; a < 4; a++) { // os braços, que abrem como galhos
      const ang = (a / 4) * Math.PI * 2 + 0.4, dx = Math.cos(ang) * 8, dz = Math.sin(ang) * 8, qq = F.at(s + dx, v + dz);
      reg.de(qq.x, qq.z).caixa(S, [qq.x, qq.h + y + alto - 8, qq.z], [1, 18, 1], { cor: ACO, ry: qq.ry - ang, rz: -0.9 });
    }
    P.caixa(S, s, v, y + alto, [lado, 1.2, lado], "#8c939a", { ry: q.ry + 0.4 }); // a laje
    for (let m = -2; m <= 2; m++) P.caixa(S, s, v + m * lado / 5, y + alto + 1.2, [lado, 0.5, 1.2], "#cfd4d8"); // as ripas de sombra
  }
  // ---- o centro de mídia, comprido e baixo, na ponta do paddock (400 lugares: a fonte só diz isso) ----
  const sm = s1 + 20, vm = vp + 60, wm = 110, dm = 56;
  P.caixa(S, sm, vm, chao(sm, vm) - 30, [wm, 30.4, dm], "#a9adb1"); P.caixa(S, sm, vm, chao(sm, vm), [wm, 34, dm], BRANCO);
  P.caixa(V, sm, vm - dm / 2 - 0.2, chao(sm, vm) + 6, [wm - 8, 24, 0.5], VIDRO); P.caixa(S, sm, vm - dm / 2 - 8, chao(sm, vm) + 34, [wm + 4, 1.6, 22], "#e8eaeb"); // o vidro e a marquise
  P.caixa(noite, sm, vm - dm / 2 - 0.5, chao(sm, vm) + 8, [wm - 12, 18, 0.3], "#ffffff");
  reg.montar(add, "catar-paddock");
  tr.reservado ||= [];
  for (let s = s0; s <= s1 + 120; s += 36) for (let v = vp; v <= vf; v += 60) { const q = F.at(s, v); tr.reservado.push([q.x, q.z, 50]); }
  // ---- as árvores do paddock (sidra e ghaf de copa redonda): em alamedas entre as vilas e na beirada ----
  const arv = [];
  for (let k = 0; k < 90; k++) {
    const s = s0 - 20 + r() * (s1 - s0 + 40), v = vf - 10 + r() * 50 - (r() < 0.5 ? r() * 240 : 0), q = F.at(s, v);
    if (vilas.some((a) => Math.abs(a.s - s) < a.w / 2 + 14 && Math.abs(a.v - v) < a.d / 2 + 22) || sombras.some((b) => Math.hypot(b.s - s, b.v - v) < b.lado)) continue;
    if (!livre(tr, q.x, q.z, 100)) continue;
    arv.push({ x: q.x, z: q.z, y: nivelDoChao(tr, q.x, q.z) - 0.5, s: 0.85 + r() * 0.6 });
  }
  const nArv = arvores(tr, add, arv, r, "catar-arvores-paddock");
  tr.paddockCT = { vilas: vilas.length, sombras: sombras.length, arvores: nArv, piso: !!grade };
  return { vilas, sombras };
}

// as árvores de copa redonda: o tronco (um cilindro) e a copa (um icosaedro achatado), em dois InstancedMesh, cada copa de um verde
export function arvores(tr, add, lista, r, nome = "catar-arvores") {
  if (!lista.length) return 0;
  const tronco = new THREE.CylinderGeometry(0.7, 1.1, 1, 6), copa = new THREE.IcosahedronGeometry(1, 1); tronco.translate(0, 0.5, 0);
  const im = new THREE.InstancedMesh(tronco, M(0x6b5239), lista.length), ic = new THREE.InstancedMesh(copa, M(0xffffff, { roughness: 0.95, flatShading: true }), lista.length), d = new THREE.Object3D(), c = new THREE.Color();
  const verdes = ["#4d7a3a", "#5a8a42", "#3f6b34", "#6b8f48", "#557a40"];
  lista.forEach((o, k) => {
    const h = 26 * o.s, R = 15 * o.s; // 5,4 m de altura e 6,2 m de copa (estimativa)
    d.position.set(o.x, o.y, o.z); d.rotation.set(0, r() * 6.28, 0); d.scale.set(o.s, h * 0.55, o.s); d.updateMatrix(); im.setMatrixAt(k, d.matrix);
    d.position.set(o.x, o.y + h * 0.55 + R * 0.45, o.z); d.scale.set(R, R * (0.7 + r() * 0.2), R * (0.9 + r() * 0.2)); d.updateMatrix(); ic.setMatrixAt(k, d.matrix); ic.setColorAt(k, c.set(verdes[(r() * 5) | 0]));
  });
  im.castShadow = ic.castShadow = true; im.name = nome; ic.name = `${nome}-copas`; add(im); add(ic);
  return lista.length;
}

// um disco de grama que segue o chão que se vê (a fita de areia de chao.js, que perto da pista não é o chão analítico), 0,15 u acima dele
function discoSobre(tr, add, x, z, raio, mat, nome, { lados = 36, aneis = 5 } = {}) {
  const pos = [x, nivelDoChao(tr, x, z) + 0.15, z], tc = [0.5, 0.5], idx = [];
  for (let a = 1; a <= aneis; a++) for (let k = 0; k < lados; k++) {
    const ang = (k / lados) * Math.PI * 2, rr = (raio * a) / aneis, px = x + Math.cos(ang) * rr, pz = z + Math.sin(ang) * rr;
    pos.push(px, nivelDoChao(tr, px, pz) + 0.15, pz); tc.push(0.5 + (Math.cos(ang) * a) / aneis * 1.6, 0.5 + (Math.sin(ang) * a) / aneis * 1.6);
  }
  const at = (a, k) => (a === 0 ? 0 : 1 + (a - 1) * lados + (k % lados));
  for (let k = 0; k < lados; k++) idx.push(0, at(1, k + 1), at(1, k));
  for (let a = 1; a < aneis; a++) for (let k = 0; k < lados; k++) idx.push(at(a, k), at(a, k + 1), at(a + 1, k), at(a, k + 1), at(a + 1, k + 1), at(a + 1, k));
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(tc, 2)); g.setIndex(idx); g.computeVertexNormals();
  const m = add(new THREE.Mesh(g, mat)); m.receiveShadow = true; m.name = nome; return m;
}

/**
 * O edifício VVIP, no ápice da Curva 1 (Tilke: "no ápice da curva 1, ligado ao paddock por um jardim"; aqui só o jardim em volta dele): um bloco comprido de dois andares, branco e de vidro, de frente para a pista, com o terraço no teto, o jardim em volta e os pilares inclinados da entrada.
 */
export function vvip(tr, add, { frac = 0.106 } = {}) {
  const { pts, n } = tr, r = sorteio(3319), i = Math.floor(frac * n) % n, lado = sinalDaCurva(pts, n, i), p = pts[i];
  const W2 = tr.W / 2;
  let achou = null;
  for (const lat of [150, 135, 120, 165, 110]) { // do lado de dentro da curva, a uma distância em que o edifício (62 × 36 m... 130 × 60 u) cabe entre a pista e o miolo do circuito
    const x = p.x + p.nx * lado * lat, z = p.y + p.ny * lado * lat;
    if (livre(tr, x, z, 100) && !ocupado(tr, x, z, i) && tr.distAt(x, z) > lat - 12) { achou = { x, z, lat }; break; }
  }
  if (!achou) { tr.vvipCT = null; return null; }
  const { x, z, lat } = achou, ang = Math.atan2(p.tx, p.ty), reg = new Regiao(300), S = solido(), V = vidro(), y0 = nivelDoChao(tr, x, z), ry = Math.atan2(-p.nx * lado, -p.ny * lado) + Math.PI; // ry: a frente (+z do bloco) para a pista
  const noite = materialDaNoite(tr, "#4f6f8a", "#ffd9a0", { side: THREE.DoubleSide });
  const m = reg.de(x, z), rot = Math.atan2(p.nx * lado, p.ny * lado) + Math.PI; // o eixo z do bloco aponta para a pista; x acompanha a pista
  const q = (dx, dz) => [x + Math.cos(rot) * dx + Math.sin(rot) * dz, z - Math.sin(rot) * dx + Math.cos(rot) * dz];
  const cx = (dx, dy, dz, sx, sy, sz, mat, cor, extra = {}) => { const [px, pz] = q(dx, dz); m.caixa(mat, [px, y0 + dy, pz], [sx, sy, sz], { cor, ry: rot, ...extra }); };
  cx(0, -14, 0, 134, 30, 64, S, "#a9adb1"); // a base
  cx(0, 11, 0, 130, 22, 60, S, BRANCO); // o térreo
  cx(0, 11, 30.4, 120, 14, 0.5, noite, "#ffffff"); // a vitrine do térreo, de frente para a pista (+z)
  cx(0, 24.4, 6, 140, 2.4, 76, S, "#eceeef"); // a laje com o beiral comprido
  cx(0, 37, -6, 94, 22, 44, V, VIDRO); cx(0, 37, 16.2, 90, 15, 0.5, noite, "#ffffff"); // o andar de cima, de vidro, recuado
  cx(0, 49, -4, 104, 2, 54, S, "#f4f5f5"); // o teto
  for (let k = -3; k <= 3; k++) { cx(k * 20, 12, 40, 1.4, 24, 1.4, S, "#d9dcdf", { rz: k * 0.07 }); } // os pilares inclinados da entrada
  reg.montar(add, "catar-vvip");
  // o jardim em volta: um gramado (grade que segue o relevo) com as árvores em alamedas
  // (um disco de 85 u em volta do edifício: com a folga de 100 u acima, ele fica a mais de 44 u do eixo, fora do asfalto)
  const jar = discoSobre(tr, add, x, z, 85, gramaMat(), "catar-jardim");
  const arv = [];
  for (let k = 0; k < 26; k++) { const a = r() * Math.PI * 2, d = 78 + r() * 8; arv.push({ x: x + Math.cos(a) * d, z: z + Math.sin(a) * d, y: nivelDoChao(tr, x + Math.cos(a) * d, z + Math.sin(a) * d) - 0.5, s: 0.8 + r() * 0.6 }); } // as árvores na orla do gramado
  arvores(tr, add, arv, r, "catar-arvores-vvip");
  tr.reservado ||= []; tr.reservado.push([x, z, 100]);
  tr.vvipCT = { x, z, lat, ang, jardim: !!jar };
  return tr.vvipCT;
}

/**
 * A Lusail Hill: o morro gramado do lado de fora da Curva 1, para o público geral. Uma cúpula alongada de relva (grama) com o caminho de terra em zigue-zague e umas árvores; a base afunda no chão.
 */
export function lusailHill(tr, add, { frac = 0.103, comp = 560, larg = 200, alto = 28 } = {}) {
  const { pts, n } = tr, r = sorteio(1157), i = Math.floor(frac * n) % n, lado = -sinalDaCurva(pts, n, i), p = pts[i];
  let achou = null;
  for (const lat of [330, 380, 430, 500]) {
    const x = p.x + p.nx * lado * lat, z = p.y + p.ny * lado * lat;
    if (livre(tr, x, z, larg / 2 + 60) && !ocupado(tr, x, z, i)) { achou = { x, z, lat }; break; }
  }
  if (!achou) { tr.colinaCT = null; return null; }
  const { x, z } = achou, ang = Math.atan2(-p.ty, p.tx), geo = new THREE.SphereGeometry(1, 40, 14, 0, Math.PI * 2, 0, Math.PI / 2);
  const mat = gramaMat("#4f8f3d"); mat.map.repeat.set(10, 5);
  const hill = new THREE.Mesh(geo, mat), y0 = nivelDoChao(tr, x, z);
  hill.scale.set(comp / 2, alto, larg / 2); hill.position.set(x, y0 - 1.5, z); hill.rotation.y = ang; hill.receiveShadow = true; hill.castShadow = true; hill.name = "catar-lusail-hill"; add(hill);
  const arv = [];
  for (let k = 0; k < 20; k++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.9, lx = Math.cos(a) * d * comp / 2, lz = Math.sin(a) * d * larg / 2; // o ponto no morro, no sistema dele
    const ax = x + Math.cos(ang) * lx + Math.sin(ang) * lz, az = z - Math.sin(ang) * lx + Math.cos(ang) * lz, h = alto * Math.sqrt(Math.max(0, 1 - d * d)) - 1.5;
    arv.push({ x: ax, z: az, y: y0 + h - 0.5, s: 0.7 + r() * 0.5 });
  }
  arvores(tr, add, arv, r, "catar-arvores-colina");
  tr.reservado ||= []; tr.reservado.push([x, z, comp / 2 + 30]);
  tr.colinaCT = { x, z, comp, larg, alto };
  return tr.colinaCT;
}

/**
 * O deserto plano em volta: moitas de mato seco de vários tamanhos em manchas por ruído e umas pedras soltas. Só onde `livre` e `ocupado` deixam, e longe o bastante da pista para não tapar a areia da beirada.
 */
export function deserto(tr, add, { moitas = 900, pedras = 70 } = {}) {
  const { pts, n, W } = tr, r = sorteio(7777), mato = [], rocha = [], mundo = tr.t.world;
  const mancha = (x, z) => Math.sin(x * 0.0021) * Math.cos(z * 0.0017) + Math.sin((x + z) * 0.0043) * 0.5; // a vegetação vem em manchas
  for (let t = 0; t < moitas * 6 && mato.length < moitas; t++) {
    const x = -600 + r() * (mundo + 1200), z = -600 + r() * (mundo + 1200);
    if (mancha(x, z) < 0.1 || !livre(tr, x, z, 260) || ocupado(tr, x, z, 0)) continue;
    const s = 0.5 + r() * 1.1; mato.push({ x, z, y: tr.chao(x, z) - 1.5, sx: 5 * s, sy: 2.4 * s, sz: 5 * s * (0.8 + r() * 0.5) });
  }
  for (let t = 0; t < pedras * 8 && rocha.length < pedras; t++) {
    const x = -600 + r() * (mundo + 1200), z = -600 + r() * (mundo + 1200);
    if (!livre(tr, x, z, 300) || ocupado(tr, x, z, 0)) continue;
    const s = 1 + r() * 3.5; rocha.push({ x, z, y: tr.chao(x, z) - 1.5 + 0.4 * s, sx: 5 * s, sy: 2.2 * s, sz: 4 * s * (0.8 + r() * 0.6) });
  }
  const cores = ["#8a8350", "#9a8e5a", "#7b7a49", "#a39868"], d = new THREE.Object3D(), c = new THREE.Color();
  if (mato.length) {
    const im = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), M(0xffffff, { roughness: 1, flatShading: true }), mato.length);
    mato.forEach((o, k) => { d.position.set(o.x, o.y + o.sy * 0.35, o.z); d.rotation.set(0, r() * 6.28, 0); d.scale.set(o.sx, o.sy, o.sz); d.updateMatrix(); im.setMatrixAt(k, d.matrix); im.setColorAt(k, c.set(cores[(r() * 4) | 0])); });
    im.name = "catar-moitas"; add(im);
  }
  if (rocha.length) instancias(add, new THREE.DodecahedronGeometry(1, 0), M(0xb09a78, { roughness: 1, flatShading: true }), rocha.map((o) => ({ x: o.x, y: o.y, z: o.z, sx: o.sx, sy: o.sy, sz: o.sz })), { nome: "catar-pedras" });
  tr.desertoCT = { moitas: mato.length, pedras: rocha.length };
}
