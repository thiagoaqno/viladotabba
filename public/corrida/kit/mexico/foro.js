// Cidade do México — o Foro Sol (hoje Estadio GNP Seguros), o estádio de beisebol que a pista atravessa. Só código, sem foto nem modelo; a planta é a do OpenStreetMap (kit/mexico/mapa.js).
// Na vida real o circuito entra no estádio pelo lado aberto (leste), cruza o campo ENTRE as duas arquibancadas, a Norte e a Sul (cada uma em L, com o canto de fora arredondado), e sai pelo oeste
// por baixo de um corredor coberto que liga as duas pontas: as arquibancadas ficam em volta da pista, em três lados. Aqui, os mesmos contornos: a Norte e a Sul de dois andares com o corredor de
// concreto no meio, a cobertura de telha cor de chocolate (`roof:colour` do mapa) sobre a parte de trás, o muro do campo com os painéis, o gramado listrado entre a pista e as arquibancadas, o corredor
// coberto sobre a pista, o pódio no meio do campo (o do GP fica no estádio), as bandeiras do México no alto, as torres de luz e a fumaça verde, branca e vermelha. Peças repetidas em InstancedMesh.
// (Na corrida o Foro Sol leva uns 28 500 torcedores, segundo El Informador, 17/07/2015.)
import * as THREE from "three";
import { canvasTex, M } from "../../cena.js";
import { Montador, solido, vidro, comTextura } from "../montagem.js";
import { marcaTex } from "../marcas.js";
import { instancias, sorteio, livre } from "../comum.js";
import { nivelDoChao } from "./chao.js";
import { FORO } from "./mapa.js";
import { montarTribuna, CORES_MX, CAMISAS_MX } from "./tribuna.js";

export { CORES_MX, CAMISAS_MX };

// o gramado listrado do campo (o corte da máquina, em faixas)
function gramadoTex() {
  return canvasTex(256, 256, (x, w, h, rr) => {
    for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? "#4f9a3e" : "#5aa646"; x.fillRect(0, i * (h / 8), w, h / 8 + 1); }
    for (let i = 0; i < 900; i++) { x.fillStyle = rr() < 0.5 ? "#00000012" : "#ffffff10"; x.fillRect(rr() * w, rr() * h, 1 + rr() * 2, 1 + rr() * 3); }
  });
}

export function bandeiraMexico(w = 96, h = 56) {
  return canvasTex(w, h, (x) => {
    x.fillStyle = CORES_MX.verde; x.fillRect(0, 0, w / 3, h); x.fillStyle = CORES_MX.branco; x.fillRect(w / 3, 0, w / 3, h); x.fillStyle = CORES_MX.vermelho; x.fillRect((w * 2) / 3, 0, w / 3, h);
    // o brasão: a águia sobre o nopal, só uma mancha marrom e verde no meio
    x.fillStyle = "#8a5a2b"; x.beginPath(); x.ellipse(w / 2, h * 0.47, w * 0.075, h * 0.17, 0, 0, 7); x.fill();
    x.fillStyle = "#2f8f3a"; x.beginPath(); x.ellipse(w / 2, h * 0.7, w * 0.085, h * 0.07, 0, 0, 7); x.fill();
  }, false);
}

