// Cidade do México — a reta dos boxes de verdade (peça só desta pista): o prédio dos boxes do Autódromo Hermanos Rodríguez e o que o cerca, sobre a planta do OpenStreetMap (kit/mexico/mapa.js).
// · o prédio ("Paddock", `building:levels` 3): 307 m de planta com as seis fatias (os seis módulos de dois níveis do Paddock Club, 300 m, 5 mil lugares, segundo El Informador, 17/07/2015) e as cinco
//   saliências de escada e elevador do lado de trás; a parede de cor seashell e o telhado indianred (as cores do mapa); a marquise de cada fatia projetada sobre as garagens, uma cor de pilastra por
//   fatia e um painel de cada nome; e a torre de controle de prova na ponta de oeste (a do El Informador: "en el extremo poniente del edificio de pits");
// · os dois blocos de dois andares atrás dele (escritórios e hospitality das equipes, do mapa);
// · as tribunas do lado de fora da reta (a principal, a que vem antes e a que vem depois) e as seis arquibancadas da saída da Peraltada, cada uma na sua planta (kit/mexico/tribuna.js).
// A frente do prédio fica a 160 u do eixo, atrás das garagens do corredor das regras de F1 (kit/corredor-boxes.js: até 156 u); a planta do mapa está uns 29 u mais perto da pista que isso.
import * as THREE from "three";
import { canvasTex, M } from "../../../cena.js";
import { Montador, solido, vidro, comTextura } from "../montagem.js";
import { marcaTex } from "../marcas.js";
import { nivelDoChao } from "./chao.js";
import { montarTribuna } from "./tribuna.js";
import { PREDIO_DOS_BOXES, BLOCOS_ATRAS, TRIBUNAS_RETA, ARQUIBANCADAS_SAIDA } from "./mapa.js";

const FRENTE_LAT = 160; // a frente do prédio, do eixo da pista
const MODULOS = [
  { cor: "#006847", painel: "mxmexico" }, { cor: "#ce1126", painel: "mxgp" }, { cor: "#f4f4f0", painel: "mxforo" },
  { cor: "#ffd23f", painel: "mxreforma" }, { cor: "#0a4a35", painel: "mxzocalo" }, { cor: "#9c1a2a", painel: "mxmixhuca" },
];

// a fachada de uma baia de 24 u: `niveis` andares, o de baixo de concreto escuro com a porta de enrolar, os de cima de janela de vidro entre os peitoris brancos
function fachadaTex(niveis) {
  return canvasTex(96, 64 * niveis, (x, w, h) => {
    const alt = h / niveis;
    x.fillStyle = "#fff5ee"; x.fillRect(0, 0, w, h); // seashell
    for (let j = 0; j < niveis; j++) {
      const y = h - (j + 1) * alt;
      if (j === 0) { x.fillStyle = "#4a4d52"; x.fillRect(0, y + alt * 0.18, w, alt * 0.82); x.fillStyle = "#6b6f76"; for (let k = 0; k < 8; k++) x.fillRect(6, y + alt * 0.24 + k * alt * 0.085, w - 12, 2); }
      else { x.fillStyle = "#2c4a5a"; x.fillRect(4, y + alt * 0.2, w - 8, alt * 0.6); x.fillStyle = "#8fb4c6"; x.fillRect(4, y + alt * 0.2, w - 8, alt * 0.12); x.fillStyle = "#fff5ee"; for (let k = 1; k < 4; k++) x.fillRect((w * k) / 4 - 1, y + alt * 0.2, 2, alt * 0.6); }
      x.fillStyle = "#d9cfc5"; x.fillRect(0, y, w, 3);
    }
  });
}

const dentro = (poli, x, z) => { let c = false; for (let i = 0, j = poli.length - 1; i < poli.length; j = i++) { const [xi, zi] = poli[i], [xj, zj] = poli[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c; } return c; };

// uma caixa extrudada de uma planta: as paredes (cada uma com o uv em baias de 24 u), o telhado triangulado; `topo(x, z)` dá a altura do telhado
function prisma(tr, poli, topo, niveis, matParede, matTelhado, nome) {
  const pos = [], uv = [], idx = [], rp = [], rt = [], ri = [], P = poli.slice(0, -1); // (a planta vem fechada: o último ponto repete o primeiro)
  P.forEach((a, i) => {
    const b = P[(i + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), k = pos.length / 3;
    for (const [x, z] of [a, b]) pos.push(x, nivelDoChao(tr, x, z) - 3, z); for (const [x, z] of [a, b]) pos.push(x, topo(x, z), z);
    const u1 = L / 24; uv.push(0, 0, u1, 0, 0, 1, u1, 1); idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
  });
  const tris = THREE.ShapeUtils.triangulateShape(P.map((p) => new THREE.Vector2(p[0], p[1])), []);
  P.forEach(([x, z]) => { rp.push(x, topo(x, z), z); rt.push(0, 0); }); for (const t of tris) ri.push(t[0], t[1], t[2]);
  const mk = (p, u, i, mat, n) => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(u, 2)); g.setIndex(i); g.computeVertexNormals(); const m = new THREE.Mesh(g, mat); m.castShadow = m.receiveShadow = true; m.name = n; return m; };
  const g = new THREE.Group(); g.name = nome; g.add(mk(pos, uv, idx, matParede, nome + "-paredes"), mk(rp, rt, ri, matTelhado, nome + "-telhado")); void niveis; return g;
}

