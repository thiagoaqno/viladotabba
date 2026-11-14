// Corrida da Galera — a pintura das equipes no carro de F1 (f1.js monta o carro e usa isto).
//
// (Serve aos dois carros: o de 2026, f1-2026.js, usa a mesma folha e o mesmo shader com `NOVO`; as medidas abaixo valem para os dois, porque
// todo modelo é posto no comprimento TAM de f1.js.)
// O modelo clássico (f1/f1.glb) é um F1 antigo com UV de máscara, então as pinturas de equipe não ficam em cima do UV: cada
// equipe tem UMA "folha" (um canvas de 1024x1152, feito uma vez e guardado: não é uma por carro) com o carro desenhado
// em cinco vistas, e o shader do corpo projeta a folha na carroceria pela posição de cada ponto (3 projeções misturadas
// pela normal). Quem pinta é a função `pintar` de cada equipe, em METROS do carro; o mesmo desenho vale nos dois lados.
//
//   folha (1024 x 1152 px, K = 232,7 px por metro):   s = distância desde a ponta do bico (0 a 4,4), y = altura, x = lateral
//     y    0 ..  256  lado A (quem olha de +x: a frente fica à DIREITA):  X = (4,4 - s) K        Y = (1,1 - y) K
//     y  256 ..  512  lado B (quem olha de -x: a frente fica à ESQUERDA): X = s K                Y = 256 + (1,1 - y) K
//     y  512 ..  896  de cima (a frente à esquerda; +x para cima):        X = s K                Y = 704 - x K
//     y  896 .. 1152  frente (x 0 .. 512, +x à esquerda) e traseira (x 512 .. 1024, +x à direita): Y = 896 + (1,1 - y) K
//
// Os patrocínios usam nomes reais em representação tipográfica aproximada ou desenhados no canvas (f1-marcas.js); os logos das
// equipes vêm de logos/ (o projeto já os usa nos menus). O número do piloto é um decalque à parte (um atlas de dígitos
// compartilhado) porque muda de carro para carro; o composto do pneu vira uma faixa na lateral do pneu (shader do pneu).
import * as THREE from "three";
import { desenharMarca } from "./f1-marcas.js";

export const K = 1024 / 4.4, FW = 1024, FH = 1152;
// A folha sai em 2× no carro do jogador (e na garagem) e em 1× nos outros, para um grid de 20 não pesar na memória: ESC vale durante a pintura.
// As contas continuam em "pixels lógicos" de 1024 x 1152 (o shader também): só o canvas é maior.
let ESC = 1;
const PX = () => K * ESC;
const CARBONO = "#0b0c0f";

// ---------------------------------------------------------------- os logos (carregados uma vez só)
const LOGOS = new Map(); // id -> { img, ok }
export const logosProntos = (() => {
  const idx = (typeof window !== "undefined" && window.EQUIPES_F1) || {};
  return Promise.all(Object.entries(idx).map(([id, e]) => new Promise((res) => {
    const img = new Image(); img.onload = () => { LOGOS.set(id, { img, ok: true }); res(); }; img.onerror = () => res();
    img.src = "/corrida/logos/" + e.arquivo;
  })));
})();
// recorta as margens transparentes do logo (e guarda o resultado) e, se pedir, pinta o desenho de uma cor só
const RECORTES = new Map();
function logoRecortado(id, tinta) {
  const L = LOGOS.get(id); if (!L) return null;
  const chave = id + "|" + (tinta || "");
  if (RECORTES.has(chave)) return RECORTES.get(chave);
  const w = L.img.naturalWidth, h = L.img.naturalHeight, t = document.createElement("canvas"); t.width = w; t.height = h;
  const x = t.getContext("2d", { willReadFrequently: true }); x.drawImage(L.img, 0, 0);
  const d = x.getImageData(0, 0, w, h).data; let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (d[(j * w + i) * 4 + 3] > 24) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
  if (x1 <= x0) return null;
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1, c = document.createElement("canvas"); c.width = cw; c.height = ch;
  const cx = c.getContext("2d"); cx.drawImage(L.img, x0, y0, cw, ch, 0, 0, cw, ch);
  if (tinta) { cx.globalCompositeOperation = "source-in"; cx.fillStyle = tinta; cx.fillRect(0, 0, cw, ch); }
  const r = { c, w: cw, h: ch }; RECORTES.set(chave, r); return r;
}

// ---------------------------------------------------------------- ferramentas de desenho (tudo em metros)
const pt = (c, a, b) => { const m = c.getTransform(); return [m.a * a + m.c * b + m.e, m.b * a + m.d * b + m.f]; };
function poli(c, pts, cor) { c.beginPath(); pts.forEach(([a, b], i) => (i ? c.lineTo(a, b) : c.moveTo(a, b))); c.closePath(); c.fillStyle = cor; c.fill(); }
function ret(c, a0, b0, a1, b1, cor) { c.fillStyle = cor; c.fillRect(Math.min(a0, a1), Math.min(b0, b1), Math.abs(a1 - a0), Math.abs(b1 - b0)); }
function degrade(c, a0, b0, a1, b1, paradas) { const g = c.createLinearGradient(a0, b0, a1, b1); paradas.forEach(([p, cor]) => g.addColorStop(p, cor)); return g; }
// texto na vista (sempre de pé e lendo da esquerda para a direita, nos dois lados do carro); h = altura da letra em metros
function texto(c, str, a, b, h, cor, { peso = 800, estilo = "italic", fam = "'Arial Black', Arial, Helvetica, sans-serif", larg = 0, esp = 0, borda = null, align = "center" } = {}) {
  const [x, y] = pt(c, a, b); c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  c.font = `${estilo} ${peso} ${Math.round(h * PX())}px ${fam}`; c.textAlign = align; c.textBaseline = "middle"; c.fillStyle = cor;
  if ("letterSpacing" in c) c.letterSpacing = esp ? Math.round(esp * PX()) + "px" : "0px";
  if (borda) { c.lineWidth = Math.max(1.5, h * PX() * 0.12); c.strokeStyle = borda; c.lineJoin = "round"; c.strokeText(str, x, y, larg ? larg * PX() : undefined); }
  c.fillText(str, x, y, larg ? larg * PX() : undefined); c.restore();
}
// Letra transversal ao carro, para ser lida do cockpit (a folha superior tem o eixo lateral na vertical).
function textoTopo(c, str, s, x, h, cor, { larg = 0, borda = null, estilo = "normal" } = {}) {
  const [px, py] = pt(c, s, x); c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.translate(px, py); c.rotate(-Math.PI / 2);
  c.font = `${estilo} 900 ${Math.round(h * PX())}px Arial, sans-serif`; c.textAlign = "center"; c.textBaseline = "middle";
  if (borda) { c.strokeStyle = borda; c.lineWidth = Math.max(2, h * PX() * 0.14); c.lineJoin = "round"; c.strokeText(str, 0, 0, larg ? larg * PX() : undefined); }
  c.fillStyle = cor; c.fillText(str, 0, 0, larg ? larg * PX() : undefined); c.restore();
}
// o logo da equipe numa caixa (a0..a1 x b0..b1, em metros) sem deformar, centrado
function logo(c, id, a0, b0, a1, b1, tinta) {
  const r = logoRecortado(id, tinta); if (!r) return;
  const [x0, y0] = pt(c, a0, b0), [x1, y1] = pt(c, a1, b1), bx = Math.min(x0, x1), by = Math.min(y0, y1), bw = Math.abs(x1 - x0), bh = Math.abs(y1 - y0);
  const e = Math.min(bw / r.w, bh / r.h), w = r.w * e, h = r.h * e;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(r.c, bx + (bw - w) / 2, by + (bh - h) / 2, w, h); c.restore();
}
// nome de patrocinador em tipografia aproximada (não é o logotipo oficial)
function patro(c, nome, a, b, h, cor, opc = {}) { texto(c, nome, a, b, h, cor, opc); }
// a marca desenhada (f1-marcas.js) em (a, b), com altura h em metros; `giro` em radianos: em cima do carro, DE_FRENTE é o que quem vem de frente lê
const DE_FRENTE = Math.PI / 2;
function marca(c, id, a, b, h, { giro = 0, tinta, fundo } = {}) {
  const [x, y] = pt(c, a, b), e = h * PX(); c.save(); c.setTransform(1, 0, 0, 1, x, y); c.rotate(giro); c.scale(e, e); desenharMarca(c, id, { tinta, fundo }); c.restore();
}
const mulberry = (seed) => () => { seed = (seed + 0x6D2B79F5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// ---------------------------------------------------------------- as vistas
// cada vista: prepara a transformação (metros -> pixels da folha), recorta no retângulo e chama o desenho
const VISTAS = {
  A: { r: [0, 0, 1024, 256], m: [-K, 0, 0, -K, 4.4 * K, 1.1 * K] },     // (s, y)
  B: { r: [0, 256, 1024, 256], m: [K, 0, 0, -K, 0, 256 + 1.1 * K] },     // (s, y)
  T: { r: [0, 512, 1024, 384], m: [K, 0, 0, -K, 0, 704] },               // (s, x)
  F: { r: [0, 896, 512, 256], m: [-K, 0, 0, -K, 256, 896 + 1.1 * K] },   // (x, y)
  R: { r: [512, 896, 512, 256], m: [K, 0, 0, -K, 768, 896 + 1.1 * K] },  // (x, y)
  // embaixo da asa traseira, como a vê quem vem atrás: (x, t) com x para a direita e t = s − 3,7 para baixo (a frente do carro fica para cima).
  // Fica num canto da vista A sem carro (s 0,05..1,25 com y acima de 0,62: medido, nada do carro ali). A escala não é igual nos dois eixos: desenhe com marcaU.
  U: { r: [733, 4, 279, 108], m: [253, 0, 0, 153, 872.5, 4.65] },
};
function vista(ctx, nome, fn) {
  const v = VISTAS[nome]; ctx.save(); ctx.beginPath(); ctx.rect(...v.r.map((n) => n * ESC)); ctx.clip(); ctx.setTransform(...v.m.map((n) => n * ESC)); fn(ctx); ctx.restore();
}
const lados = (ctx, fn) => { vista(ctx, "A", (c) => fn(c, 1)); vista(ctx, "B", (c) => fn(c, -1)); };

// ---------------------------------------------------------------- as equipes
// P = { ctx } ; cada desenho pinta o fundo e depois as vistas. Medidas do modelo (em metros, s = a partir do bico):
//   bico 0 .. 1,0 (y 0,1 .. 0,45) | asa dianteira s 0,1 .. 0,5 (x ± 0,73) | cockpit 1,3 .. 2,1 | airbox no 2,35 (y 0,97)
//   caixas laterais 2,05 .. 3,5 (y 0,1 .. 0,5) | tampa do motor 2,4 .. 3,9 | asa traseira 3,9 .. 4,4 (y 0,4 .. 0,96)
const DESENHOS = {};

// a base de qualquer carro: cor cheia em tudo e o carbono onde não aparece pintura (a barriga fica no material do assoalho)
function base(ctx, cor) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = cor; ctx.fillRect(0, 0, FW * ESC, FH * ESC); ctx.restore(); }

// o preto de baixo (assoalho e parte de baixo das caixas, subindo para trás), a sombra pintada que dá volume às caixas e as asas vistas de cima
function baixo(c, cor) {
  c.fillStyle = degrade(c, 0, 0.5, 0, 0.1, [[0, "rgba(0,0,0,0)"], [1, "rgba(0,0,0,0.3)"]]); c.fillRect(1.1, 0.1, 2.8, 0.4);
  c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 0.09); c.lineTo(2.1, 0.09); c.quadraticCurveTo(2.7, 0.14, 3.15, 0.2); c.quadraticCurveTo(3.55, 0.24, 3.8, 0.34); c.lineTo(4.45, 0.34); c.lineTo(4.45, 0); c.closePath(); c.fillStyle = cor; c.fill();
}
function asasT(c, frente, tras, bico) { ret(c, 0, -0.82, 0.66, 0.82, frente); poli(c, [[0, -0.09], [0.66, -0.14], [0.66, 0.14], [0, 0.09]], bico); ret(c, 3.82, -0.62, 4.45, 0.62, tras); }
// os touros: o desenho que já vem no logo da equipe (só a parte de baixo dele, sem o letreiro)
function touros(c, a0, b0, a1, b1) {
  const L = LOGOS.get("red-bull")?.img; if (!L) return;
  const [x0, y0] = pt(c, a0, b0), [x1, y1] = pt(c, a1, b1), w = Math.abs(x1 - x0), h = Math.abs(y1 - y0);
  c.save(); c.setTransform(1, 0, 0, 1, Math.min(x0, x1), Math.min(y0, y1)); c.drawImage(L, L.naturalWidth * 0.5, L.naturalHeight * 0.3, L.naturalWidth * 0.5, L.naturalHeight * 0.2, 0, 0, w, h); c.restore();
}
// McLaren MCL40, pelos prints do Thiago (2026-11-13): papaia; a tampa do motor preta descendo em diagonal até a asa, a entrada de ar azul-petróleo
// com o allwyn, a faixa preta em diagonal na caixa lateral (VELO e OKX), a asa dianteira preta com a faixa papaia do ONEflight e o Mastercard,
// o bico com a ponta preta e a estrela do Gemini, a asa traseira papaia em cima com o ETIHAD atrás e o Dropbox nas placas.
function estrelaGemini(c, a, b, h) {
  const [x, y] = pt(c, a, b), e = h * PX() / 2; c.save(); c.setTransform(1, 0, 0, 1, x, y); c.beginPath();
  for (let i = 0; i < 4; i++) { const g = i * Math.PI / 2; c.lineTo(Math.cos(g) * e, Math.sin(g) * e); c.lineTo(Math.cos(g + Math.PI / 4) * e * 0.2, Math.sin(g + Math.PI / 4) * e * 0.2); }
  c.closePath(); c.fillStyle = "#7cc4ff"; c.fill(); c.restore();
}
DESENHOS.mclaren = {
  numero: "#ffffff", carbono: 1, numPos: [3.46, 0.7, 9, 9],
  pintar(ctx) {
    const PAP = "#ff8000", PRETO = "#141518", PETROLEO = "#1d4048", AZUL_DP = "#1d2a5c";
    base(ctx, PAP);
    lados(ctx, (c) => {
      // a tampa preta, que desce em diagonal até a asa, e a entrada de ar azul-petróleo
      c.beginPath(); c.moveTo(2.0, 1.1); c.lineTo(3.88, 1.1); c.lineTo(3.88, 0.42); c.quadraticCurveTo(3.2, 0.7, 2.6, 0.66); c.lineTo(2.0, 0.6); c.closePath(); c.fillStyle = PRETO; c.fill();
      ret(c, 2.02, 0.8, 2.58, 1.1, PETROLEO);
      // a faixa preta em diagonal na frente da caixa lateral, descendo para trás
      poli(c, [[1.55, 0.2], [1.55, 0.56], [2.45, 0.56], [3.05, 0.18], [2.3, 0.12]], PRETO);
      baixo(c, PRETO);
      poli(c, [[0, 0], [0.62, 0], [0.62, 0.17], [0.34, 0.2], [0, 0.2]], PRETO); // a asa dianteira
      ret(c, 3.86, 0.3, 4.45, 0.55, PRETO); // a parte de baixo da asa traseira (as placas papaia, com o Dropbox)
      ret(c, 1.05, 0.39, 1.48, 0.47, AZUL_DP); marca(c, "dpworld", 1.26, 0.43, 0.03);
      marca(c, "gemini", 3.0, 0.78, 0.085); marca(c, "allwyn", 2.3, 0.94, 0.045); marca(c, "velo", 2.02, 0.44, 0.06); marca(c, "okx", 2.55, 0.32, 0.06);
      marca(c, "mastercard", 2.95, 0.3, 0.065); marca(c, "dell", 3.2, 0.52, 0.045, { tinta: PRETO });
      marca(c, "dropbox", 4.15, 0.74, 0.05, { tinta: PRETO }); marca(c, "groq", 4.15, 0.42, 0.035);
    });
    vista(ctx, "T", (c) => {
      ret(c, 2.0, -0.26, 3.9, 0.26, PRETO); ret(c, 2.0, -0.15, 2.5, 0.15, PETROLEO); // a tampa e a entrada de ar
      asasT(c, PRETO, PAP, PAP);
      poli(c, [[0, -0.09], [0.26, -0.11], [0.26, 0.11], [0, 0.09]], PRETO); estrelaGemini(c, 0.14, 0, 0.08); // a ponta do bico
      const f = { giro: DE_FRENTE };
      for (const l of [-1, 1]) {
        poli(c, [[0.02, l * 0.18], [0.13, l * 0.18], [0.13, l * 0.78], [0.02, l * 0.78]], PAP); marca(c, "oneflight", 0.075, l * 0.48, 0.07, { giro: DE_FRENTE, tinta: PRETO });
        marca(c, "mastercard", 0.32, l * 0.42, 0.075, f);
      }
      marca(c, "hilton", 1.22, 0, 0.04, { giro: DE_FRENTE, tinta: PRETO }); // (de 0,25 a 1,15 o bico leva o atlas do nariz: texturaDoCockpit)
      marca(c, "allwyn", 2.25, 0, 0.05, f); marca(c, "gemini", 3.0, 0, 0.08, f);
      marca(c, "etihad", 4.12, 0, 0.08, { giro: DE_FRENTE, tinta: PRETO });
    });
    vista(ctx, "F", (c) => { ret(c, -0.8, 0, 0.8, 1.1, PAP); ret(c, -0.55, 0, 0.55, 0.15, PRETO); ret(c, -0.16, 0.8, 0.16, 1.1, PETROLEO); });
    vista(ctx, "R", (c) => { ret(c, -0.8, 0, 0.8, 1.1, PAP); ret(c, -0.8, 0.78, 0.8, 1.1, PRETO); marca(c, "etihad", 0, 0.9, 0.09); });
  },
};

