"use strict";
// O desenho fixo do Autódromo da Galera, tudo em canvas (nenhuma imagem): o chão, a pista, os prédios e os enfeites.
// Em pixels nativos (16 por casa), depois ampliado pela câmera. O que se mexe fica em gp-vida.js.
function px(c, col, x, y, w = 1, h = 1) { c.fillStyle = col; c.fillRect(x, y, w, h); }
const FONTE_PIXEL = (tam, peso = 700) => `${peso} ${tam}px "Pixelify Sans", monospace`;
const TINTA = "#1a1c2c"; // o contorno escuro de tudo, como nos jogos de 16 bits
function mistura(a, b, t) { // mistura de duas cores em hex (t = quanto da segunda)
  const A = parseInt(a.slice(1, 7), 16), B = parseInt(b.slice(1, 7), 16), m = (s) => Math.round(((A >>> s) & 255) * (1 - t) + ((B >>> s) & 255) * t);
  return "#" + ((1 << 24) | (m(16) << 16) | (m(8) << 8) | m(0)).toString(16).slice(1);
}
const claro = (cor, t = 0.3) => mistura(cor, "#ffffff", t), escuro = (cor, t = 0.3) => mistura(cor, "#000000", t);
function acentoDe(g) { // a cor de destaque do prédio: a do jogo, clareada quando é escura
  const n = parseInt((g.roof || "#e10600").slice(1), 16), lum = ((n >>> 16) & 255) * 0.3 + ((n >>> 8) & 255) * 0.59 + (n & 255) * 0.11;
  return mistura(g.roof || "#e10600", "#ffffff", lum < 70 ? 0.55 : lum < 110 ? 0.3 : 0);
}
const PELES = ["#f2c39b", "#d9a27a", "#a8704a", "#7a4a2c", "#f6d3b3"];
const CAMISAS = ["#e10600", "#f4f4f0", "#1e5bc6", "#ffb000", "#1b1f24", "#00a19c", "#ff8000", "#2e9e4f", "#7a3cff", "#ff5fa2"];
// uma caixa com contorno e, se pedir, a luz em cima e a sombra embaixo
function caixa(c, X, Y, W, H, cor, luz = 0, somb = 0) {
  px(c, TINTA, X - 1, Y - 1, W + 2, H + 2); px(c, cor, X, Y, W, H);
  if (luz) px(c, claro(cor, 0.35), X, Y, W, luz);
  if (somb) px(c, escuro(cor, 0.25), X, Y + H - somb, W, somb);
}
function sombra(c, X, Y, W, H, d = 5) { px(c, "#0c1a1238", X + d, Y + d, W, H); }
function letreiro(c, txt, cx, cy, maxW, maxH, cor, borda) { // o texto do maior tamanho que couber
  let tam = Math.min(maxH, 30); c.textAlign = "center"; c.textBaseline = "middle";
  for (; tam > 5; tam--) { c.font = FONTE_PIXEL(tam); if (c.measureText(txt).width <= maxW) break; }
  c.font = FONTE_PIXEL(tam);
  if (borda) { c.fillStyle = borda; for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) c.fillText(txt, cx + dx, cy + dy); }
  c.fillStyle = cor; c.fillText(txt, cx, cy); c.textAlign = "left";
}
// uma pessoinha de arquibancada (4 x 5): a cabeça, o boné de vez em quando e a camisa
function pessoinha(c, x, y, r, pulo = 0) {
  const cor = CAMISAS[r % CAMISAS.length], pele = PELES[(r >>> 4) % PELES.length];
  px(c, pele, x + 1, y - pulo, 2, 2); if ((r >>> 7) % 3 === 0) px(c, CAMISAS[(r >>> 9) % CAMISAS.length], x + 1, y - pulo, 2, 1);
  px(c, cor, x, y + 2 - pulo, 4, 3 + pulo);
  if (pulo) { px(c, pele, x - 1, y - pulo - 1, 1, 2); px(c, pele, x + 4, y - pulo - 1, 1, 2); } // os braços para cima
}

