// Abu Dhabi (Yas Marina) — o chão junto da pista (peça só desta pista; adaptada de ../catar/chao.js, que veio de ../hungaroring/chao.js). O chão de `pista.js` (a malha do terreno) afunda
// 9 unidades por baixo do asfalto e 1,5 fora dele, e a malha é grossa (uma célula de 26 unidades): sem nada por cima, a pista parece uma folha apoiada num buraco, com um vão de quase 2 m
// entre o asfalto e o chão, e tudo que `pista.js` põe na altura "analítica" do chão (a barreira do escape, os painéis, as arquibancadas) fica flutuando sobre a malha. `beiradaSolida` põe, de cada lado:
// 1. a beirada: uma fita de areia (a mesma paleta de `look.ground`, areia acinzentada) que começa na borda do asfalto, 0,7 u abaixo dele, e segue a MESMA altura analítica que as peças
//    usam (`p.h × falloff`), até se enfiar por baixo da malha do terreno; onde a pista faz uma curva fechada, a fita estreita pelo lado de dentro (o raio da curva) em vez de dobrar sobre si mesma;
//    DIFERENÇA do Catar: Abu Dhabi tem `muros` (a barreira mapeada no OpenStreetMap, a até 290 u da borda), então o trecho plano da fita (onde a barreira e o que sobe nela se apoiam) vai até a barreira
//    de cada ponto (+3 u) e só então a fita desce: onde não há barreira longe, ela é a mesma do Catar;
// 2. o corte da pista: uma parede de concreto escuro que desce da borda do asfalto até 6 u abaixo, para a pista ter espessura e uma base sólida, e não parecer uma folha.
// Tudo dentro de `cenario` do GP (gps/abudhabi.js): `pista.js` e o kit compartilhado não mudam.
import * as THREE from "three";
import { canvasTex } from "../../../cena.js";
import { sinalDaCurva } from "../comum.js";

// a altura do chão (o mesmo `falloff` de pista.js): igual à da pista até `flat` da borda, depois desce até zero em `fall`
const falloff = (t, W, l) => { const off = Math.abs(l) - W / 2 - t.flat; return off <= 0 ? 1 : Math.max(0, 1 - off / t.fall); };

