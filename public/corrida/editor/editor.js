// O editor de cenário das pistas (2026-11-16): abre na página do jogo com ?editor=<pista> (servidor com CORRIDA_EDITOR=1, editor-de-pistas.bat).
// A pista é a do jogo (pista.js buildTrack), com câmera livre. À esquerda: os .glb originais (assets-originais/) com o CONVERSOR para low poly
// (menos triângulos pelo SimplifyModifier, texturas encolhidas, exportado em .glb pelo GLTFExporter, tudo aqui no navegador), os assets leves
// (public/corrida/assets/) para colocar, e o item selecionado (posição, giro, escala, cor). Salvar grava cenario/<pista>.json (corrida-editor.js).
// Teclas: W mover, E girar, R escala, Delete apaga, D duplica, G põe no chão, Esc solta. Clique no chão com um asset escolhido: coloca.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { renderer, scene, cam } from "../cena.js";
import { buildTrack, useTrack } from "../pista.js";
import { PISTAS } from "../estado.js";
import { carregarCenario, montarItem, cenarioPronto, chaveDe, ajustesDaPista } from "../cenario-pista.js";

const M_PARA_U = 4.8; // 1 metro ≈ 4,8 unidades do jogo (dinamica.js: 1 u = 0,2083 m): um asset em metros entra no tamanho certo
const pista = new URLSearchParams(location.search).get("editor") || "interlagos";
let prevRender = null; // (a prévia do conversor, desenhada junto com a cena)
const h = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const api = (u, op) => fetch("/api/corrida/editor/" + u, op).then(async (r) => { const j = await r.json().catch(() => ({})); if (!r.ok) throw Error(j.erro || r.statusText); return j; });

// ---------- a tela: só o 3D e o painel ----------
for (const id of ["home", "lobby", "bar"]) document.getElementById(id)?.classList.add("hidden");
document.getElementById("race")?.classList.remove("hidden");
for (const el of document.querySelectorAll("#race > :not(canvas)")) el.style.display = "none";
const css = document.createElement("style");
css.textContent = `#ed{position:fixed;left:0;top:0;bottom:0;width:330px;overflow:auto;background:#12151bee;color:#e8ecf2;font:13px Barlow,system-ui,sans-serif;z-index:50;padding:12px;box-sizing:border-box}
#ed h2{font-size:16px;margin:0 0 8px}#ed h3{font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.7;margin:14px 0 6px}
#ed button,#ed select,#ed input{font:inherit;color:inherit;background:#232833;border:1px solid #3a4150;border-radius:6px;padding:4px 8px}
#ed button{cursor:pointer}#ed button:hover{border-color:#6aa0ff}#ed button.on{background:#2d5bd6;border-color:#2d5bd6}
#ed .lin{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:4px 0}#ed .lin label{display:flex;gap:4px;align-items:center}
#ed .lst{display:flex;flex-direction:column;gap:4px;max-height:180px;overflow:auto}#ed .lst button{text-align:left;display:flex;justify-content:space-between}
#ed input[type=number]{width:72px}#ed small{opacity:.7}#ed .ok{color:#7fe08a}#ed .erro{color:#ff8080}
#edPrev{width:100%;height:170px;background:#0b0d11;border-radius:8px;display:block}
#edAjuda{position:fixed;right:12px;bottom:12px;background:#12151bcc;color:#cfd6e2;font:12px Barlow,system-ui,sans-serif;padding:8px 10px;border-radius:8px;z-index:50}`;
document.head.appendChild(css);
const painel = document.createElement("div"); painel.id = "ed"; document.body.appendChild(painel);
const ajuda = document.createElement("div"); ajuda.id = "edAjuda"; ajuda.textContent = "Shift + WASD anda (Q/Z sobe e desce) · W mover · E girar · R escala · G no chão · D duplica · Del apaga/esconde · Esc solta · clique escolhe uma peça; com um asset escolhido, coloca"; document.body.appendChild(ajuda);