export function predioDosBoxes(tr, add, marcasPainel = []) {
  const E = tr.escala ?? 0.4, NIVEL = 4 * 12 * E, H = 3 * NIVEL; // 3 andares (do mapa) de 4 m cada (estimativa: o mapa só diz quantos andares)
  const { pts, n } = tr;
  const iDe = (x, z) => tr.indiceAt(x, z);
  const lateral = (x, z) => { const p = pts[iDe(x, z)]; return (x - p.x) * p.nx + (z - p.y) * p.ny; };
  // o deslocamento: a borda da frente (os vértices 20 e 21 da planta) vai para FRENTE_LAT do eixo; tudo anda junto, para fora da pista (o `lado` dos boxes é 1: a normal da pista)
  const desl = FRENTE_LAT - Math.min(lateral(...PREDIO_DOS_BOXES[20]), lateral(...PREDIO_DOS_BOXES[21]));
  const empurra = ([x, z]) => { const p = pts[iDe(x, z)]; return [x + p.nx * desl, z + p.ny * desl]; };
  const poli = PREDIO_DOS_BOXES.map(empurra);
  const tex3 = fachadaTex(3); tex3.wrapS = tex3.wrapT = THREE.RepeatWrapping;
  const parede = comTextura(tex3, { roughness: 0.8, side: THREE.DoubleSide }), telhado = M("#cd5c5c", { roughness: 0.8, side: THREE.DoubleSide });
  add(prisma(tr, poli, (x, z) => nivelDoChao(tr, x, z) + H, 3, parede, telhado, "boxes-predio"));
  // o eixo do prédio: a borda da frente, de oeste (a) para leste (b); `u` ao longo dela e `v` a partir dela para trás
  const a = poli[20], b = poli[21], L = Math.hypot(b[0] - a[0], b[1] - a[1]), ex = (b[0] - a[0]) / L, ez = (b[1] - a[1]) / L, nx = ez, nz = -ex; // (nx, nz): da frente para a pista
  const mundo = (u, v) => [a[0] + ex * u - nx * v, a[1] + ez * u - nz * v]; // v > 0: para trás do prédio
  const alturaDe = (x, z) => nivelDoChao(tr, x, z);
  // as divisas das fatias: as cinco saliências de trás (os pares de vértices 2-3, 6-7, 10-11, 26-27 e 30-31), medidas ao longo da frente
  const cortes = [[2, 3], [6, 7], [10, 11], [30, 31], [26, 27]].map(([i, j]) => { const p = poli[i], q = poli[j]; return ((p[0] + q[0]) / 2 - a[0]) * ex + ((p[1] + q[1]) / 2 - a[1]) * ez; }).sort((p, q) => p - q);
  const limites = [0, ...cortes, L], m = new Montador(), S = solido(), V = vidro();
  const ry = -Math.atan2(ez, ex), ryPainel = Math.atan2(nx, nz); // as caixas: o eixo x local ao longo da frente; os painéis olham (+z local) para a pista
  // a marquise de cada fatia (para a pista, 16 u, na altura do 2º andar) e a pilastra colorida na divisa
  const faixa = [];
  for (let k = 0; k < 6; k++) {
    const u0 = limites[k] + 4, u1 = limites[k + 1] - 4, uc = (u0 + u1) / 2, [cx, cz] = mundo(uc, 0), yb = alturaDe(cx, cz) + NIVEL + 6;
    m.caixa(S, [cx + nx * 8, yb, cz + nz * 8], [u1 - u0, 2, 16], { cor: "#cd5c5c", ry });                         // a laje da marquise
    m.caixa(S, [cx + nx * 15.6, yb - 1, cz + nz * 15.6], [u1 - u0, 5, 0.8], { cor: MODULOS[k].cor, ry });         // a testeira na cor da fatia
    if (k > 0) { const [px, pz] = mundo(limites[k], 0); m.caixa(S, [px + nx * 1.5, (alturaDe(px, pz) - 3 + alturaDe(px, pz) + H + 6) / 2, pz + nz * 1.5], [6, H + 9, 4], { cor: MODULOS[k].cor, ry }); }
    // o painel de cima do telhado, virado para a pista, sobre dois pés
    const [qx, qz] = mundo(uc, 6), yt = alturaDe(qx, qz) + H;
    faixa.push({ x: qx + nx * 2, y: yt + 17, z: qz + nz * 2, u: uc, k, nome: marcasPainel[k] || MODULOS[k].painel });
    for (const s of [-1, 1]) m.caixa(S, [qx + ex * s * 26, yt + 5, qz + ez * s * 26], [1.6, 10, 1.6], { cor: "#454b55", ry });
  }
  // a torre de controle de prova, na ponta de oeste: corpo de concreto, a cabine de vidro e o teto, mais o mastro
  const [tx, tz] = mundo(62, 62), th = alturaDe(tx, tz), alto = H * 2.2;
  m.caixa(S, [tx, (th - 3 + th + alto) / 2, tz], [38, alto + 3, 38], { cor: "#f1ece4", ry });
  m.caixa(V, [tx, th + alto + 9, tz], [40, 18, 40], { cor: "#1f3446", ry });
  m.caixa(S, [tx, th + alto + 19.5, tz], [46, 3, 46], { cor: "#cd5c5c", ry });
  m.cilindro(S, [tx + 12, th + alto + 38, tz], [0.7, 36], { cor: "#d9d9d9", seg: 6 });
  add(m.montar("boxes-detalhes"));
  const marcasMesh = new THREE.Group(); marcasMesh.name = "boxes-paineis";
  for (const f of faixa) { const p = new THREE.Mesh(new THREE.PlaneGeometry(70, 17), new THREE.MeshBasicMaterial({ map: marcaTex(f.nome, 512, 128), side: THREE.DoubleSide })); p.position.set(f.x, f.y, f.z); p.rotation.y = ryPainel; marcasMesh.add(p); }
  add(marcasMesh);
  // os dois blocos de dois andares atrás (escritórios e hospitality): a mesma parede, de dois andares, e o telhado cinza
  const tex2 = fachadaTex(2); tex2.wrapS = tex2.wrapT = THREE.RepeatWrapping;
  const parede2 = comTextura(tex2, { roughness: 0.8, side: THREE.DoubleSide }), telhado2 = M(0x9a9da2, { roughness: 0.85, side: THREE.DoubleSide });
  BLOCOS_ATRAS.forEach((bl, k) => add(prisma(tr, bl.map(empurra), (x, z) => nivelDoChao(tr, x, z) + 2 * NIVEL, 2, parede2, telhado2, "boxes-bloco-" + k)));
  // reserva: o prédio e os blocos inteiros (as árvores e a torcida solta não entram)
  tr.reservado ||= [];
  const todos = [poli, ...BLOCOS_ATRAS.map((bl) => bl.map(empurra))];
  for (const pl of todos) { const xs = pl.map((p) => p[0]), zs = pl.map((p) => p[1]); for (let x = Math.min(...xs); x <= Math.max(...xs); x += 50) for (let z = Math.min(...zs); z <= Math.max(...zs); z += 50) if (dentro(pl, x, z)) tr.reservado.push([x, z, 60]); }
  const i0 = iDe(...poli[20]), i1 = iDe(...poli[21]);
  tr.predioMexico = { deslocamento: Math.round(desl), comprimento: Math.round(L), fatias: 6, alto: Math.round(H), de: i0 / n, ate: i1 / n };
  return tr.predioMexico;
}

