// Jeddah — o ambiente de GP só desta pista (a base é a de ../monaco/ambiente.js, que veio de ../ambiente.js, com as peças pousadas no chão de ../melbourne/ambiente.js): a cerca de detritos, os mastros das bandeiras, os postos dos fiscais
// (que vida.js anima, em tr.postosGP) e as placas de 150, 100 e 50 m antes das curvas. No kit, tudo isso fica na altura da pista (`p.h`) e foi desenhado para um muro de 12 u (2,5 m): com o muro de hoje (`ALTO`, 6 u = 1,25 m, o
// `guardrail.alto` de gps/jeddah.js) a cerca começava no ar, 6 u acima do muro, e os mastros e as placas ficavam soltos sobre a malha do terreno, 1,5 a 2 u abaixo do chão que se vê. Aqui: (1) a cerca sobe do TOPO do muro (a tela
// vai de 0,4 u abaixo dele a 22 u acima, 4,6 m); (2) os mastros, as placas (com poste até o chão) e os postos pousam em `nivelDoChao` (a fita de chao.js), atrás da cerca; (3) sem painéis soltos: o muro já leva os painéis pintados.
// `postesDRS` dá poste até o chão às placas de DRS de pista.js.
//
// cfg: { posto: a marca do posto, bandeira: [cor de cima, cor de baixo], placas: as distâncias das placas de frenagem em metros, outdoors: as marcas dos outdoors de vida.js, alto: a altura do muro em u (gps/jeddah.js) }
import * as THREE from "three";
import { canvasTex, M } from "../../../cena.js";
import { marcaTex, PATROCINIO } from "../marcas.js";
import { ocupado } from "../comum.js";
import { nivelDoChao } from "./chao.js";

