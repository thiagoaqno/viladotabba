// O LIVERY STUDIO (2026-11-18, o Thiago: "imagino o editor de carros assim", com a imagem de referência). PR 1 do plano
// (planos/livery-studio.md): a casca. O carro do jogo (f1.js montarF1, o mesmo modelo e a mesma folha de pintura) num estúdio escuro, girando;
// as vistas Frente/Trás/Lado/Topo; à esquerda as PEÇAS do carro (as malhas do modelo, com o olho para esconder); à direita as PROPRIEDADES
// (cor principal e secundária, metálico, rugosidade, verniz); embaixo a gaveta Cores · Patrocinadores; e "Renderizar imagem" baixa um PNG.
// Salvar guarda a pintura no navegador (livery:<pintura>); as camadas de decal e o uso no jogo vêm nos próximos PRs.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { montarF1, f1Pronto, PINTURAS, coresDa, trocarCores } from "../f1.js";
import { PATROCINIOS, MARCAS_CAPACETE, miniaturaDoPatrocinio } from "../f1-capacetes.js";

const h = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const qs = new URLSearchParams(location.search);
let pint = PINTURAS[qs.get("livery")] ? qs.get("livery") : "touro";

// ---------- a tela ----------
const css = document.createElement("style");
css.textContent = `
:root{--bg:#111317;--pn:#181b20;--pn2:#1e2228;--ln:#2a2f37;--tx:#e8eaee;--mu:#8a93a2;--ac:#3d7bff;--ac2:#e8a33d}
body{font:13px Inter,Barlow,system-ui,sans-serif;color:var(--tx)}
#lsTopo{position:fixed;left:0;right:0;top:0;height:52px;background:var(--bg);border-bottom:1px solid #000;display:flex;align-items:center;gap:6px;padding:0 14px;z-index:5;box-sizing:border-box}
#lsTopo .logo{display:flex;align-items:center;gap:9px;font-weight:800;font-size:16px;margin-right:16px}#lsTopo .logo i{width:26px;height:26px;border-radius:7px;background:linear-gradient(135deg,#e10600,#ff6a3d);display:grid;place-items:center;font-style:normal;font-size:12px}
button,select,input{font:inherit;color:var(--tx)}
.bt{background:transparent;border:1px solid transparent;border-radius:7px;height:32px;padding:0 11px;cursor:pointer;display:inline-flex;align-items:center;gap:7px}.bt:hover{background:#22262d;border-color:var(--ln)}.bt.on{background:var(--ac);border-color:var(--ac)}
.pri{background:var(--ac);border-color:var(--ac);font-weight:700}.pri:hover{background:#5a90ff}
#lsTopo .dir{margin-left:auto;display:flex;gap:8px;align-items:center}select{background:var(--pn2);border:1px solid var(--ln);border-radius:7px;height:32px;padding:0 8px}
#lsEsq,#lsDir{position:fixed;top:52px;bottom:0;background:var(--pn);z-index:4;display:flex;flex-direction:column;box-sizing:border-box}
#lsEsq{left:0;width:280px;border-right:1px solid var(--ln)}#lsDir{right:0;width:300px;border-left:1px solid var(--ln);overflow:auto;padding:14px}
.abas{display:flex;gap:4px;padding:10px;border-bottom:1px solid var(--ln)}.abas button{flex:1;background:transparent;border:0;border-radius:7px;padding:8px 4px;color:var(--mu);cursor:pointer;font-weight:600}.abas button.on{background:#22324f;color:#cfe0ff}
#lsBusca{margin:10px;padding:8px 10px;background:var(--pn2);border:1px solid var(--ln);border-radius:7px}
#lsArv{flex:1;overflow:auto;padding:0 6px 10px}
#lsArv .no{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:6px;cursor:pointer;color:#cfd5de}#lsArv .no:hover{background:#20252c}#lsArv .no.on{background:#22324f;color:#fff}
#lsArv .no span{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#lsArv .olho{background:transparent;border:0;cursor:pointer;color:var(--mu);font-size:14px;padding:0 2px}#lsArv .olho.off{opacity:.35}
#lsArv .raiz{font-weight:700;color:var(--tx)}
#lsVistas{position:fixed;top:64px;left:296px;z-index:3;display:flex;gap:8px}#lsVistas .grp{display:flex;background:rgba(24,27,32,.9);border:1px solid var(--ln);border-radius:9px;padding:3px}
#lsDir h3{font-size:13px;margin:4px 0 12px;display:flex;align-items:center;gap:8px}#lsDir h4{font-size:12px;color:var(--mu);margin:18px 0 8px;text-transform:uppercase;letter-spacing:.08em}
.campo{display:grid;grid-template-columns:90px 1fr 42px;align-items:center;gap:8px;margin:10px 0;color:#c4cbd6}.campo input[type=range]{width:100%;accent-color:var(--ac)}.campo b{font-weight:500;text-align:right;background:var(--pn2);border-radius:5px;padding:3px 5px;font-size:12px}
.cor{display:grid;grid-template-columns:90px 34px 1fr;align-items:center;gap:8px;margin:10px 0;color:#c4cbd6}.cor input[type=color]{width:34px;height:30px;padding:0;border:1px solid var(--ln);border-radius:6px;background:none}.cor input[type=text]{background:var(--pn2);border:1px solid var(--ln);border-radius:6px;padding:6px 8px;width:100%;box-sizing:border-box}
#lsEsfera{width:100%;height:120px;border-radius:10px;background:radial-gradient(circle at 50% 40%,#2a2f38,#121418);display:block}
#lsGaveta{position:fixed;left:280px;right:300px;bottom:0;height:190px;background:var(--pn);border-top:1px solid var(--ln);z-index:4;display:flex;flex-direction:column}
#lsGaveta .abas{justify-content:flex-start}#lsGaveta .abas button{flex:none;padding:8px 14px}
#lsGav{flex:1;overflow:auto;padding:10px;display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;align-content:start}
.ficha{background:var(--pn2);border:1px solid var(--ln);border-radius:9px;padding:8px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:6px;color:#cfd5de;font-size:12px}.ficha:hover{border-color:#4a5262}.ficha.on{border-color:var(--ac);box-shadow:0 0 0 1px var(--ac)}
.ficha img{width:100%;height:46px;object-fit:contain}.ficha .dupla{width:100%;height:40px;border-radius:6px}
#lsStatus{position:fixed;left:296px;bottom:202px;z-index:3;color:var(--mu);font-size:12px;background:rgba(17,19,23,.7);padding:5px 9px;border-radius:7px}
canvas#lsCena{position:fixed;inset:0;display:block}`;
document.head.appendChild(css);
const nomeMarca = (id) => PATROCINIOS[id] || MARCAS_CAPACETE[id] || id;
document.body.insertAdjacentHTML("beforeend", `
<canvas id="lsCena"></canvas>
<div id="lsTopo"><div class="logo"><i>LS</i>Livery Studio</div>
  <button class="bt" id="lsSalvar">💾 Salvar</button><button class="bt" id="lsVoltar" title="Volta às cores da equipe">↺ Original</button>
  <div class="dir"><span style="color:var(--mu)">Pintura</span><select id="lsPint">${Object.entries(PINTURAS).filter(([k]) => k !== "propria").map(([k, p]) => `<option value="${k}" ${k === pint ? "selected" : ""}>${h(p.name)}</option>`).join("")}</select>
  <button class="bt" id="lsGirar" title="Girar sozinho">⟳ Girar</button><button class="bt pri" id="lsRender">📷 Renderizar imagem</button></div></div>
<div id="lsEsq"><div class="abas"><button class="on">🏎 Peças</button><button disabled title="No próximo PR">☰ Camadas</button></div><input id="lsBusca" placeholder="Buscar peça…"><div id="lsArv"><small style="padding:10px;color:var(--mu)">Carregando o carro…</small></div></div>
<div id="lsVistas"><div class="grp"><button class="bt" data-v="v3d" title="3D">◈</button></div><div class="grp">${["Frente", "Trás", "Lado", "Topo"].map((v) => `<button class="bt" data-v="${v}">${v}</button>`).join("")}</div></div>
<div id="lsDir"><h3>🛠 Propriedades</h3><canvas id="lsEsfera"></canvas>
  <h4>Pintura</h4>
  <div class="cor"><span>Cor base</span><input type="color" id="lsC1"><input type="text" id="lsC1t" maxlength="7"></div>
  <div class="cor"><span>Secundária</span><input type="color" id="lsC2"><input type="text" id="lsC2t" maxlength="7"></div>
  <h4>Material</h4>
  <div class="campo"><span>Metálico</span><input type="range" id="lsMet" min="0" max="100"><b id="lsMetV"></b></div>
  <div class="campo"><span>Rugosidade</span><input type="range" id="lsRug" min="0" max="100"><b id="lsRugV"></b></div>
  <div class="campo"><span>Reflexo</span><input type="range" id="lsRef" min="0" max="200"><b id="lsRefV"></b></div>
  <h4>Decals</h4><small style="color:var(--mu)">Pôr patrocinadores clicando no carro chega no próximo passo (planos/livery-studio.md).</small></div>
<div id="lsGaveta"><div class="abas"><button data-g="cores" class="on">🎨 Cores</button><button data-g="marcas">🏷 Patrocinadores</button></div><div id="lsGav"></div></div>
<div id="lsStatus">Arraste para girar · roda do mouse aproxima</div>`);
const $ = (id) => document.getElementById(id);