// Ferrari SF-26 (as fotos oficiais do lançamento, ver halo-referencias.md): vermelho, os ombros da tampa brancos com o redondo da HP, o branco envolvendo o
// cockpit; assoalho, parte de baixo das caixas e as duas asas azul-marinho (os prints do Thiago, 2026-11-13); o bico leva a fileira de patrocinadores, lida por quem vem de frente.
DESENHOS.ferrari = {
  numero: "#ffffff",
  carbono: 1,
  numPos: [3.42, 0.62, 9, 9], // o número na barbatana, branco sobre o vermelho; a asa traseira não tem número
  pintar(ctx) {
    const VERM = "#b90d16", ESCURO = "#8e0a12", BRANCO = "#ecebe6", PRETO = "#101113", AZUL = "#182035"; // (o azul-marinho das asas e de baixo, nos prints de 2026-11-13)
    base(ctx, VERM);
    lados(ctx, (c) => {
      // o branco dos ombros: sobe em curva até a barbatana, que continua vermelha
      c.beginPath(); c.moveTo(2.2, 0.6); c.lineTo(2.2, 1.1); c.lineTo(3.3, 1.1); c.lineTo(3.3, 0.8); c.quadraticCurveTo(3.14, 0.54, 2.8, 0.5); c.quadraticCurveTo(2.45, 0.49, 2.2, 0.56); c.closePath(); c.fillStyle = BRANCO; c.fill();
      // a sombra pintada na barriga das caixas laterais, que dá volume sem custar nada
      c.fillStyle = degrade(c, 0, 0.5, 0, 0.1, [[0, "rgba(60,0,4,0)"], [1, "rgba(60,0,4,0.42)"]]); c.fillRect(1.1, 0.1, 2.8, 0.4);
      // o preto de baixo: o assoalho e a parte de baixo das caixas, subindo para trás
      c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 0.09); c.lineTo(2.1, 0.09); c.quadraticCurveTo(2.7, 0.14, 3.15, 0.2); c.quadraticCurveTo(3.55, 0.24, 3.8, 0.34); c.lineTo(4.45, 0.34); c.lineTo(4.45, 0); c.closePath(); c.fillStyle = AZUL; c.fill();
      // a asa dianteira preta e a traseira preta
      poli(c, [[0, 0], [0.62, 0], [0.62, 0.17], [0.34, 0.2], [0, 0.2]], AZUL);
      ret(c, 3.82, 0.3, 4.45, 1.1, AZUL);
      // as marcas, cada uma onde está no carro de verdade
      marca(c, "hp", 2.86, 0.61, 0.17);
      marca(c, "ibm", 2.56, 0.56, 0.048, { tinta: PRETO, fundo: BRANCO });
      marca(c, "zyn", 2.3, 0.63, 0.05, { tinta: PRETO });
      marca(c, "shell", 2.62, 0.3, 0.2);
      marca(c, "ceva", 2.98, 0.3, 0.075, { tinta: "#ffffff" });
      marca(c, "unicredit", 3.08, 0.44, 0.055, { tinta: "#ffffff" });
      marca(c, "richardmille", 1.42, 0.46, 0.036, { tinta: "#ffffff" });
      logo(c, "ferrari", 1.66, 0.42, 1.8, 0.56);
      marca(c, "ambipar", 1.9, 0.135, 0.045, { tinta: "#ffffff" });
      marca(c, "unicredit", 0.42, 0.14, 0.035, { tinta: "#ffffff" });
      marca(c, "bitdefender", 0.72, 0.31, 0.03, { tinta: "#ffffff" });
      marca(c, "vpower", 4.15, 0.74, 0.06, { tinta: "#ffffff" });
      marca(c, "peroni", 4.15, 0.655, 0.045, { tinta: "#ffffff" });
    });
    vista(ctx, "T", (c) => {
      // a pele do meio: branca em volta do cockpit e afinando até a barbatana
      const meio = [[1.34, 0.05], [1.6, 0.24], [2.1, 0.38], [2.6, 0.33], [3.0, 0.19], [3.32, 0.02]];
      c.beginPath(); c.moveTo(meio[0][0], meio[0][1]); for (let i = 1; i < meio.length; i++) { const [a0, b0] = meio[i - 1], [a1, b1] = meio[i]; c.quadraticCurveTo(a0, b0, (a0 + a1) / 2, (b0 + b1) / 2); } c.lineTo(3.32, 0.02);
      c.lineTo(3.32, -0.02); for (let i = meio.length - 2; i >= 0; i--) { const [a0, b0] = meio[i + 1], [a1, b1] = meio[i]; c.quadraticCurveTo(a0, -b0, (a0 + a1) / 2, -(b0 + b1) / 2); } c.lineTo(1.34, -0.05); c.closePath(); c.fillStyle = BRANCO; c.fill();
      // as duas asas pretas; o bico vermelho passa por cima da asa dianteira
      ret(c, 0, -0.82, 0.66, 0.82, AZUL); poli(c, [[0, -0.09], [0.66, -0.14], [0.66, 0.14], [0, 0.09]], VERM);
      ret(c, 3.82, -0.62, 4.45, 0.62, AZUL);
      // a fileira do bico, lida por quem vem de frente
      const f = { giro: DE_FRENTE, tinta: "#ffffff" };
      marca(c, "unicredit", 0.18, 0, 0.042, f); marca(c, "genesys", 0.3, 0, 0.034, f); marca(c, "pirelli", 0.4, 0, 0.038, f);
      marca(c, "whoop", 0.5, 0, 0.038, f); marca(c, "bingx", 0.6, 0, 0.052, f); marca(c, "ibm", 0.71, 0, 0.056, { giro: DE_FRENTE, tinta: "#ffffff", fundo: VERM });
      marca(c, "shell", 0.85, 0, 0.13, { giro: DE_FRENTE }); marca(c, "zyn", 1.17, 0, 0.06, f); marca(c, "bitdefender", 1.29, 0, 0.032, f);
      // a asa dianteira
      for (const l of [-1, 1]) { marca(c, "rayban", 0.2, l * 0.45, 0.07, f); marca(c, "vpower", 0.36, l * 0.42, 0.038, f); marca(c, "hp", 0.5, l * 0.32, 0.075, { giro: DE_FRENTE }); }
      // o redondo grande na tampa e a marca dos ombros
      marca(c, "hp", 2.96, 0, 0.17, { giro: DE_FRENTE });
      for (const l of [-1, 1]) { marca(c, "zyn", 2.12, l * 0.3, 0.035, { giro: DE_FRENTE, tinta: PRETO }); marca(c, "ibm", 2.48, l * 0.25, 0.04, { giro: DE_FRENTE, tinta: PRETO, fundo: BRANCO }); }
      // a asa traseira: o IBM azul no meio, lido por quem vem atrás, e os redondos da HP nas pontas
      marca(c, "ibm", 4.15, 0, 0.11, { giro: -DE_FRENTE, tinta: "#3a6fd0", fundo: AZUL });
      for (const l of [-1, 1]) marca(c, "hp", 4.18, l * 0.45, 0.1, { giro: DE_FRENTE });
    });
    vista(ctx, "F", (c) => { ret(c, -0.8, 0, 0.8, 1.1, ESCURO); ret(c, -0.8, 0, 0.8, 0.24, AZUL); ret(c, -0.16, 0.06, 0.16, 0.5, VERM); });
    vista(ctx, "R", (c) => { ret(c, -0.8, 0, 0.8, 1.1, AZUL); ret(c, -0.3, 0.36, 0.3, 0.72, VERM); marca(c, "ibm", 0, 0.88, 0.1, { tinta: "#3a6fd0", fundo: AZUL }); });
  },
};

// Mercedes W17, pelos prints do Thiago (2026-11-13): o corpo prata, a parte de cima preta (do cockpit à asa traseira) com as estrelas
// apagadas, o filete verde-água separando o preto do prata, as faixas pretas em diagonal na caixa lateral, as asas grafite com os riscos
// verde-água, o bico prata com a estrela na ponta e o CROWDSTRIKE atrás. Tudo desenhado no canvas (nenhuma imagem a baixar).
function estrelas(c, s0, s1, y0, y1, n, cor, semente) {
  const r = mulberry(semente); c.fillStyle = cor;
  for (let i = 0; i < n; i++) {
    const s = s0 + r() * (s1 - s0), y = y0 + r() * (y1 - y0), e = 0.012 + r() * 0.02;
    c.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, q = k % 2 ? e * 0.42 : e; c.lineTo(s + Math.cos(a) * q, y + Math.sin(a) * q); } c.closePath(); c.fill();
  }
}
DESENHOS.mercedes = {
  numero: "#00d7b6", carbono: 1, numPos: [3.42, 0.68, 9, 9],
  pintar(ctx) {
    const PRATA = "#c5cacf", PRATA_CL = "#e2e5e8", PRETO = "#0c0d0f", GRAFITE = "#26292d", VERDE = "#00d2be", ESTRELA = "#22262b";
    base(ctx, PRATA);
    lados(ctx, (c) => {
      // o preto de cima: do cockpit até a asa, descendo para trás; o filete verde-água na borda
      const borda = (c) => { c.moveTo(1.5, 0.64); c.lineTo(1.95, 0.58); c.quadraticCurveTo(2.5, 0.52, 3.0, 0.46); c.quadraticCurveTo(3.5, 0.4, 3.85, 0.36); };
      c.beginPath(); borda(c); c.lineTo(4.45, 0.36); c.lineTo(4.45, 1.1); c.lineTo(1.5, 1.1); c.closePath(); c.fillStyle = PRETO; c.fill();
      estrelas(c, 2.0, 3.8, 0.5, 0.95, 70, ESTRELA, 63);
      c.beginPath(); borda(c); c.lineWidth = 0.014; c.strokeStyle = VERDE; c.stroke();
      // as faixas pretas em diagonal na frente da caixa lateral
      for (let i = 0; i < 4; i++) { const s = 2.18 + i * 0.11; poli(c, [[s, 0.16], [s + 0.05, 0.16], [s + 0.17, 0.5], [s + 0.12, 0.5]], PRETO); }
      // o filete verde-água embaixo do bico e da caixa
      poli(c, [[0.25, 0.2], [2.1, 0.2], [2.1, 0.214], [0.25, 0.214]], VERDE);
      baixo(c, PRETO);
      poli(c, [[0, 0], [0.62, 0], [0.62, 0.17], [0.34, 0.2], [0, 0.2]], GRAFITE); // a asa dianteira
      ret(c, 3.82, 0.3, 4.45, 1.1, PRETO); // a asa traseira
      marca(c, "petronas", 2.9, 0.27, 0.08, { tinta: PRETO });
      marca(c, "microsoft", 2.78, 0.8, 0.05); marca(c, "teamviewer", 2.6, 0.67, 0.034); marca(c, "solera", 3.15, 0.66, 0.03);
      marca(c, "amg", 1.2, 0.32, 0.045, { tinta: PRETO }); marca(c, "signify", 1.72, 0.27, 0.032, { tinta: PRETO }); marca(c, "ineos", 1.62, 0.5, 0.03, { tinta: PRETO });
      marca(c, "iwc", 0.36, 0.11, 0.04);
      marca(c, "snapdragon", 4.15, 0.8, 0.034); marca(c, "crowdstrike", 4.15, 0.7, 0.03); marca(c, "gota", 4.18, 0.5, 0.13);
    });
    vista(ctx, "T", (c) => {
      // as faixas pretas no alto das caixas laterais, em diagonal para fora e para trás
      for (const l of [-1, 1]) for (let i = 0; i < 4; i++) { const s = 2.2 + i * 0.13; poli(c, [[s, l * 0.3], [s + 0.06, l * 0.3], [s + 0.24, l * 0.64], [s + 0.18, l * 0.64]], PRETO); }
      // o preto em volta do cockpit e na tampa, com o filete verde-água
      const meio = [[1.3, 0.1], [1.6, 0.27], [2.2, 0.31], [2.9, 0.25], [3.5, 0.17], [4.0, 0.13]];
      const contorno = (c) => { c.moveTo(meio[0][0], meio[0][1]); for (const [a, b] of meio.slice(1)) c.lineTo(a, b); c.lineTo(4.45, 0.13); c.lineTo(4.45, -0.13); for (const [a, b] of meio.slice().reverse()) c.lineTo(a, -b); c.closePath(); };
      c.beginPath(); contorno(c); c.fillStyle = PRETO; c.fill(); c.lineWidth = 0.014; c.strokeStyle = VERDE; c.stroke();
      estrelas(c, 1.9, 3.9, -0.22, 0.22, 90, ESTRELA, 17);
      for (const l of [-1, 1]) poli(c, [[1.48, l * 0.2], [1.62, l * 0.27], [1.75, l * 0.36], [1.6, l * 0.33]], VERDE); // os riscos verde-água na frente do cockpit
      // as asas grafite (a traseira preta) e o bico prata claro, com as bordas verde-água
      asasT(c, GRAFITE, PRETO, PRATA_CL);
      poli(c, [[0.66, 0.14], [1.3, 0.12], [1.3, 0.135], [0.66, 0.155]], VERDE); poli(c, [[0.66, -0.14], [1.3, -0.12], [1.3, -0.135], [0.66, -0.155]], VERDE);
      for (const l of [-1, 1]) for (const x of [0.3, 0.62]) poli(c, [[0.12, l * x], [0.15, l * x], [0.5, l * (x + 0.03)], [0.47, l * (x + 0.03)]], VERDE);
      const f = { giro: DE_FRENTE };
      marca(c, "estrela", 0.12, 0, 0.075, { giro: DE_FRENTE, tinta: PRETO }); // a ponta do bico (o resto do bico é o atlas do nariz, f1-pintura texturaDoCockpit)
      marca(c, "syntium", 1.2, 0, 0.05, { giro: DE_FRENTE, tinta: PRETO });
      for (const l of [-1, 1]) { marca(c, "teamviewer", 0.2, l * 0.47, 0.045, f); marca(c, "syntium", 0.4, l * 0.45, 0.04, f); }
      marca(c, "petronas", 4.12, 0, 0.09, f);
    });
    vista(ctx, "F", (c) => { ret(c, -0.8, 0, 0.8, 1.1, PRETO); ret(c, -0.2, 0.15, 0.2, 0.5, PRATA); ret(c, -0.2, 0.15, 0.2, 0.17, VERDE); });
    vista(ctx, "R", (c) => { ret(c, -0.8, 0, 0.8, 1.1, PRETO); marca(c, "crowdstrike", 0, 0.85, 0.08); });
  },
};

// Red Bull RB22, pelos prints do Thiago (2026-11-13): azul-marinho com manchas mais escuras, o touro vermelho grande na tampa com o sol amarelo
// na entrada de ar, o bico amarelo com a chama vermelha, as asas de carbono com o "Red Bull" vermelho grande e o VISA na dianteira, o Mobil 1 nas
// placas da traseira, o ORACLE atrás e na caixa lateral, a TAG Heuer na frente do cockpit. Tudo desenhado no canvas (nenhuma imagem nova).
function manchas(c, s0, s1, y0, y1, n, cor, semente) {
  const r = mulberry(semente); c.fillStyle = cor;
  for (let i = 0; i < n; i++) { c.beginPath(); c.ellipse(s0 + r() * (s1 - s0), y0 + r() * (y1 - y0), 0.01 + r() * 0.03, 0.008 + r() * 0.02, r() * Math.PI, 0, Math.PI * 2); c.fill(); }
}
// letra grossa com contorno, girada (em metros, no plano da vista)
function letreiro(c, str, a, b, h, cor, borda, giro = 0) {
  const [px, py] = pt(c, a, b); c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.translate(px, py); c.rotate(giro);
  c.font = `italic 900 ${Math.round(h * PX())}px 'Arial Black', Arial, sans-serif`; c.textAlign = "center"; c.textBaseline = "middle";
  c.strokeStyle = borda; c.lineWidth = Math.max(2, h * PX() * 0.16); c.lineJoin = "round"; c.strokeText(str, 0, 0); c.fillStyle = cor; c.fillText(str, 0, 0); c.restore();
}
DESENHOS["red-bull"] = {
  numero: "#ffffff", carbono: 1, numPos: [3.5, 0.62, 9, 9],
  pintar(ctx) {
    const AZUL = "#1b2452", ESC = "#0e1430", MANCHA = "#131a3e", VERM = "#d3112f", AMAR = "#f7c600", CARB = "#25272b";
    base(ctx, AZUL);
    lados(ctx, (c) => {
      manchas(c, 1.1, 3.9, 0.15, 1.05, 140, MANCHA, 22);
      // o sol amarelo na entrada de ar e o touro grande na tampa
      ret(c, 2.18, 0.86, 2.52, 1.1, AMAR); c.beginPath(); c.arc(2.46, 0.84, 0.19, 0, Math.PI * 2); c.fillStyle = AMAR; c.fill();
      touros(c, 2.42, 0.6, 3.48, 1.02);
      baixo(c, ESC);
      // o bico: amarelo na ponta, a chama vermelha atrás
      poli(c, [[0, 0.17], [0.7, 0.17], [0.58, 0.32], [0, 0.24]], AMAR); poli(c, [[0.55, 0.17], [1.05, 0.17], [0.92, 0.38], [0.58, 0.32]], VERM);
      poli(c, [[0, 0], [0.62, 0], [0.62, 0.17], [0.34, 0.2], [0, 0.2]], CARB); // a asa dianteira
      ret(c, 3.82, 0.3, 4.45, 1.1, CARB); // a asa traseira
      marca(c, "redbull", 2.98, 0.57, 0.075, { tinta: VERM }); marca(c, "oracle", 2.7, 0.33, 0.105); marca(c, "rokt", 2.28, 0.63, 0.035);
      marca(c, "carlyle", 1.72, 0.5, 0.03); marca(c, "mobil1", 1.05, 0.28, 0.035); marca(c, "mobil1", 0.32, 0.1, 0.035);
      marca(c, "mobil1", 4.15, 0.8, 0.07); marca(c, "redbull", 4.15, 0.62, 0.04, { tinta: VERM });
    });
    vista(ctx, "T", (c) => {
      manchas(c, 1.2, 3.9, -0.65, 0.65, 160, MANCHA, 7);
      c.beginPath(); c.arc(2.42, 0, 0.17, 0, Math.PI * 2); c.fillStyle = AMAR; c.fill(); // o sol, de cima
      touros(c, 2.55, 0.26, 3.45, 0.62); touros(c, 2.55, -0.62, 3.45, -0.26); // os touros no alto das caixas
      asasT(c, CARB, CARB, AZUL);
      poli(c, [[0, -0.09], [0.45, -0.12], [0.45, 0.12], [0, 0.09]], AMAR); poli(c, [[0.45, -0.12], [0.78, -0.14], [0.78, 0.14], [0.45, 0.12]], VERM); // o bico
      const f = { giro: DE_FRENTE };
      for (const l of [-1, 1]) { letreiro(c, "Red Bull", 0.16, l * 0.47, 0.1, VERM, "#ffffff", DE_FRENTE); marca(c, "visa", 0.42, l * 0.46, 0.05, f); }
      marca(c, "visa", 0.82, 0, 0.03, f); marca(c, "att", 0.88, 0, 0.026, f); marca(c, "tagheuer", 1.22, 0, 0.075, f);
      marca(c, "oracle", 2.0, 0.42, 0.04, { giro: DE_FRENTE }); marca(c, "oracle", 2.0, -0.42, 0.04, { giro: DE_FRENTE });
      marca(c, "gate", 4.12, 0, 0.09, f);
    });
    vista(ctx, "F", (c) => { ret(c, -0.8, 0, 0.8, 1.1, AZUL); ret(c, -0.14, 0.1, 0.14, 0.4, AMAR); });
    vista(ctx, "R", (c) => { ret(c, -0.8, 0, 0.8, 1.1, AZUL); touros(c, -0.45, 0.42, 0.45, 0.76); ret(c, -0.8, 0.8, 0.8, 1.1, CARB); marca(c, "oracle", 0, 0.9, 0.08); });
  },
};

