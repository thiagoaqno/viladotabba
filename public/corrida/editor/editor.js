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
import { criarCraft } from "./craft.js";
import { criarComandos } from "./comandos.js";
import { PATROCINIOS, MARCAS_CAPACETE, miniaturaDoPatrocinio } from "../f1-capacetes.js";
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
css.textContent = `
#ed{position:fixed;left:12px;top:12px;bottom:12px;width:340px;overflow:auto;background:rgba(18,21,27,.94);color:#e8ecf2;font:13px Barlow,system-ui,sans-serif;z-index:50;padding:14px;box-sizing:border-box;border-radius:14px;border:1px solid #2b313d;box-shadow:0 10px 40px #0008;backdrop-filter:blur(6px)}
#ed h2{font-size:17px;margin:0 0 10px;letter-spacing:.02em}#ed h3{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#8fa0b8;margin:16px 0 8px;padding-top:12px;border-top:1px solid #262c37}
#ed button,#ed select,#ed input{font:inherit;color:inherit;background:#1e232d;border:1px solid #333b49;border-radius:8px;padding:6px 10px;transition:background .12s,border-color .12s}
#ed button{cursor:pointer}#ed button:hover,.edArq:hover{border-color:#5b8cff;background:#252c3a}#ed button.on{background:#2f63e0;border-color:#2f63e0;color:#fff}
#ed .lin{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:6px 0}#ed .lin label{display:flex;gap:6px;align-items:center;color:#b9c3d3}
#ed .lst{display:flex;flex-direction:column;gap:4px;max-height:190px;overflow:auto}#ed .lst button{text-align:left;display:flex;justify-content:space-between}
#ed input[type=number]{width:70px}#ed input[type=color]{padding:2px;width:38px;height:30px}#ed select{max-width:100%}#ed small{color:#8f9bb0}#ed .ok{color:#7fe08a}#ed .erro{color:#ff8080}
#ed [data-f]{flex:1 1 30%}.edArq{display:inline-flex;cursor:pointer;border:1px dashed #44506a;border-radius:8px;padding:6px 10px;color:#b9c3d3}
#edPrev{width:100%;height:170px;background:#0b0d11;border-radius:10px;display:block}
#edBarra{position:fixed;top:12px;left:50%;transform:translateX(-50%);display:flex;gap:4px;align-items:center;background:rgba(18,21,27,.94);border:1px solid #2b313d;border-radius:12px;padding:6px;z-index:51;box-shadow:0 10px 30px #0007;font:13px Barlow,system-ui,sans-serif}
#edBarra button{display:flex;flex-direction:column;align-items:center;gap:1px;min-width:54px;background:transparent;color:#cfd7e4;border:1px solid transparent;border-radius:8px;padding:5px 8px;cursor:pointer;font:inherit}
#edBarra button b{font-size:16px;line-height:1}#edBarra button small{font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#8f9bb0}
#edBarra button:hover{background:#252c3a;border-color:#3a4558}#edBarra button.on{background:#2f63e0;color:#fff}#edBarra button.on small{color:#dfe7ff}#edBarra i{width:1px;height:32px;background:#2e3542;margin:0 4px}
#edAjuda{position:fixed;right:12px;bottom:12px;max-width:560px;background:rgba(18,21,27,.85);color:#cfd6e2;font:12px Barlow,system-ui,sans-serif;padding:8px 12px;border-radius:10px;z-index:50}`;
document.head.appendChild(css);
const painel = document.createElement("div"); painel.id = "ed"; document.body.appendChild(painel);
// a barra do topo: o modo do gizmo, as vistas e o Craft
const barra = document.createElement("div"); barra.id = "edBarra";
barra.innerHTML = [["mover", "✥", "Mover · W"], ["girar", "⟳", "Girar · E"], ["escala", "⤡", "Escala · R"], 0, ["cima", "⬒", "De cima · 1"], ["lado", "◧", "De lado · 2"], ["frente", "▣", "De frente · 3"], ["v3d", "◈", "3D · 4"], ["focar", "◎", "Focar · F"], 0, ["craft", "⚒", "Craft"], 0, ["desfazer", "↶", "Desfazer · Ctrl+Z"], ["refazer", "↷", "Refazer · Ctrl+Y"]]
  .map((b) => (b ? `<button type="button" data-barra="${b[0]}" title="${b[2]}"><b>${b[1]}</b><small>${b[2].split(" · ")[0]}</small></button>` : "<i></i>")).join("");