// ---------- o estúdio ----------
const cv = $("lsCena"), renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(2, devicePixelRatio)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x16181d); scene.fog = new THREE.Fog(0x16181d, 14, 30);
scene.add(new THREE.HemisphereLight(0xdfe6ff, 0x20232a, 1.4));
const chave = new THREE.DirectionalLight(0xffffff, 2.6); chave.position.set(4, 7, -3); chave.castShadow = true; chave.shadow.mapSize.set(2048, 2048); Object.assign(chave.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4 }); scene.add(chave);
const contra = new THREE.DirectionalLight(0x9fb8ff, 1.2); contra.position.set(-5, 3, 5); scene.add(contra);
const chao = new THREE.Mesh(new THREE.CircleGeometry(12, 64).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x24272d, roughness: 0.35, metalness: 0.4 })); chao.receiveShadow = true; scene.add(chao);
// um ambiente simples para os reflexos da pintura (a sala do estúdio: caixas de luz no teto)
{ const pm = new THREE.PMREMGenerator(renderer), sala = new THREE.Scene(); sala.background = new THREE.Color(0x1a1c22);
  for (const [x, z, w] of [[0, 0, 6], [-5, 3, 2], [5, -3, 2]]) { const l = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.5), new THREE.MeshBasicMaterial({ color: 0xffffff })); l.position.set(x, 6, z); l.rotation.x = Math.PI / 2; sala.add(l); }
  scene.environment = pm.fromScene(sala, 0.04).texture; }
