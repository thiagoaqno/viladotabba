// Silverstone (Silverstone Circuit, o antigo aeródromo da RAF, Northamptonshire): o que só o autódromo tem. O resto (zebras, escape
// de brita e de asfalto pintado, arquibancadas das curvas, painéis, postos, placas, passarelas e som) é do kit, na configuração de
// gps/silverstone.js. Aqui:
// 1. o The Wing (o prédio dos boxes moderno, com a laje de vidro e o teto em asa) com a torre da direção de prova e o paddock atrás;
// 2. as tribunas cobertas das retas (kit 2: tribunaCoberta) e as bandeiras da torcida (a Union Jack) em todas as arquibancadas;
// 3. o aeródromo: as pistas de pouso em triângulo, os hangares, as barracas Nissen e a torre de controle da RAF;
// 4. os pórticos de patrocínio, os telões, as placas com o nome de cada curva e as faixas no pórtico da largada;
// 5. a Inglaterra em volta: o patchwork de campos com as sebes, os bosques, as aldeias com a igreja, as turbinas de vento e o
//    camping da torcida (barracas, trailers, carros e bandeiras).
// As peças soltas estão em kit/silverstone/pecas.js. Tudo é cenário: nada fica dentro da pista (livre/ocupado) e as peças repetidas
// são InstancedMesh.
import * as THREE from "three";
import { canvasTex, M } from "./cena.js";
import { faixa } from "./kit/arquibancadas.js";
import { marcaTex, desenharMarca } from "./kit/marcas.js";
import { livre, ocupado, instancias, sorteio, recortar } from "./kit/comum.js";
import { tendaPaddock } from "./kit/coberturas.js";
import { boxEquipe } from "./kit/box-equipe.js";
import { portico } from "./kit/torres.js";
import { Montador, solido } from "./kit/montagem.js";
import { hangarRAF, torreRAF, torreCorrida, igreja, turbina, telao, bandeiraUK, prismaGeo } from "./kit/silverstone/pecas.js";
import { beiradaSolida, solo } from "./kit/silverstone/chao.js";
import { ambienteSilverstone } from "./kit/silverstone/ambiente.js";
import { tribunaReal } from "./kit/silverstone/tribuna.js";

const AZUL = "#1d3f8f", VERMELHO = "#c8102e", BRANCO = "#f4f4f4";
// A escala das peças desenhadas para o carro de antes (1 u = 10 cm: prédios, hangares, tendas, a torre): o mundo agora é 1 u = 0,2083 m, então um prédio de 4,6 m de pé-direito sai com 9,6 m. Fator 0,1 ÷ 0,2083 = 0,48 nas alturas
// (a planta, o recuo da pista e o comprimento ficam como estão: dependem do lugar da pista). Sem `tr.escala` no GP (padrão), nada muda.
const predio = (tr) => (tr.escala == null ? 1 : 0.1 / 0.2083);
const ry0 = (p, lado) => Math.atan2(-lado * p.nx, -lado * p.ny); // rotation.y de quem está do lado `lado`, com a frente (+z) virada para a pista
const aoLongo = (p) => Math.atan2(-p.ty, p.tx); // rotation.y que põe o eixo x do objeto ao longo da pista
const ponto = (p, lado, d, t = 0) => [p.x + p.nx * lado * d + p.tx * t, p.y + p.ny * lado * d + p.ty * t];

// ---------------------------------------------------------------------------------------------------------------------
// 1. The Wing
// ---------------------------------------------------------------------------------------------------------------------
const WING = { de: 0.968, ate: 1.026, recuo: 64, lado: 1 };
const CORES_EQUIPE = ["#e8002d", "#ff8700", "#27f4d2", "#3671c6", "#229971", "#37bedd", "#ff87bc", "#6692ff"];

