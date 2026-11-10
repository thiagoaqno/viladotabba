// Miami (Miami International Autodrome, GP de Miami, em volta do Hard Rock Stadium): o que só o circuito tem, em cima do kit. O resto (zebras, escape,
// arquibancadas temporárias aqua e rosa, painéis, passarelas e som) é do kit, na configuração de gps/miami.js; as peças exclusivas estão em kit/miami/.
// Aqui, na ordem em que aparecem (frações da volta, a partir da linha de chegada, que fica no meio da reta dos boxes, no alto do mapa):
// 1. o estádio no miolo leste do circuito (a cobertura branca, os quatro mastros e os cabos), com a praça e os estacionamentos de carros em volta;
// 2. a reta dos boxes (0,95-1,04): o prédio temporário de dois andares com a torre de controle na linha de chegada, e o paddock atrás
//    (tendas brancas, motorhomes e carretas das equipes);
// 3. no miolo, ao norte do estádio: a marina falsa (iates sobre o chão pintado de água) e o Beach Club com a piscina;
// 4. os viadutos da rodovia: um por cima da chicane estreita das curvas 14 e 15 e da outra perna do grampo oeste (cruza a pista duas vezes), outro ao norte da reta dos boxes;
// 5. palmeiras em toda a volta, a cidade pastel ao longe, a faixa do circuito no pórtico da largada e os carros que andam nos viadutos.
// Tudo no tamanho real (1 m = 12 × tr.escala = 4,8 u; planos/escala-real.md) e no chão que se vê (kit/miami/chao.js: a base sólida sob a pista, a grama no nível do asfalto).
// As posições foram refeitas para a pista de hoje (a de 5 412 m): as de antes eram as da pista pequena.
// Tudo é cenário: nada fica dentro da pista (livre/ocupado) e a física é a de sempre. Sem marcas registradas novas: os painéis são nomes de lugar
// e de comida da Flórida (kit/miami/marcas.js) e as marcas que o kit já tem.
import * as THREE from "three";
import { canvasTex, M } from "./cena.js";
import { marcaTex } from "./kit/marcas.js";
import { livre, ocupado, recortar, sorteio, instancias } from "./kit/comum.js";
import { tendaPaddock } from "./kit/coberturas.js";
import { registrarMarcasMiami } from "./kit/miami/marcas.js";
import { pousar, reservar, reservarRet, acharRet, acharElipse, alturaDoChao, UM } from "./kit/miami/lugar.js";
import { beiradaSolida, nivelDoChao } from "./kit/miami/chao.js";
import { ambienteMiami, postesDRS } from "./kit/miami/ambiente.js";
import { estadio, estacionamento, medidasEstadio } from "./kit/miami/estadio.js";
import { marina } from "./kit/miami/marina.js";
import { beachClub } from "./kit/miami/praia.js";
import { viaduto } from "./kit/miami/viaduto.js";
import { predioDosBoxes, motorhome, carreta, EQUIPES } from "./kit/miami/paddock.js";
import { coletor } from "./kit/miami/palmas.js";

registrarMarcasMiami();

// ---------------------------------------------------------------------------------------------------------------------
// 1. O estádio e os estacionamentos
// ---------------------------------------------------------------------------------------------------------------------
function oEstadio(tr, { add }) {
  const { A, B, praca } = medidasEstadio(tr), PA = A + praca, PB = B + praca;
  // o miolo leste do circuito (a grande alça entre a reta dos boxes e a reta de trás): o centro onde a praça (a elipse maior) cabe com a maior folga
  const lugar = acharElipse(tr, [5100, 7200, 3900, 5300], PA, PB, { max: 130, min: 20, passo: 40 });
  if (!lugar) { tr.faltouMiami = (tr.faltouMiami || []).concat([{ nome: "estadio" }]); return null; }
  const { x, z } = lugar, { lo, hi } = alturaDoChao(tr, x, z, 0, PA * 0.7, PB * 0.7);
  const e = estadio({ escala: tr.escala ?? 0.4, baseY: hi - lo + 10 });
  e.position.set(x, hi - 1, z); add(e);
  // reserva a praça inteira (as palmeiras e a torcida solta não entram) e deixa o estádio dentro de tr.ocupado
  for (let u = -PA; u <= PA; u += 60) for (let v = -PB; v <= PB; v += 60) if ((u / PA) ** 2 + (v / PB) ** 2 <= 1.15) tr.reservado.push([x + u, z + v, 62]);
  tr.estadioMiami = { x, z, A, B, PA, PB, folga: lugar.folga };
  // os estacionamentos: tiras em volta da praça (onde couber) e carros parados (meias medidas em unidades: 69 × 19 m e 50 × 19 m)
  const lotes = [[0, -(PB + 100), 0, 330, 90], [0, PB + 100, 0, 330, 90], [-(PA + 100), 0, Math.PI / 2, 240, 90], [PA + 100, 0, Math.PI / 2, 240, 90], [-(PA * 0.7), -(PB + 260), 0, 300, 80], [PA * 0.7, PB + 260, 0, 300, 80]];
  let n = 0, carros = 0;
  for (const [u, v, rot, a, b] of lotes) {
    const q = acharRet(tr, x + u, z + v, rot, a + 10, b + 10, { folga: 30, raio: 160, passo: 40 });
    if (!q) continue;
    carros += estacionamento(tr, add, { x: q.x, z: q.z, rot, a, b, semente: 40 + n }).carros; reservarRet(tr, q.x, q.z, rot, a, b, 14); n++;
  }
  tr.estacionamentosMiami = { lotes: n, carros };
  return { x, z, PA, PB };
}