const cam = new THREE.PerspectiveCamera(32, 1, 0.05, 200); cam.position.set(-5.2, 2.2, -4.6);
const orbita = new OrbitControls(cam, cv); orbita.target.set(0, 0.45, 0); orbita.enableDamping = true; orbita.maxPolarAngle = Math.PI * 0.495; orbita.minDistance = 2; orbita.maxDistance = 16; orbita.autoRotateSpeed = 0.8;
function ajustar() { const w = innerWidth, hh = innerHeight; renderer.setSize(w, hh, false); cv.style.width = w + "px"; cv.style.height = hh + "px"; cam.aspect = w / hh; cam.updateProjectionMatrix(); }
ajustar(); addEventListener("resize", ajustar);
// o carro fica no meio do espaço livre (entre os painéis e acima da gaveta): a câmera é deslocada na tela
const deslocar = () => cam.setViewOffset(innerWidth, innerHeight, (300 - 280) / 2, 190 / 2 - 26, innerWidth, innerHeight);
deslocar(); addEventListener("resize", deslocar);
renderer.setAnimationLoop(() => { orbita.update(); renderer.render(scene, cam); esfera.quadro(); });

// ---------- o carro ----------
const memoria = (id) => { try { return JSON.parse(localStorage.getItem("livery:" + id) || "null"); } catch { return null; } };
let k = null, estado = null;
const padrao = (id) => { const [c1, c2] = coresDa(id, "#e63946"); return { c1, c2, met: 30, rug: 35, ref: 100 }; };
function montar() {
  if (k) scene.remove(k.g);
  estado = { ...padrao(pint), ...(memoria(pint) || {}) };
  k = montarF1({ cor: estado.c1, cor2: estado.c2, equipe: PINTURAS[pint].equipe, numero: 1, modelo: undefined, leve: false });
  k.aoMontar = () => { sombras(); aplicar(); desenharArvore(); };
  scene.add(k.g); sombras(); aplicar(); desenharArvore();
}
function sombras() { k.g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); }
// a pintura: as duas cores vão para o shader (trocarCores); o material é o da carroceria (k.pintura)
function aplicar() {
  if (!k) return; trocarCores(k, estado.c1, estado.c2);
  const m = k.pintura; if (m && "metalness" in m) { m.metalness = estado.met / 100; m.roughness = estado.rug / 100; m.envMapIntensity = estado.ref / 100; m.needsUpdate = true; }
  for (const [id, v] of [["lsC1", estado.c1], ["lsC2", estado.c2]]) { $(id).value = v; $(id + "t").value = v; }
  for (const [id, v, d] of [["lsMet", estado.met, 100], ["lsRug", estado.rug, 100], ["lsRef", estado.ref, 100]]) { $(id).value = v; $(id + "V").textContent = (v / d).toFixed(2); }
  esfera.cor(estado);
}
await f1Pronto.catch(() => {});
montar();