// o miolo do campo: a frente da Norte, a frente da Sul e a boca de leste (a linha entre as duas pontas de leste)
const POLI_CAMPO = [FORO.norte.frente[0], FORO.norte.frente[1], FORO.norte.frente[2], FORO.sul.frente[2], FORO.sul.frente[1], FORO.sul.frente[0]];
const dentro = (poli, x, z) => { let c = false; for (let i = 0, j = poli.length - 1; i < poli.length; j = i++) { const [xi, zi] = poli[i], [xj, zj] = poli[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c; } return c; };

/**
 * O campo: o gramado em células de 16 u no miolo entre as duas arquibancadas, no chão que se vê (+0,25), só onde a célula inteira está a mais de `folga` da borda da pista
 * (a faixa de grama seca junto do asfalto fica como está). Devolve a malha e o número de células.
 */
function campo(tr, add, poli, folga = 20, passo = 16) {
  const xs = poli.map((p) => p[0]), zs = poli.map((p) => p[1]), x0 = Math.floor(Math.min(...xs) / passo) * passo, x1 = Math.max(...xs), z0 = Math.floor(Math.min(...zs) / passo) * passo, z1 = Math.max(...zs);
  const pos = [], uv = [], idx = [], ok = new Map(), bom = (x, z) => { const k = x + "," + z; if (!ok.has(k)) ok.set(k, dentro(poli, x, z) && livre(tr, x, z, folga)); return ok.get(k); };
  let celulas = 0;
  for (let x = x0; x < x1; x += passo) for (let z = z0; z < z1; z += passo) {
    if (![[x, z], [x + passo, z], [x, z + passo], [x + passo, z + passo]].every(([a, b]) => bom(a, b))) continue;
    const k = pos.length / 3;
    for (const [a, b] of [[x, z], [x + passo, z], [x, z + passo], [x + passo, z + passo]]) { pos.push(a, nivelDoChao(tr, a, b) + 0.25, b); uv.push(a / 64, b / 64); }
    idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); celulas++;
  }
  if (!celulas) return { celulas: 0 };
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const m = add(new THREE.Mesh(g, comTextura(gramadoTex(), { roughness: 1, side: THREE.FrontSide }))); m.receiveShadow = true; m.name = "foro-campo";
  return { celulas, malha: m };
}

// o corredor coberto sobre a pista: o piso, as paredes de vidro, o telhado cor de chocolate, apoiado nas pontas das duas arquibancadas (os encontros descem até o chão, dentro das paredes de ponta)
function ponte(tr, add, q) {
  const E = tr.escala ?? 0.4, m = new Montador(), S = solido(), V = vidro();
  const [p0, p1, p2, p3] = q, uvx = [(p1[0] - p0[0] + p2[0] - p3[0]) / 2, (p1[1] - p0[1] + p2[1] - p3[1]) / 2], vvx = [(p3[0] - p0[0] + p2[0] - p1[0]) / 2, (p3[1] - p0[1] + p2[1] - p1[1]) / 2];
  const lu = Math.hypot(...uvx), lv = Math.hypot(...vvx), cx = (p0[0] + p1[0] + p2[0] + p3[0]) / 4, cz = (p0[1] + p1[1] + p2[1] + p3[1]) / 4, ry = -Math.atan2(uvx[1], uvx[0]);
  const ux = uvx[0] / lu, uz = uvx[1] / lu, vx = vvx[0] / lv, vz = vvx[1] / lv; // os eixos do quadrilátero (u: para leste; v: da Norte para a Sul)
  const h = tr.pts[tr.indiceAt(cx, cz)].h, vao = 74 * E; // o vão livre da passarela do kit (74 × a escala), 6,2 m sobre o asfalto
  const base = h + vao, espessura = 8, parede = 22, telhado = 3;
  m.caixa(S, [cx, base + espessura / 2, cz], [lu, espessura, lv], { cor: "#b4b8be", ry });                                        // o piso
  for (const s of [-1, 1]) m.caixa(V, [cx + ux * s * (lu / 2 - 0.6), base + espessura + parede / 2, cz + uz * s * (lu / 2 - 0.6)], [1.2, parede, lv], { cor: "#2c4a5a", ry }); // as paredes de vidro, leste e oeste
  m.caixa(S, [cx, base + espessura + parede + telhado / 2, cz], [lu + 8, telhado, lv + 6], { cor: "#d2691e", ry });                // o telhado (`roof:colour` chocolate)
  for (const s of [-1, 1]) { // os encontros: do chão até o piso, dentro das paredes das pontas (a 4 u da borda, para o lado da arquibancada)
    const px = cx + vx * s * (lv / 2 + 4), pz = cz + vz * s * (lv / 2 + 4), chao = nivelDoChao(tr, px, pz) - 3;
    m.caixa(S, [px, (chao + base + espessura) / 2, pz], [lu, base + espessura - chao, 8], { cor: "#a9adb3", ry });
  }
  const g = m.montar("foro-corredor-coberto"); add(g);
  return { x: cx, z: cz, vao, base };
}

