// Kit de pista — o corredor dos boxes (regras de F1): a faixa de asfalto ao lado da reta, com a linha branca da entrada e a
// vermelha da saída, a mureta entre ela e a pista, o quadrado pintado onde cada carro para e as 11 garagens, uma por equipe,
// com a cor e o logo dela na fachada e no fundo. O traçado do corredor vem de `boxes` em ../pistas.js (frações da volta) e da conta de
// `F1Regras.corredor` (f1-regras.js), a mesma que o carro e os robôs usam para andar nele. Só pintura e cenário: quem
// segura o carro no corredor é box.js. Aparece só quando a sala usa as regras de F1 (`tr.mostrarBoxes`).
//
// cfg (tudo opcional):
//   asfalto: "#46484d"  — a cor do asfalto do corredor
//   cores: ["#e8002d", …] — a cor de cada garagem (11, uma por equipe); sem isso elas ficam cinzas até o jogo pintar (grp.userData.colorir)
//   mureta: true | false — a mureta entre a pista e o corredor (padrão: sim, menos onde a pista já tem muro de rua)
//   garagens: false — só o corredor e os quadrados pintados, sem as garagens (Mônaco)
import * as THREE from "three";
import { canvasTex } from "../cena.js";
import { lotes } from "./comum.js";
import { MARCAS, PATROCINIO } from "./marcas.js";

// uma garagem por equipe, na ordem de F1Regras.EQUIPES_GARAGEM (é por ela que cada carro acha a sua): [id, nome, cor]
const EQUIPES = [
  ["mclaren", "McLaren", "#ff8700"], ["ferrari", "Ferrari", "#e8002d"], ["mercedes", "Mercedes", "#27f4d2"], ["red-bull", "Red Bull", "#3671c6"],
  ["racing-bulls", "Racing Bulls", "#6692ff"], ["aston-martin", "Aston Martin", "#229971"], ["williams", "Williams", "#37bedd"],
  ["audi", "Audi", "#d7172f"], ["alpine", "Alpine", "#ff87bc"], ["haas", "Haas", "#c6cbd0"], ["cadillac", "Cadillac", "#c9a227"],
];
const equipeDa = (k) => EQUIPES[k % EQUIPES.length];
// o logo da equipe (o mesmo do resto do jogo, /api/corrida/logo/:id) desenhado num canvas: a fachada e o painel do fundo da garagem.
// O desenho sai na hora com o nome e é refeito quando a imagem chega (no Node dos testes não há Image, e fica só o nome).
// o patrocinador em branco sobre a faixa vermelha da marquise (uma textura por marca, guardada)
const FAIXAS = new Map();
function texFaixa(nome, fundo) {
  const chave = nome + fundo; if (FAIXAS.has(chave)) return FAIXAS.get(chave);
  const m = MARCAS[nome] || { texto: String(nome).toUpperCase(), fonte: "900 {s}px Arial, sans-serif" };
  const t = canvasTex(1024, 128, (x, w, hh) => {
    x.fillStyle = fundo; x.fillRect(0, 0, w, hh);
    x.fillStyle = "#ffffff"; x.textAlign = "center"; x.textBaseline = "middle"; let s = 86; x.font = m.fonte.replace("{s}", s);
    while (s > 30 && x.measureText(m.texto).width > w * 0.7) { s -= 4; x.font = m.fonte.replace("{s}", s); }
    x.fillText(m.texto, w / 2, hh / 2 + 4);
  }, false);
  FAIXAS.set(chave, t); return t;
}
function placaDaEquipe(id, nome, cor, w, h, comNome) {
  const pintar = (ctx, img) => {
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, w, 0); g.addColorStop(0, cor); g.addColorStop(1, "#111418"); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#ffffff22"; ctx.fillRect(0, 0, w, h * 0.08); ctx.fillStyle = "#00000040"; ctx.fillRect(0, h * 0.92, w, h * 0.08);
    const lado = h * 0.78, x0 = comNome ? h * 0.12 : (w - lado * 1.6) / 2;
    if (img) {
      const r = Math.min((lado * (comNome ? 1.4 : 1.6)) / img.width, lado / img.height), iw = img.width * r, ih = img.height * r;
      ctx.shadowColor = "#0008"; ctx.shadowBlur = h * 0.06; ctx.drawImage(img, x0 + ((comNome ? lado * 1.4 : lado * 1.6) - iw) / 2, (h - ih) / 2, iw, ih); ctx.shadowBlur = 0;
    }
    if (comNome || !img) {
      ctx.fillStyle = "#ffffff"; ctx.font = `900 ${Math.round(h * 0.42)}px Arial, sans-serif`; ctx.textBaseline = "middle";
      ctx.textAlign = comNome ? "left" : "center"; ctx.fillText(nome.toUpperCase(), comNome ? x0 + lado * 1.4 + h * 0.15 : w / 2, h / 2, comNome ? w - (x0 + lado * 1.4 + h * 0.3) : w - 20);
    }
  };
  let ctx2 = null;
  const tex = canvasTex(w, h, (ctx) => { ctx2 = ctx; pintar(ctx, null); }, false);
  if (typeof Image !== "undefined" && ctx2) {
    const img = new Image(); img.decoding = "async";
    img.onload = () => { pintar(ctx2, img); tex.needsUpdate = true; };
    img.src = `/api/corrida/logo/${encodeURIComponent(id)}`;
  }
  return tex;
}