// ---------- o chão ----------
const naGrama = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH && "gfthw".includes(ground[y][x]);
function drawGrass(c, x, y) { // o gramado cortado em faixas diagonais, como nos autódromos
  const X = x * TS, Y = y * TS, f = ((x + y) >>> 2) & 1;
  px(c, f ? "#58b04a" : "#4fa643", X, Y, TS, TS);
  for (let i = 0; i < 3; i++) { const r = hash(x, y, i); px(c, f ? "#49a03f" : "#439638", X + r % 15, Y + (r >>> 5) % 14, 1, 2); }
  if (hash(x, y, 9) % 5 === 0) px(c, "#84d267", X + 3 + hash(x, y, 10) % 9, Y + 4 + hash(x, y, 11) % 8, 2, 1);
}
function bordas(c, x, y, cor, e = 1) { // o meio-fio onde o piso encontra a grama
  const X = x * TS, Y = y * TS;
  if (naGrama(x, y - 1)) px(c, cor, X, Y, TS, e);
  if (naGrama(x, y + 1)) px(c, cor, X, Y + TS - e, TS, e);
  if (naGrama(x - 1, y)) px(c, cor, X, Y, e, TS);
  if (naGrama(x + 1, y)) px(c, cor, X + TS - e, Y, e, TS);
}
function drawConcrete(c, x, y) { // o piso do paddock: placas grandes de concreto claro, com as juntas
  const X = x * TS, Y = y * TS;
  px(c, (x + y) & 1 ? "#cfd3d9" : "#c8ccd3", X, Y, TS, TS);
  px(c, "#b3b8c0", X, Y + TS - 1, TS, 1); px(c, "#b3b8c0", X + TS - 1, Y, 1, TS); px(c, "#dfe2e7", X, Y, TS - 1, 1);
  const r = hash(x, y, 3); if (r % 7 === 0) px(c, "#b9bec6", X + 3 + r % 9, Y + 4 + (r >>> 4) % 8, 2, 1);
  bordas(c, x, y, "#8e959f", 2);
}
function drawAsfalto(c, x, y) {
  const X = x * TS, Y = y * TS;
  px(c, "#4a4e57", X, Y, TS, TS);
  for (let i = 0; i < 4; i++) { const r = hash(x, y, i); px(c, i % 2 ? "#555a63" : "#40444c", X + r % 15, Y + (r >>> 5) % 15, 2, 1); }
  bordas(c, x, y, "#d9dce1", 1);
}
function drawPitlane(c, x, y) { // o pit lane: a faixa de trabalho na frente das garagens e a faixa rápida, com a linha branca
  const X = x * TS, Y = y * TS, lin = y - OY;
  px(c, lin === 95 ? "#5a5f69" : "#454952", X, Y, TS, TS);
  for (let i = 0; i < 3; i++) { const r = hash(x, y, i); px(c, "#3c4048", X + r % 15, Y + (r >>> 5) % 15, 2, 1); }
  if (lin === 95) { px(c, "#f4f4f0", X, Y + TS - 2, TS, 2); if ((x - OX - BOXES.x) % BOXES.w === 0 && x - OX >= BOXES.x && x - OX <= BOXES.x + 60) px(c, "#ffd23f", X, Y, 2, TS - 2); }
  if (lin === 99) px(c, "#f4f4f0", X, Y + TS - 3, TS, 1);
  if (lin === 97 && (x & 3) < 2) px(c, "#6a707a", X, Y + 7, TS, 1);
  bordas(c, x, y, "#d9dce1", 1);
}
function drawMuroBox(c, x, y) { // o muro do pit: concreto com a tela por cima e as placas dos patrocinadores
  const X = x * TS, Y = y * TS;
  px(c, "#454952", X, Y, TS, 5); px(c, TINTA, X, Y + 4, TS, 1);
  px(c, "#e8eaee", X, Y + 5, TS, 5); px(c, "#aab0b9", X, Y + 10, TS, 3); px(c, TINTA, X, Y + 13, TS, 1); px(c, "#3c9a3f", X, Y + 14, TS, 2);
  const k = Math.floor((x - OX) / 5) % 4; px(c, ["#e10600", "#1e5bc6", "#ffd23f", "#1b1f24"][k], X, Y + 6, TS, 3);
  if ((x & 3) === 0) px(c, "#7d848e", X, Y + 1, 1, 4);
}
function drawParking(c, x, y) {
  const X = x * TS, Y = y * TS;
  px(c, "#565a63", X, Y, TS, TS);
  for (let i = 0; i < 2; i++) { const r = hash(x, y, i); px(c, "#4a4e56", X + r % 15, Y + (r >>> 5) % 15, 2, 1); }
  px(c, "#e9ebee", X, Y, 1, TS);
  bordas(c, x, y, "#d9dce1", 1);
}
function drawRodovia(c, x, y) { // a rodovia de fora: duas pistas com a faixa amarela no meio e as tracejadas
  const X = x * TS, Y = y * TS, lin = y - OY - RODOVIA.y0;
  px(c, "#3d4048", X, Y, TS, TS);
  for (let i = 0; i < 2; i++) { const r = hash(x, y, i); px(c, "#474b54", X + r % 15, Y + (r >>> 5) % 15, 2, 1); }
  if (lin === 0) px(c, "#f4f4f0", X, Y + 1, TS, 1);
  if (lin === 4) px(c, "#f4f4f0", X, Y + TS - 2, TS, 1);
  if (lin === 2) { px(c, "#ffd23f", X, Y + 6, TS, 1); px(c, "#ffd23f", X, Y + 9, TS, 1); }
  if ((lin === 1 || lin === 3) && (x & 3) < 2) px(c, "#f4f4f0", X, Y + 7 + (lin === 1 ? -4 : 4), TS, 1);
}
function drawAgua(c, x, y) {
  const X = x * TS, Y = y * TS;
  px(c, "#3f9bd8", X, Y, TS, TS);
  const r = hash(x, y, 2); px(c, "#6fbdea", X + r % 10, Y + 3 + (r >>> 4) % 9, 5, 1); px(c, "#3187c4", X + (r >>> 8) % 11, Y + 2 + (r >>> 12) % 11, 4, 1);
  // a margem de areia
  const seca = (xx, yy) => ground[yy]?.[xx] !== "w";
  if (seca(x, y - 1)) { px(c, "#e6d39a", X, Y, TS, 3); px(c, "#8fd0f2", X, Y + 3, TS, 1); }
  if (seca(x, y + 1)) { px(c, "#e6d39a", X, Y + TS - 2, TS, 2); }
  if (seca(x - 1, y)) { px(c, "#e6d39a", X, Y, 3, TS); px(c, "#8fd0f2", X + 3, Y, 1, TS); }
  if (seca(x + 1, y)) px(c, "#e6d39a", X + TS - 2, Y, 2, TS);
}
function drawFlowers(c, x, y) {
  drawGrass(c, x, y);
  const X = x * TS, Y = y * TS;
  for (let i = 0; i < 4; i++) { const r = hash(x, y, 20 + i), fx = X + 1 + r % 12, fy = Y + 1 + (r >>> 4) % 12, cor = ["#ff5fa2", "#ffd23f", "#f4f4f0", "#ff7b2e", "#b072f0"][(r >>> 8) % 5]; px(c, "#2f7a2a", fx + 1, fy + 2, 1, 2); px(c, cor, fx, fy + 1, 3, 1); px(c, cor, fx + 1, fy, 1, 3); px(c, "#ffe066", fx + 1, fy + 1); }
}
function drawMatoAlto(c, x, y) {
  const X = x * TS, Y = y * TS;
  px(c, "#2f7a2a", X, Y, TS, TS);
  for (let ty = 0; ty < 2; ty++) for (let tx = 0; tx < 2; tx++) {
    const bx = X + tx * 8 + ((ty + x) % 2) * 2 - 1, by = Y + ty * 8, cor = (tx + ty + x + y) % 2 ? "#3f9a36" : "#46a83c";
    for (const [dx, h] of [[0, 5], [2, 7], [4, 6], [6, 4]]) { px(c, "#1f5e1f", bx + dx, by + 8 - h, 2, h); px(c, cor, bx + dx, by + 8 - h, 1, h - 1); px(c, "#8fdc6a", bx + dx, by + 8 - h, 1, 1); }
  }
}
// quem está na grama alta fica com os pés escondidos nela
function drawMatoPorCima(c, p) {
  const X = Math.round(p.fx * TS), Y = Math.round(p.fy * TS) + TS - 6, k = Math.round(p.fx * 3 + p.fy);
  for (let i = 0; i < 8; i++) { const h = 3 + ((i + k) % 3); px(c, "#1f5e1f", X + i * 2, Y + 6 - h, 2, h); px(c, i % 2 ? "#3f9a36" : "#46a83c", X + i * 2, Y + 6 - h, 1, h - 1); px(c, "#8fdc6a", X + i * 2, Y + 6 - h, 1, 1); }
}
// as árvores: copa redonda com contorno, a luz de cima à esquerda e a sombra no chão; de vez em quando um pinheiro
function drawTree(c, x, y) {
  const X = x * TS, Y = y * TS, r = hash(x, y, 40), ox = (r % 3) - 1, oy = ((r >>> 3) % 3) - 1, cx = X + 8 + ox, cy = Y + 4 + oy;
  c.fillStyle = "#0c1a1240"; c.beginPath(); c.ellipse(cx + 2, Y + 14, 8, 3, 0, 0, 7); c.fill();
  px(c, "#5a3b22", cx - 1, Y + 9, 3, 5); px(c, TINTA, cx - 2, Y + 13, 5, 1);
  if ((r >>> 6) % 5 === 0) { // pinheiro
    for (const [w, yy] of [[4, -9], [8, -5], [12, -1], [14, 3]]) { px(c, TINTA, cx - w / 2 - 1, cy + yy - 1, w + 2, 6); px(c, "#1f6b3a", cx - w / 2, cy + yy, w, 4); px(c, "#2f8a4c", cx - w / 2, cy + yy, w / 2, 2); }
    return;
  }
  const t = (r >>> 9) % 3, base = ["#2f8f3e", "#27803a", "#3a9a35"][t], luz = ["#57b94f", "#4cab4a", "#6cc34e"][t], som = ["#1f6a31", "#1a5f2f", "#27742c"][t];
  c.fillStyle = TINTA; c.beginPath(); c.arc(cx, cy, 10, 0, 7); c.fill();
  c.fillStyle = som; c.beginPath(); c.arc(cx, cy, 9, 0, 7); c.fill();
  c.fillStyle = base; c.beginPath(); c.arc(cx - 1, cy - 1, 8, 0, 7); c.fill();
  c.fillStyle = luz; c.beginPath(); c.arc(cx - 3, cy - 3, 4, 0, 7); c.fill();
  px(c, claro(luz, 0.35), cx - 5, cy - 5, 2, 1); px(c, som, cx + 2, cy + 3, 3, 1); px(c, som, cx - 4, cy + 5, 2, 1);
  if ((r >>> 12) % 6 === 0) { px(c, "#e10600", cx + 3, cy - 1, 2, 2); px(c, "#e10600", cx - 2, cy + 3, 2, 2); } // frutinhas
}
function drawMat(c, x, y) { // o capacho: tapete vermelho com a borda dourada
  const t = ground[y - 2]?.[x] === "q" || y - OY === 95 ? drawPitlane : drawConcrete; t(c, x, y);
  const X = x * TS, Y = y * TS;
  px(c, TINTA, X + 1, Y + 1, 14, 12); px(c, "#c8102e", X + 2, Y + 2, 12, 10); px(c, "#ffd23f", X + 2, Y + 2, 12, 1); px(c, "#ffd23f", X + 2, Y + 11, 12, 1); px(c, "#e8455c", X + 4, Y + 5, 8, 1); px(c, "#9b0c22", X + 4, Y + 8, 8, 1);
}
function drawLigacao(c, x, y) { // a boca do pit lane e o portão de serviço: asfalto com as zebras de aviso
  const X = x * TS, Y = y * TS; px(c, "#454952", X, Y, TS, TS);
  for (let i = 0; i < 3; i++) { const r = hash(x, y, i); px(c, "#3c4048", X + r % 15, Y + (r >>> 5) % 15, 2, 1); }
}
function drawTerra(c, x, y) { const X = x * TS, Y = y * TS; px(c, "#b08a5a", X, Y, TS, TS); px(c, "#9c784c", X + hash(x, y, 1) % 12, Y + hash(x, y, 2) % 12, 3, 2); }
const CHAO = { g: drawGrass, t: drawGrass, c: drawConcrete, a: drawAsfalto, q: drawPitlane, W: drawMuroBox, e: drawParking, r: drawRodovia, w: drawAgua, f: drawFlowers, h: drawMatoAlto, n: drawGrass, P: drawGrass, m: drawMat, l: drawTerra, k: drawGrass };

