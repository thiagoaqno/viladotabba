// Suzuka — o chão junto da pista (peça só desta pista; cópia de ../silverstone/chao.js, que veio de ../abudhabi/chao.js, de ../catar/ e de ../hungaroring/, com a grama seca de ../mexico/chao.js). O chão de `pista.js` (a malha do terreno) afunda
// 9 unidades por baixo do asfalto e 1,5 fora dele, e a malha é grossa (uma célula de 26 unidades): sem nada por cima, a pista parece uma folha apoiada num buraco, com um vão de quase 2 m
// entre o asfalto e a grama, e tudo que `pista.js` põe na altura "analítica" do chão (a barreira do escape, os painéis, as arquibancadas) fica flutuando sobre a malha. `beiradaSolida` põe, de cada lado:
// 1. a beirada: uma fita de grama (a paleta de `look.ground`) que começa na borda do asfalto, 0,7 u abaixo dele, e segue a MESMA altura analítica que as peças usam (`p.h × falloff`), até se enfiar por baixo
//    da malha do terreno, sem degrau nem vão; onde a pista faz uma curva fechada, a fita estreita pelo lado de dentro (o raio da curva) em vez de dobrar sobre si mesma. Suzuka tem `muros` (a barreira
//    mapeada no OpenStreetMap, a até 220 u da borda, mais longe que o `flat` de 78): o trecho plano da fita vai até a barreira de cada ponto (+3 u) e só então desce (como em Silverstone); a brita de escape (`escape.brita`)
//    fica 0,2 u acima do chão: ali a fita fica abaixo dela até 40 u;
// 2. o corte da pista: uma parede de concreto escuro que desce da borda do asfalto até 6 u abaixo, para a pista ter espessura e uma base sólida, e não parecer uma folha.
// O cruzamento em oito (`tr.viadutoSuzuka`, de viaduto.js: `{ baixo, cima, extensao }`) é a diferença para Silverstone: a pista de cima passa 41 u (8,6 m) acima da de baixo, e uma fita de grama na altura da pista de cima taparia a de baixo.
// Por isso, sob o viaduto (a pista de cima, `extensao` + 8 estações para cada lado) não há fita nem corte (a laje do viaduto é o chão), e junto da pista de baixo (±`muroBaixo` estações) a fita só vai até o muro de arrimo, a 8 u da borda;
// nas duas pontas ela estreita aos poucos, para não sobrar uma quina.
// Também `solo(tr, x, z)`, a altura do chão que se VÊ longe da pista, para as peças do cenário (casas, barracas, árvores) pousarem nele, e `terraco`, a laje que nivela uma peça grande num chão que cai.
// Tudo dentro de `cenario` do GP (gps/suzuka.js): `pista.js` e o kit compartilhado não mudam.
import * as THREE from "three";
import { canvasTex } from "../../../cena.js";
import { sinalDaCurva } from "../comum.js";

// a altura do chão (o mesmo `falloff` de pista.js): igual à da pista até `flat` da borda, depois desce até zero em `fall`
const falloff = (t, W, l) => { const off = Math.abs(l) - W / 2 - t.flat; return off <= 0 ? 1 : Math.max(0, 1 - off / t.fall); };

// o ladrilho de grama seca: manchas suaves das três cores do GP e milhares de folhinhas (a receita do chão de pista.js, num ladrilho menor)
function grama(tr) {
  const [c0, c1, c2] = tr.look.ground;
  return canvasTex(256, 256, (x, w, hh, rr) => {
    x.fillStyle = c0; x.fillRect(0, 0, w, hh);
    for (let i = 0; i < 24; i++) {
      const cx = rr() * w, cy = rr() * hh, raio = 16 + rr() * 50, cor = rr() < 0.5 ? c1 : c2;
      for (const dx of [-w, 0, w]) for (const dy of [-hh, 0, hh]) { const g = x.createRadialGradient(cx + dx, cy + dy, 0, cx + dx, cy + dy, raio); g.addColorStop(0, cor); g.addColorStop(1, "transparent"); x.globalAlpha = 0.35; x.fillStyle = g; x.fillRect(cx + dx - raio, cy + dy - raio, raio * 2, raio * 2); }
    }
    x.globalAlpha = 1; x.lineCap = "round";
    for (let i = 0; i < 5500; i++) {
      const px = rr() * w, py = rr() * hh, len = 2 + rr() * 5, ang = -Math.PI / 2 + (rr() - 0.5) * 1.2, k = rr();
      x.strokeStyle = k < 0.33 ? c1 : k < 0.66 ? c2 : k < 0.83 ? "rgba(255,255,230,0.22)" : "rgba(40,30,0,0.22)"; x.lineWidth = 1 + (rr() < 0.25);
      x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(ang) * len, py + Math.sin(ang) * len); x.stroke();
    }
  });
}
// o concreto do corte: cinza escuro com juntas e manchas
const concreto = () => canvasTex(128, 64, (x, w, hh, rr) => {
  x.fillStyle = "#4a4b4e"; x.fillRect(0, 0, w, hh);
  for (let i = 0; i < 700; i++) { x.fillStyle = rr() < 0.5 ? "#00000026" : "#ffffff14"; x.fillRect(rr() * w, rr() * hh, 2 + rr() * 3, 1 + rr() * 2); }
  x.fillStyle = "#00000040"; x.fillRect(0, 0, 2, hh); x.fillRect(0, hh - 3, w, 3);
});

