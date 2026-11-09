// Suzuka (Suzuka International Racing Course, Mie): o que só o circuito tem. O resto (zebras, escape, arquibancadas de curva,
// painéis, passarelas, serra e som) é do kit, na configuração de gps/suzuka.js. Aqui:
// 1. o viaduto do cruzamento em "8" (kit/suzuka/viaduto.js: o traçado e a altura são os de pistas.js);
// 2. o prédio dos boxes (kit/boxes.js) com a torre de controle (kit 2) no teto e, do outro lado da reta, a arquibancada principal
//    coberta (kit 2: tribunaCoberta) em três módulos, de concreto, com a torcida colorida;
// 3. a alameda de entrada, atrás da arquibancada: pórtico "SUZUKA CIRCUIT", cinco torii, fios de lanternas, estandartes (nobori),
//    tendas de hospitalidade e estacionamentos cheios de carros;
// 4. o parque do circuito no miolo da volta: a roda-gigante que gira (kit/suzuka/roda-gigante.js), o hotel, a torre de queda, o
//    carrossel e o pavilhão em velas;
// 5. os morros de floresta em volta, com cedros, folhosas e bordos (kit/suzuka/colinas.js), e as cerejeiras em flor pela beira.
// ESCALA REAL (passada visual, planos/escala-real.md; 1 u = 0,2083 m): a arquibancada principal é `tribunaReal` (kit/suzuka/tribuna.js: degrau de `tr.escala`, 0,5 × 0,75 m, gente de 1,7 m), os torii de 8 a 12 m, as lanternas e os estandartes de festa de verdade, os carros dos
// estacionamentos de 4,6 m, o hotel com andar de 3 m, a roda-gigante de 50 m de altura, o carrossel e a torre de queda menores, as árvores de 11 a 46 m; o chão sólido sob a pista (kit/suzuka/chao.js), o ambiente no chão (kit/suzuka/ambiente.js) e as peças grandes
// sobre lajes que nivelam o terreno (`terraco`). O viaduto do oito foi conferido de novo com o vão de 8,6 m (kit/suzuka/viaduto.js).
// O pórtico da largada é o de pista.js (as cinco luzes), que já atravessa a pista na linha de chegada; `depois` só pendura a faixa.
import * as THREE from "three";
import { M } from "./cena.js";
import { prediosDosBoxes } from "./kit/boxes.js";
import { faixa } from "./kit/arquibancadas.js";
import { marcaTex } from "./kit/marcas.js";
import { livre, ocupado, recortar, sorteio } from "./kit/comum.js";
import { tendaPaddock, velas } from "./kit/coberturas.js";
import { torreControle, portico } from "./kit/torres.js";
import { viaduto } from "./kit/suzuka/viaduto.js";
import { beiradaSolida, terraco } from "./kit/suzuka/chao.js";
import { ambienteSuzuka } from "./kit/suzuka/ambiente.js";
import { tribunaReal } from "./kit/suzuka/tribuna.js";
import { rodaGigante } from "./kit/suzuka/roda-gigante.js";
import { colinas, florestaJaponesa, cerejeiras } from "./kit/suzuka/colinas.js";
import { registrarMarcasSuzuka, torii, lanternas, nobori, estacionamento, hotel, torreDeQueda, carrossel } from "./kit/suzuka/japao.js";

registrarMarcasSuzuka();

const BOXES = { de: 0.972, ate: 1.052, lado: 1, recuo: 84, fundo: 50, alto: 42 };
const indice = (tr, f) => ((Math.floor(f * tr.n) % tr.n) + tr.n) % tr.n;
const virado = (dx, dz) => Math.atan2(dx, dz); // a rotação em y que põe o +z local apontando para (dx, dz)
// um ponto no mundo: da pista em f, `lat` para o lado (sinal de p.nx) e `ao` ao longo da pista
const em = (tr, f, lat, ao = 0) => { const p = tr.pts[indice(tr, f)]; return { p, x: p.x + p.nx * lat + p.tx * ao, z: p.y + p.ny * lat + p.ty * ao }; };
const reservarFaixa = (tr, f0, f1, lat, raio) => { for (let i = Math.floor(f0 * tr.n); i <= Math.floor(f1 * tr.n); i += 4) { const p = tr.pts[((i % tr.n) + tr.n) % tr.n]; tr.reservado.push([p.x + p.nx * lat, p.y + p.ny * lat, raio]); } };

