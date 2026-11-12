// Suzuka — a cópia só de Suzuka de kit/silverstone/ambiente.js (que veio de kit/mexico/ambiente.js e do kit/ambiente.js) (o cenário é exclusivo de cada pista), com tudo no chão: no kit, os mastros das bandeiras começam a 12 unidades (2,5 m) acima do chão e os painéis e as placas de
// frenagem ficam soltos no ar, porque foram desenhados para um guard-rail de 12 de altura que Suzuka não tem (escape livre, só a barreira baixa de `tr.murosEscape`, e a cerca alta já vem desligada: `escapeLivre`).
// Diferenças: (1) os painéis dos patrocinadores ficam colados na face da barreira de verdade (`tr.murosEscape`, a mesma da física e do desenho de pista.js), onde ela existe, de pé no chão; (2) o mastro da bandeira sobe do chão e leva a bandeira do Japão (branca com o disco vermelho), pendurada do lado do mastro;
// (3) a placa de frenagem tem poste até o chão, e as distâncias (100, 50...) são em metros de verdade (uma estação da pista tem 6 u = 1,25 m; a cópia de Silverstone usava 10/6 estações por metro e punha a placa de 100 m a 208 m); (4) nada no cruzamento do oito (a ponte, ±60 estações da de cima e ±50 da de baixo): ali a pista tem o viaduto, os muros e os pilares de kit/suzuka/viaduto.js.
// Sem a cerca de detritos, sem a tela e sem as guias do túnel. Os postos dos fiscais (que vida.js anima, em tr.postosGP) são os de sempre.
//
// cfg: { marcas: nomes de marcas.js para os painéis, posto: a marca do posto, bandeira: (não usado: a bandeira é a do Japão), placas: as distâncias das placas de frenagem em metros, outdoors: as marcas dos outdoors de vida.js }
import * as THREE from "three";
import { canvasTex, M } from "../../../cena.js";
import { marcaTex, PATROCINIO } from "../marcas.js";
import { ocupado } from "../comum.js";

let _jp = null;
/** A bandeira do Japão (3:2): o fundo branco e o disco vermelho no meio (o diâmetro do disco é 3/5 da altura). */
const bandeiraJP = () => (_jp ||= canvasTex(96, 64, (x, w, h) => {
  x.fillStyle = "#ffffff"; x.fillRect(0, 0, w, h); x.fillStyle = "#bc002d"; x.beginPath(); x.arc(w / 2, h / 2, h * 0.3, 0, Math.PI * 2); x.fill();
  x.strokeStyle = "#00000022"; x.lineWidth = 1; x.strokeRect(0.5, 0.5, w - 1, h - 1);
}, false));