/**
 * @param {object} tr a pista · @param {Function} add põe na cena
 * @param {object} o { cauda=84 (quanto a fita ainda segue depois do trecho plano até se enfiar na malha; com o `flat` de 78 de Suzuka são os 200 u dos outros GPs), muroBaixo=34 (estações de cada lado do cruzamento, na pista de baixo, onde há muro de arrimo), paredeBaixo=8 (a face do muro de arrimo, em u da borda do asfalto: o mesmo de viaduto.js), fundoCorte=6, brita (os trechos de brita de `escape.brita`, de gps/silverstone.js: onde há brita a fita fica abaixo dela) }
 */
export function beiradaSolida(tr, add, { cauda = 122, fundoCorte = 6, brita = [], listrado = [], muroBaixo = 34, paredeBaixo = 8 } = {}) {
  const { pts, n, W, t } = tr;
  const gramaTex = grama(tr), ladrilho = 70; // o ladrilho de grama cobre 70 u
  // as linhas da fita, a partir da borda do asfalto: 5 fixas (as 4 perto da pista e o `flat`) e 4 que dependem de `fim` (onde a fita deixa de ser plana: o `flat` da pista ou, junto da barreira, a distância dela + 3 u),
  // para a fita ser exata onde a altura muda de inclinação. A barreira de cada ponto e lado vem de `tr.murosEscape` (a mesma de pista.js); `fim` decai 8 u por estação para os lados (a fita não dá salto)
  const fim = { "-1": new Float32Array(n).fill(t.flat), "1": new Float32Array(n).fill(t.flat) };
  for (const s of [-1, 1]) { const mapa = tr.murosEscape?.[s]; if (!mapa) continue; for (let i = 0; i < n; i++) { if (!(mapa[i] > 0)) continue; for (let k = -40; k <= 40; k++) { const j = (i + k + n) % n, v = mapa[i] + 3 - Math.abs(k) * 8; if (v > fim[s][j]) fim[s][j] = v; } } }
  // até onde a fita pode ir: só até o ponto em que outro trecho da pista (uma perna do grampo, a reta do lado) passa a ser mais perto que este (`tr.distAt`; margem de 4 u, o mínimo das 5 estações vizinhas).
  // Sem isso, a fita de um trecho cobria a malha e as barreiras do outro, que está noutra altura (o mesmo cuidado de Abu Dhabi): a barreira ficava até 10 u enterrada. Na ponta a fita desce até a malha (-1,5), sem degrau.
  const livre = { "-1": new Float32Array(n), "1": new Float32Array(n) };
  for (const s of [-1, 1]) {
    const cru = new Float32Array(n);
    for (let i = 0; i < n; i++) { const p = pts[i], alvo = fim[s][i] + cauda; let d = alvo; for (let dd = 20; dd <= alvo; dd += 10) { const l = s * (W / 2 + dd); if (tr.distAt(p.x + p.nx * l, p.y + p.ny * l) < W / 2 + dd - 4) { d = dd - 10; break; } } cru[i] = Math.max(14, d, (tr.murosEscape?.[s]?.[i] || 0) + 12); } // (a barreira de cada ponto, que pista.js desenha onde o mapa manda, sempre fica dentro da fita)
    for (let i = 0; i < n; i++) { let m = Infinity; for (let k = -2; k <= 2; k++) m = Math.min(m, cru[(i + k + n) % n]); livre[s][i] = m; }
  }
  // o cruzamento em oito: `tampa` é a largura máxima da fita em cada estação (Infinity = a de sempre; 0 = sem fita: sob o tabuleiro da pista de cima) e `semCorte`, as estações da pista de cima sem o corte de concreto
  const vd = tr.viadutoSuzuka, tampa = new Float32Array(n).fill(Infinity), semCorte = new Uint8Array(n);
  if (vd) {
    const ate = (c, k) => ((i) => { const q = Math.abs(i - c); return Math.min(q, n - q) <= k; }), dist = (c, i) => { const q = Math.abs(i - c); return Math.min(q, n - q); };
    for (let i = 0; i < n; i++) {
      const dc = dist(vd.cima, i), db = dist(vd.baixo, i), cima = vd.extensao + 8, baixo = muroBaixo + 8;
      if (dc <= cima) tampa[i] = Math.min(tampa[i], Math.max(0, (dc - vd.extensao) / 8) * 140); // 0 sob o tabuleiro, sobe até 140 u de largura nas 8 estações depois dele
      if (db <= baixo) tampa[i] = Math.min(tampa[i], paredeBaixo + Math.max(0, (db - muroBaixo) / 8) * 140); // até o muro de arrimo, e abre nas 8 estações depois dele
      if (dc <= vd.extensao) semCorte[i] = 1;
    }
    void ate;
  }
  const fixas = [0, 14, 32, 48, t.flat], // (o `flat` fica sempre: ali a altura do chão muda de inclinação, e sem uma linha a fita ficaria até 1 u abaixo dele quando `fim` vai longe)
     linhas = (f) => [...fixas, f, f + cauda * 0.36, f + cauda * 0.72, f + cauda];
  const R = fixas.length + 4;
  // a altura da fita sobre o chão analítico (negativa = abaixo), pelo lado e pela estação `i`: -0,3 na borda do asfalto (0,7 abaixo do topo dele), -0,1 junto das zebras; depois sobe a +0,7 (as peças que
  // `pista.js` põe no chão analítico, como os postes e as placas, têm a base 1 u acima dele: assim ficam a 0,3 u da grama, não a 1,3) e, passado o `flat`, desce até se enfiar por baixo da malha do terreno.
  // Onde há brita de escape (`marca`: os trechos de `escape.brita` e de `escape.listrado`, o asfalto pintado, de 7 a 37 u da borda, a 0,2 a 0,4 acima do chão) a fita fica abaixo dela até 40 u e só sobe depois, para não esconder a brita.
  const marca = window.Pistas.mapaSuperficies(pts, { brita, listrado }), brit = { "-1": new Float32Array(n), "1": new Float32Array(n) }; // (o mesmo mapa que kit/escape.js usa para desenhar a brita)
  for (const s of [-1, 1]) for (let i = 0; i < n; i++) if (marca[s][i] > 0) for (let j = i - 2; j <= i + 2; j++) brit[s][(j + n) % n] = 1;
  const suave = { "-1": new Float32Array(n), "1": new Float32Array(n) };
  for (const s of [-1, 1]) for (let i = 0; i < n; i++) { let a = 0; for (let k = -5; k <= 5; k++) a += brit[s][(i + k + n) % n]; suave[s][i] = a / 11; }
  const subida = (d, w, f) => {
    const livre = d <= 14 ? -0.3 + (d / 14) * 0.2 : d <= 26 ? -0.1 + ((d - 14) / 12) * 0.8 : d <= f ? 0.7 : 0.7 - ((d - f) / cauda) * 2.2; // sem brita
    const brita = d <= 14 ? -0.3 + (d / 14) * 0.2 : d <= 40 ? -0.1 : d <= 52 ? -0.1 + ((d - 40) / 12) * 0.8 : d <= f ? 0.7 : livre; // com brita
    return livre + (brita - livre) * w;
  };
  const dentro = (i) => sinalDaCurva(pts, n, i); // o lado de dentro da curva
  let tris = 0;
  const PEDACO = 292; // estações por pedaço (1,75 km de volta): cada um tem a sua esfera de corte, e o que está fora da tela não é desenhado
  for (const lado of [-1, 1]) for (let c0 = 0; c0 < n; c0 += PEDACO) {
    const vs = [], uv = [], idx = [], c1 = Math.min(n, c0 + PEDACO);
    for (let i = c0; i <= c1; i++) {
      const p = pts[i % n], raio = p.k > 1e-5 ? 1 / p.k : Infinity, teto = dentro(i % n) === lado ? Math.max(0, raio * 0.9 - W / 2) : Infinity;
      const f = fim[lado][i % n], base = linhas(f), D0 = Math.min(f + cauda, livre[lado][i % n]), T = tampa[i % n], D = Math.min(D0, T);
      for (let r = 0; r < R; r++) {
        const d = Math.min(base[r], teto, D), l = lado * (W / 2 + d);
        let sb = subida(d, suave[lado][i % n], f);
        if (D0 < f + cauda) { const ini = Math.max(D0 - 30, (tr.murosEscape?.[lado]?.[i % n] || 0) + 4); sb += (-1.5 - sb) * Math.min(1, Math.max(0, (d - ini) / Math.max(1, D0 - ini))); } // a fita acabou antes (outro trecho da pista): nos últimos 30 u (depois da barreira) ela desce até a malha
        if (T < D0 && T > paredeBaixo + 1) sb += (-1.5 - sb) * Math.min(1, Math.max(0, (d - (T - 6)) / 6)); // nas pontas do cruzamento (a fita abre aos poucos), a borda de fora desce até a malha
        vs.push(p.x + p.nx * l, p.h * falloff(t, W, l) + sb, p.y + p.ny * l);
        uv.push((W / 2 + d) / ladrilho * lado, (i * 6) / ladrilho);
      }
      if (i < c1) for (let r = 0; r < R - 1; r++) {
        const a = (i - c0) * R + r, b = a + R;
        if (lado > 0) idx.push(a, a + 1, b, a + 1, b + 1, b); else idx.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(vs, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const m = add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: gramaTex, roughness: 1, side: THREE.DoubleSide }))); m.receiveShadow = true; m.name = `${tr.id}-beirada`; tris += idx.length / 3;
  }
  // o corte da pista: da borda do asfalto (0,4 acima da linha da pista) até `fundoCorte` abaixo, dos dois lados
  const ct = concreto(); ct.wrapS = ct.wrapT = THREE.RepeatWrapping;
  for (const lado of [-1, 1]) {
    const vs = [], uv = [], idx = [];
    for (let i = 0; i <= n; i++) {
      const p = pts[i % n], l = lado * W / 2, fundo = semCorte[i % n] ? 0 : fundoCorte; // (sob o tabuleiro o corte some: a laje do viaduto é o lado da pista)
      vs.push(p.x + p.nx * l, p.h + 0.4, p.y + p.ny * l, p.x + p.nx * l, p.h + 0.4 - fundo, p.y + p.ny * l);
      uv.push((i * 6) / 30, 0, (i * 6) / 30, 1);
      if (i < n) { const a = i * 2; if (lado > 0) idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); else idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(vs, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const m = add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: ct, roughness: 0.95, side: THREE.DoubleSide }))); m.receiveShadow = true; m.name = `${tr.id}-corte`; tris += idx.length / 3;
  }
  tr.beiradaSZ = { triangulos: tris, linhas: R, fimMax: Math.max(...fim[-1], ...fim[1]) };
}