// Racing Bulls: azul-marinho em cima e embaixo, a grande cunha branca com VISA, os touros e a entrada de ar amarela
DESENHOS["racing-bulls"] = {
  numero: "#d3112f", carbono: 1, numPos: [3.5, 0.72, 9, 9],
  pintar(ctx) {
    const BRANCO = "#eff1f6", MAR = "#14224f", AMAR = "#f9b000", VERM = "#d3112f", LARANJA = "#ff6a13";
    base(ctx, MAR);
    lados(ctx, (c) => {
      // a cunha branca, larga atrás e fina até o bico
      c.beginPath(); c.moveTo(3.55, 0.16); c.lineTo(3.1, 0.54); c.quadraticCurveTo(2.0, 0.64, 1.1, 0.5); c.lineTo(0.5, 0.26); c.lineTo(1.05, 0.28); c.quadraticCurveTo(2.0, 0.42, 2.3, 0.2); c.closePath(); c.fillStyle = BRANCO; c.fill();
      ret(c, 1.3, 0.45, 2.1, 0.6, BRANCO);
      poli(c, [[2.2, 0.72], [2.2, 1.1], [2.66, 1.1], [2.66, 0.72]], AMAR);
      baixo(c, MAR);
      poli(c, [[0.04, 0.12], [0.5, 0.12], [0.42, 0.28], [0.04, 0.2]], LARANJA); ret(c, 0.05, 0, 0.6, 0.16, BRANCO);
      ret(c, 3.86, 0.3, 4.45, 1.1, "#0e1021");
      touros(c, 2.68, 0.64, 3.46, 0.96);
      marca(c, "visa", 2.86, 0.31, 0.14, { tinta: MAR }); marca(c, "redbull", 3.05, 0.61, 0.055, { tinta: VERM }); marca(c, "cashapp", 2.42, 0.57, 0.045, { tinta: MAR }); marca(c, "hugo", 1.75, 0.53, 0.045, { tinta: VERM });
      marca(c, "ford", 3.5, 0.34, 0.075); marca(c, "cashapp", 0.33, 0.08, 0.042, { tinta: MAR }); marca(c, "visa", 4.15, 0.72, 0.055, { tinta: BRANCO });
    });
    vista(ctx, "T", (c) => {
      ret(c, 2.3, -0.3, 2.72, 0.3, AMAR); ret(c, 2.72, -0.3, 4, 0.3, MAR); ret(c, 1.3, -0.25, 2.1, 0.25, BRANCO);
      asasT(c, MAR, "#0e1021", MAR); poli(c, [[0, -0.09], [0.35, -0.12], [0.35, 0.12], [0, 0.09]], LARANJA);
      const f = { giro: DE_FRENTE, tinta: "#fff" }; marca(c, "visa", 0.86, 0, 0.09, f); marca(c, "hugo", 0.62, 0, 0.04, f); marca(c, "visa", 4.15, 0, 0.1, f);
    });
    vista(ctx, "F", (c) => { ret(c, -0.8, 0, 0.8, 1.1, MAR); ret(c, -0.15, 0.1, 0.15, 0.45, LARANJA); });
    vista(ctx, "R", (c) => { ret(c, -0.8, 0, 0.8, 1.1, MAR); ret(c, -0.5, 0.45, 0.5, 0.75, BRANCO); });
  },
};

// Aston Martin AMR26: verde de corrida bem escuro, filete limão e as marcas em branco
DESENHOS["aston-martin"] = {
  numero: "#d7e600", carbono: 1, numPos: [3.5, 0.66, 9, 9],
  pintar(ctx) {
    const VERDE = "#0a4a3f", ESC = "#062d27", LIMAO = "#cedc00", PRETO = "#0a1210";
    base(ctx, VERDE);
    lados(ctx, (c) => {
      c.beginPath(); c.moveTo(2.2, 0.66); c.lineTo(2.2, 1.1); c.lineTo(3.9, 1.1); c.lineTo(3.9, 0.56); c.quadraticCurveTo(3, 0.72, 2.2, 0.66); c.closePath(); c.fillStyle = ESC; c.fill();
      c.fillStyle = LIMAO; c.fillRect(2.05, 0.405, 1.5, 0.012);
      baixo(c, PRETO);
      poli(c, [[0, 0.18], [1.1, 0.37], [1.1, 0.385], [0, 0.195]], LIMAO);
      ret(c, 3.86, 0.3, 4.45, 1.1, PRETO);
      marca(c, "aramco", 2.8, 0.31, 0.125); marca(c, "astonmartin", 3.2, 0.74, 0.042); marca(c, "maaden", 3.1, 0.64, 0.042); marca(c, "boss", 2.15, 0.52, 0.042); marca(c, "valvoline", 3.2, 0.17, 0.036); marca(c, "honda", 3.32, 0.44, 0.036);
      marca(c, "coinbase", 4.15, 0.72, 0.065); marca(c, "cognizant", 1.72, 0.22, 0.036, { tinta: LIMAO }); marca(c, "coreweave", 2.56, 0.82, 0.03);
    });
    vista(ctx, "T", (c) => {
      ret(c, 2.3, -0.3, 4, 0.3, ESC); ret(c, 2.3, -0.012, 3.9, 0.012, LIMAO); ret(c, 0.15, -0.012, 1.1, 0.012, LIMAO);
      asasT(c, ESC, PRETO, VERDE);
      const f = { giro: DE_FRENTE, tinta: "#fff" }; marca(c, "aramco", 0.72, 0, 0.08, f); marca(c, "coinbase", 4.15, 0, 0.08, f); marca(c, "aramco", 2.9, 0, 0.09, f);
    });
    vista(ctx, "F", (c) => { ret(c, -0.8, 0, 0.8, 1.1, VERDE); ret(c, -0.75, 0, 0.75, 0.1, ESC); });
    vista(ctx, "R", (c) => { ret(c, -0.8, 0, 0.8, 1.1, PRETO); ret(c, -0.45, 0.45, 0.45, 0.75, VERDE); });
  },
};

// Williams FW48: azul-royal escuro em cima, azul-claro no meio da caixa, a cunha branca com KOMATSU e a asa traseira branca e azul
DESENHOS.williams = {
  numero: "#ffffff", carbono: 1, numPos: [3.5, 0.58, 9, 9],
  pintar(ctx) {
    const ROYAL = "#0f2f8f", ESC = "#08184f", CEU = "#3d7be0", BRANCO = "#f2f5fb";
    base(ctx, ROYAL);
    lados(ctx, (c) => {
      c.beginPath(); c.moveTo(1.1, 0.5); c.quadraticCurveTo(2.2, 0.56, 3.1, 0.46); c.lineTo(2.55, 0.34); c.lineTo(1.1, 0.34); c.closePath(); c.fillStyle = CEU; c.fill();
      c.beginPath(); c.moveTo(3.6, 0.14); c.lineTo(3.48, 0.44); c.lineTo(3.1, 0.46); c.lineTo(2.4, 0.3); c.lineTo(2.6, 0.14); c.closePath(); c.fillStyle = BRANCO; c.fill();
      baixo(c, ESC);
      poli(c, [[2.3, 0.72], [2.3, 0.98], [2.66, 0.98], [2.66, 0.72]], "#101114");
      ret(c, 3.86, 0.62, 4.45, 1.1, ESC); ret(c, 3.86, 0.3, 4.45, 0.62, BRANCO);
      marca(c, "komatsu", 3.1, 0.28, 0.09, { tinta: ROYAL }); marca(c, "atlassian", 2.92, 0.62, 0.065); marca(c, "barclays", 2.22, 0.43, 0.042); marca(c, "duracell", 2.48, 0.85, 0.04); marca(c, "gulf", 3.55, 0.3, 0.09);
      marca(c, "komatsu", 4.15, 0.73, 0.055); marca(c, "gulf", 4.15, 0.48, 0.1); marca(c, "keeper", 1.75, 0.22, 0.034);
    });
    vista(ctx, "T", (c) => {
      ret(c, 2.3, -0.3, 4, 0.3, ESC);
      asasT(c, ESC, ESC, ROYAL);
      const f = { giro: DE_FRENTE, tinta: "#fff" }; marca(c, "komatsu", 0.72, 0, 0.05, f); marca(c, "atlassian", 4.15, 0, 0.08, f); marca(c, "atlassian", 2.9, 0, 0.06, f); marca(c, "barclays", 0.5, 0, 0.038, f);
    });
    vista(ctx, "F", (c) => { ret(c, -0.8, 0, 0.8, 1.1, ROYAL); ret(c, -0.55, 0, 0.55, 0.12, ESC); });
    vista(ctx, "R", (c) => { ret(c, -0.8, 0, 0.8, 1.1, ESC); ret(c, -0.45, 0.3, 0.45, 0.6, BRANCO); });
  },
};

// Audi R26 (2026), pelo modelo do Sketchfab que o Thiago mandou ("F1 2026 Audi R26 Launch version", olhado de lado, de cima, de trás e por baixo
// da asa): titânio do bico até logo atrás da entrada de ar (s 2,33), grafite dali para trás; a cunha laranja na caixa lateral, de s 2,33 a 3,28,
// afinando para trás (de lado e no alto da caixa); o painel preto embaixo da frente da caixa com o ninjaOne; o Revolut grande em preto no
// titânio; os anéis vermelhos na tampa, no bico e na espinha; as asas de titânio com o Revolut; as placas grafite com o visit QATAR.
DESENHOS.audi = {
  numero: "#e8401c", carbono: 1, numPos: [3.55, 0.68, 9, 9],
  pintar(ctx) {
    const TIT = "#c4c8cc", TIT_CL = "#d9dcdf", GRAF = "#2c3036", LAR = "#e8401c", PRETO = "#0d0e11", CORTE = 2.33;
    base(ctx, TIT);
    lados(ctx, (c) => {
      ret(c, CORTE, 0, 4.45, 1.1, GRAF); // atrás da entrada de ar, grafite
      // a cunha laranja: alta no corte, afinando para trás até a ponta em s 3,28
      c.beginPath(); c.moveTo(CORTE, 0.18); c.lineTo(CORTE, 0.6); c.quadraticCurveTo(2.85, 0.56, 3.28, 0.26); c.lineTo(3.2, 0.18); c.closePath(); c.fillStyle = LAR; c.fill();
      poli(c, [[1.3, 0.1], [2.05, 0.1], [2.05, 0.3], [1.3, 0.33]], PRETO); // o painel preto embaixo da frente da caixa
      baixo(c, PRETO);
      poli(c, [[0, 0], [0.62, 0], [0.62, 0.17], [0.34, 0.2], [0, 0.2]], GRAF); // as placas da asa dianteira
      ret(c, 3.82, 0.3, 4.45, 1.1, PRETO); // a asa traseira de carbono
      marca(c, "revolut", 1.95, 0.4, 0.075, { tinta: PRETO }); marca(c, "castrol", 2.05, 0.56, 0.032, { tinta: PRETO });
      marca(c, "nexo", 1.15, 0.45, 0.034, { tinta: PRETO }); marca(c, "ninjaone", 1.66, 0.22, 0.036); marca(c, "hyatt", 1.62, 0.62, 0.016, { tinta: PRETO });
      marca(c, "aneis", 2.58, 0.8, 0.07, { tinta: LAR }); marca(c, "bp", 3.2, 0.78, 0.06); marca(c, "visitqatar", 2.42, 0.95, 0.022);
      marca(c, "visitqatar", 0.28, 0.12, 0.05);
    });
    vista(ctx, "T", (c) => {
      // atrás do corte: a espinha e a tampa grafite, e a cunha laranja no alto de cada caixa lateral
      ret(c, CORTE, -0.7, 4.45, 0.7, GRAF);
      for (const l of [-1, 1]) { c.beginPath(); c.moveTo(CORTE, l * 0.14); c.lineTo(CORTE, l * 0.68); c.quadraticCurveTo(2.95, l * 0.62, 3.28, l * 0.4); c.lineTo(3.05, l * 0.14); c.closePath(); c.fillStyle = LAR; c.fill(); }
      asasT(c, TIT_CL, GRAF, TIT_CL);
      const f = { giro: DE_FRENTE, tinta: PRETO };
      for (const l of [-1, 1]) { marca(c, "revolut", 0.26, l * 0.48, 0.06, f); marca(c, "nexo", 1.22, l * 0.09, 0.02, f); marca(c, "castrol", 2.1, l * 0.36, 0.03, { giro: Math.PI / 2 * l, tinta: PRETO }); }
      marca(c, "revolutr", 0.14, 0, 0.06, f); marca(c, "adidas", 0.74, 0, 0.05, f); marca(c, "aneis", 1.26, 0, 0.045, { giro: DE_FRENTE, tinta: LAR });
      marca(c, "aneis", 2.75, 0, 0.065, { tinta: LAR }); // os anéis ao longo da espinha
      marca(c, "revolut", 4.12, 0, 0.08, { giro: -DE_FRENTE, tinta: TIT });
    });
    vista(ctx, "F", (c) => { ret(c, -0.8, 0, 0.8, 1.1, TIT); ret(c, -0.55, 0, 0.55, 0.12, PRETO); });
    vista(ctx, "R", (c) => { ret(c, -0.8, 0, 0.8, 1.1, GRAF); for (const l of [-1, 1]) ret(c, l * 0.25, 0.2, l * 0.52, 0.55, LAR); ret(c, -0.8, 0.8, 0.8, 1.1, PRETO); marca(c, "revolut", 0, 0.9, 0.09, { tinta: TIT }); });
  },
};

// Alpine A526: azul-marinho com degradê azul, rosa na asa dianteira, no bico, atrás da caixa e na asa traseira
DESENHOS.alpine = {
  numero: "#ffffff", carbono: 2, numPos: [3.45, 0.68, 9, 9],
  pintar(ctx) {
    const AZUL = "#0c1f5c", ESC = "#071338", ROSA = "#ff6fb1", CLARO = "#2a6fd6";
    base(ctx, AZUL);
    lados(ctx, (c) => {
      c.fillStyle = degrade(c, 1.4, 0, 3.2, 0, [[0, "rgba(42,111,214,0)"], [0.5, CLARO], [1, "rgba(42,111,214,0)"]]); c.fillRect(1.4, 0.14, 1.8, 0.4);
      poli(c, [[3.2, 0.44], [3.72, 0.3], [3.86, 0.3], [3.86, 0.62], [3.4, 0.64]], ROSA); // o bloco rosa atrás da caixa
      c.beginPath(); c.moveTo(0, 0.1); c.lineTo(1.05, 0.1); c.lineTo(0.85, 0.32); c.lineTo(0, 0.3); c.closePath(); c.fillStyle = ROSA; c.fill();
      baixo(c, ESC);
      ret(c, 3.86, 0.62, 4.45, 1.1, ROSA); ret(c, 3.86, 0.3, 4.45, 0.62, ESC);
      marca(c, "bwt", 2.72, 0.33, 0.13); marca(c, "eni", 3.02, 0.72, 0.075); marca(c, "msc", 2.1, 0.5, 0.05); marca(c, "alpine", 3.55, 0.47, 0.045, { tinta: AZUL }); marca(c, "eni", 4.15, 0.72, 0.08, { tinta: ESC });
    });
    vista(ctx, "T", (c) => {
      ret(c, 2.3, -0.3, 4, 0.3, AZUL); ret(c, 3, -0.3, 4, -0.14, ROSA); ret(c, 3, 0.14, 4, 0.3, ROSA);
      asasT(c, ROSA, ESC, ROSA); ret(c, 1, -0.17, 1.3, 0.17, AZUL);
      const f = { giro: DE_FRENTE, tinta: AZUL }; marca(c, "bwt", 0.7, 0, 0.08, f); marca(c, "alpine", 0.45, 0, 0.04, f); marca(c, "bwt", 4.15, 0, 0.1, { giro: DE_FRENTE }); marca(c, "eni", 2.9, 0, 0.07, { giro: DE_FRENTE });
    });
    vista(ctx, "F", (c) => { ret(c, -0.8, 0, 0.8, 1.1, AZUL); ret(c, -0.8, 0, 0.8, 0.14, ROSA); });
    vista(ctx, "R", (c) => { ret(c, -0.8, 0, 0.8, 1.1, ESC); ret(c, -0.45, 0.45, 0.45, 0.75, ROSA); });
  },
};

