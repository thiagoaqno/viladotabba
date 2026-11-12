// Xangai — a cópia só desta pista de kit/ambiente.js (a base é a de ../melbourne/ambiente.js), com tudo no chão. Xangai não tem muro de rua (`walls: false`): a barreira é a da regra automática de `tr.murosEscape` (de 70 a 110 u da borda, a mesma
// que a física lê, desenhada por `pista.js` com 8,5 × a escala de altura), e o kit, para `escapeLivre`, desliga a cerca mas deixa as bandeiras, as placas de frenagem, os painéis e os postos dos fiscais a `W / 2 + 30 + ...`
// na altura da pista (`p.h`), no ar quando o chão da malha desce. Diferenças: (1) sem painéis de patrocinador soltos (a barreira já leva o seu); (2) tudo pousa em `nivelDoChao` (a fita de chao.js) e fica ATRÁS da barreira de cada trecho
// (`W / 2 + recuo + ...`; onde não há barreira, a `W / 2 + 32`); (3) a placa de frenagem tem poste até o chão e 2,4 × 1,5 m (11,5 × 7,2 u; a do kit era 13 × a escala por 9 × a escala, 1,1 × 0,75 m, que ninguém lê a 20 m);
// (4) os mastros das bandeiras da China (7,5 m) e os postos dos fiscais (que vida.js anima, em tr.postosGP) pousam no chão; (5) a cerca de detritos que o kit desliga volta, mas no lugar certo: uma tela de 3,5 m sobre a barreira,
// colada nela por trás, com um poste a cada 18 u (3,75 m), só onde `pista.js` desenha a barreira, e nunca atravessando as arquibancadas (`tr.arqDegraus`) nem o corredor dos boxes.
// `postesDRS` dá poste até o chão às placas de DRS de pista.js.
//
// cfg: { posto: a marca do posto, placas: as distâncias das placas de frenagem em metros, outdoors: as marcas dos outdoors de vida.js, bandeira: [cor de cima, cor de baixo] }
import * as THREE from "three";
import { canvasTex, M } from "../../../cena.js";
import { marcaTex, PATROCINIO } from "../marcas.js";
import { ocupado } from "../comum.js";
import { nivelDoChao, falloff } from "./chao.js";