// o módulo de arquibancada principal, de frente para a pista, apoiado no concreto (o chão desce para longe da pista). `tribunaReal`: o degrau é o do kit (6 × `tr.escala` de altura e 9 × `tr.escala` de fundo, 0,5 × 0,75 m), 20 fileiras (10 m de altura, 15 m de fundo; antes 11 degraus de 1,04 × 1,67 m, a gente com 0,86 m)
// e a frente a 46 u (9,6 m) da borda do asfalto, depois da barreira mapeada (40 u) que passa por ali
function arquibancadaPrincipal(tr, { add, hAt }, f, comprimento, semente) {
  const { pts, n, W } = tr, lado = -1, lat = lado * (W / 2 + 46), c = em(tr, f, lat), p = c.p, E = tr.escala ?? 1;
  const g = tribunaReal({
    escala: E, comprimento, degraus: 20, secoes: 6, publico: 0.2, semente, alcance: 0.82, folga: 26, vao: 55, embutido: 8, camisas: tr.camisasGP,
    cores: ["#d62a2a", "#f4f4f2", "#2b4fa8", "#f2c400", "#13804a", "#e873a8"], cobertura: "#f6f6f4", estrutura: "#8a9096",
  });
  const dx = -lado * p.nx, dz = -lado * p.ny, ry = virado(dx, dz), sx = Math.cos(ry) * p.tx - Math.sin(ry) * p.ty > 0 ? 1 : -1; // o +x do módulo anda a favor ou contra a volta?
  const meio = indice(tr, f), pasMeio = Math.round(comprimento / 12), h0 = pts[(meio - sx * pasMeio + n) % n].h, h1 = pts[(meio + sx * pasMeio) % n].h;
  g.rotation.order = "YXZ"; g.rotation.y = ry; g.rotation.z = Math.atan2(h1 - h0, comprimento);
  g.position.set(c.x, p.h, c.z); add(g);
  const prof = g.userData.profundidade, base = new THREE.Mesh(new THREE.BoxGeometry(comprimento + 6, 120, prof + 10), M(0xaaa69c, { roughness: 0.95 }));
  base.position.set(0, -58, -prof / 2); g.add(base); // o aterro de concreto: a arquibancada não flutua onde o chão baixa
  for (let k = -comprimento / 2; k <= comprimento / 2; k += 40) tr.reservado.push([c.x + p.tx * k * sx + p.nx * lado * prof * 0.5, c.z + p.ty * k * sx + p.ny * lado * prof * 0.5, prof * 0.9]);
  (tr.arquibancadas ||= []).push([meio - pasMeio, meio + pasMeio]);
  return g;
}

// a torre de controle em cima do prédio dos boxes e o aterro embaixo dele (a reta desce 45 de um lado ao outro)
function prediosEtorre(tr, { add }) {
  const { pts, n, W } = tr, { de, ate, lado, recuo, fundo, alto } = BOXES, l0 = lado * (W / 2 + recuo), l1 = l0 + lado * fundo;
  prediosDosBoxes(tr, add, {
    ...BOXES, torre: false, paineis: ["suzuka", "honda", "japangp", "pirelli", "rolex", "aramco", "dhl"],
    cores: { parede: "#f4f2ed", friso: "#c8102e", teto: 0xcfd2d6 },
  });
  const rec = recortar(tr, Math.floor(de * n), Math.floor(ate * n), [l0 - lado * 6, l1]); if (!rec) return;
  const concreto = M(0xa9a59b, { roughness: 0.95, side: THREE.DoubleSide });
  for (const l of [l0, l1]) faixa(tr, add, rec.i0, rec.i1, l, l, -90, 0, concreto, 60); // as paredes de baixo, até o chão de lá
  faixa(tr, add, rec.i0, rec.i1, l0, l1, -0.4, -0.4, concreto, 60);
  const meio = Math.floor((rec.i0 + rec.i1) / 2), pm = pts[meio % n];
  const torre = torreControle({ raio: 14, aneis: 3, alturaAnel: 14.4, corpo: 1, // (andar de 3 m = 14,4 u; antes 4 anéis e 2 andares de 7 u × 1,25 = 1,8 m)
     cobertura: "plana", corAneis: "#c8102e", corVidro: "#2a4560", corGrade: "#f2f2f2", corCorpo: "#f4f2ed", corCobertura: "#e8e8ea", bandeira: ["#ffffff", "#bc002d"], corPodio: "#d9d5cb" });
  torre.position.set(pm.x + pm.nx * (l0 + lado * fundo * 0.55), pm.h + alto, pm.y + pm.ny * (l0 + lado * fundo * 0.55)); torre.scale.set(1.25, 1, 1.25); add(torre); // (só na planta: o andar fica com 3 m)
  tr.reservado.push([torre.position.x, torre.position.z, 60]);
  return torre;
}

