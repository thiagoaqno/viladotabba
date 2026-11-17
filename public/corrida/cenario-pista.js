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
export async function montarItem(it) {
  if (it.tipo === "placa") { const o = montarPlaca(it); o.position.set(+it.x || 0, +it.y || 0, +it.z || 0); o.rotation.set(+it.rx || 0, +it.ry || 0, +it.rz || 0); o.scale.setScalar(+it.s || 1); o.userData.item = it; o.name = `placa-${it.marca || ""}`; return o; }
  const base = await modeloDoAsset(it.asset); if (!base) return null;
  const o = base.clone(true);
  o.position.set(+it.x || 0, +it.y || 0, +it.z || 0); o.rotation.set(+it.rx || 0, +it.ry || 0, +it.rz || 0); o.scale.setScalar(+it.s || 1);
  o.traverse((m) => { if (!m.isMesh) return; m.castShadow = true; m.receiveShadow = true; if (it.cor) { m.material = m.material.clone(); m.material.color?.multiply(new THREE.Color(it.cor)); } });
  o.userData.item = it; o.name = `cenario-${it.asset}`;
  return o;
}
// ---- as peças que a pista já tinha ----
export function chaveDe(tr, o) { const k = []; for (let p = o; p && p !== tr.grp; p = p.parent) { if (!p.parent) return null; k.unshift(p.parent.children.indexOf(p)); } return k.join("/"); }
export function pecaDaChave(tr, chave) { let o = tr.grp; for (const i of String(chave).split("/")) { o = o?.children[+i]; if (!o) return null; } return o; }
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
  const objs = await Promise.all(dados.itens.map(montarItem));
  for (const o of objs) if (o) g.add(o);
  return g;
}
export const ajustesDaPista = (tr) => (dadosDe.get(tr.pistaId || tr.id)?.ajustes || []).slice();