// o corte do prédio visto de lado: [afastamento a partir da frente, altura]. O prédio acompanha a reta, em fitas por material.
function theWing(tr, { add }) {
  const { pts, n, W } = tr, { lado } = WING, L0 = W / 2 + WING.recuo, F = predio(tr); // F: as alturas do prédio (garagem de 9,6 m de pé-direito no mundo de 0,2083 m/u, de 4,6 m com F)
  const rec = recortar(tr, Math.floor(WING.de * n), Math.floor(WING.ate * n), [lado * (L0 - 26), lado * (L0 + 90)]);
  if (!rec) return null;
  const { i0, i1 } = rec;
  const garagens = new THREE.MeshStandardMaterial({ roughness: 0.7, side: THREE.DoubleSide, map: canvasTex(64, 768, (x, w, h, rr) => {
    x.fillStyle = "#e7e7e3"; x.fillRect(0, 0, w, h); x.fillStyle = "#cfd1d1"; for (let b = 0; b <= 6; b++) x.fillRect(0, b * 128 - 2, w, 4); // os pilares entre as baias
    for (let b = 0; b < 6; b++) {
      const y0 = b * 128, cor = CORES_EQUIPE[(b * 3 + 1) % CORES_EQUIPE.length];
      x.fillStyle = "#2a2e35"; x.fillRect(0, y0 + 12, 52, 104);
      if (b % 2 === 0) { // garagem aberta: o interior claro, o pneu empilhado e o carro
        x.fillStyle = "#dcdad3"; x.fillRect(2, y0 + 14, 46, 100); x.fillStyle = "#1b1c1f"; x.fillRect(2, y0 + 16, 10, 16); x.fillRect(2, y0 + 96, 10, 16);
        x.fillStyle = cor; x.fillRect(4, y0 + 40, 16, 48); x.fillStyle = "#15161a"; x.fillRect(8, y0 + 56, 8, 16);
        x.fillStyle = "#f2c200"; x.fillRect(4, y0 + 36, 4, 56);
      } else { x.fillStyle = "#4b515a"; for (let k = 3; k < 52; k += 5) x.fillRect(k, y0 + 12, 2, 104); } // porta de enrolar fechada
      x.fillStyle = cor; x.fillRect(52, y0 + 12, 5, 104); x.fillStyle = "#ffffff"; x.fillRect(57, y0 + 12, 2, 104); // o letreiro da equipe em cima da porta
      for (let k = 0; k < 12; k++) { x.fillStyle = rr() < 0.5 ? "#0000000c" : "#ffffff10"; x.fillRect(rr() * w, y0 + rr() * 128, 3, 3); }
    }
  }) });
  const vidroM = new THREE.MeshStandardMaterial({ roughness: 0.16, metalness: 0.45, side: THREE.DoubleSide, map: canvasTex(32, 128, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, "#2c445a"); g.addColorStop(0.5, "#4d7390"); g.addColorStop(1, "#9ec0d6");
    x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = "#e8eef2"; x.fillRect(w * 0.5 - 1, 0, 2, h); x.fillRect(0, 0, 2, h); // o piso do 2º andar e o parapeito
    for (let k = 0; k < h; k += 32) { x.fillStyle = "#e8eef2"; x.fillRect(0, k, w, 2); }
    x.fillStyle = "#ffffff22"; for (let k = 0; k < h; k += 64) x.fillRect(0, k + 6, w, 10);
  }) });
  const concreto = M(0xb5b4ae, { roughness: 0.85, side: THREE.DoubleSide }), branco = M(0xf5f6f7, { roughness: 0.5, side: THREE.DoubleSide }), prata = M(0xbfc5cb, { roughness: 0.4, metalness: 0.5, side: THREE.DoubleSide });
  const azul = M(0x0b2a5b, { roughness: 0.5, side: THREE.DoubleSide }), parede = M(0xd9dadb, { roughness: 0.85, side: THREE.DoubleSide });
  const perfil = (dx0, y0, dx1, y1, mat, vLen = 60) => faixa(tr, add, i0, i1, lado * (L0 + dx0), lado * (L0 + dx1), y0 * F, y1 * F, mat, vLen);
  perfil(0, 0, 0, 46, garagens, 480); // as garagens (a textura tem seis baias)
  perfil(-9, 46, 0, 46, concreto); perfil(-9, 46, -9, 56, azul); perfil(-9, 56, 0, 56, concreto); // a laje do 1º andar com o frisão azul
  perfil(0, 56, 12, 118, vidroM, 90); perfil(12, 118, 12, 143.2, vidroM, 90); // o vidro inclinado, o Paddock Club
  perfil(-26, 128, 12, 143.2, prata, 120); perfil(-26, 128, -26, 142, branco); perfil(-26, 142, 84, 178, branco, 120); // o teto em asa: a borda fina na frente, sobe para trás
  perfil(84, 0, 84, 178, parede, 80);
  // os dois fechamentos nas pontas (o corte inteiro do prédio)
  const corte = [[0, 0], [0, 46], [-9, 46], [-9, 56], [0, 56], [12, 118], [12, 143.2], [-26, 128], [-26, 142], [84, 178], [84, 0]];
  const tri = THREE.ShapeUtils.triangulateShape(corte.map(([a, b]) => new THREE.Vector2(a, b)), []);
  for (const i of [i0, i1]) {
    const p = pts[i % n], vs = [];
    for (const [dx, y] of corte) vs.push(p.x + p.nx * lado * (L0 + dx), p.h + y * F, p.y + p.ny * lado * (L0 + dx));
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(vs, 3)); g.setIndex(tri.flat()); g.computeVertexNormals(); add(new THREE.Mesh(g, parede));
  }
  // os painéis: o "SILVERSTONE" no frisão da laje e os patrocinadores na borda do teto, virados para a pista
  const meio = Math.floor((i0 + i1) / 2), pm = pts[meio % n], g = new THREE.Group(), comp = (i1 - i0) * 6;
  g.position.set(pm.x, pm.h, pm.y); g.rotation.y = Math.atan2(pm.nx, pm.ny); add(g); // x do grupo ao longo da pista, z = lado da pista
  const larg = 112 * F, passo = larg + 10, fx = Math.max(3, Math.floor((comp - 30) / passo)), marcas = ["silverstone", "britgp", "pirelli", "rolex", "skysports", "heineken", "aramco", "dhl", "f1"];
  for (let k = 0; k < fx; k++) {
    const x = (k - (fx - 1) / 2) * passo;
    const a = new THREE.Mesh(new THREE.PlaneGeometry(larg, 9.4 * F), new THREE.MeshBasicMaterial({ map: marcaTex("silverstone", 512, 44), side: THREE.DoubleSide }));
    a.position.set(x, 51 * F, lado * (L0 - 9.6)); a.rotation.y = lado > 0 ? Math.PI : 0; g.add(a);
    const b = new THREE.Mesh(new THREE.PlaneGeometry(larg, 11.6 * F), new THREE.MeshBasicMaterial({ map: marcaTex(marcas[(k + 1) % marcas.length], 512, 52), side: THREE.DoubleSide }));
    b.position.set(x, 135 * F, lado * (L0 - 26.7)); b.rotation.y = lado > 0 ? Math.PI : 0; g.add(b);
  }
  // as aletas de aço entre as garagens (a luz que bate nelas dá o relevo da fachada)
  const m = new Montador(), S = solido();
  for (let k = 0; k <= Math.floor(comp / 80); k++) m.caixa(S, [-comp / 2 + k * 80, 23 * F, lado * (L0 - 1.2)], [1.2, 46 * F, 2.4], { cor: "#b9bdc1" });
  for (let k = 0; k < Math.floor(comp / 60); k++) m.caixa(S, [-comp / 2 + 30 + k * 60, 57.5 * F, lado * (L0 - 4.5)], [1.2, 1.6, 9], { cor: "#ffffff" }); // as luminárias do terraço
  g.add(m.montar("wing-detalhes"));
  // a torre da direção de prova, atrás do prédio, e o paddock
  const torre = torreCorrida({ andares: 5 }); torre.position.set(0, 0, lado * (L0 + 84 + 40)); torre.rotation.y = lado > 0 ? Math.PI : 0; g.add(torre);
  paddock(tr, g, lado, L0 + 84, comp);
  for (let i = i0; i <= i1; i += 4) { const p = pts[i % n]; tr.reservado.push([p.x + p.nx * lado * (L0 + 40), p.y + p.ny * lado * (L0 + 40), 96], [p.x + p.nx * lado * (L0 + 250), p.y + p.ny * lado * (L0 + 250), 170]); }
  return { i0, i1, L0 };
}