// as tribunas da reta (as três) e as seis arquibancadas pequenas da saída da Peraltada: cada uma na planta do mapa
export function tribunasDaReta(tr, add) {
  const n = tr.n, feitas = [];
  const faixaSom = (xs) => { const ii = xs.map(([x, z]) => tr.indiceAt(x, z)); let a = Math.min(...ii), b = Math.max(...ii); if (b - a > n / 2) { const t = ii.map((i) => (i < n / 2 ? i + n : i)); a = Math.min(...t); b = Math.max(...t); } tr.arquibancadas ||= []; tr.arquibancadas.push([a, b]); };
  const dist = (f, t) => { const ex = f[1][0] - f[0][0], ez = f[1][1] - f[0][1], L = Math.hypot(ex, ez); return Math.abs(((t[0][0] - f[0][0]) * ez - (t[0][1] - f[0][1]) * ex) / L); };
  TRIBUNAS_RETA.forEach((q, k) => {
    const D = dist(q.frente, q.tras), principal = q.nome === "principal";
    feitas.push(montarTribuna(tr, add, { frente: q.frente, fora: [q.tras[0][0] - q.frente[0][0], q.tras[0][1] - q.frente[0][1]], D, tipo: "simples", cobertura: principal ? "branca" : null, vaoCobertura: 0.6, passo: 70, nome: "reta-" + q.nome, muroPainel: k }));
    faixaSom([...q.frente, ...q.tras]);
  });
  ARQUIBANCADAS_SAIDA.forEach((q, k) => {
    const frente = [q[0], q[1]], tras = [q[3], q[2]], D = dist(frente, tras);
    feitas.push(montarTribuna(tr, add, { frente, fora: [tras[0][0] - frente[0][0], tras[0][1] - frente[0][1]], D, tipo: "simples", cobertura: null, passo: 60, nome: "saida-" + k, muroPainel: k + 1 }));
    faixaSom(q);
  });
  return { tribunas: feitas.length };
}