export function ambienteXangai(tr, add, { posto = "f1", placas = [100, 50], outdoors = PATROCINIO, bandeira = [0xde2910, 0xffde00] } = {}) {
  const { pts, n, W } = tr, E = tr.escala ?? 1, lotes = new Map();
  const metal = M(0x697780), vermelho = M(0xc42d38), laranja = M(0xf27421), escuro = M(0x18242b), branco = M(0xf0eee6), bandCima = M(bandeira[0]), bandBaixo = M(bandeira[1]);
  const placa = (texto, fundo, cor = "#ffffff") => new THREE.MeshBasicMaterial({ map: canvasTex(512, 128, (x, w, h) => {
    x.fillStyle = fundo; x.fillRect(0, 0, w, h); x.fillStyle = cor; x.fillRect(0, h - 6, w, 6);
    x.font = "900 65px sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(texto, w / 2, h / 2, w - 24);
  }, false) });
  const painelPosto = new THREE.MeshBasicMaterial({ map: marcaTex(posto, 512, 128) });
  const distancias = placas.map((v) => placa(String(v), "#f5f4ee", "#18242b"));
  tr.postosGP = []; tr.marcasGP = outdoors; // os outdoors de vida.js também levam as marcas
  const stats = tr.ambienteGP = { paineis: 0, postos: 0, placas: 0, bandeiras: 0, luzesTunel: 0, cerca: 0, setores: [0, 0, 0, 0] };
  function caixa(mat, x, y, z, sx, sy, sz, ry = 0) {
    if (!lotes.has(mat)) lotes.set(mat, []);
    lotes.get(mat).push({ x, y, z, sx, sy, sz, ry });
  }
  // um poste do chão (y0, 0,5 enterrado) até a altura `topo` acima dele
  const poste = (x, y0, z, topo, larg = 0.8) => caixa(metal, x, y0 - 0.5 + (topo + 0.5) / 2, z, larg, topo + 0.5, larg);
  // a entrada e a saída do corredor dos boxes (regras de F1) ficam livres
  const bx = tr.t.boxes && window.F1Regras ? window.F1Regras.corredor(tr.t, n, W) : null;
  const naRampa = (i, lado) => { if (!bx || lado !== bx.lado) return false; const r = (((i - bx.i0) % n) + n) % n, ra = window.F1Regras.RAMPA + 3; return r <= (tr.t.muro ? bx.len + 3 : ra) || (r >= bx.len - ra && r <= bx.len + 3); };
  const muro = (lado, i) => tr.murosEscape?.[lado]?.[((i % n) + n) % n] || 0;
  // a distância do eixo onde a peça fica: atrás da barreira do trecho (a face + 4 u) ou, sem barreira, a 32 u da borda; mais `extra`
  const lateral = (i, lado, extra) => W / 2 + (muro(lado, i) ? muro(lado, i) + 4 : 32) + extra;
  function lugar(i, lado, extra, raio = 12) {
    if (naRampa(i, lado)) return null;
    const lat = lateral(i, lado, extra), p = pts[(i + n) % n], x = p.x + p.nx * lado * lat, z = p.y + p.ny * lado * lat;
    if (tr.noCorredor?.(x, z)) return null;
    // distância exata a qualquer ponto do traçado, inclusive o trecho vizinho de um grampo e o outro lado de uma curva fechada
    const minimo = Math.max(lat - 3, W / 2 + raio);
    if (tr.distAt(x, z) < minimo || tr.distAt(x + p.tx * 16, z + p.ty * 16) < minimo || tr.distAt(x - p.tx * 16, z - p.ty * 16) < minimo) return null; // e as pontas das peças de 32
    return { p, x, z, h: nivelDoChao(tr, x, z), ry: Math.atan2(-p.nx * lado, -p.ny * lado) };
  }
  // os mastros das bandeiras da China (duas faixas, vermelha e amarela), de pé no chão, atrás da barreira, um lado de cada vez
  for (let i = 40, k = 0; i < n; i += 162, k++) {
    const lado = k % 2 ? 1 : -1, o = lugar(i, lado, 10, 8); if (!o || ocupado(tr, o.x, o.z, i)) continue;
    const { x, z, h, ry } = o;
    poste(x, h, z, 36, 1); // o mastro de 7,5 m
    caixa(bandCima, x, h + 34, z, 12, 3.6, 0.5, ry); caixa(bandBaixo, x, h + 30.4, z, 12, 3.6, 0.5, ry); // a bandeira (2,5 × 1,5 m)
    stats.bandeiras++;
  }
  // as placas de 200, 150, 100 e 50 m antes das curvas, do lado de fora, atrás da barreira, cada uma num poste até o chão
  let ultima = -n;
  for (let i = 0; i < n; i += 3) {
    if (pts[i].k < 1 / 350 || i - ultima < n / 12) continue;
    ultima = i;
    const p = pts[i], q = pts[(i + 3) % n], lado = p.tx * q.ty - p.ty * q.tx > 0 ? -1 : 1;
    placas.forEach((distancia, j) => {
      const idx = (i - Math.round(distancia * 10 / 6) + n) % n, o = lugar(idx, lado, 8, 5);
      if (!o || ocupado(tr, o.x, o.z, idx)) return;
      caixa(distancias[j], o.x, o.h + 12 + 3.6, o.z, 11.5, 7.2, 0.8, Math.atan2(-o.p.tx, -o.p.ty)); stats.placas++; // a placa de 2,4 × 1,5 m, com a borda de baixo a 2,5 m do chão
      poste(o.x, o.h, o.z, 12.3, 0.7);
    });
  }
  // postos de fiscal compactos, atrás da barreira, onde há espaço livre
  for (let i = 20; i < n; i += 55) for (const lado of [-1, 1]) {
    const o = lugar(i, lado, 26, 17); if (!o || ocupado(tr, o.x, o.z, i)) continue;
    const { x, z, ry, h } = o;
    caixa(escuro, x, h + 1, z, 23, 2, 20, ry);
    for (const s of [-1, 1]) caixa(metal, x + s * 9 * Math.cos(ry), h + 13, z - s * 9 * Math.sin(ry), 1, 24, 1);
    caixa(vermelho, x, h + 26, z, 26, 2, 23, ry);
    caixa(painelPosto, x, h + 19, z, 21, 6, 1, ry);
    for (const s of [-1, 1]) { // equipamentos dos fiscais (extintor e capacete), sobre a plataforma
      caixa(laranja, x + s * 5, h + 4, z, 1.8, 4.4, 1.8, ry); // o extintor de 0,9 m
      caixa(branco, x + s * 5, h + 7.2, z, 2.2, 1.6, 2.2, ry);
    }
    stats.postos++; (tr.reservado ||= []).push([x, z, 22]); tr.postosGP.push({ x, z, h, ry, i }); // vida.js põe o fiscal com a bandeira
  }
  // a cerca de detritos: sobre a barreira de `tr.murosEscape`, colada atrás dela (0,6 u), de 17 u (3,5 m) acima do topo dela (8,5 × a escala), com a tela de losangos presa nos postos
  const ALTO = 17, TOPO = 0.5 + 8.5 * E, tela = new THREE.MeshStandardMaterial({ map: canvasTex(64, 64, (x, w, h) => { x.strokeStyle = "rgba(210,220,226,0.9)"; x.lineWidth = 2.2; for (let k = -h; k < w + h; k += 16) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k + h, h); x.stroke(); x.beginPath(); x.moveTo(k + h, 0); x.lineTo(k, h); x.stroke(); } }), transparent: true, alphaTest: 0.2, side: THREE.DoubleSide, roughness: 0.6, metalness: 0.3 });
  const emArquibancada = (i, lado) => (tr.arqDegraus || []).some((a) => a.lado === lado && ((i - a.i0 + n) % n <= ((a.i1 - a.i0) + n) % n + 6 || (a.i0 - i + n) % n <= 6));
  for (const lado of [-1, 1]) {
    const vs = [], uv = [], idx = []; let d = 0;
    const ponto = (i) => { const p = pts[i % n], l = lado * (W / 2 + muro(lado, i) + 0.6), x = p.x + p.nx * l, z = p.y + p.ny * l, h = p.h * falloff(tr.t, W, l); return { x, z, h }; };
    const bom = (i) => muro(lado, i) > 0 && muro(lado, i + 1) > 0 && !naRampa(i, lado) && !emArquibancada(i, lado) && !emArquibancada(i + 1, lado) && !tr.noCorredor?.(ponto(i).x, ponto(i).z);
    for (let i = 0; i < n; i++) {
      if (!bom(i)) continue;
      const a = ponto(i), b = ponto(i + 1), c = Math.hypot(b.x - a.x, b.z - a.z), q = vs.length / 3;
      vs.push(a.x, a.h + TOPO, a.z, a.x, a.h + TOPO + ALTO, a.z, b.x, b.h + TOPO, b.z, b.x, b.h + TOPO + ALTO, b.z); uv.push(d / 16, 0, d / 16, 1.1, (d + c) / 16, 0, (d + c) / 16, 1.1); idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); d += c;
      if (i % 3 === 0) { const y0 = a.h + 0.3; caixa(metal, a.x, (y0 + a.h + TOPO + ALTO) / 2, a.z, 0.8, a.h + TOPO + ALTO - y0, 0.8); }
      stats.cerca++;
    }
    if (!idx.length) continue;
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(vs, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const m = add(new THREE.Mesh(g, tela)); m.name = `${tr.id}-cerca-tela`; m.castShadow = false;
  }
  const geo = new THREE.BoxGeometry(1, 1, 1), d = new THREE.Object3D();
  for (const [mat, lista] of lotes) {
    const m = new THREE.InstancedMesh(geo, mat, lista.length);
    lista.forEach((o, i) => { d.position.set(o.x, o.y, o.z); d.rotation.y = o.ry; d.scale.set(o.sx, o.sy, o.sz); d.updateMatrix(); m.setMatrixAt(i, d.matrix); });
    m.name = `${tr.id}-ambiente-gp`; m.receiveShadow = true; add(m);
  }
}

// as placas de DRS de pista.js (um sprite a 18 × a escala acima do ponto da pista, sem nada embaixo) ganham o poste até o chão; ele entra no mesmo grupo (tr.drsPlacas) e some e aparece junto
export function postesDRS(tr) {
  if (!tr.drsPlacas) return;
  const { W, pts, n } = tr, E = tr.escala ?? 1, metal = M(0x697780), geo = new THREE.BoxGeometry(0.8, 1, 0.8);
  for (const [deteccao, abre] of tr.t.drs || []) for (const f of [deteccao, abre]) {
    const p = pts[Math.floor(f * n) % n], lado = W / 2 + 28, x = p.x + p.nx * lado, z = p.y + p.ny * lado, h = nivelDoChao(tr, x, z), baixo = p.h + 18 * E - 6.5 * E; // a borda de baixo da placa
    const poste = new THREE.Mesh(geo, metal); poste.scale.y = Math.max(1, baixo - h + 0.5 + 0.3); poste.position.set(x, h - 0.5 + poste.scale.y / 2, z); poste.castShadow = true; tr.drsPlacas.add(poste);
  }
}
