// Corrida da Galera — o carro de F1 de 2022 a 2025, a geração do efeito solo (public/corrida/f1/2022/carro.glb e carro-leve.glb, o
// "F1 2022 Generic" de TheoDevF1, CC-BY-NC-ND-4.0; ver f1/2022/LICENCA.txt). Faz o mesmo que f1-2026.js (`construir2026`) com as peças
// deste arquivo: o corpo num material só, com a pintura da equipe (f1-pintura.js projeta a folha pela posição, então as pinturas do
// 2026 servem aqui sem mudar nada), o flap da asa traseira (DRS), as quatro rodas, o volante e os retrovisores.
// No arquivo: Z para cima (o nó raiz gira para Y), a frente em +z e o eixo de trás atrás do volante; os números abaixo são em metros do
// ARQUIVO já girado (y para cima, frente +z), medidos nas caixas de cada malha.
import * as THREE from "three";
import { aroDaRoda } from "./f1-pintura.js";
import { extrair, fatiar, juntar, caixaDe, centrar, quaternioDoEixo, faceDoEspelho } from "./f1-2026.js";

export const CFG_2022 = {
  eixoTras: -0.41,                     // o meio entre o eixo da frente (z ≈ 1,9) e o de trás (z ≈ −2,7)
  asa: { z: -3.25, y: 1.18, x: 0.5 },  // o flap: atrás de z, acima de y e dentro de ±x
  escapamento: [0, 0.6, -3.45],
  olho: { dz: 0.62, dy: 0.32, baixo: 0.13 },
  numPos: [3.2, 0.55, 4.17, 0.52],
  drs: 0.5,
  disco: { dx: -0.03, k: 0.6 },
};
const DESCARTA = new Set(["UV_map", "UV_map_wings", "Livery_white", "Livery_blue", "Livery_wings_Blue"]); // (malhas de 2 triângulos: marcadores do arquivo)
const PINTURA = new Set(["Livery", "Livery_Wings"]);
const CARBONO = new Set(["carbon", "Black"]);
const RODA = new Set(["tyres", "rims", "brake"]);
const COR = { tyres: "#0d0d0e", rims: "#141518", brake: "#3a3633", chrome: "#2a2d33", mirror: "#20252b" };

