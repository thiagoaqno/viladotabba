// Corrida da Galera — a pintura NA TEXTURA do carro de 2022 a 2025 (f1-2022.js), como nos modelos do Sketchfab que o Thiago mandou: em vez de
// projetar uma folha por cima (f1-pintura.js), a pintura é desenhada no próprio molde (UV) das peças, e o material original do modelo (a pintura
// com rugosidade 0, que dá o brilho e o reflexo) fica.
//
// Como: 1) um MAPA DE POSIÇÃO do molde: cada pixel do molde sabe o ponto do carro (x, y, s) e a normal dele (os triângulos são rasterizados no
// espaço do UV); 2) as cores de base saem de uma função da equipe sobre esse ponto (a faixa rosa da caixa lateral, o azul de cima...); 3) as marcas
// e os números são colocados por ponto do carro: acha-se o triângulo do molde que está ali e a transformação dele (do plano do carro para o UV), e a
// imagem é desenhada com ela, nítida e acompanhando a peça.
// Medidas em metros do carro (s desde o bico, y de altura, x para o lado; a frente é s = 0), as mesmas de f1-pintura.js.
import * as THREE from "three";
import { desenharMarca } from "./f1-marcas.js";

const anoEmUso = () => (typeof window !== "undefined" && window.F1Temporadas ? window.F1Temporadas.anoAtual() : 2026);
export const DESENHOS_UV = {};
const desenhoUV = (equipe) => equipe && DESENHOS_UV[equipe + "@" + anoEmUso()];
export const temPinturaUV = (equipe) => !!desenhoUV(equipe);

// ---------- o mapa de posição de uma lista de fontes (pos, nor, uv, idx no quadro do carro) ----------
function mapaDe(fontes, N, zNariz) {
  const P = new Float32Array(N * N * 3), Nn = new Float32Array(N * N * 3), cob = new Uint8Array(N * N), tris = [];
  for (const f of fontes) {
    if (!f.uv) continue;
    const { pos, nor, uv, idx } = f;
    for (let t = 0; t < idx.length; t += 3) {
      const v = [idx[t], idx[t + 1], idx[t + 2]];
      // (o triângulo inteiro vai para o quadrado 0..1 junto: o módulo vértice por vértice esticava os que cruzam a borda pela textura toda)
      const u0 = Math.floor(Math.min(uv[v[0] * 2], uv[v[1] * 2], uv[v[2] * 2])), v0 = Math.floor(Math.min(uv[v[0] * 2 + 1], uv[v[1] * 2 + 1], uv[v[2] * 2 + 1]));
      const U = v.map((i) => [(uv[i * 2] - u0) * N, (uv[i * 2 + 1] - v0) * N]);
      if (Math.max(U[0][0], U[1][0], U[2][0]) - Math.min(U[0][0], U[1][0], U[2][0]) > N * 0.3 || Math.max(U[0][1], U[1][1], U[2][1]) - Math.min(U[0][1], U[1][1], U[2][1]) > N * 0.3) continue; // (costura esticada: fica de fora)
      const X = v.map((i) => [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2] - zNariz]); // (x, y, s)
      const n0 = [0, 1, 2].map((e) => (nor[v[0] * 3 + e] + nor[v[1] * 3 + e] + nor[v[2] * 3 + e]) / 3);
      tris.push({ U, X, n: n0 });
      // rasteriza o triângulo no molde
      const x0 = Math.max(0, Math.floor(Math.min(U[0][0], U[1][0], U[2][0]))), x1 = Math.min(N - 1, Math.ceil(Math.max(U[0][0], U[1][0], U[2][0])));
      const y0 = Math.max(0, Math.floor(Math.min(U[0][1], U[1][1], U[2][1]))), y1 = Math.min(N - 1, Math.ceil(Math.max(U[0][1], U[1][1], U[2][1])));
      const d = (U[1][1] - U[2][1]) * (U[0][0] - U[2][0]) + (U[2][0] - U[1][0]) * (U[0][1] - U[2][1]); if (Math.abs(d) < 1e-9) continue;
      for (let py = y0; py <= y1; py++) for (let px = x0; px <= x1; px++) {
        const qx = px + 0.5, qy = py + 0.5;
        const a = ((U[1][1] - U[2][1]) * (qx - U[2][0]) + (U[2][0] - U[1][0]) * (qy - U[2][1])) / d, b = ((U[2][1] - U[0][1]) * (qx - U[2][0]) + (U[0][0] - U[2][0]) * (qy - U[2][1])) / d, c = 1 - a - b;
        if (a < -0.02 || b < -0.02 || c < -0.02) continue;
        const k = py * N + px; cob[k] = 1;
        for (let e = 0; e < 3; e++) { P[k * 3 + e] = a * X[0][e] + b * X[1][e] + c * X[2][e]; Nn[k * 3 + e] = n0[e]; }
      }
    }
  }
  return { N, P, Nn, cob, tris };
}