// Haas VF-26: branco, o GR preto e vermelho na tampa, filete vermelho, barriga preta com HAAS na caixa e bico com vermelho
DESENHOS.haas = {
  numero: "#111111", carbono: 2, numPos: [3.55, 0.6, 9, 9],
  pintar(ctx) {
    const BRANCO = "#f0f0ee", VERM = "#e10a2b", PRETO = "#141416";
    base(ctx, BRANCO);
    lados(ctx, (c) => {
      c.fillStyle = VERM; c.beginPath(); c.moveTo(2.15, 0.54); c.lineTo(3.5, 0.54); c.lineTo(3.5, 0.5); c.lineTo(2.15, 0.5); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(1.2, 0.09); c.lineTo(1.2, 0.2); c.lineTo(2.25, 0.2); c.lineTo(2.3, 0.14); c.lineTo(3.86, 0.14); c.lineTo(3.86, 0); c.lineTo(1.2, 0); c.closePath(); c.fillStyle = PRETO; c.fill();
      baixo(c, PRETO);
      poli(c, [[0.04, 0.1], [1.05, 0.1], [0.95, 0.28], [0.04, 0.2]], VERM);
      poli(c, [[2.2, 0.72], [2.2, 1.1], [2.56, 1.1], [2.56, 0.72]], VERM);
      ret(c, 3.86, 0.3, 4.45, 0.46, PRETO); ret(c, 3.86, 0.86, 4.45, 1.1, VERM);
      marca(c, "gr", 3.02, 0.65, 0.17); marca(c, "haas", 2.82, 0.33, 0.14); marca(c, "zoomex", 2.05, 0.16, 0.036); marca(c, "toyota", 1.6, 0.46, 0.036, { tinta: PRETO }); marca(c, "toyota", 4.15, 0.64, 0.045, { tinta: PRETO });
    });
    vista(ctx, "T", (c) => {
      ret(c, 2.3, -0.3, 2.62, 0.3, VERM);
      asasT(c, VERM, PRETO, BRANCO);
      const f = { giro: DE_FRENTE, tinta: PRETO }; marca(c, "haas", 0.72, 0, 0.055, f); marca(c, "toyota", 0.5, 0, 0.03, f); marca(c, "gr", 3.0, 0, 0.13, { giro: DE_FRENTE }); marca(c, "toyota", 4.15, 0, 0.07, { giro: DE_FRENTE, tinta: "#fff" });
    });
    vista(ctx, "F", (c) => { ret(c, -0.8, 0, 0.8, 1.1, BRANCO); ret(c, -0.8, 0, 0.8, 0.12, VERM); });
    vista(ctx, "R", (c) => { ret(c, -0.8, 0, 0.8, 1.1, PRETO); ret(c, -0.45, 0.45, 0.45, 0.75, VERM); });
  },
};

// Cadillac: preto de um lado e branco do outro (o carro é assimétrico), com a cunha da cor oposta com TWG e o detalhe verde-claro
DESENHOS.cadillac = {
  numero: "#ffffff", carbono: 1, numPos: [3.5, 0.68, 9, 9],
  pintar(ctx) {
    const BRANCO = "#eef0f2", PRETO = "#0e0f12";
    base(ctx, PRETO);
    lados(ctx, (c, lado) => {
      const preto = lado > 0, fundo = preto ? PRETO : BRANCO, tinta = preto ? BRANCO : PRETO;
      ret(c, 0.7, 0.1, 3.86, 1.1, fundo);
      // a cunha, que afina para a frente; a letra vai na cor do fundo
      c.beginPath(); c.moveTo(3.5, 0.12); c.lineTo(3.3, 0.5); c.quadraticCurveTo(2.4, 0.52, 1.5, 0.36); c.quadraticCurveTo(2.4, 0.3, 2.5, 0.12); c.closePath(); c.fillStyle = tinta; c.fill();
      baixo(c, PRETO);
      ret(c, 3.86, 0.3, 4.45, 1.1, PRETO);
      marca(c, "twg", 2.92, 0.31, 0.14, { tinta: fundo }); marca(c, "claro", 1.8, 0.3, 0.05); marca(c, "cadillac", 1.55, 0.52, 0.055, { tinta }); marca(c, "ifs", 4.15, 0.72, 0.075); marca(c, "cadillac", 3.1, 0.72, 0.05, { tinta });
    });
    vista(ctx, "T", (c) => {
      ret(c, 0.9, -0.8, 3.9, 0, BRANCO); ret(c, 0.9, 0, 3.9, 0.8, PRETO); // meio a meio, como dos lados
      asasT(c, PRETO, PRETO, PRETO);
      const f = { giro: DE_FRENTE, tinta: "#fff" }; marca(c, "twg", 0.72, 0, 0.06, f); marca(c, "cadillac", 0.48, 0, 0.04, f); marca(c, "ifs", 4.15, 0, 0.1, f);
    });
    vista(ctx, "F", (c) => { ret(c, -0.8, 0, 0.8, 1.1, PRETO); });
    vista(ctx, "R", (c) => { ret(c, -0.8, 0, 0.8, 1.1, PRETO); });
  },
};

// quais pinturas usam qual equipe: a chave é o `equipe` de MODS.pintura (pistas.js)
// ---------------------------------------------------------------- as pinturas de outros anos (f1-temporadas.js)
// "equipe@ano": só onde a equipe mudou de cara; nas outras vale a pintura de sempre. `desenhoDe` escolhe pelo ano em uso.
const anoEmUso = () => (typeof window !== "undefined" && window.F1Temporadas ? window.F1Temporadas.anoAtual() : 2026);
const chaveDo = (equipe) => { const v = equipe + "@" + anoEmUso(); return DESENHOS[v] ? v : equipe; };
const desenhoDe = (equipe) => DESENHOS[chaveDo(equipe)];
// As de antes de 2026, pelas fotos (as que o Thiago mandou de 2023, 2024 e 2025, a Wikimedia Commons e o F1 75 Live). Os patrocinadores são as MARCAS
// desenhadas (f1-marcas.js, `marca`), como nos carros de 2026, e não letra digitada. As medidas são as do carro de 2022 a 2025 (f1-2022.js), lidas
// numa grade pintada nele (em metros, s desde o bico, y de altura): bico s 0,2..1,6 subindo de y 0,2 a 0,55 | cockpit s 1,7..2,35 | caixa lateral
// s 2,0..3,4, a face boa para marca em y 0,15..0,45 | tampa do motor s 2,4..3,7, y 0,5..0,75 | airbox s 2,35, y 0,75 | asa traseira s 3,95..4,4.
const M = (c, id, s, y, h, op) => marca(c, id, s, y, h, op);
const frente = { giro: DE_FRENTE };
// o topo das caixas laterais (vista de cima): no carro de 2022 a caixa é larga e quase plana em cima, e é a vista de cima que pinta essa superfície;
// sem isto a cor da lateral parava na borda e o topo ficava na cor de base (a faixa preta da Sauber 2024 sumia)
const caixasCima = (c, cor, s0 = 1.9, s1 = 3.5) => { ret(c, s0, 0.3, s1, 0.85, cor); ret(c, s0, -0.85, s1, -0.3, cor); };
// o nariz e a faixa de cima do carro numa cor (do bico ao halo e pela tampa), para as pinturas que têm a "espinha" de outra cor
const espinha = (c, cor, ate = 3.7, alto = 0.62) => { c.beginPath(); c.moveTo(0.05, 0.16); c.lineTo(1.6, 0.52); c.quadraticCurveTo(2.3, alto + 0.08, ate, alto); c.lineTo(ate, 1.1); c.lineTo(0.05, 1.1); c.closePath(); c.fillStyle = cor; c.fill(); };
const filete = (c, cor, y0 = 0.16, dy = 0.025, ate = 3.4) => { c.beginPath(); c.moveTo(0.05, y0); c.lineTo(1.6, y0 + 0.36); c.quadraticCurveTo(2.3, y0 + 0.44, ate, y0 + 0.4); c.lineTo(ate, y0 + 0.4 + dy); c.quadraticCurveTo(2.3, y0 + 0.44 + dy, 1.6, y0 + 0.36 + dy); c.lineTo(0.05, y0 + dy); c.closePath(); c.fillStyle = cor; c.fill(); };

// ---- Red Bull RB19, RB20 e RB21: azul-marinho fosco, o bico amarelo, o touro vermelho com o sol amarelo na tampa
const pinturaRB = (ano) => ({ numero: "#ffffff", carbono: 1, numPos: [3.6, 0.6, 9, 9], pintar(ctx) {
  const MAR = "#1d2238", VERM = "#d8222a", AMAR = "#ffc906";
  base(ctx, MAR);
  lados(ctx, (c) => {
    baixo(c, MAR); ret(c, 3.95, 0.3, 4.45, 1.1, MAR);
    poli(c, [[0.0, 0.12], [0.62, 0.26], [0.62, 0.36], [0.0, 0.24]], AMAR); // o bico amarelo
    c.beginPath(); c.arc(2.42, 0.72, 0.075, 0, Math.PI * 2); c.fillStyle = AMAR; c.fill(); touros(c, 2.5, 0.56, 3.45, 0.78);
    poli(c, [[0.7, 0.3], [1.5, 0.48], [1.5, 0.5], [0.7, 0.32]], VERM); // o fio vermelho do bico
    M(c, "oracle", 2.72, 0.3, 0.1, { tinta: "#fff" }); M(c, "redbull", 3.0, 0.48, 0.055); M(c, "honda", 3.55, 0.52, 0.04, { tinta: "#fff" });
    M(c, "rokt", 2.2, 0.52, 0.04, { tinta: "#fff" }); M(c, "mobil1", 4.17, 0.7, 0.055, { tinta: "#fff" }); M(c, "claro", 0.3, 0.11, 0.045);
  });
  vista(ctx, "T", (c) => { ret(c, 0, -0.1, 0.62, 0.1, AMAR); asasT(c, MAR, MAR, MAR); ret(c, 2.5, -0.22, 3.45, 0.22, VERM); M(c, "oracle", 4.17, 0, 0.09, frente); M(c, "mobil1", 0.32, 0, 0.06, frente); });
  vista(ctx, "F", (c) => { ret(c, -0.8, 0, 0.8, 1.1, MAR); ret(c, -0.12, 0.1, 0.12, 0.4, AMAR); });
  vista(ctx, "R", (c) => { ret(c, -0.8, 0, 0.8, 1.1, MAR); });
} });
DESENHOS["red-bull@2023"] = pinturaRB(2023); DESENHOS["red-bull@2024"] = pinturaRB(2024); DESENHOS["red-bull@2025"] = pinturaRB(2025);

// ---- Haas VF-23 (foto do Thiago): preto, a faixa branca do bico ao halo e pela tampa com o filete vermelho, "HAAS" branco grande na lateral,
// a MoneyGram na tampa, a asa dianteira e o alto da traseira vermelhos
DESENHOS["haas@2023"] = { numero: "#ffffff", carbono: 1, numPos: [3.6, 0.6, 9, 9], pintar(ctx) {
  const PRETO = "#0e0f11", BRANCO = "#f2f3f5", VERM = "#e10600";
  base(ctx, PRETO);
  lados(ctx, (c) => {
    espinha(c, BRANCO, 3.25, 0.66); ret(c, 2.4, 0.66, 3.9, 1.1, PRETO); filete(c, VERM, 0.13, 0.03, 3.3);
    baixo(c, PRETO); ret(c, 0.05, 0, 0.6, 0.16, VERM); ret(c, 3.95, 0.3, 4.45, 1.1, PRETO); ret(c, 3.95, 0.86, 4.45, 1.1, VERM);
    M(c, "haas", 2.62, 0.3, 0.13, { tinta: BRANCO }); M(c, "moneygram", 2.95, 0.6, 0.06, { tinta: BRANCO }); M(c, "palmangels", 2.55, 0.12, 0.035, { tinta: BRANCO });
    M(c, "moneygram", 0.3, 0.09, 0.04, { tinta: BRANCO });
  });
  vista(ctx, "T", (c) => { ret(c, 0, -0.16, 2.3, 0.16, BRANCO); asasT(c, VERM, VERM, BRANCO); M(c, "haas", 4.17, 0, 0.1, frente); });
  vista(ctx, "F", (c) => { ret(c, -0.8, 0, 0.8, 1.1, BRANCO); });
  vista(ctx, "R", (c) => { ret(c, -0.8, 0, 0.8, 1.1, PRETO); ret(c, -0.5, 0.85, 0.5, 1.0, VERM); });
} };
// ---- Haas VF-24 e VF-25 (fotos): branco em cima e na frente, a lateral preta com "HAAS" cinza grande, o vermelho na asa dianteira e na tampa
const pinturaHaas24 = { numero: "#ffffff", carbono: 1, numPos: [3.6, 0.6, 9, 9], pintar(ctx) {
  const PRETO = "#101113", BRANCO = "#eef0f2", VERM = "#e10600", CINZA = "#7a7d82";
  base(ctx, PRETO);
  lados(ctx, (c) => {
    espinha(c, BRANCO, 3.1, 0.5); filete(c, VERM, 0.12, 0.03, 3.1); ret(c, 2.55, 0.86, 3.25, 1.1, VERM);
    baixo(c, PRETO); ret(c, 0.05, 0, 0.6, 0.16, VERM); ret(c, 3.95, 0.3, 4.45, 1.1, VERM);
    M(c, "haas", 2.6, 0.3, 0.14, { tinta: CINZA }); M(c, "moneygram", 0.32, 0.09, 0.045, { tinta: BRANCO }); M(c, "haas", 4.17, 0.75, 0.07, { tinta: BRANCO });
  });
  vista(ctx, "T", (c) => { ret(c, 0, -0.3, 2.6, 0.3, BRANCO); caixasCima(c, PRETO, 1.9, 3.6); ret(c, 2.6, -0.2, 3.2, 0.2, VERM); asasT(c, VERM, VERM, BRANCO); M(c, "moneygram", 0.3, 0, 0.06, frente); });
  vista(ctx, "F", (c) => { ret(c, -0.8, 0, 0.8, 1.1, BRANCO); });
  vista(ctx, "R", (c) => { ret(c, -0.8, 0, 0.8, 1.1, VERM); });
} };
DESENHOS["haas@2024"] = DESENHOS["haas@2025"] = pinturaHaas24;

