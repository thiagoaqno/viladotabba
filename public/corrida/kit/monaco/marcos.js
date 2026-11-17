// Mônaco — os marcos de verdade, modelados em código por cima das plantas reais (kit/monaco/dados.js): o Casino de Monte-Carlo com as
// duas torres e as cúpulas de cobre, o Hôtel de Paris com o telhado mansarda de ardósia e a cúpula, o Café de Paris com os toldos
// vermelhos, o Hermitage com a cúpula de vidro, a capela de Sainte Dévote, o Palácio do Príncipe e a catedral no Rochedo, o Museu
// Oceanográfico na falésia, o Fairmont e a Place du Casino. Cada peça nasce na planta do prédio que o OpenStreetMap desenha naquele
// ponto (o tamanho, a direção e a frente voltada para a praça), então fica onde está na cidade. Materiais compartilhados: o fundir.js
// junta tudo numa malha por material.
import * as THREE from "three";
import { M } from "../../cena.js";
import { D } from "./mundo.js";

const COBRE = M(0x5d9d88, { roughness: 0.55, metalness: 0.25 }), ARDOSIA = M(0x4b5563, { roughness: 0.7 }), PEDRA = M(0xeadfc6, { roughness: 0.85 }), CREME = M(0xf0e4c8, { roughness: 0.85 });
const VERMELHO = M(0xb3262f, { roughness: 0.8, side: THREE.DoubleSide }), BRANCO = M(0xf6f1e4, { roughness: 0.8 }), FERRO = M(0x2c3036, { roughness: 0.6, metalness: 0.3 }), TELHA = M(0xb5583c, { roughness: 0.85, flatShading: true });
const OURO = M(0xd9b24a, { roughness: 0.4, metalness: 0.5 }), VIDRO = new THREE.MeshStandardMaterial({ color: 0x9fc4d4, roughness: 0.15, metalness: 0.3, transparent: true, opacity: 0.55 }), PEDRA_CLARA = M(0xdcd2bb, { roughness: 0.9 });

// o retângulo orientado de um prédio (da planta): o centro, a direção do lado maior e as medidas; `alvo` (x, z) diz para onde fica a frente
function quadro(b, alvo) {
  let melhor = 0, ux = 1, uz = 0;
  for (let i = 0; i < b.P.length; i++) { const a = b.P[i], c = b.P[(i + 1) % b.P.length], l = Math.hypot(c[0] - a[0], c[1] - a[1]); if (l > melhor) { melhor = l; ux = (c[0] - a[0]) / l; uz = (c[1] - a[1]) / l; } }
  let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
  for (const [x, z] of b.P) { const u = x * ux + z * uz, v = -x * uz + z * ux; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
  const cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, cx = cu * ux - cv * uz, cz = cu * uz + cv * ux;
  let phi = Math.atan2(-uz, ux), w = u1 - u0, d = v1 - v0;
  // a frente (+z local) é o lado que olha para o alvo
  const vx = -uz, vz = ux; if (alvo && (alvo[0] - cx) * vx + (alvo[1] - cz) * vz < 0) phi += Math.PI;
  return { cx, cz, phi, w, d };
}
const caixa = (g, mat, w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = true; m.name = "monaco-marco"; g.add(m); return m; };
const cilindro = (g, mat, r, h, x, y, z, seg = 14, r2 = r) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r2, r, h, seg), mat); m.position.set(x, y, z); m.castShadow = true; m.name = "monaco-marco"; g.add(m); return m; };
const cone = (g, mat, r, h, x, y, z, seg = 4, giro = Math.PI / 4) => { const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), mat); m.rotation.y = giro; m.position.set(x, y, z); m.castShadow = true; m.name = "monaco-marco"; g.add(m); return m; };
const cupula = (g, mat, r, x, y, z) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 9, 0, Math.PI * 2, 0, Math.PI / 2), mat); m.position.set(x, y, z); m.castShadow = true; m.name = "monaco-marco"; g.add(m); return m; };