// ---------- a pista e a câmera ----------
window.__editorCenario = true; await cenarioPronto; // (sem juntar as malhas: cada peça da pista fica clicável; e os ajustes já salvos aplicados)
const tr = buildTrack(pista); useTrack(tr, "dia");
window.__ed = { tr, scene, cam }; // (para conferir pelo console)
if (scene.fog) { scene.fog.near = 1e6; scene.fog.far = 2e6; } // (sem névoa para ver a pista toda; o céu, ceu.js, ainda mexe na cor dela)
const cenario = await carregarCenario(tr);
const t = PISTAS[pista], meio = (t?.world || 1600) / 2;
cam.near = 1; cam.far = 40000; cam.position.set(meio, 900, meio + 900); cam.updateProjectionMatrix();
const orbita = new OrbitControls(cam, renderer.domElement); orbita.target.set(meio, 0, meio); orbita.maxDistance = 20000; orbita.update();
const gizmo = new TransformControls(cam, renderer.domElement); scene.add(gizmo.getHelper ? gizmo.getHelper() : gizmo);
gizmo.addEventListener("dragging-changed", (e) => { orbita.enabled = !e.value; if (!e.value) { guardarItem(selecionado); desenharItem(); } });
gizmo.addEventListener("objectChange", () => desenharItem(true));
function ajustar() { renderer.setSize(innerWidth, innerHeight, false); renderer.domElement.style.width = innerWidth + "px"; renderer.domElement.style.height = innerHeight + "px"; cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); }
ajustar(); addEventListener("resize", ajustar);
// (2026-11-16, o Thiago: "tá difícil andar por essa Mônaco; segurando Shift, o WASD devia andar") Shift + WASD anda no plano da câmera, Q e Z sobem e descem;
// o alvo da órbita vai junto. A velocidade cresce com a altura.
const tecla = new Set(); addEventListener("keydown", (e) => tecla.add(e.code)); addEventListener("keyup", (e) => tecla.delete(e.code)); addEventListener("blur", () => tecla.clear());
const comShift = () => tecla.has("ShiftLeft") || tecla.has("ShiftRight");
let antes = performance.now();
renderer.setAnimationLoop(() => {
  const agora = performance.now(), dt = Math.min(0.05, (agora - antes) / 1000); antes = agora;
  if (comShift()) {
    const fr = new THREE.Vector3(); cam.getWorldDirection(fr); fr.y = 0; fr.normalize(); const di = new THREE.Vector3(-fr.z, 0, fr.x);
    const v = Math.max(150, Math.abs(cam.position.y) * 1.2) * dt, m = new THREE.Vector3();
    if (tecla.has("KeyW")) m.add(fr); if (tecla.has("KeyS")) m.sub(fr); if (tecla.has("KeyD")) m.add(di); if (tecla.has("KeyA")) m.sub(di);
    if (tecla.has("KeyQ")) m.y += 1; if (tecla.has("KeyZ")) m.y -= 1;
    if (m.lengthSq()) { m.normalize().multiplyScalar(v); cam.position.add(m); orbita.target.add(m); }
  }
  renderer.render(scene, cam); prevRender?.();
});

// ---------- o chão: um raio de cima para baixo em tudo da pista, menos o próprio cenário do editor ----------
const raio = new THREE.Raycaster();
const solidos = () => { const l = []; tr.grp.traverse((o) => { if (o.isMesh && o.visible && !dentroDoCenario(o)) l.push(o); }); return l; };
const dentroDoCenario = (o) => { for (let p = o; p; p = p.parent) if (p === cenario) return true; return false; };
function chaoEm(x, z) { raio.set(new THREE.Vector3(x, 5000, z), new THREE.Vector3(0, -1, 0)); const hit = raio.intersectObjects(solidos(), false)[0]; return hit ? hit.point.y : 0; }
function noChao(o) { const b = new THREE.Box3().setFromObject(o); o.position.y += chaoEm(o.position.x, o.position.z) - b.min.y; }