// ---------- as cores de base: a função da equipe em cada pixel, e a borda alargada (sem costura escura entre as ilhas do molde) ----------
const rgb = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
function pintarBase(M, corDe) {
  const { N, P, Nn, cob } = M, img = new ImageData(N, N), d = img.data, cache = new Map();
  for (let k = 0; k < N * N; k++) {
    if (!cob[k]) continue;
    const h = corDe({ x: P[k * 3], y: P[k * 3 + 1], s: P[k * 3 + 2] }, { x: Nn[k * 3], y: Nn[k * 3 + 1], z: Nn[k * 3 + 2] });
    const c = cache.get(h) || (cache.set(h, rgb(h)), cache.get(h));
    d[k * 4] = c[0]; d[k * 4 + 1] = c[1]; d[k * 4 + 2] = c[2]; d[k * 4 + 3] = 255;
  }
  for (let passo = 0; passo < 4; passo++) { // alarga a borda de cada ilha em 4 px
    const novo = new Uint8ClampedArray(d);
    for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) {
      const k = y * N + x; if (d[k * 4 + 3]) continue;
      for (const o of [k - 1, k + 1, k - N, k + N]) if (d[o * 4 + 3]) { novo[k * 4] = d[o * 4]; novo[k * 4 + 1] = d[o * 4 + 1]; novo[k * 4 + 2] = d[o * 4 + 2]; novo[k * 4 + 3] = 255; break; }
    }
    d.set(novo);
  }
  return img;
}
// o gradiente de uma cor para outra (h1 a h2) pela fração f (0..1), arredondado em 24 passos (o cache de cores fica pequeno)
export function mistura(h1, h2, f) { const a = rgb(h1), b = rgb(h2), q = Math.round(Math.max(0, Math.min(1, f)) * 24) / 24; return "#" + a.map((v, i) => Math.round(v + (b[i] - v) * q).toString(16).padStart(2, "0")).join(""); }

