// O cenário feito no editor de pistas (corrida-editor.js, editor/editor.js): public/corrida/cenario/<pista>.json diz que asset (os .glb leves de
// public/corrida/assets/) vai onde, girado e em que escala. Entra no grupo da pista por cima do cenário em código; sem arquivo, nada muda.
// Formato: { pista, itens: [{ asset, x, y, z, rx, ry, rz, s, cor? }] } em coordenadas do 3D (y para cima; o x e o z são os x e y do traçado).
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder), modelos = new Map();
let indice = null;
export function modeloDoAsset(nome) {
  if (!modelos.has(nome)) modelos.set(nome, loader.loadAsync(`/corrida/assets/${nome}.glb`).then((g) => g.scene).catch((e) => { console.warn("Cenário: asset não carregou", nome, e); return null; }));
  return modelos.get(nome);
}
// uma cópia do asset para um item (a cor, quando tem, multiplica a do material: cada item ganha o seu)
export async function montarItem(it) {
  const base = await modeloDoAsset(it.asset); if (!base) return null;
  const o = base.clone(true);
  o.position.set(+it.x || 0, +it.y || 0, +it.z || 0); o.rotation.set(+it.rx || 0, +it.ry || 0, +it.rz || 0); o.scale.setScalar(+it.s || 1);
  o.traverse((m) => { if (!m.isMesh) return; m.castShadow = true; m.receiveShadow = true; if (it.cor) { m.material = m.material.clone(); m.material.color?.multiply(new THREE.Color(it.cor)); } });
  o.userData.item = it; o.name = `cenario-${it.asset}`;
  return o;
}
export async function carregarCenario(tr) {
  const id = tr.pistaId || tr.id;
  if (tr.cenarioEditor) return tr.cenarioEditor;
  const g = new THREE.Group(); g.name = "cenario-editor"; tr.cenarioEditor = g; tr.grp.add(g);
  let dados = null;
  try {
    indice ||= fetch("/corrida/cenario/index.json", { cache: "no-cache" }).then((r) => (r.ok ? r.json() : [])).catch(() => []); // (as pistas que têm cenário: sem um 404 em cada pista)
    if ((await indice).includes(id)) { const r = await fetch(`/corrida/cenario/${id}.json`, { cache: "no-cache" }); if (r.ok) dados = await r.json(); }
  } catch { /* sem cenário do editor */ }
  if (!dados || !Array.isArray(dados.itens)) return g;
  const objs = await Promise.all(dados.itens.map(montarItem));
  for (const o of objs) if (o) g.add(o);
  return g;
}
