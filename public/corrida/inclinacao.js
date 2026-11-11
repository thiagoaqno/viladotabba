// Inclinação visual do carro: acompanha o asfalto enquanto as rodas o tocam e o terreno ao sair dele.
// As sondas ficam embaixo dos EIXOS (a meia distância entre eixos de um F1 2026, 3,4 m de 5,5 m de carro: 0,31 do comprimento), e cada uma acha o
// seu trecho da pista: com o índice do centro, `Sim.quadro` prende o ponto ao segmento vizinho e a ladeira saía pela metade.
// `dy`: quanto o carro sobe ou desce para as rodas tocarem o chão desenhado — a média das quatro rodas menos a altura do centro (na lombada as rodas
// ficam no ar, na baixada entram no chão) mais a fita do asfalto, que pista.js desenha ASFALTO u acima do traçado.
const ASFALTO = 0.4, EIXO = 0.31;
function perto(tr, x, y, idx) {
  const { pts, n } = tr; if (!pts) return idx; let best = idx, bd = Infinity;
  for (let k = -8; k <= 8; k++) { const i = (idx + k + n) % n, p = pts[i], d = (p.x - x) ** 2 + (p.y - y) ** 2; if (d < bd) { bd = d; best = i; } }
  return best;
}
export function inclinacao(tr, x, y, a, idx, L, W, vz, noAr, v, f1, Sim, groundH) {
  if (noAr) return { pitch: Math.max(-0.5, Math.min(0.4, Math.atan2(vz || 0, Math.max(60, Math.abs(v))))), roll: 0, dy: 0 };
  const lat = Math.abs(Sim.quadro(tr, x, y, idx).lat), naPista = f1 && lat <= (tr.W + W) / 2;
  const h = (dx, dy) => { const px = x + dx, py = y + dy, i = perto(tr, px, py, idx); return naPista ? Sim.quadro(tr, px, py, i).h : groundH(tr, px, py, i); };
  const fx = Math.cos(a), fy = Math.sin(a), e = L * EIXO, w = W / 2;
  const fd = h(fx * e - fy * w, fy * e + fx * w), fe = h(fx * e + fy * w, fy * e - fx * w), td = h(-fx * e - fy * w, -fy * e + fx * w), te = h(-fx * e + fy * w, -fy * e - fx * w);
  const frente = (fd + fe) / 2, tras = (td + te) / 2, dir = (fd + td) / 2, esq = (fe + te) / 2;
  const centro = h(0, 0), fita = lat <= tr.W / 2 ? ASFALTO : 0;
  return { pitch: Math.atan2(frente - tras, 2 * e), roll: Math.atan2(dir - esq, W), dy: Math.max(-3, Math.min(3, (frente + tras) / 2 - centro)) + fita };
}