// ---- AlphaTauri AT04 (foto do Thiago): azul-marinho, a frente branca até o meio do bico, as manchas brancas do camuflado na tampa,
// "ALPHATAURI" branco na lateral e o bloco vermelho da ORLEN embaixo da lateral e na asa traseira
DESENHOS["racing-bulls@2023"] = { numero: "#ffffff", carbono: 1, numPos: [3.5, 0.72, 9, 9], pintar(ctx) {
  const MAR = "#14213d", BRANCO = "#eef0f4", VERM = "#d0021b";
  base(ctx, MAR);
  lados(ctx, (c) => {
    c.beginPath(); c.moveTo(0.05, 0.1); c.lineTo(1.25, 0.34); c.lineTo(1.7, 0.6); c.lineTo(1.7, 1.1); c.lineTo(0.05, 1.1); c.closePath(); c.fillStyle = BRANCO; c.fill(); // a frente branca
    for (const [a, b, w] of [[2.75, 0.62, 0.24], [3.1, 0.55, 0.18], [2.45, 0.5, 0.16], [3.35, 0.66, 0.14]]) poli(c, [[a, b], [a + w, b + 0.06], [a + w * 0.6, b + 0.14], [a - 0.05, b + 0.09]], BRANCO); // o camuflado
    baixo(c, MAR); ret(c, 0.05, 0, 0.6, 0.16, MAR); ret(c, 3.95, 0.3, 4.45, 1.1, MAR);
    M(c, "alphatauri", 2.62, 0.32, 0.075, { tinta: BRANCO }); M(c, "orlen", 2.0, 0.13, 0.06); M(c, "orlen", 4.17, 0.88, 0.06); M(c, "honda", 3.5, 0.48, 0.04, { tinta: BRANCO });
  });
  vista(ctx, "T", (c) => { ret(c, 0, -0.4, 1.7, 0.4, BRANCO); asasT(c, MAR, VERM, BRANCO); ret(c, 2.6, -0.16, 3.4, -0.06, BRANCO); M(c, "orlen", 4.17, 0, 0.09, frente); });
  vista(ctx, "F", (c) => { ret(c, -0.8, 0, 0.8, 1.1, BRANCO); });
  vista(ctx, "R", (c) => { ret(c, -0.8, 0, 0.8, 1.1, MAR); });
} };
// ---- RB VCARB 01 (2024, fotos do Thiago): azul forte, a tampa e a asa traseira brancas, "VISA" branco grande na lateral, a HUGO vermelha na asa da frente branca
DESENHOS["racing-bulls@2024"] = { numero: "#ffffff", carbono: 1, numPos: [3.5, 0.72, 9, 9], pintar(ctx) {
  const AZUL = "#1e3cd8", BRANCO = "#f4f5f8", VERM = "#e2001a";
  base(ctx, AZUL);
  lados(ctx, (c) => {
    c.beginPath(); c.moveTo(2.75, 1.1); c.lineTo(3.9, 1.1); c.lineTo(3.9, 0.45); c.quadraticCurveTo(3.3, 0.52, 2.9, 0.68); c.closePath(); c.fillStyle = BRANCO; c.fill();
    filete(c, VERM, 0.2, 0.025, 2.7);
    baixo(c, AZUL); ret(c, 0.05, 0, 0.6, 0.16, BRANCO); ret(c, 3.95, 0.3, 4.45, 1.1, BRANCO);
    M(c, "visa", 2.4, 0.3, 0.12, { tinta: BRANCO }); M(c, "cashapp", 1.25, 0.42, 0.04, { tinta: BRANCO }); M(c, "hugo", 0.32, 0.08, 0.05, { tinta: VERM });
    M(c, "orlen", 2.0, 0.13, 0.05); M(c, "orlen", 4.17, 0.9, 0.055); M(c, "honda", 3.35, 0.6, 0.04, { tinta: AZUL });
  });
  vista(ctx, "T", (c) => { ret(c, 2.75, -0.3, 4.0, 0.3, BRANCO); asasT(c, BRANCO, BRANCO, AZUL); M(c, "visa", 1.0, 0, 0.09, frente); M(c, "hugo", 0.3, -0.42, 0.05, frente); M(c, "hugo", 0.3, 0.42, 0.05, frente); });
  vista(ctx, "F", (c) => { ret(c, -0.8, 0, 0.8, 1.1, AZUL); });
  vista(ctx, "R", (c) => { ret(c, -0.8, 0, 0.8, 1.1, BRANCO); });
} };
// ---- Racing Bulls VCARB 02 (2025, fotos): branco, o azul embaixo da lateral, o touro vermelho com o sol amarelo na tampa, o bico amarelo, "VISA" azul
DESENHOS["racing-bulls@2025"] = { numero: "#1534cc", carbono: 1, numPos: [3.5, 0.72, 9, 9], pintar(ctx) {
  const BRANCO = "#f4f5f8", AZUL = "#1534cc", VERM = "#e2001a", AMAR = "#ffcc00";
  base(ctx, BRANCO);
  lados(ctx, (c) => {
    c.beginPath(); c.moveTo(3.7, 0.08); c.lineTo(3.3, 0.24); c.quadraticCurveTo(2.2, 0.28, 0.7, 0.14); c.lineTo(0.7, 0.08); c.closePath(); c.fillStyle = AZUL; c.fill();
    poli(c, [[0.0, 0.12], [0.6, 0.26], [0.6, 0.36], [0.0, 0.24]], AMAR); touros(c, 2.6, 0.55, 3.5, 0.78); c.beginPath(); c.arc(2.48, 0.72, 0.07, 0, Math.PI * 2); c.fillStyle = AMAR; c.fill();
    baixo(c, AZUL); ret(c, 0.05, 0, 0.6, 0.16, BRANCO); ret(c, 3.95, 0.3, 4.45, 1.1, BRANCO);
    M(c, "visa", 2.4, 0.34, 0.11, { tinta: AZUL }); M(c, "hugo", 1.7, 0.47, 0.045, { tinta: VERM }); M(c, "cashapp", 1.1, 0.4, 0.04, { tinta: AZUL });
    M(c, "hugo", 0.32, 0.08, 0.05, { tinta: VERM }); M(c, "redbull", 4.17, 0.9, 0.055); M(c, "honda", 3.55, 0.5, 0.04, { tinta: AZUL });
  });
  vista(ctx, "T", (c) => { ret(c, 0, -0.08, 0.6, 0.08, AMAR); asasT(c, BRANCO, BRANCO, BRANCO); ret(c, 2.6, -0.22, 3.5, 0.22, VERM); M(c, "visa", 1.1, 0, 0.08, { giro: DE_FRENTE, tinta: AZUL }); });
  vista(ctx, "F", (c) => { ret(c, -0.8, 0, 0.8, 1.1, BRANCO); ret(c, -0.12, 0.1, 0.12, 0.4, AMAR); });
  vista(ctx, "R", (c) => { ret(c, -0.8, 0, 0.8, 1.1, BRANCO); });
} };

// ---- Alfa Romeo C43 (foto do Thiago): vermelho em cima, carbono embaixo, "Stake" branco no preto da lateral, "Alfa Romeo" e o quadrifoglio na tampa
DESENHOS["audi@2023"] = { numero: "#ffffff", carbono: 1, numPos: [3.55, 0.7, 9, 9], pintar(ctx) {
  const VERM = "#a3001b", PRETO = "#101113", BRANCO = "#f2f2f2";
  base(ctx, VERM);
  lados(ctx, (c) => {
    c.beginPath(); c.moveTo(0.4, 0.0); c.lineTo(0.4, 0.16); c.quadraticCurveTo(1.6, 0.3, 2.3, 0.5); c.quadraticCurveTo(3.0, 0.52, 3.9, 0.46); c.lineTo(3.9, 0.0); c.closePath(); c.fillStyle = PRETO; c.fill();
    baixo(c, PRETO); ret(c, 0.05, 0, 0.6, 0.16, PRETO); ret(c, 3.95, 0.3, 4.45, 1.1, PRETO);
    M(c, "stake", 2.6, 0.3, 0.1, { tinta: BRANCO }); M(c, "alfaromeo", 3.1, 0.58, 0.06, { tinta: BRANCO }); M(c, "trevo", 2.55, 0.68, 0.09);
    M(c, "stake", 0.32, 0.09, 0.05, { tinta: BRANCO }); M(c, "stake", 4.17, 0.85, 0.06, { tinta: BRANCO });
  });
  vista(ctx, "T", (c) => { asasT(c, PRETO, PRETO, VERM); M(c, "stake", 4.17, 0, 0.09, frente); M(c, "trevo", 2.7, 0, 0.12); });
  vista(ctx, "F", (c) => { ret(c, -0.8, 0, 0.8, 1.1, VERM); });
  vista(ctx, "R", (c) => { ret(c, -0.8, 0, 0.8, 1.1, PRETO); });
} };
// ---- Kick Sauber C44 (2024, fotos): verde neon quase inteiro, o preto na lateral com "Stake" branco
DESENHOS["audi@2024"] = { numero: "#121314", carbono: 1, numPos: [3.55, 0.7, 9, 9], pintar(ctx) {
  const VERDE = "#3fe03f", PRETO = "#121314", BRANCO = "#f4f4f4";
  base(ctx, VERDE);
  lados(ctx, (c) => {
    c.beginPath(); c.moveTo(1.75, 0.12); c.quadraticCurveTo(2.6, 0.08, 3.6, 0.18); c.lineTo(3.6, 0.6); c.quadraticCurveTo(2.7, 0.64, 1.85, 0.56); c.closePath(); c.fillStyle = PRETO; c.fill(); // (até 0,6: o topo da caixa lateral)
    baixo(c, PRETO); ret(c, 0.05, 0, 0.6, 0.16, VERDE); ret(c, 3.95, 0.3, 4.45, 1.1, VERDE);
    M(c, "stake", 2.62, 0.3, 0.1, { tinta: BRANCO }); M(c, "stake", 4.17, 0.85, 0.06, { tinta: PRETO }); M(c, "stake", 0.32, 0.09, 0.045, { tinta: PRETO }); M(c, "kick", 1.25, 0.42, 0.04, { tinta: PRETO });
  });
  vista(ctx, "T", (c) => { caixasCima(c, PRETO, 1.85, 3.6); asasT(c, VERDE, VERDE, VERDE); M(c, "stake", 1.0, 0, 0.08, { giro: DE_FRENTE, tinta: PRETO }); });
  vista(ctx, "F", (c) => { ret(c, -0.8, 0, 0.8, 1.1, VERDE); });
  vista(ctx, "R", (c) => { ret(c, -0.8, 0, 0.8, 1.1, VERDE); });
} };
// ---- Kick Sauber C45 (2025, fotos): o verde da frente some no preto de trás, "Stake" branco
DESENHOS["audi@2025"] = { numero: "#52e252", carbono: 1, numPos: [3.55, 0.7, 9, 9], pintar(ctx) {
  const PRETO = "#121314", VERDE = "#52e252", BRANCO = "#f4f4f4";
  base(ctx, PRETO);
  lados(ctx, (c) => {
    c.fillStyle = degrade(c, 0, 0, 2.9, 0, [[0, VERDE], [0.55, VERDE], [1, PRETO]]); c.fillRect(0, 0.15, 2.9, 0.95);
    baixo(c, PRETO); ret(c, 0.05, 0, 0.6, 0.16, VERDE); ret(c, 3.95, 0.3, 4.45, 1.1, PRETO);
    M(c, "stake", 2.7, 0.3, 0.1, { tinta: BRANCO }); M(c, "stake", 4.17, 0.85, 0.06, { tinta: BRANCO }); M(c, "kick", 1.2, 0.4, 0.04, { tinta: PRETO });
  });
  vista(ctx, "T", (c) => { c.fillStyle = degrade(c, 0, 0, 2.9, 0, [[0, VERDE], [0.6, VERDE], [1, PRETO]]); c.fillRect(0, -0.4, 2.9, 0.8); asasT(c, VERDE, PRETO, VERDE); M(c, "stake", 3.2, 0, 0.09, frente); });
  vista(ctx, "F", (c) => { ret(c, -0.8, 0, 0.8, 1.1, VERDE); });
  vista(ctx, "R", (c) => { ret(c, -0.8, 0, 0.8, 1.1, PRETO); });
} };

// ---- Mercedes W14 (2023, foto do Thiago): carbono preto inteiro com os filetes turquesa e "PETRONAS" branco
DESENHOS["mercedes@2023"] = { numero: "#ffffff", carbono: 1, numPos: [3.5, 0.7, 9, 9], pintar(ctx) {
  const PRETO = "#141517", TURQ = "#00d2be", BRANCO = "#f4f4f4";
  base(ctx, PRETO);
  lados(ctx, (c) => {
    filete(c, TURQ, 0.12, 0.02, 3.3); ret(c, 1.9, 0.14, 3.2, 0.16, TURQ);
    baixo(c, PRETO); ret(c, 3.95, 0.3, 4.45, 1.1, PRETO);
    M(c, "petronas", 2.65, 0.32, 0.08, { tinta: BRANCO }); M(c, "amg", 1.75, 0.5, 0.045, { tinta: BRANCO }); M(c, "ineos", 2.45, 0.68, 0.05, { tinta: BRANCO });
    M(c, "teamviewer", 2.95, 0.55, 0.04, { tinta: BRANCO }); M(c, "petronas", 4.17, 0.88, 0.055, { tinta: BRANCO }); M(c, "iwc", 0.3, 0.09, 0.045, { tinta: BRANCO });
  });
  vista(ctx, "T", (c) => { asasT(c, PRETO, PRETO, PRETO); ret(c, 0.3, -0.03, 1.8, 0.03, TURQ); M(c, "petronas", 4.17, 0, 0.08, frente); M(c, "ineos", 0.3, 0.5, 0.05, frente); });
  vista(ctx, "F", (c) => { ret(c, -0.8, 0, 0.8, 1.1, PRETO); });
  vista(ctx, "R", (c) => { ret(c, -0.8, 0, 0.8, 1.1, PRETO); });
} };
// ---- Mercedes W15 e W16 (2024 e 2025, fotos): o prata-grafite na frente e em cima que escurece até o preto, os filetes turquesa, o vermelho na entrada de ar
const pinturaW15 = { numero: "#ffffff", carbono: 1, numPos: [3.5, 0.7, 9, 9], pintar(ctx) {
  const PRETO = "#121315", GRAF = "#5b6067", TURQ = "#00d2be", VERM = "#d0021b", BRANCO = "#f4f4f4";
  base(ctx, PRETO);
  lados(ctx, (c) => {
    c.fillStyle = degrade(c, 0, 0, 3.2, 0, [[0, GRAF], [0.6, "#3a3e44"], [1, PRETO]]); espinha(c, c.fillStyle, 3.2, 0.5);
    ret(c, 2.28, 0.7, 2.42, 0.8, VERM); filete(c, TURQ, 0.12, 0.02, 3.3);
    baixo(c, PRETO); ret(c, 3.95, 0.3, 4.45, 1.1, PRETO);
    M(c, "petronas", 2.7, 0.32, 0.08, { tinta: BRANCO }); M(c, "amg", 1.6, 0.48, 0.045, { tinta: BRANCO }); M(c, "teamviewer", 2.95, 0.58, 0.04, { tinta: BRANCO });
    M(c, "petronas", 4.17, 0.88, 0.055, { tinta: BRANCO }); M(c, "ineos", 0.3, 0.09, 0.045, { tinta: BRANCO });
  });
  vista(ctx, "T", (c) => { c.fillStyle = degrade(c, 0, 0, 3.2, 0, [[0, GRAF], [1, PRETO]]); c.fillRect(0, -0.4, 3.2, 0.8); ret(c, 0.3, -0.12, 1.8, -0.09, TURQ); ret(c, 0.3, 0.09, 1.8, 0.12, TURQ); asasT(c, PRETO, PRETO, GRAF); M(c, "petronas", 4.17, 0, 0.08, frente); });
  vista(ctx, "F", (c) => { ret(c, -0.8, 0, 0.8, 1.1, GRAF); });
  vista(ctx, "R", (c) => { ret(c, -0.8, 0, 0.8, 1.1, PRETO); });
} };
DESENHOS["mercedes@2024"] = DESENHOS["mercedes@2025"] = pinturaW15;

// ---- Ferrari SF-23 (foto do Thiago): vermelho com a traseira de carbono, a concha da Shell na lateral, "Ray-Ban", "Santander" e "RICHARD MILLE"
DESENHOS["ferrari@2023"] = { numero: "#ffffff", carbono: 1, numPos: [3.6, 0.7, 9, 9], pintar(ctx) {
  const VERM = "#d40000", CARB = "#141414", BRANCO = "#f4f4f4";
  base(ctx, VERM);
  lados(ctx, (c) => {
    poli(c, [[3.0, 1.1], [3.9, 1.1], [3.9, 0.62], [3.3, 0.7]], CARB); baixo(c, CARB); ret(c, 3.95, 0.3, 4.45, 1.1, VERM);
    M(c, "shell", 2.2, 0.3, 0.14); M(c, "ceva", 2.65, 0.3, 0.07, { tinta: BRANCO }); M(c, "rayban", 3.05, 0.34, 0.06, { tinta: BRANCO });
    M(c, "santander", 3.3, 0.5, 0.045, { tinta: BRANCO }); M(c, "richardmille", 1.2, 0.42, 0.03, { tinta: BRANCO }); M(c, "vpower", 4.17, 0.85, 0.05); M(c, "santander", 0.32, 0.09, 0.04, { tinta: BRANCO });
  });
  vista(ctx, "T", (c) => { asasT(c, VERM, VERM, VERM); ret(c, 3.0, -0.25, 3.9, 0.25, CARB); M(c, "shell", 1.1, 0, 0.12); });
  vista(ctx, "F", (c) => { ret(c, -0.8, 0, 0.8, 1.1, VERM); });
  vista(ctx, "R", (c) => { ret(c, -0.8, 0, 0.8, 1.1, VERM); });
} };
// ---- Ferrari SF-24 (2024, fotos): vermelho com os filetes amarelo e branco subindo pela lateral, a parte de baixo preta, a Shell
DESENHOS["ferrari@2024"] = { numero: "#ffffff", carbono: 1, numPos: [3.6, 0.7, 9, 9], pintar(ctx) {
  const VERM = "#d40000", PRETO = "#141414", AMAR = "#ffd500", BRANCO = "#f4f4f4";
  base(ctx, VERM);
  lados(ctx, (c) => {
    c.beginPath(); c.moveTo(1.2, 0.0); c.lineTo(1.2, 0.14); c.quadraticCurveTo(2.4, 0.22, 3.6, 0.16); c.lineTo(3.6, 0.0); c.closePath(); c.fillStyle = PRETO; c.fill();
    for (const [dy, cor] of [[0, AMAR], [0.025, BRANCO]]) { c.beginPath(); c.moveTo(1.3, 0.24 + dy); c.quadraticCurveTo(2.6, 0.32 + dy, 3.5, 0.74 + dy); c.lineTo(3.5, 0.755 + dy); c.quadraticCurveTo(2.6, 0.335 + dy, 1.3, 0.255 + dy); c.closePath(); c.fillStyle = cor; c.fill(); }
    baixo(c, PRETO); ret(c, 3.95, 0.3, 4.45, 1.1, VERM);
    M(c, "shell", 2.15, 0.33, 0.13); M(c, "santander", 3.15, 0.5, 0.045, { tinta: BRANCO }); M(c, "ceva", 2.7, 0.35, 0.06, { tinta: BRANCO }); M(c, "vpower", 4.17, 0.85, 0.05); M(c, "richardmille", 1.2, 0.42, 0.03, { tinta: BRANCO });
  });
  vista(ctx, "T", (c) => { asasT(c, VERM, VERM, VERM); ret(c, 2.9, -0.27, 3.9, -0.24, AMAR); ret(c, 2.9, 0.24, 3.9, 0.27, AMAR); M(c, "shell", 1.1, 0, 0.12); });
  vista(ctx, "F", (c) => { ret(c, -0.8, 0, 0.8, 1.1, VERM); });
  vista(ctx, "R", (c) => { ret(c, -0.8, 0, 0.8, 1.1, VERM); });
} };
// ---- Ferrari SF-25 (2025, foto do Thiago): o vermelho escuro, a asa traseira branca com a HP, os filetes brancos na tampa, a Shell
DESENHOS["ferrari@2025"] = { numero: "#ffffff", carbono: 1, numPos: [3.6, 0.7, 9, 9], pintar(ctx) {
  const VERM = "#9e1222", PRETO = "#141414", BRANCO = "#f4f4f4";
  base(ctx, VERM);
  lados(ctx, (c) => {
    baixo(c, PRETO); ret(c, 3.95, 0.3, 4.45, 1.1, BRANCO); ret(c, 2.4, 0.72, 3.6, 0.74, BRANCO);
    M(c, "shell", 2.15, 0.32, 0.13); M(c, "hp", 4.17, 0.75, 0.1); M(c, "santander", 3.1, 0.5, 0.045, { tinta: BRANCO }); M(c, "ibm", 2.75, 0.33, 0.06, { tinta: BRANCO, fundo: VERM }); M(c, "unicredit", 1.25, 0.42, 0.035, { tinta: BRANCO });
  });
  vista(ctx, "T", (c) => { asasT(c, BRANCO, BRANCO, VERM); ret(c, 2.4, -0.3, 3.9, -0.27, BRANCO); ret(c, 2.4, 0.27, 3.9, 0.3, BRANCO); M(c, "shell", 1.1, 0, 0.12); M(c, "hp", 4.17, 0, 0.12); });
  vista(ctx, "F", (c) => { ret(c, -0.8, 0, 0.8, 1.1, VERM); });
  vista(ctx, "R", (c) => { ret(c, -0.8, 0, 0.8, 1.1, BRANCO); });
} };