// ---------- a pista ----------
// texturas de 16 x 16 para os traços largos (asfalto e brita): o padrão acompanha a grade do mapa
function textura(base, graos) {
  const cv = document.createElement("canvas"); cv.width = cv.height = 16; const c = cv.getContext("2d");
  px(c, base, 0, 0, 16, 16);
  graos.forEach((cor, k) => { for (let i = 0; i < 9; i++) { const r = hash(i, k, 55); px(c, cor, r % 16, (r >>> 4) % 16, 1 + (r >>> 9) % 2, 1); } });
  return cv;
}
const TEX = { asfalto: textura("#3a3d46", ["#444851", "#31343c", "#40444d"]), brita: textura("#dcc592", ["#c9ae77", "#ecd9ab", "#b89a62", "#f3e6c2"]) };
function caminho(c, i0, i1) { // a linha do meio da pista, da amostra i0 até i1 (dando a volta)
  c.beginPath();
  for (let i = i0; i <= i1; i++) { const p = PISTA.pts[((i % PISTA.N) + PISTA.N) % PISTA.N]; if (i === i0) c.moveTo(p[0] * TS, p[1] * TS); else c.lineTo(p[0] * TS, p[1] * TS); }
}
function drawPista(c) {
  const traco = (larg, cor, dash) => { c.lineWidth = larg; c.strokeStyle = cor; c.setLineDash(dash || []); c.stroke(); };
  c.save(); c.lineJoin = "round"; c.lineCap = "butt";
  const brita = c.createPattern(TEX.brita, "repeat"), asfalto = c.createPattern(TEX.asfalto, "repeat");
  // o guard-rail (duas lâminas com os postes) e a faixa de grama até ele
  caminho(c, 0, PISTA.N); c.closePath();
  traco(MURO * 2 * TS + 2, TINTA); traco(MURO * 2 * TS, "#eef0f3"); traco(MURO * 2 * TS - 2, "#9aa1ab"); traco(MURO * 2 * TS, "#5b6169", [2, 14]); traco(MURO * 2 * TS - 6, TINTA); traco(MURO * 2 * TS - 8, "#4a9e3f");
  // nas curvas: a caixa de brita, a barreira de pneus do lado de fora e a zebra vermelha e branca
  for (const [a, b] of PISTA.curvas) {
    caminho(c, a - 6, b + 6); traco(MURO * 2 * TS - 8, brita);
    caminho(c, a, b); traco((ASFALTO + ZEBRA) * 2 * TS + 2, TINTA); traco((ASFALTO + ZEBRA) * 2 * TS, "#f4f4f0"); traco((ASFALTO + ZEBRA) * 2 * TS, "#e10600", [8, 8]);
  }
  caminho(c, 0, PISTA.N); c.closePath();
  traco(ASFALTO * 2 * TS + 4, "#f4f4f0"); traco(ASFALTO * 2 * TS, asfalto);
  // a borracha da linha de corrida e as emendas do asfalto
  traco(22, "#00000014"); traco(10, "#0000001a"); traco(ASFALTO * 2 * TS - 12, "#ffffff08", [40, 200]);
  c.restore();
  const y0 = (RETA_Y + OY - ASFALTO) * TS, y1 = (RETA_Y + OY + ASFALTO) * TS, alt = y1 - y0;
  // a linha de chegada quadriculada e o grid, com as duas filas desencontradas e os números
  const LX = (LARGADA + OX) * TS;
  for (let k = 0; k < 3; k++) for (let yy = 0; yy < alt; yy += 4) px(c, (k + yy / 4) % 2 ? "#f4f4f0" : "#16161a", LX + k * 4, y0 + yy, 4, Math.min(4, alt - yy));
  c.font = FONTE_PIXEL(7); c.textBaseline = "middle"; c.textAlign = "center";
  for (let k = 0; k < 12; k++) {
    const gx = LX - 16 - k * 22, gy = y0 + (k % 2 ? alt * 0.68 : alt * 0.22);
    px(c, "#f4f4f0", gx, gy - 9, 2, 18); px(c, "#f4f4f0", gx - 12, gy - 9, 12, 2); px(c, "#f4f4f0", gx - 12, gy + 7, 12, 2);
    c.fillStyle = "#f4f4f0aa"; c.fillText(String(k + 1), gx - 20, gy + 0.5);
  }
  // as setas de saída e de entrada do pit, pintadas na pista
  c.fillStyle = "#ffd23f";
  for (const [ax, dir] of [[64, 1], [147, 1]]) { const X = (ax + OX) * TS, Y = y0 - 14; c.beginPath(); c.moveTo(X, Y); c.lineTo(X + 14 * dir, Y + 5); c.lineTo(X, Y + 10); c.fill(); }
  c.textAlign = "left";
  // as placas de patrocínio ao longo da reta, coladas no guard-rail de baixo
  const MARCAS = [["GALERA", "#e10600", "#ffffff"], ["TABBA", "#1b1f24", "#ffd23f"], ["VILA GP", "#1e5bc6", "#ffffff"], ["TRUCO!", "#ffd23f", "#1b1f24"], ["PIT STOP", "#f4f4f0", "#e10600"], ["F1 26", "#00a19c", "#ffffff"]];
  const placas = (xa, xb, Y) => { let k = 0; for (let X = xa; X + 44 <= xb; X += 48, k++) { const [txt, f, t] = MARCAS[k % MARCAS.length]; caixa(c, X, Y, 44, 9, f); letreiro(c, txt, X + 22, Y + 5, 40, 8, t); } };
  placas((60 + OX) * TS, (160 + OX) * TS, (RETA_Y + OY + MURO) * TS - 5);
  placas((62 + OX) * TS, (150 + OX) * TS, (30 + OY - MURO) * TS - 7);
}

