// Corrida da Galera — a linha de corrida dos robôs, calculada por otimização sobre os pontos da pista.
// O caminho de cada pista é o de CURVATURA MÍNIMA entre as beiras (menos a folga do carro): minimiza a soma dos quadrados da segunda
// diferença do caminho (a curvatura vezes o passo ao quadrado). Isso dá a linha de corrida de verdade: abre no lado de fora antes
// da curva, encosta na zebra de dentro no ápice e sai abrindo até o lado de fora mais distante; curvas em sequência (chicanes, esses)
// saem resolvidas juntas, porque o problema é um só para a volta inteira. Com a pista de sempre (pontos de 6 em 6 u) o problema é um
// QP convexo na posição lateral de cada ponto: resolvido por gradiente conjugado nos pontos livres, prendendo nas beiras os que
// passam do limite (conjunto ativo), uma vez por pista (o resultado fica em cache).
"use strict";
const CACHE = new Map();
// pts: [{ x, y, tx, ty }] da pista (cíclica); max: o maior deslocamento lateral do centro do carro (u), um número ou um Float64Array por ponto (Baku: a pista estreita
// entre as barreiras da Cidade Velha), ou { lo, hi } com o limite de cada lado por ponto. `externas`: o máximo de iterações do conjunto ativo. Devolve Float64Array(lat).
function otimizar(pts, max0, externas = 40) {
  const porLado = max0 && max0.hi, M = typeof max0 === "number" ? () => max0 : (i) => max0[i];
  const Hi = porLado ? (i) => max0.hi[i] : M, Lo = porLado ? (i) => max0.lo[i] : (i) => -M(i);
  const n = pts.length, nx = new Float64Array(n), ny = new Float64Array(n), cx = new Float64Array(n), cy = new Float64Array(n);
  for (let i = 0; i < n; i++) { nx[i] = -pts[i].ty; ny[i] = pts[i].tx; cx[i] = pts[i].x; cy[i] = pts[i].y; }
  const dx = new Float64Array(n), dy = new Float64Array(n);
  // o gradiente de J(l) = soma |d_i|^2, d_i = X[i-1] - 2 X[i] + X[i+1], X = centro + normal * l
  const grad = (l, g) => {
    for (let i = 0; i < n; i++) {
      const a = (i - 1 + n) % n, b = (i + 1) % n;
      dx[i] = (cx[a] + nx[a] * l[a]) - 2 * (cx[i] + nx[i] * l[i]) + (cx[b] + nx[b] * l[b]);
      dy[i] = (cy[a] + ny[a] * l[a]) - 2 * (cy[i] + ny[i] * l[i]) + (cy[b] + ny[b] * l[b]);
    }
    for (let j = 0; j < n; j++) {
      const a = (j - 1 + n) % n, b = (j + 1) % n;
      g[j] = 2 * (nx[j] * (dx[a] + dx[b] - 2 * dx[j]) + ny[j] * (dy[a] + dy[b] - 2 * dy[j]));
    }
  };
  const l = new Float64Array(n), prisao = new Int8Array(n); // prisao: 0 livre, +1/-1 preso na beira
  const g = new Float64Array(n), g0 = new Float64Array(n), r = new Float64Array(n), p = new Float64Array(n), Ap = new Float64Array(n), tmp = new Float64Array(n);
  grad(l, g0); // g(l) = A l + g0 (a função é quadrática)
  const A = (v, out) => { grad(v, tmp); for (let i = 0; i < n; i++) out[i] = tmp[i] - g0[i]; };
  for (let externa = 0; externa < externas; externa++) {
    let mudou = false;
    // gradiente conjugado nos pontos livres: min 1/2 d·A d + g·d com d só nos livres
    grad(l, g);
    for (let i = 0; i < n; i++) { r[i] = prisao[i] ? 0 : -g[i]; p[i] = r[i]; }
    let rr = 0; for (let i = 0; i < n; i++) rr += r[i] * r[i];
    const rr0 = rr;
    for (let it = 0; it < 4 * n && rr > 1e-14 * Math.max(1, rr0); it++) {
      A(p, Ap); for (let i = 0; i < n; i++) if (prisao[i]) Ap[i] = 0;
      let pAp = 0; for (let i = 0; i < n; i++) pAp += p[i] * Ap[i];
      if (!(pAp > 1e-30)) break;
      const alfa = rr / pAp; let rr2 = 0;
      // passo até a beira mais próxima (se algum ponto passa do limite, para ali e prende)
      let tmax = alfa, qual = -1;
      for (let i = 0; i < n; i++) if (!prisao[i] && p[i] !== 0) { const alvo = p[i] > 0 ? Hi(i) : Lo(i), t = (alvo - l[i]) / p[i]; if (t < tmax) { tmax = t; qual = i; } }
      for (let i = 0; i < n; i++) if (!prisao[i]) { l[i] += tmax * p[i]; r[i] -= tmax * Ap[i]; }
      if (qual >= 0) { prisao[qual] = p[qual] > 0 ? 1 : -1; l[qual] = prisao[qual] > 0 ? Hi(qual) : Lo(qual); mudou = true; break; }
      for (let i = 0; i < n; i++) rr2 += r[i] * r[i];
      const beta = rr2 / rr; rr = rr2;
      for (let i = 0; i < n; i++) p[i] = prisao[i] ? 0 : r[i] + beta * p[i];
    }
    // prende os que passaram, solta os presos cujo gradiente puxa para dentro
    for (let i = 0; i < n; i++) if (!prisao[i] && (l[i] > Hi(i) || l[i] < Lo(i))) { prisao[i] = l[i] > 0 ? 1 : -1; l[i] = prisao[i] > 0 ? Hi(i) : Lo(i); mudou = true; }
    grad(l, g);
    for (let i = 0; i < n; i++) if (prisao[i] && g[i] * prisao[i] > 0) { prisao[i] = 0; mudou = true; } // o gradiente de J cresce para fora: volta para dentro
    if (!mudou && externa > 0) break;
  }
  return l;
}
// (2026-11-21) A curvatura mínima de verdade. O gradiente conjugado acima não converge com os pontos de 6 em 6 u (o problema é de quarta ordem: o número de
// condição passa de 10^13), e a linha saía quase no eixo da pista: em Suzuka só 6 dos 2389 pontos chegavam na beira e 67% deles ficavam a menos de 1/5 da
// meia-largura do centro. Aqui o mesmo problema (soma dos quadrados da segunda diferença) é resolvido do grosso para o fino: nós a cada `passo` pontos
// (32, 16, 8, 4, 2, 1), Gauss-Seidel projetado (cada nó vai para o lugar que zera a sua parte do gradiente, preso entre as beiras) e o resultado de um passo
// é o começo do seguinte. Devolve Float64Array(lat) por ponto.
function curvaturaMinima(pts, lim, op = {}) {
  const n = pts.length, Hi = (i) => lim.hi[i], Lo = (i) => lim.lo[i];
  let lat = new Float64Array(n);
  for (const passo of op.passos || [32, 16, 8, 4, 2, 1]) {
    const m = Math.floor(n / passo); if (m < 8) continue;
    const idx = Array.from({ length: m }, (_, a) => Math.round((a * n) / m) % n);
    const cx = idx.map((i) => pts[i].x), cy = idx.map((i) => pts[i].y), nx = idx.map((i) => -pts[i].ty), ny = idx.map((i) => pts[i].tx);
    const l = Float64Array.from(idx, (i) => lat[i]), hi = idx.map(Hi), lo = idx.map(Lo);
    const X = (a) => cx[a] + nx[a] * l[a], Y = (a) => cy[a] + ny[a] * l[a];
    const varre = op.varreduras ?? (passo >= 8 ? 600 : passo >= 2 ? 400 : 250), omega = op.omega ?? 1.6;
    for (let v = 0; v < varre; v++) {
      let maior = 0;
      for (let a = 0; a < m; a++) {
        const am = (a - 1 + m) % m, ap = (a + 1) % m, am2 = (a - 2 + m) % m, ap2 = (a + 2) % m;
        // as três segundas diferenças em que o nó a entra (pesos 1, -2, 1), sem a parte dele
        const Xa = cx[a], Ya = cy[a];
        const r1x = X(am2) - 2 * X(am) + Xa, r1y = Y(am2) - 2 * Y(am) + Ya;
        const r2x = X(am) - 2 * Xa + X(ap), r2y = Y(am) - 2 * Ya + Y(ap);
        const r3x = Xa - 2 * X(ap) + X(ap2), r3y = Ya - 2 * Y(ap) + Y(ap2);
        const alvo = -((nx[a] * r1x + ny[a] * r1y) - 2 * (nx[a] * r2x + ny[a] * r2y) + (nx[a] * r3x + ny[a] * r3y)) / 6;
        const novo = Math.max(lo[a], Math.min(hi[a], l[a] + omega * (alvo - l[a])));
        maior = Math.max(maior, Math.abs(novo - l[a])); l[a] = novo;
      }
      if (maior < 1e-3) break;
    }
    // do nó para todos os pontos (linear: o passo seguinte alisa)
    const cheio = new Float64Array(n);
    for (let a = 0; a < m; a++) { const i0 = idx[a], i1 = idx[(a + 1) % m], len = ((i1 - i0 + n) % n) || n; for (let k = 0; k < len; k++) { const u = k / len; cheio[(i0 + k) % n] = Math.max(Lo((i0 + k) % n), Math.min(Hi((i0 + k) % n), l[a] * (1 - u) + l[(a + 1) % m] * u)); } }
    lat = cheio;
  }
  return lat;
}
function linhaDaPista(pista, pts, W, folga = require("../../public/corrida/pistas.js").PISTAS[pista]?.real ? 10 : 18) { // (Formula GP: a folga da beira do carro real, meio carro e um respiro)
  const k = pista + "|" + folga; if (CACHE.has(k)) return CACHE.get(k);
  const lat = otimizar(pts, Math.max(4, W / 2 - folga)); CACHE.set(k, lat); return lat;
}
module.exports = { otimizar, curvaturaMinima, linhaDaPista };