// tira do grupo o que cairia dentro da pista larga do jogo (a rua real é mais estreita que a do jogo): nada sólido a menos de meia largura + 12
function podar(tr, g) {
  g.updateMatrixWorld(true); const caixa = new THREE.Box3(), minimo = tr.W / 2 + 12;
  for (const m of [...g.children]) {
    if (!m.isMesh) continue; caixa.setFromObject(m); let perto = false;
    for (const x of [caixa.min.x, caixa.max.x]) for (const z of [caixa.min.z, caixa.max.z]) { if (tr.distAt(x, z) < minimo && caixa.min.y < tr.pts[tr.indiceAt(x, z)].h + 40) perto = true; }
    if (perto) g.remove(m);
  }
}
function noPredio(tr, add, b, alvo) {
  const q = quadro(b, alvo), g = new THREE.Group(); g.position.set(q.cx, b.topo, q.cz); g.rotation.y = q.phi; add(g);
  return { g, w: q.w, d: q.d, solo: b.baixo - b.topo, ...q };
}

// ---- o Casino de Monte-Carlo (Charles Garnier, 1878), refeito pela imagem do Thiago (2026-11-16): a fachada creme de dois andares com a
// varanda de balaústres, as janelas emolduradas, o corpo central com o frontão do relógio e as estátuas de bronze verde, as duas torres
// quadradas com a cúpula de escamas douradas, a lanterna e o coruchéu, a mansarda de cobre com as águas-furtadas, a marquise de ferro e
// vidro da entrada, os postes, o jardim da frente e a escultura espelhada. Antes era o prédio genérico da planta com uma laje de cobre por
// cima; agora o Casino é o corpo inteiro (o prédio da planta não é desenhado: monaco.js `semCorpo`). Medidas em unidades do mundo de
// Mônaco (~4,6 por metro): 300 de fachada (~66 m), cornija a 82 (~18 m), as torres até ~190 (~41 m).
const JANELA_M = M(0x2b333c, { roughness: 0.25, metalness: 0.25 }), VERDETE = M(0x6fa592, { roughness: 0.6, metalness: 0.2 }), CUPULA_M = M(0xd9bf8f, { roughness: 0.45, metalness: 0.25, flatShading: true });
const GRAMA_M = M(0x5f8a3c, { roughness: 1 }), FLORES = M(0xb8423a, { roughness: 0.9, flatShading: true }), ESPELHO = new THREE.MeshStandardMaterial({ color: 0xe8eef5, metalness: 1, roughness: 0.05 });
const LUZ_M = new THREE.MeshStandardMaterial({ color: 0xfff1c8, emissive: 0xffe2a0, emissiveIntensity: 0.6, roughness: 0.4 });
function estatua(g, x, y, z, esc = 1) { cilindro(g, VERDETE, 2.2 * esc, 9 * esc, x, y + 4.5 * esc, z, 8, 1.6 * esc); const c = cupula(g, VERDETE, 1.8 * esc, x, y + 9 * esc, z); c.scale.y = 1.6; caixa(g, VERDETE, 7 * esc, 1.2 * esc, 1.2 * esc, x, y + 7 * esc, z); }
function janela(g, x, y, z, w, h, frontao) {
  caixa(g, PEDRA, w + 4, h + 4, 1, x, y, z); caixa(g, JANELA_M, w, h, 1.2, x, y, z + 0.3); caixa(g, PEDRA, w * 0.12, h, 1.4, x, y, z + 0.5); // a moldura, o vidro escuro e o caixilho do meio
  if (frontao) caixa(g, PEDRA, w + 8, 2.2, 2.4, x, y + h / 2 + 3.5, z + 0.8); // a cornija da janela
}
function casino(tr, add, b, praca, ponto, hAt) {
  // a planta do OpenStreetMap junta o Casino, o átrio e o teatro numa peça só (150 m): a fachada vai no ponto do marco, virada para a praça
  const g = new THREE.Group(), dx = praca[0] - ponto[0], dz = praca[1] - ponto[1]; g.position.set(ponto[0], (hAt ? hAt(ponto[0], ponto[1]) : b.topo) - 1, ponto[1]); /* (no nível da praça: atrás o terreno desce para o mar, e o embasamento vai até lá) */ g.rotation.y = Math.atan2(dx, dz); g.name = "monaco-casino"; add(g); g.translateX(-65); // (medido no editor: a pista passa colada no lado +x; o Casino desliza 65 para o lado livre)
  const w = 300, d = 140, F = d / 2, CORN = 82, TX = w / 2 - 26, TZ = F - 22; // F: a face da frente; TX/TZ: o centro das torres
  // o corpo, o embasamento, a cornija entre os andares e a do topo
  caixa(g, CREME, w, CORN, d, 0, CORN / 2, 0);
  caixa(g, PEDRA_CLARA, w + 4, 8, d + 4, 0, 4, 0);
  { const fundo = Math.max(0, (g.position.y - b.baixo) + 6); if (fundo > 8) caixa(g, PEDRA, w - 4, fundo, d - 4, 0, -fundo / 2, -2); } // o embasamento até o chão mais baixo da planta (o lado do mar)
  caixa(g, PEDRA, w + 6, 3, d + 6, 0, 40, 0);
  caixa(g, PEDRA, w + 10, 5, d + 10, 0, CORN, 0);
  // o corpo central, um pouco à frente, com as pilastras
  caixa(g, CREME, 168, CORN, 6, 0, CORN / 2, F + 3);
  for (const x of [-84, -42, 42, 84]) caixa(g, PEDRA, 6, CORN - 8, 3, x, CORN / 2 + 4, F + 7);
  // as janelas: térreo altas, primeiro andar com cornija; nas alas e no centro
  const colunasAla = [-130, -110, 110, 130], colunasCentro = [-63, -21, 21, 63];
  for (const x of colunasAla) { janela(g, x, 21, F + 0.2, 11, 22, false); janela(g, x, 58, F + 0.2, 10, 18, true); }
  for (const x of colunasCentro) janela(g, x, 58, F + 6.2, 13, 20, true);
  // as portas da entrada (três vãos escuros) e os nichos com as estátuas, ao lado do centro
  for (const x of [-42, 0, 42]) { caixa(g, PEDRA, 26, 34, 1, x, 21, F + 6.2); caixa(g, JANELA_M, 20, 30, 1.4, x, 19, F + 6.6); }
  for (const s of [-1, 1]) { caixa(g, JANELA_M, 12, 22, 1.5, s * 96, 58, F + 0.4); estatua(g, s * 96, 47, F + 2, 1.2); }
  // a varanda do primeiro andar no centro: a laje e os balaústres
  caixa(g, PEDRA, 170, 2, 10, 0, 42, F + 10);
  caixa(g, PEDRA_CLARA, 170, 1.6, 1.4, 0, 49, F + 14.5);
  for (let x = -82; x <= 82; x += 6) cilindro(g, PEDRA_CLARA, 0.9, 6, x, 45.5, F + 14.5, 6, 0.6);
  // a marquise de ferro e vidro sobre a entrada
  caixa(g, VIDRO, 120, 1.6, 26, 0, 36, F + 19); caixa(g, FERRO, 124, 2.4, 2, 0, 35, F + 32);
  for (const x of [-56, -18, 18, 56]) { caixa(g, FERRO, 1.6, 2, 26, x, 35.5, F + 19); cilindro(g, FERRO, 0.9, 30, x, 20, F + 31, 6); }
  // a mansarda de cobre com as águas-furtadas
  const mansarda = caixa(g, COBRE, w - 16, 16, d - 20, 0, CORN + 10, -4); mansarda.scale.set(1, 1, 1);
  caixa(g, COBRE, w - 34, 6, d - 36, 0, CORN + 21, -4);
  for (const x of [-96, -72, 72, 96]) { caixa(g, CREME, 10, 12, 8, x, CORN + 11, F - 12); caixa(g, JANELA_M, 6, 8, 1.2, x, CORN + 10, F - 7.6); cone(g, COBRE, 7.5, 6, x, CORN + 20, F - 12, 4); }
  // o frontão central com o relógio, as estátuas de bronze e a lanterninha atrás
  caixa(g, CREME, 72, 18, 10, 0, CORN + 9, F + 1); caixa(g, PEDRA, 78, 3, 12, 0, CORN + 18.5, F + 1);
  const arco = new THREE.Mesh(new THREE.CylinderGeometry(26, 26, 10, 24, 1, false, -Math.PI / 2, Math.PI), CREME); arco.rotation.x = Math.PI / 2; arco.rotation.z = Math.PI / 2; arco.scale.set(1, 1, 0.45); arco.position.set(0, CORN + 20, F + 1); arco.castShadow = true; arco.name = "monaco-marco"; g.add(arco);
  const relogio = cilindro(g, BRANCO, 9, 1.4, 0, CORN + 12, F + 6.5, 24); relogio.rotation.x = Math.PI / 2; const aro = cilindro(g, OURO, 10.5, 1, 0, CORN + 12, F + 6, 24); aro.rotation.x = Math.PI / 2;
  caixa(g, FERRO, 0.8, 6, 0.6, 0, CORN + 14, F + 7.4); caixa(g, FERRO, 4.5, 0.8, 0.6, 1.8, CORN + 12, F + 7.4); // os ponteiros
  for (const s of [-1, 1]) estatua(g, s * 46, CORN + 2, F + 2, 1.5);
  cilindro(g, CREME, 7, 16, 0, CORN + 34, F - 10, 12); cupula(g, CUPULA_M, 8, 0, CORN + 42, F - 10); cone(g, OURO, 1.4, 12, 0, CORN + 56, F - 10, 6, 0);
  // as duas torres: o corpo quadrado acima da cornija, o tambor, a cúpula de escamas, a lanterna e o coruchéu
  for (const s of [-1, 1]) {
    const x = s * TX;
    caixa(g, CREME, 46, 34, 46, x, CORN + 17, TZ); caixa(g, PEDRA, 52, 4, 52, x, CORN + 34, TZ);
    for (const [ox, oz] of [[-21, 21], [21, 21], [-21, -21], [21, -21]]) caixa(g, PEDRA, 5, 34, 5, x + ox, CORN + 17, TZ + oz); // as quinas
    const olho = cilindro(g, JANELA_M, 6, 1.4, x, CORN + 18, TZ + 23.5, 16); olho.rotation.x = Math.PI / 2; const moldura = cilindro(g, PEDRA, 8, 1, x, CORN + 18, TZ + 23, 16); moldura.rotation.x = Math.PI / 2; // a janela redonda
    cilindro(g, CREME, 19, 10, x, CORN + 41, TZ, 16); caixa(g, PEDRA, 42, 2, 42, x, CORN + 36.5, TZ);
    const c = cupula(g, CUPULA_M, 20, x, CORN + 46, TZ); c.scale.y = 1.45;
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2, n = new THREE.Mesh(new THREE.TorusGeometry(20, 0.7, 4, 12, Math.PI / 2), PEDRA); n.position.set(x, CORN + 46, TZ); n.rotation.set(0, a, Math.PI / 2); n.scale.set(1.45, 1, 1); n.name = "monaco-marco"; g.add(n); } // as nervuras da cúpula
    cilindro(g, CREME, 5, 12, x, CORN + 81, TZ, 10); cupula(g, CUPULA_M, 5.5, x, CORN + 87, TZ); cone(g, OURO, 1.6, 22, x, CORN + 103, TZ, 6, 0); // a lanterna e o coruchéu
  }
  // a frente (postes, jardim, escultura): num grupo à parte, podado como os outros marcos (o que cairia na pista sai)
  const fr = new THREE.Group(); fr.name = "monaco-casino-frente"; g.add(fr); grupos.push(fr);
  // os postes da frente
  for (const x of [-70, -30, 30, 70]) { cilindro(fr, FERRO, 1, 22, x, 11, F + 46, 6); for (const o of [-3, 3]) { const lu = new THREE.Mesh(new THREE.SphereGeometry(2, 8, 6), LUZ_M); lu.position.set(x + o, 23, F + 46); lu.name = "monaco-marco"; fr.add(lu); } caixa(fr, FERRO, 8, 0.8, 0.8, x, 22, F + 46); }
  // o jardim da frente, os canteiros de flores e a escultura espelhada sobre o pedestal
  caixa(fr, GRAMA_M, 220, 1.2, 70, 0, 0.6, F + 95);
  for (const [x, z, l] of [[-70, F + 72, 70], [70, F + 72, 70], [0, F + 120, 120]]) caixa(fr, FLORES, l, 3, 8, x, 2, z);
  caixa(fr, PEDRA_CLARA, 26, 5, 16, 80, 3.5, F + 100); caixa(fr, PEDRA, 16, 3, 10, 80, 7.5, F + 100);
  const espelho = new THREE.Mesh(new THREE.SphereGeometry(13, 10, 8), ESPELHO); espelho.scale.set(1, 0.85, 0.35); espelho.rotation.y = -0.4; espelho.position.set(80, 21, F + 100); espelho.castShadow = true; espelho.name = "monaco-marco"; fr.add(espelho);
  tr.reservado.push([ponto[0], ponto[1], 170]);
}
// ---- o Hôtel de Paris (1864): mansarda de ardósia, cúpula de canto, o toldo vermelho e as bandeiras
function hotelDeParis(tr, add, b, praca) {
  const { g, w, d, solo } = noPredio(tr, add, b, praca);
  caixa(g, ARDOSIA, w * 0.94, 16, d * 0.9, 0, 8, 0); caixa(g, PEDRA, w * 0.98, 3, d * 0.94, 0, 1.5, 0);
  cilindro(g, CREME, 14, 18, w / 2 - 20, 25, d / 2 - 20, 12); cupula(g, COBRE, 15, w / 2 - 20, 34, d / 2 - 20); cilindro(g, OURO, 1, 12, w / 2 - 20, 54, d / 2 - 20, 6);
  caixa(g, VERMELHO, w * 0.34, 1.6, 22, 0, solo + 16, d / 2 + 11); for (const s of [-1, 1]) cilindro(g, FERRO, 0.9, 16, s * w * 0.16, solo + 8, d / 2 + 21, 6);
  for (const s of [-1, 1]) { cilindro(g, FERRO, 0.6, 34, s * w * 0.3, 17, d / 2, 6); caixa(g, VERMELHO, 12, 4, 0.5, s * w * 0.3 + 6, 31, d / 2); caixa(g, BRANCO, 12, 4, 0.5, s * w * 0.3 + 6, 27, d / 2); } // as bandeiras de Mônaco, vermelho e branco
  tr.reservado.push([b.cx, b.cz, Math.max(w, d) * 0.7 + 20]);
}
// ---- o Café de Paris: o terraço coberto de toldos vermelhos e brancos virado para a praça
function cafeDeParis(tr, add, ponto, praca, hAt) {
  // o terraço do Café de Paris, na esquina da praça: toldos vermelhos e brancos sobre as mesas
  const g = new THREE.Group(), y = hAt(ponto[0], ponto[1]); g.position.set(ponto[0], y, ponto[1]); g.rotation.y = Math.atan2(praca[0] - ponto[0], praca[1] - ponto[1]); add(g);
  for (let k = 0; k < 5; k++) caixa(g, k % 2 ? BRANCO : VERMELHO, 22, 1.4, 26, -50 + k * 25, 16, 20);
  for (const s of [-62, 62]) cilindro(g, FERRO, 0.8, 16, s, 8, 32, 6);
  for (let k = 0; k < 8; k++) { cilindro(g, FERRO, 4, 1, -48 + k * 14, 7, 22, 8); cilindro(g, FERRO, 0.5, 7, -48 + k * 14, 3.5, 22, 4); }
}
// ---- o Hermitage (1900): a cúpula de vidro e ferro e o telhado de ardósia
function hermitage(tr, add, b, praca) {
  const { g } = noPredio(tr, add, b, praca);
  // (2026-11-16, o print do Thiago no editor: "uma laje" sobrando para fora do prédio) o telhado de ardósia era uma caixa do retângulo que
  // envolve a planta; a planta do Hermitage é irregular e a caixa passava muito das paredes. Agora é a própria planta (b.P), um pouco recuada
  const cx = b.P.reduce((s2, q) => s2 + q[0], 0) / b.P.length, cz = b.P.reduce((s2, q) => s2 + q[1], 0) / b.P.length;
  const forma = new THREE.Shape(b.P.map(([x, z]) => new THREE.Vector2(cx + (x - cx) * 0.96, -(cz + (z - cz) * 0.96))));
  const telhado = new THREE.Mesh(new THREE.ExtrudeGeometry(forma, { depth: 14, bevelEnabled: false }).rotateX(-Math.PI / 2), ARDOSIA);
  telhado.position.y = b.topo; telhado.castShadow = telhado.receiveShadow = true; telhado.name = "monaco-hermitage-telhado"; add(telhado);
  cilindro(g, FERRO, 22, 10, 0, 16, 0, 20); cupula(g, VIDRO, 22, 0, 20, 0); cilindro(g, OURO, 1.2, 14, 0, 50, 0, 6);
}
// ---- o Fairmont (o antigo Loews): o hotel de terraços em degraus sobre o túnel, com o toldo da entrada
function fairmont(tr, add, b, alvo) {
  const { g, w, d, solo } = noPredio(tr, add, b, alvo);
  for (let k = 0; k < 3; k++) { caixa(g, BRANCO, w * (0.96 - k * 0.07), 6, d * (0.94 - k * 0.08), 0, 3 + k * 6, 0); caixa(g, FERRO, w * (0.96 - k * 0.07) + 1, 1.4, d * (0.94 - k * 0.08) + 1, 0, 6 + k * 6, 0); } // os recuos do topo
  caixa(g, M(0x9bc4d4, { roughness: 0.2, metalness: 0.3 }), w * 0.5, 2, 26, 0, solo + 14, d / 2 + 13); // a marquise da entrada
  tr.reservado.push([b.cx, b.cz, Math.max(w, d) * 0.6 + 20]);
}
// ---- a capela de Sainte Dévote (a padroeira, na planta de OSM): telhado de duas águas de telha, o campanário e a cruz
function capela(tr, add, b, alvo) {
  const { g, w, d, solo } = noPredio(tr, add, b, alvo);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.62, w * 0.62, d * 1.02, 3), TELHA); m.rotation.set(Math.PI / 2, 0, Math.PI / 2); m.scale.set(1, 1, 0.5); m.position.set(0, w * 0.22, 0); m.castShadow = true; m.name = "monaco-marco"; g.add(m);
  caixa(g, CREME, 11, 38, 11, 0, 19, -d / 2 + 6); caixa(g, FERRO, 11.6, 7, 11.6, 0, 40, -d / 2 + 6); cone(g, TELHA, 8.4, 14, 0, 51, -d / 2 + 6, 4);
  caixa(g, FERRO, 0.8, 7, 0.8, 0, 62, -d / 2 + 6); caixa(g, FERRO, 4, 0.8, 0.8, 0, 63, -d / 2 + 6);
  tr.capelaMonaco = { x: b.cx, y: b.cz }; // o som dos sinos
  tr.reservado.push([b.cx, b.cz, Math.max(w, d) * 0.8 + 30]);
}
// ---- o Museu Oceanográfico (1910), no paredão do Rochedo: pedra branca, a fachada com o frontão e a cúpula pequena
function oceanografico(tr, add, b, alvo) {
  const { g, w, d } = noPredio(tr, add, b, alvo);
  caixa(g, PEDRA_CLARA, w * 0.96, 8, d * 0.92, 0, 4, 0); cupula(g, PEDRA, 14, 0, 8, 0);
  for (const s of [-1, 1]) { caixa(g, PEDRA_CLARA, 14, 30, 14, s * (w / 2 - 10), 15, d / 2 - 10); cupula(g, PEDRA, 9, s * (w / 2 - 10), 30, d / 2 - 10); }
  caixa(g, PEDRA, w * 0.5, 14, 4, 0, 7, d / 2 + 1);
}