// ---------- os prédios ----------
function vidro(c, X, Y, W, H, seed, gente) { // uma fachada de vidro com os caixilhos, o reflexo e, lá dentro, as mesas e a turma
  px(c, TINTA, X - 1, Y - 1, W + 2, H + 2); px(c, "#6fb3dd", X, Y, W, H); px(c, "#9bd0ee", X, Y, W, Math.ceil(H * 0.35)); px(c, "#4a8fbd", X, Y + H - 3, W, 3);
  if (gente) for (let x = X + 5; x < X + W - 8; x += 11) { const r = hash(x, Y, seed); if (r % 4 === 0) continue; px(c, "#5a3b22", x - 2, Y + H - 6, 9, 2); px(c, PELES[r % 5], x, Y + H - 11, 2, 2); px(c, CAMISAS[(r >>> 3) % 10], x - 1, Y + H - 9, 4, 3); if (r % 3) { px(c, PELES[(r >>> 6) % 5], x + 5, Y + H - 11, 2, 2); px(c, CAMISAS[(r >>> 9) % 10], x + 4, Y + H - 9, 4, 3); } }
  for (let x = X + 15; x < X + W - 4; x += 16) px(c, "#2b3340", x, Y, 1, H);
  for (let k = 0; k < W; k += 37) { const r = hash(X + k, Y, seed) % 12; c.fillStyle = "#ffffff38"; c.beginPath(); c.moveTo(X + k + r + 8, Y); c.lineTo(X + k + r + 13, Y); c.lineTo(X + k + r + 5, Y + H); c.lineTo(X + k + r, Y + H); c.fill(); }
}
function portaVidro(c, g, Y, H, cor) { // as portas de correr, com o toldo na cor do jogo
  for (const d of g.doors) { const X = d * TS; px(c, TINTA, X, Y - 1, TS, H + 1); px(c, "#bfe3f5", X + 1, Y, TS - 2, H); px(c, "#8cc4e4", X + 1, Y + H - 5, TS - 2, 5); px(c, "#ffffff", X + 3, Y + 2, 2, H - 8); }
  const X0 = g.doors[0] * TS, W = g.doors.length * TS;
  if (g.doors.length > 1) px(c, TINTA, X0 + TS - 1, Y, 2, H);
  px(c, TINTA, X0 - 4, Y - 7, W + 8, 7); px(c, cor, X0 - 3, Y - 6, W + 6, 5); px(c, claro(cor, 0.4), X0 - 3, Y - 6, W + 6, 1);
  for (let x = X0 - 3; x < X0 + W + 3; x += 6) px(c, "#ffffff", x, Y - 4, 3, 3);
}
function vasinho(c, X, Y) { px(c, TINTA, X - 1, Y + 5, 8, 7); px(c, "#d9dde2", X, Y + 6, 6, 5); px(c, TINTA, X - 2, Y - 3, 10, 9); px(c, "#2f8f3e", X - 1, Y - 2, 8, 7); px(c, "#57b94f", X, Y - 2, 4, 3); }
// os pavilhões (a Carreira, o Leilão, o Ginásio, o Centro de Mídia): telhado branco abaulado com o nome pintado e a fachada de vidro
function drawPavilhao(c, g) {
  const X = g.x * TS, Y = g.y * TS, W = g.w * TS, H = g.h * TS, FH = 30, RY = Y - 8, RH = H - FH + 8, cor = g.roof && g.roof !== "#fffaf0" ? g.roof : "#e10600", ac = acentoDe(g);
  sombra(c, X, RY + 6, W, H + 2, 6);
  // a fachada
  px(c, TINTA, X - 1, Y + H - FH, W + 2, FH + 1); px(c, "#e9ecf0", X, Y + H - FH, W, FH); px(c, "#aeb4bd", X, Y + H - 3, W, 3);
  vidro(c, X + 4, Y + H - FH + 6, W - 8, FH - 11, g.x, W > 100);
  if (g.doors) portaVidro(c, g, Y + H - 22, 22, cor);
  if (W > 60) { vasinho(c, X + 6, Y + H - 12); vasinho(c, X + W - 12, Y + H - 12); }
  // o telhado
  px(c, TINTA, X - 3, RY - 1, W + 6, RH + 2); px(c, "#f3f5f8", X - 2, RY, W + 4, RH);
  px(c, "#ffffff", X - 2, RY, W + 4, 3); px(c, "#dfe3e9", X - 2, RY + RH * 0.62, W + 4, RH * 0.38 - 5); px(c, "#c9cfd7", X - 2, RY + RH - 9, W + 4, 4);
  for (let x = X + 14; x < X + W - 4; x += 16) { px(c, "#d3d8df", x, RY + 2, 1, RH - 8); px(c, "#ffffff", x + 1, RY + 2, 1, RH - 8); }
  px(c, TINTA, X - 3, RY + RH - 6, W + 6, 1); px(c, cor, X - 2, RY + RH - 5, W + 4, 5); px(c, claro(cor, 0.35), X - 2, RY + RH - 5, W + 4, 1); // a testeira na cor do jogo
  if (g.cruz) { const cx = X + W / 2, cy = RY + RH / 2 - 3; px(c, "#e10600", cx - 4, cy - 12, 8, 24); px(c, "#e10600", cx - 12, cy - 4, 24, 8); }
  else if (g.logo && W > 60) { // o nome pintado no telhado, numa placa
    const lw = Math.min(W - 24, 170), lh = Math.min(RH - 20, 30), lx = X + W / 2 - lw / 2, ly = RY + (RH - 6) / 2 - lh / 2;
    px(c, TINTA, lx - 1, ly - 1, lw + 2, lh + 2); px(c, "#1b1f24", lx, ly, lw, lh); px(c, cor, lx, ly, lw, 3); px(c, cor, lx, ly + lh - 3, lw, 3);
    letreiro(c, g.logo, X + W / 2, ly + lh / 2 + 1, lw - 10, lh - 8, "#ffffff");
  }
  // os ar-condicionados e a parabólica
  caixa(c, X + 5, RY + 5, 9, 7, "#aab0b9", 2); px(c, "#5b6169", X + 7, RY + 8, 5, 2);
  if (W > 100) { caixa(c, X + W - 16, RY + 5, 9, 7, "#aab0b9", 2); c.fillStyle = TINTA; c.beginPath(); c.arc(X + W - 28, RY + 9, 6, 0, 7); c.fill(); c.fillStyle = "#e9ecf0"; c.beginPath(); c.arc(X + W - 28, RY + 9, 5, 0, 7); c.fill(); px(c, "#5b6169", X + W - 29, RY + 8, 3, 3); px(c, ac, X + W - 26, RY + 5, 2, 2); }
}
// a torre de controle da prova: o fuste de vidro, a cabine larga lá em cima e a antena
function drawTorreControle(c, p) {
  const X = p.x * TS, Y = p.y * TS, W = p.w * TS, H = p.h * TS, base = Y + H;
  sombra(c, X + 10, Y + 20, W - 16, H - 20, 8);
  px(c, TINTA, X + 15, Y - 31, W - 30, H + 31); px(c, "#dfe3e9", X + 16, Y - 30, W - 32, H + 29);
  for (let yy = Y - 26; yy < base - 20; yy += 13) { px(c, "#5fa6d6", X + 18, yy, W - 36, 9); px(c, "#9bd0ee", X + 18, yy, W - 36, 3); px(c, "#3f82b3", X + W - 30, yy, 12, 9); for (let x = X + 28; x < X + W - 22; x += 12) px(c, "#2b3340", x, yy, 1, 9); }
  px(c, "#aeb4bd", X + W - 22, Y - 30, 6, H + 29);
  px(c, TINTA, X + W / 2 - 9, base - 18, 18, 17); px(c, "#bfe3f5", X + W / 2 - 8, base - 17, 16, 16); px(c, TINTA, X + W / 2 - 1, base - 17, 2, 16);
  // a cabine
  px(c, TINTA, X + 3, Y - 61, W - 6, 32); px(c, "#f3f5f8", X + 4, Y - 60, W - 8, 30); px(c, "#1b2a3a", X + 6, Y - 52, W - 12, 13); px(c, "#3f82b3", X + 6, Y - 52, W - 12, 4);
  for (let x = X + 16; x < X + W - 8; x += 11) px(c, "#f3f5f8", x, Y - 52, 1, 13);
  px(c, "#e10600", X + 4, Y - 37, W - 8, 6); letreiro(c, "DIREÇÃO DE PROVA", X + W / 2, Y - 33.5, W - 12, 6, "#ffffff");
  px(c, "#c9cfd7", X + 4, Y - 60, W - 8, 3);
  px(c, TINTA, X + W / 2 - 1, Y - 82, 3, 22); px(c, "#aab0b9", X + W / 2, Y - 81, 1, 21); caixa(c, X + W / 2 - 8, Y - 70, 6, 4, "#e9ecf0"); caixa(c, X + W / 2 + 4, Y - 75, 6, 4, "#e9ecf0");
}
// as tendas da Fan Zone: lona branca em pirâmide, a barra e a ponta na cor do jogo e o balcão aberto na frente
function drawTenda(c, g) {
  const X = g.x * TS, Y = g.y * TS, W = g.w * TS, H = g.h * TS, FH = 20, RY = Y - 6, RH = H - FH + 6, cor = g.roof === "#fffaf0" || g.roof === "#f4f4f4" ? "#e10600" : g.roof, n = g.w >= 8 ? 2 : 1, sw = W / n;
  sombra(c, X, RY + 8, W, H, 5);
  // o balcão: o fundo escuro, o pano na cor do jogo e os postes
  px(c, TINTA, X + 1, Y + H - FH - 1, W - 2, FH + 1); px(c, "#262a33", X + 2, Y + H - FH, W - 4, FH - 1);
  px(c, cor, X + 2, Y + H - 9, W - 4, 8); px(c, escuro(cor, 0.3), X + 2, Y + H - 3, W - 4, 2); px(c, "#f4f4f0", X + 2, Y + H - 10, W - 4, 2);
  for (let x = X + 6; x < X + W - 8; x += 9) { const r = hash(x, g.y, 4); px(c, ["#ffd23f", "#f4f4f0", "#e10600", "#57b94f"][r % 4], x, Y + H - 14, 4, 4); } // as coisas em cima do balcão
  if (g.doors) for (const d of g.doors) { px(c, "#3a3f4a", d * TS, Y + H - FH, TS, FH - 1); px(c, "#c8102e", d * TS + 2, Y + H - 4, TS - 4, 3); }
  px(c, "#e9ecf0", X + 1, Y + H - FH, 2, FH - 1); px(c, "#e9ecf0", X + W - 3, Y + H - FH, 2, FH - 1);
  // a lona
  for (let k = 0; k < n; k++) {
    const x0 = X + k * sw - 2, x1 = X + (k + 1) * sw + 2, cx = (x0 + x1) / 2, cy = RY + RH * 0.42, y1 = RY + RH;
    const tri = (cor2, ...p) => { c.fillStyle = cor2; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[2], p[3]); c.lineTo(p[4], p[5]); c.fill(); };
    px(c, TINTA, x0 - 1, RY - 1, x1 - x0 + 2, RH + 2);
    tri("#ffffff", x0, RY, x1, RY, cx, cy); tri("#eceff3", x0, RY, cx, cy, x0, y1); tri("#cfd5dd", x1, RY, x1, y1, cx, cy); tri("#dde1e7", x0, y1, x1, y1, cx, cy);
    c.strokeStyle = cor; c.lineWidth = 2; c.beginPath(); for (const [ex, ey] of [[x0, RY], [x1, RY], [x0, y1], [x1, y1]]) { c.moveTo(cx, cy); c.lineTo(ex, ey); } c.stroke();
    px(c, TINTA, cx - 3, cy - 3, 6, 6); px(c, cor, cx - 2, cy - 2, 4, 4); px(c, claro(cor, 0.5), cx - 2, cy - 2, 2, 2);
  }
  // a barra de baixo, recortada
  px(c, TINTA, X - 3, RY + RH - 1, W + 6, 7); px(c, cor, X - 2, RY + RH, W + 4, 5); px(c, claro(cor, 0.35), X - 2, RY + RH, W + 4, 1);
  for (let x = X - 2; x < X + W + 2; x += 6) px(c, "#ffffff", x + 1, RY + RH + 3, 3, 2);
}
function drawTendaEnfeite(c, [x, y, w, h, cor]) { drawTenda(c, { x, y, w, h, roof: cor }); }
// o piso de cada quadra aberta
function superficie(c, g, X, Y, W, H) {
  const linha = "#ffffffd0", meio = X + W / 2;
  if (g.id === "tenis") { px(c, "#2f7d4f", X, Y, W, H); px(c, "#2f6aa8", X + 8, Y + 5, W - 16, H - 10); c.fillStyle = linha; c.fillRect(X + 8, Y + 5, W - 16, 1); c.fillRect(X + 8, Y + H - 6, W - 16, 1); c.fillRect(X + 8, Y + 5, 1, H - 10); c.fillRect(X + W - 9, Y + 5, 1, H - 10); c.fillRect(X + 8, Y + 10, W - 16, 1); c.fillRect(X + 8, Y + H - 11, W - 16, 1); c.fillRect(X + 30, Y + H / 2, W - 60, 1); px(c, TINTA, meio - 1, Y + 2, 2, H - 4); px(c, "#ffffff", meio - 1, Y + 2, 2, 1); px(c, "#d7ff3f", meio + 22, Y + 14, 2, 2); }
  else if (g.id === "futevolei") { px(c, "#ecd9a6", X, Y, W, H); for (let i = 0; i < 40; i++) { const r = hash(i, g.x, 8); px(c, i % 2 ? "#d9c28a" : "#f7ebc6", X + r % W, Y + (r >>> 8) % H, 2, 1); } c.fillStyle = "#2f6aa8"; c.fillRect(X + 10, Y + 5, W - 20, 1); c.fillRect(X + 10, Y + H - 6, W - 20, 1); c.fillRect(X + 10, Y + 5, 1, H - 10); c.fillRect(X + W - 11, Y + 5, 1, H - 10); px(c, TINTA, meio - 1, Y + 1, 2, H - 2); px(c, "#ffd23f", meio - 1, Y + 1, 2, 2); px(c, "#ffd23f", meio - 1, Y + H - 3, 2, 2); px(c, "#ffffff", meio - 30, Y + 16, 3, 3); px(c, "#e10600", meio - 29, Y + 17); }
  else { const hax = g.id === "haxball"; for (let x = 0; x < W; x += 10) px(c, (x / 10) % 2 ? (hax ? "#3f8f55" : "#3aa04e") : (hax ? "#378349" : "#339446"), X + x, Y, Math.min(10, W - x), H);
    c.fillStyle = linha; c.fillRect(X + 4, Y + 3, W - 8, 1); c.fillRect(X + 4, Y + H - 4, W - 8, 1); c.fillRect(X + 4, Y + 3, 1, H - 6); c.fillRect(X + W - 5, Y + 3, 1, H - 6); c.fillRect(meio, Y + 3, 1, H - 6);
    c.strokeStyle = linha; c.lineWidth = 1; c.beginPath(); c.arc(meio + 0.5, Y + H / 2, 8, 0, 7); c.stroke(); c.strokeRect(X + 4.5, Y + H / 2 - 9.5, 12, 19); c.strokeRect(X + W - 16.5, Y + H / 2 - 9.5, 12, 19);
    caixa(c, X + 1, Y + H / 2 - 6, 3, 12, "#f4f4f0"); caixa(c, X + W - 4, Y + H / 2 - 6, 3, 12, "#f4f4f0");
    if (hax) { for (const [dx, dy, cor] of [[-30, -6, "#e53935"], [-18, 8, "#e53935"], [26, -4, "#1e88e5"], [14, 9, "#1e88e5"]]) { c.fillStyle = TINTA; c.beginPath(); c.arc(meio + dx, Y + H / 2 + dy, 4, 0, 7); c.fill(); c.fillStyle = cor; c.beginPath(); c.arc(meio + dx, Y + H / 2 + dy, 3, 0, 7); c.fill(); } px(c, "#ffffff", meio - 2, Y + H / 2 - 2, 4, 4); }
    else { px(c, TINTA, meio + 9, Y + H / 2 + 3, 5, 5); px(c, "#ffffff", meio + 10, Y + H / 2 + 4, 3, 3); } }
}
// as quadras: a arquibancadinha em cima, o piso, o alambrado em volta, os refletores nos cantos e o portão embaixo
function drawQuadra(c, g) {
  const X = g.x * TS, Y = g.y * TS, W = g.w * TS, H = g.h * TS, ac = acentoDe(g);
  sombra(c, X, Y, W, H, 4);
  px(c, TINTA, X - 1, Y - 1, W + 2, H + 2); px(c, "#8d949e", X, Y, W, H);
  for (let r = 0; r < 2; r++) { px(c, r ? "#7a818b" : "#99a0aa", X + 2, Y + 2 + r * 6, W - 4, 6); for (let x = X + 4; x < X + W - 6; x += 5) { const h = hash(x, g.y + r, 6); if (h % 5) pessoinha(c, x, Y + 2 + r * 6, h); } }
  px(c, TINTA, X + 2, Y + 14, W - 4, H - 34); superficie(c, g, X + 3, Y + 15, W - 6, H - 36);
  // o alambrado da frente, com a faixa do jogo e o portão
  px(c, TINTA, X, Y + H - 20, W, 20); px(c, "#59606b", X + 1, Y + H - 19, W - 2, 18);
  for (let x = X + 3; x < X + W - 2; x += 4) px(c, "#7d848e", x, Y + H - 18, 1, 16);
  px(c, ac, X + 1, Y + H - 19, W - 2, 4); px(c, claro(ac, 0.4), X + 1, Y + H - 19, W - 2, 1);
  for (const d of g.doors) { px(c, TINTA, d * TS, Y + H - 15, TS, 15); px(c, "#2b2f36", d * TS + 1, Y + H - 14, TS - 2, 13); px(c, ac, d * TS + 1, Y + H - 14, TS - 2, 2); }
  for (const x of [X - 1, X + W - 3]) { px(c, TINTA, x, Y - 12, 4, 14); px(c, "#aab0b9", x + 1, Y - 11, 2, 12); px(c, TINTA, x - 2, Y - 16, 8, 6); px(c, "#fff3c4", x - 1, Y - 15, 6, 4); } // os refletores
}
// o que cada hangar tem pintado no telhado
function arteHangar(c, g, cx, cy) {
  if (g.id === "tiro") { for (const [r, cor] of [[13, "#f4f4f0"], [10, "#e10600"], [7, "#f4f4f0"], [4, "#e10600"]]) { c.fillStyle = cor; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fill(); } }
  else if (g.id === "rocket") { c.fillStyle = TINTA; c.beginPath(); c.arc(cx, cy, 12, 0, 7); c.fill(); c.fillStyle = "#f4f4f0"; c.beginPath(); c.arc(cx, cy, 11, 0, 7); c.fill(); px(c, "#1b1f24", cx - 3, cy - 3, 6, 6); px(c, "#1e5bc6", cx - 40, cy - 6, 14, 12); px(c, "#ff8000", cx + 26, cy - 6, 14, 12); }
  else if (g.id === "batalha") { for (const [dx, dy, cor] of [[-14, 0, "#e10600"], [0, -4, "#ffd23f"], [14, 0, "#1e88e5"]]) { c.fillStyle = TINTA; c.beginPath(); c.arc(cx + dx, cy + dy, 8, 0, 7); c.fill(); c.fillStyle = cor; c.beginPath(); c.arc(cx + dx, cy + dy, 7, 0, 7); c.fill(); px(c, "#ffffff", cx + dx - 3, cy + dy - 4, 2, 2); } }
  else { px(c, "#1b1f24", cx - 44, cy - 9, 88, 18); for (let k = 0; k < 4; k++) px(c, "#f4f4f0", cx - 44, cy - 9 + k * 6 - 1 + 3, 88, 1); for (const [dx, cor] of [[-30, "#ff3b6b"], [-10, "#ffd23f"], [10, "#ffd23f"], [30, "#2ee06a"]]) px(c, cor, cx + dx - 2, cy - 2, 4, 4); }
}
// os hangares da velocidade: telha ondulada, a faixa na cor do jogo e o portão de enrolar
function drawHangar(c, g) {
  const X = g.x * TS, Y = g.y * TS, W = g.w * TS, H = g.h * TS, FH = 28, RY = Y - 6, RH = H - FH + 6, ac = acentoDe(g);
  sombra(c, X, RY + 6, W, H, 6);
  px(c, TINTA, X - 1, Y + H - FH, W + 2, FH + 1); px(c, "#8a919b", X, Y + H - FH, W, FH); for (let x = X + 2; x < X + W; x += 4) px(c, "#7a818b", x, Y + H - FH, 1, FH);
  const dx0 = g.doors[0] * TS - 14, dw = g.doors.length * TS + 28;
  px(c, TINTA, dx0 - 1, Y + H - 23, dw + 2, 23); px(c, "#3a3f4a", dx0, Y + H - 22, dw, 22); for (let yy = Y + H - 20; yy < Y + H - 1; yy += 3) px(c, "#4c525e", dx0, yy, dw, 1);
  px(c, "#16181d", g.doors[0] * TS, Y + H - 14, g.doors.length * TS, 14);
  for (let x = dx0; x < dx0 + dw; x += 8) { px(c, "#ffd23f", x, Y + H - 3, 4, 3); px(c, "#1b1f24", x + 4, Y + H - 3, 4, 3); }
  px(c, TINTA, X - 3, RY - 1, W + 6, RH + 2); px(c, "#b7bec7", X - 2, RY, W + 4, RH);
  for (let x = X - 2; x < X + W + 2; x += 4) { px(c, "#cdd3da", x, RY, 2, RH); px(c, "#9aa1ab", x + 3, RY, 1, RH); }
  px(c, "#e9ecf0", X - 2, RY + RH / 2 - 1, W + 4, 2); px(c, "#8a919b", X - 2, RY + RH / 2 + 1, W + 4, 1);
  arteHangar(c, g, X + W / 2, RY + RH / 2 - 2);
  px(c, TINTA, X - 3, RY + RH - 7, W + 6, 1); px(c, ac, X - 2, RY + RH - 6, W + 4, 6); px(c, claro(ac, 0.4), X - 2, RY + RH - 6, W + 4, 1);
}
// o bico de um F1 visto de frente, dentro da garagem
function carroDeFrente(c, cx, base, cor, cor2) {
  px(c, "#16161a", cx - 13, base - 8, 5, 8); px(c, "#16161a", cx + 8, base - 8, 5, 8); px(c, "#3a3a40", cx - 12, base - 7, 3, 2); px(c, "#3a3a40", cx + 9, base - 7, 3, 2);
  px(c, cor2, cx - 14, base - 3, 28, 2); px(c, cor, cx - 6, base - 10, 12, 8); px(c, claro(cor, 0.3), cx - 6, base - 10, 12, 2); px(c, cor, cx - 2, base - 5, 4, 4);
  px(c, "#16161a", cx - 3, base - 13, 6, 4); px(c, "#ffd23f", cx - 2, base - 15, 4, 3); px(c, cor2, cx - 9, base - 17, 18, 2); px(c, TINTA, cx - 9, base - 17, 1, 6); px(c, TINTA, cx + 8, base - 17, 1, 6);
}
// os boxes: a laje branca com a faixa e o número, a porta vermelha levantada e o carro lá dentro
function drawBox(c, g) {
  const X = g.x * TS, Y = g.y * TS, W = g.w * TS, H = g.h * TS, FH = 30, RY = Y - 4, RH = H - FH + 4, cor = g.roof, ac = acentoDe(g);
  px(c, TINTA, X, Y + H - FH, W, FH + 1); px(c, "#eef0f3", X + 1, Y + H - FH, W - 2, FH);
  px(c, "#14161b", X + 6, Y + H - 25, W - 12, 25); px(c, "#23262e", X + 6, Y + H - 6, W - 12, 6);
  carroDeFrente(c, X + W / 2, Y + H - 2, cor, ac === cor ? "#f4f4f0" : ac);
  caixa(c, X + 9, Y + H - 12, 8, 9, "#e10600", 2); px(c, "#16161a", X + W - 20, Y + H - 9, 10, 8); px(c, "#3a3a40", X + W - 18, Y + H - 7, 6, 1); px(c, "#3a3a40", X + W - 18, Y + H - 4, 6, 1); // o carrinho de ferramentas e os pneus
  px(c, TINTA, X + 5, Y + H - 26, W - 10, 8); px(c, "#d81e1e", X + 6, Y + H - 25, W - 12, 6); for (let x = X + 6; x < X + W - 6; x += 3) px(c, "#a51313", x, Y + H - 25, 1, 6); px(c, "#ff6a5a", X + 6, Y + H - 25, W - 12, 1);
  px(c, "#c9cfd7", X + 1, Y + H - FH, 5, FH); px(c, "#c9cfd7", X + W - 6, Y + H - FH, 5, FH);
  px(c, TINTA, X - 1, RY - 1, W + 2, RH + 2); px(c, "#f3f5f8", X, RY, W, RH); px(c, "#ffffff", X, RY, W, 3); px(c, "#dfe3e9", X, RY + RH - 16, W, 6);
  px(c, "#d3d8df", X + W - 1, RY, 1, RH); for (let yy = RY + 10; yy < RY + RH - 14; yy += 10) px(c, "#e3e7ec", X + 2, yy, W - 4, 1);
  caixa(c, X + W - 22, RY + 6, 12, 9, "#aab0b9", 2); c.fillStyle = "#5b6169"; c.beginPath(); c.arc(X + W - 16, RY + 11, 3, 0, 7); c.fill();
  px(c, TINTA, X, RY + RH - 11, W, 1); px(c, cor, X, RY + RH - 10, W, 10); px(c, claro(cor, 0.4), X, RY + RH - 10, W, 1); px(c, escuro(cor, 0.3), X, RY + RH - 2, W, 2);
  caixa(c, X + 5, RY + 5, 18, 16, "#1b1f24"); letreiro(c, String(g.numero), X + 14, RY + 14, 16, 13, "#ffffff");
}
// as arquibancadas. Cada uma guarda em TORCIDAS o retângulo dos degraus, para a torcida pular em gp-vida.js.
const TORCIDAS = [];
function assentos(t, cada) { // percorre os lugares ocupados: cada(x, y, sorteio)
  for (let r = 0; r * 6 + 6 <= t.h; r++) for (let k = 0; k * 5 + 4 <= t.w; k++) {
    if ((k * 5) % 70 > 60) continue; // as escadas
    const h = hash(k + t.seed, r, 12); if (h % 9 === 0) continue;
    cada(t.x + k * 5, t.y + r * 6, h, k, r);
  }
}
function tribuna(c, X, Y, W, H, lado, seed, opts = {}) {
  const RH = opts.RH || 40, CH = H - RH - (opts.FH || 0), cy = lado === "n" ? Y : Y + RH, ry = lado === "n" ? Y + CH : Y;
  sombra(c, X, Y, W, H, 6);
  px(c, TINTA, X - 1, Y - 1, W + 2, H + 2);
  for (let r = 0; r * 6 < CH; r++) { px(c, r % 2 ? "#858c97" : "#949ba6", X, cy + r * 6, W, 6); px(c, "#6d747f", X, cy + r * 6 + 5, W, 1); }
  for (let x = 62; x < W - 4; x += 70) { px(c, "#c9cfd7", X + x, cy, 8, CH); for (let yy = cy; yy < cy + CH; yy += 3) px(c, "#ffd23f", X + x, yy, 8, 1); }
  const t = { x: X + 2, y: cy + 1, w: W - 4, h: CH - 2, seed, lado }; TORCIDAS.push(t);
  assentos(t, (x, y, h) => pessoinha(c, x, y, h));
  // a cobertura: branca, com as treliças e a borda vermelha do lado da pista
  px(c, TINTA, X - 3, ry - 1, W + 6, RH + 2); px(c, "#f3f5f8", X - 2, ry, W + 4, RH); px(c, "#ffffff", X - 2, ry, W + 4, 3); px(c, "#d7dce3", X - 2, ry + RH - 8, W + 4, 8);
  for (let x = X + 14; x < X + W; x += 32) { px(c, "#c3c9d1", x, ry + 2, 2, RH - 4); px(c, "#ffffff", x + 2, ry + 2, 1, RH - 4); }
  px(c, "#e10600", X - 2, lado === "n" ? ry : ry + RH - 4, W + 4, 4); px(c, "#00000030", X, lado === "n" ? ry - 3 : ry + RH + 1, W, 3);
  return { ry, RH };
}
function drawArquibancada(c, a) { tribuna(c, a.x * TS, a.y * TS, a.w * TS, a.h * TS, a.lado, a.x * 7 + a.y, { RH: a.h > 5 ? 40 : 30 }); }
// a tribuna principal (a Corrida): a torcida de frente para a reta, a cobertura com o nome do GP e a fachada com as portas
function drawAutodromo(c, g) {
  const X = g.x * TS, Y = g.y * TS, W = g.w * TS, H = g.h * TS, FH = 32;
  const { ry, RH } = tribuna(c, X, Y, W, H, "n", 991, { RH: 44, FH });
  px(c, "#1b1f24", X + 40, ry + 9, W - 80, RH - 20); px(c, "#e10600", X + 40, ry + 9, W - 80, 3); px(c, "#e10600", X + 40, ry + RH - 14, W - 80, 3);
  letreiro(c, g.logo, X + W / 2, ry + RH / 2 - 1, W - 100, 18, "#ffffff");
  for (const x of [X + 8, X + W - 32]) for (let k = 0; k < 3; k++) for (let j = 0; j < 4; j++) px(c, (k + j) % 2 ? "#f4f4f0" : "#16161a", x + j * 6, ry + 10 + k * 6, 6, 6); // as bandeiras quadriculadas
  const fy = Y + H - FH;
  px(c, TINTA, X - 1, fy, W + 2, FH + 1); px(c, "#e9ecf0", X, fy, W, FH); px(c, "#aeb4bd", X, Y + H - 3, W, 3);
  vidro(c, X + 6, fy + 6, W - 12, FH - 12, 77, true);
  for (let x = X + 46; x < X + W - 40; x += 96) { px(c, TINTA, x - 1, fy + 1, 14, FH - 2); px(c, "#e10600", x, fy + 2, 12, FH - 4); px(c, "#ffffff", x + 4, fy + 6, 4, FH - 12); }
  portaVidro(c, g, Y + H - 24, 24, "#e10600");
}
function drawBuilding(c, g) { ({ tenda: drawTenda, quadra: drawQuadra, hangar: drawHangar, box: drawBox, autodromo: drawAutodromo }[g.estilo] || drawPavilhao)(c, g); }
function drawPredio(c, p) { (p.estilo === "torre" ? drawTorreControle : drawPavilhao)(c, p); }

