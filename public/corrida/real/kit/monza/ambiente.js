// Monza — a cópia só desta pista de kit/ambiente.js (a base é a de ../melbourne/ambiente.js, que veio de ../redbullring/ambiente.js), com tudo no chão: no kit, os painéis, os mastros e as placas de frenagem ficam soltos no ar,
// porque foram desenhados para um guard-rail de 12 unidades que Monza não tem (o autódromo tem brita e asfalto de escape, e a barreira baixa da regra automática). Diferenças do kit:
// (1) os painéis dos patrocinadores vão a `DENTRO` da borda (logo atrás da brita de escape), de pé no chão que se vê (`nivelDoChao`: a fita de chao.js); (2) as placas de frenagem têm poste até o chão; (3) sem os mastros do kit
// (as bandeiras da Itália e dos tifosi são as da torcida, em ../monza.js, nos degraus das arquibancadas); (4) os postos dos fiscais (que vida.js anima, em tr.postosGP) ficam no chão. `postesDRS` dá poste até o chão às placas de DRS de pista.js.
//
// cfg: { marcas: nomes de marcas.js para os painéis, posto: a marca do posto, placas: as distâncias das placas de frenagem em metros, outdoors: as marcas dos outdoors de vida.js }
import * as THREE from "three";
import { canvasTex, M } from "../../../cena.js";
import { marcaTex, PATROCINIO } from "../marcas.js";
import { ocupado } from "../comum.js";
import { nivelDoChao } from "./chao.js";

export function ambienteMonza(tr, add, { marcas = PATROCINIO.slice(0, 9), posto = "f1", placas = [150, 100, 50], outdoors = PATROCINIO } = {}) {
  const { pts, n, W } = tr, E = tr.escala ?? 1, DENTRO = W / 2 + 40, lotes = new Map(); // DENTRO: logo atrás da brita/asfalto de escape (24 u) e da barreira automática
  const metal = M(0x697780), vermelho = M(0xc42d38), laranja = M(0xf27421), escuro = M(0x18242b), branco = M(0xf0eee6);
  const anuncios = marcas.map((nome) => new THREE.MeshBasicMaterial({ map: marcaTex(nome, 512, 128) })), painelPosto = new THREE.MeshBasicMaterial({ map: marcaTex(posto, 512, 128) });
  const placa = (texto, fundo, cor = "#ffffff") => new THREE.MeshBasicMaterial({ map: canvasTex(512, 128, (x, w, h) => {
    x.fillStyle = fundo; x.fillRect(0, 0, w, h); x.fillStyle = cor; x.fillRect(0, h - 6, w, 6);
    x.font = "900 65px sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(texto, w / 2, h / 2, w - 24);
  }, false) });
  const distancias = placas.map((v) => placa(String(v), "#f5f4ee", "#18242b"));
  tr.postosGP = []; tr.marcasGP = outdoors; // os outdoors de vida.js também levam as marcas
  const stats = tr.ambienteGP = { paineis: 0, postos: 0, placas: 0, bandeiras: 0, luzesTunel: 0, setores: [0, 0, 0, 0] };
  function caixa(mat, x, y, z, sx, sy, sz, ry = 0) {
    if (!lotes.has(mat)) lotes.set(mat, []);
    lotes.get(mat).push({ x, y, z, sx, sy, sz, ry });
  }
  // um poste do chão (y0, 0,5 enterrado) até a altura `topo` acima dele
  const poste = (x, y0, z, topo, larg = 0.8) => caixa(metal, x, y0 - 0.5 + (topo + 0.5) / 2, z, larg, topo + 0.5, larg);
  // a entrada e a saída do corredor dos boxes (regras de F1) ficam livres
  const bx = tr.t.boxes && window.F1Regras ? window.F1Regras.corredor(tr.t, n, W) : null;
  const naRampa = (i, lado) => { if (!bx || lado !== bx.lado) return false; const r = (((i - bx.i0) % n) + n) % n, ra = window.F1Regras.RAMPA + 3; return r <= (tr.t.muro ? bx.len + 3 : ra) || (r >= bx.len - ra && r <= bx.len + 3); };
  function lugar(i, lado, lat, raio = 12) {
    if (naRampa(i, lado)) return null;
    const p = pts[(i + n) % n], x = p.x + p.nx * lado * lat, z = p.y + p.ny * lado * lat;
    if (tr.noCorredor?.(x, z)) return null;
    const minimo = Math.max(lat - 3, W / 2 + raio);
    if (tr.distAt(x, z) < minimo || tr.distAt(x + p.tx * 16, z + p.ty * 16) < minimo || tr.distAt(x - p.tx * 16, z - p.ty * 16) < minimo) return null;
    return { p, x, z, h: nivelDoChao(tr, x, z), ry: Math.atan2(-p.nx * lado, -p.ny * lado) };
  }
  // os painéis dos patrocinadores, a `DENTRO` da borda (atrás da brita), de pé no chão, dos dois lados
  for (let i = 0; i < n; i += 9) for (const lado of [-1, 1]) {
    if (i % 27) continue;
    const o = lugar(i, lado, DENTRO, 10); if (!o || ocupado(tr, o.x, o.z, i)) continue;
    caixa(anuncios[(i / 27) % anuncios.length], o.x, o.h + 0.2 + (9 * E) / 2, o.z, 30 * E, 9 * E, 0.6, o.ry);
    stats.paineis++; stats.setores[Math.floor(i / n * 4)]++;
  }
  // as placas de 150, 100 e 50 m antes das curvas, do lado de fora, cada uma num poste até o chão
  let ultima = -n;
  for (let i = 0; i < n; i += 3) {
    if (pts[i].k < 1 / 350 || i - ultima < n / 12) continue;
    ultima = i;
    const p = pts[i], q = pts[(i + 3) % n], lado = p.tx * q.ty - p.ty * q.tx > 0 ? -1 : 1;
    placas.forEach((distancia, j) => {
      const idx = (i - Math.round(distancia * 10 / 6) + n) % n, o = lugar(idx, lado, DENTRO + 6, 5);
      if (!o || ocupado(tr, o.x, o.z, idx)) return;
      const baixo = 17.5 * E; // a borda de baixo da placa (a placa é 9 × a escala de altura, com o centro a 22 × a escala)
      caixa(distancias[j], o.x, o.h + 22 * E, o.z, 13 * E, 9 * E, 0.8, Math.atan2(-o.p.tx, -o.p.ty)); stats.placas++;
      poste(o.x, o.h, o.z, baixo + 0.3, 0.7);
    });
  }
  // postos de fiscal compactos, onde há espaço livre
  for (let i = 20; i < n; i += 55) for (const lado of [-1, 1]) {
    const o = lugar(i, lado, DENTRO + 24, 17); if (!o || ocupado(tr, o.x, o.z, i)) continue;
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