export function ambienteSuzuka(tr, add, { marcas = PATROCINIO.slice(0, 9), posto = "f1", placas = [100, 50], outdoors = PATROCINIO } = {}) {
  const { pts, n, W } = tr, E = tr.escala ?? 1, L = W / 2 + 30, lotes = new Map();
  const metal = M(0x697780), branco = M(0xf0eee6), vermelho = M(0xc42d38), laranja = M(0xf27421), escuro = M(0x18242b), jp = new THREE.MeshStandardMaterial({ map: bandeiraJP(), roughness: 0.8, side: THREE.DoubleSide });
  const placa = (texto, fundo, cor = "#ffffff") => new THREE.MeshBasicMaterial({ map: canvasTex(512, 128, (x, w, h) => {
    x.fillStyle = fundo; x.fillRect(0, 0, w, h); x.fillStyle = cor; x.fillRect(0, h - 6, w, 6);
    x.font = "900 65px sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(texto, w / 2, h / 2, w - 24);
  }, false) });
  const anuncios = marcas.map((nome) => new THREE.MeshBasicMaterial({ map: marcaTex(nome, 512, 128) })), painelPosto = new THREE.MeshBasicMaterial({ map: marcaTex(posto, 512, 128) });
  const distancias = placas.map((v) => placa(String(v), "#f5f4ee", "#18242b"));
  tr.postosGP = []; tr.marcasGP = outdoors; // os outdoors de vida.js também levam as marcas
  const stats = tr.ambienteGP = { paineis: 0, postos: 0, placas: 0, bandeiras: 0, luzesTunel: 0, setores: [0, 0, 0, 0] };
  function caixa(mat, x, y, z, sx, sy, sz, ry = 0) {
    if (!lotes.has(mat)) lotes.set(mat, []);
    lotes.get(mat).push({ x, y, z, sx, sy, sz, ry });
  }
  // um poste do chão (y0, 0,5 enterrado) até a altura `topo` acima dele
  const poste = (x, y0, z, topo, larg = 0.8) => caixa(metal, x, y0 - 0.5 + (topo + 0.5) / 2, z, larg, topo + 0.5, larg);
  // a entrada e a saída do corredor dos boxes (regras de F1) ficam livres de painel e cerca
  const bx = tr.t.boxes && window.F1Regras ? window.F1Regras.corredor(tr.t, n, W) : null;
  const naRampa = (i, lado) => { if (!bx || lado !== bx.lado) return false; const r = (((i - bx.i0) % n) + n) % n, ra = window.F1Regras.RAMPA + 3; return r <= (tr.t.muro ? bx.len + 3 : ra) || (r >= bx.len - ra && r <= bx.len + 3); };
  const vd = tr.viadutoSuzuka, noOito = (i) => { if (!vd) return false; const d = (a) => { const q = Math.abs(i - a); return Math.min(q, n - q); }; return d(vd.cima) < 60 || d(vd.baixo) < 50; }; // o cruzamento em oito: o viaduto, os muros e os pilares ficam sozinhos
  function lugar(i, lado, lat = L + 1, raio = 12) {
    if (naRampa(i, lado) || noOito((i + n) % n)) return null;
    const p = pts[(i + n) % n], x = p.x + p.nx * lado * lat, z = p.y + p.ny * lado * lat;
    if (tr.noCorredor?.(x, z)) return null;
    // distância exata a qualquer ponto do traçado, inclusive o trecho vizinho de um grampo e o outro lado de uma curva fechada
    const minimo = Math.max(lat - 3, W / 2 + raio);
    if (tr.distAt(x, z) < minimo || tr.distAt(x + p.tx * 16, z + p.ty * 16) < minimo || tr.distAt(x - p.tx * 16, z - p.ty * 16) < minimo) return null; // e as pontas das peças de 32
    return { p, x, z, h: tr.chao(x, z), ry: Math.atan2(-p.nx * lado, -p.ny * lado) };
  }
  for (let i = 0; i < n; i += 9) for (const lado of [-1, 1]) {
    if (i % 27 === 0 && tr.murosEscape?.[lado]?.[i] && tr.murosEscape[lado][(i + 1) % n] && tr.murosEscape[lado][(i + n - 1) % n]) { // o painel vai colado na barreira, de pé no chão (a barreira tem 8,5 × a escala e começa 0,5 acima do chão)
      const p = pts[i], lat = W / 2 + tr.murosEscape[lado][i] - 0.8, x = p.x + p.nx * lado * lat, z = p.y + p.ny * lado * lat;
      if (!tr.noCorredor?.(x, z) && !naRampa(i, lado) && !noOito(i) && tr.distAt(x, z) > lat - 3) {
        const h = tr.chao(x, z); // o painel (9 × a escala) enche a face da barreira (8,5 × a escala, a partir de 0,5 acima do chão)
        caixa(anuncios[(i / 27) % anuncios.length], x, h + 0.2 + (9 * E) / 2, z, 30 * E, 9 * E, 0.6, Math.atan2(-p.nx * lado, -p.ny * lado));
        stats.paineis++; stats.setores[Math.floor(i / n * 4)]++;
      }
    }
    if (i % 81 === 0) {
      const o = lugar(i, lado); if (!o) continue;
      const { x, z, h, ry } = o;
      poste(x, h, z, 38, 1); // o mastro sobe do chão (no kit começava a 12 u dele)
      caixa(jp, x + 8 * Math.cos(ry), h + 33.5, z - 8 * Math.sin(ry), 15, 10, 0.5, ry); // a bandeira do Japão (3 × 2 m) pendurada do lado do mastro (a ponta do mastro fica em h + 38)
      stats.bandeiras++;
    }
  }
  // as placas de 100 e 50 m antes das curvas, do lado de fora, cada uma num poste até o chão
  let ultima = -n;
  for (let i = 0; i < n; i += 3) {
    if (pts[i].k < 1 / 350 || i - ultima < n / 12) continue;
    ultima = i;
    const p = pts[i], q = pts[(i + 3) % n], lado = p.tx * q.ty - p.ty * q.tx > 0 ? -1 : 1;
    placas.forEach((distancia, j) => {
      const idx = (i - Math.round(distancia / (6 * 0.2083)) + n) % n, o = lugar(idx, lado, L + 6, 5);
      if (!o) return;
      const baixo = 17.5 * E; // a borda de baixo da placa (a placa é 9 × a escala de altura, com o centro a 22 × a escala)
      caixa(distancias[j], o.x, o.h + 22 * E, o.z, 13 * E, 9 * E, 0.8, Math.atan2(-o.p.tx, -o.p.ty)); stats.placas++;
      poste(o.x, o.h, o.z, baixo + 0.3, 0.7);
    });
  }
  // postos de fiscal compactos, onde há espaço livre
  for (let i = 20; i < n; i += 55) for (const lado of [-1, 1]) {
    const o = lugar(i, lado, L + 30, 17); if (!o || ocupado(tr, o.x, o.z, i)) continue;
    const { x, z, ry } = o, h = tr.chao(x, z);
    caixa(escuro, x, h + 1, z, 23, 2, 20, ry);
    for (const s of [-1, 1]) caixa(metal, x + s * 9 * Math.cos(ry), h + 13, z - s * 9 * Math.sin(ry), 1, 24, 1);
    caixa(vermelho, x, h + 26, z, 26, 2, 23, ry);
    caixa(painelPosto, x, h + 19, z, 21, 6, 1, ry);
    for (const s of [-1, 1]) { // equipamentos dos fiscais (extintor e capacete), sobre a plataforma
      caixa(laranja, x + s * 5, h + 7, z, 3.4, 8, 3, ry);
      caixa(branco, x + s * 5, h + 12, z, 3, 2.5, 3, ry);
    }
    stats.postos++; (tr.reservado ||= []).push([x, z, 22]); tr.postosGP.push({ x, z, h, ry, i }); // vida.js põe o fiscal com a bandeira
  }
  const geo = new THREE.BoxGeometry(1, 1, 1), d = new THREE.Object3D();
  for (const [mat, lista] of lotes) {
    const m = new THREE.InstancedMesh(geo, mat, lista.length);
    lista.forEach((o, i) => { d.position.set(o.x, o.y, o.z); d.rotation.y = o.ry; d.scale.set(o.sx, o.sy, o.sz); d.updateMatrix(); m.setMatrixAt(i, d.matrix); });
    m.name = `${tr.id}-ambiente-gp`; m.receiveShadow = true; add(m);
  }
}