// ---------- os enfeites ----------
// o heliponto: o piso verde com o círculo e o H; o helicóptero fica em gp-vida.js (ele decola)
function drawHeli(c) {
  const X = HELI.x * TS, Y = HELI.y * TS, W = HELI.w * TS, H = HELI.h * TS, cx = X + W / 2, cy = Y + H / 2;
  px(c, TINTA, X - 1, Y - 1, W + 2, H + 2); px(c, "#4d5560", X, Y, W, H); px(c, "#5b646f", X, Y, W, 3);
  for (let x = X; x < X + W; x += 12) { px(c, "#ffd23f", x, Y, 6, 2); px(c, "#ffd23f", x, Y + H - 2, 6, 2); }
  c.fillStyle = "#2f8f5a"; c.beginPath(); c.arc(cx, cy, 50, 0, 7); c.fill();
  c.strokeStyle = "#ffd23f"; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, 44, 0, 7); c.stroke(); c.strokeStyle = "#f4f4f0"; c.lineWidth = 1; c.beginPath(); c.arc(cx, cy, 49, 0, 7); c.stroke();
  px(c, "#f4f4f0", cx - 16, cy - 20, 8, 40); px(c, "#f4f4f0", cx + 8, cy - 20, 8, 40); px(c, "#f4f4f0", cx - 16, cy - 4, 32, 8);
  for (const [dx, dy] of [[-56, -56], [52, -56], [-56, 52], [52, 52]]) { px(c, TINTA, cx + dx - 1, cy + dy - 1, 6, 6); px(c, "#ff3b2f", cx + dx, cy + dy, 4, 4); }
}
const HELI_POS = () => [(HELI.x + HELI.w / 2) * TS, (HELI.y + HELI.h / 2) * TS];
// o caminhão de equipe: a cabine e a carreta com a faixa (8 x 2 casas)
function drawCaminhao(c, [x, y, cor]) {
  const X = x * TS, Y = y * TS;
  sombra(c, X + 2, Y + 4, 124, 26, 4);
  caixa(c, X + 2, Y, 26, 28, cor, 3, 4); px(c, "#9bd0ee", X + 4, Y + 4, 8, 20); px(c, "#6fb3dd", X + 4, Y + 16, 8, 8); px(c, TINTA, X + 12, Y + 4, 1, 20);
  caixa(c, X + 30, Y - 2, 96, 32, "#f3f5f8", 3, 5); px(c, cor, X + 30, Y + 10, 96, 9); px(c, claro(cor, 0.4), X + 30, Y + 10, 96, 1); letreiro(c, "GALERA RACING", X + 78, Y + 15, 80, 8, "#ffffff", escuro(cor, 0.5));
  for (const wx of [8, 40, 100, 112]) { px(c, TINTA, X + wx, Y + 27, 9, 5); px(c, "#3a3a40", X + wx + 2, Y + 28, 5, 2); }
}
function drawCarroParado(c, [x, y, cor]) { // um carro de passeio visto de cima (1 x 2 casas)
  const X = x * TS + 2, Y = y * TS + 2;
  px(c, "#0c1a1240", X + 2, Y + 3, 12, 26);
  px(c, TINTA, X, Y, 12, 28); px(c, cor, X + 1, Y + 1, 10, 26); px(c, claro(cor, 0.35), X + 1, Y + 1, 3, 26);
  px(c, "#1b2a3a", X + 2, Y + 6, 8, 5); px(c, "#6fb3dd", X + 2, Y + 6, 8, 2); px(c, "#1b2a3a", X + 2, Y + 18, 8, 4); px(c, escuro(cor, 0.2), X + 2, Y + 11, 8, 7);
  px(c, "#fff3c4", X + 1, Y + 1, 3, 1); px(c, "#fff3c4", X + 8, Y + 1, 3, 1); px(c, "#e10600", X + 1, Y + 26, 3, 1); px(c, "#e10600", X + 8, Y + 26, 3, 1);
}
function drawLampPost(c, x, y) { // o poste de refletor
  const X = x * TS, Y = y * TS;
  px(c, "#0c1a1240", X + 5, Y + 13, 9, 3);
  px(c, TINTA, X + 5, Y - 26, 6, 40); px(c, "#aab0b9", X + 6, Y - 25, 4, 38); px(c, "#e9ecf0", X + 6, Y - 25, 1, 38); px(c, TINTA, X + 3, Y + 11, 10, 4); px(c, "#7d848e", X + 4, Y + 12, 8, 2);
  px(c, TINTA, X - 2, Y - 34, 20, 10); px(c, "#3a3f4a", X - 1, Y - 33, 18, 8); for (let k = 0; k < 4; k++) px(c, "#fff3c4", X + k * 4 + 1, Y - 31, 3, 4);
}
function drawPainel(c) { // a moldura do painel de LED (o texto corre em gp-vida.js)
  const X = PAINEL.x * TS, Y = PAINEL.y * TS, W = PAINEL.w * TS;
  px(c, "#0c1a1240", X + 4, Y + 12, W, 4);
  px(c, TINTA, X + 8, Y - 2, 5, 16); px(c, TINTA, X + W - 13, Y - 2, 5, 16); px(c, "#7d848e", X + 9, Y - 1, 3, 14); px(c, "#7d848e", X + W - 12, Y - 1, 3, 14);
  px(c, TINTA, X - 1, Y - 21, W + 2, 24); px(c, "#0d0f12", X, Y - 20, W, 22); px(c, "#e10600", X, Y - 20, W, 2);
}
function drawFoodTruck(c, [x, y, cor, nome]) { // 3 x 2 casas: o balcão aberto, o toldo listrado e a chaminé
  const X = x * TS, Y = y * TS;
  sombra(c, X + 1, Y + 6, 46, 24, 3);
  caixa(c, X + 1, Y + 2, 46, 26, cor, 3, 4); px(c, TINTA, X + 5, Y + 9, 28, 11); px(c, "#262a33", X + 6, Y + 10, 26, 9); px(c, PELES[x % 5], X + 16, Y + 12, 3, 3); px(c, "#f4f4f0", X + 15, Y + 15, 5, 4); px(c, "#f4f4f0", X + 16, Y + 10, 3, 2);
  for (let k = 0; k < 8; k++) px(c, k % 2 ? "#f4f4f0" : claro(cor, 0.5), X + 3 + k * 4, Y + 5, 4, 5); px(c, TINTA, X + 3, Y + 10, 32, 1);
  px(c, "#9bd0ee", X + 37, Y + 9, 8, 8); px(c, TINTA, X + 36, Y + 8, 10, 1);
  for (const wx of [6, 34]) { px(c, TINTA, X + wx, Y + 26, 8, 5); px(c, "#3a3a40", X + wx + 2, Y + 27, 4, 2); }
  letreiro(c, nome, X + 21, Y + 23.5, 40, 6, "#ffffff", escuro(cor, 0.5)); px(c, TINTA, X + 30, Y - 3, 5, 6); px(c, "#7d848e", X + 31, Y - 2, 3, 5);
}
function drawBaseRoda(c) { const X = RODA.x * TS, Y = RODA.y * TS, W = RODA.w * TS, H = RODA.h * TS; sombra(c, X, Y, W, H, 4); caixa(c, X, Y + 6, W, H - 8, "#59606b", 3, 3); px(c, "#e10600", X, Y + 14, W, 3); for (let x = X + 6; x < X + W - 6; x += 10) px(c, "#ffd23f", x, Y + 9, 4, 3); caixa(c, X + W / 2 - 12, Y + H - 16, 24, 14, "#f3f5f8", 2); letreiro(c, "RODA", X + W / 2, Y + H - 8.5, 22, 7, "#e10600"); }
function drawLogoChao(c) { // o brasão pintado no meio da praça
  const cx = LOGO_CHAO.x * TS, cy = LOGO_CHAO.y * TS, R = LOGO_CHAO.r * TS;
  c.fillStyle = "#e10600"; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill(); c.fillStyle = "#f4f4f0"; c.beginPath(); c.arc(cx, cy, R - 5, 0, 7); c.fill();
  c.fillStyle = "#1b1f24"; c.beginPath(); c.arc(cx, cy, R - 9, 0, 7); c.fill();
  for (let k = 0; k < 24; k++) { const a = (k * Math.PI) / 12; px(c, k % 2 ? "#f4f4f0" : "#1b1f24", Math.round(cx + Math.cos(a) * (R - 7)) - 1, Math.round(cy + Math.sin(a) * (R - 7)) - 1, 3, 3); }
  letreiro(c, "VILA", cx, cy - 16, R * 1.2, 22, "#ffffff"); letreiro(c, "GRANDE PRÊMIO", cx, cy + 4, R * 1.4, 12, "#ffd23f"); letreiro(c, "DA GALERA", cx, cy + 20, R * 1.2, 12, "#e10600");
}
function drawCanteiro(c, [x, y, w]) { // a sebe aparada, em gomos
  const X = x * TS, Y = y * TS, W = w * TS;
  px(c, "#0c1a1240", X + 2, Y + 12, W, 4); px(c, TINTA, X, Y + 9, W, 6); px(c, "#8a6a45", X + 1, Y + 10, W - 2, 4);
  for (let k = 0; k < w; k++) { const gx = X + k * TS; px(c, TINTA, gx, Y - 2, TS, 13); px(c, "#2f8f3e", gx + 1, Y - 1, TS - 2, 11); px(c, "#57b94f", gx + 2, Y - 1, TS - 6, 4); px(c, "#1f6a31", gx + 1, Y + 7, TS - 2, 3); px(c, "#84d267", gx + 3, Y, 3, 1); }
}
function drawVaso(c, [x, y]) { const X = x * TS, Y = y * TS; px(c, "#0c1a1240", X + 4, Y + 13, 10, 2); px(c, TINTA, X + 3, Y + 5, 10, 10); px(c, "#e9ecf0", X + 4, Y + 6, 8, 8); px(c, "#aeb4bd", X + 4, Y + 12, 8, 2); c.fillStyle = TINTA; c.beginPath(); c.arc(X + 8, Y + 1, 8, 0, 7); c.fill(); c.fillStyle = "#2f8f3e"; c.beginPath(); c.arc(X + 8, Y + 1, 7, 0, 7); c.fill(); c.fillStyle = "#57b94f"; c.beginPath(); c.arc(X + 6, Y - 1, 4, 0, 7); c.fill(); px(c, "#ff5fa2", X + 9, Y - 2, 2, 2); px(c, "#ffd23f", X + 4, Y + 3, 2, 2); }
function drawCoisa(c, [x, y, tipo]) {
  const X = x * TS, Y = y * TS;
  if (tipo === "pneus") { px(c, "#0c1a1240", X + 3, Y + 13, 12, 2); for (let k = 0; k < 3; k++) { px(c, TINTA, X + 1, Y + 9 - k * 5, 14, 6); px(c, "#2b2b30", X + 2, Y + 10 - k * 5, 12, 4); px(c, "#4a4a52", X + 4, Y + 10 - k * 5, 8, 1); } px(c, ["#e10600", "#ffd23f", "#f4f4f0"][x % 3], X + 5, Y - 1, 6, 1); }
  else if (tipo === "barris") { for (const [dx, cor] of [[0, "#1e5bc6"], [8, "#e10600"]]) { px(c, TINTA, X + dx, Y + 2, 8, 13); px(c, cor, X + dx + 1, Y + 3, 6, 11); px(c, claro(cor, 0.4), X + dx + 1, Y + 3, 2, 11); px(c, TINTA, X + dx + 1, Y + 7, 6, 1); } }
  else if (tipo === "caixas") { caixa(c, X + 1, Y + 5, 14, 9, "#b08a5a", 2, 2); caixa(c, X + 4, Y - 2, 9, 7, "#c79c68", 2); px(c, TINTA, X + 7, Y + 5, 1, 9); }
  else if (tipo === "cone") { px(c, "#0c1a1240", X + 4, Y + 13, 9, 2); px(c, TINTA, X + 3, Y + 11, 10, 4); px(c, "#ff7b2e", X + 4, Y + 12, 8, 2); px(c, TINTA, X + 5, Y + 3, 6, 9); px(c, "#ff7b2e", X + 6, Y + 4, 4, 8); px(c, "#f4f4f0", X + 6, Y + 7, 4, 2); }
  else if (tipo === "banco") { px(c, "#0c1a1240", X + 1, Y + 12, 15, 3); px(c, TINTA, X, Y + 3, 16, 9); px(c, "#b0703a", X + 1, Y + 4, 14, 3); px(c, "#8a5528", X + 1, Y + 8, 14, 3); px(c, TINTA, X + 1, Y + 12, 2, 3); px(c, TINTA, X + 13, Y + 12, 2, 3); }
  else if (tipo === "lixeira") { px(c, "#0c1a1240", X + 5, Y + 13, 9, 2); caixa(c, X + 4, Y + 3, 8, 11, "#2e9e4f", 2, 2); px(c, TINTA, X + 3, Y + 2, 10, 2); px(c, "#f4f4f0", X + 6, Y + 7, 4, 3); }
  else if (tipo === "som") { px(c, "#0c1a1240", X + 4, Y + 13, 11, 2); px(c, TINTA, X + 7, Y - 4, 3, 18); for (const dy of [-22, -10]) { caixa(c, X + 2, Y + dy, 12, 11, "#23262e"); c.fillStyle = "#59606b"; c.beginPath(); c.arc(X + 8, Y + dy + 5.5, 4, 0, 7); c.fill(); px(c, "#16181d", X + 7, Y + dy + 4, 3, 3); } }
}
function drawMastro(c, [x, y]) { const X = x * TS, Y = y * TS; px(c, "#0c1a1240", X + 6, Y + 13, 7, 2); px(c, TINTA, X + 6, Y - 30, 3, 44); px(c, "#e9ecf0", X + 7, Y - 29, 1, 42); px(c, TINTA, X + 4, Y + 12, 7, 3); px(c, "#ffd23f", X + 6, Y - 32, 3, 3); }
function drawPortao(c) { // o portão de serviço do leste: as zebras de aviso e a placa
  const X = PORTAO_LESTE.x * TS, Y = PORTAO_LESTE.y * TS, W = PORTAO_LESTE.w * TS, H = PORTAO_LESTE.h * TS;
  for (let x = X; x < X + W; x += 8) { px(c, "#ffd23f", x, Y - 2, 4, 3); px(c, "#1b1f24", x + 4, Y - 2, 4, 3); px(c, "#ffd23f", x, Y + H - 1, 4, 3); px(c, "#1b1f24", x + 4, Y + H - 1, 4, 3); }
  caixa(c, X + W + 2, Y - 14, 40, 10, "#1b1f24"); letreiro(c, "PISTA ←", X + W + 22, Y - 8.5, 36, 7, "#ffd23f");
}
// a cerca de tela entre a esplanada e a reta
function drawCerca(c, x0, x1, y) { const Y = y * TS; for (let x = x0; x <= x1; x++) { const X = x * TS; px(c, "#7d848e88", X, Y - 10, TS, 9); px(c, "#e9ecf0", X, Y - 11, TS, 1); if ((x & 1) === 0) { px(c, TINTA, X, Y - 12, 2, 13); px(c, "#aab0b9", X, Y - 12, 1, 12); } } }