// o pódio: o palco baixo, os três degraus (1º no meio e mais alto), o fundo com o letreiro e as bandeiras, o tapete verde, branco e vermelho
function podio(E = 1) { // os degraus do pódio (14, 10 e 7 u de altura de projeto × a escala do cenário: 1,17 m, 0,83 m e 0,58 m sobre o palco de 0,83 m)
  const m = new Montador(), S = solido(), g = new THREE.Group();
  m.caixa(S, [0, -2, 0], [92, 12, 40], { cor: "#2b2f36" });                                         // o palco (desce 8 u para dentro do chão: o campo é inclinado)
  for (let i = 0; i < 3; i++) m.caixa(S, [-30 + i * 30, 4.5, -16], [8, 1, 3], { cor: ["#006847", "#f4f4f0", "#ce1126"][i] }); // o tapete (listras)
  for (const [x, h, c] of [[0, 14 * E, "#ffd23f"], [-26, 10 * E, "#d7dce1"], [26, 7 * E, "#c98a4b"]]) {
    m.caixa(S, [x, 4 + h / 2, 2], [22, h, 16], { cor: "#f4f4f0" });
    m.caixa(S, [x, 4 + h / 2, 10.2], [22, h, 0.4], { cor: c });
  }
  m.caixa(S, [0, 20, -18], [92, 32, 3], { cor: "#1c2a24" });                                         // o fundo
  m.caixa(S, [-44, 22, -17], [4, 36, 5], { cor: "#aeb4ba" }); m.caixa(S, [44, 22, -17], [4, 36, 5], { cor: "#aeb4ba" });
  m.caixa(S, [0, 38.5, -17], [92, 3, 5], { cor: "#aeb4ba" });                                         // a viga de cima
  const base = m.montar("podio-mexico");
  const letreiroMx = new THREE.Mesh(new THREE.PlaneGeometry(88, 24), new THREE.MeshBasicMaterial({ map: marcaTex("mxmexico", 1024, 280) })); letreiroMx.position.set(0, 21, -16.4); base.add(letreiroMx);
  const bd = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), new THREE.MeshStandardMaterial({ map: bandeiraMexico(), side: THREE.DoubleSide }));
  for (const x of [-34, 34]) { const b = bd.clone(); b.position.set(x, 33, -16); b.scale.set(1.5, 1.5, 1); base.add(b); }
  g.add(base); g.name = "podio-mexico"; return g;
}

