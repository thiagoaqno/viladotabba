// O cenário feito no editor de pistas (corrida-editor.js, editor/editor.js): public/corrida/cenario/<pista>.json diz que asset (os .glb leves de
// public/corrida/assets/) vai onde, girado e em que escala, e o que mudou nas peças que a pista já tinha. Sem arquivo, nada muda.
// Formato: { pista, itens: [{ asset, x, y, z, rx, ry, rz, s, cor? }], ajustes: [{ chave, x, y, z, rx, ry, rz, sx, sy, sz, oculto? }] }
//   itens: em coordenadas do 3D (y para cima; o x e o z são os x e y do traçado), num grupo por cima do cenário em código;
//   ajustes: uma peça do cenário em código achada pela `chave` (o caminho de índices dos filhos a partir de tr.grp, sempre o mesmo para o
//   mesmo código), com a posição, o giro e a escala dela no grupo dela (ou escondida). Valem ANTES de juntar as malhas (pista.js).
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { patrocinioEm } from "./f1-capacetes.js";
import { montarKit, KITS, filtroDoKit } from "./biblioteca.js";
import { aplicarAcabamento } from "./acabamentos.js";
import { aplicarLuz } from "./luz-item.js";
import { TessellateModifier } from "three/addons/modifiers/TessellateModifier.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder), modelos = new Map();
// os arquivos chegam logo que a página abre (a pista é montada sem esperar a rede: os ajustes precisam estar prontos até lá)
const dadosDe = new Map();
const pronto = fetch("/corrida/cenario/index.json", { cache: "no-cache" }).then((r) => (r.ok ? r.json() : [])).catch(() => [])
  .then((ids) => Promise.all((Array.isArray(ids) ? ids : []).map((id) => fetch(`/corrida/cenario/${id}.json`, { cache: "no-cache" }).then((r) => (r.ok ? r.json() : null)).then((d) => { if (d) dadosDe.set(id, d); }).catch(() => {}))));
export const cenarioPronto = pronto;
// (2026-11-21, o Thiago: "você mudou completamente minha Mônaco, com barreiras onde eu tirei... no replay fica exatamente como eu fiz") os ajustes do
// editor só valem ANTES de juntar as malhas: a pista montada antes de o cenario/<pista>.json chegar (o lobby monta a pista assim que abre:
// jogo.js prepararPista) ficava sem eles, guardada assim para a corrida. O replay abre depois, com o arquivo já aqui.
let carregado = false; pronto.then(() => { carregado = true; }, () => { carregado = true; });
export const cenarioCarregado = () => carregado;