// ---- o Rochedo de Mônaco-Ville: o Palácio do Príncipe (torres redondas com ameias, o pátio e o estandarte) e a catedral de pedra
function palacio(tr, add, [px, pz], chao) {
  const h = chao(px, pz) - 1.5, g = new THREE.Group(); g.position.set(px, h, pz); add(g);
  const torre = (x, z, r, alt) => { cilindro(g, PEDRA, r, alt, x, alt / 2, z, 14); cilindro(g, CREME, r + 2.2, 4, x, alt + 2, z, 14); for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; caixa(g, PEDRA, 3.4, 6, 3.4, x + Math.cos(a) * (r + 1.6), alt + 7, z + Math.sin(a) * (r + 1.6)); } cone(g, TELHA, r + 1, 12, x, alt + 16, z, 12, 0); };
  torre(-46, -42, 12, 56); torre(48, -40, 11, 50); torre(-40, 50, 10, 44); torre(52, 46, 10, 40);
  caixa(g, CREME, 90, 30, 14, 0, 15, -44); caixa(g, CREME, 14, 30, 90, 50, 15, 4); caixa(g, CREME, 14, 30, 90, -46, 15, 4); caixa(g, PEDRA_CLARA, 100, 1, 100, 0, 0.6, 0); // as alas em volta do pátio
  cilindro(g, FERRO, 0.7, 36, 0, 24, -44, 6); caixa(g, VERMELHO, 14, 5, 0.5, 8, 38, -44); caixa(g, BRANCO, 14, 5, 0.5, 8, 33, -44); // o estandarte dos Grimaldi, vermelho e branco
  tr.reservado.push([px, pz, 150]);
}
function catedral(tr, add, [px, pz], chao, alvo) {
  const h = chao(px, pz) - 1.5, g = new THREE.Group(); g.position.set(px, h, pz); g.rotation.y = Math.atan2(alvo[0] - px, alvo[1] - pz); add(g);
  caixa(g, PEDRA, 40, 30, 78, 0, 15, 0); caixa(g, PEDRA_CLARA, 30, 10, 70, 0, 33, 0); // a nave
  for (const s of [-1, 1]) { caixa(g, PEDRA, 12, 54, 12, s * 15, 27, 36); cone(g, PEDRA, 11, 18, s * 15, 63, 36, 4); }
  cupula(g, CREME, 16, 0, 38, -8); tr.reservado.push([px, pz, 90]);
}