document.body.appendChild(barra);
const ajuda = document.createElement("div"); ajuda.id = "edAjuda"; ajuda.textContent = "1 de cima · 2 de lado · 3 de frente · 4 em 3D · F foca no escolhido · Shift + WASD anda (Q/Z sobe e desce) · W mover · E girar · R escala · G no chão · D duplica · Del apaga/esconde · Esc solta · clique escolhe uma peça; com um asset escolhido, coloca"; document.body.appendChild(ajuda);

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
gizmo.addEventListener("dragging-changed", (e) => { orbita.enabled = !e.value; if (!e.value) { if (craft?.ativo()) return craft.mudou(); guardarItem(selecionado); desenharItem(); } });
gizmo.addEventListener("objectChange", () => { if (!craft?.ativo()) desenharItem(true); });
let craft = null, comandos = null; // (o modo Craft, craft.js, e a linha de comando, comandos.js: criados no fim, depois do painel)
// ---------- Ctrl+Z / Ctrl+Y (2026-11-16, o Thiago) ----------
// cada mudança vira um passo: mexer (posição, giro, escala e se aparece: antes e depois), pôr (um item ou peça nova num grupo) ou tirar.
// Desfazer aplica o "antes"; refazer, o "depois". Depois de cada passo, o item, a peça da pista ou a peça do Craft é guardada de novo.
const pilha = [], refeitos = []; let desfazendo = false;
const estado = (o) => ({ p: o.position.toArray(), r: [o.rotation.x, o.rotation.y, o.rotation.z], s: o.scale.toArray(), v: o.visible });
const iguais = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function pora(o, e) { o.position.fromArray(e.p); o.rotation.set(e.r[0], e.r[1], e.r[2]); o.scale.fromArray(e.s); o.visible = e.v; }
function registrar(passo) { if (desfazendo) return; pilha.push(passo); if (pilha.length > 200) pilha.shift(); refeitos.length = 0; }
function depoisDoPasso(o) { if (o.userData.peca) craft?.medirPeca(o); else guardarItem(o); if (o === selecionado || o === craft?.selecionada()) desenharItem(); }
function aplicarPasso(passo, voltar) {
  desfazendo = true;
  try {
    if (passo.tipo === "mexer") { pora(passo.o, voltar ? passo.antes : passo.depois); depoisDoPasso(passo.o); }
    else if ((passo.tipo === "por") === voltar) { passo.pai.remove(passo.o); if (selecionado === passo.o) selecionar(null); if (passo.o.userData.peca) craft?.soltar(passo.o); }
    else passo.pai.add(passo.o);
  } finally { desfazendo = false; }
}
function desfazer() { const p = pilha.pop(); if (!p) return avisar("Nada para desfazer."); aplicarPasso(p, true); refeitos.push(p); avisar(`Desfeito (${pilha.length} passos atrás)`); }
function refazer() { const p = refeitos.pop(); if (!p) return avisar("Nada para refazer."); aplicarPasso(p, false); pilha.push(p); avisar("Refeito"); }
// pôr e tirar: os grupos avisam (Object3D: childadded / childremoved)
function vigiar(g) { g.addEventListener("childadded", (e) => registrar({ tipo: "por", o: e.child, pai: g })); g.addEventListener("childremoved", (e) => registrar({ tipo: "tirar", o: e.child, pai: g })); }
// mexer pelo gizmo: o estado no começo do arrasto e no fim
let antesDoArrasto = null;
gizmo.addEventListener("mouseDown", () => { if (gizmo.object) antesDoArrasto = estado(gizmo.object); });
gizmo.addEventListener("mouseUp", () => { const o = gizmo.object; if (o && antesDoArrasto) { const d = estado(o); if (!iguais(antesDoArrasto, d)) registrar({ tipo: "mexer", o, antes: antesDoArrasto, depois: d }); } antesDoArrasto = null; });
// mexer pelos números e botões do painel: o estado do escolhido antes e logo depois de cada mudança
function vigiarPainel(el) {
  const marca = () => { const o = craft?.ativo() ? craft.selecionada() : selecionado; if (!o) return; const a = estado(o); setTimeout(() => { if (o.parent) { const d = estado(o); if (!iguais(a, d)) registrar({ tipo: "mexer", o, antes: a, depois: d }); } }, 0); };
  el.addEventListener("change", marca, true); el.addEventListener("click", (e) => { if (e.target.closest("button")) marca(); }, true);
}
// ---------- o escolhido em destaque: uma caixa amarela em volta (e as caixas da obra do Craft, mais fracas) ----------
const destaque = new THREE.Box3Helper(new THREE.Box3(), 0xffd23f); destaque.material.depthTest = false; destaque.renderOrder = 999; destaque.visible = false; scene.add(destaque);
function atualizarDestaque() {
  const o = craft?.ativo() ? craft.selecionada() : selecionado;
  destaque.visible = !!(o && o.parent); if (!destaque.visible) return;
  destaque.box.setFromObject(o); if (destaque.box.isEmpty()) destaque.visible = false;
}
// os vários escolhidos (Ctrl+clique): uma caixa azul em cada
const caixasVarios = [];
function destacarVarios() {
  let k = 0;
  for (const o of varios) { if (!o.parent) { varios.delete(o); continue; } const c = caixasVarios[k] || (caixasVarios[k] = Object.assign(new THREE.Box3Helper(new THREE.Box3(), 0x5b8cff), { renderOrder: 998 })); if (!c.parent) scene.add(c); c.material.depthTest = false; c.box.setFromObject(o); c.visible = true; k++; }
  for (; k < caixasVarios.length; k++) caixasVarios[k].visible = false;
}
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
  comandos?.quadro(dt); atualizarDestaque(); destacarVarios(); renderer.render(scene, cam); prevRender?.();
});