// a alameda de entrada: do pórtico até o fim, o eixo é a perpendicular à reta no meio da arquibancada, para fora
function alameda(tr, { add, hAt }) {
  const { n, W } = tr, f0 = 0.0, c0 = em(tr, f0, 0), p = c0.p, sx = -1; // sx: para fora da pista (-lado dos boxes)
  const eixo = (lat, ao = 0) => ({ x: p.x + p.nx * sx * lat + p.tx * ao, z: p.y + p.ny * sx * lat + p.ty * ao });
  const dir = virado(p.nx * sx, p.ny * sx), ang = Math.atan2(p.nx * sx, p.ny * sx);
  void n; void W; void dir;
  // o pórtico de entrada, atravessando a alameda (o letreiro olha para quem chega)
  const por = portico({ vao: 190, alto: 70, viga: 16, cor: "#c8102e", corColuna: "#2a2c31", texto: "SUZUKA CIRCUIT", corTexto: "#ffffff", corFaixa: "#c8102e" });
  let e = eixo(310); por.position.set(e.x, hAt(e.x, e.z) - 0.6, e.z); por.rotation.y = ang; add(por);
  tr.reservado.push([e.x, e.z, 150]);
  // os torii (k × 0,53: de 12 a 8 m de altura; antes k × 1,35, de 30 a 21 m), de 140 em 140: cada um menor que o anterior, para dar profundidade
  const lista = [[420, 1.2], [560, 1.05], [690, 0.95], [810, 0.85]];
  for (const [lat, k] of lista) { e = eixo(lat); const t = torii({ k: k * 0.53 }); t.position.set(e.x, hAt(e.x, e.z) - 0.6, e.z); t.rotation.y = ang; add(t); tr.reservado.push([e.x, e.z, 60]); }
  // lanternas: dois fios compridos, um de cada lado do caminho, e fios cruzando entre os torii
  const trechos = [];
  for (const s of [-1, 1]) { const a = eixo(360, s * 78), b = eixo(860, s * 78); trechos.push([a.x, a.z, b.x, b.z]); }
  for (const lat of [490, 625, 750]) { const a = eixo(lat, -78), b = eixo(lat, 78); trechos.push([a.x, a.z, b.x, b.z]); }
  lanternas(add, trechos, { alto: 28, passo: 9 }); // (fios a 5,8 m, uma lanterna de 0,6 m a cada 1,9 m; antes a 13 m, com lanternas de 2,4 m)
  for (const s of [-1, 1]) for (const lat of [360, 490, 625, 750, 860]) { /* poste de 6,9 m, do chão ao fio (antes 14 m) */ const q = eixo(lat, s * 78); const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.65, 33, 6), M(0x3b3128)); pole.position.set(q.x, hAt(q.x, q.z) + 15.5, q.z); add(pole); }
  // os estandartes, dos dois lados, de frente para o caminho
  const noboris = [];
  for (let lat = 380; lat <= 840; lat += 40) for (const s of [-1, 1]) { const q = eixo(lat, s * 105); noboris.push([q.x, q.z, virado(p.tx * s * -1, p.ty * s * -1)]); }
  nobori(add, noboris, { hAt: (x, z) => hAt(x, z) - 0.4 });
  // as tendas de hospitalidade, uma de cada lado, de frente para o caminho
  [[430, -1, "鈴鹿 HOSPITALITY", "#c8102e"], [430, 1, "HONDA RACING", "#1d1d21"], [620, -1, "PIRELLI PADDOCK", "#ffd100"], [620, 1, "ROLEX LOUNGE", "#006039"]].forEach(([lat, s, texto, cor], k) => {
    const q = eixo(lat, s * 200), t = tendaPaddock({ modulos: 3, filas: 2, texto, corFaixa: cor, corTexto: cor === "#ffd100" ? "#111" : "#fff", corMesas: cor }), ry = virado(-s * p.tx, -s * p.ty) + k * 0;
    t.position.set(q.x, terraco(tr, add, q.x, q.z, ry, t.userData.largura, t.userData.profundidade), q.z); t.rotation.y = ry; add(t); tr.reservado.push([q.x, q.z, 90]); // (a tenda de 21 × 14 m, beiral de 2,5 m, sobre uma laje: o terreno cai 14% para longe da pista)
  });
  tr.alamedaSuzuka = { eixo, ang };
  return eixo;
}

