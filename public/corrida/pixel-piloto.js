// Corrida da Galera — o retrato de cada piloto em pixel art, montado por peças (2026-11-25, o Thiago: "criar uma imagem pixelada para cada piloto do
// grid, para ter imagens dos pilotos no card; e um espaço para montar seu próprio piloto"; depois: "para os pilotos do grid fixos, pixel art mais
// trabalhada"). Nada de arquivo de imagem: o retrato é uma grade de 48×48 desenhada aqui com as peças e a luz vindo da esquerda:
//   o rosto (formato, 6 tons de pele em 4 tons de luz cada, bochecha, queixo, orelha), os olhos (pálpebra, íris, pupila e brilho), o nariz, a
//   boca (dois lábios, sorriso), a sobrancelha (fina, média, grossa), o cabelo (8 estilos, 3 tons, fios, a risca), a barba (rala pontilhada,
//   cheia, bigode, cavanhaque), óculos e brinco; embaixo o pescoço, a balaclava e o macacão na cor da equipe (dobras, zíper, patrocínios).
// O contorno escuro sai sozinho em volta de tudo. `retrato(tracos, opcoes)` devolve a imagem (data URL, guardada por combinação) para um <img>
// com image-rendering: pixelated (de preferência em 48, 96 ou 144 px, múltiplos da grade). Os traços dos pilotos de verdade estão em TRACOS
// (pela sigla); quem não está lá ganha um sorteado pelo nome, sempre o mesmo. O montador do seu piloto usa as mesmas listas.

export const N = 48; // a grade
const CX = 24; // o meio (as colunas 23 e 24 são as do centro)

export const PELES = ["#f8dcc6", "#f0c4a2", "#dca57e", "#bf8459", "#93603d", "#623e27"];
export const CORES_CABELO = { preto: "#1c1715", "castanho-escuro": "#3b2518", castanho: "#5f3c23", "castanho-claro": "#8c5d35", "loiro-escuro": "#b38b49", loiro: "#dcbc66", ruivo: "#a54a2b", grisalho: "#9d9890" };
export const CABELOS = ["curto", "raspado", "topete", "ondulado", "cacheado", "longo", "trancas", "calvo"];
export const BARBAS = ["nenhuma", "rala", "cheia", "bigode", "cavanhaque"];
export const OLHOS = { castanho: "#5a3420", escuro: "#2a1a12", azul: "#3f83c9", verde: "#4f8e4c", mel: "#8a6a2a" };
export const ROSTOS = ["oval", "fino", "largo", "quadrado"];
export const NARIZES = ["pequeno", "medio", "grande"];
export const SOBRANCELHAS = ["fina", "media", "grossa"];