// ---------- o chão: um raio de cima para baixo em tudo da pista, menos o próprio cenário do editor ----------
const raio = new THREE.Raycaster();
const solidos = () => { const l = []; tr.grp.traverse((o) => { if (o.isMesh && o.visible && !dentroDoCenario(o)) l.push(o); }); return l; };
const dentroDoCenario = (o) => { for (let p = o; p; p = p.parent) if (p === cenario) return true; return false; };
function chaoEm(x, z) { raio.set(new THREE.Vector3(x, 5000, z), new THREE.Vector3(0, -1, 0)); const hit = raio.intersectObjects(solidos(), false)[0]; return hit ? hit.point.y : 0; }
function noChao(o) { const b = new THREE.Box3().setFromObject(o); o.position.y += chaoEm(o.position.x, o.position.z) - b.min.y; }

// ---------- os itens ----------
const varios = new Set(); // (a seleção de vários itens: Ctrl+clique)
let selecionado = null, assetEscolhido = null, placaMarca = "pirelli", placaFundo = "#101114"; // ("*placa": o próximo clique no chão põe uma placa)
// as peças que a pista já tinha e foram mexidas: chave -> ajuste (salvo em `ajustes`)
const ajustes = new Map(ajustesDaPista(tr).map((a) => [a.chave, a]));
const ehItem = (o) => !!o?.userData.item;
function guardarPeca(o) { if (!o || ehItem(o)) return; const k = chaveDe(tr, o); if (!k) return; ajustes.set(k, { chave: k, x: +o.position.x.toFixed(2), y: +o.position.y.toFixed(2), z: +o.position.z.toFixed(2), rx: +o.rotation.x.toFixed(4), ry: +o.rotation.y.toFixed(4), rz: +o.rotation.z.toFixed(4), sx: +o.scale.x.toFixed(3), sy: +o.scale.y.toFixed(3), sz: +o.scale.z.toFixed(3), ...(o.visible ? {} : { oculto: true }) }); }
// a peça que um clique escolhe: sobe da malha até o grupo dela (um prédio, um marco), sem pegar um grupo que junta dezenas de coisas
function pecaDe(m) { let o = m; while (o.parent && o.parent !== tr.grp && o.parent.children.length <= 40) o = o.parent; return o; }
const guardarItem = (o) => { if (!o) return; if (!ehItem(o)) return guardarPeca(o); const it = o.userData.item; Object.assign(it, { x: +o.position.x.toFixed(2), y: +o.position.y.toFixed(2), z: +o.position.z.toFixed(2), rx: +o.rotation.x.toFixed(4), ry: +o.rotation.y.toFixed(4), rz: +o.rotation.z.toFixed(4), s: +o.scale.x.toFixed(3) }); };
function selecionar(o) { if (o && !ehItem(o) && !o.userData.original) o.userData.original = { p: o.position.toArray(), r: [o.rotation.x, o.rotation.y, o.rotation.z], s: o.scale.toArray(), v: o.visible }; selecionado = o; if (o) { if (o.userData.pino) gizmo.detach(); else gizmo.attach(o); } else gizmo.detach(); /* (PN: travado, sem gizmo) */ desenharItem(); }
async function colocar(it) { const o = await montarItem(it); if (!o) return null; cenario.add(o); return o; }
renderer.domElement.addEventListener("pointerdown", (e) => { renderer.domElement._xy = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener("pointerup", async (e) => {
  const [x0, y0] = renderer.domElement._xy || [0, 0]; if (Math.hypot(e.clientX - x0, e.clientY - y0) > 4 || gizmo.dragging) return; // (arrastou a câmera ou o gizmo)
  const p = new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); raio.setFromCamera(p, cam);
  if (craft?.ativo()) { if (!comShift()) craft.clique(); return; } // (no Craft o clique escolhe as peças da obra)
  const noCenario = raio.intersectObjects(cenario.children, true)[0];
  if (noCenario && !assetEscolhido) { let o = noCenario.object; while (o.parent !== cenario) o = o.parent;
    if (e.ctrlKey || e.shiftKey) { // (Ctrl+clique: soma ou tira da seleção, para agrupar)
      if (selecionado && ehItem(selecionado)) varios.add(selecionado);
      if (varios.has(o)) varios.delete(o); else varios.add(o);
      avisar(`${varios.size} itens escolhidos (GP agrupa)`); return selecionar(o);
    }
    varios.clear(); return selecionar(o); }
  if (!assetEscolhido) { if (comShift()) return; const peca = raio.intersectObjects(solidos(), false)[0]; return selecionar(peca ? pecaDe(peca.object) : null); }
  const hit = raio.intersectObjects(solidos(), false)[0]; if (!hit) return;
  const ry = Math.atan2(cam.position.x - hit.point.x, cam.position.z - hit.point.z); // (a frente do item virada para quem está olhando)
  // (2026-11-16, o Thiago: "tem que aparecer grande a placa no chão quando eu clicar") a largura da placa nova acompanha a distância da câmera:
  // de 60 (de perto) a 400 (vendo a pista de cima), em passos de 5; depois a largura muda no painel
  const base = { x: hit.point.x, y: hit.point.y, z: hit.point.z, rx: 0, ry, rz: 0 };
  const o = await colocar(assetEscolhido === "*placa" ? { tipo: "placa", marca: placaMarca, fundo: placaFundo, w: Math.round(Math.max(60, Math.min(400, cam.position.distanceTo(hit.point) * 0.12)) / 5) * 5, ...base, s: 1 } : { asset: assetEscolhido, ...base, s: M_PARA_U });
  if (o) { noChao(o); guardarItem(o); selecionar(o);
  }
});
addEventListener("keydown", (e) => {
  if (!(e.ctrlKey || e.metaKey) || e.target.closest?.("input,select")) return;
  const k = e.key.toLowerCase();
  if (k === "z" && !e.shiftKey) { e.preventDefault(); desfazer(); } else if (k === "y" || (k === "z" && e.shiftKey)) { e.preventDefault(); refazer(); }
});
addEventListener("keydown", async (e) => {
  if (e.target.closest?.("input,select") || e.shiftKey) return; // (com Shift o WASD anda)
  const k = e.key.toLowerCase(); // (as letras soltas vão para a linha de comando, comandos.js: MV, RO, SC, CO…)
  if (craft?.ativo()) { if (k === "delete") craft.apagar(); return; }
  else if (k === "escape") { assetEscolhido = null; selecionar(null); desenharAssets(); desenharPlaca(); } // (Esc solta a placa e o asset escolhidos)
  else if (!selecionado) return;
  else if (k === "delete" || k === "backspace") { if (ehItem(selecionado)) cenario.remove(selecionado); else { const a = estado(selecionado); selecionado.visible = false; guardarPeca(selecionado); registrar({ tipo: "mexer", o: selecionado, antes: a, depois: estado(selecionado) }); } selecionar(null); } // (a peça da pista só fica escondida)
});

// ---------- o painel ----------
let assets = { originais: [], leves: [] }, aviso = "";
painel.innerHTML = `<h2>Editor de cenário</h2>
  <div class="lin"><select id="edPista">${Object.keys(PISTAS).map((id) => `<option value="${id}" ${id === pista ? "selected" : ""}>${h(PISTAS[id].name || id)}</option>`).join("")}</select><button id="edSalvar">Salvar</button><button id="edPublicar" title="Salva e manda o cenário e os assets para o GitHub num PR (o merge é seu)">Publicar (PR)</button><button id="edCraftBt">Craft</button></div>
  <div id="edAviso"></div>
  <h3>Converter (assets-originais/)</h3><div id="edOrig" class="lst"></div>
  <div class="lin"><label>Triângulos <input id="edFrac" type="range" min="5" max="100" value="30"> <b id="edFracV">30%</b></label></div>
  <div class="lin"><label>Textura máx. <select id="edTex"><option>2048</option><option selected>1024</option><option>512</option><option>256</option></select></label></div>
  <canvas id="edPrev"></canvas><div id="edConv"><small>Escolha um original para ver antes e depois.</small></div>
  <h3>Assets leves (para colocar)</h3><div id="edLeves" class="lst"></div>
  <h3>Placa de patrocínio</h3><div id="edPlaca"></div>
  <h3>Item selecionado</h3><div id="edItem"><small>Clique num item do cenário.</small></div>`;
const $ = (id) => document.getElementById(id);
$("edPista").onchange = (e) => { location.search = "?editor=" + e.target.value; };
$("edFrac").oninput = (e) => { $("edFracV").textContent = e.target.value + "%"; };
$("edSalvar").onclick = async () => {
  const dados = (o) => { guardarItem(o); const it = { ...o.userData.item }; if (it.tipo === "grupo") it.itens = o.children.filter((c) => c.userData.item).map(dados); return it; }; // (o grupo leva os itens dele)
  const todos = cenario.children.filter((o) => o.userData.item).map(dados);
  try { const r = await api("cenario/" + pista, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pista, itens: todos, ajustes: [...ajustes.values()] }) }); avisar(`Salvo: ${r.itens} itens e ${ajustes.size} peças mexidas em cenario/${pista}.json`); }
  catch (e) { avisar(e.message, true); }
};
function avisar(txt, erro = false) { $("edAviso").innerHTML = `<small class="${erro ? "erro" : "ok"}">${h(txt)}</small>`; }
async function recarregarAssets() { try { assets = await api("assets"); } catch (e) { avisar("Abra o editor pelo editor-de-pistas.bat (" + e.message + ")", true); } desenharOriginais(); desenharAssets(); }
function desenharOriginais() {
  $("edOrig").innerHTML = assets.originais.length ? assets.originais.map((a) => `<button data-orig="${h(a.nome)}"><span>${h(a.nome)}</span><small>${a.kb} KB</small></button>`).join("") : "<small>Ponha os .glb em assets-originais/ e recarregue.</small>";
  for (const b of $("edOrig").querySelectorAll("[data-orig]")) b.onclick = () => converter(b.dataset.orig);
}
const marcasDaPlaca = () => [...Object.keys(PATROCINIOS).filter(Boolean), ...Object.keys(MARCAS_CAPACETE).sort((a, b) => MARCAS_CAPACETE[a].localeCompare(MARCAS_CAPACETE[b], "pt"))];
const nomeDaMarca = (id) => PATROCINIOS[id] || MARCAS_CAPACETE[id] || id;
const opcoesDeMarca = (atual) => marcasDaPlaca().map((id) => `<option value="${id}" ${id === atual ? "selected" : ""}>${h(nomeDaMarca(id))}</option>`).join("");
function desenharPlaca() {
  $("edPlaca").innerHTML = `<div class="lin"><img src="${miniaturaDoPatrocinio(placaMarca)}" alt="" style="height:30px;border-radius:6px"><select id="edPlMarca">${opcoesDeMarca(placaMarca)}</select></div>
    <div class="lin"><label>Fundo <input type="color" id="edPlFundo" value="${placaFundo}"></label><button id="edPlPor" class="${assetEscolhido === "*placa" ? "on" : ""}">${assetEscolhido === "*placa" ? "Clique no chão… (Esc sai)" : "Pôr placa"}</button></div>
    <small>1. escolha a marca e o fundo · 2. clique em Pôr placa · 3. clique no chão (pode pôr várias; Esc para) · a placa nasce virada para você e grande o bastante para ver daí</small>`;
  $("edPlMarca").onchange = (e) => { placaMarca = e.target.value; desenharPlaca(); };
  $("edPlFundo").onchange = (e) => { placaFundo = e.target.value; };
  $("edPlPor").onclick = () => { assetEscolhido = assetEscolhido === "*placa" ? null : "*placa"; desenharPlaca(); desenharAssets(); };
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
  const placa = it.tipo === "placa";
  el.innerHTML = `<div class="lin"><b>${h(placa ? "Placa · " + nomeDaMarca(it.marca) : it.asset)}</b></div>
    ${placa ? `<div class="lin"><select data-pl="marca">${opcoesDeMarca(it.marca)}</select><label>Fundo <input type="color" data-pl="fundo" value="${it.fundo || "#101114"}"></label></div>
    <div class="lin"><label>Largura <input type="number" step="5" data-pl="w" value="${it.w || 60}"></label><label>Altura dos postes <input type="number" step="1" data-pl="alto" value="${it.alto ?? 14}"></label></div>` : ""}
    <div class="lin">${n("x", o.position.x, 1)}${n("y", o.position.y, 1)}${n("z", o.position.z, 1)}</div>
    <div class="lin">${n("giro", deg(o.rotation.y), 5)}${n("escala", o.scale.x, 0.1)}</div>
    <div class="lin"><label>Cor <input type="color" data-cor value="${it.cor || "#ffffff"}"></label><button data-semcor>Cor original</button></div>
    <div class="lin"><button data-a="g">No chão (G)</button><button data-a="d">Duplicar (D)</button><button data-a="del">Apagar</button></div>`;
  for (const i of el.querySelectorAll("[data-c]")) i.onchange = () => {
    const v = +i.value; if (!Number.isFinite(v)) return;
    if (i.dataset.c === "giro") o.rotation.y = (v * Math.PI) / 180; else if (i.dataset.c === "escala") o.scale.setScalar(Math.max(0.01, v)); else o.position[i.dataset.c] = v;
    guardarItem(o);
  };
  for (const c of el.querySelectorAll("[data-pl]")) c.onchange = () => { const v = c.type === "number" ? Math.max(1, +c.value || 1) : c.value; refazerItem(o, { [c.dataset.pl]: v }); };
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
  el.querySelector("[data-p=esconder]").onclick = () => { const a = estado(o); o.visible = false; guardarPeca(o); registrar({ tipo: "mexer", o, antes: a, depois: estado(o) }); selecionar(null); };
  el.querySelector("[data-p=voltar]").onclick = () => { const or = o.userData.original; if (or) { o.position.fromArray(or.p); o.rotation.set(or.r[0], or.r[1], or.r[2]); o.scale.fromArray(or.s); o.visible = or.v; } ajustes.delete(chaveDe(tr, o)); desenharItem(); };
}
// refaz um item com dados novos (a placa com outra marca, fundo ou tamanho), no mesmo lugar
async function refazerItem(o, mudar) {
  guardarItem(o); const it = { ...o.userData.item, ...mudar };
  const novo = await colocar(it); if (!novo) return; cenario.remove(o); selecionar(novo);
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
// ---------- o Craft (craft.js): montar coisas novas com as formas e os materiais do jogo ----------
vigiar(cenario); vigiarPainel(painel);
craft = criarCraft({ scene, cam, gizmo, orbita, raio, api, avisar, recarregarAssets, M_PARA_U, chaoEm, painel, vigiar });
$("edCraftBt").onclick = () => {
  selecionar(null); const on = craft.alternar(); $("edCraftBt").classList.toggle("on", on);
  for (const id of ["edOrig", "edLeves", "edItem", "edConv", "edPrev"]) { const el = $(id); if (el) el.style.display = on ? "none" : ""; }
  for (const t of painel.querySelectorAll("h3:not(#edCraft h3)")) t.style.display = on ? "none" : "";
  for (const l of painel.querySelectorAll(":scope > .lin")) if (!l.contains($("edSalvar"))) l.style.display = on ? "none" : "";
};
// ---------- a barra: modos e vistas ----------
function marcarModo() { for (const [k, m] of [["mover", "translate"], ["girar", "rotate"], ["escala", "scale"]]) barra.querySelector(`[data-barra="${k}"]`).classList.toggle("on", gizmo.mode === m); barra.querySelector('[data-barra="craft"]').classList.toggle("on", craft.ativo()); }
// o que a vista enquadra: a peça escolhida (do Craft ou da pista), senão o ponto que a câmera olha
function enquadrar() {
  const o = craft.ativo() ? craft.selecionada() : selecionado, b = o ? new THREE.Box3().setFromObject(o) : null;
  if (b && !b.isEmpty()) { const c = b.getCenter(new THREE.Vector3()); return { c, d: Math.max(60, b.getSize(new THREE.Vector3()).length() * 1.6) }; }
  return { c: orbita.target.clone(), d: Math.max(200, cam.position.distanceTo(orbita.target)) };
}
// (2026-11-16, o Thiago: "vista de cima do selecionado, vista lateral, vista 3D") a câmera vai até o enquadramento e o alvo da órbita fica no centro
function vista(tipo) {
  const { c, d } = enquadrar(), dir = { cima: [0, 1, 0.0001], lado: [1, 0.08, 0], frente: [0, 0.08, 1], v3d: [0.7, 0.55, 0.7], focar: null }[tipo];
  const v = dir ? new THREE.Vector3(...dir).normalize() : cam.position.clone().sub(orbita.target).normalize();
  cam.position.copy(c).addScaledVector(v, d); orbita.target.copy(c); cam.lookAt(c); orbita.update();
}
barra.onclick = (e) => {
  const b = e.target.closest("[data-barra]"); if (!b) return; const k = b.dataset.barra;
  if (k === "mover") gizmo.setMode("translate"); else if (k === "girar") gizmo.setMode("rotate"); else if (k === "escala") gizmo.setMode("scale");
  else if (k === "craft") $("edCraftBt").click(); else if (k === "desfazer") desfazer(); else if (k === "refazer") refazer(); else vista(k);
  marcarModo();
};
addEventListener("keydown", (e) => {
  if (e.target.closest?.("input,select") || e.shiftKey || e.ctrlKey) return;
  const v = { 1: "cima", 2: "lado", 3: "frente", 4: "v3d" }[e.key]; if (v) vista(v);
  setTimeout(marcarModo, 0);
});
marcarModo();
desenharPlaca(); // (a seção da placa de patrocínio)
// ---------- publicar: salva e abre o PR (corrida-editor.js /publicar) ----------
$("edPublicar").onclick = async () => {
  const msg = prompt("O que mudou? (vira o título do PR)", `cenário de ${PISTAS[pista]?.name || pista}`); if (msg == null) return;
  $("edSalvar").click(); await new Promise((ok) => setTimeout(ok, 600));
  avisar("Publicando… (branch, commit, push e PR)");
  try {
    const r = await api("publicar", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mensagem: msg }) });
    if (r.nada) return avisar("Nada novo para publicar: o GitHub já tem este cenário.");
    $("edAviso").innerHTML = `<small class="ok">PR aberto (${r.arquivos} arquivos): <a href="${h(r.url)}" target="_blank" rel="noopener" style="color:#9cc2ff">${h(r.url)}</a></small>`;
  } catch (e) { avisar("Não publicou: " + e.message, true); }
};
// ---------- a linha de comando (comandos.js): o que ela pode fazer no editor ----------
comandos = criarComandos({
  cam, orbita, gizmo, renderer, raio, avisar, scene, tr, pista,
  escolhido: () => (craft.ativo() ? craft.selecionada() : selecionado), ehItem, noChao, estado, registrar, desfazer, refazer, vista,
  guardar: (o) => (o.userData.peca ? craft.medirPeca(o) : guardarItem(o)), obra: () => craft.obra(), craftAlternar: () => $("edCraftBt").click(),
  selecionar: (o) => (craft.ativo() ? null : selecionar(o)),
  // GP: os itens escolhidos viram um grupo (centrado entre eles, no chão do mais baixo); UG: o grupo se desfaz e cada item volta ao cenário
  agrupar() {
    if (selecionado && ehItem(selecionado)) varios.add(selecionado);
    const lista = [...varios].filter((o) => o.parent === cenario); if (lista.length < 2) return 0;
    const c = new THREE.Vector3(); for (const o of lista) c.add(o.getWorldPosition(new THREE.Vector3())); c.divideScalar(lista.length); c.y = Math.min(...lista.map((o) => o.position.y));
    desfazendo = true; try { const g = new THREE.Group(); g.name = "grupo"; g.position.copy(c); g.userData.item = { tipo: "grupo", x: c.x, y: c.y, z: c.z, rx: 0, ry: 0, rz: 0, s: 1 }; cenario.add(g); for (const o of lista) g.attach(o); varios.clear(); selecionar(g); } finally { desfazendo = false; }
    pilha.length = 0; refeitos.length = 0; // (agrupar não entra no Ctrl+Z: a história recomeça daqui)
    return lista.length;
  },
  desagrupar() {
    const g = selecionado; if (!g || g.userData.item?.tipo !== "grupo") return 0; const filhos = [...g.children];
    desfazendo = true; try { for (const o of filhos) { cenario.attach(o); guardarItem(o); } cenario.remove(g); selecionar(null); } finally { desfazendo = false; }
    pilha.length = 0; refeitos.length = 0; return filhos.length;
  },
  apagar: () => dispatchEvent(new KeyboardEvent("keydown", { key: "Delete" })),
  // uma cópia deslocada (dx, dz) de um item do cenário ou de uma peça do Craft; as peças da pista não se copiam
  async copiar(o, dx, dz, escolher = true) {
    if (o.userData.peca) return craft.duplicar(o, dx, dz, escolher);
    if (!ehItem(o)) return null;
    guardarItem(o); const it = { ...o.userData.item, x: o.position.x + dx, z: o.position.z + dz };
    const c = await colocar(it); if (c) { c.scale.copy(o.scale); c.rotation.copy(o.rotation); guardarItem(c); if (escolher) selecionar(c); } return c;
  },
});