// ---------------------------------------------------------------------------------------------------------------------
// 2. A reta dos boxes e o paddock
// ---------------------------------------------------------------------------------------------------------------------
function retaDosBoxes(tr, { add }) {
  const { n, W } = tr, lado = tr.t.boxes?.lado ?? -1, Z = W / 2 + 84, F = 84; // o prédio tem 17,5 m de fundo
  const rec = recortar(tr, Math.floor(0.945 * n), Math.floor(1.05 * n), [lado * (Z - 4), lado * (Z + F + 4)], 4);
  if (!rec) return { lado, Z, F };
  const comp = Math.min(940, (rec.i1 - rec.i0) * 6 - 24), meio = Math.floor((rec.i0 + rec.i1) / 2); // 196 m: a fila das garagens do kit tem uns 195 m
  const linha = (n - meio) * 6 * (lado > 0 ? -1 : 1); // onde a linha de chegada cai no prédio (o +x local anda a favor da volta do lado -1)
  const predio = predioDosBoxes({ comprimento: comp, fundo: F, torre: Math.max(-comp / 2 + 90, Math.min(comp / 2 - 90, linha)), paineis: ["mimiami", "migp", "mimiami", "migp"] });
  const q = pousar(tr, predio, (((meio % n) + n) % n) / n, lado, Z); add(predio);
  // a laje do fundo desce até o chão (o prédio fica no nível da pista; o terreno cai para longe dela)
  const ch = Math.max(0, tr.pts[((meio % n) + n) % n].h - nivelDoChao(tr, q.x, q.z)) + 6;
  const aterro = new THREE.Mesh(new THREE.BoxGeometry(comp, ch + 8, F), M(0xcfcac0, { roughness: 1 })); aterro.position.set(0, -(ch + 8) / 2 + 1, -F / 2); predio.add(aterro);
  reservar(tr, q.x, q.z, q.ry, comp, F + 30, 40);
  tr.predioMiami = { f: (((meio % n) + n) % n) / n, comprimento: comp, lado, torreX: linha, x: q.x, z: q.z, ry: q.ry, fundo: F };
  return { lado, Z, F, comp };
}

// o paddock atrás dos boxes: o retângulo livre mais perto da parte de trás do prédio recebe as tendas brancas (a fila de cima), os motorhomes e as
// carretas das equipes, todos de frente para a pista
function paddock(tr, { add }) {
  const pr = tr.predioMiami, achados = { tendas: 0, motorhomes: 0, carretas: 0 };
  if (!pr) return;
  const a = 420, b = 130, atras = [-Math.sin(pr.ry), -Math.cos(pr.ry)]; // a direção "para trás" do prédio (a frente dele é (sen ry, cos ry))
  const d = pr.fundo + 60 + b;
  const lugar = acharRet(tr, pr.x + atras[0] * d, pr.z + atras[1] * d, 0, a, b, { folga: 30, raio: 300, passo: 20 });
  if (!lugar) return;
  const cr = Math.cos(pr.ry), sr = Math.sin(pr.ry), mundo = (lx, lz) => [lugar.x + lx * cr + lz * sr, lugar.z - lx * sr + lz * cr];
  const poe = (g, lx, lz) => { const [x, z] = mundo(lx, lz); g.position.set(x, nivelDoChao(tr, x, z) - 0.6, z); g.rotation.y = pr.ry; add(g); };
  [["PADDOCK", "#0aa3ad"], ["MIAMI", "#ff5fa2"], ["HOSPITALITY", "#0aa3ad"]].forEach(([texto, corFaixa], k) => {
    const t = tendaPaddock({ modulos: 3, filas: 2, texto, corFaixa, corMesas: "#ff5fa2" }); poe(t, -280 + k * 280, 110); achados.tendas++;
  });
  for (let k = 0; k < 4; k++) { poe(motorhome({ cor: EQUIPES[(k * 2) % EQUIPES.length], faixa: k % 2 ? "#ff5fa2" : "#0aa3ad" }), -330 + k * 220, 10); achados.motorhomes++; }
  for (let k = 0; k < 6; k++) { poe(carreta({ cor: EQUIPES[(k * 3 + 1) % EQUIPES.length] }), -360 + k * 130, -60); achados.carretas++; }
  reservarRet(tr, lugar.x, lugar.z, 0, a, b, 16);
  tr.paddockMiami = { ...achados, x: Math.round(lugar.x), z: Math.round(lugar.z) };
}

