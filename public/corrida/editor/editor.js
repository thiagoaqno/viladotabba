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
import { montarLayout } from "./layout.js";
import { criarTerreno } from "./terreno.js";
import { criarRegua } from "./regua.js";
import { painelAcabamento } from "./acabamentos-ui.js";
import { aplicarAcabamento } from "../acabamentos.js";
import { KITS, montarKit, FILTROS, filtroDoKit } from "../biblioteca.js";
import { PATROCINIOS, MARCAS_CAPACETE, miniaturaDoPatrocinio } from "../f1-capacetes.js";
import { carregarCenario, montarItem, cenarioPronto, chaveDe, ajustesDaPista, PADROES_ESCAPE, MATERIAIS_AREA } from "../cenario-pista.js";

const M_PARA_U = 4.8; // 1 metro ≈ 4,8 unidades do jogo (dinamica.js: 1 u = 0,2083 m): um asset em metros entra no tamanho certo
const pista = new URLSearchParams(location.search).get("editor") || "interlagos";
let prevRender = null; // (a prévia do conversor, desenhada junto com a cena)
const h = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const api = (u, op) => fetch("/api/corrida/editor/" + u, op).then(async (r) => { const j = await r.json().catch(() => ({})); if (!r.ok) throw Error(j.erro || r.statusText); return j; });

// ---------- no site: só entra quem fez login pelo GitHub (corrida-editor-online.js) ----------
{
  const r = await fetch("/api/corrida/editor/eu").catch(() => null);
  if (!r || !r.ok) {
    const j = r ? await r.json().catch(() => ({})) : {};
    const t = document.createElement("div");
    t.style.cssText = "position:fixed;inset:0;z-index:99;display:grid;place-items:center;background:#0d1016;color:#e8ecf2;font:15px Barlow,system-ui,sans-serif";
    t.innerHTML = j.entrar ? `<div style="text-align:center"><h2 style="margin:0 0 12px">Editor de cenário</h2><a href="${j.entrar}?pista=${encodeURIComponent(pista)}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#24292f;color:#fff;text-decoration:none;font-weight:700">Entrar com GitHub</a><p style="opacity:.6;margin-top:12px">Só a conta do dono do site.</p></div>`
      : `<div style="text-align:center;max-width:420px"><h2>Editor de cenário</h2><p>O editor não está ligado neste servidor. No PC, abra pelo editor-de-pistas.bat.</p></div>`;
    document.body.appendChild(t);
    throw Error("editor: sem login");
  }
}
// ---------- a tela: só o 3D e o painel ----------
for (const id of ["home", "lobby", "bar"]) document.getElementById(id)?.classList.add("hidden");
// (2026-11-16, o Thiago: "às vezes ele vai para a tela inicial do lobby com a interface aberta; o Esc fecha tudo") o jogo continua vivo por
// baixo (a sala, o socket, o Esc dele) e às vezes mostra o menu ou esconde a corrida: no editor, a tela fica presa no 3D e no painel
document.body.classList.add("modo-editor");
{ const st = document.createElement("style"); st.textContent = `body.modo-editor #home,body.modo-editor #lobby,body.modo-editor #bar,body.modo-editor #results,body.modo-editor .modal,body.modo-editor dialog{display:none!important}
body.modo-editor #race{display:block!important;visibility:visible!important}body.modo-editor #race>:not(canvas){display:none!important}body.modo-editor #screen{display:block!important}`; document.head.appendChild(st); }
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
#ed .edBibG{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:4px 0 8px}#ed .edBibG button{display:flex;flex-direction:column;align-items:center;gap:3px;padding:4px}#ed .edBibG img{width:100%;border-radius:6px}#ed .edBibG span{font-size:11px;line-height:1.1;text-align:center}
#edPrev{width:100%;height:170px;background:#0b0d11;border-radius:10px;display:block}
#edBarra{position:fixed;top:12px;left:50%;transform:translateX(-50%);display:flex;gap:4px;align-items:center;background:rgba(18,21,27,.94);border:1px solid #2b313d;border-radius:12px;padding:6px;z-index:51;box-shadow:0 10px 30px #0007;font:13px Barlow,system-ui,sans-serif}
#edBarra button{display:flex;flex-direction:column;align-items:center;gap:1px;min-width:54px;background:transparent;color:#cfd7e4;border:1px solid transparent;border-radius:8px;padding:5px 8px;cursor:pointer;font:inherit}
#edBarra button b{font-size:16px;line-height:1}#edBarra button small{font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#8f9bb0}
#edBarra button:hover{background:#252c3a;border-color:#3a4558}#edBarra button.on{background:#2f63e0;color:#fff}#edBarra button.on small{color:#dfe7ff}#edBarra i{width:1px;height:32px;background:#2e3542;margin:0 4px}
#ed{width:380px;font-size:14px}#ed button{padding:9px 13px;font-weight:600;background:#263042;border-color:#3f4b61}#ed h3{font-size:13px;color:#cfe0ff}
#ed .ferr{display:block;width:100%;padding:12px 14px!important;font-size:15px;background:#2b4c8c!important;border-color:#3f6bc4!important;color:#fff}#ed .ferr.on{background:#f2a51a!important;border-color:#f2a51a!important;color:#111}
#edBarra button{min-width:66px;padding:8px 10px}#edBarra button b{font-size:20px}#edBarra button small{font-size:11px}
#edCmd{display:none!important}
#edAjuda{position:fixed;right:12px;bottom:12px;max-width:560px;background:rgba(18,21,27,.85);color:#cfd6e2;font:12px Barlow,system-ui,sans-serif;padding:8px 12px;border-radius:10px;z-index:50}`;
document.head.appendChild(css);
const painel = document.createElement("div"); painel.id = "ed"; document.body.appendChild(painel);
// a barra do topo: o modo do gizmo, as vistas e o Craft
const barra = document.createElement("div"); barra.id = "edBarra";
barra.innerHTML = [["mover", "✥", "Mover · W"], ["girar", "⟳", "Girar · E"], ["escala", "⤡", "Escala · R"], 0, ["cima", "⬒", "De cima · 1"], ["lado", "◧", "De lado · 2"], ["frente", "▣", "De frente · 3"], ["v3d", "◈", "3D · 4"], ["focar", "◎", "Focar · F"], 0, ["medir", "📏", "Medir · Shift+R"], ["limparMedidas", "⌫", "Limpar medidas"], 0, ["craft", "⚒", "Craft"], 0, ["desfazer", "↶", "Desfazer · Ctrl+Z"], ["refazer", "↷", "Refazer · Ctrl+Y"]]
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
let craft = null, comandos = null, terreno = null, regua = null; // (o modo Craft, craft.js, e a linha de comando, comandos.js: criados no fim, depois do painel)
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
    if (passo.desfazer) passo.desfazer(voltar); // (o pincel de terreno, terreno.js: o passo sabe se desfazer)
    else if (passo.tipo === "mexer") { pora(passo.o, voltar ? passo.antes : passo.depois); depoisDoPasso(passo.o); }
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
  comandos?.quadro(dt); regua?.quadro(); atualizarDestaque(); destacarVarios(); renderer.render(scene, cam); prevRender?.();
});

// ---------- o chão: um raio de cima para baixo em tudo da pista, menos o próprio cenário do editor ----------
const raio = new THREE.Raycaster();
const solidos = () => { const l = []; tr.grp.traverse((o) => { if (o.isMesh && o.visible && !dentroDoCenario(o)) l.push(o); }); return l; };
const dentroDoCenario = (o) => { for (let p = o; p; p = p.parent) if (p === cenario) return true; return false; };
function chaoEm(x, z) { raio.set(new THREE.Vector3(x, 5000, z), new THREE.Vector3(0, -1, 0)); const hit = raio.intersectObjects(solidos(), false)[0]; return hit ? hit.point.y : 0; }
function noChao(o) { const b = new THREE.Box3().setFromObject(o); o.position.y += chaoEm(o.position.x, o.position.z) - b.min.y; }