// ---------- pôr uma imagem num ponto do carro ----------
// plano "lado" (vista de lado, a = s, b = y; `lado` = +1 no lado x > 0), "topo" (de cima, a = s, b = x) ou "tras" (de trás, a = x, b = y). A imagem
// fica centrada em (a, b), com `larg` metros de largura, lida em pé por quem olha daquele lado (giro em graus, no sentido da leitura).
function acharTri(M, plano, a, b, lado) {
  let melhor = null, prof = -Infinity;
  for (const t of M.tris) {
    let A, B, fora, ok;
    if (plano === "lado") { ok = t.n[0] * lado > 0.25; A = t.X.map((p) => [p[2], p[1]]); fora = Math.max(...t.X.map((p) => p[0] * lado)); }
    else if (plano === "topo") { ok = t.n[1] > 0.25; A = t.X.map((p) => [p[2], p[0]]); fora = Math.max(...t.X.map((p) => p[1])); }
    else { ok = t.n[2] > 0.25; A = t.X.map((p) => [p[0], p[1]]); fora = Math.max(...t.X.map((p) => p[2])); }
    if (!ok) continue;
    const d = (A[1][1] - A[2][1]) * (A[0][0] - A[2][0]) + (A[2][0] - A[1][0]) * (A[0][1] - A[2][1]); if (Math.abs(d) < 1e-10) continue;
    const l0 = ((A[1][1] - A[2][1]) * (a - A[2][0]) + (A[2][0] - A[1][0]) * (b - A[2][1])) / d, l1 = ((A[2][1] - A[0][1]) * (a - A[2][0]) + (A[0][0] - A[2][0]) * (b - A[2][1])) / d, l2 = 1 - l0 - l1;
    if (l0 < -0.01 || l1 < -0.01 || l2 < -0.01) continue;
    if (fora > prof) { prof = fora; melhor = { t, A }; }
  }
  return melhor;
}
function colocar(ctx, M, escala, desenho, { plano = "lado", lado = 1, a, b, larg, giro = 0 }) {
  const r = acharTri(M, plano, a, b, lado); if (!r) return false;
  const { t, A } = r, U = t.U.map(([u, v]) => [u * escala, v * escala]);
  // a transformação afim do plano (a, b) para o canvas, pelo triângulo
  const det = (A[1][0] - A[0][0]) * (A[2][1] - A[0][1]) - (A[2][0] - A[0][0]) * (A[1][1] - A[0][1]); if (Math.abs(det) < 1e-12) return false;
  const ia = [(A[2][1] - A[0][1]) / det, -(A[2][0] - A[0][0]) / det, -(A[1][1] - A[0][1]) / det, (A[1][0] - A[0][0]) / det];
  const du = [U[1][0] - U[0][0], U[2][0] - U[0][0]], dv = [U[1][1] - U[0][1], U[2][1] - U[0][1]];
  const m = [du[0] * ia[0] + du[1] * ia[2], du[0] * ia[1] + du[1] * ia[3], dv[0] * ia[0] + dv[1] * ia[2], dv[0] * ia[1] + dv[1] * ia[3]]; // [du/da du/db; dv/da dv/db]
  // os eixos de leitura no plano: "direita" e "para baixo" de quem olha
  let dir, baixo;
  if (plano === "lado") { dir = [lado > 0 ? -1 : 1, 0]; baixo = [0, -1]; }
  else if (plano === "topo") { dir = [0, 1]; baixo = [1, 0]; }
  else { dir = [1, 0]; baixo = [0, -1]; }
  const g = (giro * Math.PI) / 180, cg = Math.cos(g), sg = Math.sin(g);
  const R = [dir[0] * cg + baixo[0] * sg, dir[1] * cg + baixo[1] * sg], D = [-dir[0] * sg + baixo[0] * cg, -dir[1] * sg + baixo[1] * cg];
  const centro = [U[0][0] + m[0] * (a - A[0][0]) + m[1] * (b - A[0][1]), U[0][1] + m[2] * (a - A[0][0]) + m[3] * (b - A[0][1])];
  const ex = [m[0] * R[0] + m[1] * R[1], m[2] * R[0] + m[3] * R[1]], ey = [m[0] * D[0] + m[1] * D[1], m[2] * D[0] + m[3] * D[1]]; // (pixels por metro, nas duas direções da leitura)
  ctx.save(); ctx.setTransform(ex[0], ex[1], ey[0], ey[1], centro[0], centro[1]);
  desenho(ctx, larg); // o desenho em metros, centrado na origem, x para a direita e y para baixo
  ctx.restore(); return true;
}