export function ambienteJeddah(tr, add, { posto = "f1", bandeira = [0xc42d38, 0xf0eee6], placas = [100, 50], outdoors = PATROCINIO, alto: ALTO = 6, tela = true } = {}) {
  const { pts, n, W } = tr, E = tr.escala ?? 1, L = tr.wallLat < 1e9 ? tr.wallLat : W / 2 + 30, lotes = new Map(); // E: a escala do cenário do GP (os painéis e as placas encolhem; o mastro, a cerca e o posto já têm o tamanho real)
  const metal = M(0x697780), branco = M(0xf0eee6), vermelho = M(0xc42d38), laranja = M(0xf27421), escuro = M(0x18242b), bandCima = M(bandeira[0]), bandBaixo = M(bandeira[1]), bandMeio = bandeira[2] != null ? M(bandeira[2]) : null;
  const placa = (texto, fundo, cor = "#ffffff") => new THREE.MeshBasicMaterial({ map: canvasTex(512, 128, (x, w, h) => {
    x.fillStyle = fundo; x.fillRect(0, 0, w, h); x.fillStyle = cor; x.fillRect(0, h - 6, w, 6);
    x.font = "900 65px sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(texto, w / 2, h / 2, w - 24);
  }, false) });
  const painelPosto = new THREE.MeshBasicMaterial({ map: marcaTex(posto, 512, 128) });
  const distancias = placas.map(v => placa(String(v), "#f5f4ee", "#18242b"));
  tr.postosGP = []; tr.marcasGP = outdoors; // os outdoors de vida.js também levam as marcas
  const stats = tr.ambienteGP = { paineis: 0, postos: 0, placas: 0, bandeiras: 0, luzesTunel: 0, setores: [0, 0, 0, 0] }; // (paineis, luzesTunel e setores ficam em 0: o muro já leva os painéis e Jeddah não tem túnel);
  function caixa(mat, x, y, z, sx, sy, sz, ry = 0) {
    if (!lotes.has(mat)) lotes.set(mat, []);
    lotes.get(mat).push({ x, y, z, sx, sy, sz, ry });
  }
  // a entrada e a saída do corredor dos boxes (regras de F1) ficam livres de painel e cerca
  const bx = tr.t.boxes && window.F1Regras ? window.F1Regras.corredor(tr.t, n, W) : null;
  const naRampa = (i, lado) => { if (!bx || lado !== bx.lado) return false; const r = (((i - bx.i0) % n) + n) % n, ra = window.F1Regras.RAMPA + 3; return r <= (tr.t.muro ? bx.len + 3 : ra) || (r >= bx.len - ra && r <= bx.len + 3); }; // rua com guard-rail: o corredor inteiro fica livre, o guard-rail dá lugar à mureta
  function lugar(i, lado, lat = L + 1, raio = 12) { // (L: a distância do muro ao eixo, `wallLat` de pista.js)
    if (naRampa(i, lado)) return null;
    const p = pts[(i + n) % n], x = p.x + p.nx * lado * lat, z = p.y + p.ny * lado * lat;
    if (tr.noCorredor?.(x, z)) return null;
    // Distância exata a qualquer ponto do traçado, inclusive o trecho vizinho de um grampo e o outro lado de uma curva fechada
    // (nada pode estar mais perto da pista do que o deslocamento desenhado `lat`; a peça fica a `raio` do asfalto, no mínimo).
    const minimo = Math.max(lat - 3, W / 2 + raio);
    if (tr.distAt(x, z) < minimo || tr.distAt(x + p.tx * 16, z + p.ty * 16) < minimo || tr.distAt(x - p.tx * 16, z - p.ty * 16) < minimo) return null; // e as pontas das peças de 32
    return { p, x, z, h: p.h, solo: nivelDoChao(tr, x, z), ry: Math.atan2(-p.nx * lado, -p.ny * lado) }; // h: a linha da pista (onde o muro começa); solo: o chão que se vê (a fita de chao.js)
  }
  const redes = { 1: [], [-1]: [] }; // os postos da cerca de cada lado: entre dois vizinhos sobe a tela (malha transparente contínua), senão a cerca seria só postes e barras soltos no ar
  for (let i = 0; i < n; i += 9) for (const lado of [-1, 1]) {
    const o = lugar(i, lado); if (!o) continue;
    const { x, z, h } = o, topo = h + 0.5 + ALTO; // o muro de pista.js começa a 0,5 u da linha da pista (`ribbon`) e tem ALTO de altura
    // a cerca de detritos sobe do topo do muro (a tela vai de 0,4 u abaixo dele a 22 u acima: 4,6 m)
    const peca = () => caixa(metal, x, topo + 10.8, z, 0.8, 22.4, 0.8);
    redes[lado].push({ i, x, z, h: topo, peca });
    if (!tela) peca();
    // os mastros das bandeiras, atrás da cerca, de pé no chão que se vê
    if (i % 81 === 0) {
      const m = lugar(i, lado, L + 8, 8); if (!m || ocupado(tr, m.x, m.z, i)) continue;
      const g = m.solo; // (o poste entra 0,5 u no chão)
      caixa(metal, m.x, g - 0.5 + 21, m.z, 1, 42, 1); // o mastro de 8,7 m
      caixa(bandCima, m.x, g + 39.5, m.z, 15, 4.5, 0.5, m.ry); caixa(bandBaixo, m.x, g + 35, m.z, 15, 4.5, 0.5, m.ry); // a bandeira (3,1 × 1,9 m)
      stats.bandeiras++;
    }
  }
  if (tela) for (const lado of [-1, 1]) { const nos = redes[lado]; nos.forEach((o, k) => { if ((k > 0 && o.i - nos[k - 1].i === 9) || (k + 1 < nos.length && nos[k + 1].i - o.i === 9)) o.peca(); }); }
  // a tela da cerca de detritos: uma malha de losangos (alfa) presa nos postos, de uma ponta a outra de cada trecho contínuo; entre dois postos que não são vizinhos ela não existe
  if (tela) { // (`tela: true`: a malha da cerca; sem ela só ficam os postos e as barras)
    const malha = new THREE.MeshStandardMaterial({ map: canvasTex(64, 64, (x, w, h) => { x.strokeStyle = "rgba(210,220,226,0.9)"; x.lineWidth = 2.2; for (let k = -h; k < w + h; k += 16) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k + h, h); x.stroke(); x.beginPath(); x.moveTo(k + h, 0); x.lineTo(k, h); x.stroke(); } }), transparent: true, alphaTest: 0.2, side: THREE.DoubleSide, roughness: 0.6, metalness: 0.3 });
    for (const lado of [-1, 1]) {
      const nos = redes[lado], vs = [], uv = [], idx = []; let d = 0;
      for (let k = 1; k < nos.length; k++) {
        const a = nos[k - 1], b = nos[k]; if (b.i - a.i !== 9) continue;
        const q = vs.length / 3, c = Math.hypot(b.x - a.x, b.z - a.z);
        vs.push(a.x, a.h - 0.4, a.z, a.x, a.h + 22.1, a.z, b.x, b.h - 0.4, b.z, b.x, b.h + 22.1, b.z); uv.push(d / 9, 0, d / 9, 2.5, (d + c) / 9, 0, (d + c) / 9, 2.5); idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); d += c;
      }
      if (!idx.length) continue;
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(vs, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
      const m = add(new THREE.Mesh(g, malha)); m.name = "gp-cerca-tela"; m.castShadow = false;
    }
  }
  // Postos compactos só onde há espaço livre atrás da cerca.
  for (let i = 20; i < n; i += 55) for (const lado of [-1, 1]) {
    const o = lugar(i, lado, L + 30, 17); if (!o || ocupado(tr, o.x, o.z, i)) continue;
    const { x, z, ry } = o, h = o.solo; // (o posto pousa no chão que se vê, atrás da cerca)
    caixa(escuro, x, h + 1, z, 23, 2, 20, ry);
    for (const s of [-1, 1]) caixa(metal, x + s * 9 * Math.cos(ry), h + 13, z - s * 9 * Math.sin(ry), 1, 24, 1);
    caixa(vermelho, x, h + 26, z, 26, 2, 23, ry);
    caixa(painelPosto, x, h + 19, z, 21, 6, 1, ry);
    // Equipamentos e dois fiscais enfileirados no posto, com capacete branco.
    for (const s of [-1, 1]) {
      caixa(laranja, x + s * 5, h + 7, z, 3.4, 8, 3, ry);
      caixa(branco, x + s * 5, h + 12, z, 3, 2.5, 3, ry);
    }
    stats.postos++; (tr.reservado ||= []).push([x, z, 22]); tr.postosGP.push({ x, z, h, ry, i }); // vida.js põe o fiscal com a bandeira
  }
  // Placas de frenagem no lado de fora das curvas, atrás da cerca, cada uma num poste até o chão.
  let ultima = -n;
  for (let i = 0; i < n; i += 3) {
    if (pts[i].k < 1 / 350 || i - ultima < n / 12) continue;
    ultima = i;
    const p = pts[i], q = pts[(i + 3) % n], lado = p.tx * q.ty - p.ty * q.tx > 0 ? -1 : 1;
    placas.forEach((distancia, j) => {
      const idx = (i - Math.round(distancia * 10 / 6) + n) % n, o = lugar(idx, lado, L + 6, 5);
      if (!o || ocupado(tr, o.x, o.z, idx)) return;
      const centro = o.h + 0.5 + ALTO + 6, chao = o.solo, base = centro - 4.5 * E; // a placa fica uns 1,2 m acima do muro, num poste que desce até o chão
      caixa(distancias[j], o.x, centro, o.z, 13 * E, 9 * E, 0.8, Math.atan2(-o.p.tx, -o.p.ty));
      caixa(metal, o.x, (chao + base) / 2, o.z, 0.7, Math.max(1, base - chao), 0.7); stats.placas++;
    });
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