/**
 * A altura do chão que se VÊ longe da pista, em (x, z): a malha do terreno de `pista.js`, que fica 1,5 u abaixo da altura analítica `tr.chao`. Vale onde a fita de `beiradaSolida` já acabou (a mais de
 * ~350 u da borda); as peças do cenário que ficam mais perto (arquibancadas, tribunas, prédio dos boxes) são posicionadas pela fita (0,7 u acima de `tr.chao`).
 */
export const solo = (tr, x, z) => tr.chao(x, z) - 1.5;

let _laje = null;
/**
 * A laje que nivela uma peça grande (uma tenda, o hotel, a roda-gigante) num chão que cai: mede `solo` nos cantos e no meio do retângulo (centro x, z; `ry` = rotation.y da peça; `larg` ao longo do x local e `prof` ao longo do z) e
 * põe uma caixa de concreto da altura do ponto mais baixo (menos 1,5 u) até o mais alto (menos 0,3 u). Devolve o y em que a peça deve ficar (o topo da laje) — a peça só pousa sobre ela, nunca fica no ar nem enterrada.
 * Se o chão é quase plano (menos de 0,6 u de diferença) não põe laje: devolve o ponto mais alto menos 0,3 u.
 */
export function terraco(tr, add, x, z, ry, larg, prof, { cor = 0xa9a59b, margem = 2 } = {}) {
  const c = Math.cos(ry), s = Math.sin(ry), pt = (a, b) => [x + a * c + b * s, z - a * s + b * c];
  let lo = Infinity, hi = -Infinity;
  for (const a of [-1, -0.5, 0, 0.5, 1]) for (const b of [-1, -0.5, 0, 0.5, 1]) { const [px, pz] = pt(a * larg / 2, b * prof / 2), h = solo(tr, px, pz); lo = Math.min(lo, h); hi = Math.max(hi, h); }
  const topo = hi - 0.3;
  if (hi - lo > 0.6) {
    const base = lo - 1.5, laje = new THREE.Mesh(new THREE.BoxGeometry(larg + margem * 2, topo - base, prof + margem * 2), (_laje ||= new THREE.MeshStandardMaterial({ color: cor, roughness: 0.95 })));
    laje.position.set(x, (topo + base) / 2, z); laje.rotation.y = ry; laje.receiveShadow = true; laje.name = `${tr.id}-laje`; add(laje);
  }
  return topo;
}