// o parque do circuito, no miolo da volta: o ponto de dentro mais longe da pista (perto do Casio) e tudo a partir dele
function acharParque(tr) {
  let melhor = null;
  // a bolsa aberta entre a Dunlop e a Degner (fora do polígono da volta, cercada pela pista de três lados): o ponto mais longe dela
  for (let x = 3300; x < 3900; x += 40) for (let z = 2900; z < 3500; z += 40) { const d = tr.distAt(x, z); if (!melhor || d > melhor.d) melhor = { x, z, d }; }
  return melhor;
}
function parqueDeDiversoes(tr, ctx) {
  const { add, hAt } = ctx, c = acharParque(tr); if (!c) return null;
  // cada atração pousa numa laje que nivela o chão sob ela (`terraco`, kit/suzuka/chao.js); `larg` × `prof` é a planta, a partir da origem da peça (o centro, e `dzc` o quanto o centro está para trás: o hotel e o pavilhão têm a origem na frente)
  const pos = (g, dx, dz, ry, larg, prof, dzc = 0) => {
    const x = c.x + dx, z = c.z + dz, cx = x + dzc * Math.sin(ry), cz = z + dzc * Math.cos(ry);
    g.position.set(x, terraco(tr, add, cx, cz, ry, larg, prof), z); g.rotation.y = ry; add(g); return [x, z];
  };
  // a roda-gigante: o disco de frente para o norte (o Casio e a reta de trás). Raio de 23,3 m: com o cubo, 49 m de altura (antes 36,5 m de raio e 81 m)
  const roda = rodaGigante({ raio: 112, cabines: 20 });
  const [rx, rz] = pos(roda.grupo, 0, 0, 0, 2.4 * 0.62 * 112, 0.34 * 112); tr.reservado.push([rx, rz, 150]);
  tr.rodaSuzuka = roda;
  // o hotel, atrás da roda, de frente para ela: 6 andares de 3 m (antes 4,6 m), 54 × 17 m
  const ht = hotel({ largura: 260, andares: 6, alturaAndar: 14.4, profundidade: 80 });
  const [hx, hz] = pos(ht, 40, 240, Math.PI, 260, 110, -25); tr.reservado.push([hx, hz, 170]);
  // a torre de queda (47 m, antes 62 m) e o carrossel (raio de 5,3 m, antes 11,7 m)
  const [dx, dz] = pos(torreDeQueda({ alto: 190 }), -250, 40, 0, 40, 40); tr.reservado.push([dx, dz, 45]);
  const [cx, cz] = pos(carrossel({ raio: 56 }), 250, 60, 0.6, 52, 52); tr.reservado.push([cx, cz, 55]);
  // o pavilhão em velas na entrada do parque (do lado da pista), com o letreiro pendurado em dois postes
  const pav = velas({ modulos: 4, filas: 2, vao: 44, profundidade: 44, alturaBeiral: 13, alturaPico: 16, mastro: 10, cor: "#f4f2ec" });
  const [vx, vz] = pos(pav, -20, -190, 0, 176, 88); tr.reservado.push([vx, vz, 120]);
  const yv = pav.position.y, faixaParque = new THREE.Mesh(new THREE.PlaneGeometry(150, 16), new THREE.MeshBasicMaterial({ map: marcaTex("parque", 1024, 112), side: THREE.DoubleSide }));
  faixaParque.position.set(vx, yv + 21, vz + 45); add(faixaParque);
  for (const s of [-1, 1]) { const post = new THREE.Mesh(new THREE.BoxGeometry(1.4, 21 + 8, 1.4), M(0x9aa0a8)); post.position.set(vx + s * 74, yv + 29 / 2 - 0.5, vz + 45); add(post); } // o letreiro (31 × 3,3 m, a 4,4 m do chão) apoiado em dois postes
  // lanternas entre as atrações (a 5 m)
  lanternas(add, [[c.x - 250, c.z + 20, c.x - 20, c.z - 170], [c.x + 250, c.z + 40, c.x + 20, c.z - 170], [c.x - 140, c.z + 110, c.x + 140, c.z + 110]], { alto: 24, passo: 9 });
  tr.parqueSuzuka = { x: c.x, z: c.z, d: c.d };
  return c;
}

