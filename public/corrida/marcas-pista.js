// Corrida da Galera — as MARCAS dos pneus no asfalto, deixadas de verdade por onde cada carro passa (pedido do Thiago, 2026-11-13):
//   R · borracha (pista seca): o carro que escorrega de lado ou freia muito forte risca o asfalto com as duas rodas de trás, e a marca fica
//   G · o traçado que seca (pista molhada): cada passagem tira um pouco de água por onde as rodas andam, e a linha dos carros vai aparecendo
//       aos poucos com o tráfego; a chuva forte molha tudo de novo
// No lugar do "rastro seco" de antes, que era desenhado colado atrás de cada carro perto da câmera e andava junto com ele.
// Uma textura RG da largura × volta inteira, nas MESMAS coordenadas da máscara de água (agua-pista.js `mascaraAgua`, `aguaUv`): o sombreador
// do asfalto lê as duas. Os carros carimbam na memória e a textura sobe para a placa poucas vezes por segundo.
import * as THREE from "three";

const LAT = 96;            // colunas na largura da pista (≈ 1,25 u cada, numa pista de 120 u)
const RODA = 8;            // as rodas a ±8 u do meio do carro (os mesmos sulcos da máscara de água)
const ENVIO_S = 0.25;      // de quanto em quanto tempo a textura sobe para a placa (só se mudou)
const lim = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);

// a textura de uma pista (fica em tr.marcas): começa limpa a cada pista montada
export function texturaDeMarcas(tr) {
  if (tr.marcas) return tr.marcas.tex;
  const rows = Math.min(tr.n, 4096), data = new Uint8Array(LAT * rows * 2);
  const tex = new THREE.DataTexture(data, LAT, rows, THREE.RGFormat, THREE.UnsignedByteType);
  tex.wrapS = THREE.ClampToEdgeWrapping; tex.wrapT = THREE.RepeatWrapping; tex.minFilter = tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
  tr.marcas = { tex, data, rows, sujo: false, envio: 0, secar: 0 };
  return tex;
}

// o ponto da pista mais perto de (x, y), procurando em volta do último (o primeiro é uma busca inteira)
function pontoMaisPerto(tr, x, y, ult) {
  const { pts, n } = tr; let best = -1, bd = Infinity;
  const varrer = (a, b) => { for (let k = a; k <= b; k++) { const i = ((k % n) + n) % n, p = pts[i], d = (p.x - x) ** 2 + (p.y - y) ** 2; if (d < bd) { bd = d; best = i; } } };
  if (ult >= 0) varrer(ult - 25, ult + 25); else varrer(0, n - 1);
  return best;
}
// a posição do carro na textura: { r (linha, com fração), l (lateral, em u: + é o lado de p.nx) } ou null fora da pista
function naTextura(tr, x, y, est) {
  const i = pontoMaisPerto(tr, x, y, est.i); if (i < 0) return null; est.i = i;
  const { pts, n, W } = tr, p = pts[i], dx = x - p.x, dy = y - p.y, l = dx * p.nx + dy * p.ny, t = dx * p.tx + dy * p.ty;
  if (Math.abs(l) > W / 2 + 4) return null;
  const q = pts[(i + 1) % n], seg = Math.max(1, Math.hypot(q.x - p.x, q.y - p.y)), M = tr.marcas;
  return { r: (i + t / seg + 0.5) * (M.rows / n) - 0.5, l };
}
// soma `k` (0 a 1) no canal `ch` em volta de (r, coluna c), com `meia` colunas de cada lado
function carimbo(M, r, c, ch, k, meia) {
  const rows = M.rows, ri = ((Math.round(r) % rows) + rows) % rows, ci = Math.round(c);
  for (let d = -meia; d <= meia; d++) {
    const cc = ci + d; if (cc < 0 || cc >= LAT) continue;
    const o = (ri * LAT + cc) * 2 + ch, w = meia ? 1 - Math.abs(d) / (meia + 1) : 1;
    M.data[o] = Math.min(ch === 0 ? 210 : 255, M.data[o] + Math.round(k * w * 255));
  }
  M.sujo = true;
}
// um trecho de rodas do carro, de `a` até `b` (posições na textura), nas duas rodas de trás
function trilha(tr, a, b, ch, k, meia) {
  const M = tr.marcas, W = tr.W, rows = M.rows;
  let dr = b.r - a.r; if (dr > rows / 2) dr -= rows; else if (dr < -rows / 2) dr += rows; // (a emenda da volta)
  const passos = Math.min(40, Math.max(1, Math.ceil(Math.abs(dr))));
  for (let s = 1; s <= passos; s++) {
    const f = s / passos, r = a.r + dr * f, l = a.l + (b.l - a.l) * f;
    for (const lado of [-RODA, RODA]) carimbo(M, r, ((l + lado) / W + 0.5) * LAT - 0.5, ch, k, meia);
  }
}