// o paddock atrás do The Wing, em coordenadas do grupo (x ao longo da reta, z para dentro do circuito): o piso de concreto, as tendas
// brancas, os motorhomes das equipes e as carretas
function paddock(tr, g, lado, z0, comp) {
  const m = new Montador(), S = solido(), r = sorteio(5521);
  m.caixa(S, [0, -19.5, lado * (z0 + 170)], [comp + 200, 40, 330], { cor: "#a7a9a8" }); // o piso desce 8 m: o chão cai por trás do prédio (a pista é mais alta que o terreno) e a laje não pode ficar no ar
  for (let k = -3; k <= 3; k++) m.caixa(S, [k * 140, 0.45, lado * (z0 + 170)], [1.4, 0.3, 320], { cor: "#f2f2f0" }); // a pintura do piso
  g.add(m.montar("paddock-piso"));
  const nT = Math.min(4, Math.floor(comp / 220));
  for (let k = 0; k < nT; k++) {
    const t = tendaPaddock({ modulos: 3, filas: 2, texto: ["SILVERSTONE", "PIRELLI", "ROLEX", "SKY SPORTS"][k % 4], corFaixa: [AZUL, "#111111", "#00603a", "#0072c9"][k % 4], corMesas: VERMELHO });
    t.scale.setScalar(2.1); t.position.set((k - (nT - 1) / 2) * 250, 0.4, lado * (z0 + 140)); t.rotation.y = lado > 0 ? Math.PI : 0; g.add(t);
  }
  const textos = ["FERRARI", "MCLAREN", "MERCEDES", "RED BULL", "ASTON MARTIN", "ALPINE"], nM = Math.min(5, Math.floor(comp / 190));
  for (let k = 0; k < nM; k++) {
    const b = boxEquipe({ portas: 2, cor: ["#d62a1f", "#ff7a1a", "#2fb8a3", "#1d4fd8", "#13804a", "#e873a8"][k % 6], texto: textos[k % 6], corTexto: "#ffffff", corFaixa: "#15161a", abertura: 0.8, carros: 1, interior: false });
    b.scale.setScalar(0.5); b.position.set((k - (nM - 1) / 2) * 200, 0.4, lado * (z0 + 260)); b.rotation.y = lado > 0 ? Math.PI : 0; g.add(b); // (o motorhome de 24 m e 14 m de altura sai de 12 × 7 m)
  }
  const carretas = new Montador();
  for (let k = 0; k < 9; k++) {
    const x = (k - 4) * 92 + (r() - 0.5) * 8, z = lado * (z0 + 40 + (k % 2) * 4), cor = CORES_EQUIPE[k % CORES_EQUIPE.length];
    // a carreta de 16 m, 4 m de altura e 2,7 m de largura (antes 7 m de largura e 6,7 m de altura)
    carretas.caixa(S, [x, 13, z], [78, 19, 13], { cor: "#eceeef" }); carretas.caixa(S, [x, 11, z - lado * 6.8], [78, 6, 0.6], { cor });
    carretas.caixa(S, [x + 46, 9, z], [14, 14, 12], { cor }); carretas.caixa(S, [x + 49.4, 12, z], [7, 6, 11], { cor: "#26323d" });
    for (const dx of [-26, -10, 36, 48]) for (const s of [-1, 1]) carretas.cilindro(S, [x + dx, 2.4, z + s * 5.4], [2.4, 2], { cor: "#1b1c1f", rx: Math.PI / 2, seg: 8 });
  }
  g.add(carretas.montar("paddock-carretas"));
}

// ---------------------------------------------------------------------------------------------------------------------
// 2. As tribunas cobertas das retas (kit 2) e as bandeiras da torcida
// ---------------------------------------------------------------------------------------------------------------------
// frações da volta de cada tribuna: [de, ate, lado, cores, fileiras]. Cada módulo tem uns 230 de comprimento (48 m) e fica logo atrás do escape. O degrau é o do kit (6 × `tr.escala` de altura, 9 × `tr.escala` de fundo: 0,5 × 0,75 m) e a gente tem 1,7 m (./kit/silverstone/tribuna.js).
const TRIBUNAS = [
  [0.968, 1.025, -1, [AZUL, BRANCO, VERMELHO, BRANCO], 20], // a tribuna principal, de frente para o The Wing
  [0.205, 0.236, -1, [VERMELHO, BRANCO, AZUL], 14], [0.258, 0.292, -1, [AZUL, BRANCO, VERMELHO], 14], // a Wellington Straight
  [0.443, 0.476, -1, [AZUL, VERMELHO, BRANCO], 14], // a reta para Copse
  [0.545, 0.58, -1, [VERMELHO, BRANCO, AZUL, BRANCO], 14], // a reta de Copse a Maggotts
  [0.712, 0.746, -1, [AZUL, BRANCO, VERMELHO], 14], [0.774, 0.806, -1, [VERMELHO, BRANCO, AZUL], 14], // a Hangar Straight
];
const flagsTorcida = []; // { x, y, z, ry, s }: postas aqui por quem monta uma arquibancada e desenhadas todas de uma vez em bandeirasTorcida

function tribunas(tr, { add }) {
  const { pts, n, W } = tr, L = W / 2 + 38, r = sorteio(9071), reservar = [], E = tr.escala ?? 1, ALT = 6 * E, PROF = 9 * E;
  let semente = 3;
  const somDaTorcida = (i0, i1) => { i0 = ((i0 % n) + n) % n; i1 = ((i1 % n) + n) % n; if (i1 >= i0) tr.arquibancadas.push([i0, i1]); else tr.arquibancadas.push([i0, n - 1], [0, i1]); };
  tr.arquibancadas ||= [];
  for (const [f0, f1, lado, cores, fileiras] of TRIBUNAS) {
    const i0 = Math.floor(f0 * n), i1 = Math.floor(f1 * n), comp = (i1 - i0) * 6, nm = Math.max(1, Math.round(comp / 232)), len = comp / nm, fundo = fileiras * PROF + 22;
    for (let k = 0; k < nm; k++) {
      const ic = Math.round(i0 + ((k + 0.5) * len) / 6), p = pts[ic % n], x = p.x + p.nx * lado * L, z = p.y + p.ny * lado * L;
      // a pista (qualquer trecho) não pode chegar perto de nenhum canto da tribuna
      const ok = [[-len / 2, 0], [len / 2, 0], [-len / 2, fundo], [len / 2, fundo], [0, fundo], [0, 0]].every(([u, d]) => {
        const qx = p.x + p.nx * lado * (L + d) + p.tx * u, qz = p.y + p.ny * lado * (L + d) + p.ty * u;
        return tr.distAt(qx, qz) >= L - 5 && !ocupado(tr, qx, qz);
      });
      if (!ok) continue;
      // a tribuna é horizontal e a pista não: ela assenta no ponto mais baixo do trecho (1 u abaixo) e o bloco sob o primeiro degrau desce até o mais alto
      let hMin = Infinity, hMax = -Infinity;
      for (let i = ic - Math.ceil(len / 12); i <= ic + Math.ceil(len / 12); i++) { const h = pts[((i % n) + n) % n].h; hMin = Math.min(hMin, h); hMax = Math.max(hMax, h); }
      const base = hMin - 1, t = tribunaReal({ escala: E, comprimento: len - 6, degraus: fileiras, cores, secoes: Math.max(3, Math.round(len / 60)), cobertura: "#f6f6f4", publico: 0.15, semente: semente++, alcance: 0.78, folga: 26, vao: 58, embutido: hMax - hMin + 3, camisas: tr.camisasGP });
      t.position.set(x, base, z); t.rotation.y = ry0(p, lado); add(t);
      for (let j = 0; j < 7; j++) { // as bandeiras nos degraus de cima
        const u = (r() - 0.5) * (len - 30), row = Math.floor(fileiras * 0.5) + Math.floor(r() * Math.floor(fileiras * 0.45)), [fx, fz] = ponto(p, lado, L + (row + 0.5) * PROF, u);
        flagsTorcida.push({ x: fx, y: base + (row + 1) * ALT, z: fz, ry: aoLongo(p) + (r() - 0.5) * 0.6, s: 0.9 + r() * 0.5 });
      }
      for (let i = ic - Math.floor(len / 12); i <= ic + Math.floor(len / 12); i += 3) { const q = pts[((i % n) + n) % n]; reservar.push([q.x + q.nx * lado * (L + 45), q.y + q.ny * lado * (L + 45), 80]); }
      somDaTorcida(ic - Math.floor(len / 12), ic + Math.floor(len / 12)); // o som da torcida
    }
  }
  tr.reservado.push(...reservar); // só depois de todas, para uma tribuna não barrar a vizinha
}