// a fumaça verde, branca e vermelha do campo: puffs em InstancedMesh que sobem, abrem e somem; só se mexe com a câmera perto
function fumacaMexicana(add, { x, y, z }) {
  const N = 54, geo = new THREE.IcosahedronGeometry(1, 1), mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false });
  const m = add(new THREE.InstancedMesh(geo, mat, N)), c = new THREE.Color(), d = new THREE.Object3D(), r = sorteio(77);
  const cores = ["#00a86b", "#ffffff", "#e0242b"], puffs = [];
  for (let i = 0; i < N; i++) {
    const cor = i % 3, lado = Math.floor(i / 3) % 2 ? 1 : -1;
    puffs.push({ x: (cor - 1) * 34 + lado * (95 + r() * 30), z: (r() - 0.5) * 30, fase: r(), vel: 0.08 + r() * 0.05, esc: 9 + r() * 7, deriva: (r() - 0.5) * 8 }); m.setColorAt(i, c.set(cores[cor]));
  }
  m.instanceColor.needsUpdate = true; m.name = "foro-fumaca"; m.frustumCulled = false;
  const posa = (t) => {
    puffs.forEach((p, i) => {
      const s = (p.fase + t * p.vel) % 1, h = s * 70, e = p.esc * (0.5 + s * 1.5);
      d.position.set(x + p.x + p.deriva * s, y + 1 + h + e * 0.3, z + p.z); d.scale.setScalar(Math.max(0.01, e * (1 - s * 0.35))); d.updateMatrix(); m.setMatrixAt(i, d.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  };
  posa(0);
  return { N, animar: (t, foco) => { if (!foco || (foco.x - x) ** 2 + (foco.y - z) ** 2 < 900 ** 2) posa(t); }, mesh: m };
}

/**
 * Monta o Foro Sol no lugar de verdade e devolve o que fez ({ norte, sul, ponte, campo, podio, fumaca ... }). Tudo é cenário: a pista passa pelo vão entre as duas arquibancadas.
 */
export function foroSol(tr, add) {
  const E = tr.escala ?? 0.4, D = FORO.profundidade, miolo = [1400, 2450]; // o miolo do campo: o ponto do lado de dentro que orienta as normais
  const norte = montarTribuna(tr, add, { frente: FORO.norte.frente, foco: miolo, D, tipo: "estadio", cobertura: "chocolate", vaoCobertura: 0.55, nome: "foro-norte", muroPainel: 0 });
  const sul = montarTribuna(tr, add, { frente: FORO.sul.frente, foco: miolo, D, tipo: "estadio", cobertura: "chocolate", vaoCobertura: 0.55, nome: "foro-sul", muroPainel: 1 });
  const cor = ponte(tr, add, FORO.ponte);
  const gramado = campo(tr, add, POLI_CAMPO);
  // o pódio no meio do campo, na faixa de grama da Norte, de frente para o lado da Sul
  const px = 1400, pz = 2290, pod = podio(E); pod.position.set(px, nivelDoChao(tr, px, pz) - 0.1, pz); pod.rotation.y = 0; add(pod);
  // as bandeiras do México no alto da cobertura (uma a cada 3 colunas) e as torres de luz atrás da parede de trás
  const r = sorteio(11), mastros = [], panos = [], m = new Montador(), S = solido(), torres = [];
  for (const t of [norte, sul]) t.topos.forEach((q, k) => {
    const yb = q.y + 6 * 12 * E + 8 - 3; // o alto da cobertura na ponta de trás (a 6 u da parede)
    const altura = 38 + r() * 8, ang = Math.atan2(-q.dx, -q.dz) + (r() - 0.5) * 0.5;
    if (k % 3 === 0) {
      mastros.push({ x: q.x + q.dx * 2, y: yb + altura / 2, z: q.z + q.dz * 2, sx: 0.7, sy: altura, sz: 0.7 });
      panos.push({ x: q.x + q.dx * 2 + Math.cos(ang) * 14, y: yb + altura - 8, z: q.z + q.dz * 2 - Math.sin(ang) * 14, sx: 28, sy: 16, sz: 1, r: ang });
    }
    if (k === 0 || k === Math.floor(t.topos.length / 2) || k === t.topos.length - 1) { // a torre de luz: atrás da parede, mais alta que a cobertura
      const x = q.x + q.dx * 16, z = q.z + q.dz * 16, ch = nivelDoChao(tr, x, z) - 2, topo = yb + 44;
      m.cilindro(S, [x, (ch + topo) / 2, z], [1.6, topo - ch], { cor: "#aeb4ba", seg: 6 });
      m.caixa(S, [x, topo + 6, z], [30, 16, 3], { cor: "#d9dde2", ry: Math.atan2(-q.dx, -q.dz) }); m.caixa(S, [x, topo + 6, z], [28, 14, 3.4], { cor: "#fff3c4", ry: Math.atan2(-q.dx, -q.dz) });
      torres.push([x, z]);
    }
  });
  instancias(add, new THREE.CylinderGeometry(1, 1, 1, 6), M(0xe9e9e9, { roughness: 0.5 }), mastros, { nome: "foro-mastros" });
  instancias(add, new THREE.PlaneGeometry(1, 1), new THREE.MeshStandardMaterial({ map: bandeiraMexico(), side: THREE.DoubleSide, roughness: 0.8 }), panos, { sombra: false, nome: "foro-bandeiras" });
  add(m.montar("foro-torres"));
  const fumaca = fumacaMexicana(add, { x: px, y: nivelDoChao(tr, px, pz), z: pz });
  // o campo, o corredor e o pódio ficam reservados (as árvores e a torcida solta não entram) e a torcida do som cobre o estádio
  tr.reservado ||= [];
  for (let x = 1100; x <= 1700; x += 60) for (let z = 2180; z <= 2860; z += 60) if (dentro(POLI_CAMPO, x, z)) tr.reservado.push([x, z, 50]);
  tr.reservado.push([cor.x, cor.z, 90]);
  tr.arquibancadas ||= []; tr.arquibancadas.push([Math.floor(0.875 * tr.n), Math.floor(0.935 * tr.n)]);
  return { norte, sul, ponte: cor, campo: gramado.celulas, torres: torres.length, bandeiras: panos.length, podio: [px, pz], fumaca, y: nivelDoChao(tr, px, pz) };
}