// por quadro (clima-visual.js): `carros` são os objetos desenhados ({ x, y, a, v }); `agua` e `chuva`, o clima agora
export function passoMarcas(dt, tr, carros, agua, chuva) {
  const M = tr.marcas; if (!M || !(dt > 0)) return;
  for (const car of carros) {
    if (!car) continue;
    const est = car.__marca || (car.__marca = { i: -1, x: car.x, y: car.y, v: 0, drift: 0, freada: 0, pos: null });
    const vx = (car.x - est.x) / dt, vy = (car.y - est.y) / dt, v = Math.hypot(vx, vy);
    const salto = v > 700; // (o carro recolocado na pista, ou o primeiro quadro: não risca o caminho)
    let drift = 0; if (v > 40) { drift = Math.atan2(vy, vx) - (car.a || 0); drift = Math.atan2(Math.sin(drift), Math.cos(drift)); }
    const kf = 1 - Math.exp(-dt / 0.12);
    est.drift += (Math.abs(drift) - est.drift) * kf; est.freada += (Math.max(0, (est.v - v) / dt) - est.freada) * kf; est.v = v;
    est.x = car.x; est.y = car.y;
    const pos = salto ? null : naTextura(tr, car.x, car.y, est);
    if (pos && est.pos && v > 25) {
      // a borracha: só no seco (a água tira a marca nova); de lado (mais de ~4°) ou freando além do que o pneu segura (o carro trava a roda)
      const seco = 1 - lim(agua / 0.25), lado = lim((est.drift - 0.07) / 0.2), trava = lim((est.freada - 240) / 220);
      const kb = seco * Math.max(lado, 0.7 * trava) * Math.min(1, dt * 30) * 0.5;
      if (kb > 0.004) trilha(tr, est.pos, pos, 0, kb, 0);
      // o traçado secando: cada passagem tira um pouco da água por onde as rodas andam (só com a pista molhada e a chuva não muito forte)
      const kg = agua > 0.12 ? 0.06 * (1 - 0.7 * lim(chuva)) * Math.min(1, dt * 30) : 0;
      if (kg > 0.002) trilha(tr, est.pos, pos, 1, kg, 2);
    }
    est.pos = pos;
  }
  // a chuva molha de novo o traçado (a forte apaga a linha em ~1 minuto) e, sem água nenhuma, a linha seca some (já está tudo seco)
  M.secar += dt;
  if (M.secar >= 0.5) {
    const tira = Math.round(M.secar * (chuva > 0.05 ? 4 * chuva : agua < 0.05 ? 8 : 0)); M.secar = 0;
    if (tira > 0) { const d = M.data; let mexeu = false; for (let o = 1; o < d.length; o += 2) if (d[o]) { d[o] = d[o] > tira ? d[o] - tira : 0; mexeu = true; } if (mexeu) M.sujo = true; }
  }
  M.envio += dt;
  if (M.sujo && M.envio >= ENVIO_S) { M.envio = 0; M.sujo = false; M.tex.needsUpdate = true; }
}