// ---------- os itens ----------
let escapeA = null, escapeLarg = 60, escapeDe = 7, escapePadrao = "laranja", escapeMarca = "", escapeFundo = ""; // (a área de escape: o primeiro clique e as escolhas)
const varios = new Set(); // (a seleção de vários itens: Ctrl+clique)
let placaSemFundo = false; // (a marca no chão: sem o fundo, só o logo)
let selecionado = null, assetEscolhido = null, placaMarca = "pirelli", placaFundo = "#101114"; // ("*placa": o próximo clique no chão põe uma placa)
// as peças que a pista já tinha e foram mexidas: chave -> ajuste (salvo em `ajustes`)
const ajustes = new Map(ajustesDaPista(tr).map((a) => [a.chave, a]));
const ehItem = (o) => !!o?.userData.item;
function guardarPeca(o) { if (!o || ehItem(o)) return; const k = chaveDe(tr, o); if (!k) return; ajustes.set(k, { chave: k, x: +o.position.x.toFixed(2), y: +o.position.y.toFixed(2), z: +o.position.z.toFixed(2), rx: +o.rotation.x.toFixed(4), ry: +o.rotation.y.toFixed(4), rz: +o.rotation.z.toFixed(4), sx: +o.scale.x.toFixed(3), sy: +o.scale.y.toFixed(3), sz: +o.scale.z.toFixed(3), ...(o.visible ? {} : { oculto: true }), ...(o.userData.acab ? { acab: o.userData.acab } : {}) }); }
// a peça que um clique escolhe: sobe da malha até o grupo dela (um prédio, um marco), sem pegar um grupo que junta dezenas de coisas
function pecaDe(m) { let o = m; while (o.parent && o.parent !== tr.grp && o.parent.children.length <= 40) o = o.parent; return o; }
const guardarItem = (o) => { if (!o) return; if (!ehItem(o)) return guardarPeca(o); const it = o.userData.item; Object.assign(it, { x: +o.position.x.toFixed(2), y: +o.position.y.toFixed(2), z: +o.position.z.toFixed(2), rx: +o.rotation.x.toFixed(4), ry: +o.rotation.y.toFixed(4), rz: +o.rotation.z.toFixed(4), s: +o.scale.x.toFixed(3) }); };
function selecionar(o) { if (o && !ehItem(o) && !o.userData.original) o.userData.original = { p: o.position.toArray(), r: [o.rotation.x, o.rotation.y, o.rotation.z], s: o.scale.toArray(), v: o.visible }; selecionado = o; if (o) { if (o.userData.pino) gizmo.detach(); else gizmo.attach(o); } else gizmo.detach(); /* (PN: travado, sem gizmo) */ desenharItem(); }
async function colocar(it) { const o = await montarItem(it, tr); if (!o) return null; cenario.add(o); return o; }
renderer.domElement.addEventListener("pointerdown", (e) => { renderer.domElement._xy = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener("pointerup", async (e) => {
  const [x0, y0] = renderer.domElement._xy || [0, 0]; if (Math.hypot(e.clientX - x0, e.clientY - y0) > 4 || gizmo.dragging) return; // (arrastou a câmera ou o gizmo)
  if (terreno?.ativo()) return; // (com o pincel de terreno, o clique pinta: terreno.js)
  if (regua?.ativo()) return; // (com a régua, o clique mede: regua.js)
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
  if (assetEscolhido === "*area") { // (a área: cada clique é um canto; perto do primeiro, fecha)
    const h0 = raio.intersectObjects(solidos(), false)[0], pt = h0 ? h0.point : raio.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), new THREE.Vector3()); if (!pt) return;
    if (areaPts.length > 2 && pt.distanceTo(areaPts[0]) < Math.max(10, cam.position.distanceTo(pt) * 0.03)) return fecharArea();
    areaPts.push(pt.clone()); marcarArea(); return desenharArea();
  }
  if (assetEscolhido === "*trecho" || assetEscolhido === "*linha") { // (o eixo: início, fim e, com curva, o ponto por onde ela passa)
    const ln = assetEscolhido === "*linha", curva = ln ? linhaCurva : trechoCurva, redesenhar = () => (ln ? desenharLinha() : desenharTrecho());
    const h0 = raio.intersectObjects(solidos(), false)[0], pt = h0 ? h0.point : raio.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), new THREE.Vector3()); if (!pt) return;
    trechoPts.push(pt.clone()); marcarTrecho();
    if (trechoPts.length < (curva ? 3 : 2)) { avisar(trechoPts.length === 1 ? "Agora clique onde termina." : "Agora clique por onde a curva passa."); return redesenhar(); }
    const [A, B, Mm] = trechoPts, rel = (p) => [+(p.x - A.x).toFixed(2), +(p.z - A.z).toFixed(2)], pts = [rel(A), Mm ? rel(Mm) : null, rel(B)], pos = { x: A.x, y: Math.min(A.y, B.y), z: A.z, rx: 0, ry: 0, rz: 0, s: 1 };
    const o4 = await colocar(ln ? { tipo: "linha", pts, modelo: linhaModelo, espaco: linhaEsp, altura: linhaAlt, larg: linhaModelo === "parede" ? linhaLarg : undefined, mureta: (linhaModelo === "cerca" && linhaMureta) || undefined, ...pos }
      : { tipo: "trecho", pts, largura: trechoLarg, zebra: trechoZebra || undefined, ...pos });
    trechoPts = trechoEmendar ? [B.clone()] : []; marcarTrecho();
    if (o4) { guardarItem(o4); avisar(trechoEmendar ? "Pronto. O próximo começa no fim deste (Esc para)." : "Pronto. Clique no início do próximo (Esc para)."); }
    return redesenhar();
  }
  const hit = raio.intersectObjects(solidos(), false)[0]; if (!hit) return;
  const ry = Math.atan2(cam.position.x - hit.point.x, cam.position.z - hit.point.z); // (a frente do item virada para quem está olhando)
  // (2026-11-16, o Thiago: "tem que aparecer grande a placa no chão quando eu clicar") a largura da placa nova acompanha a distância da câmera:
  // de 60 (de perto) a 400 (vendo a pista de cima), em passos de 5; depois a largura muda no painel
  const base = { x: hit.point.x, y: hit.point.y, z: hit.point.z, rx: 0, ry, rz: 0 };
  if (assetEscolhido === "*beira") { // (a barreira na beira: o primeiro clique diz o começo e o lado; o segundo, o fim)
    const i = tr.indiceAt(hit.point.x, hit.point.z), p = tr.pts[i], lat = (hit.point.x - p.x) * p.nx + (hit.point.z - p.y) * p.ny;
    if (!beiraA) { beiraA = { i, lado: lat >= 0 ? 1 : -1 }; avisar("Barreira: agora clique onde ela termina (do mesmo lado)."); return desenharBeira(); }
    const a = beiraA; beiraA = null; let i0 = a.i, i1 = i; const fwd = (i1 - i0 + tr.n) % tr.n; if (fwd > tr.n / 2) [i0, i1] = [i1, i0];
    const o5 = await colocar({ tipo: "linha", beira: { i0, i1, lado: a.lado, de: Math.round(tr.W / 2 + beiraDist * M_PARA_U) }, modelo: beiraModelo, espaco: beiraEsp, altura: /^faixa/.test(beiraModelo) ? beiraFaixaAlt : beiraAlt, larg: beiraModelo === "parede" ? linhaLarg : undefined, ...(/^faixa/.test(beiraModelo) ? { marca: placaMarca, marca2: beiraMarca2 || undefined, fundo: placaFundo, fundo2: beiraFundo2 || undefined, elev: beiraElev } : {}), mureta: (beiraModelo === "cerca" && beiraMureta) || undefined, x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1 });
    if (o5) { selecionar(o5); avisar("Barreira pronta. Clique em mais dois pontos para outra (Esc para)."); } return desenharBeira();
  }
  if (assetEscolhido === "*escape" || assetEscolhido === "*zebra") {
    const zb = assetEscolhido === "*zebra";
    const i = tr.indiceAt(hit.point.x, hit.point.z), p = tr.pts[i], lat = (hit.point.x - p.x) * p.nx + (hit.point.z - p.y) * p.ny;
    if (!escapeA) { escapeA = { i, lado: lat >= 0 ? 1 : -1 }; avisar(zb ? "Zebra: agora clique onde ela termina (do mesmo lado)." : "Área de escape: agora clique onde ela termina (do mesmo lado)."); if (zb) desenharZebra(); return; }
    const a = escapeA; escapeA = null; let i0 = a.i, i1 = i; const n = tr.n, fwd = (i1 - i0 + n) % n; if (fwd > n / 2) [i0, i1] = [i1, i0];
    const o2 = await colocar(zb ? { tipo: "escape", i0, i1, lado: a.lado, de: Math.round(tr.W / 2 - zebraDentro), largura: zebraLarg, padrao: "zebra", x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1 }
      : { tipo: "escape", i0, i1, lado: a.lado, de: Math.round(tr.W / 2 + escapeDe), largura: escapeLarg, padrao: escapePadrao, marca: escapeMarca || undefined, fundoMarca: escapeFundo || undefined, x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1 });
    if (zb) { if (o2) avisar("Zebra pronta. Clique em mais dois pontos para outra (Esc para)."); return desenharZebra(); }
    if (o2) { selecionar(o2); avisar("Área de escape pronta. Clique em mais dois pontos para outra (Esc para)."); } return;
  }
  if (assetEscolhido?.startsWith("*de:")) { const nome = await assetDaPeca(assetEscolhido.slice(4)); if (!nome) return; const o2 = await colocar({ asset: nome, ...base, s: M_PARA_U }); if (o2) { noChao(o2); guardarItem(o2); selecionar(o2); } return; }
  if (assetEscolhido === "*portico") { // (o pórtico encaixa atravessado na pista: no centro dela, mais perto do clique, com o vão da largura dela)
    const i = tr.indiceAt(hit.point.x, hit.point.z), p = tr.pts[i];
    const o3 = await colocar({ tipo: "portico", marca: placaMarca, fundo: placaFundo, w: Math.round(tr.W + 20), alto: 32, x: p.x, y: p.h, z: p.y, rx: 0, ry: Math.atan2(p.tx, p.ty), rz: 0, s: 1 });
    if (o3) { guardarItem(o3); selecionar(o3); } return;
  }
  const o = await colocar(assetEscolhido?.startsWith("*kit:") ? { tipo: "kit", kit: assetEscolhido.slice(5), ...base, s: escalaPor, cor: lembrado("kit:" + assetEscolhido.slice(5)).cor || undefined } : assetEscolhido === "*marcaChao" ? { tipo: "marcaChao", grampo: "pista", marca: placaMarca, fundo: placaSemFundo ? "" : placaFundo, w: Math.round(Math.max(40, Math.min(600, cam.position.distanceTo(hit.point) * 0.25)) / 5) * 5, prop: 0.3, ...base, s: 1 } : assetEscolhido === "*placa" ? { tipo: "placa", marca: placaMarca, fundo: placaFundo, w: Math.round(Math.max(60, Math.min(400, cam.position.distanceTo(hit.point) * 0.12)) / 5) * 5, ...base, s: 1 } : { asset: assetEscolhido, ...base, s: M_PARA_U });
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
  else if (k === "escape") { assetEscolhido = null; selecionar(null); desenharAssets(); desenharPlaca(); desenharBiblioteca(); desenharDe(); escapeA = null; desenharEscape(); trechoPts = []; marcarTrecho(); desenharTrecho(); desenharLinha(); desenharZebra(); terreno?.parar(); regua?.parar(); marcarModo(); beiraA = null; desenharBeira(); areaPts = []; marcarArea(); desenharArea(); } // (Esc solta a placa e o asset escolhidos)
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
  <h3>Adicionar asset</h3><div id="edBib"></div>
  <h3>Área no chão (polígono)</h3><div id="edArea"></div>
  <h3>Barreira na beira da pista</h3><div id="edBeira"></div>
  <h3>Zebra na beira da pista</h3><div id="edZebra"></div>
  <h3>Linha de itens (pneus, cerca, pilares…)</h3><div id="edLinha"></div>
  <h3>Desenhar pista (só cenário)</h3><div id="edTrecho"></div>
  <h3>Peças das outras pistas</h3><div id="edDe"></div>
  <h3>Área de escape</h3><div id="edEsc"></div>
  <h3>Placa e pórtico de patrocínio</h3><div id="edPlaca"></div>
  <h3>Item selecionado</h3><div id="edItem"><small>Clique num item do cenário.</small></div>`;
const $ = (id) => document.getElementById(id);
$("edPista").onchange = (e) => { location.search = "?editor=" + e.target.value; };
$("edFrac").oninput = (e) => { $("edFracV").textContent = e.target.value + "%"; };
$("edSalvar").onclick = async () => {
  const dados = (o) => { guardarItem(o); const it = { ...o.userData.item }; if (it.tipo === "grupo") it.itens = o.children.filter((c) => c.userData.item).map(dados); return it; }; // (o grupo leva os itens dele)
  const todos = cenario.children.filter((o) => o.userData.item).map(dados);
  try { const r = await api("cenario/" + pista, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pista, itens: todos, ajustes: [...ajustes.values()], relevo: terreno?.dados() }) }); avisar(`Salvo: ${r.itens} itens e ${ajustes.size} peças mexidas em cenario/${pista}.json`); }
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
// ---------- a biblioteca (biblioteca.js): as peças prontas, com miniatura; clique numa e depois no chão ----------
const fotosKit = {};
// (TabbaTracks: desempenho) as miniaturas saem AOS POUCOS: a biblioteca abre na hora com um quadro vazio e cada foto é tirada num quadro
// seguinte (antes, abrir a biblioteca montava e fotografava as dezenas de peças de uma vez e a tela travava)
const VAZIO = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==", filaFotos = new Set();
function fotoDoKit(id) {
  if (fotosKit[id]) return fotosKit[id];
  filaFotos.add(id); if (filaFotos.size === 1) setTimeout(tirarFotos, 0); return VAZIO;
}
function tirarFotos() {
  const t0 = performance.now();
  for (const id of filaFotos) { filaFotos.delete(id); const src = fotoDoKit0(id); for (const im of document.querySelectorAll(`img[data-foto="${id}"]`)) im.src = src; if (performance.now() - t0 > 12) break; }
  if (filaFotos.size) setTimeout(tirarFotos, 16);
}
function fotoDoKit0(id) {
  if (fotosKit[id]) return fotosKit[id];
  const r = fotoDoKit.r || (fotoDoKit.r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })); r.setSize(160, 160); r.outputColorSpace = THREE.SRGBColorSpace;
  const cena = new THREE.Scene(); cena.add(new THREE.HemisphereLight(0xffffff, 0x445566, 2.4)); const d = new THREE.DirectionalLight(0xffffff, 2); d.position.set(3, 5, 4); cena.add(d);
  const o = montarKit(id); cena.add(o); const b = new THREE.Box3().setFromObject(o), c = b.getCenter(new THREE.Vector3()), t = b.getSize(new THREE.Vector3()).length() || 1;
  const cm = new THREE.PerspectiveCamera(35, 1, 0.1, 1e5); cm.position.set(c.x + t * 0.8, c.y + t * 0.5, c.z + t * 1.1); cm.lookAt(c);
  r.setClearColor(0x1b2029, 1); r.render(cena, cm); return (fotosKit[id] = r.domElement.toDataURL("image/png"));
}
// (2026-11-17, o Thiago) os FILTROS por tipo de construção: Arquibancadas, Automóveis, Contenção, Paddock, Vegetação e Geral (biblioteca.js)
let filtroBib = "Todos", buscaBib = "";
function desenharBiblioteca() {
  const grupos = {};
  for (const [id, k] of Object.entries(KITS)) { const f = filtroDoKit(id); if (filtroBib !== "Todos" && f !== filtroBib) continue; if (buscaBib && !k.nome.toLowerCase().includes(buscaBib)) continue; (grupos[f] ||= []).push(id); }
  const chips = ["Todos", ...FILTROS].map((f) => `<button type="button" data-filtro="${h(f)}" class="${f === filtroBib ? "on" : ""}" style="padding:4px 8px;font-size:12px">${h(f)}</button>`).join("");
  $("edBib").innerHTML = `<div class="lin">${chips}</div><div class="lin"><label>Escala ao pôr <input type="number" id="edBibEsc" step="0.1" min="0.05" value="${escalaPor}"></label><small>vale para as próximas peças</small></div><div class="lin"><input id="edBibBusca" placeholder="Procurar…" value="${h(buscaBib)}" style="flex:1"></div>` + (Object.keys(grupos).length ? "" : "<small>Nada neste filtro.</small>") + FILTROS.filter((f) => grupos[f]).map((f) => [f, grupos[f]]).map(([gr, ids]) => `<small>${h(gr)}</small><div class="edBibG">${ids.map((id) => `<button type="button" data-kit="${id}" class="${assetEscolhido === "*kit:" + id ? "on" : ""}" title="${h(KITS[id].nome)}"><img src="${fotoDoKit(id)}" data-foto="${id}" alt=""><span>${h(KITS[id].nome)}</span></button>`).join("")}</div>`).join("")
    + `<small>${assetEscolhido?.startsWith("*kit:") ? "Clique no chão para pôr (pode pôr vários; Esc para)." : "Clique numa peça e depois no chão."}</small>`;
  $("edBibEsc").onchange = (e) => { escalaPor = Math.max(0.05, +e.target.value || 1); lembrar("geral", { escalaPor }); const k = assetEscolhido?.startsWith("*kit:") && assetEscolhido.slice(5); if (k) lembrar("kit:" + k, { s: escalaPor }); };
  for (const b of $("edBib").querySelectorAll("[data-kit]")) b.onclick = () => { const s0 = +lembrado("kit:" + b.dataset.kit).s; if (s0) escalaPor = s0; const k = "*kit:" + b.dataset.kit; assetEscolhido = assetEscolhido === k ? null : k; desenharBiblioteca(); desenharAssets(); desenharPlaca(); desenharTrecho(); };
  for (const b of $("edBib").querySelectorAll("[data-filtro]")) b.onclick = () => { filtroBib = b.dataset.filtro; desenharBiblioteca(); };
  $("edBibBusca").oninput = (e) => { buscaBib = e.target.value.trim().toLowerCase(); const pos = e.target.selectionStart; desenharBiblioteca(); const i = $("edBibBusca"); i.focus(); i.setSelectionRange(pos, pos); };
}
// ---------- a área (cenario-pista.js, tipo "area"): clique nos cantos do polígono; fecha clicando no primeiro, com Enter ou no botão ----------
let areaCor = "#3fa52c", areaComCor = false; // (a cor da área: tinge o material; na "cor lisa", é a cor dela)
let areaEscala = 1.2; // (2026-11-18, o Thiago: "árvore em grupo saindo COLOSSAL; põe 1,2 de padrão") a escala do que a área espalha, só dela
let areaPts = [], areaMaterial = "grama", areaEspalhar = "", areaEsp = 8, areaMistura = ["", ""];
const marcasArea = new THREE.Group(); scene.add(marcasArea);
function marcarArea() {
  marcasArea.clear(); if (!areaPts.length) return;
  for (const [k, p] of areaPts.entries()) { const m = new THREE.Mesh(new THREE.SphereGeometry(k ? 4 : 7, 12, 8), new THREE.MeshBasicMaterial({ color: k ? 0xffd23f : 0x3ddc84, depthTest: false })); m.renderOrder = 999; m.position.copy(p).y += 3; marcasArea.add(m); }
  const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([...areaPts, ...(areaPts.length > 2 ? [areaPts[0]] : [])].map((p) => p.clone().setY(p.y + 3))), new THREE.LineBasicMaterial({ color: 0xffd23f, depthTest: false })); l.renderOrder = 999; marcasArea.add(l);
}
async function fecharArea() {
  if (areaPts.length < 3) return avisar("A área precisa de pelo menos 3 cantos.", true);
  const A = areaPts[0], pts = areaPts.map((p) => [+(p.x - A.x).toFixed(2), +(p.z - A.z).toFixed(2)]);
  const o = await colocar({ tipo: "area", pts, material: areaMaterial, cor: (areaComCor || areaMaterial === "cor") ? areaCor : undefined, espalhar: areaEspalhar || undefined, mistura: areaEspalhar && areaMistura.some(Boolean) ? areaMistura.filter(Boolean) : undefined, espaco: areaEspalhar ? areaEsp : undefined, escalaEsp: areaEspalhar ? areaEscala : undefined, x: A.x, y: Math.min(...areaPts.map((p) => p.y)), z: A.z, rx: 0, ry: 0, rz: 0, s: 1 });
  areaPts = []; marcarArea(); if (o) { guardarItem(o); avisar("Área pronta. Clique para começar outra (Esc para)."); } desenharArea();
}
function desenharArea() {
  const on = assetEscolhido === "*area", el = $("edArea"); if (!el) return;
  const kits = Object.entries(KITS).map(([id, k]) => `<option value="${id}" ${areaEspalhar === id ? "selected" : ""}>${h(k.nome)}</option>`).join("");
  el.innerHTML = `<div class="lin"><button id="edArBt" class="ferr ${on ? "on" : ""}">${on ? (areaPts.length ? `${areaPts.length} cantos: clique no próximo ou no primeiro para fechar` : "Clique no primeiro canto… (Esc sai)") : "⬠ Desenhar área (polígono)"}</button></div>
    ${on && areaPts.length > 2 ? `<div class="lin"><button id="edArFim">Fechar a área (Enter)</button><button id="edArVolta">Tirar o último canto</button></div>` : ""}
    <div class="lin"><label>Cor <input type="color" id="edArCor" value="${areaCor}"></label>${areaMaterial === "cor" ? "" : `<label><input type="checkbox" id="edArComCor" ${areaComCor ? "checked" : ""}> tingir a textura</label>`}</div>
    <div class="lin"><label>Preencher <select id="edArMat">${Object.entries(MATERIAIS_AREA).map(([k, n]) => `<option value="${k}" ${k === areaMaterial ? "selected" : ""}>${h(n)}</option>`).join("")}</select></label></div>
    <div class="lin"><label>Espalhar <select id="edArKit"><option value="">Nada</option>${kits}</select></label></div>
    ${areaEspalhar ? [0, 1].map((i) => `<div class="lin"><label>+ Espécie ${i + 2} <select data-mist="${i}"><option value="">Nenhuma</option>${Object.entries(KITS).map(([id, k]) => `<option value="${id}" ${areaMistura[i] === id ? "selected" : ""}>${h(k.nome)}</option>`).join("")}</select></label></div>`).join("") : ""}
    ${areaEspalhar ? `<div class="lin"><label>Um a cada (m) <input type="number" id="edArEsp" step="1" value="${areaEsp}"></label><label>Escala <input type="number" id="edArEsc" step="0.1" min="0.1" value="${areaEscala}"></label></div>` : ""}
    <small>Clique nos cantos da área no chão. Ela segue o relevo. Escolha o que cobre o chão e, se quiser, uma peça para espalhar dentro (árvores, arbustos, pedras…).</small>`;
  $("edArBt").onclick = () => { areaPts = []; marcarArea(); assetEscolhido = on ? null : "*area"; desenharArea(); desenharTrecho(); desenharLinha(); desenharZebra(); desenharBiblioteca(); };
  if ($("edArFim")) $("edArFim").onclick = fecharArea;
  if ($("edArVolta")) $("edArVolta").onclick = () => { areaPts.pop(); marcarArea(); desenharArea(); };
  $("edArMat").onchange = (e) => { areaMaterial = e.target.value; desenharArea(); };
  $("edArCor").oninput = (e) => { areaCor = e.target.value; if (areaMaterial !== "cor" && !areaComCor) { areaComCor = true; if ($("edArComCor")) $("edArComCor").checked = true; } };
  if ($("edArComCor")) $("edArComCor").onchange = (e) => { areaComCor = e.target.checked; };
  $("edArKit").onchange = (e) => { areaEspalhar = e.target.value; desenharArea(); };
  for (const s of el.querySelectorAll("[data-mist]")) s.onchange = () => { areaMistura[+s.dataset.mist] = s.value; };
  if ($("edArEsc")) $("edArEsc").onchange = (e) => { areaEscala = Math.max(0.1, +e.target.value || 1.2); };
  if ($("edArEsp")) $("edArEsp").onchange = (e) => { areaEsp = Math.max(1, +e.target.value || 8); };
}
addEventListener("keydown", (e) => {
  if (assetEscolhido !== "*area" || e.target.closest?.("input,select")) return;
  if (e.key === "Enter") { e.preventDefault(); fecharArea(); } else if (e.key === "Backspace" && areaPts.length) { e.preventDefault(); e.stopImmediatePropagation(); areaPts.pop(); marcarArea(); desenharArea(); }
}, true);
// ---------- (2026-11-17, o Thiago: "escolher o que eu quero, o lado da pista e de onde até onde vai") barreira na BEIRA da pista ----------
// o item (pneus, cerca, guard-rail, Tecpro, SAFER...), a distância da beira e o espaço; dois cliques na beira (começo e fim, do lado em que ela
// fica) e a fileira segue a pista. Vira uma "linha" com { beira: { i0, i1, lado, de } } (cenario-pista.js).
// (2026-11-18, o Thiago: "as últimas configurações de um asset específico ficam salvas") a MEMÓRIA do editor, no navegador: a escala e a cor de cada
// peça da biblioteca, a configuração de cada item da barreira na beira, a marca e o fundo das placas, a escala de pôr e o que a área espalha
const memoria = (() => { try { return JSON.parse(localStorage.getItem("editor-memoria") || "{}") || {}; } catch { return {}; } })();
function lembrar(k, v) { memoria[k] = { ...(memoria[k] || {}), ...v }; try { localStorage.setItem("editor-memoria", JSON.stringify(memoria)); } catch {} }
const lembrado = (k) => memoria[k] || {};
let escalaPor = +lembrado("geral").escalaPor || 1; // (a escala das peças que vão ser postas: escolhida antes, vale para todas até mudar)
let beiraFundo2 = ""; // (a faixa: o fundo do painel alternado; vazio = o mesmo)
let beiraMarca2 = "", beiraFaixaAlt = 1, beiraElev = 0.3; // (a faixa de patrocínio na beira: a segunda marca, a altura e a distância do chão)
let beiraA = null, beiraModelo = "kit:guardrail", beiraDist = 4, beiraEsp = 10, beiraAlt = 3, beiraMureta = true;
beiraModelo = lembrado("beira").modelo || beiraModelo; carregarBeira(); // (volta com o último item e a configuração dele)
const espacoDoModelo = (m) => ({ "kit:guardrail": 10, "kit:guardrailTriplo": 8, "kit:mureta": 10, "kit:muretaAlambrado": 10, "kit:safer": 8, "kit:newJersey": 4, "kit:tecproModulo": 5, "kit:tecpro": 5, "kit:grade": 10, "kit:gradePlacas": 6, "kit:muroConcretoTela": 6, "kit:fardos": 2.6, "kit:pneus": 5.4, cerca: 3, pneus: 4, faixa: 6, faixaTela: 6 })[m] || (m.startsWith("kit:pneus") ? 4 : null);
// (2026-11-18, o Thiago: "nas cercas, conseguir ver uma prévia do que estou pegando") três módulos do item escolhido, com as marcas, os fundos e a
// altura de agora, numa miniatura em cima do painel
let previaVez = 0;
function guardarBeira() { lembrar("beira", { modelo: beiraModelo }); lembrar("beira:" + beiraModelo, { beiraDist, beiraEsp, beiraAlt, beiraFaixaAlt, beiraElev, beiraMarca2, beiraFundo2, beiraMureta, placaMarca, placaFundo }); }
function carregarBeira() { const m = lembrado("beira:" + beiraModelo); ({ beiraDist = beiraDist, beiraEsp = beiraEsp, beiraAlt = beiraAlt, beiraFaixaAlt = beiraFaixaAlt, beiraElev = beiraElev, beiraMarca2 = beiraMarca2, beiraFundo2 = beiraFundo2, beiraMureta = beiraMureta, placaMarca = placaMarca, placaFundo = placaFundo } = m); }
async function previaBeira() {
  const img = $("edBePrev"); if (!img) return; const vez = ++previaVez, esp = Math.max(0.5, beiraEsp);
  const it = { tipo: "linha", pts: [[0, 0], null, [esp * 3 * M_PARA_U, 0]], modelo: beiraModelo, espaco: esp, altura: /^faixa/.test(beiraModelo) ? beiraFaixaAlt : beiraAlt, mureta: (beiraModelo === "cerca" && beiraMureta) || undefined, ...(/^faixa/.test(beiraModelo) ? { marca: placaMarca, marca2: beiraMarca2 || undefined, fundo: placaFundo, fundo2: beiraFundo2 || undefined, elev: beiraElev } : {}) };
  const k = "beira:" + JSON.stringify(it); if (fotosDe[k]) { img.src = fotosDe[k]; return; }
  const o = await montarItem(it, null); if (vez !== previaVez || !o) return; img.src = fotoDaPeca(k, o, 300, 120);
}
function desenharBeira() {
  const el = $("edBeira"); if (!el) return; const on = assetEscolhido === "*beira";
  const opt = (v, n) => `<option value="${v}" ${v === beiraModelo ? "selected" : ""}>${h(n)}</option>`;
  const contencao = Object.entries(KITS).filter(([id]) => filtroDoKit(id) === "Contenção"), outros = Object.entries(KITS).filter(([id]) => filtroDoKit(id) !== "Contenção");
  el.innerHTML = `<div class="lin" style="justify-content:center"><img id="edBePrev" alt="" style="width:100%;max-width:300px;height:120px;object-fit:contain;border-radius:8px;background:#1b2029"></div><div class="lin"><label style="flex:1">Item <select id="edBeM" style="flex:1">${opt("faixa", "Faixa de patrocínio (sem pés)")}${opt("faixaTela", "Faixa de patrocínio com tela e arame")}${opt("pneus", "Pneus (módulo vermelho)")}${opt("cerca", "Cerca (alambrado)")}${opt("pilares", "Pilares")}${opt("parede", "Parede (altura e largura)")}
      <optgroup label="Contenção">${contencao.map(([id, k]) => opt("kit:" + id, k.nome)).join("")}</optgroup><optgroup label="Outras peças">${outros.map(([id, k]) => opt("kit:" + id, k.nome)).join("")}</optgroup></select></label></div>
    <div class="lin"><label>Da beira (m) <input type="number" id="edBeD" step="0.5" value="${beiraDist}"></label><label>Espaço (m) <input type="number" id="edBeE" step="0.5" value="${beiraEsp}"></label></div>
    ${/^faixa/.test(beiraModelo) ? `<div class="lin"><label>Marca <select id="edBeMa">${opcoesDeMarca(placaMarca)}</select></label><label>Alternar com <select id="edBeMa2"><option value="">nenhuma</option>${opcoesDeMarca(beiraMarca2)}</select></label></div>
    <div class="lin"><label>Fundo <input type="color" id="edBeFu" value="${placaFundo}"></label><label><input type="checkbox" id="edBeAlt" ${beiraFundo2 ? "checked" : ""}> alternar com</label><input type="color" id="edBeFu2" value="${beiraFundo2 || "#1e5bd6"}" ${beiraFundo2 ? "" : "disabled"}><label>Altura (m) <input type="number" id="edBeFA" step="0.1" value="${beiraFaixaAlt}"></label><label>Do chão (m) <input type="number" id="edBeEl" step="0.1" value="${beiraElev}"></label></div>` : ""}
    ${beiraModelo === "cerca" || beiraModelo === "pilares" || beiraModelo === "parede" ? `<div class="lin"><label>Altura (m) <input type="number" id="edBeA" step="0.5" value="${beiraAlt}"></label>${beiraModelo === "parede" ? `<label>Largura (m) <input type="number" id="edBeL" step="0.1" value="${linhaLarg}"></label>` : ""}${beiraModelo === "cerca" ? `<label><input type="checkbox" id="edBeMu" ${beiraMureta ? "checked" : ""}> Mureta embaixo</label>` : ""}</div>` : ""}
    <div class="lin"><button id="edBeBt" class="ferr ${on ? "on" : ""}">${on ? (beiraA ? "Clique onde TERMINA… (Esc sai)" : "Clique na beira onde COMEÇA…") : "▥ Pôr barreira na beira da pista"}</button></div>
    <small>1. escolha o item e a distância · 2. clique na beira da pista onde começa, do lado em que ela fica · 3. clique onde termina. A fileira segue a curva sozinha (pode dar a volta).</small>`;
  $("edBeM").onchange = (e) => { beiraModelo = e.target.value; const s = espacoDoModelo(beiraModelo); if (s) beiraEsp = s; carregarBeira(); desenharBeira(); };
  $("edBeD").onchange = (e) => { beiraDist = +e.target.value || 0; };
  if ($("edBeMa")) { $("edBeMa").onchange = (e) => { placaMarca = e.target.value; }; $("edBeMa2").onchange = (e) => { beiraMarca2 = e.target.value; }; $("edBeFu").onchange = (e) => { placaFundo = e.target.value; };
    $("edBeAlt").onchange = (e) => { beiraFundo2 = e.target.checked ? $("edBeFu2").value : ""; $("edBeFu2").disabled = !e.target.checked; }; $("edBeFu2").onchange = (e) => { beiraFundo2 = e.target.value; };
    $("edBeFA").onchange = (e) => { beiraFaixaAlt = Math.max(0.2, +e.target.value || 1); }; $("edBeEl").onchange = (e) => { beiraElev = Math.max(0, +e.target.value || 0); }; }
  $("edBeE").onchange = (e) => { beiraEsp = Math.max(0.5, +e.target.value || 4); };
  el.onchange = () => setTimeout(() => { guardarBeira(); previaBeira(); }); previaBeira(); // (a prévia do que vai ser posto: refeita a cada mudança)
  if ($("edBeL")) $("edBeL").onchange = (e) => { linhaLarg = Math.max(0.1, +e.target.value || 0.5); };
  if ($("edBeA")) $("edBeA").onchange = (e) => { beiraAlt = Math.max(0.3, +e.target.value || 3); };
  if ($("edBeMu")) $("edBeMu").onchange = (e) => { beiraMureta = e.target.checked; };
  $("edBeBt").onclick = () => { beiraA = null; assetEscolhido = on ? null : "*beira"; desenharBeira(); desenharZebra(); desenharLinha(); desenharTrecho(); desenharBiblioteca(); };
}
// ---------- desenhar pista de cenário (cenario-pista.js, tipo "trecho"): clique no início, no fim e (com curva) por onde ela passa ----------
let trechoPts = [], trechoCurva = true, trechoZebra = true, trechoEmendar = true, trechoLarg = Math.round(tr.W || 60);
const marcasTrecho = new THREE.Group(); scene.add(marcasTrecho);
function marcarTrecho() {
  marcasTrecho.clear();
  for (const [k, p] of trechoPts.entries()) { const m = new THREE.Mesh(new THREE.SphereGeometry(6, 12, 8), new THREE.MeshBasicMaterial({ color: k === 0 ? 0x3ddc84 : k === 1 ? 0xff5252 : 0xffd23f, depthTest: false })); m.renderOrder = 999; m.position.copy(p).y += 3; marcasTrecho.add(m); }
}
// (2026-11-17, o Thiago: "facilitar a colocação de zebras") a zebra segue a beira da pista: dois cliques na beira, do lado em que ela fica
let zebraLarg = 10, zebraDentro = 2;
function desenharZebra() {
  const on = assetEscolhido === "*zebra";
  $("edZebra").innerHTML = `<div class="lin"><button id="edZbBt" class="ferr ${on ? "on" : ""}">${on ? (escapeA ? "Clique onde ela TERMINA… (Esc sai)" : "Clique onde ela COMEÇA… (Esc sai)") : "▰▱ Pôr zebra"}</button></div>
    <div class="lin"><label>Largura <input type="number" id="edZbL" step="1" value="${zebraLarg}"></label><label>Entra na pista <input type="number" id="edZbD" step="1" value="${zebraDentro}"></label></div>
    <small>Clique na beira da pista onde a zebra começa e depois onde termina, do mesmo lado. Ela segue a curva sozinha.</small>`;
  $("edZbBt").onclick = () => { escapeA = null; assetEscolhido = on ? null : "*zebra"; desenharZebra(); desenharEscape(); desenharLinha(); desenharTrecho(); desenharBiblioteca(); };
  $("edZbL").onchange = (e) => { zebraLarg = Math.max(2, +e.target.value || 10); };
  $("edZbD").onchange = (e) => { zebraDentro = +e.target.value || 0; };
}
// a linha de itens: o modelo, o espaçamento e a altura (em metros); reta com 2 cliques, curva com 3
let linhaModelo = "pneus", linhaEsp = 4, linhaAlt = 3, linhaCurva = false, linhaMureta = true, linhaLarg = 0.5; // (linhaLarg: a espessura da parede, nas duas ferramentas)
function desenharLinha() {
  const on = assetEscolhido === "*linha", passo = ["Clique no INÍCIO…", "Clique no FIM…", "Clique por onde a CURVA passa…"][trechoPts.length] || "";
  const kits = Object.entries(KITS).map(([id, k]) => `<option value="kit:${id}" ${linhaModelo === "kit:" + id ? "selected" : ""}>${h(k.nome)}</option>`).join("");
  $("edLinha").innerHTML = `<div class="lin"><button id="edLnBt" class="ferr ${on ? "on" : ""}">${on ? passo + " (Esc sai)" : "⋯ Desenhar linha de itens"}</button></div>
    <div class="lin"><label>Item <select id="edLnM"><option value="pneus" ${linhaModelo === "pneus" ? "selected" : ""}>Pneus (módulo vermelho)</option><option value="cerca" ${linhaModelo === "cerca" ? "selected" : ""}>Cerca (alambrado)</option><option value="pilares" ${linhaModelo === "pilares" ? "selected" : ""}>Pilares</option><option value="parede" ${linhaModelo === "parede" ? "selected" : ""}>Parede (altura e largura)</option><optgroup label="Da biblioteca">${kits}</optgroup></select></label></div>
    <div class="lin"><label>Espaço (m) <input type="number" id="edLnE" step="0.5" value="${linhaEsp}"></label><label>Altura (m) <input type="number" id="edLnA" step="0.5" value="${linhaAlt}"></label>${linhaModelo === "parede" ? `<label>Largura (m) <input type="number" id="edLnL" step="0.1" value="${linhaLarg}"></label>` : ""}</div>
    <div class="lin"><label><input type="radio" name="edLnT" value="reta" ${linhaCurva ? "" : "checked"}> Reta</label><label><input type="radio" name="edLnT" value="curva" ${linhaCurva ? "checked" : ""}> Curva</label>${linhaModelo === "cerca" ? `<label><input type="checkbox" id="edLnMu" ${linhaMureta ? "checked" : ""}> Mureta embaixo</label>` : ""}<label><input type="checkbox" id="edLnEm" ${trechoEmendar ? "checked" : ""}> Emendar</label></div>
    <small>Defina a linha com os cliques: ele distribui os itens nela, um a cada "Espaço". Na cerca, os postes ficam no espaço e a tela tem a altura escolhida.</small>`;
  $("edLnBt").onclick = () => { trechoPts = []; marcarTrecho(); assetEscolhido = on ? null : "*linha"; desenharLinha(); desenharTrecho(); desenharZebra(); desenharBiblioteca(); };
  $("edLnM").onchange = (e) => { linhaModelo = e.target.value; if (linhaModelo === "cerca") linhaEsp = Math.max(linhaEsp, 3); desenharLinha(); };
  if ($("edLnL")) $("edLnL").onchange = (e) => { linhaLarg = Math.max(0.1, +e.target.value || 0.5); };
  $("edLnE").onchange = (e) => { linhaEsp = Math.max(0.5, +e.target.value || 4); };
  $("edLnA").onchange = (e) => { linhaAlt = Math.max(0.3, +e.target.value || 3); };
  for (const r of $("edLinha").querySelectorAll("[name=edLnT]")) r.onchange = () => { linhaCurva = r.value === "curva"; if (trechoPts.length > 2) trechoPts.length = 2; desenharLinha(); };
  if ($("edLnMu")) $("edLnMu").onchange = (e) => { linhaMureta = e.target.checked; };
  $("edLnEm").onchange = (e) => { trechoEmendar = e.target.checked; };
}
function desenharTrecho() {
  const on = assetEscolhido === "*trecho", passo = ["Clique no INÍCIO…", "Clique no FIM…", "Clique por onde a CURVA passa…"][trechoPts.length] || "";
  $("edTrecho").innerHTML = `<div class="lin"><button id="edTrBt" class="ferr ${on ? "on" : ""}">${on ? passo + " (Esc sai)" : "Desenhar trecho"}</button></div>
    <div class="lin"><label><input type="radio" name="edTrT" value="reta" ${trechoCurva ? "" : "checked"}> Reta (2 cliques)</label><label><input type="radio" name="edTrT" value="curva" ${trechoCurva ? "checked" : ""}> Curva (3 cliques)</label></div>
    <div class="lin"><label>Largura <input type="number" id="edTrL" step="5" value="${trechoLarg}"></label><label><input type="checkbox" id="edTrZ" ${trechoZebra ? "checked" : ""}> Zebras</label><label><input type="checkbox" id="edTrE" ${trechoEmendar ? "checked" : ""}> Emendar</label></div>
    <small>Só enfeite: o carro não anda nele. Curva: início (verde), fim (vermelho) e o ponto por onde ela passa (amarelo). Com "Emendar", o próximo trecho começa onde este acabou.</small>`;
  $("edTrBt").onclick = () => { trechoPts = []; marcarTrecho(); assetEscolhido = on ? null : "*trecho"; desenharTrecho(); desenharLinha(); desenharZebra(); desenharBiblioteca(); desenharPlaca(); desenharAssets(); };
  for (const r of $("edTrecho").querySelectorAll("[name=edTrT]")) r.onchange = () => { trechoCurva = r.value === "curva"; if (trechoPts.length > 2) trechoPts.length = 2; desenharTrecho(); };
  $("edTrL").onchange = (e) => { trechoLarg = Math.max(4, +e.target.value || 60); };
  $("edTrZ").onchange = (e) => { trechoZebra = e.target.checked; };
  $("edTrE").onchange = (e) => { trechoEmendar = e.target.checked; };
}
// ---------- peças das outras pistas (2026-11-16, o Thiago: "a biblioteca deve ter item de todas as pistas") ----------
// escolhe a pista; ela é montada aqui sem entrar na cena (sem juntar as malhas, como no editor) e as peças dela (os grupos e malhas com nome,
// de um tamanho que dá para pôr) aparecem com miniatura. Pôr uma: ela é gravada como asset leve (assets/<pista>-<nome>.glb, em metros) e
// entra como qualquer asset; a segunda vez já usa o arquivo.
let dePista = null, pecasDe = [];
const fotosDe = {};
function fotoDaPeca(k, o, w = 96, hh = 96) {
  if (fotosDe[k]) return fotosDe[k];
  const r = fotoDoKit.r || (fotoDoKit.r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })); r.setSize(w, hh); r.outputColorSpace = THREE.SRGBColorSpace;
  const cena = new THREE.Scene(); cena.add(new THREE.HemisphereLight(0xffffff, 0x445566, 2.4)); const d = new THREE.DirectionalLight(0xffffff, 2); d.position.set(3, 5, 4); cena.add(d);
  const c0 = o.clone(true); c0.position.set(0, 0, 0); c0.updateMatrixWorld(true); cena.add(c0); const b = new THREE.Box3().setFromObject(c0), c = b.getCenter(new THREE.Vector3()), t = b.getSize(new THREE.Vector3()).length() || 1;
  const cm = new THREE.PerspectiveCamera(35, w / hh, 0.1, 1e6); cm.position.set(c.x + t * 0.8, c.y + t * 0.5, c.z + t * 1.1); if (w > hh) cm.position.set(c.x + t * 0.25, c.y + t * 0.18, c.z + t * 0.95); cm.lookAt(c);
  r.setClearColor(0x1b2029, 1); r.render(cena, cm); return (fotosDe[k] = r.domElement.toDataURL("image/png"));
}
function lerPecas(id) {
  const outra = buildTrack(id), lista = [], vistos = new Set(), caixa = new THREE.Box3(), tam = new THREE.Vector3();
  outra.grp.updateMatrixWorld(true);
  const olhar = (g, prof) => { for (const o of g.children) {
    if (o === outra.cenarioEditor || !o.visible) continue;
    caixa.setFromObject(o); if (caixa.isEmpty()) continue; caixa.getSize(tam); const diag = tam.length();
    const util = (o.isGroup || o.isMesh) && o.name && diag > 12 && diag < 1500 && !/terreno|ceu|sky|faixa|chao|mar|agua|grama|relevo|predios|telhados|asfalto|muro/i.test(o.name);
    const assinatura = o.name + ":" + Math.round(diag / 10);
    if (util && !vistos.has(assinatura)) { vistos.add(assinatura); lista.push({ k: id + "|" + lista.length, nome: o.name.replace(/^[a-z]+-/, ""), o }); }
    if (o.isGroup && prof < 2 && lista.length < 80) olhar(o, prof + 1);
  } };
  olhar(outra.grp, 0);
  return lista.slice(0, 60);
}
function desenharDe() {
  const el = $("edDe");
  el.innerHTML = `<div class="lin"><select id="edDeSel"><option value="">Escolha a pista…</option>${Object.keys(PISTAS).map((id) => `<option value="${id}" ${id === dePista ? "selected" : ""}>${h(PISTAS[id].name || id)}</option>`).join("")}</select></div>
    ${dePista ? `<div class="edBibG">${pecasDe.map((p) => `<button type="button" data-de="${h(p.k)}" class="${assetEscolhido === "*de:" + p.k ? "on" : ""}" title="${h(p.nome)}"><img src="${fotoDaPeca(p.k, p.o)}" alt=""><span>${h(p.nome)}</span></button>`).join("") || "<small>Nada para pegar nesta pista.</small>"}</div>` : "<small>As peças de cada pista (prédios, marcos, enfeites) para pôr nesta.</small>"}`;
  $("edDeSel").onchange = (e) => { dePista = e.target.value || null; avisar(dePista ? "Montando a pista para ler as peças…" : ""); setTimeout(() => { pecasDe = dePista ? lerPecas(dePista) : []; desenharDe(); avisar(dePista ? `${pecasDe.length} peças de ${PISTAS[dePista].name}` : ""); }, 30); };
  for (const b of el.querySelectorAll("[data-de]")) b.onclick = () => { const k = "*de:" + b.dataset.de; assetEscolhido = assetEscolhido === k ? null : k; desenharDe(); desenharBiblioteca(); desenharPlaca(); desenharAssets(); };
}
const assetsDe = {};
async function assetDaPeca(k) {
  if (assetsDe[k]) return assetsDe[k];
  const p = pecasDe.find((q) => q.k === k); if (!p) return null;
  const nome = (dePista + "-" + p.nome).toLowerCase().replace(/[^a-z0-9_-]/g, "-").slice(0, 60);
  if (assets.leves.some((a) => a.nome === nome)) return (assetsDe[k] = nome);
  avisar(`Gravando ${nome}…`);
  const c = p.o.clone(true); c.position.set(0, 0, 0); c.rotation.set(0, 0, 0); c.scale.multiplyScalar(1 / M_PARA_U); /* (mantém a escala que a peça tinha na pista dela) */ c.updateMatrixWorld(true);
  try { const bin = await new GLTFExporter().parseAsync(c, { binary: true }); await api("asset/" + encodeURIComponent(nome), { method: "POST", headers: { "content-type": "application/octet-stream" }, body: bin }); await recarregarAssets(); avisar(`Pronto: assets/${nome}.glb`); return (assetsDe[k] = nome); }
  catch (e) { avisar("Não gravou: " + e.message, true); return null; }
}
function desenharEscape() {
  $("edEsc").innerHTML = `<div class="lin"><label>Padrão <select id="edEscP">${Object.entries(PADROES_ESCAPE).map(([k, n]) => `<option value="${k}" ${k === escapePadrao ? "selected" : ""}>${h(n)}</option>`).join("")}</select></label></div>
    <div class="lin"><label>Largura <input type="number" id="edEscL" step="5" value="${escapeLarg}"></label><label>Depois da zebra <input type="number" id="edEscD" step="1" value="${escapeDe}"></label></div>
    <div class="lin"><label>Marca <select id="edEscM"><option value="-" ${escapeMarca === "-" ? "selected" : ""}>Sem marca</option>${escapePadrao === "laranja" ? `<option value="" ${escapeMarca === "" ? "selected" : ""}>GALERA</option>` : ""}${opcoesDeMarca(escapeMarca)}</select></label>
    ${escapePadrao !== "laranja" ? `<label>Placa <input type="color" id="edEscF" value="${escapeFundo || "#101114"}"></label><label><input type="checkbox" id="edEscSemF" ${escapeFundo ? "" : "checked"}> direto no chão</label>` : ""}</div>
    <div class="lin"><button id="edEscBt" class="${assetEscolhido === "*escape" ? "on" : ""}">${assetEscolhido === "*escape" ? (escapeA ? "Clique onde termina…" : "Clique onde começa…") : "Desenhar área de escape"}</button></div>
    <small>Clique na beira da pista onde a área começa e depois onde termina, do lado em que ela fica. Ela segue a curva sozinha.</small>`;
  $("edEscP").onchange = (e) => { escapePadrao = e.target.value; desenharEscape(); };
  $("edEscL").onchange = (e) => { escapeLarg = Math.max(4, +e.target.value || 60); };
  $("edEscD").onchange = (e) => { escapeDe = +e.target.value || 0; };
  if ($("edEscM")) $("edEscM").onchange = (e) => { escapeMarca = e.target.value; };
  if ($("edEscF")) $("edEscF").onchange = (e) => { escapeFundo = e.target.value; desenharEscape(); };
  if ($("edEscSemF")) $("edEscSemF").onchange = (e) => { escapeFundo = e.target.checked ? "" : "#101114"; desenharEscape(); };
  $("edEscBt").onclick = () => { escapeA = null; assetEscolhido = assetEscolhido === "*escape" ? null : "*escape"; desenharEscape(); desenharBiblioteca(); desenharPlaca(); desenharAssets(); };
}
function desenharPlaca() {
  $("edPlaca").innerHTML = `<div class="lin"><img src="${miniaturaDoPatrocinio(placaMarca)}" alt="" style="height:30px;border-radius:6px"><select id="edPlMarca">${opcoesDeMarca(placaMarca)}</select></div>
    <div class="lin"><label>Fundo <input type="color" id="edPlFundo" value="${placaFundo}"></label><button id="edPlPor" class="${assetEscolhido === "*placa" ? "on" : ""}">${assetEscolhido === "*placa" ? "Clique no chão… (Esc sai)" : "Pôr placa"}</button><button id="edMcPor" class="${assetEscolhido === "*marcaChao" ? "on" : ""}">${assetEscolhido === "*marcaChao" ? "Clique no chão… (Esc sai)" : "Pôr marca no chão"}</button><label><input type="checkbox" id="edMcSem" ${placaSemFundo ? "checked" : ""}> sem fundo</label><button id="edPtPor" class="${assetEscolhido === "*portico" ? "on" : ""}">${assetEscolhido === "*portico" ? "Clique no chão… (Esc sai)" : "Pôr pórtico"}</button></div>
    <small>O pórtico encaixa sozinho atravessado na pista, no ponto mais perto do clique. 1. escolha a marca e o fundo · 2. clique em Pôr placa · 3. clique no chão (pode pôr várias; Esc para) · a placa nasce virada para você e grande o bastante para ver daí</small>`;
  $("edPlMarca").onchange = (e) => { placaMarca = e.target.value; desenharPlaca(); };
  $("edPlFundo").onchange = (e) => { placaFundo = e.target.value; };
  $("edPlPor").onclick = () => { assetEscolhido = assetEscolhido === "*placa" ? null : "*placa"; desenharPlaca(); desenharAssets(); desenharBiblioteca(); };
  $("edMcPor").onclick = () => { assetEscolhido = assetEscolhido === "*marcaChao" ? null : "*marcaChao"; desenharPlaca(); desenharAssets(); desenharBiblioteca(); };
  $("edMcSem").onchange = (e) => { placaSemFundo = e.target.checked; };
  $("edPtPor").onclick = () => { assetEscolhido = assetEscolhido === "*portico" ? null : "*portico"; desenharPlaca(); desenharAssets(); desenharBiblioteca(); }; // (o pórtico: a mesma marca e o mesmo fundo, por cima da pista)
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
  const placa = it.tipo === "placa" || it.tipo === "marcaChao";
  el.innerHTML = `<div class="lin"><b>${h(placa ? (it.tipo === "marcaChao" ? "Marca no chão · " : "Placa · ") + nomeDaMarca(it.marca) : it.tipo === "kit" ? "📦 " + (KITS[it.kit]?.nome || it.kit) : it.tipo === "grupo" ? "Grupo" : it.tipo === "trecho" ? "Trecho de pista (cenário)" : it.tipo === "linha" ? "Linha de " + (it.modelo || "").replace("kit:", "") : it.tipo === "area" ? "Área · " + (MATERIAIS_AREA[it.material] || "") : it.tipo === "escape" ? "Área de escape" : it.asset)}</b></div>
    ${it.tipo === "area" ? `<div class="lin"><label>Preencher <select data-pl="material">${Object.entries(MATERIAIS_AREA).map(([k, n]) => `<option value="${k}" ${k === it.material ? "selected" : ""}>${h(n)}</option>`).join("")}</select></label></div><div class="lin"><label>Espalhar <select data-pl="espalhar"><option value="">Nada</option>${Object.entries(KITS).map(([id, k]) => `<option value="${id}" ${id === it.espalhar ? "selected" : ""}>${h(k.nome)}</option>`).join("")}</select></label><label>A cada (m) <input type="number" step="1" data-pl="espaco" value="${it.espaco || 8}"></label><label>Escala <input type="number" step="0.1" data-esc-esp value="${it.escalaEsp || 1}"></label></div>${it.espalhar ? [0, 1].map((i) => `<div class="lin"><label>+ Espécie ${i + 2} <select data-mist="${i}"><option value="">Nenhuma</option>${Object.entries(KITS).map(([id, k]) => `<option value="${id}" ${(it.mistura || [])[i] === id ? "selected" : ""}>${h(k.nome)}</option>`).join("")}</select></label></div>`).join("") : ""}` : ""}
    ${it.tipo === "marcaChao" ? `<div class="lin"><label>Grudar em <select data-pl="grampo"><option value="pista" ${it.grampo === "pista" ? "selected" : ""}>Pista (asfalto, zebra, calçada)</option><option value="solo" ${(it.grampo || "solo") === "solo" ? "selected" : ""}>Solo (relevo)</option><option value="livre" ${it.grampo === "livre" ? "selected" : ""}>Livre (usa o Y)</option></select></label><label>Acima (m) <input type="number" step="0.05" data-alt value="${it.alt || 0}"></label></div>` : ""}
    ${it.tipo === "linha" && /^faixa/.test(it.modelo || "") ? `<div class="lin"><label>Marca <select data-pl="marca">${opcoesDeMarca(it.marca)}</select></label><label>Fundo <input type="color" data-pl="fundo" value="${it.fundo || "#101114"}"></label></div>` : ""}
    ${it.tipo === "linha" && it.modelo === "parede" ? `<div class="lin"><label>Largura (m) <input type="number" step="0.1" data-num="larg" value="${it.larg || 0.5}"></label></div>` : ""}
    ${it.tipo === "kit" && KITS[it.kit]?.angulo ? `<div class="lin"><label>Ângulo (°) <input type="range" min="10" max="340" step="1" data-ang value="${it.angulo ?? KITS[it.kit].angulo}"></label><span id="edAngV">${it.angulo ?? KITS[it.kit].angulo}°</span></div>` : ""}
    ${it.tipo === "portico" ? `<div class="lin"><label><input type="checkbox" data-sem ${it.semaforo ? "checked" : ""}> Com semáforo</label><label>Vão <input type="number" step="5" data-num="w" value="${it.w || 150}"></label><label>Altura <input type="number" step="1" data-num="alto" value="${it.alto || 32}"></label></div>` : ""}
    ${it.tipo === "linha" ? `<div class="lin"><label>Espaço (m) <input type="number" step="0.5" data-pl="espaco" value="${it.espaco || 4}"></label><label>Altura (m) <input type="number" step="0.5" data-pl="altura" value="${it.altura || 3}"></label></div>` : ""}
    ${it.tipo === "trecho" ? `<div class="lin"><label>Largura <input type="number" step="5" data-pl="largura" value="${it.largura || 60}"></label><button data-trz>${it.zebra ? "Tirar zebras" : "Pôr zebras"}</button></div>` : ""}
    ${placa ? `<div class="lin"><select data-pl="marca">${opcoesDeMarca(it.marca)}</select><label>Fundo <input type="color" data-pl="fundo" value="${it.fundo || "#101114"}"></label></div>
    <div class="lin"><label>Largura <input type="number" step="5" data-pl="w" value="${it.w || 60}"></label>${it.tipo === "marcaChao" ? `<label>Altura/largura <input type="number" step="0.05" data-pl="prop" value="${it.prop || 0.3}"></label><button data-semfundo>${it.fundo ? "Tirar o fundo" : "Pôr fundo"}</button>` : ""}<label ${it.tipo === "marcaChao" ? "hidden" : ""}>Altura dos postes <input type="number" step="1" data-pl="alto" value="${it.alto ?? 14}"></label></div>` : ""}
    <div class="lin">${n("x", o.position.x, 1)}${n("y", o.position.y, 1)}${n("z", o.position.z, 1)}</div>
    <div class="lin">${n("giro", deg(o.rotation.y), 5)}${n("escala", o.scale.x, 0.1)}</div>
    <div class="lin"><label>Cor <input type="color" data-cor value="${it.cor || "#ffffff"}"></label><button data-semcor>Cor original</button></div>
    <div id="edAcab"></div>
    <div class="lin"><button data-a="g">No chão (G)</button><button data-a="d">Duplicar (D)</button><button data-a="del">Apagar</button></div>
    <div class="lin"><button data-esp="x" class="${it.espelho === "x" ? "on" : ""}">⇋ Espelhar (lado)</button><button data-esp="z" class="${it.espelho === "z" ? "on" : ""}">⇵ Espelhar (frente)</button></div>`;
  for (const i of el.querySelectorAll("[data-c]")) i.onchange = () => {
    const v = +i.value; if (!Number.isFinite(v)) return;
    if (i.dataset.c === "giro") o.rotation.y = (v * Math.PI) / 180; else if (i.dataset.c === "escala") { o.scale.setScalar(Math.max(0.01, v)); if (it.tipo === "kit") lembrar("kit:" + it.kit, { s: +o.scale.x.toFixed(3) }); } else o.position[i.dataset.c] = v;
    guardarItem(o);
  };
  for (const c of el.querySelectorAll("[data-pl]")) c.onchange = () => { const v = c.dataset.pl === "prop" ? Math.max(0.05, +c.value || 0.3) : c.type === "number" ? Math.max(1, +c.value || 1) : c.value; refazerItem(o, { [c.dataset.pl]: v }); };
  for (const s of el.querySelectorAll("[data-mist]")) s.onchange = () => { const m = [...(it.mistura || ["", ""])]; m[+s.dataset.mist] = s.value; refazerItem(o, { mistura: m.filter(Boolean).length ? m.filter(Boolean) : undefined }); };
  if (el.querySelector("[data-esc-esp]")) el.querySelector("[data-esc-esp]").onchange = (e) => refazerItem(o, { escalaEsp: Math.max(0.1, +e.target.value || 1.2) });
  for (const c of el.querySelectorAll("[data-num]")) c.onchange = () => refazerItem(o, { [c.dataset.num]: Math.max(0.1, +c.value || 0.5) });
  const ang = el.querySelector("[data-ang]"); if (ang) { ang.oninput = () => { $("edAngV").textContent = ang.value + "°"; }; ang.onchange = () => refazerItem(o, { angulo: +ang.value }); }
  const sem = el.querySelector("[data-sem]"); if (sem) sem.onchange = () => refazerItem(o, { semaforo: sem.checked || undefined });
  if (el.querySelector("[data-alt]")) el.querySelector("[data-alt]").onchange = (e) => refazerItem(o, { alt: +e.target.value || undefined });
  if (el.querySelector("[data-semfundo]")) el.querySelector("[data-semfundo]").onclick = () => refazerItem(o, { fundo: it.fundo ? "" : "#101114" });
  if (el.querySelector("[data-trz]")) el.querySelector("[data-trz]").onclick = () => refazerItem(o, { zebra: !it.zebra || undefined });
  el.querySelector("[data-cor]").onchange = (e) => { if (it.tipo === "kit") lembrar("kit:" + it.kit, { cor: e.target.value }); trocarCor(o, e.target.value); };
  el.querySelector("[data-semcor]").onclick = () => trocarCor(o, null);
  painelAcabamento($("edAcab"), o, it.acab, (acab, previa) => { if (!previa) it.acab = acab || undefined; aplicarAcabamento(o, acab); });
  for (const b of el.querySelectorAll("[data-a]")) b.onclick = () => dispatchEvent(new KeyboardEvent("keydown", { key: b.dataset.a === "del" ? "Delete" : b.dataset.a }));
  for (const b of el.querySelectorAll("[data-esp]")) b.onclick = () => refazerItem(o, { espelho: it.espelho === b.dataset.esp ? undefined : b.dataset.esp });
}
function desenharPeca(o, soNumeros) {
  const el = $("edItem"), deg = (r) => (r * 180) / Math.PI, n = (k, v, passo) => `<label>${k} <input type="number" step="${passo}" data-c="${k}" value="${(+v).toFixed(passo < 1 ? 2 : 0)}"></label>`;
  if (soNumeros && el.querySelector("[data-c]")) { for (const [k, v] of [["x", o.position.x], ["y", o.position.y], ["z", o.position.z], ["giro", deg(o.rotation.y)], ["escala", o.scale.x]]) { const i = el.querySelector(`[data-c="${k}"]`); if (i && document.activeElement !== i) i.value = (+v).toFixed(k === "escala" ? 2 : 0); } return; }
  el.innerHTML = `<div class="lin"><b>${h(o.name || o.type)}</b> <small>peça da pista · ${h(chaveDe(tr, o))}</small></div>
    <div class="lin">${n("x", o.position.x, 1)}${n("y", o.position.y, 1)}${n("z", o.position.z, 1)}</div>
    <div class="lin">${n("giro", deg(o.rotation.y), 5)}${n("escala", o.scale.x, 0.1)}</div>
    <div class="lin"><button data-p="espelhar">⇋ Espelhar</button></div>
    <div class="lin"><button data-p="pai">Pegar o grupo de fora</button><button data-p="esconder">Esconder</button><button data-p="voltar">Voltar ao original</button></div>
    <div id="edAcab"></div>
    <div class="lin"><button data-p="exportar">Exportar .glb (para o Blender)</button></div>
    <small>As posições são dentro do grupo da peça. Pegue o grupo de fora para mexer num prédio inteiro.</small>`;
  for (const i of el.querySelectorAll("[data-c]")) i.onchange = () => { const v = +i.value; if (!Number.isFinite(v)) return; if (i.dataset.c === "giro") o.rotation.y = (v * Math.PI) / 180; else if (i.dataset.c === "escala") o.scale.multiplyScalar(Math.max(0.01, v) / (Math.abs(o.scale.x) || 1)); else o.position[i.dataset.c] = v; guardarPeca(o); };
  // (2026-11-16, o Thiago: "gera o glb do cassino e eu arrumo") a peça vai como está na pista (centrada no chão dela) para assets-originais/
  el.querySelector("[data-p=exportar]").onclick = async () => {
    const nome = prompt("Nome do arquivo (em assets-originais/):", (o.name || "peca").toLowerCase().replace(/[^a-z0-9_-]/g, "-")); if (!nome) return;
    const copia = o.clone(true); copia.position.set(0, 0, 0); copia.rotation.set(0, 0, 0); copia.scale.setScalar(1 / M_PARA_U); copia.updateMatrixWorld(true); // (em metros: 1 m = 4,8 u)
    try { const bin = await exportador.parseAsync(copia, { binary: true }); const r = await api("original/" + encodeURIComponent(nome), { method: "POST", headers: { "content-type": "application/octet-stream" }, body: bin }); avisar(`Exportado: assets-originais/${nome}.glb (${r.kb} KB)`); recarregarAssets(); }
    catch (e) { avisar("Não exportou: " + e.message, true); }
  };
  painelAcabamento($("edAcab"), o, o.userData.acab, (acab, previa) => { aplicarAcabamento(o, acab); if (!previa) { o.userData.acab = acab || null; guardarPeca(o); } });
  el.querySelector("[data-p=espelhar]").onclick = () => { const a = estado(o); o.scale.x *= -1; guardarPeca(o); registrar({ tipo: "mexer", o, antes: a, depois: estado(o) }); };
  el.querySelector("[data-p=pai]").onclick = () => { if (o.parent && o.parent !== tr.grp) selecionar(o.parent); };
  el.querySelector("[data-p=esconder]").onclick = () => { const a = estado(o); o.visible = false; guardarPeca(o); registrar({ tipo: "mexer", o, antes: a, depois: estado(o) }); selecionar(null); };
  el.querySelector("[data-p=voltar]").onclick = () => { const or = o.userData.original; if (or) { o.position.fromArray(or.p); o.rotation.set(or.r[0], or.r[1], or.r[2]); o.scale.fromArray(or.s); o.visible = or.v; } o.userData.acab = null; aplicarAcabamento(o, null); ajustes.delete(chaveDe(tr, o)); desenharItem(); };
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
function marcarModo() { for (const [k, m] of [["mover", "translate"], ["girar", "rotate"], ["escala", "scale"]]) barra.querySelector(`[data-barra="${k}"]`).classList.toggle("on", gizmo.mode === m); barra.querySelector('[data-barra="craft"]').classList.toggle("on", craft.ativo()); barra.querySelector('[data-barra="medir"]')?.classList.toggle("on", !!regua?.ativo()); }
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
  else if (k === "medir") regua.alternar(); else if (k === "limparMedidas") { regua.limpar(); avisar("Medidas apagadas."); }
  else if (k === "craft") $("edCraftBt").click(); else if (k === "desfazer") desfazer(); else if (k === "refazer") refazer(); else vista(k);
  marcarModo();
};
addEventListener("keydown", (e) => {
  if (e.target.closest?.("input,select") || e.shiftKey || e.ctrlKey) return;
  const v = { 1: "cima", 2: "lado", 3: "frente", 4: "v3d" }[e.key]; if (v) vista(v);
  setTimeout(marcarModo, 0);
});
marcarModo();
desenharPlaca(); desenharBiblioteca(); desenharDe(); desenharEscape(); desenharTrecho(); desenharLinha(); desenharZebra(); desenharArea(); desenharBeira(); // (a placa de patrocínio, a biblioteca e as peças das outras pistas)
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
// ---------- a régua (regua.js): Shift+R liga e desliga ----------
regua = criarRegua({ scene, cam, renderer, raio, solidos, avisar });
addEventListener("keydown", (e) => { if (e.shiftKey && e.code === "KeyR" && !e.target.closest?.("input,select")) { regua.alternar(); marcarModo(); } });
// ---------- o terreno (terreno.js): os pincéis no chão da pista ----------
terreno = criarTerreno({ scene, cam, renderer, raio, orbita, tr, pista, painel, registrar, avisar, comShift });
// ---------- o layout do TRACKSCAPE (layout.js): as mesmas seções, em abas, com o Inspetor à direita e a barra de status ----------
montarLayout({ vigiarPainel, painel, barra, ajuda, pista, nomePista: PISTAS[pista]?.name || pista, cenario, tr, pilha, refeitos, desfazer, refazer,
  selecionar: (o) => { if (!craft.ativo()) selecionar(o); }, escolhido: () => (craft.ativo() ? craft.selecionada() : selecionado) });