// ---- McLaren MCL60 (2023, foto do Thiago): papaia e carbono com a faixa azul-clara, "VELO" preto no papaia da lateral, "Chrome" na tampa
DESENHOS["mclaren@2023"] = { numero: "#0e0f11", carbono: 1, numPos: [3.5, 0.72, 9, 9], pintar(ctx) {
  const PAP = "#ff8000", CARB = "#16171a", AZUL = "#47c7fc", BRANCO = "#f4f4f4";
  base(ctx, CARB);
  lados(ctx, (c) => {
    c.beginPath(); c.moveTo(1.6, 0.22); c.quadraticCurveTo(2.4, 0.16, 3.2, 0.22); c.lineTo(3.0, 0.44); c.quadraticCurveTo(2.3, 0.48, 1.65, 0.42); c.closePath(); c.fillStyle = PAP; c.fill();
    ret(c, 2.6, 0.55, 3.9, 1.1, PAP); poli(c, [[0, 0.14], [1.6, 0.52], [1.6, 0.58], [0, 0.22]], PAP);
    poli(c, [[1.4, 0.2], [3.1, 0.16], [3.1, 0.19], [1.4, 0.23]], AZUL); poli(c, [[0.2, 0.23], [1.5, 0.55], [1.5, 0.58], [0.2, 0.26]], AZUL);
    baixo(c, CARB); ret(c, 0.05, 0, 0.6, 0.16, PAP); ret(c, 3.95, 0.3, 4.45, 1.1, PAP);
    M(c, "velo", 2.4, 0.32, 0.1, { tinta: CARB }); M(c, "chrome", 3.15, 0.66, 0.07, { tinta: BRANCO }); M(c, "okx", 4.17, 0.85, 0.06, { tinta: CARB }); M(c, "velo", 0.32, 0.09, 0.05, { tinta: CARB });
  });
  vista(ctx, "T", (c) => { ret(c, 0, -0.1, 1.7, 0.1, PAP); ret(c, 2.6, -0.3, 3.9, 0.3, PAP); asasT(c, PAP, PAP, CARB); M(c, "okx", 4.17, 0, 0.08, { giro: DE_FRENTE, tinta: CARB }); });
  vista(ctx, "F", (c) => { ret(c, -0.8, 0, 0.8, 1.1, PAP); });
  vista(ctx, "R", (c) => { ret(c, -0.8, 0, 0.8, 1.1, PAP); });
} };
// ---- McLaren MCL38 e MCL39 (2024 e 2025, fotos): papaia em cima e no bico, o carbono na lateral, "VELO" preto no papaia, "OKX" branco
const pinturaMCL38 = { numero: "#0e0f11", carbono: 1, numPos: [3.5, 0.72, 9, 9], pintar(ctx) {
  const PAP = "#ff8000", CARB = "#16171a", BRANCO = "#f4f4f4";
  base(ctx, PAP);
  lados(ctx, (c) => {
    c.beginPath(); c.moveTo(1.5, 0.3); c.quadraticCurveTo(2.5, 0.64, 3.6, 0.6); c.lineTo(3.6, 0.0); c.lineTo(1.5, 0.0); c.closePath(); c.fillStyle = CARB; c.fill(); // (o carbono vai até o topo da caixa lateral, 0,6)
    c.beginPath(); c.moveTo(1.7, 0.14); c.quadraticCurveTo(2.4, 0.1, 3.0, 0.14); c.lineTo(2.9, 0.36); c.quadraticCurveTo(2.3, 0.4, 1.75, 0.32); c.closePath(); c.fillStyle = PAP; c.fill();
    baixo(c, CARB); ret(c, 0.05, 0, 0.6, 0.16, PAP); ret(c, 3.95, 0.3, 4.45, 1.1, PAP);
    M(c, "velo", 2.35, 0.25, 0.09, { tinta: CARB }); M(c, "okx", 3.3, 0.3, 0.06, { tinta: BRANCO }); M(c, "chrome", 3.15, 0.66, 0.06, { tinta: BRANCO }); M(c, "velo", 0.32, 0.09, 0.05, { tinta: CARB });
  });
  vista(ctx, "T", (c) => { caixasCima(c, CARB, 2.0, 3.6); asasT(c, PAP, PAP, PAP); M(c, "okx", 4.17, 0, 0.08, { giro: DE_FRENTE, tinta: CARB }); });
  vista(ctx, "F", (c) => { ret(c, -0.8, 0, 0.8, 1.1, PAP); });
  vista(ctx, "R", (c) => { ret(c, -0.8, 0, 0.8, 1.1, PAP); });
} };
DESENHOS["mclaren@2024"] = DESENHOS["mclaren@2025"] = pinturaMCL38;

// ---- Aston Martin AMR23, AMR24 e AMR25 (fotos): verde em cima, preto embaixo, o filete limão entre os dois; "aramco" e "cognizant" brancos
const pinturaAMR = { numero: "#ffffff", carbono: 1, numPos: [3.5, 0.72, 9, 9], pintar(ctx) {
  const VERDE = "#0d6b5c", PRETO = "#0e1210", LIMAO = "#cedc00", BRANCO = "#f4f4f4";
  base(ctx, VERDE);
  lados(ctx, (c) => {
    c.beginPath(); c.moveTo(0.5, 0.0); c.lineTo(0.5, 0.16); c.quadraticCurveTo(2.0, 0.3, 3.6, 0.24); c.lineTo(3.6, 0.0); c.closePath(); c.fillStyle = PRETO; c.fill();
    c.beginPath(); c.moveTo(0.5, 0.16); c.quadraticCurveTo(2.0, 0.3, 3.6, 0.24); c.lineTo(3.6, 0.26); c.quadraticCurveTo(2.0, 0.32, 0.5, 0.18); c.closePath(); c.fillStyle = LIMAO; c.fill();
    baixo(c, PRETO); ret(c, 0.05, 0, 0.6, 0.16, PRETO); ret(c, 3.95, 0.3, 4.45, 1.1, PRETO);
    M(c, "cognizant", 2.75, 0.38, 0.07, { tinta: BRANCO }); M(c, "aramco", 3.0, 0.6, 0.07, { tinta: BRANCO }); M(c, "boss", 1.95, 0.5, 0.04, { tinta: BRANCO }); M(c, "aramco", 4.17, 0.88, 0.06, { tinta: LIMAO });
    M(c, "astonmartin", 2.0, 0.12, 0.03, { tinta: BRANCO });
  });
  vista(ctx, "T", (c) => { asasT(c, PRETO, PRETO, VERDE); M(c, "aramco", 3.0, 0, 0.09, frente); M(c, "aramco", 0.3, 0.45, 0.05, frente); });
  vista(ctx, "F", (c) => { ret(c, -0.8, 0, 0.8, 1.1, VERDE); });
  vista(ctx, "R", (c) => { ret(c, -0.8, 0, 0.8, 1.1, PRETO); });
} };
DESENHOS["aston-martin@2023"] = DESENHOS["aston-martin@2024"] = DESENHOS["aston-martin@2025"] = pinturaAMR;

// ---- Alpine A523 e A524 (2023 e 2024, fotos): o azul em degradê em cima, o carbono no meio e o rosa da BWT embaixo da lateral e nas asas
const pinturaA523 = { numero: "#ffffff", carbono: 1, numPos: [3.5, 0.72, 9, 9], pintar(ctx) {
  const AZUL = "#0b5fd6", ESC = "#0a1d4a", ROSA = "#f49ac9", CARB = "#121318", BRANCO = "#f4f4f4";
  base(ctx, CARB);
  lados(ctx, (c) => {
    c.fillStyle = degrade(c, 0, 0, 4, 0, [[0, AZUL], [0.6, "#1e88e5"], [1, ESC]]); espinha(c, c.fillStyle, 3.8, 0.58);
    c.beginPath(); c.moveTo(1.8, 0.08); c.quadraticCurveTo(2.5, 0.04, 3.3, 0.12); c.lineTo(3.1, 0.38); c.quadraticCurveTo(2.4, 0.42, 1.9, 0.32); c.closePath(); c.fillStyle = ROSA; c.fill();
    baixo(c, CARB); ret(c, 0.05, 0, 0.6, 0.16, ROSA); ret(c, 3.95, 0.3, 4.45, 1.1, ROSA);
    M(c, "bwt", 2.55, 0.23, 0.11, { tinta: AZUL }); M(c, "alpine", 1.25, 0.42, 0.035, { tinta: BRANCO }); M(c, "bwt", 4.17, 0.85, 0.07, { tinta: AZUL }); M(c, "microsoft", 0.32, 0.09, 0.035, { tinta: BRANCO });
  });
  vista(ctx, "T", (c) => { c.fillStyle = degrade(c, 0, 0, 4, 0, [[0, AZUL], [1, ESC]]); c.fillRect(0, -0.4, 4, 0.8); asasT(c, ROSA, ROSA, AZUL); M(c, "bwt", 4.17, 0, 0.09, { giro: DE_FRENTE, tinta: AZUL }); });
  vista(ctx, "F", (c) => { ret(c, -0.8, 0, 0.8, 1.1, AZUL); });
  vista(ctx, "R", (c) => { ret(c, -0.8, 0, 0.8, 1.1, ROSA); });
} };
DESENHOS["alpine@2023"] = DESENHOS["alpine@2024"] = pinturaA523;
// ---- Alpine A525 (2025, foto do Thiago): azul, o rosa no bico, no halo e na BWT
DESENHOS["alpine@2025"] = { numero: "#ffffff", carbono: 1, numPos: [3.5, 0.72, 9, 9], pintar(ctx) {
  const AZUL = "#1565d8", ROSA = "#f28cc4", CARB = "#121318", BRANCO = "#f4f4f4";
  base(ctx, AZUL);
  lados(ctx, (c) => {
    poli(c, [[0, 0.05], [1.3, 0.3], [1.3, 1.1], [0, 1.1]], ROSA); ret(c, 1.8, 0.72, 2.3, 1.1, ROSA);
    c.beginPath(); c.moveTo(1.8, 0.08); c.quadraticCurveTo(2.5, 0.04, 3.3, 0.12); c.lineTo(3.1, 0.38); c.quadraticCurveTo(2.4, 0.42, 1.9, 0.32); c.closePath(); c.fillStyle = ROSA; c.fill();
    baixo(c, CARB); ret(c, 0.05, 0, 0.6, 0.16, ROSA); ret(c, 3.95, 0.3, 4.45, 1.1, ROSA);
    M(c, "bwt", 2.55, 0.23, 0.11, { tinta: AZUL }); M(c, "eni", 3.1, 0.62, 0.06, { tinta: BRANCO }); M(c, "bwt", 4.17, 0.85, 0.07, { tinta: AZUL });
  });
  vista(ctx, "T", (c) => { ret(c, 0, -0.4, 1.3, 0.4, ROSA); asasT(c, ROSA, ROSA, ROSA); M(c, "bwt", 4.17, 0, 0.09, { giro: DE_FRENTE, tinta: AZUL }); });
  vista(ctx, "F", (c) => { ret(c, -0.8, 0, 0.8, 1.1, ROSA); });
  vista(ctx, "R", (c) => { ret(c, -0.8, 0, 0.8, 1.1, ROSA); });
} };

// ---- Williams FW45 (2023, foto do Thiago): azul-royal com os triângulos mais claros na tampa, a parte de baixo escura, o filete vermelho
DESENHOS["williams@2023"] = { numero: "#ffffff", carbono: 1, numPos: [3.5, 0.7, 9, 9], pintar(ctx) {
  const MAR = "#14215e", AZUL = "#2148d8", CLARO = "#4fa6ff", VERM = "#e10600", BRANCO = "#f4f4f4";
  base(ctx, AZUL);
  lados(ctx, (c) => {
    poli(c, [[2.6, 0.5], [3.3, 0.78], [3.3, 0.5]], CLARO); poli(c, [[2.9, 0.5], [3.5, 0.72], [3.5, 0.5]], "#3a72f0");
    c.fillStyle = degrade(c, 0, 0.1, 0, 0.42, [[0, MAR], [1, AZUL]]); c.fillRect(0.6, 0.08, 3.0, 0.34); filete(c, VERM, 0.2, 0.02, 3.2);
    baixo(c, MAR); ret(c, 3.95, 0.3, 4.45, 1.1, MAR);
    M(c, "duracell", 2.45, 0.66, 0.045, { tinta: BRANCO }); M(c, "gulf", 3.4, 0.56, 0.07); M(c, "keeper", 2.3, 0.14, 0.035, { tinta: BRANCO });
  });
  vista(ctx, "T", (c) => { asasT(c, MAR, MAR, AZUL); });
  vista(ctx, "F", (c) => { ret(c, -0.8, 0, 0.8, 1.1, AZUL); });
  vista(ctx, "R", (c) => { ret(c, -0.8, 0, 0.8, 1.1, MAR); });
} };
// ---- Williams FW46 (2024, fotos): azul-marinho escuro, o azul mais claro embaixo, o filete vermelho, "KOMATSU" branco na lateral
DESENHOS["williams@2024"] = { numero: "#ffffff", carbono: 1, numPos: [3.5, 0.7, 9, 9], pintar(ctx) {
  const MAR = "#0b1736", AZUL = "#1f4fd1", VERM = "#e10600", BRANCO = "#f4f4f4";
  base(ctx, MAR);
  lados(ctx, (c) => {
    c.fillStyle = degrade(c, 0, 0.08, 0, 0.42, [[0, AZUL], [1, MAR]]); c.fillRect(0.6, 0.08, 3.0, 0.34); filete(c, VERM, 0.2, 0.02, 3.2);
    baixo(c, MAR); ret(c, 3.95, 0.3, 4.45, 1.1, MAR);
    M(c, "komatsu", 2.75, 0.3, 0.075, { tinta: BRANCO }); M(c, "gulf", 3.45, 0.55, 0.07); M(c, "duracell", 2.4, 0.66, 0.045, { tinta: BRANCO });
  });
  vista(ctx, "T", (c) => { asasT(c, MAR, MAR, MAR); M(c, "komatsu", 4.17, 0, 0.07, frente); });
  vista(ctx, "F", (c) => { ret(c, -0.8, 0, 0.8, 1.1, MAR); });
  vista(ctx, "R", (c) => { ret(c, -0.8, 0, 0.8, 1.1, MAR); });
} };
// ---- Williams FW47 (2025, foto do Thiago): azul-royal, a parte de baixo escura, "ATLASSIAN" branco na tampa e na asa, "KOMATSU" na lateral
DESENHOS["williams@2025"] = { numero: "#ffffff", carbono: 1, numPos: [3.5, 0.7, 9, 9], pintar(ctx) {
  const AZUL = "#1f4fe0", MAR = "#0e1a4a", VERM = "#e10600", BRANCO = "#f4f4f4";
  base(ctx, AZUL);
  lados(ctx, (c) => {
    c.fillStyle = degrade(c, 0, 0.05, 0, 0.36, [[0, MAR], [1, AZUL]]); c.fillRect(0.6, 0.05, 3.0, 0.31); filete(c, VERM, 0.2, 0.02, 3.2);
    baixo(c, MAR); ret(c, 3.95, 0.3, 4.45, 1.1, MAR);
    M(c, "atlassian", 2.85, 0.6, 0.065, { tinta: BRANCO }); M(c, "komatsu", 2.75, 0.3, 0.065, { tinta: BRANCO }); M(c, "gulf", 3.45, 0.45, 0.06); M(c, "atlassian", 4.17, 0.9, 0.05, { tinta: BRANCO });
  });
  vista(ctx, "T", (c) => { asasT(c, MAR, MAR, AZUL); M(c, "atlassian", 3.0, 0, 0.08, frente); });
  vista(ctx, "F", (c) => { ret(c, -0.8, 0, 0.8, 1.1, AZUL); });
  vista(ctx, "R", (c) => { ret(c, -0.8, 0, 0.8, 1.1, MAR); });
} };