// os estacionamentos: nos terrenos planos atrás da arquibancada, dos dois lados da alameda
function estacionamentos(tr, { add, hAt }, eixo) {
  const feitos = [];
  [[560, -560, 0], [560, 520, 1], [900, -330, 2], [900, 360, 3], [1150, 0, 4]].forEach(([lat, ao, k]) => {
    const e = eixo(lat, ao), y = hAt(e.x, e.z);
    if (Math.abs(y) > 8 || !livre(tr, e.x, e.z, 260) || ocupado(tr, e.x, e.z)) return;
    const p = tr.pts[0], ry = virado(p.tx, p.ty) + (k % 2 ? 0 : 0);
    const r = estacionamento(add, { x: e.x, y, z: e.z, ry }, { filas: 4, vagas: 16, semente: 41 + k * 7 });
    tr.reservado.push([e.x, e.z, Math.hypot(r.largura, r.profundidade) / 2]); feitos.push(r.carros);
  });
  tr.estacionamentosSuzuka = feitos;
}

// cerejeiras pela beira da pista (nos pontos onde o jogo deixa) e em volta do parque e da alameda
function floresDeCerejeira(tr, { hAt }, add, eixo, parque) {
  const r = sorteio(88), lugares = [];
  for (let f = 0; f < 1; f += 0.0065) for (const s of [-1, 1]) if (r() < 0.55) { const lat = s * (tr.W / 2 + 150 + r() * 200), c = em(tr, f, lat, (r() - 0.5) * 40); lugares.push([c.x, c.z, 0.85 + r() * 0.5]); }
  if (eixo) for (let lat = 380; lat <= 860; lat += 55) for (const s of [-1, 1]) lugares.push([eixo(lat, s * 150).x, eixo(lat, s * 150).z, 1 + r() * 0.3]);
  if (parque) for (let k = 0; k < 22; k++) { const a = (k / 22) * Math.PI * 2 + r() * 0.2, d = 320 + r() * 40; lugares.push([parque.x + Math.cos(a) * d, parque.z + Math.sin(a) * d, 1 + r() * 0.4]); }
  return cerejeiras(tr, add, lugares, { hAt });
}

// o antes: tudo isso, antes dos enfeites soltos
export function cenarioSuzuka(tr, ctx, ambiente) {
  const { add } = ctx;
  tr.reservado ||= [];
  viaduto(tr, ctx);
  const se = tr.t.superficieEscape || {};
  beiradaSolida(tr, add, { brita: se.brita || [], listrado: se.listrado || [] }); // a base sólida da pista e a grama no nível do asfalto, dos dois lados (kit/suzuka/chao.js; depois do viaduto: o cruzamento em oito é tratado à parte)
  ambienteSuzuka(tr, add, ambiente); // painéis na barreira, mastros e placas de frenagem no chão, postos dos fiscais (kit/suzuka/ambiente.js)
  prediosEtorre(tr, ctx);
  for (const [f, comp, sem] of [[0.9835, 330, 5], [1.0085, 330, 9], [1.0335, 330, 13]]) arquibancadaPrincipal(tr, ctx, f % 1, comp, sem);
  const eixo = alameda(tr, ctx);
  estacionamentos(tr, ctx, eixo);
  const parque = parqueDeDiversoes(tr, ctx);
  floresDeCerejeira(tr, ctx, add, eixo, parque);
  // os morros e a floresta, por último (depois de tudo reservado): não avançam sobre o parque nem sobre os estacionamentos
  const p0 = tr.pts[0], vazio = [[p0.x - p0.nx * 800, p0.y - p0.ny * 800, 800]];
  if (parque) vazio.push([parque.x, parque.z, 560]);
  const rel = colinas(tr, add, { vazio });
  florestaJaponesa(tr, add, rel, {});
}

// o depois: a roda gira junto com o resto da vida da pista, as placas de DRS ganham o poste e a faixa do circuito vai no pórtico da largada
export function depoisSuzuka(tr, { add }) {
  const roda = tr.rodaSuzuka, anterior = tr.animarPista;
  if (roda) tr.animarPista = (dt, foco, t) => { anterior?.(dt, foco, t); roda.animar(dt, foco); };
  postesDRS(tr);
  const p = tr.pts[0], L = tr.W / 2 + 14, rot = -Math.atan2(p.ny, p.nx), E = tr.escala ?? 1;
  for (const s of [1, -1]) { // a faixa no pórtico de pista.js: a viga está a 62 × a escala de altura e tem 10 × a escala de espessura (antes a faixa ficava a 62 u de altura, 37 u acima da viga)
    const f = new THREE.Mesh(new THREE.PlaneGeometry(2 * L - 6, 8.4 * E), new THREE.MeshBasicMaterial({ map: marcaTex("suzuka", 1024, 64), side: THREE.FrontSide }));
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