// as bandeiras da torcida: a haste com a Union Jack no alto, nos degraus das arquibancadas do kit e das tribunas. Um InstancedMesh para as hastes e um para as bandeiras.
function bandeirasTorcida(tr, { add }) {
  const { pts, n } = tr, r = sorteio(6113), lista = flagsTorcida.slice();
  for (const q of tr.arqDegraus || []) {
    const passo = 6;
    for (let i = q.i0; i <= q.i1; i += passo) {
      if (r() < 0.45) continue;
      const p = pts[i % n], fila = Math.floor(r() * q.degraus), [x, z] = ponto(p, q.lado, Math.abs(q.l0) + (fila + 0.5) * q.prof); // (o degrau do kit, `tr.arqDegraus`: fundo, altura e base na escala do cenário)
      lista.push({ x, y: p.h + q.base + (fila + 1) * q.alt, z, ry: aoLongo(p) + (r() - 0.5) * 0.7, s: 0.8 + r() * 0.5 });
    }
  }
  if (!lista.length) return;
  const hastes = lista.map((o) => ({ x: o.x, y: o.y + 5, z: o.z, sx: 1, sy: 10, sz: 1 }));
  instancias(add, new THREE.CylinderGeometry(0.4, 0.4, 1, 4), M(0xd9d9d9), hastes, { sombra: false, nome: `${tr.id}-hastes` });
  const mat = new THREE.MeshStandardMaterial({ map: bandeiraUK(), roughness: 0.8, side: THREE.DoubleSide }), flag = add(new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), mat, lista.length)), d = new THREE.Object3D();
  lista.forEach((o, k) => { d.position.set(o.x + Math.cos(-o.ry) * 4.6 * o.s, o.y + 8.6, o.z + Math.sin(-o.ry) * 4.6 * o.s); d.rotation.set(0, o.ry, (r() - 0.5) * 0.3); d.scale.set(9.2 * o.s, 5.2 * o.s, 1); d.updateMatrix(); flag.setMatrixAt(k, d.matrix); });
  flag.name = `${tr.id}-flags-uk`;
}

// ---------------------------------------------------------------------------------------------------------------------
// 3. O aeródromo da RAF: as pistas de pouso, os hangares, as barracas Nissen e a torre de controle
// ---------------------------------------------------------------------------------------------------------------------
const POUSOS = [[0.76, 560], [0.2475, 580], [0.55, 600]]; // [fração da reta, afastamento para dentro do circuito]: pistas paralelas às retas que foram pistas de verdade
function pousos(tr, { add }) {
  const { pts, n, W } = tr, mundo = tr.t.world, largura = 130, passo = 60, vs = [], uv = [], idx = [];
  const eixos = POUSOS.map(([f, off]) => { const p = pts[Math.floor(f * n)]; return { x: p.x + p.nx * off, z: p.y + p.ny * off, dx: p.tx, dz: p.ty }; });
  tr.pousos = eixos;
  eixos.forEach((e, k) => {
    for (let s = -2800; s < 2800; s += passo) {
      const cx = e.x + e.dx * (s + passo / 2), cz = e.z + e.dz * (s + passo / 2);
      if (cx < -1200 || cz < -1200 || cx > mundo + 1200 || cz > mundo + 1200) continue;
      if (tr.distAt(cx, cz) < W / 2 + 95 + largura / 2 || ocupado(tr, cx, cz)) continue;
      const base = vs.length / 3;
      for (const [a, d] of [[s, -1], [s, 1], [s + passo, -1], [s + passo, 1]]) {
        const x = e.x + e.dx * a - e.dz * d * largura / 2, z = e.z + e.dz * a + e.dx * d * largura / 2;
        vs.push(x, solo(tr, x, z) + 0.55 + k * 0.15, z); uv.push(d > 0 ? 1 : 0, a / 120);
      }
      idx.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
    }
  });
  if (!idx.length) return;
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.95, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, map: canvasTex(32, 128, (x, w, h, rr) => {
    x.fillStyle = "#8a8d90"; x.fillRect(0, 0, w, h); for (let i = 0; i < 200; i++) { x.fillStyle = rr() < 0.5 ? "#00000014" : "#ffffff14"; x.fillRect(rr() * w, rr() * h, 3, 2); }
    x.fillStyle = "#f1f1ee"; x.fillRect(1, 0, 2, h); x.fillRect(w - 3, 0, 2, h); x.fillRect(w / 2 - 1, 0, 2, h / 2); // as bordas e o tracejado do eixo
    x.fillStyle = "#6d7073"; x.fillRect(w / 2 - 6, h * 0.8, 12, 2); // a emenda das placas de concreto
  }) });
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(vs, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const m = add(new THREE.Mesh(g, mat)); m.receiveShadow = true; m.name = `${tr.id}-pousos`;
}