export const temDesenho = (equipe) => !!DESENHOS[equipe];
export const corDoNumero = (equipe) => desenhoDe(equipe)?.numero || "#ffffff";
export const numPosDe = (equipe) => desenhoDe(equipe)?.numPos || null;
// 1: as peças de lado da asa dianteira e a suspensão de trás de carbono; 2: só a suspensão (a asa da equipe é colorida)
export const carbonoDe = (equipe) => desenhoDe(equipe)?.carbono || 0;

// Marcas nos halos de 2026, inspiradas nas vistas onboard e nas parcerias de cada equipe.
// O atlas é compartilhado entre os carros da equipe; o shader o projeta só na barra do halo.
const HALOS = {
  mclaren: ["AIRWALLEX", "DP WORLD", "VELO.COM", "Gemini", "ECOLAB"],
  ferrari: ["Bitdefender", "Shell", "HP", "RICHARD MILLE", "Bitdefender"],
  mercedes: ["INEOS", "", "CROWDSTRIKE", "", "INEOS"],
  "red-bull": ["Hard Rock", "ORACLE", "TAG HEUER", "AT&T", "FORD"],
  "racing-bulls": ["HUGO", "VISA", "FORD", "Cash App", "HUGO"],
  "aston-martin": ["BOSS", "Valvoline", "VALHALLA", "aramco", "Cognizant"],
  williams: ["DURACELL", "kraken", "WILLIAMS", "kraken", "DURACELL"],
  audi: ["", "Castrol", "aneis", "QATAR", ""],
  alpine: ["", "eni", "BWT", "MSC", ""],
  haas: ["OAKBERRY", "HAAS", "TOYOTA", "TGR", "Pirelli"],
  cadillac: ["", "3M", "", "", ""],
};
const TEXTURAS_HALO = new Map();
export function texturaDoHalo(equipe) {
  if (!HALOS[equipe] || anoEmUso() !== 2026) return null; // (as marcas do halo são as das equipes de 2026: nas outras temporadas, o halo fica liso)
  if (TEXTURAS_HALO.has(equipe)) return TEXTURAS_HALO.get(equipe);
  const cv = document.createElement("canvas"); cv.width = 2048; cv.height = 256;
  const ctx = cv.getContext("2d"); ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  // Nos halos claros o branco some; as marcas usam o azul ou o preto da equipe.
  ctx.fillStyle = ({ alpine: "#182356", haas: "#151a21", audi: "#151a20" })[equipe] || "#fff";
  HALOS[equipe].forEach((nome, i) => {
    const x = equipe === "mclaren" ? [260, 600, 1024, 1448, 1788][i] : 180 + i * 422, central = i === 2;
    ctx.save(); ctx.translate(x, 128); ctx.scale(1, 0.9);
    if (central && equipe === "mercedes") {
      ctx.fillStyle = "#1ccfb7"; ctx.fillRect(-150, -100, 300, 18);
      ctx.fillStyle = "#fff"; ctx.font = "900 31px Arial, sans-serif"; ctx.fillText("CROWDSTRIKE", 0, -25, 275);
      ctx.font = "700 30px Arial, sans-serif"; ctx.fillText("Snapdragon", 0, 27, 245);
    } else if (central && equipe === "audi") {
      // Os quatro anéis laranja no topo e Revolut na face dianteira do arco.
      ctx.strokeStyle = "#f24d1d"; ctx.lineWidth = 7;
      for (const dx of [-57, -19, 19, 57]) { ctx.beginPath(); ctx.ellipse(dx, -26, 31, 22, 0, 0, Math.PI * 2); ctx.stroke(); }
      ctx.fillStyle = "#ffffff"; ctx.font = "700 50px Arial, sans-serif"; ctx.fillText("Revolut", 0, 44, 205);
    } else if (central && equipe === "ferrari") {
      // Painel branco do HP sobre o arco escuro, como na vista onboard.
      ctx.fillStyle = "#f3f3f1"; ctx.fillRect(-160, -145, 320, 290);
      ctx.fillStyle = "#1674ba"; ctx.font = "italic 900 78px Arial, sans-serif"; ctx.fillText("hp", 0, 0);
    } else if (equipe === "ferrari" && nome === "Shell") {
      ctx.fillStyle = "#ffcf00"; ctx.strokeStyle = "#d91e26"; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(-46, -5); ctx.quadraticCurveTo(-40, -45, 0, -48); ctx.quadraticCurveTo(40, -45, 46, -5); ctx.lineTo(28, 25); ctx.lineTo(10, 33); ctx.lineTo(0, 25); ctx.lineTo(-10, 33); ctx.lineTo(-28, 25); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (equipe === "mclaren" && nome === "Gemini") {
      ctx.fillStyle = "#79c9ff"; ctx.beginPath(); ctx.moveTo(-144, -27); ctx.quadraticCurveTo(-125, -22, -119, -42); ctx.quadraticCurveTo(-113, -22, -94, -17); ctx.quadraticCurveTo(-113, -12, -119, 8); ctx.quadraticCurveTo(-125, -12, -144, -17); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.font = "600 49px Arial, sans-serif"; ctx.fillText("Gemini", 12, 0, 235);
    } else if (central && equipe === "red-bull") {
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(-122, -54); ctx.lineTo(122, -54); ctx.lineTo(122, 30); ctx.lineTo(0, 70); ctx.lineTo(-122, 30); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#087044"; ctx.fillRect(-110, -44, 220, 38); ctx.fillStyle = "#cf142b"; ctx.fillRect(-110, -4, 220, 31);
      ctx.fillStyle = "#fff"; ctx.font = "900 28px Arial, sans-serif"; ctx.fillText("TAG", 0, -25); ctx.fillText("HEUER", 0, 12);
    } else {
      ctx.font = equipe === "mclaren" ? `${central ? 700 : 600} ${central ? 57 : 48}px Arial, sans-serif` : `${central ? 900 : 800} ${central ? 65 : 64}px Arial, sans-serif`;
      ctx.fillText(nome, 0, 0, central ? 330 : 300);
    }
    ctx.restore();
  });
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.userData.baseEscura = equipe === "cadillac" || equipe === "ferrari" || equipe === "mclaren" || equipe === "williams" || equipe === "mercedes" || equipe === "aston-martin" || equipe === "racing-bulls"; t.userData.faceAudi = equipe === "audi"; t.userData.baseRosa = equipe === "alpine"; TEXTURAS_HALO.set(equipe, t); return t;
}
export function aplicarHalo(sh, textura) {
  sh.uniforms.haloPatrocinios = { value: textura };
  sh.uniforms.haloBaseEscura = { value: textura.userData.baseEscura ? 1 : 0 };
  sh.uniforms.haloFaceAudi = { value: textura.userData.faceAudi ? 1 : 0 };
  sh.uniforms.haloBaseRosa = { value: textura.userData.baseRosa ? 1 : 0 };
  sh.fragmentShader = "uniform sampler2D haloPatrocinios;\nuniform float haloBaseEscura;\nuniform float haloFaceAudi;\nuniform float haloBaseRosa;\n" + sh.fragmentShader.replace("#include <color_fragment>", `#include <color_fragment>
  { // A barra curva do halo no modelo 2026; a folha acompanha a curva e não pinta a carroceria.
    float hx = vPc.x, hz = 1.925 + 0.60 * abs(hx) + 0.40 * hx * hx;
    float hy = 0.765 - 1.0 * hx * hx;
    vec2 huv = vec2((hx + 0.30) / 0.60, 0.5 + (vPc.y - hy) / 0.08);
    if (vPc.y > 0.68 && vPc.y < 0.84 && abs(hx) < 0.30 && abs(vPc.z - hz) < 0.08 && huv.y > 0.0 && huv.y < 1.0) {
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.012, 0.014, 0.018), haloBaseEscura);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.012, 0.014, 0.018), haloFaceAudi * (1.0 - smoothstep(0.28, 0.42, huv.y)));
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0, 0.48, 0.72), haloBaseRosa);
      vec4 marca = texture2D(haloPatrocinios, huv);
      diffuseColor.rgb = mix(diffuseColor.rgb, marca.rgb, marca.a);
    }
  }`);
}

// Decalques em alta resolução para a pequena área vista pelo piloto. A folha da carroceria
// cobre o carro inteiro; aqui cada pixel é dedicado ao cockpit, evitando letras borradas.
const COCKPIT_MARCAS = {
  "red-bull": { lado: ["Mobil 1", "Mobil 1"], cor: "#ffffff" },
  "aston-martin": { centro: ["CoreWeave", "CoreWeave"], lado: ["JCB", "JCB"], cor: "#ffffff" },
  "racing-bulls": { centro: ["Red", "Bull"], lado: ["TUDOR", "TUDOR"], cor: "#1c2231", corCentro: "#e21c40" },
  mercedes: { asa: ["nu", "nu"], lado: ["TeamViewer", "TeamViewer"], cor: "#f2f4f5" }, // (em branco: em volta do cockpit agora é preto)
  alpine: { centro: ["BWT", "BWT"], lado: ["ALPINE", "ALPINE"], cor: "#183865", corLado: "#ffffff" },
  mclaren: { lado: ["allwyn", "allwyn"], asa: ["FxPro", "FxPro"], anguloAsa: 0, posAsa: 1.84, tamanhoAsa: 24, cor: "#ffffff" },
  ferrari: { lado: ["ambipar", "ambipar"], asa: ["CEVA", "CEVA"], cor: "#111111" },
  williams: { centro: ["KOMATSU", "KOMATSU"], lado: ["BARCLAYS", "BARCLAYS"], cor: "#ffffff" },
  audi: { centro: ["NEXO", "NEXO"], asa: ["aleph", "aleph"], lado: ["WORLD OF HYATT", "WORLD OF HYATT"], cor: "#25272b" },
  cadillac: { centro: ["telcel", "telcel"], lado: ["TWG", "TWG"], cor: "#34383a", corDireita: "#ffffff" },
};
const TEXTURAS_COCKPIT = new Map();
export function texturaDoCockpit(equipe) {
  const dados = COCKPIT_MARCAS[equipe]; if (!dados || anoEmUso() !== 2026) return null; // (idem: os patrocínios do cockpit são os de 2026)
  if (TEXTURAS_COCKPIT.has(equipe)) return TEXTURAS_COCKPIT.get(equipe);
  const cv = document.createElement("canvas"); cv.width = cv.height = 1024; const ctx = cv.getContext("2d");
  const X = x => (x + 0.35) / 0.70 * 1024, Y = s => (s - 1.30) / 0.90 * 1024;
  const desenhar = (txt, s, x, h, largura, giro, cor) => {
    if (!txt) return; ctx.save(); ctx.translate(X(x), Y(s)); ctx.rotate(giro); ctx.fillStyle = cor;
    ctx.font = `800 ${h}px Arial, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(txt, 0, 0, largura); ctx.restore();
  };
  for (let i = 0; i < 2; i++) {
    const lado = i ? 1 : -1, cor = i && dados.corDireita ? dados.corDireita : dados.cor;
    desenhar(dados.centro?.[i], 1.60, lado * 0.072, 48, 160, 0, dados.corCentro || cor);
    desenhar(dados.asa?.[i], dados.posAsa ?? 1.80, lado * 0.22, dados.tamanhoAsa ?? 40, 150, dados.anguloAsa ?? -Math.PI / 2, cor);
    desenhar(dados.lado?.[i], 1.94, lado * 0.18, 46, 250, -Math.PI / 2, dados.corLado || cor);
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.minFilter = THREE.LinearMipmapLinearFilter;
  t.userData.mclaren = equipe === "mclaren";
  t.userData.mercedes = equipe === "mercedes";
  if (t.userData.mclaren || t.userData.mercedes) {
    // Atlas separado para manter as marcas do bico legíveis sem afetar outras equipes.
    const nariz = document.createElement("canvas"); nariz.width = nariz.height = 1024;
    const nc = nariz.getContext("2d"); nc.fillStyle = "#151515"; nc.textAlign = "center"; nc.textBaseline = "middle";
    const marcas = t.userData.mclaren ? [["DELL", 0.86, 58], ["Deloitte.", 0.76, 42], ["CISCO", 0.67, 44], ["rubrik", 0.59, 42], ["DEWALT", 0.5, 46], ["PIRELLI", 0.41, 42]] : [["SAP", 0.3, 44], ["AKKODIS", 0.4, 40], ["PIRELLI", 0.5, 40], ["INEOS", 0.6, 42], ["CROWDSTRIKE", 0.7, 34]];
    for (const [marca, s, tamanho] of marcas) {
      nc.font = `800 ${tamanho}px Arial, sans-serif`; nc.fillText(marca, 512, (s - 0.25) / 0.90 * 1024, 360);
    }
    const nt = new THREE.CanvasTexture(nariz); nt.colorSpace = THREE.SRGBColorSpace; nt.anisotropy = 8; nt.minFilter = THREE.LinearMipmapLinearFilter;
    t.userData.nariz = nt;
  }
  TEXTURAS_COCKPIT.set(equipe, t); return t;
}
export function aplicarCockpit(sh, textura) {
  sh.uniforms.cockpitMarcas = { value: textura };
  sh.uniforms.cockpitMclaren = { value: textura.userData.mclaren ? 1 : 0 };
  sh.uniforms.marcasNariz = { value: textura.userData.nariz || textura };
  sh.uniforms.temMarcasNariz = { value: textura.userData.nariz ? 1 : 0 };
  sh.fragmentShader = "uniform sampler2D cockpitMarcas;\nuniform sampler2D marcasNariz;\nuniform float temMarcasNariz;\nuniform float cockpitMclaren;\n" + sh.fragmentShader.replace("#include <color_fragment>", `#include <color_fragment>
  { // somente as superfícies superiores ao redor do piloto, sem pintar o halo
    vec2 uvCockpit = vec2((vPc.x + 0.35) / 0.70, 1.0 - (vPc.z - 1.30) / 0.90);
    if (abs(vPc.x) < 0.35 && vPc.z > 1.30 && vPc.z < 2.20 && vPc.y < 0.66 && vNc.y > 0.25) {
      vec4 marcaCockpit = texture2D(cockpitMarcas, uvCockpit);
      if (cockpitMclaren > 0.5 && vPc.y < 0.60 && vPc.z < 1.90 && abs(vPc.x) > 0.16) marcaCockpit.a = 0.0;
      diffuseColor.rgb = mix(diffuseColor.rgb, marcaCockpit.rgb, marcaCockpit.a);
    }
    if (temMarcasNariz > 0.5 && abs(vPc.x) < 0.18 && vPc.z > 0.25 && vPc.z < 1.15 && vPc.y < 0.60 && vNc.y > 0.25) {
      vec2 uvNariz = vec2((vPc.x + 0.18) / 0.36, 1.0 - (vPc.z - 0.25) / 0.90);
      vec4 marcaNariz = texture2D(marcasNariz, uvNariz);
      diffuseColor.rgb = mix(diffuseColor.rgb, marcaNariz.rgb, marcaNariz.a);
    }
  }`);
}

// ---------------------------------------------------------------- embaixo da asa traseira (a vista U): o que se vê do carro da frente
// Pelos prints do Thiago (2026-11-13). A marca vai em metros no carro (x, t = s − 3,7: a asa vai de t 0 a 0,65 e de x −0,47 a 0,47).
function marcaU(c, id, x, t, h, op) { c.save(); c.translate(x, t); c.scale(h, h); desenharMarca(c, id, op); c.restore(); }
const ASA_BAIXO = {
  mercedes: { cor: "#0c0d0f", marcas: (c) => marcaU(c, "crowdstrike", 0, 0.32, 0.1) },
  ferrari: { cor: "#182035", marcas: (c) => marcaU(c, "ibm", 0, 0.32, 0.16, { tinta: "#3a6fd0", fundo: "#182035" }) },
  "red-bull": { cor: "#25272b", marcas: (c) => marcaU(c, "oracle", 0, 0.32, 0.11) },
  mclaren: { cor: "#141518", marcas: (c) => marcaU(c, "etihad", 0, 0.32, 0.12) },
  audi: { cor: "#141518", marcas: (c) => marcaU(c, "revolut", 0, 0.32, 0.13, { tinta: "#c9ced3" }) },
};

// ---------------------------------------------------------------- as texturas (uma por equipe, guardada)
const FOLHAS = new Map();
export function folhaDaEquipe(equipe, alta = false) {
  if (!DESENHOS[equipe]) return null;
  equipe = chaveDo(equipe); // (a pintura do ano em uso, quando a equipe tem uma: "audi@2023" é a Alfa Romeo)
  const chave = equipe + (alta ? "|2" : "|1");
  if (FOLHAS.has(chave)) return FOLHAS.get(chave);
  ESC = alta ? 2 : 1;
  const cv = document.createElement("canvas"); cv.width = FW * ESC; cv.height = FH * ESC;
  const ctx = cv.getContext("2d"); DESENHOS[equipe].pintar(ctx);
  vista(ctx, "U", (c) => { const d = ASA_BAIXO[equipe]; ret(c, -0.6, -0.05, 0.6, 0.75, d?.cor || "#101113"); d?.marcas?.(c); });
  lados(ctx, (c) => ret(c, 2.1, 0.39, 2.35, 0.46, CARBONO)); // a entrada de ar das caixas laterais é escura em qualquer pintura
  ESC = 1;
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = alta ? 8 : 4; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
  t.userData.cv = cv; FOLHAS.set(chave, t); return t;
}
// para quem quiser ver a folha pronta (a ferramenta de conferência)
export function desenharFolha(ctx, equipe) { DESENHOS[equipe]?.pintar(ctx); }

// o atlas dos dígitos do número do piloto: 10 células de 64x128; vermelho = preenchimento, verde = contorno
let DIGITOS = null;
export function texturaDosDigitos() {
  if (DIGITOS) return DIGITOS;
  const cv = document.createElement("canvas"); cv.width = 640; cv.height = 128; const x = cv.getContext("2d");
  x.fillStyle = "#000"; x.fillRect(0, 0, 640, 128);
  x.font = "italic 900 104px 'Arial Black', Arial, Helvetica, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.lineJoin = "round";
  for (let d = 0; d < 10; d++) {
    x.lineWidth = 12; x.strokeStyle = "#00ff00"; x.strokeText(String(d), d * 64 + 32, 68, 54);
    x.fillStyle = "#ff0000"; x.fillText(String(d), d * 64 + 32, 68, 54);
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.NoColorSpace; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = 4;
  DIGITOS = t; return t;
}

// ---------------------------------------------------------------- o shader da pintura de equipe (corpo)
// (com NOVO, o carro de 2026: o atributo mcar diz quanto de cada ponto é pintura, 0 = carbono; ver f1-2026.js)
export const LIV_VERT_DECL = "attribute vec3 pcar;\nattribute vec3 ncar;\nvarying vec3 vPc;\nvarying vec3 vNc;\n#ifdef NOVO\nattribute float mcar;\nvarying float vMc;\nattribute float fcar;\nvarying float vFc;\n#endif\n";
export const LIV_VERT_MAIN = "\nvPc = pcar; vNc = ncar;\n#ifdef NOVO\nvMc = mcar; vFc = fcar;\n#endif";
// onde ficam os números (s, y, altura em metros) nos lados e (s, x, altura) em cima: ver NUM_* abaixo
export const LIV_FRAG_DECL = `
uniform sampler2D liv;
uniform sampler2D dig;
uniform vec2 numero;   // dígitos do número (dezena, unidade); unidade < 0: sem número
uniform vec3 corNum;
uniform vec4 numPos;   // onde ficam os números: (s, y) na lateral da tampa e (s, y) na asa traseira
uniform float carb;    // ver carbonoDe
varying vec3 vPc;
varying vec3 vNc;
#ifdef NOVO
varying float vMc;
varying float vFc;
#endif
const float KK = 232.72727;
vec2 lv(vec2 px, vec4 r) { px = clamp(px, r.xy + 1.5, r.zw - 1.5); return vec2(px.x / 1024.0, 1.0 - px.y / 1152.0); }
// um número de 1 ou 2 dígitos centrado em (0,0) do plano do decalque; u para a direita, v para cima, h = altura em metros
vec2 digito(float u, float v, float h) {
  float cw = h * 0.62, tv = v / h + 0.5;
  if (tv <= 0.0 || tv >= 1.0) return vec2(0.0);
  float dois = step(0.0, numero.x), k = (u / (cw * (1.0 + dois)) + 0.5) * (1.0 + dois);
  if (k <= 0.0 || k >= 1.0 + dois) return vec2(0.0);
  float idx = (dois > 0.5 && k < 1.0) ? numero.x : numero.y, f = (dois > 0.5) ? fract(k) : k;
  return texture2D(dig, vec2((idx + f) / 10.0, tv)).rg;
}
`;
export const LIV_FRAG_MAIN = `
{
  vec3 mk = diffuseColor.rgb;
  vec3 p = vPc, n = normalize(vNc);
  vec3 a = pow(abs(n), vec3(10.0)); a /= (a.x + a.y + a.z); // (a troca de vista nas curvas é curta: com 6, o lado e o de cima se misturavam e os logos saíam pela metade)
  bool dir = n.x > 0.0;
  vec2 pS = dir ? vec2((4.4 - p.z) * KK, (1.1 - p.y) * KK) : vec2(p.z * KK, 256.0 + (1.1 - p.y) * KK);
  vec2 uS = lv(pS, dir ? vec4(0.0, 0.0, 1024.0, 256.0) : vec4(0.0, 256.0, 1024.0, 512.0));
  vec3 cS = texture2D(liv, uS).rgb;
#ifdef NOVO
  cS = mix(texture2D(liv, uS, 4.5).rgb, cS, vFc); // as superfícies escondidas atrás de outra (f1-2026.js camadas): só a cor, sem repetir o logo
#endif
  vec3 cT = vec3(0.012);
  if (n.y > 0.0) cT = texture2D(liv, lv(vec2(p.z * KK, 704.0 - p.x * KK), vec4(0.0, 512.0, 1024.0, 896.0))).rgb;
  else if (p.z > 3.7 && p.y > 0.48) cT = texture2D(liv, lv(vec2(872.5 + p.x * 253.0, 4.65 + (p.z - 3.7) * 153.0), vec4(733.0, 4.0, 1012.0, 112.0))).rgb; // embaixo da asa traseira (a vista U)
  bool fr = n.z < 0.0;
  vec2 pZ = vec2(fr ? 256.0 - p.x * KK : 768.0 + p.x * KK, 896.0 + (1.1 - p.y) * KK);
  vec3 cZ = texture2D(liv, lv(pZ, fr ? vec4(0.0, 896.0, 512.0, 1152.0) : vec4(512.0, 896.0, 1024.0, 1152.0))).rgb;
  vec3 c = cS * a.x + cT * a.y + cZ * a.z;
  if (numero.y >= 0.0) {
    // número na tampa do motor (os dois lados) e na asa traseira (os dois lados); em cima do bico, lido por quem vem atrás
    float us = dir ? -p.z : p.z;
    vec2 d1 = digito(us + (dir ? numPos.x : -numPos.x), p.y - numPos.y, 0.2) * a.x;
    vec2 d2 = digito(us + (dir ? numPos.z : -numPos.z), p.y - numPos.w, 0.17) * a.x;
    vec2 d3 = digito(p.x, 1.02 - p.z, 0.22) * a.y * step(0.0, n.y);
    vec2 d = max(max(d1, d2), d3);
    c = mix(c, vec3(0.015), clamp(d.g, 0.0, 1.0));
    c = mix(c, corNum, clamp(d.r, 0.0, 1.0));
  }
  // (de cima a asa continua com a pintura da folha, onde ficam as marcas)
  c = mix(c, vec3(0.012), max(step(0.5, carb) * step(carb, 1.5) * step(0.24, abs(p.x)) * step(p.z, 0.68) * (1.0 - a.y), step(0.5, carb) * step(0.42, abs(p.x)) * step(3.35, p.z) * step(p.y, 0.62)));
#ifdef FUNDO
  c = mix(c, mk, max(step(p.y, 0.2), step(n.y, -0.2))); // o assoalho e a barriga seguem de carbono
#endif
#ifdef NOVO
  c = mix(mk, c, vMc); // o assoalho e a barriga seguem de carbono (mk é a cor do carbono do material)
#endif
  diffuseColor.rgb = c;
}`;

// Sem equipe (a "Sua cor", o safety car, o fantasma) no carro de 2026: a cor principal em tudo, com a faixa do meio, a asa traseira e as pontas
// da asa dianteira na cor secundária (a máscara de cores do carro clássico não existe neste modelo).
export const SOL_FRAG_DECL = `
uniform vec3 cor1;
uniform vec3 cor2;
varying vec3 vPc;
varying vec3 vNc;
varying float vMc;
`;
export const SOL_FRAG_MAIN = `
{
  vec3 mk = diffuseColor.rgb, p = vPc, n = normalize(vNc);
  float faixa = step(abs(p.x), 0.07) * step(0.25, n.y) * step(p.y, 0.8);
  float asa = step(3.95, p.z) * step(0.3, p.y);
  float ponta = step(0.72, abs(p.x)) * step(p.z, 0.7);
  diffuseColor.rgb = mix(mk, mix(cor1, cor2, max(faixa, max(asa, ponta))), vMc);
}`;

// ---------------------------------------------------------------- o acabamento acetinado da pintura (só de dia)
// O corpo é um MeshPhysicalMaterial com `clearcoat` 1; quanto vale o acabamento é o uniforme compartilhado VERNIZ (0 à noite, 1 de dia; pos.js
// escreve por quadro, devagar na virada), vezes a parte do ponto que é pintura (o carbono, mcar = 0, fica fosco como estava). De dia a pintura
// fica semi-fosca, acetinada como as das equipes de hoje: rugosidade média (nada de espelho) e só uma camada leve de verniz, bem difusa, que
// deixa um brilho suave do céu nas curvas da carenagem (onde o ângulo é raso) e não deixa o painel chapado. Os brilhos diretos do sol têm teto:
// o carro reflete um pouco, não brilha (nada daqui chega ao limiar do bloom).
export const VERNIZ = { value: 1 };
// Limita a luz refletida pela carroceria antes do bloom, inclusive a soma da luz difusa,
// dos reflexos e do ambiente. A emissão fica livre para as luzes que devem brilhar.
export const TETO_CARRO = { value: 0 };
export function limitarBrilhoCarro(m) {
  if (!m || !(m.isMeshStandardMaterial || m.isMeshLambertMaterial || m.isMeshPhongMaterial)) return;
  const antes = m.onBeforeCompile, chave = m.customProgramCacheKey;
  m.onBeforeCompile = function (sh, renderer) {
    if (antes) antes.call(this, sh, renderer);
    sh.uniforms.tetoCarro = TETO_CARRO;
    sh.fragmentShader = 'uniform float tetoCarro;\n' + sh.fragmentShader.replace('#include <opaque_fragment>', `
if (tetoCarro > 0.0) {
  vec3 reflexoCarro = max(outgoingLight - totalEmissiveRadiance, vec3(0.0));
  float claridadeCarro = dot(reflexoCarro, vec3(0.2126, 0.7152, 0.0722));
  if (claridadeCarro > tetoCarro) outgoingLight = reflexoCarro * (tetoCarro / claridadeCarro) + totalEmissiveRadiance;
}
#include <opaque_fragment>`);
  };
  m.customProgramCacheKey = function () { return (chave ? chave.call(this) : '') + '|teto-carro'; };
  m.needsUpdate = true;
}
const VERNIZ_DECL = "uniform float uVerniz;\n";
const VERNIZ_ASPERO = 0.64;    // a rugosidade da pintura de dia vira (no máximo) isso: acetinado
const VERNIZ_CAMADA = 0.14;    // a força da camada de verniz (baixa)
const VERNIZ_CAMADA_ASP = 0.5;// a rugosidade dela: alta, o reflexo do céu sai macio e não espelhado
const VERNIZ_CEU = 1.2;        // quanto a camada amplia o reflexo do céu
// (os tetos ficam bem abaixo do limiar do bloom: com 0,22 + 0,85 os pontinhos de brilho do sol passavam dele e o bloom os espalhava em
// "estrelas" piscando nos carros)
const VERNIZ_TETO_SOL = 0.03;  // o brilho direto do sol na camada não passa disso
const VERNIZ_TETO_BASE = 0.14;  // e o da tinta por baixo, de dia
export function aplicarVerniz(sh) {
  sh.uniforms.uVerniz = VERNIZ;
  sh.fragmentShader = VERNIZ_DECL + sh.fragmentShader
    .replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>
#ifdef NOVO
  float vern = uVerniz * vMc;
#else
  float vern = uVerniz;
#endif
  roughnessFactor = mix(roughnessFactor, max(roughnessFactor, ${VERNIZ_ASPERO.toFixed(2)}), vern);`)
    .replace("#include <lights_physical_fragment>", `#include <lights_physical_fragment>
#ifdef USE_CLEARCOAT
  material.clearcoat *= vern * ${VERNIZ_CAMADA.toFixed(2)};
  material.clearcoatRoughness = max(material.clearcoatRoughness, ${VERNIZ_CAMADA_ASP.toFixed(2)});
#endif`)
    .replace("#include <lights_fragment_end>", `#include <lights_fragment_end>
#ifdef USE_CLEARCOAT
  clearcoatSpecularIndirect *= ${VERNIZ_CEU.toFixed(1)};
  clearcoatSpecularDirect = min(clearcoatSpecularDirect, vec3(${VERNIZ_TETO_SOL.toFixed(2)}));
#endif
  reflectedLight.directSpecular = min(reflectedLight.directSpecular, vec3(mix(64.0, ${VERNIZ_TETO_BASE.toFixed(2)}, vern)));`);
}

// a posição de cada ponto da roda em relação ao eixo, em raios (1 = a borda do pneu): a faixa do composto é um anel nesse
// espaço (o shader mede o comprimento do vetor em cada pixel, então o anel sai redondo mesmo com poucos vértices)
export function aroDaRoda(pos, idx) {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z0 = 1e9, z1 = -1e9;
  for (let q = 0; q < idx.length; q++) { const x = pos.getX(idx[q]), y = pos.getY(idx[q]), z = pos.getZ(idx[q]); if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z; }
  const cy = (y0 + y1) / 2, cz = (z0 + z1) / 2, R = Math.max((y1 - y0) / 2, 1e-6), cx = (x0 + x1) / 2, rx = Math.max((x1 - x0) / 2, 1e-6), a = new Float32Array(pos.count * 2), lat = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) { a[i * 2] = (pos.getY(i) - cy) / R; a[i * 2 + 1] = (pos.getZ(i) - cz) / R; lat[i] = (pos.getX(i) - cx) / rx; }
  return { aro: new THREE.BufferAttribute(a, 2), lat: new THREE.BufferAttribute(lat, 1) };
}