// ---------- a árvore de peças: as malhas do carro com nome (o olho esconde) ----------
let escolhida = null;
const nomeBonito = (n) => String(n || "peça").replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
function desenharArvore() {
  if (!k) return; const busca = $("lsBusca").value.trim().toLowerCase(), lista = [];
  k.carro.traverse((o) => { if (o !== k.carro && (o.isMesh || (o.children.length && o.name)) && (!busca || nomeBonito(o.name).toLowerCase().includes(busca))) lista.push(o); });
  const prof = (o) => { let n = 0; for (let p = o.parent; p && p !== k.carro; p = p.parent) n++; return n; };
  $("lsArv").innerHTML = `<div class="no raiz">▾ 🏎 Carro completo</div>` + lista.map((o, i) => `<div class="no ${o === escolhida ? "on" : ""}" data-i="${i}" style="padding-left:${18 + prof(o) * 14}px">▢ <span>${h(nomeBonito(o.name || (o.isMesh ? "malha " + i : "grupo")))}</span><button class="olho ${o.visible ? "" : "off"}" data-olho="${i}" title="Mostrar/esconder">👁</button></div>`).join("");
  for (const el of $("lsArv").querySelectorAll("[data-i]")) el.onclick = (e) => { const o = lista[+el.dataset.i]; if (e.target.closest("[data-olho]")) { o.visible = !o.visible; } else escolhida = escolhida === o ? null : o; destacar(); desenharArvore(); };
}
$("lsBusca").oninput = desenharArvore;
// a peça escolhida em destaque: uma caixa azul em volta
const caixa = new THREE.Box3Helper(new THREE.Box3(), 0x3d7bff); caixa.visible = false; scene.add(caixa);
function destacar() { caixa.visible = !!escolhida; if (escolhida) caixa.box.setFromObject(escolhida); }

