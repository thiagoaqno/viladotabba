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
import { montarKit } from "./biblioteca.js";

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder), modelos = new Map();
// os arquivos chegam logo que a página abre (a pista é montada sem esperar a rede: os ajustes precisam estar prontos até lá)
const dadosDe = new Map();
const pronto = fetch("/corrida/cenario/index.json", { cache: "no-cache" }).then((r) => (r.ok ? r.json() : [])).catch(() => [])
  .then((ids) => Promise.all((Array.isArray(ids) ? ids : []).map((id) => fetch(`/corrida/cenario/${id}.json`, { cache: "no-cache" }).then((r) => (r.ok ? r.json() : null)).then((d) => { if (d) dadosDe.set(id, d); }).catch(() => {}))));
export const cenarioPronto = pronto;

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
  const luz = new THREE.MeshStandardMaterial({ color: 0x330000, emissive: 0xff1a1a, emissiveIntensity: 0.4 });
  for (let k = 0; k < 5; k++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.6, 12), luz); l.rotation.x = Math.PI / 2; l.position.set((k - 2) * 5, alto - 2, 1.8); g.add(l); }
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
  brita: (x, w, h) => { x.fillStyle = "#b9ab8a"; x.fillRect(0, 0, w, h); for (let i = 0; i < 2500; i++) { x.fillStyle = Math.random() < 0.5 ? "#8f8468" : "#d6cbb0"; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); } },
};
// (2026-11-17, o Thiago: "áreas de escape com espaço para patrocínio") em qualquer padrão a marca vai carimbada no meio de cada repetição,
// numa placa da cor escolhida (ou direto, sem placa)
function carimbo(x, marca, fundo) {
  x.save(); x.translate(128, 128); x.rotate(-Math.PI / 2);
  if (fundo) { x.fillStyle = fundo; x.fillRect(-96, -40, 192, 80); }
  x.translate(-128, -128); patrocinioEm(x, marca, 128, 128, 170, 62); x.restore();
}
export const PADROES_ESCAPE = { laranja: "Laranja com marcas", asfalto: "Asfalto", listrado: "Listrado vermelho e branco", brita: "Brita" };
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
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: texEscape.get(k), roughness: 0.9, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
  m.receiveShadow = true; m.userData.item = it; m.name = "escape"; return m;
}
export async function montarItem(it, tr = null) {
  if (it.tipo === "escape") return montarEscape(it, tr);
  // (2026-11-16, o Thiago: "deve ser possível agrupar e desagrupar itens") um GRUPO: os itens dentro dele com posição relativa a ele
  if (it.tipo === "grupo") { const g = new THREE.Group(); for (const o of await Promise.all((it.itens || []).map((x) => montarItem(x, tr)))) if (o) g.add(o); g.position.set(+it.x || 0, +it.y || 0, +it.z || 0); g.rotation.set(+it.rx || 0, +it.ry || 0, +it.rz || 0); g.scale.setScalar(+it.s || 1); g.userData.item = it; g.name = "grupo"; return g; }
  // uma peça pronta da biblioteca (biblioteca.js), com a cor do item tingindo os materiais dela
  if (it.tipo === "kit") { const o = montarKit(it.kit); if (!o) return null; o.position.set(+it.x || 0, +it.y || 0, +it.z || 0); o.rotation.set(+it.rx || 0, +it.ry || 0, +it.rz || 0); o.scale.setScalar(+it.s || 1); if (it.cor) o.traverse((m) => { if (m.isMesh) { m.material = m.material.clone(); m.material.color?.multiply(new THREE.Color(it.cor)); } }); o.userData.item = it; return o; }
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
  const objs = await Promise.all(dados.itens.map((it) => montarItem(it, tr)));
  for (const o of objs) if (o) g.add(o);
  return g;
}
export const ajustesDaPista = (tr) => (dadosDe.get(tr.pistaId || tr.id)?.ajustes || []).slice();