const grupos = [];
const ESP = { casino: 1, hotelDeParis: 2, cafeDeParis: 3, opera: 4, fairmont: 5, metropole: 6, hermitage: 7, sainteDevote: 8, catedral: 9, palacio: 10, oceanografico: 11 };
export function marcosMonaco(tr, addBase, lista, hAt) {
  grupos.length = 0; const add = (g) => { if (g.isGroup) grupos.push(g); return addBase(g); };
  const m = D.marcos, praca = m.praca || m.casino, feitos = [], { pts, n } = tr, noTraco = (f) => { const p = pts[Math.floor(f * n) % n]; return [p.x, p.y]; };
  const dono = (nome) => lista.find((q) => q.esp === ESP[nome]);
  let b;
  if ((b = dono("casino")) && m.casino) { casino(tr, add, b, praca, m.casino, hAt); feitos.push("casino"); }
  // o bloco do Café de Paris na planta é o do Hôtel de Paris (os dois dividem a esquina da praça): a mansarda de ardósia e a cúpula vão nele
  if ((b = dono("cafeDeParis") || dono("hotelDeParis"))) { hotelDeParis(tr, add, b, praca); feitos.push("hotelDeParis"); }
  if (m.cafeDeParis) { cafeDeParis(tr, add, m.cafeDeParis, praca, hAt); feitos.push("cafeDeParis"); }
  if ((b = dono("hermitage"))) { hermitage(tr, add, b, m.casino); feitos.push("hermitage"); }
  if ((b = dono("fairmont"))) { fairmont(tr, add, b, noTraco(D.frac.curvas.hairpin)); feitos.push("fairmont"); }
  if ((b = dono("sainteDevote"))) { capela(tr, add, b, noTraco(D.frac.curvas.sainteDevote)); feitos.push("sainteDevote"); }
  if ((b = dono("oceanografico"))) { oceanografico(tr, add, b, m.palacio || noTraco(0.5)); feitos.push("oceanografico"); }
  if (m.palacio) { palacio(tr, add, m.palacio, hAt); feitos.push("palacio"); }
  if (m.catedral) { catedral(tr, add, m.catedral, hAt, m.palacio || m.catedral); feitos.push("catedral"); }
  for (const g of grupos) if (g.name !== "monaco-casino") podar(tr, g); // (o Casino de 2026-11-16 é medido para caber: podar levava o corpo inteiro, que tem as quinas perto da pista)
  tr.marcosMonaco = feitos;
}