// o carro de F1 visto de cima, com o bico para a direita (36 x 16): [cor, cor da asa, capacete]
function spriteCarro([cor, cor2, cap = "#ffd23f"]) {
  const cv = document.createElement("canvas"); cv.width = 36; cv.height = 16;
  const c = cv.getContext("2d"), es = escuro(cor, 0.3);
  px(c, "#16161a", 7, 4, 2, 8); px(c, "#16161a", 25, 3, 1, 10); // os braços da suspensão
  for (const [x, y, w, h] of [[4, 0, 8, 4], [4, 12, 8, 4], [23, 1, 6, 3], [23, 12, 6, 3]]) { px(c, "#0d0d10", x, y, w, h); px(c, "#3a3a42", x + 1, y + 1, w - 2, 1); }
  px(c, "#0d0d10", 0, 2, 4, 12); px(c, cor2, 1, 3, 2, 10); px(c, claro(cor2, 0.4), 1, 3, 2, 1); // a asa traseira
  px(c, "#1b1b20", 9, 3, 14, 10); // o assoalho
  px(c, cor, 4, 6, 7, 4); px(c, cor, 10, 4, 12, 8); px(c, es, 10, 11, 12, 1); px(c, claro(cor, 0.35), 10, 4, 12, 1);
  px(c, cor, 21, 6, 6, 4); px(c, cor, 26, 7, 7, 2); px(c, claro(cor, 0.35), 21, 6, 10, 1);
  px(c, "#0d0d10", 32, 1, 3, 14); px(c, cor2, 32, 2, 2, 12); px(c, claro(cor2, 0.4), 32, 2, 2, 1); // a asa da frente
  px(c, "#0d0d10", 14, 5, 7, 6); px(c, cap, 15, 6, 4, 4); px(c, claro(cap, 0.5), 15, 6, 2, 1); px(c, "#1b1b20", 19, 7, 1, 2); px(c, "#2b2b30", 20, 5, 1, 6);
  px(c, cor2, 5, 7, 5, 2);
  return cv;
}
const EQUIPES_F1 = [["#1b2f6b", "#e10600", "#ffd23f", "Touros"], ["#dc0000", "#ffe600", "#f4f4f0", "Escuderia"], ["#ff8000", "#1c1c1c", "#2ee06a", "Papaia"], ["#c8ced4", "#00d2be", "#e10600", "Flechas"],
  ["#006f62", "#cedc00", "#f4f4f0", "Verdão"], ["#0090ff", "#ff87bc", "#ffd23f", "Alpina"], ["#005aff", "#ffffff", "#e10600", "Azulão"], ["#e8e8e8", "#e10600", "#1b1f24", "Brancos"],
  ["#6692ff", "#ffffff", "#ff8000", "Touritos"], ["#8f9399", "#e3001b", "#ffd23f", "Suíços"], ["#1a1a1a", "#c9a227", "#f4f4f0", "Dourados"]];