// ---------------------------------------------------------------------------------------------------------------------
// 3. A marina e o Beach Club (o miolo, ao norte do estádio, junto da reta dos boxes)
// ---------------------------------------------------------------------------------------------------------------------
function marinaEClube(tr, { add }, palmas) {
  const alvo = acharRet(tr, 5950, 3720, 0, 330, 205, { folga: 44, raio: 700, passo: 40 });
  let m = null;
  if (alvo) m = marina(tr, add, { x: alvo.x, z: alvo.z, rot: 0, a: 300, b: 190 });
  const base = alvo ? [alvo.x + 520, alvo.z] : [6800, 3720];
  const clube = acharRet(tr, base[0], base[1], 0, 160, 105, { folga: 44, raio: 700, passo: 40 });
  if (clube) beachClub(tr, add, { x: clube.x, z: clube.z, rot: 0, a: 150, b: 100, palmas });
  tr.marinaClubeMiami = { marina: alvo ? { x: alvo.x, z: alvo.z, barcos: m.barcos } : null, clube: clube || null };
  if (alvo) for (const [u, v] of [[-330, -215], [330, -215], [-330, 215], [330, 215], [0, -218], [0, 218]]) { const px = alvo.x + u, pz = alvo.z + v; palmas.poe(px, pz, nivelDoChao(tr, px, pz) - 0.6, 0.9 + (u + v) % 3 * 0.1, u); }
}

// ---------------------------------------------------------------------------------------------------------------------
// 4. Os viadutos
// ---------------------------------------------------------------------------------------------------------------------
function viadutos(tr, { add }) {
  // o da rodovia que cruza a chicane estreita (curvas 14 e 15, por onde a pista segue para oeste) e, 620 u (130 m) mais ao sul, a outra perna do grampo oeste:
  // a mesma linha cruza a pista duas vezes, e as pontas (700 u de rampa) já estão no chão antes de chegar a uma delas
  const v1 = viaduto(tr, add, { caminho: [[2000, 3550], [2090, 4150], [2160, 4800], [2220, 5400], [2260, 6000], [2330, 6600]], alto: 60, largura: 100, rampa: 700, carros: 16, semente: 5, nome: "viaduto-da-chicane", placa: { perto: [2170, 4900], texto1: "MIAMI GARDENS", texto2: "EVERGLADES  ·  SUNSHINE STATE" } });
  // o que corre ao norte da reta dos boxes, do outro lado da arquibancada principal (400 u = 83 m da pista)
  const v2 = viaduto(tr, add, { caminho: [[900, 2700], [2500, 2620], [4500, 2590], [6500, 2620], [8300, 2720]], alto: 60, largura: 104, rampa: 700, carros: 24, semente: 9, nome: "viaduto-da-reta" });
  tr.animarViadutosMiami = [v1.animar, v2.animar];
}

// ---------------------------------------------------------------------------------------------------------------------
// 5. A cidade pastel ao longe
// ---------------------------------------------------------------------------------------------------------------------
function cidadeAoLonge(tr, add) {
  const r = sorteio(777), C = tr.t.world / 2, ANDAR = 3 * UM(tr); // andar de 3 m
  // a textura tem 4 andares (4 × 4 janelas) e repete em cada prédio: cada classe de altura tem a sua geometria, com o UV na conta dos andares
  const tex = canvasTex(64, 64, (x, w, h, q) => {
    x.fillStyle = "#ffffff"; x.fillRect(0, 0, w, h);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { x.fillStyle = q() < 0.2 ? "#ffe9a8" : "#4a647d"; x.fillRect(i * 16 + 3, j * 16 + 4, 10, 8); }
  });
  const andares = [4, 7, 12, 20, 30], porClasse = andares.map(() => []);
  const pastel = ["#ffb3c7", "#9fe3e0", "#fff0b8", "#ffffff", "#ffc9a3", "#b9d9f2", "#f6a7d0"];
  for (let q = 0; q < 110; q++) {
    const a = r() * Math.PI * 2, d = 2350 + r() * 1100, x = C + Math.cos(a) * d * 1.05, z = C + Math.sin(a) * d * 1.05, c = Math.min(4, Math.floor(r() ** 1.6 * 5)), w = 10 * UM(tr) * (1 + r() * 2.2);
    if (tr.distAprox(x, z) < 650) continue;
    porClasse[c].push({ x, y: (andares[c] * ANDAR) / 2 - 2, z, sx: w, sy: 1, sz: w * (0.7 + r() * 0.6), r: r() * 3, cor: pastel[(r() * pastel.length) | 0] });
  }
  let total = 0;
  andares.forEach((nA, c) => {
    const lista = porClasse[c]; if (!lista.length) return;
    const geo = new THREE.BoxGeometry(1, nA * ANDAR, 1), uv = geo.attributes.uv;
    for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * 2, uv.getY(k) * (nA / 4)); // 8 janelas de largura e 4 por tile de altura
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 });
    const m = instancias(add, geo, mat, lista, { sombra: false, nome: "miami-cidade-longe" });
    if (m) { const col = new THREE.Color(); lista.forEach((o, k) => m.setColorAt(k, col.set(o.cor))); m.instanceColor.needsUpdate = true; }
    total += lista.length;
  });
  tr.cidadeMiami = total;
}

