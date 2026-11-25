// Corrida da Galera — o retrato de cada piloto em pixel art, montado por peças (2026-11-25, o Thiago: "criar uma imagem pixelada para cada piloto do
// grid, para ter imagens dos pilotos no card; e um espaço para montar seu próprio piloto"). Nada de arquivo de imagem: o retrato é uma grade de
// 32×32 desenhada aqui com as peças (rosto e pele, cabelo, barba, sobrancelha, olhos, óculos) e o macacão na cor da equipe; o contorno escuro sai
// sozinho em volta de tudo. `retrato(tracos, opcoes)` devolve a imagem pronta (data URL, guardada por combinação) para um <img> com
// image-rendering: pixelated. Os traços dos pilotos de verdade estão em TRACOS (pela sigla); quem não está lá ganha um sorteado pelo nome, sempre o
// mesmo. O montador do seu piloto (próximo passo) usa as mesmas listas: PELES, CABELOS, CORES_CABELO, BARBAS, OLHOS.

export const N = 32; // a grade

export const PELES = ["#f7d7bf", "#efc19f", "#dca47c", "#bd8057", "#8f5a38", "#5f3a24"];
export const CORES_CABELO = { preto: "#1b1614", "castanho-escuro": "#3a2417", castanho: "#5e3b22", "castanho-claro": "#8b5c34", "loiro-escuro": "#b48c48", loiro: "#dcbb63", ruivo: "#a4492b", grisalho: "#9c978f" };
export const CABELOS = ["curto", "raspado", "topete", "ondulado", "cacheado", "longo", "trancas", "calvo"];
export const BARBAS = ["nenhuma", "rala", "cheia", "bigode", "cavanhaque"];
export const OLHOS = { castanho: "#4a2d1c", escuro: "#1e1410", azul: "#3f7fc4", verde: "#4f8a4a" };

// Os pilotos de verdade, pelo jeito que aparecem hoje (o Thiago corrige o que não ficou parecido). [pele 0-5, cabelo, cor, barba, olhos, óculos]
const T = (pele, cabelo, cor, barba = "nenhuma", olhos = "castanho", oculos = false) => ({ pele, cabelo, cor, barba, olhos, oculos });
export const TRACOS = {
  NOR: T(1, "ondulado", "castanho", "rala", "azul"), PIA: T(1, "curto", "castanho-escuro"), LEC: T(1, "topete", "castanho-escuro", "nenhuma", "verde"),
  HAM: T(3, "trancas", "preto", "cavanhaque"), RUS: T(0, "curto", "castanho-claro", "nenhuma", "azul"), ANT: T(1, "curto", "castanho-escuro"),
  VER: T(1, "curto", "castanho-claro", "rala", "azul"), HAD: T(2, "cacheado", "preto"), LAW: T(1, "curto", "castanho"), LIN: T(2, "curto", "preto"),
  ALO: T(2, "curto", "preto", "rala", "escuro"), STR: T(1, "curto", "castanho-escuro", "rala"), ALB: T(2, "curto", "preto", "nenhuma", "escuro"),
  SAI: T(2, "topete", "preto", "rala", "escuro"), HUL: T(0, "curto", "loiro-escuro", "rala", "azul"), BOR: T(2, "curto", "castanho-escuro"),
  GAS: T(1, "curto", "castanho", "rala"), COL: T(1, "topete", "castanho-escuro"), CAM: T(2, "curto", "preto"), BEA: T(1, "curto", "castanho"),
  PER: T(2, "curto", "preto", "rala", "escuro"), BOT: T(0, "longo", "loiro-escuro", "bigode", "azul"),
  // (as temporadas de 2023 a 2025: f1-temporadas.js)
  OCO: T(1, "curto", "castanho-escuro"), TSU: T(1, "curto", "preto", "nenhuma", "escuro"), MAG: T(0, "curto", "loiro", "rala", "azul"), ZHO: T(1, "curto", "preto", "nenhuma", "escuro"),
  RIC: T(2, "cacheado", "castanho-escuro", "bigode"), SAR: T(0, "curto", "castanho"), DEV: T(0, "curto", "loiro-escuro", "nenhuma", "azul"),
  DOO: T(0, "curto", "castanho-claro", "nenhuma", "azul"), MSC: T(0, "curto", "loiro", "nenhuma", "azul"), LAT: T(1, "curto", "loiro-escuro", "rala", "azul"),
};