function aerodromo(tr, { add }) {
  const { pts, n } = tr;
  const e = tr.pousos?.[0]; // a pista da Hangar Straight: os hangares ficam do lado dela que dá para a pista de corrida
  const puxar = (g, x, z, ry, folga = 140) => { if (!livre(tr, x, z, folga) || ocupado(tr, x, z)) return false; g.position.set(x, solo(tr, x, z) - 0.5, z); g.rotation.y = ry; add(g); tr.reservado.push([x, z, folga * 0.8]); return true; }; // (o chão que se vê, 1,5 u abaixo do analítico)
  if (e) {
    const pm = pts[Math.floor(0.76 * n)], ry = aoLongo(pm);
    // o hangar em arco de 30 m de vão e 8,5 m de altura (o de antes tinha 39 m e 17 m); a barraca Nissen de 10 × 5,3 m e 2,9 m de altura (antes 16 × 8 m e 4,5 m)
    for (const [t, off, c] of [[-170, POUSOS[0][1] - 235, 300], [200, POUSOS[0][1] - 235, 290]]) {
      const [x, z] = ponto(pm, 1, off, t);
      puxar(hangarRAF({ comprimento: c, largura: 150, altura: 42 }), x, z, ry, 130);
    }
    for (let k = 0; k < 4; k++) { const [x, z] = ponto(pm, 1, POUSOS[0][1] - 235, 430 + k * 70); puxar(hangarRAF({ comprimento: 50, largura: 26, altura: 14, corTeto: "#7b848a" }), x, z, ry, 50); }
  }
  const pt = pts[Math.floor(0.885 * n)], [x, z] = ponto(pt, 1, 430);
  const tor = torreRAF(); tor.scale.setScalar(0.55); // a torre de controle de 22 m (antes 110 u) fica com 12 m e 9,5 × 6 m de planta
  puxar(tor, x, z, ry0(pt, 1), 90);
}

// ---------------------------------------------------------------------------------------------------------------------
// 4. Pórticos, telões e as placas com o nome das curvas
// ---------------------------------------------------------------------------------------------------------------------
const PORTICOS = [
  [0.0335, "SILVERSTONE", "#0b2a5b", "#ffffff"], [0.2475, "PIRELLI", "#101113", "#ffd100"], [0.455, "ROLEX", "#00603a", "#c9a54c"], [0.76, "HEINEKEN", "#007a3d", "#ffffff"],
];
function porticos(tr, { add }) {
  const { pts, n, W } = tr;
  for (const [f, texto, cor, corTexto] of PORTICOS) {
    const p = pts[Math.floor(f * n)], vao = 2 * (W / 2 + 46);
    const pes = [-1, 1].map((s) => ponto(p, s, vao / 2 + 4));
    if (!pes.every(([x, z]) => livre(tr, x, z, 20) && !ocupado(tr, x, z))) continue;
    const g = portico({ vao, alto: 46, viga: 10, cor, texto, corTexto, corColuna: "#1b1b1f" }); // (a viga a 9,6 m da pista e 2 m de altura; antes 13,7 m e 2,9 m)
    g.position.set(p.x, p.h, p.y); g.rotation.y = Math.atan2(-p.ny, p.nx); add(g);
    for (const [x, z] of pes) tr.reservado.push([x, z, 28]);
  }
}

function telaoes(tr, { add }) {
  const { pts, n, W } = tr;
  for (const [f, lado, d, texto] of [[0.15, 1, 205, "BRITISH GRAND PRIX"], [0.335, 1, 190, "SILVERSTONE"], [0.995, -1, 0, "LIGHTS OUT"]]) {
    if (!d) continue;
    const p = pts[Math.floor(f * n)], [x, z] = ponto(p, lado, W / 2 + d);
    if (!livre(tr, x, z, d - 40) || ocupado(tr, x, z)) continue;
    const t = telao({ texto, w: 160, h: 90, altura: 60 }); t.scale.setScalar(0.45); /* 14,8 × 8,3 m sobre pernas de 5,6 m (antes 33 × 18,5 m, pernas de 12,5 m) */ t.position.set(x, solo(tr, x, z) - 0.3, z); t.rotation.y = ry0(p, lado); add(t); tr.reservado.push([x, z, 100]);
  }
}

// as placas com o nome das curvas (8 × 4 m, a 1,9 m do chão, dois postes), de pé no fim do escape, viradas para quem chega: uma só textura com os 15 nomes e uma malha só
const CURVAS = [["ABBEY", 1, 0.052], ["FARM", 2, 0.088], ["VILLAGE", 3, 0.123], ["THE LOOP", 4, 0.153], ["AINTREE", 5, 0.182], ["BROOKLANDS", 6, 0.31], ["LUFFIELD", 7, 0.347],
  ["WOODCOTE", 8, 0.395], ["COPSE", 9, 0.50], ["MAGGOTTS", 10, 0.585], ["BECKETTS", 11, 0.625], ["CHAPEL", 13, 0.66], ["STOWE", 15, 0.835], ["VALE", 16, 0.922], ["CLUB", 17, 0.955]];
function placasDasCurvas(tr, { add }) {
  const { pts, n, W } = tr, vs = [], uv = [], idx = [], m = new Montador(), S = solido();
  const atlas = canvasTex(1024, 512, (x, w, h) => {
    CURVAS.forEach(([nome, num], k) => {
      const c = k % 4, rr = Math.floor(k / 4), x0 = c * 256, y0 = rr * 128;
      x.fillStyle = "#0b2a5b"; x.fillRect(x0, y0, 256, 128); x.strokeStyle = "#ffffff"; x.lineWidth = 5; x.strokeRect(x0 + 4, y0 + 4, 248, 120);
      x.fillStyle = VERMELHO; x.fillRect(x0 + 10, y0 + 10, 54, 108); x.fillStyle = "#ffffff"; x.font = "900 44px Arial, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(String(num), x0 + 37, y0 + 66);
      x.font = `900 ${nome.length > 8 ? 28 : 34}px Arial, sans-serif`; x.fillText(nome, x0 + 160, y0 + 66);
    });
  }, false);
  CURVAS.forEach(([, , f], k) => {
    const p = pts[Math.floor(f * n)];
    let escolhido = null;
    for (const lado of [-1, 1]) {
      const d = W / 2 + 46, [x, z] = ponto(p, lado, d);
      if (tr.distAt(x, z) >= d - 8 && !ocupado(tr, x, z)) { escolhido = [lado, x, z]; break; }
    }
    if (!escolhido) return;
    const [lado, x, z] = escolhido, y = tr.chao(x, z) - 0.8; // (a fita de grama está 0,7 u acima do chão analítico: o poste entra nela)
    // a placa gira um pouco para quem vem de trás (a frente aponta para a pista e um pouco contra o sentido da corrida)
    const nx = -lado * p.nx - 0.55 * p.tx, nz = -lado * p.ny - 0.55 * p.ty, len = Math.hypot(nx, nz), ex = nz / len, ez = -nx / len; // (ex, ez): o eixo largo da placa
    const w = 39, h = 19.5, y0 = y + 9.8, c = k % 4, rr = Math.floor(k / 4), base = vs.length / 3;
    for (const [a, b] of [[-1, 0], [1, 0], [-1, 1], [1, 1]]) { vs.push(x + ex * a * w / 2, y0 + b * h, z + ez * a * w / 2); uv.push(((a + 1) / 2 + c) / 4, 1 - (rr + 1 - b) / 4); }
    idx.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
    for (const s of [-1, 1]) m.caixa(S, [x + ex * s * (w / 2 - 3), y + 13, z + ez * s * (w / 2 - 3)], [1.4, 26, 1.4], { cor: "#d9dbdd", ry: Math.atan2(ex, ez) }); // (o poste do chão até a metade da placa)
    tr.reservado.push([x, z, 26]);
  });
  if (!idx.length) return;
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(vs, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const placa = add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: atlas, roughness: 0.6, side: THREE.DoubleSide }))); placa.castShadow = true; placa.name = `${tr.id}-placas-curvas`;
  add(m.montar("placas-curvas-postes"));
}