// ---------- os itens ----------
let selecionado = null, assetEscolhido = null;
// as peças que a pista já tinha e foram mexidas: chave -> ajuste (salvo em `ajustes`)
const ajustes = new Map(ajustesDaPista(tr).map((a) => [a.chave, a]));
const ehItem = (o) => !!o?.userData.item;
function guardarPeca(o) { if (!o || ehItem(o)) return; const k = chaveDe(tr, o); if (!k) return; ajustes.set(k, { chave: k, x: +o.position.x.toFixed(2), y: +o.position.y.toFixed(2), z: +o.position.z.toFixed(2), rx: +o.rotation.x.toFixed(4), ry: +o.rotation.y.toFixed(4), rz: +o.rotation.z.toFixed(4), sx: +o.scale.x.toFixed(3), sy: +o.scale.y.toFixed(3), sz: +o.scale.z.toFixed(3), ...(o.visible ? {} : { oculto: true }) }); }
// a peça que um clique escolhe: sobe da malha até o grupo dela (um prédio, um marco), sem pegar um grupo que junta dezenas de coisas
function pecaDe(m) { let o = m; while (o.parent && o.parent !== tr.grp && o.parent.children.length <= 40) o = o.parent; return o; }
const guardarItem = (o) => { if (!o) return; if (!ehItem(o)) return guardarPeca(o); const it = o.userData.item; Object.assign(it, { x: +o.position.x.toFixed(2), y: +o.position.y.toFixed(2), z: +o.position.z.toFixed(2), rx: +o.rotation.x.toFixed(4), ry: +o.rotation.y.toFixed(4), rz: +o.rotation.z.toFixed(4), s: +o.scale.x.toFixed(3) }); };
function selecionar(o) { if (o && !ehItem(o) && !o.userData.original) o.userData.original = { p: o.position.toArray(), r: [o.rotation.x, o.rotation.y, o.rotation.z], s: o.scale.toArray(), v: o.visible }; selecionado = o; if (o) gizmo.attach(o); else gizmo.detach(); desenharItem(); }
async function colocar(it) { const o = await montarItem(it); if (!o) return null; cenario.add(o); return o; }
renderer.domElement.addEventListener("pointerdown", (e) => { renderer.domElement._xy = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener("pointerup", async (e) => {
  const [x0, y0] = renderer.domElement._xy || [0, 0]; if (Math.hypot(e.clientX - x0, e.clientY - y0) > 4 || gizmo.dragging) return; // (arrastou a câmera ou o gizmo)
  const p = new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); raio.setFromCamera(p, cam);
  const noCenario = raio.intersectObjects(cenario.children, true)[0];
  if (noCenario && !assetEscolhido) { let o = noCenario.object; while (o.parent !== cenario) o = o.parent; return selecionar(o); }
  if (!assetEscolhido) { if (comShift()) return; const peca = raio.intersectObjects(solidos(), false)[0]; return selecionar(peca ? pecaDe(peca.object) : null); }
  const hit = raio.intersectObjects(solidos(), false)[0]; if (!hit) return;
  const o = await colocar({ asset: assetEscolhido, x: hit.point.x, y: hit.point.y, z: hit.point.z, rx: 0, ry: 0, rz: 0, s: M_PARA_U });
  if (o) { noChao(o); guardarItem(o); selecionar(o); }
});
addEventListener("keydown", async (e) => {
  if (e.target.closest?.("input,select") || e.shiftKey) return; // (com Shift o WASD anda)
  const k = e.key.toLowerCase();
  if (k === "w") gizmo.setMode("translate"); else if (k === "e") gizmo.setMode("rotate"); else if (k === "r") gizmo.setMode("scale");
  else if (k === "escape") { assetEscolhido = null; selecionar(null); desenharAssets(); }
  else if (!selecionado) return;
  else if (k === "delete" || k === "backspace") { if (ehItem(selecionado)) cenario.remove(selecionado); else { selecionado.visible = false; guardarPeca(selecionado); } selecionar(null); } // (a peça da pista só fica escondida)
  else if (k === "g") { noChao(selecionado); guardarItem(selecionado); desenharItem(); }
  else if (k === "d" && ehItem(selecionado)) { const it = { ...selecionado.userData.item, x: selecionado.userData.item.x + 30 }; const o = await colocar(it); if (o) { noChao(o); guardarItem(o); selecionar(o); } }
});

// ---------- o painel ----------
let assets = { originais: [], leves: [] }, aviso = "";
painel.innerHTML = `<h2>Editor de cenário</h2>
  <div class="lin"><select id="edPista">${Object.keys(PISTAS).map((id) => `<option value="${id}" ${id === pista ? "selected" : ""}>${h(PISTAS[id].name || id)}</option>`).join("")}</select><button id="edSalvar">Salvar</button></div>
  <div id="edAviso"></div>
  <h3>Converter (assets-originais/)</h3><div id="edOrig" class="lst"></div>
  <div class="lin"><label>Triângulos <input id="edFrac" type="range" min="5" max="100" value="30"> <b id="edFracV">30%</b></label></div>
  <div class="lin"><label>Textura máx. <select id="edTex"><option>2048</option><option selected>1024</option><option>512</option><option>256</option></select></label></div>
  <canvas id="edPrev"></canvas><div id="edConv"><small>Escolha um original para ver antes e depois.</small></div>
  <h3>Assets leves (para colocar)</h3><div id="edLeves" class="lst"></div>
  <h3>Item selecionado</h3><div id="edItem"><small>Clique num item do cenário.</small></div>`;
const $ = (id) => document.getElementById(id);
$("edPista").onchange = (e) => { location.search = "?editor=" + e.target.value; };
$("edFrac").oninput = (e) => { $("edFracV").textContent = e.target.value + "%"; };
$("edSalvar").onclick = async () => {
  for (const o of cenario.children) guardarItem(o);
  try { const r = await api("cenario/" + pista, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pista, itens: cenario.children.map((o) => o.userData.item), ajustes: [...ajustes.values()] }) }); avisar(`Salvo: ${r.itens} itens e ${ajustes.size} peças mexidas em cenario/${pista}.json`); }
  catch (e) { avisar(e.message, true); }
};
function avisar(txt, erro = false) { $("edAviso").innerHTML = `<small class="${erro ? "erro" : "ok"}">${h(txt)}</small>`; }
async function recarregarAssets() { try { assets = await api("assets"); } catch (e) { avisar("Abra o editor pelo editor-de-pistas.bat (" + e.message + ")", true); } desenharOriginais(); desenharAssets(); }
function desenharOriginais() {
  $("edOrig").innerHTML = assets.originais.length ? assets.originais.map((a) => `<button data-orig="${h(a.nome)}"><span>${h(a.nome)}</span><small>${a.kb} KB</small></button>`).join("") : "<small>Ponha os .glb em assets-originais/ e recarregue.</small>";
  for (const b of $("edOrig").querySelectorAll("[data-orig]")) b.onclick = () => converter(b.dataset.orig);
}
function desenharAssets() {
  $("edLeves").innerHTML = assets.leves.length ? assets.leves.map((a) => `<button data-leve="${h(a.nome)}" class="${assetEscolhido === a.nome ? "on" : ""}"><span>${h(a.nome)}</span><small>${a.kb} KB</small></button>`).join("") : "<small>Converta um original primeiro.</small>";
  for (const b of $("edLeves").querySelectorAll("[data-leve]")) b.onclick = () => { assetEscolhido = assetEscolhido === b.dataset.leve ? null : b.dataset.leve; desenharAssets(); };
}
function desenharItem(soNumeros = false) {
  const o = selecionado, el = $("edItem");
  if (!o) { el.innerHTML = "<small>Clique num item do cenário.</small>"; return; }
  if (!ehItem(o)) return desenharPeca(o, soNumeros);
  const it = o.userData.item, n = (k, v, passo) => `<label>${k} <input type="number" step="${passo}" data-c="${k}" value="${(+v).toFixed(passo < 1 ? 2 : 0)}"></label>`;
  const deg = (r) => (r * 180) / Math.PI;
  if (soNumeros && el.querySelector("[data-c]")) { for (const [k, v] of [["x", o.position.x], ["y", o.position.y], ["z", o.position.z], ["giro", deg(o.rotation.y)], ["escala", o.scale.x]]) { const i = el.querySelector(`[data-c="${k}"]`); if (i && document.activeElement !== i) i.value = (+v).toFixed(k === "escala" ? 2 : 0); } return; }
  el.innerHTML = `<div class="lin"><b>${h(it.asset)}</b></div>
    <div class="lin">${n("x", o.position.x, 1)}${n("y", o.position.y, 1)}${n("z", o.position.z, 1)}</div>
    <div class="lin">${n("giro", deg(o.rotation.y), 5)}${n("escala", o.scale.x, 0.1)}</div>
    <div class="lin"><label>Cor <input type="color" data-cor value="${it.cor || "#ffffff"}"></label><button data-semcor>Cor original</button></div>
    <div class="lin"><button data-a="g">No chão (G)</button><button data-a="d">Duplicar (D)</button><button data-a="del">Apagar</button></div>`;
  for (const i of el.querySelectorAll("[data-c]")) i.onchange = () => {
    const v = +i.value; if (!Number.isFinite(v)) return;
    if (i.dataset.c === "giro") o.rotation.y = (v * Math.PI) / 180; else if (i.dataset.c === "escala") o.scale.setScalar(Math.max(0.01, v)); else o.position[i.dataset.c] = v;
    guardarItem(o);
  };
  el.querySelector("[data-cor]").onchange = (e) => trocarCor(o, e.target.value);
  el.querySelector("[data-semcor]").onclick = () => trocarCor(o, null);
  for (const b of el.querySelectorAll("[data-a]")) b.onclick = () => dispatchEvent(new KeyboardEvent("keydown", { key: b.dataset.a === "del" ? "Delete" : b.dataset.a }));
}
function desenharPeca(o, soNumeros) {
  const el = $("edItem"), deg = (r) => (r * 180) / Math.PI, n = (k, v, passo) => `<label>${k} <input type="number" step="${passo}" data-c="${k}" value="${(+v).toFixed(passo < 1 ? 2 : 0)}"></label>`;
  if (soNumeros && el.querySelector("[data-c]")) { for (const [k, v] of [["x", o.position.x], ["y", o.position.y], ["z", o.position.z], ["giro", deg(o.rotation.y)], ["escala", o.scale.x]]) { const i = el.querySelector(`[data-c="${k}"]`); if (i && document.activeElement !== i) i.value = (+v).toFixed(k === "escala" ? 2 : 0); } return; }
  el.innerHTML = `<div class="lin"><b>${h(o.name || o.type)}</b> <small>peça da pista · ${h(chaveDe(tr, o))}</small></div>
    <div class="lin">${n("x", o.position.x, 1)}${n("y", o.position.y, 1)}${n("z", o.position.z, 1)}</div>
    <div class="lin">${n("giro", deg(o.rotation.y), 5)}${n("escala", o.scale.x, 0.1)}</div>
    <div class="lin"><button data-p="pai">Pegar o grupo de fora</button><button data-p="esconder">Esconder</button><button data-p="voltar">Voltar ao original</button></div>
    <div class="lin"><button data-p="exportar">Exportar .glb (para o Blender)</button></div>
    <small>As posições são dentro do grupo da peça. Pegue o grupo de fora para mexer num prédio inteiro.</small>`;
  for (const i of el.querySelectorAll("[data-c]")) i.onchange = () => { const v = +i.value; if (!Number.isFinite(v)) return; if (i.dataset.c === "giro") o.rotation.y = (v * Math.PI) / 180; else if (i.dataset.c === "escala") o.scale.multiplyScalar(Math.max(0.01, v) / (o.scale.x || 1)); else o.position[i.dataset.c] = v; guardarPeca(o); };
  // (2026-11-16, o Thiago: "gera o glb do cassino e eu arrumo") a peça vai como está na pista (centrada no chão dela) para assets-originais/
  el.querySelector("[data-p=exportar]").onclick = async () => {
    const nome = prompt("Nome do arquivo (em assets-originais/):", (o.name || "peca").toLowerCase().replace(/[^a-z0-9_-]/g, "-")); if (!nome) return;
    const copia = o.clone(true); copia.position.set(0, 0, 0); copia.rotation.set(0, 0, 0); copia.scale.setScalar(1 / M_PARA_U); copia.updateMatrixWorld(true); // (em metros: 1 m = 4,8 u)
    try { const bin = await exportador.parseAsync(copia, { binary: true }); const r = await api("original/" + encodeURIComponent(nome), { method: "POST", headers: { "content-type": "application/octet-stream" }, body: bin }); avisar(`Exportado: assets-originais/${nome}.glb (${r.kb} KB)`); recarregarAssets(); }
    catch (e) { avisar("Não exportou: " + e.message, true); }
  };
  el.querySelector("[data-p=pai]").onclick = () => { if (o.parent && o.parent !== tr.grp) selecionar(o.parent); };
  el.querySelector("[data-p=esconder]").onclick = () => { o.visible = false; guardarPeca(o); selecionar(null); };
  el.querySelector("[data-p=voltar]").onclick = () => { const or = o.userData.original; if (or) { o.position.fromArray(or.p); o.rotation.set(or.r[0], or.r[1], or.r[2]); o.scale.fromArray(or.s); o.visible = or.v; } ajustes.delete(chaveDe(tr, o)); desenharItem(); };
}
async function trocarCor(o, cor) {
  const it = { ...o.userData.item, cor: cor || undefined }; guardarItem(o); Object.assign(it, { x: o.position.x, y: o.position.y, z: o.position.z, rx: o.rotation.x, ry: o.rotation.y, rz: o.rotation.z, s: o.scale.x });
  const novo = await colocar(it); if (!novo) return; cenario.remove(o); selecionar(novo);
}