// um sorteado pelo nome (sempre o mesmo para o mesmo nome)
export function tracosSorteados(chave) {
  let a = 2166136261; for (const c of String(chave || "?")) { a ^= c.charCodeAt(0); a = Math.imul(a, 16777619); }
  const r = () => { a = (Math.imul(a ^ (a >>> 13), 1274126177) + 0x9e3779b9) >>> 0; return a / 4294967296; };
  const pega = (l) => l[Math.floor(r() * l.length)], cores = Object.keys(CORES_CABELO).filter((c) => c !== "grisalho");
  return T(Math.floor(r() * PELES.length), pega(CABELOS.filter((c) => c !== "trancas")), pega(cores), r() < 0.55 ? "nenhuma" : pega(BARBAS), pega(Object.keys(OLHOS)), r() < 0.08);
}
export const tracosDe = (sigla, nome) => TRACOS[String(sigla || "").toUpperCase()] || tracosSorteados(nome || sigla);

// ---------- a cor ----------
const hex = (c) => { let s = String(c).slice(1); if (s.length === 3) s = s.replace(/./g, "const hex = (c) => { const n = parseInt(String(c).slice(1), 16);const hex = (c) => { const n = parseInt(String(c).slice(1), 16);"); const n = parseInt(s, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mistura = (a, b, t) => { const x = hex(a), y = hex(b); return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join(""); };
const escurece = (c, t = 0.22) => mistura(c, "#000000", t), clareia = (c, t = 0.25) => mistura(c, "#ffffff", t);
const CONTORNO = "#15131a";

// ---------- a grade ----------
function grade() { const g = []; for (let y = 0; y < N; y++) g.push(new Array(N).fill(null)); return g; }
const pinta = (g, x, y, c) => { if (x >= 0 && x < N && y >= 0 && y < N) g[y][x] = c; };
const linha = (g, y, x0, x1, c) => { for (let x = x0; x <= x1; x++) pinta(g, x, y, c); };
// o rosto: [y, x0, x1]
const ROSTO = [[7, 12, 19], [8, 11, 20], [9, 10, 21], [10, 9, 22], [11, 9, 22], [12, 9, 22], [13, 9, 22], [14, 9, 22], [15, 9, 22], [16, 9, 22], [17, 9, 22], [18, 10, 21], [19, 10, 21], [20, 11, 20], [21, 12, 19]];

function corpo(g, cor) {
  const c = cor || "#3a6fd0", s = escurece(c), l = clareia(c, 0.18);
  linha(g, 24, 9, 22, c); linha(g, 25, 6, 25, c); for (let y = 26; y < N; y++) linha(g, y, 4, 27, c);
  for (let y = 26; y < N; y++) { pinta(g, 4, y, s); pinta(g, 5, y, s); pinta(g, 26, y, s); pinta(g, 27, y, s); } // os ombros na sombra
  for (let y = 27; y < N; y++) pinta(g, 15, y, s); // o zíper
  linha(g, 28, 6, 13, l); linha(g, 28, 17, 25, l); // a faixa do peito
  for (let y = 29; y <= 30; y++) { pinta(g, 9, y, "#f4f4f4"); pinta(g, 10, y, "#f4f4f4"); pinta(g, 20, y, "#f4f4f4"); pinta(g, 21, y, "#f4f4f4"); pinta(g, 22, y, "#f4f4f4"); } // os patrocínios
  linha(g, 22, 12, 19, "#26282e"); linha(g, 23, 11, 20, "#26282e"); linha(g, 24, 12, 19, "#26282e"); // a gola (o balaclava escuro)
}
function rosto(g, t) {
  const pele = PELES[Math.max(0, Math.min(PELES.length - 1, t.pele | 0))], sombra = escurece(pele, 0.16), boca = mistura(pele, "#8a3b3b", 0.45);
  for (const [y, a, b] of ROSTO) linha(g, y, a, b, pele);
  for (const [y, , b] of ROSTO) if (y >= 10) { pinta(g, b, y, sombra); if (y >= 12 && y <= 18) pinta(g, b - 1, y, sombra); } // o lado na sombra
  for (let y = 13; y <= 16; y++) { pinta(g, 8, y, pele); pinta(g, 23, y, sombra); } // as orelhas
  pinta(g, 16, 15, sombra); pinta(g, 16, 16, sombra); pinta(g, 15, 17, sombra); // o nariz
  linha(g, 19, 14, 17, boca); // a boca
  const ol = OLHOS[t.olhos] || OLHOS.castanho;
  pinta(g, 12, 14, "#ffffff"); pinta(g, 13, 14, ol); pinta(g, 18, 14, ol); pinta(g, 19, 14, "#ffffff");
  return { pele, sombra };
}
function sobrancelha(g, cor) { const c = escurece(cor, 0.1); linha(g, 12, 11, 13, c); linha(g, 12, 18, 20, c); }
function barba(g, tipo, cor, pele) {
  if (!tipo || tipo === "nenhuma") return;
  const c = tipo === "rala" ? mistura(cor, pele, 0.45) : cor;
  if (tipo === "bigode" || tipo === "cavanhaque") { linha(g, 18, 13, 18, c); }
  if (tipo === "cavanhaque") { linha(g, 20, 14, 17, c); linha(g, 21, 14, 17, c); }
  if (tipo === "cheia" || tipo === "rala") {
    for (let y = 16; y <= 19; y++) { pinta(g, 9 + (y > 17 ? 1 : 0), y, c); pinta(g, 22 - (y > 17 ? 1 : 0), y, c); }
    linha(g, 20, 11, 20, c); linha(g, 21, 12, 19, c);
    if (tipo === "cheia") { linha(g, 18, 13, 18, c); for (let y = 17; y <= 19; y++) { pinta(g, 11, y, c); pinta(g, 20, y, c); } linha(g, 19, 12, 13, c); linha(g, 19, 18, 19, c); }
    else linha(g, 19, 14, 17, mistura(pele, "#8a3b3b", 0.45)); // (a boca aparece na rala)
  }
}
function cabelo(g, estilo, cor, pele) {
  const c = cor, s = escurece(cor, 0.25), l = clareia(cor, 0.2);
  const topo = (y0) => { linha(g, y0, 12, 19, c); linha(g, y0 + 1, 10, 21, c); for (let y = y0 + 2; y <= 9; y++) linha(g, y, 9, 22, c); linha(g, 10, 9, 10, c); linha(g, 10, 21, 22, c); };
  const costeletas = (ate) => { for (let y = 10; y <= ate; y++) { pinta(g, 8, y, c); pinta(g, 9, y, c); pinta(g, 22, y, c); pinta(g, 23, y, c); } };
  switch (estilo) {
    case "calvo": for (let y = 10; y <= 13; y++) { pinta(g, 8, y, c); pinta(g, 23, y, c); } return;
    case "raspado": { const r = mistura(c, pele, 0.4); linha(g, 6, 12, 19, r); linha(g, 7, 10, 21, r); linha(g, 8, 9, 22, r); linha(g, 9, 9, 10, r); linha(g, 9, 21, 22, r); for (let y = 10; y <= 12; y++) { pinta(g, 8, y, r); pinta(g, 23, y, r); } return; }
    case "topete": topo(5); costeletas(12); linha(g, 3, 13, 19, c); linha(g, 4, 11, 20, c); linha(g, 3, 15, 18, l); linha(g, 9, 9, 13, c); return;
    case "ondulado": topo(4); costeletas(14); for (const x of [10, 13, 16, 19]) pinta(g, x, 4, l); linha(g, 3, 13, 18, c); for (const x of [11, 15, 20]) pinta(g, x, 10, c); return;
    case "cacheado": for (let y = 2; y <= 9; y++) { const a = y < 4 ? 10 : 7, b = y < 4 ? 21 : 24; linha(g, y, a, b, c); } for (let y = 10; y <= 13; y++) { linha(g, y, 7, 9, c); linha(g, y, 22, 24, c); }
      for (let y = 2; y <= 12; y += 2) for (let x = 7 + (y % 4 ? 1 : 0); x <= 24; x += 3) if (g[y][x] === c) pinta(g, x, y, l);
      for (const x of [8, 11, 14, 17, 20, 23]) pinta(g, x, 1, c); return;
    case "longo": topo(4); for (let y = 10; y <= 22; y++) { linha(g, y, 7, 9, c); linha(g, y, 22, 24, c); } for (let y = 12; y <= 22; y += 3) { pinta(g, 8, y, s); pinta(g, 23, y, s); } return;
    case "trancas": topo(4); for (let y = 10; y <= 23; y++) { linha(g, y, 6, 9, c); linha(g, y, 22, 25, c); }
      for (let y = 4; y <= 23; y++) for (const x of [7, 11, 15, 19, 24]) if (g[y][x] === c && (y + x) % 2) pinta(g, x, y, l); return;
    default: topo(5); costeletas(12); linha(g, 4, 12, 19, c); for (const x of [11, 14, 17, 20]) pinta(g, x, 5, l); // "curto"
  }
}
function oculos(g) { const f = "#1d1d22"; for (const x0 of [11, 17]) { linha(g, 13, x0, x0 + 3, f); linha(g, 15, x0, x0 + 3, f); pinta(g, x0, 14, f); pinta(g, x0 + 3, 14, f); } linha(g, 13, 15, 16, f); }
function contorno(g) {
  const fora = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!g[y][x] && ((g[y - 1] && g[y - 1][x]) || (g[y + 1] && g[y + 1][x]) || g[y][x - 1] || g[y][x + 1])) fora.push([x, y]);
  for (const [x, y] of fora) g[y][x] = CONTORNO;
}

// a grade pronta (cores por pixel, null = transparente)
export function montar(t, op = {}) {
  const g = grade(), cor = CORES_CABELO[t.cor] || t.cor || CORES_CABELO.castanho;
  corpo(g, op.cor);
  const { pele } = rosto(g, t);
  sobrancelha(g, cor === CORES_CABELO.grisalho ? "#6f6a63" : cor);
  barba(g, t.barba, cor, pele);
  cabelo(g, t.cabelo, cor, pele);
  if (t.oculos) oculos(g);
  contorno(g);
  return g;
}
// a imagem (data URL) do retrato, guardada por combinação; `fundo` pinta o quadrado inteiro atrás (sem fundo, transparente)
const CACHE = new Map();
export function retrato(t, op = {}) {
  const chave = JSON.stringify([t, op.cor || "", op.fundo || "", op.escala || 4]);
  if (CACHE.has(chave)) return CACHE.get(chave);
  if (typeof document === "undefined") return "";
  const e = op.escala || 4, cv = document.createElement("canvas"); cv.width = cv.height = N * e;
  const x = cv.getContext("2d"), g = montar(t, op);
  if (op.fundo) { x.fillStyle = op.fundo; x.fillRect(0, 0, cv.width, cv.height); }
  for (let y = 0; y < N; y++) for (let k = 0; k < N; k++) if (g[y][k]) { x.fillStyle = g[y][k]; x.fillRect(k * e, y * e, e, e); }
  const url = cv.toDataURL("image/png"); CACHE.set(chave, url); return url;
}
// o retrato de um jogador da sala (sigla e nome dele, a cor da equipe)
export function retratoDoJogador(p, cor) { return retrato(tracosDe(p && p.sigla, p && (p.nomeCompleto || p.name)), { cor }); }