// ---------------------------------------------------------------------------------------------------------------------
// 5. A Inglaterra em volta: o camping, as aldeias, o patchwork de campos, as sebes e os bosques
// ---------------------------------------------------------------------------------------------------------------------
const BARRACAS = ["#e63946", "#f4a261", "#2a9d8f", "#264653", "#e9c46a", "#3a86ff", "#8338ec", "#ff006e", "#fb5607", "#06d6a0", "#f1faee", "#ffbe0b", "#1d3557", "#a7c957"];
function camping(tr, { add }) {
  const { pts, n, W } = tr, r = sorteio(7741), barracas = [], trailers = [], carros = [], hastes = [], flags = [];
  const acampamentos = [[0.465, -1], [0.805, -1], [0.065, -1], [0.7, 1]];
  for (const [f, lado] of acampamentos) {
    const p = pts[Math.floor(f * n)];
    let centro = null;
    for (let d = 480; d <= 900 && !centro; d += 40) { const [x, z] = ponto(p, lado, d); if (livre(tr, x, z, 330) && !ocupado(tr, x, z)) centro = [x, z]; }
    if (!centro) continue;
    const [cx, cz] = centro, ang = aoLongo(p), L = (u, v) => [cx + p.tx * u + p.nx * v, cz + p.ty * u + p.ny * v];
    // a barraca de 3 × 4 m e 1,5 m de altura (antes 5 a 7 m e 3,3 a 4,7 m), a caravana de 6,6 × 2,3 m e o carro de 4,5 × 1,9 m (antes 8,8 × 3,7 m), numa grade de 5 × 5 m; tudo no chão que se vê (o terreno, `solo`)
    for (let i = -10; i <= 10; i++) for (let j = -8; j <= 8; j++) {
      if (Math.abs(i) <= 5 && Math.abs(j) <= 4) continue; // a clareira da "fan zone" no meio
      if (r() < 0.16) continue;
      const [x, z] = L(i * 26 + (r() - 0.5) * 5, j * 24 + (r() - 0.5) * 5), cor = BARRACAS[(r() * BARRACAS.length) | 0], g = solo(tr, x, z);
      if (r() < 0.07) trailers.push({ x, y: g + 6.7, z, sx: 32, sy: 13, sz: 11, r: ang + (r() < 0.5 ? 0 : Math.PI / 2) });
      else barracas.push({ x, y: g - 0.3, z, sx: 13 + r() * 4, sy: 6.5 + r() * 2.5, sz: 15 + r() * 5, r: ang + (r() - 0.5) * 0.35, cor });
      if (r() < 0.22) { const [qx, qz] = L(i * 26 + 10, j * 24 + 8); carros.push({ x: qx, y: solo(tr, qx, qz) + 4.4, z: qz, sx: 22, sy: 7.5, sz: 9, r: ang + (r() < 0.8 ? Math.PI / 2 : 0), cor: ["#1c1c1f", "#c9ccd0", "#b3262e", "#1f4f9a", "#e2e2e0", "#2d6a43"][(r() * 6) | 0] }); }
    }
    for (let k = 0; k < 14; k++) { // os mastros com a Union Jack nas pontas das fileiras (8 m, do chão)
      const [x, z] = L((k % 2 ? 1 : -1) * (290 + r() * 20), (r() - 0.5) * 380), h = solo(tr, x, z);
      hastes.push({ x, y: h + 19.7, z, sx: 1, sy: 40, sz: 1 }); flags.push({ x: x + Math.cos(ang) * 7, y: h + 35, z: z - Math.sin(ang) * 7, r: ang, s: 1.7 });
    }
    // a fan zone: a tenda grande de velas brancas com o telão ao lado
    const t = tendaPaddock({ modulos: 4, filas: 3, texto: "FAN ZONE", corFaixa: VERMELHO, corMesas: AZUL, vao: 34, profundidade: 34 });
    t.scale.setScalar(1.6); t.position.set(cx, solo(tr, cx, cz) - 0.3, cz); t.rotation.y = ang + Math.PI / 2; add(t);
    tr.reservado.push([cx, cz, 340]);
  }
  const sph = new THREE.SphereGeometry(1, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), caixa = new THREE.BoxGeometry(1, 1, 1);
  const colorir = (m, lista) => { if (!m) return; lista.forEach((o, k) => m.setColorAt(k, new THREE.Color(o.cor || "#ffffff"))); m.instanceColor.needsUpdate = true; };
  colorir(instancias(add, sph, M(0xffffff, { roughness: 0.85 }), barracas, { sombra: false, nome: `${tr.id}-barracas` }), barracas);
  instancias(add, caixa, M(0xeeeeea, { roughness: 0.6 }), trailers, { sombra: false, nome: `${tr.id}-trailers` });
  colorir(instancias(add, caixa, M(0xffffff, { roughness: 0.5 }), carros, { sombra: false, nome: `${tr.id}-carros` }), carros);
  instancias(add, new THREE.CylinderGeometry(0.4, 0.4, 1, 4), M(0xd9d9d9), hastes, { sombra: false });
  if (flags.length) {
    const mat = new THREE.MeshStandardMaterial({ map: bandeiraUK(), roughness: 0.8, side: THREE.DoubleSide }), fm = add(new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), mat, flags.length)), d = new THREE.Object3D();
    flags.forEach((o, k) => { d.position.set(o.x, o.y, o.z); d.rotation.set(0, o.r, (r() - 0.5) * 0.2); d.scale.set(14 * o.s, 8 * o.s, 1); d.updateMatrix(); fm.setMatrixAt(k, d.matrix); });
  }
}