// ---------- o conversor: original → low poly ----------
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder), exportador = new GLTFExporter();
const prev = (() => { const c = $("edPrev"), r = new THREE.WebGLRenderer({ canvas: c, antialias: true }); r.setPixelRatio(devicePixelRatio); r.outputColorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Scene(); s.background = new THREE.Color(0x0b0d11); s.add(new THREE.HemisphereLight(0xffffff, 0x334455, 2.2)); const d = new THREE.DirectionalLight(0xffffff, 2); d.position.set(3, 5, 4); s.add(d);
  const c3 = new THREE.PerspectiveCamera(40, 1, 0.01, 1e5); return { c, r, s, c3, obj: null }; })();
function mostrar(obj) {
  if (prev.obj) prev.s.remove(prev.obj); prev.obj = obj; if (!obj) return; prev.s.add(obj);
  const b = new THREE.Box3().setFromObject(obj), tam = b.getSize(new THREE.Vector3()).length() || 1, cen = b.getCenter(new THREE.Vector3());
  prevRender = () => { const w = prev.c.clientWidth, hh = prev.c.clientHeight; if (prev.c.width !== w * devicePixelRatio) { prev.r.setSize(w, hh, false); prev.c3.aspect = w / hh; prev.c3.updateProjectionMatrix(); }
    const a = performance.now() / 2500; prev.c3.position.set(cen.x + Math.cos(a) * tam, cen.y + tam * 0.5, cen.z + Math.sin(a) * tam); prev.c3.lookAt(cen); prev.r.render(prev.s, prev.c3); };
}
const triangulos = (o) => { let n = 0; o.traverse((m) => { if (m.isMesh) { const g = m.geometry; n += (g.index ? g.index.count : g.attributes.position.count) / 3; } }); return Math.round(n); };
function encolher(tex, max) {
  const img = tex?.image; if (!img || !(img.width > max || img.height > max)) return;
  const k = max / Math.max(img.width, img.height), c = document.createElement("canvas"); c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); tex.image = c; tex.needsUpdate = true;
}
// menos triângulos por AGRUPAMENTO: os vértices caem numa grade e cada célula vira um vértice só (o primeiro dela, com a uv e a normal dele);
// triângulo que encolheu a um ponto ou a uma linha some. Rápido e sem quebrar com nenhum atributo (o SimplifyModifier do Three.js quebrava em
// modelos com grupos e atributos extras). A célula é procurada (busca binária) até sobrar a fração pedida dos triângulos.
function simplificarGeo(geo0, frac) {
  const geo = geo0.index ? geo0 : mergeVertices(geo0), pos = geo.attributes.position, idx = geo.index.array, alvo = Math.max(4, Math.round(idx.length / 3 * frac));
  const grupos = geo.groups.length ? geo.groups : [{ start: 0, count: idx.length, materialIndex: 0 }];
  geo.computeBoundingBox(); const tam = geo.boundingBox.getSize(new THREE.Vector3()), maior = Math.max(tam.x, tam.y, tam.z) || 1, b0 = geo.boundingBox.min;
  const agrupar = (cel) => {
    const mapa = new Map(), rep = new Int32Array(pos.count);
    for (let v = 0; v < pos.count; v++) { const k = Math.floor((pos.getX(v) - b0.x) / cel) + "," + Math.floor((pos.getY(v) - b0.y) / cel) + "," + Math.floor((pos.getZ(v) - b0.z) / cel); let r = mapa.get(k); if (r === undefined) { r = v; mapa.set(k, v); } rep[v] = r; }
    const out = [], novos = [];
    for (const gr of grupos) { const ini = out.length; for (let t = gr.start; t < gr.start + gr.count; t += 3) { const a = rep[idx[t]], b = rep[idx[t + 1]], c = rep[idx[t + 2]]; if (a !== b && b !== c && a !== c) out.push(a, b, c); } novos.push({ start: ini, count: out.length - ini, materialIndex: gr.materialIndex }); }
    return { out, novos };
  };
  let lo = maior / 4096, hi = maior / 2, melhor = null;
  for (let k = 0; k < 18; k++) { const cel = Math.sqrt(lo * hi), r = agrupar(cel), n = r.out.length / 3; if (n > alvo) lo = cel; else { hi = cel; melhor = r; } if (melhor && Math.abs(melhor.out.length / 3 - alvo) < alvo * 0.05) break; }
  if (!melhor) return geo;
  // só os vértices que sobraram vão para o arquivo (o resto ficava no .glb sem uso e o deixava maior que o original)
  const novoDe = new Map(), usados = [];
  const ind = melhor.out.map((v) => { let k = novoDe.get(v); if (k === undefined) { k = usados.length; novoDe.set(v, k); usados.push(v); } return k; });
  const g = new THREE.BufferGeometry();
  for (const [nomeA, at] of Object.entries(geo.attributes)) { const tam = at.itemSize, arr = new at.array.constructor(usados.length * tam), ler = [at.getX, at.getY, at.getZ, at.getW]; for (let i = 0; i < usados.length; i++) for (let c = 0; c < tam; c++) arr[i * tam + c] = ler[c].call(at, usados[i]); /* (getX… servem também ao atributo intercalado) */ g.setAttribute(nomeA, new THREE.BufferAttribute(arr, tam, at.normalized)); }
  g.setIndex(ind); if (geo.groups.length) for (const gr of melhor.novos) g.addGroup(gr.start, gr.count, gr.materialIndex); // (cada material com os seus triângulos)
  g.computeVertexNormals(); return g;
}
async function converter(nome) {
  const frac = +$("edFrac").value / 100, texMax = +$("edTex").value, el = $("edConv");
  el.innerHTML = `<small>Carregando ${h(nome)}…</small>`;
  try {
    const g = await loader.loadAsync(`/api/corrida/editor/original/${encodeURIComponent(nome)}`), raiz = g.scene, antes = triangulos(raiz);
    el.innerHTML = `<small>Simplificando ${antes.toLocaleString("pt-BR")} triângulos…</small>`; await new Promise((ok) => setTimeout(ok, 30));
    const texturas = new Set();
    raiz.traverse((m) => {
      if (!m.isMesh) return;
      if (frac < 1) m.geometry = simplificarGeo(m.geometry, frac);
      for (const mat of [].concat(m.material)) for (const k of ["map", "normalMap", "roughnessMap", "metalnessMap", "emissiveMap", "aoMap", "alphaMap"]) if (mat[k]) texturas.add(mat[k]);
    });
    for (const tx of texturas) encolher(tx, texMax);
    // as texturas saem em JPEG (o exportador grava PNG por padrão, que dobrava o arquivo); só a cor de um material com transparência fica em PNG
    const comAlfa = new Set(); raiz.traverse((m) => { if (m.isMesh) for (const mat of [].concat(m.material)) if ((mat.transparent || mat.alphaTest > 0) && mat.map) comAlfa.add(mat.map); });
    for (const tx of texturas) tx.userData.mimeType = comAlfa.has(tx) ? "image/png" : "image/jpeg";
    const depois = triangulos(raiz);
    const bin = await exportador.parseAsync(raiz, { binary: true });
    mostrar(raiz);
    el.innerHTML = `<div class="lin"><small>${antes.toLocaleString("pt-BR")} → <b>${depois.toLocaleString("pt-BR")}</b> triângulos · ${Math.round(bin.byteLength / 1024)} KB</small></div>
      <div class="lin"><label>Nome <input id="edNome" value="${h(nome.toLowerCase().replace(/[^a-z0-9_-]/g, "-"))}"></label><button id="edGravar">Gravar leve</button></div><small>Se ficou feio, aumente os triângulos e converta de novo.</small>`;
    $("edGravar").onclick = async () => {
      try { const r = await api("asset/" + encodeURIComponent($("edNome").value), { method: "POST", headers: { "content-type": "application/octet-stream" }, body: bin }); avisar(`Gravado: assets/${$("edNome").value}.glb (${r.kb} KB)`); await recarregarAssets(); }
      catch (e) { avisar(e.message, true); }
    };
  } catch (e) { el.innerHTML = `<small class="erro">Não converteu: ${h(e.message)}</small>`; }
}
recarregarAssets();