// o ladrilho de areia: manchas suaves das três cores do GP, grãos soltos e as marcas de vento (riscos longos e fracos, todos no mesmo sentido)
function areia(tr) {
  const [c0, c1, c2] = tr.look.ground;
  return canvasTex(256, 256, (x, w, hh, rr) => {
    x.fillStyle = c0; x.fillRect(0, 0, w, hh);
    for (let i = 0; i < 24; i++) {
      const cx = rr() * w, cy = rr() * hh, raio = 16 + rr() * 50, cor = rr() < 0.5 ? c1 : c2;
      for (const dx of [-w, 0, w]) for (const dy of [-hh, 0, hh]) { const g = x.createRadialGradient(cx + dx, cy + dy, 0, cx + dx, cy + dy, raio); g.addColorStop(0, cor); g.addColorStop(1, "transparent"); x.globalAlpha = 0.35; x.fillStyle = g; x.fillRect(cx + dx - raio, cy + dy - raio, raio * 2, raio * 2); }
    }
    x.globalAlpha = 1;
    for (let i = 0; i < 6500; i++) { // os grãos
      const px = rr() * w, py = rr() * hh, k = rr();
      x.fillStyle = k < 0.3 ? c1 : k < 0.6 ? c2 : k < 0.8 ? "rgba(255,248,225,0.30)" : "rgba(80,55,20,0.22)"; x.fillRect(px, py, 1 + (rr() < 0.3), 1);
    }
    x.lineCap = "round";
    for (let i = 0; i < 60; i++) { // as ondas do vento
      const px = rr() * w, py = rr() * hh, len = 14 + rr() * 30; x.strokeStyle = rr() < 0.5 ? "rgba(255,246,220,0.16)" : "rgba(95,70,30,0.12)"; x.lineWidth = 1.2;
      x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + len / 2, py + (rr() - 0.5) * 3, px + len, py + (rr() - 0.5) * 2); x.stroke();
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
 * @param {object} o { cauda=127 (quanto a fita ainda segue depois do trecho plano até se enfiar na malha; com `flat` 73 são os 200 u do Catar), fundoCorte=6, britaCurvas=768 (o raio das curvas com brita: o mesmo de `escape` em gps/abudhabi.js) }
 */
export function beiradaSolida(tr, add, { cauda = 127, fundoCorte = 6, britaCurvas = 768 } = {}) {
  const { pts, n, W, t } = tr;
  const areiaTex = areia(tr), ladrilho = 70; // o ladrilho de areia cobre 70 u
  // as linhas da fita, a partir da borda do asfalto: 5 fixas (as 4 perto da pista e o `flat`) e 4 que dependem de `fim` (onde a fita deixa de ser plana: o `flat` da pista ou, junto da barreira, a distância dela + 3 u),
  // para a fita ser exata onde a altura muda de inclinação. A barreira de cada ponto e lado vem de `tr.murosEscape` (a mesma de pista.js); `fim` decai 8 u por estação para os lados (a fita não dá salto)
  const fim = { "-1": new Float32Array(n).fill(t.flat), "1": new Float32Array(n).fill(t.flat) };
  for (const s of [-1, 1]) { const mapa = tr.murosEscape?.[s]; if (!mapa) continue; for (let i = 0; i < n; i++) { if (!(mapa[i] > 0)) continue; for (let k = -40; k <= 40; k++) { const j = (i + k + n) % n, v = mapa[i] + 3 - Math.abs(k) * 8; if (v > fim[s][j]) fim[s][j] = v; } } }
  // até onde a fita pode ir: só até o ponto em que outro trecho da pista (uma perna do grampo, a reta do lado) passa a ser mais perto que este (`tr.distAt`; margem de 4 u, o mínimo das 5 estações vizinhas).
  // Sem isso, a fita de um trecho cobria a malha e as barreiras do outro, que está noutra altura (Abu Dhabi sobe e desce 31 u): a barreira ficava até 10 u enterrada. Na ponta a fita desce até a malha (-1,5), sem degrau.
  const livre = { "-1": new Float32Array(n), "1": new Float32Array(n) };
  for (const s of [-1, 1]) {
    const cru = new Float32Array(n);
    for (let i = 0; i < n; i++) { const p = pts[i], alvo = fim[s][i] + cauda; let d = alvo; for (let dd = 20; dd <= alvo; dd += 10) { const l = s * (W / 2 + dd); if (tr.distAt(p.x + p.nx * l, p.y + p.ny * l) < W / 2 + dd - 4) { d = dd - 10; break; } } cru[i] = Math.max(14, d, (tr.murosEscape?.[s]?.[i] || 0) + 12); } // (a barreira de cada ponto, que pista.js desenha onde o mapa manda, sempre fica dentro da fita)
    for (let i = 0; i < n; i++) { let m = Infinity; for (let k = -2; k <= 2; k++) m = Math.min(m, cru[(i + k + n) % n]); livre[s][i] = m; }
  }
  const fixas = [0, 14, 32, 48, t.flat], // (o `flat` fica sempre: ali a altura do chão muda de inclinação, e sem uma linha a fita ficaria até 1 u abaixo dele quando `fim` vai longe)
     linhas = (f) => [...fixas, f, f + 40, f + 100, f + cauda];
  const R = fixas.length + 4;
  // a altura da fita sobre o chão analítico (negativa = abaixo), pelo lado e pela estação `i`: -0,3 na borda do asfalto (0,7 abaixo do topo dele), -0,1 junto das zebras; depois sobe a +0,7 (as peças que
  // `pista.js` põe no chão analítico, como os postes e as placas, têm a base 1 u acima dele: assim ficam a 0,3 u da areia, não a 1,3) e, passado o `flat`, desce até se enfiar por baixo da malha do terreno.
  // Onde há brita de escape (`marca`: do lado de fora das curvas fechadas, de 7 a 33 u da borda, a 0,2 e 0,3 acima do chão) a fita fica abaixo dela até 40 u e só sobe depois, para não esconder a brita.
  const marca = { "-1": new Float32Array(n), "1": new Float32Array(n) };
  for (let i = 0; i < n; i++) { if ((pts[i].k || 0) < 1 / britaCurvas) continue; const s = -sinalDaCurva(pts, n, i); for (let j = i - 10; j <= i + 14; j++) marca[s][(j + n) % n] = 1; }
  const suave = { "-1": new Float32Array(n), "1": new Float32Array(n) };
  for (const s of [-1, 1]) for (let i = 0; i < n; i++) { let a = 0; for (let k = -5; k <= 5; k++) a += marca[s][(i + k + n) % n]; suave[s][i] = a / 11; }
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
      const f = fim[lado][i % n], base = linhas(f), D = Math.min(f + cauda, livre[lado][i % n]);
      for (let r = 0; r < R; r++) {
        const d = Math.min(base[r], teto, D), l = lado * (W / 2 + d);
        let sb = subida(d, suave[lado][i % n], f);
        if (D < f + cauda) { const ini = Math.max(D - 30, (tr.murosEscape?.[lado]?.[i % n] || 0) + 4); sb += (-1.5 - sb) * Math.min(1, Math.max(0, (d - ini) / Math.max(1, D - ini))); } // a fita acabou antes (outro trecho da pista): nos últimos 30 u (depois da barreira) ela desce até a malha
        vs.push(p.x + p.nx * l, p.h * falloff(t, W, l) + sb, p.y + p.ny * l);
        uv.push((W / 2 + d) / ladrilho * lado, (i * 6) / ladrilho);
      }
      if (i < c1) for (let r = 0; r < R - 1; r++) {
        const a = (i - c0) * R + r, b = a + R;
        if (lado > 0) idx.push(a, a + 1, b, a + 1, b + 1, b); else idx.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(vs, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const m = add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: areiaTex, roughness: 1, side: THREE.DoubleSide }))); m.receiveShadow = true; m.name = `${tr.id}-beirada`; tris += idx.length / 3;
  }
  // o corte da pista: da borda do asfalto (0,4 acima da linha da pista) até `fundoCorte` abaixo, dos dois lados
  const ct = concreto(); ct.wrapS = ct.wrapT = THREE.RepeatWrapping;
  for (const lado of [-1, 1]) {
    const vs = [], uv = [], idx = [];
    for (let i = 0; i <= n; i++) {
      const p = pts[i % n], l = lado * W / 2;
      vs.push(p.x + p.nx * l, p.h + 0.4, p.y + p.ny * l, p.x + p.nx * l, p.h + 0.4 - fundoCorte, p.y + p.ny * l);
      uv.push((i * 6) / 30, 0, (i * 6) / 30, 1);
      if (i < n) { const a = i * 2; if (lado > 0) idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); else idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(vs, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const m = add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: ct, roughness: 0.95, side: THREE.DoubleSide }))); m.receiveShadow = true; m.name = `${tr.id}-corte`; tris += idx.length / 3;
  }
  tr.beiradaAD = { triangulos: tris, linhas: R, fimMax: Math.max(...fim[-1], ...fim[1]) };
}