// as aldeias: as casinhas de pedra e de tijolo com telhado de duas águas (corpo e telhado são InstancedMesh), uma igreja e os campos de volta
function aldeias(tr, { add }) {
  const r = sorteio(8101), corpos = [], telhas = [];
  const candidatos = [[600, 650], [4800, 700], [4750, 4100], [820, 4650], [2900, 5300], [330, 2550], [5000, 2500], [2700, -400]];
  let feitas = 0;
  for (const [cx, cz] of candidatos) {
    if (feitas >= 3) break;
    if (!livre(tr, cx, cz, 330) || ocupado(tr, cx, cz)) continue;
    const ang = (r() - 0.5) * 0.6, ca = Math.cos(ang), sa = Math.sin(ang);
    for (let k = 0; k < 24; k++) { // duas fileiras ao longo da estradinha
      const u = (k % 12 - 5.5) * 64 + (r() - 0.5) * 14, v = (k < 12 ? -1 : 1) * (40 + r() * 12), x = cx + ca * u - sa * v, z = cz + sa * u + ca * v;
      if (!livre(tr, x, z, 250)) continue;
      const w = 35 + r() * 20, l = 45 + r() * 25, h = 24 + r() * 8, base = solo(tr, x, z) - 0.8, cor = ["#d8c9a0", "#b36a4e", "#cfc3a6", "#e6dfcd", "#a9754f", "#c9b78a"][(r() * 6) | 0];
      corpos.push({ x, y: base + h / 2, z, sx: l, sy: h, sz: w, r: -ang, cor });
      telhas.push({ x, y: base + h, z, sx: w + 5, sy: 12 + r() * 5, sz: l + 5, r: Math.PI / 2 - ang, cor: ["#4f5a63", "#8a4a3a", "#5d4b43", "#3d4650"][(r() * 4) | 0] });
    }
    if (feitas < 2) { const ig = igreja(), [x, z] = [cx + ca * 420, cz + sa * 420]; if (livre(tr, x, z, 280)) { ig.position.set(x, solo(tr, x, z) - 0.8, z); ig.rotation.y = -ang; add(ig); } }
    tr.reservado.push([cx, cz, 420]); feitas++;
  }
  const colorir = (m, lista) => { if (!m) return; lista.forEach((o, k) => m.setColorAt(k, new THREE.Color(o.cor))); m.instanceColor.needsUpdate = true; };
  colorir(instancias(add, new THREE.BoxGeometry(1, 1, 1), M(0xffffff, { roughness: 0.9 }), corpos, { sombra: false, nome: `${tr.id}-casas` }), corpos);
  // o telhado: o prisma de lado 1 (a cumeeira ao longo de z); o corpo já está girado, o telhado gira com o mesmo `r`
  colorir(instancias(add, prismaGeo(), M(0xffffff, { roughness: 0.85 }), telhas, { sombra: false, nome: `${tr.id}-telhados` }), telhas);
}

// as turbinas de vento, lá longe, e os campos
function turbinas(tr, { add }) {
  const lugares = [[-700, 1500], [6200, 3200], [5900, 800], [-500, 4600], [3000, 6300], [1500, -900]];
  lugares.forEach(([x, z], k) => { if (!livre(tr, x, z, 600)) return; const t = turbina({ altura: 520, pa: 215, giro: k * 0.7 }); t.position.set(x, solo(tr, x, z) - 1, z); t.rotation.y = 0.4 + k; add(t); });
}

const CAMPOS = ["#9bbd5c", "#b9c866", "#d9c65a", "#cdb34a", "#7fa94f", "#6f9c47", "#bba46c", "#a6c56f", "#86683f", "#9fb85a"];
const COPAS = ["#3f7a34", "#4c8a3a", "#2f6a2e", "#5a9440", "#6b9a3a", "#3a6f3c"];
function campos(tr, { add }) {
  const r = sorteio(2603), mundo = tr.t.world, W = tr.W, passo = 270, lista = [], sebes = [], copas = [], troncos = [];
  const pousoLonge = (x, z) => (tr.pousos || []).every((e) => Math.abs((x - e.x) * e.dz - (z - e.z) * e.dx) > 130 + 70);
  const plano = (x, z) => tr.chao(x, z) === 0;
  for (let gx = -1200; gx < mundo + 1200; gx += passo) for (let gz = -1200; gz < mundo + 1200; gz += passo) {
    const cx = gx + passo / 2 + (r() - 0.5) * 24, cz = gz + passo / 2 + (r() - 0.5) * 24, sx = 190 + r() * 62, sz = sx * (0.8 + r() * 0.25), ang = 0.38 + (r() - 0.5) * 0.42;
    const cs = Math.cos(ang), sn = Math.sin(ang), loc = (lx, lz) => [cx + cs * lx + sn * lz, cz - sn * lx + cs * lz]; // o campo gira com rotation.y = ang
    const cantos = [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, 0]].map(([a, b]) => loc((a * sx) / 2, (b * sz) / 2));
    if (!cantos.every(([x, z]) => plano(x, z) && tr.distAt(x, z) > W / 2 + 300 && !ocupado(tr, x, z) && pousoLonge(x, z))) continue;
    lista.push({ x: cx, y: -1.1, z: cz, sx, sy: 1, sz, r: ang, cor: CAMPOS[(r() * CAMPOS.length) | 0] });
    [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([a, b]) => { // as sebes: duas ou três beiras do campo
      if (r() < 0.55) return;
      const [x, z] = loc((a * sx) / 2, (b * sz) / 2);
      const alto = 10 + r() * 4; // a sebe inglesa de 2 a 3 m de altura e 1,2 m de largura (antes 3 a 4,4 m e 1,5 m)
      sebes.push({ x, y: solo(tr, x, z) - 0.3 + alto / 2, z, sx: (a ? sz : sx) * 0.98, sy: alto, sz: 6, r: a ? ang - Math.PI / 2 : ang, cor: ["#2f5a2a", "#3a6a30", "#274c25", "#44703a"][(r() * 4) | 0] });
    });
    if (r() < 0.55) { // uma árvore solta num canto do campo
      const [a, b] = cantos[(r() * 4) | 0], h = 34 + r() * 14, rc = 30 + r() * 16;
      troncos.push({ x: a, y: h / 2 - 2, z: b, sx: 4, sy: h, sz: 4 }); copas.push({ x: a, y: h - 2 + rc * 0.55, z: b, sx: rc * 1.1, sy: rc * 0.85, sz: rc * 1.1, r: r() * 6, cor: COPAS[(r() * COPAS.length) | 0] });
    }
  }
  // o cinturão de árvores em volta do autódromo (dos dois lados, a 230-390 da beira), com falhas
  const { pts, n } = tr;
  for (let i = 0; i < n; i += 7) {
    const p = pts[i];
    for (const lado of [-1, 1]) {
      if (r() < (lado < 0 ? 0.35 : 0.6)) continue;
      const d = W / 2 + (lado < 0 ? 230 : 210) + r() * (lado < 0 ? 170 : 210), [x, z] = ponto(p, lado, d, (r() - 0.5) * 30);
      if (tr.distAt(x, z) < d - 20 || ocupado(tr, x, z) || !pousoLonge(x, z)) continue;
      const base = tr.chao(x, z), h = 30 + r() * 22, rc = 24 + r() * 20;
      troncos.push({ x, y: base - 2 + h / 2, z, sx: 4, sy: h, sz: 4 }); copas.push({ x, y: base - 2 + h + rc * 0.5, z, sx: rc * 1.1, sy: rc * 0.9, sz: rc * 1.1, r: r() * 6, cor: COPAS[(r() * COPAS.length) | 0] });
    }
  }
  // os bosques pequenos (os "spinneys") em alguns pontos soltos
  for (let k = 0; k < 14; k++) {
    const cx = -900 + r() * (mundo + 1800), cz = -900 + r() * (mundo + 1800);
    if (!plano(cx, cz) || tr.distAt(cx, cz) < W / 2 + 330 || ocupado(tr, cx, cz) || !pousoLonge(cx, cz)) continue;
    const qtd = 9 + ((r() * 8) | 0);
    for (let q = 0; q < qtd; q++) { const a = r() * 6.28, d = r() * 70, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d, h = 34 + r() * 26, rc = 24 + r() * 20; troncos.push({ x, y: h / 2 - 2, z, sx: 4, sy: h, sz: 4 }); copas.push({ x, y: h - 2 + rc * 0.5, z, sx: rc * 1.1, sy: rc * 0.9, sz: rc * 1.1, r: r() * 6, cor: COPAS[(r() * COPAS.length) | 0] }); }
  }
  const colorir = (m, l) => { if (!m) return; l.forEach((o, k) => m.setColorAt(k, new THREE.Color(o.cor))); m.instanceColor.needsUpdate = true; };
  const chao = new THREE.PlaneGeometry(1, 1); chao.rotateX(-Math.PI / 2);
  const faixas = canvasTex(64, 64, (x, w, h, rr) => { x.fillStyle = "#ffffff"; x.fillRect(0, 0, w, h); for (let k = 0; k < w; k += 8) { x.fillStyle = "#00000012"; x.fillRect(k, 0, 4, h); } for (let k = 0; k < 120; k++) { x.fillStyle = rr() < 0.5 ? "#0000000c" : "#ffffff18"; x.fillRect(rr() * w, rr() * h, 3, 3); } });
  colorir(instancias(add, chao, new THREE.MeshStandardMaterial({ map: faixas, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), lista, { sombra: false, nome: `${tr.id}-campos` }), lista);
  colorir(instancias(add, new THREE.BoxGeometry(1, 1, 1), M(0xffffff, { roughness: 1 }), sebes, { sombra: false, nome: `${tr.id}-sebes` }), sebes);
  instancias(add, new THREE.CylinderGeometry(0.7, 1, 1, 5), M(0x5b4130, { roughness: 1 }), troncos, { sombra: false, nome: `${tr.id}-troncos` });
  colorir(instancias(add, new THREE.IcosahedronGeometry(1, 0), M(0xffffff, { roughness: 0.95, flatShading: true }), copas, { sombra: false, nome: `${tr.id}-copas` }), copas);
}