// ---------- as imagens (logos do Thiago em logos-carro/) e as marcas desenhadas ----------
const IMGS = new Map();
function imagem(url, depois) {
  let e = IMGS.get(url); if (!e) { e = { img: new Image(), ok: false, espera: [] }; IMGS.set(url, e); e.img.onload = () => { e.ok = true; for (const f of e.espera.splice(0)) f(); }; e.img.src = url; }
  if (!e.ok && depois) e.espera.push(depois); return e.ok ? e.img : null;
}
// o que cada desenho pode pôr: { img: url } (o logo inteiro na largura), { marca: id, tinta } (f1-marcas.js), { texto, cor, peso, fam } ou { fn(ctx, larg) }
export function peca(spec, depois) {
  return (ctx, larg) => {
    if (spec.img) { const i = imagem(spec.img, depois); if (!i) return; const h = (larg * i.height) / i.width; ctx.drawImage(i, -larg / 2, -h / 2, larg, h); }
    else if (spec.marca) { ctx.scale(larg / (spec.proporcao || 4), larg / (spec.proporcao || 4)); desenharMarca(ctx, spec.marca, { tinta: spec.tinta, fundo: spec.fundo }); }
    else if (spec.texto) { const h = spec.altura || larg / Math.max(3, spec.texto.length * 0.62); ctx.font = `${spec.estilo || ""} ${spec.peso || 800} 100px ${spec.fam || "Arial, Helvetica, sans-serif"}`; ctx.scale(h / 100, h / 100); ctx.textAlign = "center"; ctx.textBaseline = "middle"; if ("letterSpacing" in ctx) ctx.letterSpacing = (spec.esp || 0) + "px"; if (spec.borda) { ctx.lineWidth = 10; ctx.strokeStyle = spec.borda; ctx.lineJoin = "round"; ctx.strokeText(spec.texto, 0, 0, (larg * 100) / h); } ctx.fillStyle = spec.cor || "#fff"; ctx.fillText(spec.texto, 0, 0, (larg * 100) / h); }
    else if (spec.fn) spec.fn(ctx, larg);
  };
}

// ---------- a textura de um material do carro (corpo ou asas) para a equipe e o número ----------
const MAPAS = new WeakMap(), TEXTURAS = new Map();
function mapaDoModelo(D, qual, N) {
  let por = MAPAS.get(D); if (!por) MAPAS.set(D, (por = {}));
  return por[qual + N] || (por[qual + N] = mapaDe(D.uv.fontes[qual], N, D.uv.zNariz));
}
export function texturaUV(D, equipe, qual, numero, alta) {
  const des = desenhoUV(equipe); if (!des || !D.uv || !D.uv.fontes[qual]?.length) return null;
  const chave = [equipe, anoEmUso(), qual, numero ?? "", alta ? 2 : 1, D.uv.id].join("|"); if (TEXTURAS.has(chave)) return TEXTURAS.get(chave);
  const N = alta ? 1024 : 512, ESC = alta ? 2 : 2, M = mapaDoModelo(D, qual, N); // (as cores no mapa de N; o canvas tem o dobro, para as marcas ficarem nítidas)
  const cv = document.createElement("canvas"); cv.width = cv.height = N * ESC; const ctx = cv.getContext("2d");
  const base = document.createElement("canvas"); base.width = base.height = N; base.getContext("2d").putImageData(pintarBase(M, (p, n) => des.cor(p, n, qual)), 0, 0);
  const tex = new THREE.CanvasTexture(cv); tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const desenhar = () => {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = true; ctx.drawImage(base, 0, 0, N * ESC, N * ESC);
    for (const it of (des.marcas || [])) if ((it.qual || "livery") === qual) colocar(ctx, M, ESC, peca(it.o, () => { desenhar(); tex.needsUpdate = true; }), it);
    if (numero != null && des.numero) for (const it of des.numero) if ((it.qual || "livery") === qual) colocar(ctx, M, ESC, peca({ texto: String(numero), cor: it.cor, borda: it.borda, peso: 900, estilo: "italic", altura: it.altura }), it);
    tex.needsUpdate = true;
  };
  desenhar(); TEXTURAS.set(chave, tex); return tex;
}