// os traços: pele 0-5, cabelo, cor, barba, olhos, e o resto opcional ({ rosto, nariz, sobr, risca: "esq"|"dir", sorriso, oculos, brinco })
const T = (pele, cabelo, cor, barba = "nenhuma", olhos = "castanho", extra = {}) => ({ pele, cabelo, cor, barba, olhos, rosto: "oval", nariz: "medio", sobr: "media", ...extra });
// Os pilotos de verdade, pelo jeito que aparecem hoje (o Thiago corrige o que não ficou parecido)
export const TRACOS = {
  NOR: T(1, "ondulado", "castanho", "rala", "azul", { sorriso: true, risca: "esq" }),
  PIA: T(1, "curto", "castanho-escuro", "nenhuma", "castanho", { rosto: "fino", sobr: "fina", risca: "esq" }),
  LEC: T(1, "topete", "castanho-escuro", "nenhuma", "verde", { rosto: "fino", nariz: "pequeno" }),
  HAM: T(3, "trancas", "preto", "cavanhaque", "escuro", { sobr: "grossa", brinco: true, rosto: "quadrado" }),
  RUS: T(0, "curto", "castanho-claro", "nenhuma", "azul", { rosto: "fino", risca: "dir", sorriso: true }),
  ANT: T(1, "curto", "castanho-escuro", "nenhuma", "castanho", { rosto: "fino", nariz: "pequeno" }),
  VER: T(1, "curto", "castanho-claro", "rala", "azul", { rosto: "largo", sobr: "fina" }),
  HAD: T(2, "cacheado", "preto", "nenhuma", "escuro", { rosto: "fino" }),
  LAW: T(1, "curto", "castanho", "nenhuma", "castanho", { risca: "esq" }),
  LIN: T(2, "curto", "preto", "nenhuma", "escuro", { rosto: "fino", nariz: "pequeno" }),
  ALO: T(2, "curto", "preto", "rala", "escuro", { nariz: "grande", sobr: "grossa", rosto: "quadrado" }),
  STR: T(1, "curto", "castanho-escuro", "rala", "castanho", { rosto: "largo" }),
  ALB: T(2, "curto", "preto", "nenhuma", "escuro", { sorriso: true, rosto: "largo" }),
  SAI: T(2, "topete", "preto", "rala", "escuro", { sobr: "grossa", nariz: "grande" }),
  HUL: T(0, "curto", "loiro-escuro", "rala", "azul", { rosto: "quadrado", risca: "esq" }),
  BOR: T(2, "ondulado", "castanho-escuro", "nenhuma", "castanho", { rosto: "fino", sorriso: true }),
  GAS: T(1, "curto", "castanho", "rala", "castanho", { rosto: "fino", nariz: "grande" }),
  COL: T(1, "topete", "castanho-escuro", "nenhuma", "castanho", { sorriso: true, rosto: "fino" }),
  CAM: T(2, "curto", "preto", "nenhuma", "escuro", { rosto: "fino" }),
  BEA: T(1, "curto", "castanho", "nenhuma", "castanho", { rosto: "largo", risca: "dir" }),
  PER: T(2, "curto", "preto", "rala", "escuro", { rosto: "largo", sorriso: true }),
  BOT: T(0, "longo", "loiro-escuro", "bigode", "azul", { rosto: "fino" }),
  // (as temporadas de 2023 a 2025: f1-temporadas.js)
  OCO: T(1, "curto", "castanho-escuro", "nenhuma", "castanho", { rosto: "fino", risca: "esq" }), TSU: T(1, "curto", "preto", "nenhuma", "escuro", { sorriso: true, rosto: "largo" }),
  MAG: T(0, "curto", "loiro", "rala", "azul", { rosto: "quadrado" }), ZHO: T(1, "curto", "preto", "nenhuma", "escuro", { rosto: "fino" }),
  RIC: T(2, "cacheado", "castanho-escuro", "bigode", "castanho", { sorriso: true, rosto: "quadrado" }), SAR: T(0, "curto", "castanho", "nenhuma", "castanho", { rosto: "largo" }),
  DEV: T(0, "curto", "loiro-escuro", "nenhuma", "azul", { risca: "esq" }), DOO: T(0, "curto", "castanho-claro", "nenhuma", "azul", { rosto: "fino" }),
  MSC: T(0, "curto", "loiro", "nenhuma", "azul", { rosto: "fino" }), LAT: T(1, "curto", "loiro-escuro", "rala", "azul", { sorriso: true }),
};

// um sorteado pelo nome (sempre o mesmo para o mesmo nome)
export function tracosSorteados(chave) {
  let a = 2166136261; for (const c of String(chave || "?")) { a ^= c.charCodeAt(0); a = Math.imul(a, 16777619); }
  const r = () => { a = (Math.imul(a ^ (a >>> 13), 1274126177) + 0x9e3779b9) >>> 0; return a / 4294967296; };
  const pega = (l) => l[Math.floor(r() * l.length)], cores = Object.keys(CORES_CABELO).filter((c) => c !== "grisalho");
  return T(Math.floor(r() * PELES.length), pega(CABELOS.filter((c) => c !== "trancas")), pega(cores), r() < 0.55 ? "nenhuma" : pega(BARBAS), pega(Object.keys(OLHOS)),
    { rosto: pega(ROSTOS), nariz: pega(NARIZES), sobr: pega(SOBRANCELHAS), sorriso: r() < 0.3, oculos: r() < 0.08, risca: r() < 0.4 ? pega(["esq", "dir"]) : null });
}
export const tracosDe = (sigla, nome) => TRACOS[String(sigla || "").toUpperCase()] || tracosSorteados(nome || sigla);