export function boxesGP(tr, add, cfg = {}) {
  const F = window.F1Regras, cor = F.corredor(tr.t, tr.n, tr.W); if (!cor) return;
  const { pts, n, W } = tr, lado = cor.lado, meia = cor.larguraCorredor / 2, grp = new THREE.Group(), L = lotes();
  grp.name = `${tr.id}-boxes`; grp.visible = !!tr.mostrarBoxes; tr.boxesGP = grp; add(grp);
  const latDe = (u) => cor.lat(u, lado * (W / 2 - 10)) + cor.centroAsfalto - cor.D, cores = cfg.cores;
  // o ponto da pista no ponto u (inteiro ou não) do corredor, com o lado `l`
  const em = (u, l) => {
    const i = cor.i0 + Math.floor(u), f = u - Math.floor(u), a = pts[i % n], b = pts[(i + 1) % n];
    const x = a.x + (b.x - a.x) * f + (a.nx + (b.nx - a.nx) * f) * l, y = a.y + (b.y - a.y) * f + (a.ny + (b.ny - a.ny) * f) * l;
    // a altura: a da pista naquele ponto (a reta dos boxes fica no nível do asfalto), ou o chão se ele for mais alto. Antes era só o
    // chão, e o terreno ficava por cima do corredor (a grama aparecia no lugar do asfalto)
    const hp = a.h != null && b.h != null ? a.h + (b.h - a.h) * f : -Infinity;
    return { x, y, h: Math.max(tr.chao(x, y), hp) };
  };
  // uma fita de u0 a u1: de `la(u)` a `lb(u)`, na altura do chão + ya e + yb (iguais: fita deitada; lados iguais: parede)
  const fita = (mat, u0, u1, la, lb, ya, yb, vRep = 60) => {
    const l = L.de(mat), base = l.vs.length / 3, passos = Math.max(1, Math.ceil(u1 - u0));
    for (let k = 0; k <= passos; k++) {
      const u = u0 + ((u1 - u0) * k) / passos, a = em(u, la(u)), b = em(u, lb(u)), v = (u * 6) / vRep;
      l.vs.push(a.x, a.h + ya, a.y, b.x, b.h + yb, b.y); l.uv.push(0, v, 1, v);
      if (k < passos) { const q = base + k * 2; l.idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); }
    }
  };
  const desloc = (f) => (u) => latDe(u) + f;
  // materiais: asfalto escuro, a linha branca, a vermelha e o concreto da mureta (na frente do asfalto da pista, sem brigar)
  const poly = (o) => new THREE.MeshStandardMaterial({ roughness: 0.92, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, ...o });
  // o asfalto da faixa de passagem: um ladrilho grande (cobre a largura da faixa e 60 u de comprimento) com o agregado fino e as pedrinhas,
  // as duas trilhas de borracha onde passam as rodas, remendos selados e manchas de óleo (antes era um ruído de 64 px, borrado de perto)
  const asfalto = poly({ roughness: 0.86, map: canvasTex(512, 1024, (x, w, hh, rr) => {
    x.fillStyle = cfg.asfalto || "#3f4146"; x.fillRect(0, 0, w, hh);
    for (let i = 0; i < 26000; i++) { const c = rr(); x.fillStyle = c < 0.45 ? "#00000022" : c < 0.85 ? "#ffffff14" : "#ffffff30"; x.fillRect(rr() * w, rr() * hh, 1 + (rr() < 0.15), 1 + (rr() < 0.15)); }
    for (let i = 0; i < 900; i++) { x.fillStyle = rr() < 0.5 ? "#8a8c90" : "#26282c"; x.globalAlpha = 0.35 + rr() * 0.3; x.fillRect(rr() * w, rr() * hh, 2 + rr() * 2, 2 + rr() * 2); }
    x.globalAlpha = 1;
    for (const c of [0.32, 0.68]) { const g = x.createLinearGradient(w * (c - 0.09), 0, w * (c + 0.09), 0); g.addColorStop(0, "#00000000"); g.addColorStop(0.5, "#0000002e"); g.addColorStop(1, "#00000000"); x.fillStyle = g; x.fillRect(w * (c - 0.09), 0, w * 0.18, hh); }
    x.strokeStyle = "#1c1d20"; x.globalAlpha = 0.55; x.lineWidth = 3;
    for (let k = 0; k < 3; k++) { let px = rr() * w, py = rr() * hh; x.beginPath(); x.moveTo(px, py); for (let j = 0; j < 8; j++) { px += (rr() - 0.5) * 60; py += 20 + rr() * 40; x.lineTo(px, py); } x.stroke(); }
    for (let k = 0; k < 5; k++) { const g = x.createRadialGradient(0, 0, 0, 0, 0, 30); g.addColorStop(0, "#0000004a"); g.addColorStop(1, "#00000000"); x.save(); x.translate(rr() * w, rr() * hh); x.scale(1, 1.6 + rr()); x.fillStyle = g; x.beginPath(); x.arc(0, 0, 30, 0, 7); x.fill(); x.restore(); }
    x.globalAlpha = 1;
  }) });
  const branco = poly({ color: 0xf1f1ec, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }), vermelho = poly({ color: 0xd8232a, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  const concreto = poly({ map: canvasTex(32, 32, (x, w, hh, rr) => { x.fillStyle = "#b9b6ad"; x.fillRect(0, 0, w, hh); for (let i = 0; i < 160; i++) { x.fillStyle = rr() < 0.5 ? "#00000018" : "#ffffff20"; x.fillRect(rr() * w, rr() * hh, 2, 2); } x.fillStyle = "#7f7c74"; x.fillRect(0, 0, w, 3); }) });
  const y0 = 0.62, fim = cor.len;
  // o piso como nas pistas de verdade: a faixa de passagem (do lado da pista) de asfalto escuro, a de trabalho (na frente das garagens)
  // de concreto claro, a faixa azul de patrocínio rente à divisão e a linha vermelha correndo junto das garagens
  // a faixa de trabalho: placas de concreto claro com as juntas, a textura do vassourado, manchas e marcas de pneu de quem arranca da garagem
  const trabalho = poly({ roughness: 0.9, map: canvasTex(512, 1024, (x, w, hh, rr) => {
    x.fillStyle = "#bdbbb3"; x.fillRect(0, 0, w, hh);
    for (let y = 0; y < hh; y += 2) { x.fillStyle = rr() < 0.5 ? "#0000000a" : "#ffffff0c"; x.fillRect(0, y, w, 1); } // o vassourado, de lado a lado
    for (let i = 0; i < 14000; i++) { x.fillStyle = rr() < 0.5 ? "#00000012" : "#ffffff1c"; x.fillRect(rr() * w, rr() * hh, 1 + (rr() < 0.2), 1 + (rr() < 0.2)); }
    for (let k = 0; k < 6; k++) { const g = x.createRadialGradient(0, 0, 0, 0, 0, 60); g.addColorStop(0, "#5a564a26"); g.addColorStop(1, "#00000000"); x.save(); x.translate(rr() * w, rr() * hh); x.scale(1 + rr(), 1 + rr()); x.fillStyle = g; x.beginPath(); x.arc(0, 0, 60, 0, 7); x.fill(); x.restore(); }
    x.strokeStyle = "#22222244"; x.lineWidth = 7; // marcas de pneu (arrancadas em curva saindo da garagem)
    for (let k = 0; k < 2; k++) { const y = rr() * hh, sx = rr() < 0.5 ? 1 : -1; for (const off of [0, 46]) { x.beginPath(); x.moveTo(w * 0.85, y + off); x.quadraticCurveTo(w * 0.5, y + off - sx * 30, w * 0.15, y + off + sx * 120); x.stroke(); } }
    x.fillStyle = "#6f6c64"; for (let y = 0; y < hh; y += hh / 4) x.fillRect(0, y, w, 3); x.fillRect(w / 2 - 1, 0, 3, hh); // as juntas das placas
    x.fillStyle = "#ffffff30"; for (let y = 3; y < hh; y += hh / 4) x.fillRect(0, y, w, 1);
  }), polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  // a faixa azul com os nomes dos patrocinadores em branco, escritos ao longo dela (lidos de quem passa pelo corredor); um ladrilho de
  // REP_AZUL u com três nomes, repetido no comprimento
  const REP_AZUL = 210, nomesAzul = (cfg.patrocinio || PATROCINIO).slice(0, 3);
  const azul = poly({ map: canvasTex(96, 1536, (x, w, hh) => {
    x.fillStyle = "#1f4fc4"; x.fillRect(0, 0, w, hh);
    nomesAzul.forEach((nome, i) => { const m = MARCAS[nome] || { texto: String(nome).toUpperCase(), fonte: "900 {s}px Arial, sans-serif" };
      x.save(); x.translate(w / 2, (hh / nomesAzul.length) * (i + 0.5)); x.rotate(Math.PI / 2);
      x.fillStyle = "#ffffff"; x.textAlign = "center"; x.textBaseline = "middle"; let s2 = 64; x.font = m.fonte.replace("{s}", s2);
      while (s2 > 20 && x.measureText(m.texto).width > hh / nomesAzul.length * 0.8) { s2 -= 4; x.font = m.fonte.replace("{s}", s2); }
      x.fillText(m.texto, 0, 0); x.restore(); });
  }), polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  fita(asfalto, 0, fim, desloc(-meia), desloc(0), y0, y0);
  fita(trabalho, 0, fim, desloc(0), desloc(meia), y0, y0);
  fita(azul, F.RAMPA, fim - F.RAMPA, desloc(-7.5), desloc(-0.6), y0 + 0.04, y0 + 0.04, REP_AZUL);
  fita(vermelho, F.RAMPA, fim - F.RAMPA, desloc(meia - 2.4), desloc(meia - 1.2), y0 + 0.05, y0 + 0.05);
  // as bordas do corredor (a linha branca do lado da pista é a "linha branca de entrada") e as linhas de entrada e saída
  fita(branco, 1, fim - 1, desloc(-meia + 0.4), desloc(-meia + 1.8), y0 + 0.04, y0 + 0.04);
  fita(branco, 1, fim - 1, desloc(meia - 1.8), desloc(meia - 0.4), y0 + 0.04, y0 + 0.04);
  // A linha entre a faixa rápida e a faixa das garagens deixa livre a passagem de quem não para.
  fita(branco, F.RAMPA, fim - F.RAMPA, desloc(-0.45), desloc(0.45), y0 + 0.04, y0 + 0.04);
  fita(branco, F.RAMPA - 1, F.RAMPA - 0.5, desloc(-meia), desloc(meia), y0 + 0.05, y0 + 0.05);
  fita(vermelho, fim - F.RAMPA, fim - F.RAMPA + 0.5, desloc(-meia), desloc(meia), y0 + 0.05, y0 + 0.05);
  // Entrada destacada: guias amarelas e setas no asfalto levam da pista à rampa.
  // Os desenhos usam a mesma curva do corredor, inclusive em pistas com o box à esquerda.
  const amarelo = poly({ color: 0xffd52a, emissive: 0x342500, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  const guia = (u) => cor.lat(u, lado * (W / 2 - 8));
  for (let u = 0; u < F.RAMPA; u += 3) {
    const a = u, b = Math.min(u + 1.8, F.RAMPA);
    fita(amarelo, a, b, (v) => guia(v) - lado * 8, (v) => guia(v) - lado * 6.4, y0 + 0.10, y0 + 0.10);
    fita(amarelo, a, b, (v) => guia(v) + lado * 6.4, (v) => guia(v) + lado * 8, y0 + 0.10, y0 + 0.10);
  }
  for (const u of [2, 6, 10]) {
    const ponta = em(u + 2, guia(u + 2)), esq = em(u, guia(u) - lado * 5), dir = em(u, guia(u) + lado * 5);
    const l = L.de(amarelo), base = l.vs.length / 3;
    for (const p of [ponta, esq, dir]) { l.vs.push(p.x, p.h + y0 + 0.11, p.y); l.uv.push(0, 0); }
    l.idx.push(base, base + 1, base + 2);
  }
  // Placa alta, voltada para quem chega, visível mesmo quando há carros sobre a pintura.
  const placaTex = canvasTex(512, 160, (x, w, h) => {
    x.fillStyle = "#101418"; x.fillRect(0, 0, w, h); x.fillStyle = "#ffd52a"; x.fillRect(0, 0, w, 12); x.fillRect(0, h - 12, w, 12);
    x.fillStyle = "#fff"; x.font = "900 82px Arial, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("PIT ENTRY", w / 2, h / 2);
  });
  const pEntrada = em(1, lado * (W / 2 + 40)), qEntrada = pts[(cor.i0 + 1) % n];
  const placa = new THREE.Mesh(new THREE.PlaneGeometry(55, 17), new THREE.MeshBasicMaterial({ map: placaTex, side: THREE.DoubleSide }));
  placa.position.set(pEntrada.x, pEntrada.h + 31, pEntrada.y); placa.rotation.y = Math.atan2(-qEntrada.tx, -qEntrada.ty); placa.name = `${tr.id}-entrada-box-placa`; grp.add(placa);
  // a mureta entre a pista e o corredor, só no trecho reto (nas rampas o carro cruza); pista de rua já tem o guard-rail
  if ((cfg.mureta ?? !tr.t.walls) !== false) {
    const lm = (u) => lado * (W / 2 + 12.5), a = F.RAMPA + 1, b = fim - F.RAMPA - 1, alt = 3.6;
    fita(concreto, a, b, lm, lm, 0, alt, 8); fita(concreto, a, b, (u) => lm(u) + lado * 2.4, (u) => lm(u) + lado * 2.4, alt, 0, 8);
    fita(concreto, a, b, lm, (u) => lm(u) + lado * 2.4, alt, alt, 8);
  }
  // o piso de concreto entre o corredor e o fundo das garagens (no autódromo de verdade não tem grama ali) e as laterais que descem até
  // o chão, para o corredor alto não ficar flutuando
  const comPiso = cfg.garagens !== false, pisoFim = cor.garagemLat + lado * (meia / 2 + 22);
  const piso = poly({ map: canvasTex(64, 64, (x, w, hh, rr) => { x.fillStyle = "#a9a8a2"; x.fillRect(0, 0, w, hh); for (let i = 0; i < 300; i++) { x.fillStyle = rr() < 0.5 ? "#00000014" : "#ffffff18"; x.fillRect(rr() * w, rr() * hh, 2, 2); } x.fillStyle = "#00000022"; x.fillRect(0, 0, w, 1); x.fillRect(0, 0, 1, hh); }), polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  if (comPiso) fita(piso, F.RAMPA, fim - F.RAMPA, desloc(meia - 0.2), () => pisoFim, y0 - 0.02, y0 - 0.02, 12);
  fita(concreto, 0, fim, desloc(-meia), desloc(-meia), y0, -6, 8); // a lateral do lado da pista
  fita(concreto, 0, comPiso ? F.RAMPA : fim, desloc(meia), desloc(meia), y0, -6, 8); // a lateral de fora (onde não tem o piso)
  if (comPiso) { fita(concreto, F.RAMPA, fim - F.RAMPA, () => pisoFim, () => pisoFim, y0, -6, 8); fita(concreto, fim - F.RAMPA, fim, desloc(meia), desloc(meia), y0, -6, 8); }
  L.montar((o) => (grp.add(o), o), `${tr.id}-boxes`);
  // as garagens, os mecânicos e o quadrado pintado onde o carro para: tudo numa malha só, com a cor nos vértices. As
  // partes na cor da equipe ficam anotadas em "faixas" para "colorir" trocar (jogo.js pinta com a cor de quem usa cada uma)
  const geo = { vs: [], cs: [] }, luzes = { vs: [], cs: [] }, faixas = cor.garagens.map(() => []), cor3 = (c) => new THREE.Color(c);
  // caixa com o centro em (a ao longo da pista, b para o lado de fora), de altura sy a partir de y, nos eixos da pista no ponto q
  let emLuz = false; // as peças que acendem (luminárias e as luzes dos braços) vão para uma malha só, que brilha no bloom
  const caixa = (q, tx, ty, nx, ny, a, b, y, sa, sb, sy, c, k = -1) => {
    const alvo = emLuz ? luzes : geo, col = cor3(c), v0 = alvo.vs.length / 3, cantos = [];
    for (const [ka, kb, ky] of [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]]) {
      const pa = a + (ka * sa) / 2, pb = b + (kb * sb) / 2;
      cantos.push([q.x + tx * pa + nx * pb, q.h + y + ((ky + 1) / 2) * sy, q.y + ty * pa + ny * pb]);
    }
    for (const f of [[0, 1, 2, 3], [4, 7, 6, 5], [0, 4, 5, 1], [1, 5, 6, 2], [2, 6, 7, 3], [3, 7, 4, 0]]) for (const i of [f[0], f[1], f[2], f[0], f[2], f[3]]) { alvo.vs.push(...cantos[i]); alvo.cs.push(col.r, col.g, col.b); }
    if (k >= 0) faixas[k].push([v0, alvo.vs.length / 3]);
  };
  const luz = (...a) => { emLuz = true; caixa(...a); emLuz = false; };
  const fundo = 16, alt = 14, pele = "#e2b48c", cinza = "#8c8f96", comGaragem = cfg.garagens !== false;
  // a garagem só é construída onde nenhum outro trecho da pista passa mais perto do que ela está do próprio (Mônaco, Zandvoort...)
  const garagemLivre = (ref, tx, ty, nx, ny, largura) => [0, fundo + 3].every((b) => [-1, 0, 1].every((s) => tr.distAt(ref.x + nx * b + tx * s * largura / 2, ref.y + ny * b + ty * s * largura / 2) >= Math.abs(cor.garagemLat) + meia / 2 + b - 4));
  cor.garagens.forEach((u, k) => {
    const i = cor.i0 + Math.floor(u), p = pts[i % n], tx = p.tx, ty = p.ty, nx = p.nx * lado, ny = p.ny * lado;
    const largura = Math.max(18, cor.gap * 6 * 0.92), q = em(u, cor.garagemLat), [idEq, nomeEq, corEq] = equipeDa(k), c = cfg.cores?.[k % cfg.cores.length] || corEq;
    const ref = { x: q.x + nx * (meia / 2), y: q.y + ny * (meia / 2), h: q.h }; // a borda externa da faixa das garagens
    if (comGaragem && garagemLivre(ref, tx, ty, nx, ny, largura)) {
      const passo = Math.max(largura + 1.6, cor.gap * 6), escuro = "#2e3136", cinzaP = "#3c4046";
      // o fundo e o interior: piso de resina claro, a parede do fundo escura com o logo grande, a luz do teto
      caixa(ref, tx, ty, nx, ny, 0, fundo - 0.7, -9, passo, 1.4, 9 + alt + 13, escuro);
      caixa(ref, tx, ty, nx, ny, 0, fundo / 2, 0.62, largura, fundo - 1.4, 0.1, "#d6d8dc");
      caixa(ref, tx, ty, nx, ny, 0, fundo / 2, 0.74, 1.2, fundo - 2, 0.04, c, k); // a faixa da equipe no piso
      luz(ref, tx, ty, nx, ny, 0, fundo / 2, alt - 0.6, largura - 2, fundo - 3, 0.3, "#fff6e0"); // as luminárias do teto
      for (const sd of [-1, 1]) for (let jj = 0; jj < 3; jj++) caixa(ref, tx, ty, nx, ny, sd * (largura / 2 - 3), fundo - 4, 0.7 + jj * 1.5, 3.2, 3.2, 1.4, "#1a1a1c"); // pneus no fundo
      // os pilares entre as garagens e a fachada escura acima da abertura, com a placa da equipe
      for (const sd of [-1, 1]) caixa(ref, tx, ty, nx, ny, sd * (passo / 2 - 0.8), fundo / 2 - 1, -9, 1.6, fundo + 1, 9 + alt + 13, cinzaP);
      caixa(ref, tx, ty, nx, ny, 0, -0.6, alt - 6, passo, 1.2, 6, escuro);
      // a marquise que avança sobre a faixa de trabalho, com a faixa de patrocínio vermelha na frente e um filete branco
      caixa(ref, tx, ty, nx, ny, 0, -6, alt, passo, 12, 1.2, cinzaP);
      caixa(ref, tx, ty, nx, ny, 0, -12, alt - 2.6, passo, 0.6, 4, cfg.faixa || "#c8102e");
      caixa(ref, tx, ty, nx, ny, 0, -12.05, alt + 1.2, passo, 0.7, 0.5, "#f4f4f4");
      // o patrocinador na faixa vermelha (um por garagem, alternando), de frente para o corredor
      const nomeFaixa = (cfg.patrocinio || PATROCINIO)[k % (cfg.patrocinio || PATROCINIO).length];
      const faixaP = new THREE.Mesh(new THREE.PlaneGeometry(passo, 3.6), new THREE.MeshBasicMaterial({ map: texFaixa(nomeFaixa, cfg.faixa || "#c8102e"), side: THREE.DoubleSide }));
      const pfx = 12.32; faixaP.position.set(ref.x - nx * pfx, ref.h + alt - 0.6, ref.y - ny * pfx); faixaP.rotation.y = Math.atan2(-nx, -ny);
      grp.add(faixaP);
      // o andar do hospitality: vidro escuro, guarda-corpo branco na frente e a laje do teto
      caixa(ref, tx, ty, nx, ny, 0, fundo / 2 + 1, alt + 1.2, passo, fundo - 2, 10, "#27394a");
      caixa(ref, tx, ty, nx, ny, 0, -0.4, alt + 1.2, passo, 0.4, 3, "#e9e9e6");
      caixa(ref, tx, ty, nx, ny, 0, fundo / 2 - 1, alt + 11.2, passo, fundo + 3, 1.2, "#25282d");
      // o braço prateado da garagem (a "gantry"): o poste na fachada e a viga por cima da faixa de trabalho, com a luz na ponta
      caixa(ref, tx, ty, nx, ny, largura / 2 - 2.4, -1.4, 0.6, 0.9, 0.9, 10, "#c9ccd2");
      caixa(ref, tx, ty, nx, ny, largura / 2 - 2.4, -9, 10.2, 0.9, 16, 0.9, "#c9ccd2");
      luz(ref, tx, ty, nx, ny, largura / 2 - 2.4, -16.6, 8.4, 1.4, 1.4, 1.8, "#f4f8ff");
      caixa(ref, tx, ty, nx, ny, largura / 2 - 2.4, -16.6, 7.6, 1.6, 0.4, 0.8, c, k);
      // a placa da equipe sobre a abertura (o logo e o nome) e o logo grande no fundo
      const fachada = new THREE.Mesh(new THREE.PlaneGeometry(largura, 5.2), new THREE.MeshBasicMaterial({ map: placaDaEquipe(idEq, nomeEq, c, 640, 104, true), side: THREE.DoubleSide }));
      fachada.position.set(ref.x - nx * 1.25, ref.h + alt - 3, ref.y - ny * 1.25); fachada.rotation.y = Math.atan2(-nx, -ny); fachada.name = `${tr.id}-garagem-${idEq}`;
      grp.add(fachada);
      const fundoLogo = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(largura - 4, 16), 7), new THREE.MeshBasicMaterial({ map: placaDaEquipe(idEq, nomeEq, c, 384, 168, false), side: THREE.DoubleSide }));
      const pf = fundo - 1.45; fundoLogo.position.set(ref.x + nx * pf, ref.h + alt - 6.5, ref.y + ny * pf); fundoLogo.rotation.y = Math.atan2(-nx, -ny);
      grp.add(fundoLogo);
    }
    // a parada da equipe pintada no concreto, em amarelo: o contorno do retângulo e o traço do meio (onde o carro para)
    const Y = "#f2c230", W2 = 13, D2 = 9;
    caixa(q, tx, ty, nx, ny, 0, -D2 / 2, 0.66, W2, 0.5, 0.05, Y); caixa(q, tx, ty, nx, ny, 0, D2 / 2, 0.66, W2, 0.5, 0.05, Y);
    for (const sd of [-1, 1]) caixa(q, tx, ty, nx, ny, sd * W2 / 2, 0, 0.66, 0.5, D2, 0.05, Y);
    caixa(q, tx, ty, nx, ny, 0, 0, 0.66, 0.6, 3, 0.05, Y); caixa(q, tx, ty, nx, ny, 0, 0, 0.66, 3.6, 0.6, 0.05, Y);
    caixa(q, tx, ty, nx, ny, 0, D2 / 2 - 0.6, 0.67, 4, 0.6, 0.06, c, k); // a marca na cor da equipe
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(geo.vs, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(geo.cs, 3)); g.computeVertexNormals();
  const malha = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, side: THREE.DoubleSide }));
  malha.castShadow = malha.receiveShadow = true; malha.name = `${tr.id}-garagens`; grp.add(malha);
  if (luzes.vs.length) { // um brilho leve no bloom (pos.js lê userData.bloom); na qualidade Baixa fica só a cor clara
    const gl = new THREE.BufferGeometry();
    gl.setAttribute("position", new THREE.Float32BufferAttribute(luzes.vs, 3)); gl.setAttribute("color", new THREE.Float32BufferAttribute(luzes.cs, 3));
    const ml = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, toneMapped: false }); ml.userData.bloom = 1.6;
    const acesas = new THREE.Mesh(gl, ml); acesas.name = `${tr.id}-garagens-luzes`; grp.add(acesas);
  }
  // pinta as partes da equipe de cada garagem: cores[k] (ou cinza) vale para a garagem k
  grp.userData.colorir = (cores) => {
    const atr = g.attributes.color;
    faixas.forEach((lista, k) => { const col = cor3(cores[k] || cfg.cores?.[k] || equipeDa(k)[2]); for (const [v0, v1] of lista) for (let v = v0; v < v1; v++) atr.setXYZ(v, col.r, col.g, col.b); });
    atr.needsUpdate = true;
  };
  // os balizadores que ficariam no meio do corredor saem de cena enquanto ele aparece (as regras de F1)
  const noCorredor = (tr.cones || []).filter((co) => { for (let u = 0; u <= fim; u += 3) { const q = em(u, latDe(u)); if (Math.hypot(q.x - co.x, q.y - co.y) < meia + 6) return true; } return false; });
  grp.userData.mostrar = (on) => { grp.visible = on; for (const m of tr.guardaBox || []) m.visible = !on; for (const co of noCorredor) { co.mesh.visible = !on; co.cooldown = on ? Infinity : 0; } };
  // os enfeites soltos de depois não entram em cima das garagens
  for (let u = F.RAMPA; u <= fim - F.RAMPA; u += 8) { const q = em(u, cor.D + lado * 28); if (comGaragem) tr.reservado.push([q.x, q.y, 50]); }
  grp.userData.mostrar(!!tr.mostrarBoxes);
  tr.boxesInfo = { garagens: cor.garagens.length, comprimento: cor.comprimento, lado };
}