// ---------------------------------------------------------------------------------------------------------------------
export function cenarioSilverstone(tr, ctx, ambiente) {
  tr.reservado ||= [];
  const se = tr.t.superficieEscape || {};
  beiradaSolida(tr, ctx.add, { brita: se.brita || [], listrado: se.listrado || [] }); // a base sólida da pista e a grama no nível do asfalto, dos dois lados (kit/silverstone/chao.js)
  ambienteSilverstone(tr, ctx.add, ambiente); // painéis na barreira, mastros e placas de frenagem no chão, postos dos fiscais (kit/silverstone/ambiente.js)
  tr.camisasGP = ["#ffffff", "#c8102e", "#1d3f8f", "#f4f4f4", "#0b2a5b", "#c8102e", "#e8e8e8", "#ffd23f"]; // a torcida de vida.js de branco, azul e vermelho
  theWing(tr, ctx);
  tribunas(tr, ctx);
  pousos(tr, ctx);
  aerodromo(tr, ctx);
  porticos(tr, ctx);
  telaoes(tr, ctx);
  camping(tr, ctx);
  aldeias(tr, ctx);
  turbinas(tr, ctx);
  placasDasCurvas(tr, ctx);
  campos(tr, ctx);
}

// o que vem por último: as bandeiras da torcida e a faixa "SILVERSTONE" pendurada no pórtico da largada (o de pista.js)
export function depoisSilverstone(tr, ctx) {
  bandeirasTorcida(tr, ctx);
  postesDRS(tr);
  const { add } = ctx, p = tr.pts[0], L = tr.W / 2 + 14, rot = -Math.atan2(p.ny, p.nx), E = tr.escala ?? 1;
  for (const s of [1, -1]) { // a faixa no pórtico de pista.js: a viga está a 62 × a escala de altura e tem 10 × a escala de espessura (a faixa ficava 37 u acima dela)
    const f = new THREE.Mesh(new THREE.PlaneGeometry(2 * L - 6, 8.4 * E), new THREE.MeshBasicMaterial({ map: marcaTex("britgp", 1024, 64), side: THREE.FrontSide }));
    f.position.set(p.x, p.h + 62 * E, p.y); f.rotation.y = rot + (s > 0 ? 0 : Math.PI); f.translateZ(s * 1.7); add(f);
  }
}

// as placas de DRS de pista.js (um sprite a 18 × a escala acima do ponto da pista, sem nada embaixo) ganham o poste até o chão; ele entra no mesmo grupo (tr.drsPlacas) e some e aparece junto
function postesDRS(tr) {
  if (!tr.drsPlacas) return;
  const { W, pts, n } = tr, E = tr.escala ?? 1, metal = M(0x697780), geo = new THREE.BoxGeometry(0.8, 1, 0.8);
  for (const [deteccao, abre] of tr.t.drs || []) for (const f of [deteccao, abre]) {
    const p = pts[Math.floor(f * n) % n], lado = W / 2 + 28, x = p.x + p.nx * lado, z = p.y + p.ny * lado, h = tr.chao(x, z), baixo = p.h + 18 * E - 6.5 * E; // a borda de baixo da placa
    const poste = new THREE.Mesh(geo, metal); poste.scale.y = baixo - h + 0.5 + 0.3; poste.position.set(x, h - 0.5 + poste.scale.y / 2, z); poste.castShadow = true; tr.drsPlacas.add(poste);
  }
}