// ---------- a cor ----------
const hex = (c) => { let s = String(c).slice(1); if (s.length === 3) s = s.replace(/./g, "$&$&"); const n = parseInt(s, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mistura = (a, b, t) => { const x = hex(a), y = hex(b); return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join(""); };
const escurece = (c, t = 0.22) => mistura(c, "#1a0e12", t), clareia = (c, t = 0.25) => mistura(c, "#fff4ea", t);
const CONTORNO = "#17121a";
// os 4 tons de uma cor: luz, base, sombra, sombra funda
const tons = (c) => ({ luz: clareia(c, 0.2), base: c, sombra: escurece(c, 0.2), funda: escurece(c, 0.4) });

// ---------- a grade ----------
const grade = () => Array.from({ length: N }, () => new Array(N).fill(null));
const pinta = (g, x, y, c) => { if (c && x >= 0 && x < N && y >= 0 && y < N) g[y][x] = c; };
const linha = (g, y, x0, x1, c) => { for (let x = x0; x <= x1; x++) pinta(g, x, y, c); };
const espelho = (g, y, dx0, dx1, c) => { linha(g, y, CX - 1 - dx1, CX - 1 - dx0, c); linha(g, y, CX + dx0, CX + dx1, c); }; // dx a partir do meio, dos dois lados
const tem = (g, x, y) => y >= 0 && y < N && x >= 0 && x < N && g[y][x];

// a meia largura do rosto em cada linha (do topo da cabeça, y 9, ao queixo)
const TOPO = 9, QUEIXO = { oval: 36, fino: 36, largo: 35, quadrado: 35 };
function meia(rosto, y) {
  const meio = rosto === "largo" ? 11 : rosto === "fino" ? 9 : 10;
  const cima = [4, 6, 8, 9]; if (y < TOPO) return 0; if (y - TOPO < cima.length) return Math.min(meio, cima[y - TOPO] + (rosto === "largo" ? 1 : 0));
  if (y <= 25) return meio;
  const k = y - 25, fim = QUEIXO[rosto] || 36; if (y > fim) return 0;
  const queda = { oval: [10, 10, 9, 9, 8, 7, 6, 5, 4, 3, 2], fino: [9, 9, 8, 8, 7, 6, 5, 4, 3, 2, 2], largo: [11, 11, 11, 10, 10, 9, 8, 6, 5, 4], quadrado: [10, 10, 10, 10, 10, 9, 9, 8, 6, 4] }[rosto] || [];
  return Math.min(meio, queda[k - 1] ?? 2);
}

// ---------- o corpo: pescoço, balaclava e macacão ----------
function corpo(g, cor, pele) {
  const c = tons(cor || "#3a6fd0"), P = tons(pele), bal = tons("#2a2c33");
  for (let y = 34; y <= 40; y++) espelho(g, y, 0, 4, y < 37 ? P.funda : P.sombra); // o pescoço (na sombra do queixo)
  for (let y = 38; y <= 41; y++) espelho(g, y, 0, y === 38 ? 6 : 7, y === 38 ? bal.luz : bal.base); // a balaclava (a gola antichama)
  const ombro = (y) => (y === 40 ? 11 : y === 41 ? 15 : y === 42 ? 18 : 20);
  for (let y = 40; y < N; y++) {
    const w = ombro(y);
    for (let dx = 0; dx < w; dx++) {
      const borda = dx >= w - 2, luzE = dx >= w - 6 && dx < w - 2;
      pinta(g, CX - 1 - dx, y, borda ? c.sombra : luzE && y > 42 ? c.luz : c.base); // o lado esquerdo pega a luz
      pinta(g, CX + dx, y, borda || dx >= w - 5 ? c.funda : dx >= w - 9 ? c.sombra : c.base); // o direito, a sombra
    }
  }
  espelho(g, 41, 7, 9, c.funda); // a gola do macacão
  for (let y = 42; y < N; y++) { pinta(g, CX - 1, y, c.sombra); pinta(g, CX, y, c.funda); } // o zíper
  for (let y = 43; y < N; y += 2) pinta(g, CX - 1, y, c.luz);
  for (let y = 44; y <= 45; y++) { linha(g, y, CX - 13, CX - 8, "#f2f2f2"); linha(g, y, CX + 6, CX + 12, "#e4e4e4"); } // os patrocínios do peito
  linha(g, 47, CX - 18, CX + 17, c.funda); // a faixa da cintura
  for (const [x, y] of [[CX - 15, 43], [CX - 16, 45], [CX + 13, 43], [CX + 15, 46]]) pinta(g, x, y, c.sombra); // dobras
}

// ---------- o rosto ----------
function rosto(g, t) {
  const P = tons(PELES[Math.max(0, Math.min(PELES.length - 1, t.pele | 0))]), r = t.rosto || "oval";
  for (let y = TOPO; y <= 37; y++) {
    const w = meia(r, y); if (!w) continue;
    for (let dx = 0; dx < w; dx++) {
      const xl = CX - 1 - dx, xr = CX + dx;
      pinta(g, xl, y, dx >= w - 1 && y > 24 ? P.sombra : P.base);
      pinta(g, xr, y, dx >= w - 3 ? (dx >= w - 1 ? P.funda : P.sombra) : P.base);
    }
  }
  // a luz: testa e maçã do rosto à esquerda; sombra sob as maçãs e no queixo
  for (let y = 13; y <= 16; y++) linha(g, y, CX - 6, CX - 2, P.luz);
  for (let y = 24; y <= 26; y++) linha(g, y, CX - 8, CX - 6, P.luz);
  linha(g, 28, CX + 5, CX + 7, P.sombra); linha(g, 29, CX + 6, CX + 7, P.sombra);
  const fim = QUEIXO[r] || 36; linha(g, fim, CX - 2, CX + 1, P.sombra); linha(g, fim - 1, CX - 1, CX, P.luz);
  // as orelhas
  const w = meia(r, 22);
  for (let y = 20; y <= 26; y++) { pinta(g, CX - 1 - w, y, P.base); pinta(g, CX - 2 - w, y, y > 20 && y < 26 ? P.sombra : null); pinta(g, CX + w, y, P.sombra); pinta(g, CX + w + 1, y, y > 20 && y < 26 ? P.funda : null); }
  pinta(g, CX - 1 - w, 22, P.sombra); pinta(g, CX - 1 - w, 23, P.sombra); pinta(g, CX + w, 22, P.funda); pinta(g, CX + w, 23, P.funda);
  return P;
}
function olhos(g, t, P) {
  // (2026-11-25, o Thiago: "os olhos estão muito feios") a íris redonda de 2×2 no meio do olho, com o brilho em cima à esquerda e a pupila ao lado,
  // igual nos dois olhos (o olhar reto); a pálpebra de cima é um traço só, e embaixo só a sombra leve da pele
  const iris = OLHOS[t.olhos] || OLHOS.castanho, cilio = mistura(escurece(P.base, 0.62), "#2a1712", 0.4), branco = "#f6f1ea";
  for (const x0 of [CX - 8, CX + 4]) {
    linha(g, 21, x0, x0 + 3, cilio);
    pinta(g, x0, 22, branco); pinta(g, x0 + 3, 22, branco);
    pinta(g, x0 + 1, 22, mistura(iris, "#ffffff", 0.55)); pinta(g, x0 + 2, 22, "#140d0b"); // o brilho e a pupila
    pinta(g, x0 + 1, 23, iris); pinta(g, x0 + 2, 23, escurece(iris, 0.2));
    pinta(g, x0, 23, mistura(branco, P.sombra, 0.5)); pinta(g, x0 + 3, 23, mistura(branco, P.sombra, 0.5));
  }
  pinta(g, CX - 9, 22, cilio); pinta(g, CX + 8, 22, cilio); // o canto de fora dos cílios
}
function sobrancelhas(g, t, cor) {
  const c = escurece(cor, 0.05), s = t.sobr || "media";
  for (const lado of [-1, 1]) {
    const x0 = lado < 0 ? CX - 9 : CX + 4, x1 = x0 + 4, dentro = lado < 0 ? x1 : x0, fora = lado < 0 ? x0 : x1;
    linha(g, 18, x0, x1, c); pinta(g, fora, 18, null); pinta(g, fora, 19, c); // o arco: desce na ponta de fora
    if (s !== "fina") linha(g, 17, Math.min(dentro, fora + lado * -1), Math.max(dentro, fora + lado * -1), c);
    if (s === "grossa") { pinta(g, dentro, 19, c); pinta(g, fora, 17, c); }
    if (s === "fina") pinta(g, dentro, 18, null);
  }
}
function nariz(g, t, P) {
  const n = t.nariz || "medio", de = n === "pequeno" ? 24 : n === "grande" ? 21 : 22;
  for (let y = de; y <= 27; y++) pinta(g, CX + (n === "grande" ? 1 : 0), y, P.sombra); // a sombra do lado direito
  linha(g, 27, CX - (n === "grande" ? 3 : 2), CX + (n === "grande" ? 2 : 1), P.sombra); // a base
  pinta(g, CX - 2, 28, P.funda); pinta(g, CX + 1, 28, P.funda); // as narinas
  pinta(g, CX - 1, 26, P.luz); if (n !== "pequeno") pinta(g, CX - 1, 25, P.luz); // a ponta
  if (n === "grande") { pinta(g, CX - 3, 28, P.funda); pinta(g, CX + 2, 28, P.funda); pinta(g, CX + 1, 22, P.sombra); }
}
function boca(g, t, P) {
  const labio = mistura(P.base, "#9b3b3b", 0.42), escuro = escurece(labio, 0.35), y = 31;
  linha(g, y, CX - 3, CX + 2, escuro); // a linha da boca
  linha(g, y - 1, CX - 2, CX + 1, labio); pinta(g, CX - 1, y - 1, mistura(labio, P.base, 0.4)); // o lábio de cima
  linha(g, y + 1, CX - 2, CX + 1, mistura(labio, P.base, 0.25)); pinta(g, CX - 1, y + 1, P.luz); // o de baixo, com o brilho
  if (t.sorriso) { pinta(g, CX - 4, y - 1, escuro); pinta(g, CX + 3, y - 1, escuro); linha(g, y, CX - 2, CX + 1, "#f4efe9"); }
  linha(g, y + 3, CX - 1, CX, P.sombra); // a covinha do queixo
}
function barba(g, t, cor, P) {
  const tipo = t.barba; if (!tipo || tipo === "nenhuma") return;
  const B = tons(cor), r = t.rosto || "oval", fim = QUEIXO[r] || 36, naBarba = (x, y) => tem(g, x, y) && y >= 26 && y <= fim;
  const bigode = () => { linha(g, 29, CX - 4, CX + 3, B.base); linha(g, 28, CX - 3, CX + 2, B.sombra); pinta(g, CX - 5, 30, B.base); pinta(g, CX + 4, 30, B.base); linha(g, 29, CX - 1, CX, B.luz); };
  if (tipo === "bigode") return bigode();
  if (tipo === "cavanhaque") { bigode(); for (let y = 33; y <= fim; y++) linha(g, y, CX - 3, CX + 2, y === 33 ? B.sombra : B.base); pinta(g, CX - 1, 34, B.luz); return; }
  // rala (pontilhada) e cheia: a mandíbula de orelha a orelha, sem a boca
  for (let y = 25; y <= fim; y++) {
    const w = meia(r, y); if (!w) continue;
    for (let dx = 0; dx < w; dx++) for (const x of [CX - 1 - dx, CX + dx]) {
      if (!naBarba(x, y)) continue;
      const boca = y >= 29 && y <= 33 && Math.abs(x - CX + 0.5) < 4.5, bochecha = y < 29 && dx < w - 4;
      if (boca || bochecha) continue;
      if (tipo === "rala") { if ((x * 7 + y * 3) % 5 < 2) pinta(g, x, y, mistura(g[y][x], B.base, 0.38)); }
      else pinta(g, x, y, dx >= w - 2 ? B.sombra : (x * 3 + y) % 5 === 0 ? B.luz : B.base);
    }
  }
  if (tipo === "cheia") bigode(); else for (let x = CX - 4; x <= CX + 3; x += 2) pinta(g, x, 29, mistura(B.base, g[29][x] || "#000", 0.4));
}

// ---------- o cabelo ----------
function cabelo(g, t, cor, P) {
  const H = tons(cor), r = t.rosto || "oval", estilo = t.cabelo;
  const larg = (y) => Math.max(meia(r, Math.max(TOPO + 3, y)), meia(r, y)) ; // a largura da cabeça na linha
  // a massa: das linhas y0 a y1, mais `fora` pixels para os lados; a franja desce até `franja` (a linha do cabelo na testa)
  const massa = (y0, franja, fora = 1, lados = 20) => {
    for (let y = y0; y <= lados; y++) {
      const w = (y <= TOPO + 2 ? [5, 7, 9, 10, 10, 11][Math.max(0, y - y0)] ?? larg(y) : larg(y)) + fora;
      for (let dx = 0; dx < w; dx++) {
        const testa = y > franja && dx < w - 3; if (testa) continue; // abaixo da franja, só os lados
        const xl = CX - 1 - dx, xr = CX + dx, cXL = dx >= w - 1 ? H.sombra : H.base, cXR = dx >= w - 2 ? H.funda : dx >= w - 4 ? H.sombra : H.base;
        pinta(g, xl, y, cXL); pinta(g, xr, y, cXR);
      }
    }
  };
  const fios = (y0, y1) => { // o brilho: uma mecha curva em cima à esquerda (e um fio solto à direita)
    const pts = [[CX - 7, y0 + 2], [CX - 6, y0 + 1], [CX - 5, y0 + 1], [CX - 4, y0 + 1], [CX - 3, y0 + 2], [CX - 8, y0 + 3], [CX - 6, y0 + 3], [CX + 3, y0 + 2], [CX + 4, y0 + 3]];
    for (const [x, y] of pts) if (y <= y1 && g[y] && g[y][x] === H.base) g[y][x] = H.luz;
  };
  const sombraTesta = (franja) => { for (let x = CX - 9; x <= CX + 8; x++) if (tem(g, x, franja + 1) && !String(g[franja + 1][x]).startsWith(H.base)) pinta(g, x, franja + 1, mistura(g[franja + 1][x], H.funda, 0.35)); };
  const risca = (y0, y1) => { if (!t.risca) return; const x = t.risca === "esq" ? CX - 5 : CX + 4; for (let y = y0; y <= y1; y++) pinta(g, x, y, H.funda); for (let y = y0; y <= y1 - 1; y++) pinta(g, x + (t.risca === "esq" ? 1 : -1), y, H.luz); };
  switch (estilo) {
    case "calvo": for (let y = 17; y <= 24; y++) { const w = larg(y); pinta(g, CX - 1 - w, y, H.sombra); pinta(g, CX - w, y, H.base); pinta(g, CX + w, y, H.funda); pinta(g, CX + w - 1, y, H.sombra); } return;
    case "raspado": {
      const R = mistura(H.base, P.base, 0.45), Rs = mistura(H.sombra, P.sombra, 0.4);
      for (let y = TOPO; y <= 16; y++) { const w = larg(y) + (y < 12 ? 0 : 0); for (let dx = 0; dx < w; dx++) { pinta(g, CX - 1 - dx, y, (dx + y) % 3 ? R : Rs); pinta(g, CX + dx, y, dx >= w - 3 ? Rs : (dx + y) % 3 ? R : Rs); } }
      for (let y = 17; y <= 21; y++) { const w = larg(y); pinta(g, CX - 1 - w + 1, y, R); pinta(g, CX + w - 1, y, Rs); }
      return;
    }
    case "topete":
      massa(5, 15, 1, 21); sombraTesta(15);
      linha(g, 2, CX - 6, CX + 1, H.base); linha(g, 3, CX - 8, CX + 4, H.base); linha(g, 4, CX - 9, CX + 7, H.base); linha(g, 5, CX - 10, CX + 9, H.base); // o volume da frente, puxado para a esquerda
      pinta(g, CX + 2, 3, H.sombra); pinta(g, CX + 5, 4, H.sombra); pinta(g, CX + 8, 5, H.sombra);
      fios(2, 13, 4); linha(g, 3, CX - 6, CX - 3, H.luz); linha(g, 4, CX - 7, CX - 5, H.luz); // o brilho da onda
      for (let y = 16; y <= 23; y++) { const w = larg(y); pinta(g, CX - w, y, H.base); pinta(g, CX + w - 1, y, H.sombra); } // as costeletas
      risca(5, 12); return;
    case "ondulado":
      massa(4, 16, 2, 23); sombraTesta(16);
      for (const [x, y] of [[CX - 7, 17], [CX - 6, 17], [CX - 2, 18], [CX - 1, 17], [CX + 3, 17], [CX + 6, 17]]) pinta(g, x, y, H.base); // a franja caindo
      for (const [x0, y] of [[CX - 8, 7], [CX - 2, 6], [CX + 4, 7], [CX - 6, 11], [CX + 1, 10]]) { pinta(g, x0, y, H.luz); pinta(g, x0 + 1, y - 1, H.luz); pinta(g, x0 + 2, y, H.luz); pinta(g, x0 + 1, y + 1, H.sombra); } // as ondas: arcos soltos
      linha(g, 3, CX - 4, CX + 3, H.base); risca(4, 11); return;
    case "cacheado": {
      for (let y = 1; y <= 17; y++) { const w = y < 4 ? 8 + y : y < 14 ? 13 : 12; for (let dx = 0; dx < w; dx++) { if (y > 15 && dx < w - 3) continue; pinta(g, CX - 1 - dx, y, H.base); pinta(g, CX + dx, y, dx >= w - 3 ? H.sombra : H.base); } }
      for (let y = 18; y <= 23; y++) { const w = larg(y) + 2; for (let k = 0; k < 3; k++) { pinta(g, CX - w + k, y, H.base); pinta(g, CX + w - 1 - k, y, H.sombra); } }
      for (let y = 1; y <= 22; y += 3) for (let x = (y % 2) * 2; x < N; x += 4) if (g[y] && (g[y][x] === H.base || g[y][x] === H.sombra)) { pinta(g, x, y, H.luz); pinta(g, x + 1, y + 1, H.funda); } // os cachos
      for (let x = CX - 12; x <= CX + 11; x += 3) pinta(g, x, 0, H.sombra);
      return;
    }
    case "longo":
      massa(4, 15, 2, 21); sombraTesta(15);
      for (let y = 18; y <= 37; y++) { const w = larg(Math.min(y, 26)) + 3; for (let k = 0; k < 4; k++) { pinta(g, CX - w + k, y, k === 0 ? H.sombra : H.base); pinta(g, CX + w - 1 - k, y, k === 0 ? H.funda : H.sombra); } }
      for (let y = 6; y <= 37; y++) for (let x = 0; x < N; x++) if (g[y][x] === H.base && x % 4 === 0 && y > 16) g[y][x] = H.luz; // os fios compridos dos lados
      fios(4, 10);
      risca(4, 10); return;
    case "trancas":
      massa(4, 15, 2, 21); sombraTesta(15);
      for (let y = 16; y <= 41; y++) { const w = larg(Math.min(y, 25)) + 4; for (let k = 0; k < 5; k++) for (const x of [CX - w + k, CX + w - 1 - k]) pinta(g, x, y, (x + Math.floor(y / 2)) % 2 ? H.base : H.sombra); }
      for (let y = 4; y <= 16; y++) for (let x = 0; x < N; x++) if (g[y][x] === H.base || g[y][x] === H.sombra) g[y][x] = x % 3 === 1 ? H.funda : x % 3 === 0 && y % 3 ? H.luz : H.base; // as tranças em fileiras
      return;
    default: // "curto"
      massa(6, 15, 1, 21); sombraTesta(15);
      linha(g, 5, CX - 4, CX + 3, H.base);
      for (let y = 16; y <= 23; y++) { const w = larg(y); pinta(g, CX - w, y, H.base); pinta(g, CX + w - 1, y, H.sombra); } // as costeletas
      fios(6, 14, 3); risca(6, 13);
  }
}
function oculos(g) {
  const f = "#1f1e24", v = "#9fc4dd55";
  for (const x0 of [CX - 9, CX + 3]) { linha(g, 20, x0, x0 + 5, f); linha(g, 24, x0, x0 + 5, f); for (let y = 21; y <= 23; y++) { pinta(g, x0, y, f); pinta(g, x0 + 5, y, f); } }
  linha(g, 21, CX - 3, CX + 2, f);
}
function brinco(g, t) { const w = meia(t.rosto || "oval", 26); pinta(g, CX - 2 - w, 27, "#f4d36b"); pinta(g, CX + w + 1, 27, "#c9a93f"); }
function contorno(g) {
  const fora = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!g[y][x] && (tem(g, x, y - 1) || tem(g, x, y + 1) || tem(g, x - 1, y) || tem(g, x + 1, y))) fora.push([x, y]);
  for (const [x, y] of fora) g[y][x] = CONTORNO;
}

// a grade pronta (cores por pixel, null = transparente)
export function montar(t, op = {}) {
  t = { rosto: "oval", nariz: "medio", sobr: "media", ...t };
  const g = grade(), cor = CORES_CABELO[t.cor] || t.cor || CORES_CABELO.castanho, pele = PELES[Math.max(0, Math.min(PELES.length - 1, t.pele | 0))];
  corpo(g, op.cor, pele);
  const P = rosto(g, t);
  olhos(g, t, P); nariz(g, t, P); boca(g, t, P);
  sobrancelhas(g, t, cor === CORES_CABELO.grisalho ? "#6f6a63" : cor);
  barba(g, t, cor, P);
  cabelo(g, t, cor, P);
  if (t.oculos) oculos(g);
  if (t.brinco) brinco(g, t);
  contorno(g);
  return g;
}
// a imagem (data URL) do retrato, guardada por combinação; `fundo` pinta o quadrado inteiro atrás (sem fundo, transparente)
const CACHE = new Map();
export function retrato(t, op = {}) {
  const chave = JSON.stringify([t, op.cor || "", op.fundo || "", op.escala || 3]);
  if (CACHE.has(chave)) return CACHE.get(chave);
  if (typeof document === "undefined") return "";
  const e = op.escala || 3, cv = document.createElement("canvas"); cv.width = cv.height = N * e;
  const x = cv.getContext("2d"), g = montar(t, op);
  if (op.fundo) { x.fillStyle = op.fundo; x.fillRect(0, 0, cv.width, cv.height); }
  for (let y = 0; y < N; y++) for (let k = 0; k < N; k++) if (g[y][k]) { x.fillStyle = g[y][k]; x.fillRect(k * e, y * e, e, e); }
  const url = cv.toDataURL("image/png"); CACHE.set(chave, url); return url;
}
// (2026-11-25, as folhas que o Thiago mandou) os 22 pilotos de 2026 têm retrato e capacete desenhados à parte, em public/corrida/pilotos-pixel/
// (rosto/ e capacete/, 64 px de largura, o fundo escuro de foto). Cortados das folhas por ferramenta: Audi (Hülkenberg e Bortoleto) e Cadillac (Pérez e
// Bottas) tiveram o macacão verde repintado. Os rostos "extra1" e "extra2" (e os capacetes extra1 a extra8) sobraram das folhas.
export const FIXOS = new Set(["NOR", "PIA", "LEC", "HAM", "RUS", "ANT", "VER", "HAD", "LAW", "LIN", "ALO", "STR", "ALB", "SAI", "HUL", "BOR", "GAS", "COL", "CAM", "BEA", "PER", "BOT"]);
const fixo = (p) => { const s = String((p && p.sigla) || "").toUpperCase(); return FIXOS.has(s) && (!p || p.bot !== false) ? s : null; }; // (um humano com a mesma sigla fica com o montado)
// o retrato de um jogador da sala: o desenhado, para os pilotos do grid; o montado por peças (sigla e nome, a cor da equipe), para os outros
// (o seu piloto, do montador: mods.pixel; piloto-pixel-editor.js)
export function retratoDoJogador(p, cor) { const s = fixo(p); if (s) return `/corrida/pilotos-pixel/rosto/${s}.png`; const meu = p && p.mods && p.mods.pixel; return retrato(meu && typeof meu === "object" ? meu : tracosDe(p && p.sigla, p && (p.nomeCompleto || p.name)), { cor }); }
// o capacete desenhado do piloto do grid (null para os outros)
export function capaceteDoJogador(p) { const s = fixo(p); return s ? `/corrida/pilotos-pixel/capacete/${s}.png` : null; }