const SPR_GALERA = spriteCarro(["#f4f4f0", "#e10600", "#1e5bc6"]); // o F1 da Galera, o que se pilota
function drawF1Parado(c, [x, y]) {
  const X = x * TS - 2, Y = y * TS;
  px(c, "#0c1a1240", X + 2, Y + 3, 34, 13); c.drawImage(SPR_GALERA, X, Y);
  px(c, "#ffd23f", X - 1, Y + 17, 38, 1); px(c, "#ffd23f", X - 1, Y - 2, 38, 1);
}

// O mapa é grande demais para um desenho só: ele é desenhado em pedaços de 32 x 32 casas, na hora em que aparecem na
// tela, e os pedaços que ficam muito tempo sem aparecer saem da memória.
const CH = 32, CHP = CH * TS;
const pedacos = new Map();
const toca = (x0, y0, w, h, cx, cy, m = 1) => x0 - m < (cx + 1) * CH && x0 + w + m > cx * CH && y0 - m < (cy + 1) * CH && y0 + h + m > cy * CH;
let vagaOcupada = -1; // a vaga do F1 que está na mão de quem joga (o carro some dali)
function pedaco(cx, cy) {
  const chave = cx + "," + cy; let cv = pedacos.get(chave);
  if (cv) { pedacos.delete(chave); pedacos.set(chave, cv); return cv; }
  cv = document.createElement("canvas"); cv.width = cv.height = CHP;
  const c = cv.getContext("2d"); c.translate(-cx * CHP, -cy * CHP);
  const x0 = cx * CH, y0 = cy * CH, x1 = Math.min(MW, x0 + CH), y1 = Math.min(MH, y0 + CH);
  c.save(); c.beginPath(); c.rect(x0 * TS, y0 * TS, CHP, CHP); c.clip();
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) (CHAO[ground[y][x]] || drawGrass)(c, x, y);
  drawPista(c);
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (ground[y][x] === "k") drawLigacao(c, x, y);
  if (toca(PORTAO_LESTE.x, PORTAO_LESTE.y - 1, PORTAO_LESTE.w + 3, PORTAO_LESTE.h + 2, cx, cy)) drawPortao(c);
  if (toca(LOGO_CHAO.x - LOGO_CHAO.r, LOGO_CHAO.y - LOGO_CHAO.r, LOGO_CHAO.r * 2, LOGO_CHAO.r * 2, cx, cy)) drawLogoChao(c);
  drawCerca(c, Math.max(x0, 52 + OX), Math.min(x1 - 1, 184 + OX), 109 + OY);
  drawCerca(c, Math.max(x0, 60 + OX), Math.min(x1 - 1, 160 + OX), 24 + OY);
  c.restore();
  // tudo o que tem altura, de cima para baixo, para o de baixo cobrir a beirada do de cima; a margem de 2 casas cobre
  // o que passa da borda do pedaço (copas, telhados, postes)
  const m = 4, itens = [];
  const poe = (x, y, w, h, base, desenha) => { if (toca(x, y, w, h, cx, cy, m)) itens.push([base, desenha]); };
  for (let y = Math.max(0, y0 - 2); y < Math.min(MH, y1 + 2); y++) for (let x = Math.max(0, x0 - 2); x < Math.min(MW, x1 + 2); x++) if (ground[y][x] === "t") itens.push([y + 0.9, () => drawTree(c, x, y)]);
  ESTACIONADOS.forEach((e) => poe(e[0], e[1], 1, 2, e[1] + 2, () => drawCarroParado(c, e)));
  CANTEIROS.forEach((k) => poe(k[0], k[1], k[2], 1, k[1] + 1, () => drawCanteiro(c, k)));
  VASOS.forEach((v) => poe(v[0], v[1], 1, 1, v[1] + 1, () => drawVaso(c, v)));
  COISAS.forEach((k) => poe(k[0], k[1], 1, 1, k[1] + 1, () => drawCoisa(c, k)));
  BANDEIRAS.forEach((b) => poe(b[0], b[1], 1, 1, b[1] + 1, () => drawMastro(c, b)));
  VAGAS_F1.forEach((v, i) => { if (i !== vagaOcupada) poe(v[0], v[1], 2, 1, v[1] + 1, () => drawF1Parado(c, v)); });
  CAMINHOES.forEach((k) => poe(k[0], k[1], 8, 2, k[1] + 2, () => drawCaminhao(c, k)));
  ARQUIBANCADAS.forEach((a) => poe(a.x, a.y, a.w, a.h, a.y + a.h, () => drawArquibancada(c, a)));
  poe(HELI.x, HELI.y, HELI.w, HELI.h, HELI.y, () => drawHeli(c));
  poe(RODA.x, RODA.y, RODA.w, RODA.h, RODA.y + RODA.h, () => drawBaseRoda(c));
  PREDIOS.forEach((p) => poe(p.x, p.y - 5, p.w, p.h + 5, p.y + p.h, () => drawPredio(c, p)));
  TENDAS.forEach((t) => poe(t[0], t[1], t[2], t[3], t[1] + t[3], () => drawTendaEnfeite(c, t)));
  GAMES.forEach((g) => poe(g.x, g.y, g.w, g.h, g.y + g.h, () => drawBuilding(c, g)));
  LAMPS.forEach(([x, y]) => poe(x, y - 2, 1, 3, y + 1, () => drawLampPost(c, x, y)));
  FOODTRUCKS.forEach((ft) => poe(ft[0], ft[1], 3, 2, ft[1] + 2, () => drawFoodTruck(c, ft)));
  poe(PAINEL.x, PAINEL.y - 2, PAINEL.w, 3, PAINEL.y + 1, () => drawPainel(c));
  TORCIDAS.length = 0; // as tribunas se registram de novo a cada pedaço: gp-vida.js usa a lista TRIBUNAS, montada uma vez
  itens.sort((a, b) => a[0] - b[0]).forEach(([, desenha]) => desenha());
  pedacos.set(chave, cv);
  if (pedacos.size > 30) pedacos.delete(pedacos.keys().next().value);
  return cv;
}
// os retângulos da torcida de todas as tribunas (para ela pular em gp-vida.js): medidos uma vez, num canvas de rascunho
const TRIBUNAS = (() => {
  const c = document.createElement("canvas").getContext("2d");
  ARQUIBANCADAS.forEach((a) => drawArquibancada(c, a)); drawAutodromo(c, AUTODROMO);
  return TORCIDAS.slice();
})();
// a fonte de pixel pode chegar depois do primeiro desenho: quando chegar, os pedaços são refeitos com ela
if (document.fonts) document.fonts.load(FONTE_PIXEL(10)).then(() => pedacos.clear(), () => {});
