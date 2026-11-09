// Hungaroring — o chão junto da pista (peça só desta pista). O chão de `pista.js` (a malha do terreno) afunda 9 unidades por baixo do asfalto e 1,5 fora dele, e a malha é
// grossa (uma célula de 26 unidades): sem nada por cima, a pista parece uma folha apoiada num buraco, com um vão de quase 2 m entre o asfalto e a grama, e tudo que
// `pista.js` põe na altura "analítica" do chão (a barreira do escape, os painéis, as arquibancadas) fica flutuando sobre a malha. `beiradaSolida` põe, de cada lado:
// 1. a beirada: uma fita de grama seca (a mesma paleta de `look.ground`) que começa na borda do asfalto, 0,7 u abaixo dele, e segue a MESMA altura analítica que as peças
//    usam (`p.h × falloff`), até 200 u da borda; a fita se afunda aos poucos por baixo da malha do terreno, então não tem degrau nem vão; onde a pista faz uma curva fechada, a
//    fita estreita pelo lado de dentro (o raio da curva) em vez de dobrar sobre si mesma;
// 2. o corte da pista: uma parede de concreto escuro que desce da borda do asfalto até 6 u abaixo, para a pista ter espessura e uma base sólida, e não parecer uma folha.
// Tudo dentro de `cenario` do GP (gps/hungaroring.js): `pista.js` e o kit compartilhado não mudam.
import * as THREE from "three";
import { canvasTex } from "../../cena.js";
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
 * @param {object} o { alcance=200 (da borda da pista), fundoCorte=6, britaCurvas=676 (o raio das curvas com brita: o mesmo de `escape` em gps/hungaroring.js) }
 */
export function beiradaSolida(tr, add, { alcance = 200, fundoCorte = 6, britaCurvas = 676 } = {}) {
  const { pts, n, W, t } = tr;
  const gramaTex = grama(tr), ladrilho = 70; // o ladrilho de grama cobre 70 u
  // as linhas da fita, a partir da borda do asfalto: onde a altura muda de inclinação (o `flat` da pista) tem que haver uma linha, para a fita ser exata
  const base = [0, 14, 32, 48, t.flat, t.flat + 40, t.flat + 100, alcance].filter((d, k, a) => d <= alcance && (k === 0 || d > a[k - 1]));
  // a altura da fita sobre o chão analítico (negativa = abaixo), pelo lado e pela estação `i`: -0,3 na borda do asfalto (0,7 abaixo do topo dele), -0,1 junto das zebras; depois sobe a +0,7 (as peças que
  // `pista.js` põe no chão analítico, como os postes e as placas, têm a base 1 u acima dele: assim ficam a 0,3 u da grama, não a 1,3) e, passado o `flat`, desce até se enfiar por baixo da malha do terreno.
  // Onde há brita de escape (`marca`: do lado de fora das curvas fechadas, de 7 a 33 u da borda, a 0,2 e 0,3 acima do chão) a fita fica abaixo dela até 40 u e só sobe depois, para não esconder a brita.
  const marca = { "-1": new Float32Array(n), "1": new Float32Array(n) };
  for (let i = 0; i < n; i++) { if ((pts[i].k || 0) < 1 / britaCurvas) continue; const s = -sinalDaCurva(pts, n, i); for (let j = i - 10; j <= i + 14; j++) marca[s][(j + n) % n] = 1; }
  const suave = { "-1": new Float32Array(n), "1": new Float32Array(n) };
  for (const s of [-1, 1]) for (let i = 0; i < n; i++) { let a = 0; for (let k = -5; k <= 5; k++) a += marca[s][(i + k + n) % n]; suave[s][i] = a / 11; }
  const subida = (d, w) => {
    const livre = d <= 14 ? -0.3 + (d / 14) * 0.2 : d <= 26 ? -0.1 + ((d - 14) / 12) * 0.8 : d <= t.flat ? 0.7 : 0.7 - ((d - t.flat) / Math.max(1, alcance - t.flat)) * 2.2; // sem brita
    const brita = d <= 14 ? -0.3 + (d / 14) * 0.2 : d <= 40 ? -0.1 : d <= 52 ? -0.1 + ((d - 40) / 12) * 0.8 : d <= t.flat ? 0.7 : livre; // com brita
    return livre + (brita - livre) * w;
  };
  const dentro = (i) => sinalDaCurva(pts, n, i); // o lado de dentro da curva
  let tris = 0;
  const PEDACO = 292; // estações por pedaço (1,75 km de volta): cada um tem a sua esfera de corte, e o que está fora da tela não é desenhado
  for (const lado of [-1, 1]) for (let c0 = 0; c0 < n; c0 += PEDACO) {
    const vs = [], uv = [], idx = [], R = base.length, c1 = Math.min(n, c0 + PEDACO);
    for (let i = c0; i <= c1; i++) {
      const p = pts[i % n], raio = p.k > 1e-5 ? 1 / p.k : Infinity, teto = dentro(i % n) === lado ? Math.max(0, raio * 0.9 - W / 2) : Infinity;
      for (let r = 0; r < R; r++) {
        const d = Math.min(base[r], teto), l = lado * (W / 2 + d);
        vs.push(p.x + p.nx * l, p.h * falloff(t, W, l) + subida(d, suave[lado][i % n]), p.y + p.ny * l);
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
      const p = pts[i % n], l = lado * W / 2;
      vs.push(p.x + p.nx * l, p.h + 0.4, p.y + p.ny * l, p.x + p.nx * l, p.h + 0.4 - fundoCorte, p.y + p.ny * l);
      uv.push((i * 6) / 30, 0, (i * 6) / 30, 1);
      if (i < n) { const a = i * 2; if (lado > 0) idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); else idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(vs, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const m = add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: ct, roughness: 0.95, side: THREE.DoubleSide }))); m.receiveShadow = true; m.name = `${tr.id}-corte`; tris += idx.length / 3;
  }
  tr.beiradaHU = { triangulos: tris, linhas: base.length };
}