export function modeloDoAsset(nome) {
  if (!modelos.has(nome)) modelos.set(nome, loader.loadAsync(`/corrida/assets/${nome}.glb`).then((g) => g.scene).catch((e) => { console.warn("Cenário: asset não carregou", nome, e); return null; }));
  return modelos.get(nome);
}
// uma cópia do asset para um item (a cor, quando tem, multiplica a do material: cada item ganha o seu)
// (2026-11-16, o Thiago: "uma opção de adicionar placa e escolher o patrocinador e a escala") a placa de patrocínio: o painel 4 × 1 com a marca
// (as mesmas do capacete e do halo, f1-marcas.js) no fundo da cor escolhida, em dois postes. { tipo: "placa", marca, fundo, w (largura), s }
// (2026-11-17, o Thiago: "um pórtico genérico com espaço para patrocínio") o PÓRTICO: dois pilares, a viga por cima da pista com a faixa
// do patrocínio nas duas faces e as luzes da largada embaixo. { tipo: "portico", marca, fundo, w (o vão), alto (a altura livre) }
function montarPortico(it) {
  const w = +it.w || 150, alto = +it.alto || 32, hv = Math.max(10, w * 0.09), c = document.createElement("canvas"); c.width = 2048; c.height = Math.round(2048 * hv / w);
  const x = c.getContext("2d"); x.fillStyle = it.fundo || "#101114"; x.fillRect(0, 0, c.width, c.height); if (it.marca) for (const cx of [c.width * 0.25, c.width * 0.75]) patrocinioEm(x, it.marca, cx, c.height / 2, c.width * 0.42, c.height * 0.8);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const g = new THREE.Group(), estr = new THREE.MeshStandardMaterial({ color: 0xd8dadd, roughness: 0.5, metalness: 0.4 }), faixa = new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 });
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(4, alto + hv, 4), estr); p.position.set(s * (w / 2 + 2), (alto + hv) / 2, 0); p.castShadow = true; g.add(p); }
  const viga = new THREE.Mesh(new THREE.BoxGeometry(w + 8, hv, 3), [estr, estr, estr, estr, faixa, faixa]); viga.position.y = alto + hv / 2; viga.castShadow = true; g.add(viga);
  // (2026-11-18, o Thiago: "o pórtico já vem com semáforo, no lugar errado; deve ser possível escolher com ou sem") só com `semaforo`: a caixa
  // preta pendurada no meio da viga, embaixo dela, com as 5 luzes nas duas faces
  if (it.semaforo) {
    const cx = new THREE.Mesh(new THREE.BoxGeometry(30, 7, 2.4), new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.6 })); cx.position.set(0, alto - 3.6, 0); cx.castShadow = true; g.add(cx);
    const luz = new THREE.MeshStandardMaterial({ color: 0x330000, emissive: 0xff1a1a, emissiveIntensity: 0.4 });
    for (const lado of [-1, 1]) for (let k = 0; k < 5; k++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.4, 14), luz); l.rotation.x = Math.PI / 2; l.position.set((k - 2) * 5.6, alto - 3.6, lado * 1.3); g.add(l); }
  }
  return g;
}
function montarPlaca(it) {
  const w = +it.w || 60, hgt = w / 4, c = document.createElement("canvas"); c.width = 1024; c.height = 256;
  const x = c.getContext("2d"); x.fillStyle = it.fundo || "#101114"; x.fillRect(0, 0, 1024, 256); if (it.marca) patrocinioEm(x, it.marca, 512, 128, 940, 230);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const g = new THREE.Group(), poste = new THREE.MeshStandardMaterial({ color: 0x2c3036, roughness: 0.6, metalness: 0.3 }), alto = +it.alto || 14;
  const painel = new THREE.Mesh(new THREE.BoxGeometry(w, hgt, 1.2), [poste, poste, poste, poste, new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 }), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 })]);
  painel.position.y = alto + hgt / 2; painel.castShadow = true; g.add(painel);
  for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, alto + hgt / 2, 8), poste); p.position.set(sx * w * 0.38, (alto + hgt / 2) / 2, -0.8); p.castShadow = true; g.add(p); }
  return g;
}
// (2026-11-17, o Thiago: "tem que facilitar de eu criar áreas de escape assim") a ÁREA DE ESCAPE: uma faixa que segue a beira da pista do
// ponto i0 ao i1 (pode dar a volta), de um lado, a partir de `de` (por padrão, depois da zebra) com a `largura` pedida, no padrão escolhido
// (o laranja com as marcas carimbadas, o asfalto, o listrado vermelho e branco ou a brita). { tipo: "escape", i0, i1, lado, de, largura, padrao, marca }
const PADROES = {
  laranja: (x, w, h, marca) => { if (marca === "-") { x.fillStyle = "#c8601c"; x.fillRect(0, 0, w, h); return; } x.fillStyle = "#c8601c"; x.fillRect(0, 0, w, h); for (let i = 0; i < 500; i++) { x.fillStyle = Math.random() < 0.5 ? "#00000010" : "#ffffff10"; x.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
    x.save(); x.translate(w / 2, h / 2); x.rotate(-Math.PI / 2); x.strokeStyle = "#ffffff"; x.lineWidth = 6; x.strokeRect(-90, -34, 180, 68); if (marca) { x.restore(); x.save(); x.translate(w / 2, h / 2); x.rotate(-Math.PI / 2); x.translate(-w / 2, -h / 2); patrocinioEm(x, marca, w / 2, h / 2, 150, 54); } else { x.fillStyle = "#fff"; x.font = "900 40px Arial"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("GALERA", 0, 2, 160); } x.restore(); },
  asfalto: (x, w, h) => { x.fillStyle = "#3a3d42"; x.fillRect(0, 0, w, h); for (let i = 0; i < 1500; i++) { x.fillStyle = Math.random() < 0.5 ? "#00000030" : "#ffffff14"; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); } },
  listrado: (x, w, h) => { x.fillStyle = "#f2f2f2"; x.fillRect(0, 0, w, h); x.fillStyle = "#c62828"; for (let k = -w; k < w * 2; k += 64) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k + 32, 0); x.lineTo(k + 32 - h, h); x.lineTo(k - h, h); x.fill(); } },
  zebra: (x, w, h) => { x.fillStyle = "#d62828"; x.fillRect(0, 0, w, h / 2); x.fillStyle = "#f4f4f4"; x.fillRect(0, h / 2, w, h / 2); x.fillStyle = "#00000018"; x.fillRect(0, 0, w * 0.12, h); },
  brita: (x, w, h) => { x.fillStyle = "#b9ab8a"; x.fillRect(0, 0, w, h); for (let i = 0; i < 2500; i++) { x.fillStyle = Math.random() < 0.5 ? "#8f8468" : "#d6cbb0"; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); } },
};
// (2026-11-17, o Thiago: "áreas de escape com espaço para patrocínio") em qualquer padrão a marca vai carimbada no meio de cada repetição,
// numa placa da cor escolhida (ou direto, sem placa)
function carimbo(x, marca, fundo) {
  x.save(); x.translate(128, 128); x.rotate(-Math.PI / 2);
  if (fundo) { x.fillStyle = fundo; x.fillRect(-96, -40, 192, 80); }
  x.translate(-128, -128); patrocinioEm(x, marca, 128, 128, 170, 62); x.restore();
}
export const PADROES_ESCAPE = { laranja: "Laranja com marcas", asfalto: "Asfalto", listrado: "Listrado vermelho e branco", brita: "Brita", zebra: "Zebra" };
const texEscape = new Map();
function montarEscape(it, tr) {
  if (!tr) return null;
  const { pts, n, W } = tr, lado = it.lado < 0 ? -1 : 1, de = +it.de || W / 2 + 7, larg = Math.max(4, +it.largura || 40), padrao = PADROES[it.padrao] ? it.padrao : "laranja";
  const k = padrao + ":" + (it.marca || "") + ":" + (it.fundoMarca || ""); if (!texEscape.has(k)) { const c = document.createElement("canvas"); c.width = 256; c.height = 256; PADROES[padrao](c.getContext("2d"), 256, 256, it.marca); if (padrao !== "laranja" && it.marca && it.marca !== "-") carimbo(c.getContext("2d"), it.marca, it.fundoMarca); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; texEscape.set(k, t); }
  let i0 = Math.round(+it.i0) || 0, i1 = Math.round(+it.i1) || 0; if (i1 < i0) i1 += n; if (i1 - i0 > n) i1 = i0 + n;
  const vs = [], uv = [], idx = [];
  for (let i = i0; i <= i1; i++) {
    const p = pts[((i % n) + n) % n], v = ((i - i0) * 6) / larg; // (6 unidades por ponto do traçado: a textura repete a cada `largura`)
    for (const [l, u] of [[de, 0], [de + larg, 1]]) vs.push(p.x + p.nx * l * lado, p.h + 0.46, p.y + p.ny * l * lado), uv.push(u, v);
    if (i < i1) { const a = (i - i0) * 2; if (lado > 0) idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); else idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(vs, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: it.cor || 0xffffff, map: texEscape.get(k), roughness: 0.9, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
  m.receiveShadow = true; m.userData.item = it; m.name = "escape"; return m;
}
// (2026-11-17, o Thiago: "construir pistas desenhando o eixo, com curva clicando no início, no fim e onde quero a curva; só cenário") o TRECHO:
// uma faixa de asfalto que segue o eixo A → B, curvando para passar pelo ponto M (a curva de Bézier quadrática cujo meio é M), com as linhas
// brancas da beira e, se pedir, as zebras. Não é pista de andar: é só enfeite. Os pontos são relativos à posição do item (o A), para o gizmo mover.
// { tipo: "trecho", pts: [[ax, az], [mx, mz], [bx, bz]] (M = null numa reta), largura, zebra, x, y, z, ry, s }
const texTrecho = new Map();
function texDoTrecho(tipo) {
  if (texTrecho.has(tipo)) return texTrecho.get(tipo);
  const c = document.createElement("canvas"); c.width = 128; c.height = 128; const x = c.getContext("2d");
  if (tipo === "asfalto") { x.fillStyle = "#3b3e44"; x.fillRect(0, 0, 128, 128); for (let i = 0; i < 400; i++) { x.fillStyle = Math.random() < 0.5 ? "#00000022" : "#ffffff10"; x.fillRect(Math.random() * 128, Math.random() * 128, 2, 2); } x.fillStyle = "#f4f4f4"; x.fillRect(3, 0, 5, 128); x.fillRect(120, 0, 5, 128); }
  else { x.fillStyle = "#d62828"; x.fillRect(0, 0, 128, 64); x.fillStyle = "#f4f4f4"; x.fillRect(0, 64, 128, 64); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; texTrecho.set(tipo, t); return t;
}
export function eixoDoTrecho(pts, passo = 4) {
  const [a, m, b] = pts, A = new THREE.Vector2(a[0], a[1]), B = new THREE.Vector2(b[0], b[1]);
  // o controle da Bézier para ela passar por M no meio: C = 2M − (A + B)/2
  const C = m ? new THREE.Vector2(2 * m[0] - (a[0] + b[0]) / 2, 2 * m[1] - (a[1] + b[1]) / 2) : A.clone().add(B).multiplyScalar(0.5);
  const curva = new THREE.QuadraticBezierCurve(A, C, B), n = Math.max(2, Math.ceil(curva.getLength() / passo));
  return curva.getSpacedPoints(n);
}
function faixa(eixo, de, ate, y, tex, vPorU) {
  const vs = [], uv = [], idx = []; let acc = 0;
  for (let i = 0; i < eixo.length; i++) {
    const p = eixo[i], q = eixo[Math.min(i + 1, eixo.length - 1)], o = eixo[Math.max(i - 1, 0)], tx = q.x - o.x, tz = q.y - o.y, l = Math.hypot(tx, tz) || 1, nx = -tz / l, nz = tx / l;
    if (i) acc += p.distanceTo(eixo[i - 1]);
    vs.push(p.x + nx * de, y, p.y + nz * de, p.x + nx * ate, y, p.y + nz * ate); uv.push(0, acc * vPorU, 1, acc * vPorU);
    if (i < eixo.length - 1) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(vs, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })); m.receiveShadow = true; return m;
}
function montarTrecho(it) {
  const pts = Array.isArray(it.pts) && it.pts.length === 3 && it.pts[0] && it.pts[2] ? it.pts : null; if (!pts) return null;
  const W = Math.max(4, +it.largura || 60), eixo = eixoDoTrecho(pts), g = new THREE.Group();
  g.add(faixa(eixo, -W / 2, W / 2, 0.5, texDoTrecho("asfalto"), 1 / W)); if (it.cor) g.children[0].material.color.set(it.cor); // (a cor do item tinge o asfalto)
  if (it.zebra) for (const s of [-1, 1]) g.add(faixa(eixo, s * W / 2, s * (W / 2 + 7), 0.55, texDoTrecho("zebra"), 1 / 14));
  return g;
}
// (2026-11-17, o Thiago: "pneus, cerca e pilares, onde eu defino o espaçamento e ele distribui vários; na cerca, só a linha e a altura") a LINHA
// DE ITENS: o mesmo eixo do trecho (reta ou curva por 3 pontos) com um modelo repetido a cada `espaco` metros, virado ao longo da linha.
// { tipo: "linha", pts, modelo: "pneus" | "cerca" | "pilares" | "kit:<id>", espaco (m), altura (m), mureta (cerca com mureta embaixo) }
const UM = 4.8, matsL = new Map();
const ML = (cor, o = {}) => { const k = cor + JSON.stringify(o); if (!matsL.has(k)) matsL.set(k, new THREE.MeshStandardMaterial({ color: cor, roughness: 0.75, ...o })); return matsL.get(k); };
function pontosCada(pts, passo) {
  const eixo = eixoDoTrecho(pts, 1), out = []; let falta = 0;
  for (let i = 1; i < eixo.length; i++) {
    const a = eixo[i - 1], b = eixo[i], d = a.distanceTo(b), ang = Math.atan2(b.x - a.x, b.y - a.y); let t = falta;
    while (t <= d) { out.push({ x: a.x + ((b.x - a.x) * t) / d, z: a.y + ((b.y - a.y) * t) / d, ang }); t += passo; }
    falta = t - d;
  }
  const u = eixo[eixo.length - 1], v = eixo[eixo.length - 2]; if (!out.length || Math.hypot(out[out.length - 1].x - u.x, out[out.length - 1].z - u.y) > passo * 0.3) out.push({ x: u.x, z: u.y, ang: Math.atan2(u.x - v.x, u.y - v.y) });
  return out;
}
// o módulo de pneus da imagem: a caixa com a lateral vermelha e duas fileiras de pneus por cima, `compr` u de comprimento (ao longo de z)
const geoPneu = new THREE.TorusGeometry(0.3 * UM, 0.13 * UM, 6, 12);
function moduloPneus(compr) {
  const g = new THREE.Group(), w = 1.5 * UM, h = 0.9 * UM, lado = ML(0xd8321e), borr = ML(0x1d1f22, { roughness: 0.95 });
  const cx = new THREE.Mesh(new THREE.BoxGeometry(w, h, compr), [lado, lado, borr, borr, lado, lado]); cx.position.y = h / 2; cx.castShadow = cx.receiveShadow = true; g.add(cx);
  const n = Math.max(1, Math.floor(compr / (0.7 * UM)));
  for (let i = 0; i < n; i++) for (const s of [-1, 1]) { const t = new THREE.Mesh(geoPneu, borr); t.rotation.x = Math.PI / 2; t.position.set(s * 0.36 * UM, h + 0.05 * UM, (i - (n - 1) / 2) * (compr / n)); g.add(t); }
  return g;
}
// (2026-11-17, o Thiago: "escolher o lado da pista e de onde até onde vai") a linha na BEIRA da pista: { beira: { i0, i1, lado, de } } segue o
// traçado do ponto i0 ao i1 (pode dar a volta), do lado escolhido, a `de` unidades do centro, na altura da pista. Os pontos são absolutos (o item fica em 0).
function pontosDaBeira(tr, b, passo) {
  const { pts, n } = tr, lado = b.lado < 0 ? -1 : 1, de = +b.de || tr.W / 2 + 20; let i0 = Math.round(+b.i0) || 0, i1 = Math.round(+b.i1) || 0; if (i1 < i0) i1 += n; if (i1 - i0 > n) i1 = i0 + n;
  const eixo = []; for (let i = i0; i <= i1; i++) { const p = pts[((i % n) + n) % n]; eixo.push({ x: p.x + p.nx * de * lado, z: p.y + p.ny * de * lado, y: p.h }); }
  const out = []; let falta = 0;
  for (let i = 1; i < eixo.length; i++) { const a = eixo[i - 1], c = eixo[i], d = Math.hypot(c.x - a.x, c.z - a.z) || 1e-6, ang = Math.atan2(c.x - a.x, c.z - a.z); let t = falta;
    while (t <= d) { const u = t / d; out.push({ x: a.x + (c.x - a.x) * u, z: a.z + (c.z - a.z) * u, y: a.y + (c.y - a.y) * u, ang }); t += passo; } falta = t - d; }
  const u = eixo[eixo.length - 1], v = eixo[eixo.length - 2]; if (v && out.length && Math.hypot(out[out.length - 1].x - u.x, out[out.length - 1].z - u.z) > passo * 0.3) out.push({ x: u.x, z: u.z, y: u.y, ang: Math.atan2(u.x - v.x, u.z - v.z) }); // (o fim também)
  return out;
}
// (2026-11-18, o Thiago: "colocar na barreira da pista placa de patrocinador, sem os pezinhos") a FAIXA de patrocínio em fileira: painéis colados um
// no outro, `altura` m de altura a `elev` m do chão, com a marca no meio de cada um, no fundo da cor escolhida; um painel sim, outro não pode trocar
// a marca (`marca2`) e o fundo (`fundo2`): a Pirelli de fundo verde e de fundo azul alternando.
// O logo sai certo dos dois lados. { modelo: "faixa", marca, marca2, fundo, altura, elev }
const texFaixaP = new Map();
function texDaFaixa(marca, fundo, prop) {
  const k = marca + "|" + fundo + "|" + prop; if (texFaixaP.has(k)) return texFaixaP.get(k);
  const c = document.createElement("canvas"); c.width = 1024; c.height = Math.max(32, Math.round(1024 / prop)); const x = c.getContext("2d");
  x.fillStyle = fundo || "#101114"; x.fillRect(0, 0, c.width, c.height); if (marca) patrocinioEm(x, marca, c.width / 2, c.height / 2, Math.min(c.width * 0.8, c.height * 3.2), c.height * 0.78);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.wrapS = THREE.RepeatWrapping;
  const t2 = t.clone(); t2.repeat.x = -1; t2.needsUpdate = true; // (o outro lado do painel: espelhado de volta)
  const m = [new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 }), new THREE.MeshStandardMaterial({ map: t2, roughness: 0.6 })]; texFaixaP.set(k, m); return m;
}
function faixaPatrocinio(it, d, alt, i) {
  const alterna = i % 2 && (it.marca2 || it.fundo2), marca = alterna ? it.marca2 || it.marca : it.marca, fundo = alterna ? it.fundo2 || it.fundo : it.fundo, elev = Math.max(0, +it.elev || 0) * UM, prop = Math.max(1, Math.min(16, Math.round((d / alt) * 2) / 2));
  const [a, b] = texDaFaixa(marca, fundo, prop), lado = ML(0x1d1f22); // (2026-11-18: o painel de número ímpar pode trocar a marca e o fundo: fundo2)
  // duas placas finas (uma de cada lado) e o miolo escuro: cada uma com um material só, para o enxugar juntar a fileira inteira
  const g = new THREE.Group(), y = elev + alt / 2;
  for (const [mat, sx] of [[a, 1], [b, -1]]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(d, alt), mat); p.rotation.y = sx * Math.PI / 2; p.position.set(sx * 0.031 * UM, y, 0); p.castShadow = true; p.receiveShadow = true; g.add(p); }
  const miolo = new THREE.Mesh(new THREE.BoxGeometry(0.06 * UM, alt, d), lado); miolo.position.y = y; g.add(miolo); return g;
}
// (2026-11-18, o Thiago: "o guard-rail triplo com tela e arame, mas com a base sendo uma placa") a tela com o poste dobrado e os três fios de arame,
// em cima da faixa de patrocínio: o mesmo alto do guard-rail com tela, a base trocada pela placa
function telaComArame(g, d, y0, ht) {
  const tela = ML(0x8f969c, { metalness: 0.4, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false }), poste = ML(0x2c3036, { roughness: 0.6, metalness: 0.3 }), fio = ML(0xc7ccd1, { metalness: 0.6, roughness: 0.35 });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(d, ht), tela); p.rotation.y = Math.PI / 2; p.position.set(-0.15 * UM, y0 + ht / 2, 0); g.add(p);
  const c = new THREE.Mesh(new THREE.CylinderGeometry(0.07 * UM, 0.07 * UM, ht + 0.6 * UM, 6), poste); c.position.set(-0.15 * UM, y0 + (ht + 0.6 * UM) / 2, -d / 2); g.add(c);
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.9 * UM, 0.06 * UM, 0.06 * UM), poste); b.position.set(0.15 * UM, y0 + ht + 0.3 * UM, -d / 2); b.rotation.z = 0.6; g.add(b);
  for (let k = 0; k < 3; k++) { const a = new THREE.Mesh(new THREE.BoxGeometry(0.02 * UM, 0.02 * UM, d), fio); a.position.set(0.2 * UM + k * 0.12 * UM, y0 + ht + 0.2 * UM + k * 0.2 * UM, 0); g.add(a); }
}
const compKit = new Map(); // o comprimento de uma peça da biblioteca ao longo do x (o que ela ocupa na fileira)
function comprimentoDoKit(id) { if (!compKit.has(id)) { const o = montarKit(id), b = new THREE.Box3().setFromObject(o); compKit.set(id, Math.max(0.5 * 4.8, b.max.x - b.min.x)); } return compKit.get(id); }
function montarLinha(it, tr) {
  const beira = it.beira && tr ? it.beira : null, pts = Array.isArray(it.pts) && it.pts.length === 3 && it.pts[0] && it.pts[2] ? it.pts : null; if (!pts && !beira) return null;
  const modelo = it.modelo || "pneus", esp = Math.max(0.5, +it.espaco || 4) * UM, alt = Math.max(0.3, +it.altura || 3) * UM, g = new THREE.Group(), lista = beira ? pontosDaBeira(tr, beira, esp) : pontosCada(pts, esp);
  if (modelo === "cerca") {
    const tela = new THREE.MeshStandardMaterial({ color: 0x9aa3ab, roughness: 0.5, metalness: 0.4, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false }), poste = ML(0xb8bdc3, { metalness: 0.5, roughness: 0.4 });
    const base = it.mureta ? 1.1 * UM : 0, muro = ML(0xd9dad6, { roughness: 0.9 });
    for (let i = 0; i < lista.length; i++) {
      const p = lista[i], c = new THREE.Mesh(new THREE.CylinderGeometry(0.07 * UM, 0.07 * UM, alt, 6), poste); c.position.set(p.x, (p.y || 0) + base + alt / 2, p.z); c.castShadow = true; g.add(c);
      const topo = new THREE.Mesh(new THREE.CylinderGeometry(0.06 * UM, 0.06 * UM, 0.9 * UM, 6), poste); topo.position.set(p.x, (p.y || 0) + base + alt + 0.3 * UM, p.z); topo.rotation.set(0, 0, 0); topo.rotateOnWorldAxis(new THREE.Vector3(Math.cos(p.ang), 0, -Math.sin(p.ang)), 0.6); g.add(topo);
      const q = lista[i + 1]; if (!q) continue;
      const d = Math.hypot(q.x - p.x, q.z - p.z), a = Math.atan2(q.x - p.x, q.z - p.z), mx = (p.x + q.x) / 2, mz = (p.z + q.z) / 2, my = ((p.y || 0) + (q.y || 0)) / 2;
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(d, alt), tela); pl.position.set(mx, my + base + alt / 2, mz); pl.rotation.y = a - Math.PI / 2; g.add(pl);
      if (base) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.6 * UM, base, d + 0.05 * UM), muro); m.position.set(mx, my + base / 2, mz); m.rotation.y = a; m.castShadow = m.receiveShadow = true; g.add(m); }
    }
    return g;
  }
  // (2026-11-18, o Thiago: "construir paredes definindo a altura e largura, com opção de acompanharem a pista") a PAREDE: um bloco de cada
  // ponto ao próximo, `altura` m de alto e `larg` m de espessura (com o acabamento escolhido no item, acabamentos.js)
  if (modelo === "parede") {
    const larg = Math.max(0.1, +it.larg || 0.5) * UM, mat = ML(it.cor || "#c9c4b8", { roughness: 0.9 });
    for (let i = 0; i + 1 < lista.length; i++) {
      const p = lista[i], q = lista[i + 1], d = Math.hypot(q.x - p.x, q.z - p.z); if (d < 0.05 * UM) continue;
      const m = new THREE.Mesh(new THREE.BoxGeometry(larg, alt, d + larg * 0.6), mat); m.position.set((p.x + q.x) / 2, ((p.y || 0) + (q.y || 0)) / 2 + alt / 2, (p.z + q.z) / 2); m.rotation.y = Math.atan2(q.x - p.x, q.z - p.z); m.castShadow = m.receiveShadow = true; m.name = "parede"; g.add(m);
    }
    return g;
  }
  // (2026-11-17, o Thiago: "um entra dentro do outro") as barreiras (pneus e as peças de Contenção) vão EMENDADAS: cada módulo vai de um ponto ao
  // próximo, no meio deles, virado pela corda e esticado ao comprimento dela. Na curva elas não se cruzam mais nem deixam vão.
  const emenda = modelo === "faixa" || modelo === "faixaTela" || modelo === "pneus" || (modelo.startsWith("kit:") && filtroDoKit(modelo.slice(4)) === "Contenção");
  if (emenda) {
    const kit = modelo.startsWith("kit:") ? modelo.slice(4) : null, L = kit ? comprimentoDoKit(kit) : 0;
    for (let i = 0; i + 1 < lista.length; i++) {
      const p = lista[i], q = lista[i + 1], d = Math.hypot(q.x - p.x, q.z - p.z); if (d < 0.2 * UM) continue;
      let o; if (modelo === "faixa") o = faixaPatrocinio(it, d, alt, i); else if (modelo === "faixaTela") { o = faixaPatrocinio(it, d, alt, i); telaComArame(o, d, Math.max(0, +it.elev || 0) * UM + alt, (+it.alturaTela || 3.2) * UM); } else if (kit) { o = montarKit(kit); if (!o) continue; o.rotation.y = Math.PI / 2; o.scale.x = d / L; } else o = moduloPneus(d - 0.05 * UM);
      const h = new THREE.Group(); h.add(o); h.position.set((p.x + q.x) / 2, ((p.y || 0) + (q.y || 0)) / 2, (p.z + q.z) / 2); h.rotation.y = Math.atan2(q.x - p.x, q.z - p.z); g.add(h);
    }
    return g;
  }
  for (const p of lista) {
    let o;
    if (modelo === "pneus") o = moduloPneus(Math.max(0.5 * UM, esp - 0.1 * UM));
    else if (modelo === "pilares") { o = new THREE.Group(); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.3 * UM, 0.35 * UM, alt, 10), ML(0xc9cbce)); c.position.y = alt / 2; c.castShadow = c.receiveShadow = true; o.add(c); }
    else if (modelo.startsWith("kit:")) { o = montarKit(modelo.slice(4)); if (o) o.rotation.y = Math.PI / 2; } // (as peças da biblioteca têm a frente para +z: de lado, ficam ao longo da linha)
    if (!o) continue; const h = new THREE.Group(); h.add(o); h.position.set(p.x, p.y || 0, p.z); h.rotation.y = p.ang; g.add(h);
  }
  return g;
}
// (2026-11-17, o Thiago: "desenhar uma área no chão e preencher com o que eu quiser, um polígono") a ÁREA: um polígono no chão, coberto
// com um material (grama, asfalto, terra, brita, areia, concreto, água, mato) que acompanha o relevo, e, se pedir, cheio de uma peça da
// biblioteca espalhada a cada `espaco` metros (árvores, arbustos, pedras, cones...). Os pontos são relativos à posição do item.
// { tipo: "area", pts: [[x, z], ...], material, espalhar: "<id do kit>" | "", espaco (m), x, y, z }
export const MATERIAIS_AREA = { cor: "Cor lisa (escolha a cor)", grama: "Grama", mato: "Mato baixo", terra: "Terra", brita: "Brita", areia: "Areia", asfalto: "Asfalto", concreto: "Concreto", agua: "Água", nenhum: "Nenhum (só o que espalhar)" };
const PINTA_AREA = {
  cor: ["#f2f2f2", ["#e6e6e6", "#fafafa", "#ececec"], 900],
  grama: ["#4f8a34", ["#3f7a2a", "#62a043", "#57913a"], 3000], mato: ["#56702f", ["#405a22", "#6d8a3c", "#7a7a3a"], 4000], terra: ["#7a5a3c", ["#634830", "#8d6a48", "#6f5236"], 2500],
  brita: ["#b9ab8a", ["#8f8468", "#d6cbb0", "#a69a7c"], 5000], areia: ["#d8c497", ["#c9b383", "#e6d6ae", "#cdb98c"], 2500], asfalto: ["#3b3e44", ["#00000030", "#ffffff14", "#2f3237"], 2000],
  concreto: ["#b8b9b5", ["#a5a6a2", "#c9cac6", "#9c9d99"], 1500], agua: ["#2f6f8f", ["#3a82a6", "#28607c", "#4a93b5"], 600],
};
const texArea = new Map();
function texDaArea(m) {
  if (!texArea.has(m)) { const [f, cs, n] = PINTA_AREA[m] || PINTA_AREA.grama, c = document.createElement("canvas"); c.width = c.height = 256; const x = c.getContext("2d"); x.fillStyle = f; x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < n; i++) { x.fillStyle = cs[i % cs.length]; x.globalAlpha = 0.6; x.fillRect(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 2, 2 + Math.random() * 2); }
    if (m === "concreto") { x.globalAlpha = 0.5; x.strokeStyle = "#8d8e8a"; x.lineWidth = 2; x.strokeRect(0, 0, 256, 256); }
    x.globalAlpha = 1; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; texArea.set(m, t); }
  return texArea.get(m);
}
// a altura do chão em (x, z): lida da grade das malhas "<pista>-terreno" (bilinear), sem raio; sem malha por perto, devolve null
function alturaDoChao(tr) {
  if (tr._alturaChao !== undefined) return tr._alturaChao;
  const nos = new Map(); let passo = 0, rx = 0, rz = 0;
  tr.grp.traverse((o) => { if (!o.isMesh || !/-terreno$/.test(o.name)) return; const p = o.geometry.attributes.position, ox = o.position.x, oz = o.position.z;
    if (!passo && p.count > 4) { passo = Math.abs(p.getX(1) - p.getX(0)); rx = p.getX(0) + ox; rz = p.getZ(0) + oz; }
    o.userData._nos = { p, ox, oz }; });
  if (!passo) return (tr._alturaChao = null);
  tr.grp.traverse((o) => { const n = o.userData._nos; if (!n) return; for (let k = 0; k < n.p.count; k++) nos.set(Math.round((n.p.getX(k) + n.ox - rx) / passo) + "," + Math.round((n.p.getZ(k) + n.oz - rz) / passo), n.p.getY(k)); delete o.userData._nos; });
  return (tr._alturaChao = (x, z) => {
    const fx = (x - rx) / passo, fz = (z - rz) / passo, i = Math.floor(fx), j = Math.floor(fz), u = fx - i, w = fz - j, c = [nos.get(i + "," + j), nos.get(i + 1 + "," + j), nos.get(i + "," + (j + 1)), nos.get(i + 1 + "," + (j + 1))];
    if (c.every((v) => v !== undefined)) return (c[0] * (1 - u) + c[1] * u) * (1 - w) + (c[2] * (1 - u) + c[3] * u) * w;
    const ok = c.filter((v) => v !== undefined); return ok.length ? ok.reduce((a, b) => a + b, 0) / ok.length : null; });
}
const dentroDoPoligono = (x, z, pts) => { let d = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, zi] = pts[i], [xj, zj] = pts[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) d = !d; } return d; };
function montarArea(it, tr) {
  const pts = Array.isArray(it.pts) ? it.pts.filter((p) => Array.isArray(p) && p.length === 2) : []; if (pts.length < 3) return null;
  const g = new THREE.Group(), ox = +it.x || 0, oy = +it.y || 0, oz = +it.z || 0, chao = tr ? alturaDoChao(tr) : null, yEm = (x, z) => { const h = chao ? chao(x + ox, z + oz) : null; return (h == null ? oy : h) - oy; };
  if (it.material !== "nenhum") {
    // a malha: o polígono dividido em triângulos pequenos (lado de ~10 u), cada vértice na altura do chão
    const forma = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
    let geo = new THREE.ShapeGeometry(forma); geo = new TessellateModifier(10, 8).modify(geo);
    const p = geo.attributes.position, uv = new Float32Array(p.count * 2), lev = it.material === "agua" ? 0.3 : 0.6;
    for (let k = 0; k < p.count; k++) { const x = p.getX(k), z = -p.getY(k); p.setXYZ(k, x, yEm(x, z) + lev, z); uv[k * 2] = (x + ox) / 60; uv[k * 2 + 1] = (z + oz) / 60; }
    geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); geo.computeVertexNormals();
    const agua = it.material === "agua", m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: it.cor || (it.material === "cor" ? "#3fa52c" : 0xffffff), map: texDaArea(it.material || "grama"), roughness: agua ? 0.15 : 0.95, metalness: agua ? 0.2 : 0, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    m.receiveShadow = true; m.name = "area-chao"; g.add(m);
  }
  // o que espalhar: a peça a cada `espaco` m (com um tremor e um giro sorteados, sempre os mesmos para a mesma área)
  // (2026-11-18, o Thiago: "vegetação variada entre 3 espécies num espaço") `mistura` = até mais 2 peças, sorteadas ponto a ponto com a primeira
  const kits = [it.espalhar, ...(Array.isArray(it.mistura) ? it.mistura : [])].filter((k) => k && KITS[k]).slice(0, 3), kit = kits[0];
  if (kit) {
    const esp = Math.max(1, +it.espaco || 8) * 4.8, modelos = kits.map((k) => montarKit(k)); let s = 1234567 + pts.length * 7919 + Math.round(pts[1][0] * 13);
    const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]); let n = 0;
    for (let x = Math.min(...xs); x <= Math.max(...xs); x += esp) for (let z = Math.min(...zs); z <= Math.max(...zs); z += esp) {
      const px = x + (rnd() - 0.5) * esp * 0.8, pz = z + (rnd() - 0.5) * esp * 0.8; if (!dentroDoPoligono(px, pz, pts) || n++ > 1500) continue;
      const o = modelos[Math.min(modelos.length - 1, Math.floor(rnd() * modelos.length))].clone(); o.position.set(px, yEm(px, pz), pz); o.rotation.y = rnd() * Math.PI * 2; o.scale.setScalar((0.85 + rnd() * 0.3) * (+it.escalaEsp || 1)) /* (a escala escolhida antes de pôr) */; g.add(o);
    }
  }
  return g;
}
// (2026-11-17, o Thiago: "deve ser possível colocar marcas no chão") a MARCA NO CHÃO: o logo pintado na grama ou no asfalto, `w` de largura e
// `prop` de altura/largura, com ou sem o fundo da cor escolhida, acompanhando o relevo. { tipo: "marcaChao", marca, fundo ("" sem fundo), w, prop }
// a altura da superfície mais alta da pista em (x, z): um raio de cima para baixo nas malhas da pista (sem os itens do editor nem a água)
const _raioSup = new THREE.Raycaster(), _baixo = new THREE.Vector3(0, -1, 0);
function superficieDe(tr) {
  return (x, z) => { _raioSup.set(new THREE.Vector3(x, 5000, z), _baixo); for (const h of _raioSup.intersectObject(tr.grp, true)) { if (!h.object.visible || h.object.userData.item || /agua|ceu|sky/i.test(h.object.name)) continue; let p = h.object, item = false; while (p) { if (p.userData?.item) { item = true; break; } p = p.parent; } if (!item) return h.point.y; } return alturaDoChao(tr)?.(x, z) ?? null; };
}
function montarMarcaChao(it, tr) {
  const w = Math.max(4, +it.w || 120), prop = Math.min(2, Math.max(0.1, +it.prop || 0.3)), hgt = w * prop, c = document.createElement("canvas"); c.width = 1024; c.height = Math.max(64, Math.round(1024 * prop));
  const x = c.getContext("2d"); if (it.fundo) { x.fillStyle = it.fundo; x.fillRect(0, 0, c.width, c.height); } if (it.marca) patrocinioEm(x, it.marca, c.width / 2, c.height / 2, c.width * 0.92, c.height * 0.85);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const geo = new THREE.PlaneGeometry(w, hgt, Math.max(2, Math.ceil(w / 10)), Math.max(2, Math.ceil(hgt / 10))); geo.rotateX(-Math.PI / 2);
  // (2026-11-18, o Thiago: "as coisas voltam pro chão automaticamente... grampear na pista e não só no solo") `grampo`: "pista" (o padrão
  // novo: gruda na superfície mais alta embaixo, asfalto, zebra ou calçada), "solo" (o relevo, o jeito antigo) ou "livre" (plana na altura y).
  // `alt` = quantos metros acima da superfície.
  const grampo = it.grampo || "solo", alt = (+it.alt || 0) * 4.8;
  const ox = +it.x || 0, oy = +it.y || 0, oz = +it.z || 0, cs = Math.cos(+it.ry || 0), sn = Math.sin(+it.ry || 0), p = geo.attributes.position;
  const chao = !tr || grampo === "livre" ? null : grampo === "pista" ? superficieDe(tr) : alturaDoChao(tr);
  if (grampo === "livre") for (let k = 0; k < p.count; k++) p.setY(k, 0.5 + alt);
  else if (chao) for (let k = 0; k < p.count; k++) { const lx = p.getX(k), lz = p.getZ(k), hh = chao(ox + lx * cs + lz * sn, oz - lx * sn + lz * cs); p.setY(k, (hh == null ? oy : hh) - oy + 0.5 + alt); } else for (let k = 0; k < p.count; k++) p.setY(k, 0.5);
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: t, transparent: !it.fundo, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, depthWrite: !!it.fundo }));
  m.receiveShadow = true; const g = new THREE.Group(); g.add(m); return g;
}
// (2026-11-18, o Thiago: "quando eu edito a pista fica muito pesada") cada item vira POUCAS malhas: os pedaços dele (uma árvore tem ~15, um
// módulo de mureta com tela 9, uma fileira de barreiras centenas) são juntados por material, já no lugar. O item continua um só objeto, clicável
// e movível no editor; no jogo, o fundir.js junta de novo o que puder. Fica de fora: InstancedMesh, malha de vários materiais, linha e sprite.
const _inv = new THREE.Matrix4(), _mm = new THREE.Matrix4();
const chaveMat = (m) => [m.type, m.color?.getHex(), m.map?.uuid, m.emissive?.getHex(), m.emissiveMap?.uuid, m.emissiveIntensity, m.roughness, m.metalness, m.transparent, m.opacity, m.side, m.flatShading, m.depthWrite, m.polygonOffset, m.vertexColors, m.toneMapped, m.userData?.bloom].join("|"); // (o bloom e o tom: um LED não junta com outro material da mesma cor)
export function enxugar(raiz) {
  raiz.updateMatrixWorld(true); _inv.copy(raiz.matrixWorld).invert();
  const baldes = new Map(), tirar = [];
  raiz.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || Array.isArray(o.material) || o.morphTargetInfluences) return;
    const k = chaveMat(o.material); let b = baldes.get(k); if (!b) baldes.set(k, (b = { mat: o.material, geos: [], sombra: o.castShadow }));
    let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    for (const nome of Object.keys(g.attributes)) if (!["position", "normal", "uv"].includes(nome) && !(nome === "color" && o.material.vertexColors)) g.deleteAttribute(nome); // (a cor por vértice fica quando o material usa: sem ela, a rocha dos penhascos saía preta)
    if (!g.attributes.normal) g.computeVertexNormals();
    if (!g.attributes.uv) g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    g.clearGroups(); _mm.multiplyMatrices(_inv, o.matrixWorld); g.applyMatrix4(_mm);
    if (_mm.determinant() < 0) { const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv; for (let i = 0; i < p.count; i += 3) for (const a of [p, n, u]) { for (let c = 0; c < a.itemSize; c++) { const t = a.array[(i + 1) * a.itemSize + c]; a.array[(i + 1) * a.itemSize + c] = a.array[(i + 2) * a.itemSize + c]; a.array[(i + 2) * a.itemSize + c] = t; } } } // (espelhada: desvira os triângulos)
    b.geos.push(g); tirar.push(o);
  });
  if (tirar.length < 2) return raiz;
  const novas = [];
  for (const { mat, geos, sombra } of baldes.values()) { let g; try { g = mergeGeometries(geos, false); } catch { g = null; } for (const x of geos) if (x !== g) x.dispose(); if (!g) return raiz; const m = new THREE.Mesh(g, mat); m.castShadow = sombra; m.receiveShadow = true; m.name = "item-junto"; novas.push(m); }
  for (const o of tirar) o.parent?.remove(o);
  // os grupos que ficaram vazios saem também (as pontas de uma fileira, os ganchos das peças)
  const vazios = []; raiz.traverse((o) => { if (o !== raiz && !o.isMesh && !o.isSprite && !o.isLine && !o.children.length) vazios.push(o); }); for (const o of vazios) o.parent?.remove(o);
  for (const m of novas) raiz.add(m);
  return raiz;
}
export async function montarItem(it, tr = null) {
  const o = await montarItem0(it, tr);
  // (2026-11-18, o Thiago: "devia ter como espelhar assets") `espelho`: "x" ou "z" vira o item como num espelho; vai nos filhos (a escala do
  // item continua positiva: o editor lê a escala dele como um número só)
  if (o && (it.espelho === "x" || it.espelho === "z")) { const e = it.espelho; for (const c of o.children) { c.position[e] *= -1; c.scale[e] *= -1; if (e === "x") { c.rotation.y *= -1; c.rotation.z *= -1; } else { c.rotation.x *= -1; c.rotation.y *= -1; } } }
  if (o && it.acab) aplicarAcabamento(o, it.acab); // (o acabamento escolhido no TabbaTracks: acabamentos.js)
  if (o && it.luz) aplicarLuz(o, it.luz); // (o LED e o brilho escolhidos no TabbaTracks: luz-item.js)
  if (o && (it.tipo === "kit" || it.tipo === "linha" || (it.tipo === "area" && it.espalhar))) enxugar(o); // (as peças de código; o .glb do conversor já vem leve)
  return o;
}
async function montarItem0(it, tr) {
  if (it.tipo === "marcaChao") { const o = montarMarcaChao(it, tr); o.position.set(+it.x || 0, +it.y || 0, +it.z || 0); o.rotation.set(0, +it.ry || 0, 0); o.scale.setScalar(+it.s || 1); o.userData.item = it; o.name = "marca-chao-" + (it.marca || ""); return o; }
  if (it.tipo === "area") { const o = montarArea(it, tr); if (!o) return null; o.position.set(+it.x || 0, +it.y || 0, +it.z || 0); o.rotation.set(+it.rx || 0, +it.ry || 0, +it.rz || 0); o.scale.setScalar(+it.s || 1); o.userData.item = it; o.name = "area-" + (it.material || ""); return o; }
  if (it.tipo === "linha") { const o = montarLinha(it, tr); if (!o) return null; o.position.set(+it.x || 0, +it.y || 0, +it.z || 0); o.rotation.set(+it.rx || 0, +it.ry || 0, +it.rz || 0); o.scale.setScalar(+it.s || 1); o.userData.item = it; o.name = "linha-" + (it.modelo || ""); return o; }
  if (it.tipo === "trecho") { const o = montarTrecho(it); if (!o) return null; o.position.set(+it.x || 0, +it.y || 0, +it.z || 0); o.rotation.set(+it.rx || 0, +it.ry || 0, +it.rz || 0); o.scale.setScalar(+it.s || 1); o.userData.item = it; o.name = "trecho"; return o; }
  if (it.tipo === "escape") return montarEscape(it, tr);
  // (2026-11-16, o Thiago: "deve ser possível agrupar e desagrupar itens") um GRUPO: os itens dentro dele com posição relativa a ele
  if (it.tipo === "grupo") { const g = new THREE.Group(); for (const o of await Promise.all((it.itens || []).map((x) => montarItem(x, tr)))) if (o) g.add(o); g.position.set(+it.x || 0, +it.y || 0, +it.z || 0); g.rotation.set(+it.rx || 0, +it.ry || 0, +it.rz || 0); g.scale.setScalar(+it.s || 1); g.userData.item = it; g.name = "grupo"; return g; }
  // uma peça pronta da biblioteca (biblioteca.js), com a cor do item tingindo os materiais dela
  if (it.tipo === "kit") { const o = montarKit(it.kit, it.angulo); if (!o) return null; o.position.set(+it.x || 0, +it.y || 0, +it.z || 0); o.rotation.set(+it.rx || 0, +it.ry || 0, +it.rz || 0); o.scale.setScalar(+it.s || 1); if (it.cor) o.traverse((m) => { if (m.isMesh) { m.material = m.material.clone(); m.material.color?.multiply(new THREE.Color(it.cor)); } }); o.userData.item = it; return o; }
  if (it.tipo === "portico") { const o = montarPortico(it); o.position.set(+it.x || 0, +it.y || 0, +it.z || 0); o.rotation.set(+it.rx || 0, +it.ry || 0, +it.rz || 0); o.scale.setScalar(+it.s || 1); o.userData.item = it; o.name = `portico-${it.marca || ""}`; return o; }
  if (it.tipo === "placa") { const o = montarPlaca(it); o.position.set(+it.x || 0, +it.y || 0, +it.z || 0); o.rotation.set(+it.rx || 0, +it.ry || 0, +it.rz || 0); o.scale.setScalar(+it.s || 1); o.userData.item = it; o.name = `placa-${it.marca || ""}`; return o; }
  const base = await modeloDoAsset(it.asset); if (!base) return null;
  const o = base.clone(true);
  o.position.set(+it.x || 0, +it.y || 0, +it.z || 0); o.rotation.set(+it.rx || 0, +it.ry || 0, +it.rz || 0); o.scale.setScalar(+it.s || 1);
  o.traverse((m) => { if (!m.isMesh) return; m.castShadow = true; m.receiveShadow = true; if (it.cor) { m.material = m.material.clone(); m.material.color?.multiply(new THREE.Color(it.cor)); } });
  o.userData.item = it; o.name = `cenario-${it.asset}`;
  return o;
}
// ---- as peças que a pista já tinha ----
// (2026-11-17) a chave é o NOME da peça e a ordem dela entre as irmãs de mesmo nome ("monaco-casino#0/monaco-casino-frente#0"): peças novas de
// outro nome (um escape, um trecho de guard-rail a mais) não deslocam mais os ajustes, como a posição pura ("210/182") deslocava. A chave antiga,
// só de números, ainda é lida.
const passoDe = (o) => { const irmas = o.parent.children.filter((c) => c.name === o.name); return `${o.name}#${irmas.indexOf(o)}`; };
export function chaveDe(tr, o) { const k = []; for (let p = o; p && p !== tr.grp; p = p.parent) { if (!p.parent) return null; k.unshift(passoDe(p)); } return k.join("/"); }
export function pecaDaChave(tr, chave) {
  let o = tr.grp;
  for (const passo of String(chave).split("/")) {
    if (!o) return null;
    const h = passo.lastIndexOf("#");
    if (h < 0) o = o.children[+passo]; // (a chave antiga)
    else { const nome = passo.slice(0, h), k = +passo.slice(h + 1); o = o.children.filter((c) => c.name === nome)[k]; }
    if (!o) return null;
  }
  return o;
}
export function aplicarAjuste(o, a) {
  if (!o || !a) return;
  if (!o.userData.original) o.userData.original = { p: o.position.toArray(), r: [o.rotation.x, o.rotation.y, o.rotation.z], s: o.scale.toArray(), v: o.visible };
  if (a.x != null) o.position.set(+a.x, +a.y, +a.z);
  if (a.rx != null) o.rotation.set(+a.rx, +a.ry, +a.rz);
  if (a.sx != null) o.scale.set(+a.sx, +a.sy, +a.sz);
  o.visible = !a.oculto;
  if (a.acab || o.userData.acab) { o.userData.acab = a.acab || null; aplicarAcabamento(o, a.acab || null); }
  if (a.luz || o.userData.luz) { o.userData.luz = a.luz || null; aplicarLuz(o, a.luz || null); }
}
export function aplicarAjustes(tr) {
  const d = dadosDe.get(tr.pistaId || tr.id); if (!d || !Array.isArray(d.ajustes)) return;
  for (const a of d.ajustes) aplicarAjuste(pecaDaChave(tr, a.chave), a);
}
export async function carregarCenario(tr) {
  if (tr.cenarioEditor) return tr.cenarioEditor;
  const g = new THREE.Group(); g.name = "cenario-editor"; tr.cenarioEditor = g; tr.grp.add(g);
  await pronto;
  const dados = dadosDe.get(tr.pistaId || tr.id);
  if (!dados || !Array.isArray(dados.itens)) return g;
  if (dados.colisao === "pecas" && window.Pistas?.murosDoCenario) tr.murosCenario = window.Pistas.murosDoCenario(tr.pts, tr.W, dados); // (a mesma conta do servidor, sim.js)
  if (window.Pistas?.obstaculosComAjustes) tr.obstaculos = window.Pistas.obstaculosComAjustes(tr.obstaculos, dados); // (o canteiro do grampo segue o ajuste do editor, como no servidor)
  const objs = await Promise.all(dados.itens.map((it) => montarItem(it, tr)));
  for (const o of objs) if (o) g.add(o);
  return g;
}
export const colisaoDaPista = (tr) => dadosDe.get(tr.pistaId || tr.id)?.colisao || "";
export const ajustesDaPista = (tr) => (dadosDe.get(tr.pistaId || tr.id)?.ajustes || []).slice();
// (2026-11-17, o Thiago: o TERRENO do editor com pincéis) o relevo pintado no editor: { relevo: { cel, d: { "ix,iz": dh } } } no cenario/<pista>.json,
// a diferença de altura numa grade de `cel` unidades (só as células mexidas). O pista.js soma ao chão de cada pista que tem relevo salvo;
// sem dado, nada muda. relevoDoEditor(id) devolve (x, z) -> dh (bilinear) ou null.
export function relevoDeDados(r) {
  if (!r || !r.d || !Object.keys(r.d).length) return null;
  const cel = +r.cel || 12, d = r.d, v = (i, j) => d[i + "," + j] || 0;
  return (x, z) => { const fx = x / cel, fz = z / cel, i = Math.floor(fx), j = Math.floor(fz), u = fx - i, w = fz - j;
    return (v(i, j) * (1 - u) + v(i + 1, j) * u) * (1 - w) + (v(i, j + 1) * (1 - u) + v(i + 1, j + 1) * u) * w; };
}
export const relevoDoEditor = (id) => relevoDeDados(dadosDe.get(id)?.relevo);
export const dadosDoRelevo = (id) => dadosDe.get(id)?.relevo || null;