// ---------------------------------------------------------------- o pneu: a faixa do composto (como as da Pirelli)
export const FAIXAS = { macio: "#e8202a", medio: "#ffd100", duro: "#f4f4f4", chuva: "#1e7fd6", intermediario: "#39c85a" };
// Os secos são slicks; o de chuva recebe canais no piso. O padrão usa a posição local, então gira junto com a roda.
export const PNEU_VERT_DECL = "attribute vec2 aro;\nattribute float pneuLat;\nvarying vec2 vAro;\nvarying float vPneuLat;\n";
export const PNEU_VERT_MAIN = "\nvAro = aro; vPneuLat = pneuLat;";
export const PNEU_FRAG_DECL = "uniform vec3 faixa;\nuniform float faixaOn;\nuniform float pneuChuva;\nuniform float pneuTom;\nuniform sampler2D pneuLetras;\nvarying vec2 vAro;\nvarying float vPneuLat;\n";
// As letras da lateral do pneu, uma textura só para todos os carros: vermelho = a marca (branca), verde = o nome do composto (na cor da faixa).
let LETRAS_PNEU = null;
export function texturaDasLetrasDoPneu() {
  if (LETRAS_PNEU) return LETRAS_PNEU;
  const cv = document.createElement("canvas"); cv.width = 2048; cv.height = 96; const x = cv.getContext("2d");
  x.fillStyle = "#000"; x.fillRect(0, 0, 2048, 96); x.textBaseline = "middle"; x.textAlign = "center";
  for (const o of [0, 1024]) {
    x.font = "italic 900 74px Arial, sans-serif"; x.fillStyle = "#ff0000"; x.fillText("PIRELLI", o + 300, 50);
    x.font = "italic 900 80px Arial, sans-serif"; x.fillStyle = "#00ff00"; x.fillText("P ZERO", o + 760, 50);
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.NoColorSpace; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
  LETRAS_PNEU = t; return t;
}
export const PNEU_FRAG_MAIN = `
{
  float rr = length(vAro);
  float banda = smoothstep(0.725, 0.735, rr) * (1.0 - smoothstep(0.790, 0.800, rr)) * faixaOn;
  // Microvariação fosca na borracha; sem inventar sulcos nos compostos secos.
  if (rr > 0.83 && abs(vPneuLat) < 0.96) {
    float ang = atan(vAro.y, vAro.x);
    float grao = sin(ang * 73.0 + sin(vPneuLat * 47.0)) * sin(vPneuLat * 101.0 + ang * 17.0);
    float piso = smoothstep(0.83, 0.93, rr) * (1.0 - smoothstep(0.78, 0.96, abs(vPneuLat)));
    diffuseColor.rgb *= 1.0 + piso * (pneuTom + grao * 0.045);
    // Canais inclinados e canal central do pneu de chuva.
    float linhas = smoothstep(0.76, 0.91, cos(ang * 26.0 + abs(vPneuLat) * 13.0));
    float centro = 1.0 - smoothstep(0.035, 0.08, abs(vPneuLat));
    diffuseColor.rgb *= 1.0 - pneuChuva * piso * max(linhas * 0.34, centro * 0.4);
  }
  diffuseColor.rgb = mix(diffuseColor.rgb, faixa, banda);
  // A lateral: borracha mais fosca e escura, com as letras (lidas certo dos dois lados do carro).
  if (abs(vPneuLat) > 0.55 && rr > 0.8 && rr < 0.98) {
    vec2 uvL = vec2(-(atan(vAro.y, vAro.x) / 6.28318 + 0.5) * sign(vPneuLat), 1.0 - (rr - 0.815) / 0.135);
    if (uvL.y > 0.0 && uvL.y < 1.0) {
      vec2 l = texture2D(pneuLetras, uvL).rg;
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.86), l.r * 0.9);
      diffuseColor.rgb = mix(diffuseColor.rgb, faixa, l.g * max(faixaOn, 0.0));
    }
  }
}`;