// ---------------------------------------------------------------------------------------------------------------------
// O antes (cenario) e o depois (depois) do GP
// ---------------------------------------------------------------------------------------------------------------------
export function cenarioMiami(tr, ctx, ambiente) {
  tr.reservado ||= [];
  beiradaSolida(tr, ctx.add); // a base sólida da pista e a grama no nível do asfalto, dos dois lados (kit/miami/chao.js)
  const palmas = (tr.palmasMiami = coletor());
  retaDosBoxes(tr, ctx);
  paddock(tr, ctx);
  marinaEClube(tr, ctx, palmas);
  oEstadio(tr, ctx);
  viadutos(tr, ctx);
  ambienteMiami(tr, ctx.add, ambiente); // as bandeiras, as placas, os postos e a cerca de detritos, no chão e atrás da barreira (kit/miami/ambiente.js)
}

export function depoisMiami(tr, ctx) {
  const { add } = ctx, palmas = tr.palmasMiami, r = sorteio(4242), { n, W } = tr;
  // as palmeiras: pela volta toda, dos dois lados, em manchas; e uma fileira em volta da praça do estádio
  for (let i = 0; i < n; i += 11) {
    const p = tr.pts[i];
    for (const lado of [-1, 1]) {
      if (r() < 0.38) continue;
      const lat = W / 2 + 70 + r() * 70, x = p.x + p.nx * lado * lat + (r() - 0.5) * 30, z = p.y + p.ny * lado * lat + (r() - 0.5) * 30;
      if (!livre(tr, x, z, 46) || ocupado(tr, x, z)) continue;
      palmas.poe(x, z, nivelDoChao(tr, x, z) - 0.6, 0.85 + r() * 0.35, r() * 6.28);
    }
  }
  const e = tr.estadioMiami;
  if (e) for (let k = 0; k < 64; k++) { const t = (k / 64) * Math.PI * 2, x = e.x + Math.cos(t) * (e.PA + 24), z = e.z + Math.sin(t) * (e.PB + 24); if (livre(tr, x, z, 30)) palmas.poe(x, z, nivelDoChao(tr, x, z) - 0.6, 0.95 + r() * 0.25, r() * 6.28); }
  tr.palmasMiamiN = palmas.lista.length; palmas.construir(add);
  cidadeAoLonge(tr, add);
  postesDRS(tr); // as placas de DRS de pista.js ganham poste até o chão
  // a faixa do circuito no pórtico da largada (o de pista.js): uma de cada lado da viga, a da frente com a normal contra o sentido da volta
  // (a viga do pórtico de pista.js está a 62 × a escala e tem 10 × a escala de altura: a faixa de 8,4 × a escala vai nela)
  const p = tr.pts[0], L = W / 2 + 14, rot = -Math.atan2(p.ny, p.nx), E = tr.escala ?? 1;
  for (const s of [1, -1]) {
    const f = new THREE.Mesh(new THREE.PlaneGeometry(2 * L - 6, 8.4 * E), new THREE.MeshBasicMaterial({ map: marcaTex("migp", 1024, 64), side: THREE.FrontSide }));
    f.position.set(p.x, p.h + 62 * E, p.y); f.rotation.y = rot + (s > 0 ? 0 : Math.PI); f.translateZ(1.7); add(f);
  }
  // os carros dos viadutos andam no laço de animação que vidaGP definiu
  const anterior = tr.animarPista, anims = tr.animarViadutosMiami || [];
  tr.animarPista = (dt, foco, t) => { anterior?.(dt, foco, t); for (const a of anims) a(dt); };
}