// ---------- as propriedades ----------
const guardarTxt = (id, campo) => { $(id).oninput = (e) => { estado[campo] = e.target.value; aplicar(); }; $(id + "t").onchange = (e) => { if (/^#[0-9a-f]{6}$/i.test(e.target.value)) { estado[campo] = e.target.value; aplicar(); } }; };
guardarTxt("lsC1", "c1"); guardarTxt("lsC2", "c2");
for (const [id, campo] of [["lsMet", "met"], ["lsRug", "rug"], ["lsRef", "ref"]]) $(id).oninput = (e) => { estado[campo] = +e.target.value; aplicar(); };
$("lsSalvar").onclick = () => { try { localStorage.setItem("livery:" + pint, JSON.stringify(estado)); status("Salvo neste navegador."); } catch { status("Não deu para salvar."); } };
$("lsVoltar").onclick = () => { estado = padrao(pint); aplicar(); status("Cores da equipe de volta (Salvar para guardar)."); };
$("lsPint").onchange = (e) => { pint = e.target.value; history.replaceState(null, "", "?livery=" + pint); escolhida = null; destacar(); montar(); desenharGaveta(); };
$("lsGirar").onclick = () => { orbita.autoRotate = !orbita.autoRotate; $("lsGirar").classList.toggle("on", orbita.autoRotate); };
$("lsRender").onclick = () => { caixa.visible = false; renderer.render(scene, cam); const a = document.createElement("a"); a.href = cv.toDataURL("image/png"); a.download = `livery-${pint}.png`; a.click(); destacar(); status("Imagem baixada."); };
function status(t) { $("lsStatus").textContent = t; }
// as vistas (a frente do carro é −z)
const VISTAS = { Frente: [0, 0.6, -6], Trás: [0, 0.9, 6], Lado: [6.2, 0.7, 0], Topo: [0, 8, 0.01], v3d: [-5.2, 2.2, -4.6] };
$("lsVistas").onclick = (e) => { const b = e.target.closest("[data-v]"); if (!b) return; cam.position.set(...VISTAS[b.dataset.v]); orbita.target.set(0, 0.45, 0); orbita.update(); };

// ---------- a esfera do material (a amostra em cima das propriedades) ----------
const esfera = (() => {
  const c = $("lsEsfera"), r = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true }); r.setPixelRatio(Math.min(2, devicePixelRatio)); r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping;
  const s = new THREE.Scene(); s.environment = scene.environment; s.add(new THREE.HemisphereLight(0xffffff, 0x222222, 1)); const d = new THREE.DirectionalLight(0xffffff, 2.5); d.position.set(2, 3, 3); s.add(d);
  const m = new THREE.MeshStandardMaterial(), bola = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), m); s.add(bola);
  const cm = new THREE.PerspectiveCamera(30, 1, 0.1, 20); cm.position.set(0, 0, 4.6);
  let sujo = true;
  return { cor(e) { m.color.set(e.c1); m.metalness = e.met / 100; m.roughness = e.rug / 100; m.envMapIntensity = e.ref / 100; sujo = true; },
    quadro() { if (!sujo) return; const w = c.clientWidth, hh = c.clientHeight; if (!w) return; r.setSize(w, hh, false); cm.aspect = w / hh; cm.updateProjectionMatrix(); r.render(s, cm); sujo = false; } };
})();
esfera.cor(estado);

// ---------- a gaveta: Cores (as pinturas prontas) e Patrocinadores (as marcas do jogo) ----------
let gaveta = "cores";
function desenharGaveta() {
  for (const b of $("lsGaveta").querySelectorAll("[data-g]")) b.classList.toggle("on", b.dataset.g === gaveta);
  if (gaveta === "cores") {
    $("lsGav").innerHTML = Object.entries(PINTURAS).filter(([id]) => id !== "propria").map(([id, p]) => { const [c1, c2] = coresDa(id, "#e63946"); return `<div class="ficha" data-cores="${id}"><div class="dupla" style="background:linear-gradient(135deg,${c1} 55%,${c2} 55%)"></div>${h(p.name)}</div>`; }).join("");
    for (const f of $("lsGav").querySelectorAll("[data-cores]")) f.onclick = () => { const [c1, c2] = coresDa(f.dataset.cores, "#e63946"); Object.assign(estado, { c1, c2 }); aplicar(); status(`Cores de ${PINTURAS[f.dataset.cores].name} na pintura.`); };
  } else {
    const ids = [...Object.keys(PATROCINIOS).filter(Boolean), ...Object.keys(MARCAS_CAPACETE)];
    $("lsGav").innerHTML = ids.map((id) => `<div class="ficha" title="${h(nomeMarca(id))}"><img src="${miniaturaDoPatrocinio(id)}" alt="">${h(nomeMarca(id))}</div>`).join("");
    for (const f of $("lsGav").querySelectorAll(".ficha")) f.onclick = () => status("Pôr a marca no carro chega no próximo passo do Livery Studio.");
  }
}
$("lsGaveta").querySelector(".abas").onclick = (e) => { const b = e.target.closest("[data-g]"); if (b) { gaveta = b.dataset.g; desenharGaveta(); } };
desenharGaveta();