export function construir2022(raiz, tam, leve) {
  const C = CFG_2022;
  raiz.updateMatrixWorld(true);
  const fontes = [], mats = {};
  raiz.traverse((o) => {
    if (!o.isMesh) return; const nome = o.material.name; if (DESCARTA.has(nome)) return;
    const f = extrair(o); f.nome = nome; f.rgb = COR[nome]; fontes.push(f);
    if (!mats[nome]) mats[nome] = o.material;
  });
  const todos = caixaDe(fontes), c0 = todos.getCenter(new THREE.Vector3()), s = tam / (todos.max.z - todos.min.z), yMin = todos.min.y;
  // ESTE ARQUIVO VEM ESPELHADO (o "PIRELLI" do próprio pneu saía ao contrário, e as letras da pintura também): aqui só o z vira (a frente para −z),
  // o x fica, e isso desfaz o espelho; como virar um eixo só inverte o lado das faces, a ordem de cada triângulo também vira
  const F = (x, y, z) => [(x - c0.x) * s, (y - yMin) * s, -(z - c0.z) * s];
  for (const f of fontes) {
    for (let i = 0; i < f.pos.length; i += 3) { f.pos[i] = (f.pos[i] - c0.x) * s; f.pos[i + 1] = (f.pos[i + 1] - yMin) * s; f.pos[i + 2] = -(f.pos[i + 2] - c0.z) * s; f.nor[i + 2] = -f.nor[i + 2]; }
    for (let t = 0; t < f.idx.length; t += 3) { const a = f.idx[t + 1]; f.idx[t + 1] = f.idx[t + 2]; f.idx[t + 2] = a; }
  }
  const de = (conj) => fontes.filter((f) => conj.has(f.nome));
  const D = { mats, nomes: { mecanica: "generic", volante: "Steer" }, rodas: [], flap: null, volante: null, volanteDet: null, miudezas: null, detalhes: null, mecanica: null, corpo: null };

  // --- o corpo: a pintura (branco na máscara) e o carbono (preto), num material só; o flap sai da asa traseira
  const [ax, ay, az] = F(C.asa.x, C.asa.y, C.asa.z), asaTeste = (c) => c[2] > az && c[1] > ay && Math.abs(c[0]) < Math.abs(ax);
  const flapFontes = [], restoFontes = [];
  for (const f of [...de(PINTURA), ...de(CARBONO)]) {
    const tinta = PINTURA.has(f.nome) ? "#ffffff" : "#000000";
    const [dentro, fora] = fatiar(f, asaTeste); dentro.rgb = fora.rgb = tinta; if (dentro.idx.length) flapFontes.push(dentro); restoFontes.push(fora);
  }
  let zNariz = 1e9; for (const f of restoFontes) for (let i = 2; i < f.pos.length; i += 3) if (f.pos[i] < zNariz) zNariz = f.pos[i];
  D.haloReferencia = { z: zNariz + 1.925 };
  const comPintura = (g) => {
    const p = g.attributes.position, n = g.attributes.normal, tinta = g.attributes.color, N = p.count, P = new Float32Array(N * 3), M = new Float32Array(N), NN = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const y = p.getY(i), ny = n.getY(i), sv = p.getZ(i) - zNariz;
      P[i * 3] = p.getX(i); P[i * 3 + 1] = y; P[i * 3 + 2] = sv; NN[i * 3] = n.getX(i); NN[i * 3 + 1] = ny; NN[i * 3 + 2] = n.getZ(i);
      let m = Math.min(1, Math.max(0, (ny + 0.45) / 0.3)); // a barriga é de carbono
      if (y < 0.1 && sv > 1.15 && sv < 4.05) m = 0;         // o assoalho, entre os eixos
      if (tinta) m *= tinta.getX(i);
      M[i] = m;
    }
    if (tinta) g.deleteAttribute("color");
    g.setAttribute("pcar", new THREE.BufferAttribute(P, 3)); g.setAttribute("ncar", new THREE.BufferAttribute(NN, 3)); g.setAttribute("mcar", new THREE.BufferAttribute(M, 1)); return g;
  };
  D.corpo = comPintura(juntar(restoFontes, { cor: true }));
  if (flapFontes.length) {
    const g = comPintura(juntar(flapFontes, { cor: true })), p = g.attributes.position, b = new THREE.Box3().setFromBufferAttribute(p), ys = [];
    for (let i = 0; i < p.count; i++) if (p.getZ(i) < b.min.z + 0.04) ys.push(p.getY(i));
    const pos = new THREE.Vector3(0, ys.reduce((a, c) => a + c, 0) / Math.max(1, ys.length), b.min.z);
    D.flap = { geo: centrar(g, pos), pos };
  }
  const unir = (conj, opc) => { const l = de(conj); return l.length ? juntar(l, opc) : null; };
  D.mecanica = unir(new Set(["generic"]), { uv: true });
  // a lanterna (o arquivo não tem a peça): no meio da traseira, na altura da caixa de câmbio
  { const zT = todos.min.z, [, ly, lz] = F(0, 0.62, zT); D.lanterna = { x: 0, y: ly, z: lz + 0.03 }; D.lanternaGeo = new THREE.BoxGeometry(0.08, 0.12, 0.012).translate(0, ly, lz + 0.004); }

  // --- as rodas: cada malha do arquivo traz duas ou quatro; aqui cada roda vira UMA malha, com o centro na origem
  const meio = F(0, 0, C.eixoTras)[2];
  const quad = (c) => (c[0] < 0 ? 0 : 1) + (c[2] < meio ? 2 : 0);
  const rodas = [[], [], [], []], pneuQ = [[], [], [], []];
  for (const f of de(RODA)) {
    let resto = f;
    for (let q = 0; q < 4; q++) {
      const [dentro, fora] = fatiar(resto, (c) => quad(c) === q); resto = fora;
      if (!dentro.idx.length) continue; rodas[q].push(dentro); if (f.nome === "tyres") pneuQ[q].push(dentro);
    }
  }
  rodas.forEach((lista, q) => {
    if (!lista.length) return;
    const bp = caixaDe(pneuQ[q].length ? pneuQ[q] : lista), centro = bp.getCenter(new THREE.Vector3()), r = (bp.max.y - bp.min.y) / 2;
    const Q = quaternioDoEixo(pneuQ[q].length ? pneuQ[q] : lista, centro);
    const g = centrar(juntar(lista, { cor: true }), centro); g.applyQuaternion(Q); g.computeBoundingSphere();
    // a faixa do composto e as letras (f1-pintura.js, pelo raio): só no PNEU. Aqui a roda junta pneu, aro e disco, e o aro de 18" fica dentro do raio
    // da faixa: sem isto ela vazava amarela pelo aro inteiro. O raio sai só dos triângulos do pneu, e o aro e o freio ficam com raio 0 (nada pintado).
    const doPneu = []; let ini = 0; for (const f of lista) { const nv = f.pos.length / 3; if (f.nome === "tyres") doPneu.push([ini, ini + nv]); ini += nv; }
    const ehPneu = (v) => doPneu.some(([x, y]) => v >= x && v < y), idxPneu = Array.from(g.index.array).filter((v) => ehPneu(v));
    const a = aroDaRoda(g.attributes.position, idxPneu.length ? idxPneu : g.index.array);
    for (let v = 0; v < a.aro.count; v++) if (!ehPneu(v)) a.aro.setXY(v, 0, 0);
    g.setAttribute("aro", a.aro); g.setAttribute("pneuLat", a.lat);
    D.rodas.push({ geo: g, centro, r, frente: q >= 2, lado: q % 2 ? 1 : -1, camber: Q.clone().invert() });
  });

  if (!leve) {
    D.miudezas = unir(new Set(["chrome", "mirror"]), { cor: true });
    D.espelhos = de(new Set(["mirror"])).flatMap((f) => fatiar(f, (c) => c[0] < 0)).filter((f) => f.idx.length).map(faceDoEspelho).filter(Boolean);
    const vol = de(new Set(["Steer"]));
    if (vol.length) { const centro = caixaDe(vol).getCenter(new THREE.Vector3()); D.volante = { geo: centrar(juntar(vol, { uv: true }), centro), centro }; }
  }
  const [ex, ey, ez] = F(...C.escapamento); D.escapamento = { x: Math.max(0.05, Math.abs(ex)), y: ey, z: ez };
  D.olho = C.olho; D.numPos = C.numPos; D.drs = C.drs; D.disco = C.disco;
  return D;
}
