// O LIVERY STUDIO (2026-11-18, o Thiago: "imagino o editor de carros assim", com a imagem de referência). Plano em planos/livery-studio.md.
// Passo 1: o estúdio (o carro do jogo, f1.js montarF1, girando num estúdio escuro), as vistas, o material e "Renderizar imagem".
// Passo 2: a pintura vira DADOS. As ZONAS do carro (f1-pintura.js: bico, asa dianteira, cockpit, laterais, tampa, asa traseira, assoalho) e as
// CAMADAS por cima de uma base (a pintura de uma equipe ou uma cor lisa): cor numa zona, faixa inclinada, listra de corrida e degradê, cada uma
// num lado ou nos dois. A folha é redesenhada a cada mudança (folhaDeCamadas, 1024 × 1152) e entra no shader do carro no lugar da folha da
// equipe. Salvar grava public/corrida/pinturas/<id>.json pelo servidor do editor (no PC) e, sem ele, no navegador.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { montarF1, f1Pronto, PINTURAS, coresDa, trocarCores } from "../f1.js";
import { ZONAS, folhaDeCamadas, temDesenho, imagemLivery } from "../f1-pintura.js";
import { PATROCINIOS, MARCAS_CAPACETE, miniaturaDoPatrocinio } from "../f1-capacetes.js";

const h = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const qs = new URLSearchParams(location.search);
let pint = PINTURAS[qs.get("livery")] ? qs.get("livery") : "touro";
const equipeDe = (id) => { const e = PINTURAS[id]?.equipe; return e && temDesenho(e) ? e : null; };
const TIPOS = { cor: { ic: "■", nome: "Cor na zona" }, faixa: { ic: "▱", nome: "Faixa inclinada" }, listra: { ic: "┃", nome: "Listra de corrida" }, degrade: { ic: "◐", nome: "Degradê" }, logo: { ic: "🏷", nome: "Logo" } };
const LADOS = { ambos: "Os dois lados", A: "Lado direito", B: "Lado esquerdo" };

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
#lsLista{flex:1;overflow:auto;padding:8px 6px 10px}
.no{display:flex;align-items:center;gap:8px;padding:7px 8px;border-radius:6px;cursor:pointer;color:#cfd5de}.no:hover{background:#20252c}.no.on{background:#22324f;color:#fff}
.no span{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.no .mini{background:transparent;border:0;cursor:pointer;color:var(--mu);font-size:13px;padding:0 3px}.no .mini:hover{color:var(--tx)}.no .off{opacity:.35}
.no i{width:14px;height:14px;border-radius:4px;border:1px solid #fff3;flex:none}.raiz{font-weight:700;color:var(--tx)}
#lsNovas{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:10px;border-top:1px solid var(--ln)}#lsNovas button{background:var(--pn2);border:1px solid var(--ln);border-radius:7px;padding:8px 6px;cursor:pointer;font-size:12px}#lsNovas button:hover{border-color:var(--ac)}
#lsVistas{position:fixed;top:64px;left:296px;z-index:3;display:flex;gap:8px}#lsVistas .grp{display:flex;background:rgba(24,27,32,.9);border:1px solid var(--ln);border-radius:9px;padding:3px}
#lsDir h3{font-size:13px;margin:4px 0 12px;display:flex;align-items:center;gap:8px}#lsDir h4{font-size:12px;color:var(--mu);margin:18px 0 8px;text-transform:uppercase;letter-spacing:.08em}
.campo{display:grid;grid-template-columns:90px 1fr 42px;align-items:center;gap:8px;margin:10px 0;color:#c4cbd6}.campo input[type=range]{width:100%;accent-color:var(--ac)}.campo b{font-weight:500;text-align:right;background:var(--pn2);border-radius:5px;padding:3px 5px;font-size:12px}
.cor{display:grid;grid-template-columns:90px 34px 1fr;align-items:center;gap:8px;margin:10px 0;color:#c4cbd6}.cor input[type=color]{width:34px;height:30px;padding:0;border:1px solid var(--ln);border-radius:6px;background:none}.cor input[type=text]{background:var(--pn2);border:1px solid var(--ln);border-radius:6px;padding:6px 8px;width:100%;box-sizing:border-box}
.sel{display:grid;grid-template-columns:90px 1fr;align-items:center;gap:8px;margin:10px 0;color:#c4cbd6}.sel select{width:100%}
.chk{display:flex;gap:8px;align-items:center;margin:10px 0;color:#c4cbd6}
#lsEsfera{width:100%;height:110px;border-radius:10px;background:radial-gradient(circle at 50% 40%,#2a2f38,#121418);display:block}
#lsFolha{width:100%;border-radius:8px;background:#0b0d11;display:block;margin-top:6px;image-rendering:auto}
#lsGaveta{position:fixed;left:280px;right:300px;bottom:0;height:190px;background:var(--pn);border-top:1px solid var(--ln);z-index:4;display:flex;flex-direction:column}
#lsGaveta .abas{justify-content:flex-start}#lsGaveta .abas button{flex:none;padding:8px 14px}
#lsGav{flex:1;overflow:auto;padding:10px;display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;align-content:start}
#lsGav.cores{grid-template-columns:repeat(auto-fill,minmax(54px,1fr))}
.ficha{background:var(--pn2);border:1px solid var(--ln);border-radius:9px;padding:8px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:6px;color:#cfd5de;font-size:12px}.ficha:hover{border-color:#4a5262}.ficha.on{border-color:var(--ac);box-shadow:0 0 0 1px var(--ac)}
.ficha img{width:100%;height:46px;object-fit:contain}.ficha .dupla{width:100%;height:40px;border-radius:6px}
.amostra{height:44px;border-radius:8px;border:1px solid #fff2;cursor:pointer}.amostra:hover{outline:2px solid var(--ac)}
#lsStatus{position:fixed;left:296px;bottom:202px;z-index:3;color:var(--mu);font-size:12px;background:rgba(17,19,23,.7);padding:5px 9px;border-radius:7px}
canvas#lsCena{position:fixed;inset:0;display:block}`;
document.head.appendChild(css);
const nomeMarca = (id) => PATROCINIOS[id] || MARCAS_CAPACETE[id] || id;
document.body.insertAdjacentHTML("beforeend", `
<canvas id="lsCena"></canvas>
<div id="lsTopo"><div class="logo"><i>LS</i>Livery Studio</div>
  <button class="bt" id="lsSalvar" title="Ctrl+S">💾 Salvar</button><button class="bt" id="lsDesf" title="Desfazer (Ctrl+Z)">↶</button><button class="bt" id="lsRef" title="Refazer (Ctrl+Y)">↷</button><button class="bt" id="lsVoltar" title="Volta à pintura da equipe, sem camadas">↺ Original</button>
  <div class="dir"><span style="color:var(--mu)">Carro</span><select id="lsPint">${Object.entries(PINTURAS).filter(([k]) => k !== "propria").map(([k, p]) => `<option value="${k}" ${k === pint ? "selected" : ""}>${h(p.name)}</option>`).join("")}</select>
  <button class="bt" id="lsGirar" title="Girar sozinho">⟳ Girar</button><button class="bt pri" id="lsRender">📷 Renderizar imagem</button></div></div>
<div id="lsEsq"><div class="abas"><button data-e="pecas" class="on">🏎 Peças</button><button data-e="camadas">☰ Camadas</button></div><div id="lsLista"></div>
  <div id="lsNovas">${Object.entries(TIPOS).filter(([k]) => k !== "logo").map(([k, t]) => `<button data-nova="${k}">${t.ic} ${t.nome}</button>`).join("")}</div></div>
<div id="lsVistas"><div class="grp"><button class="bt" data-v="v3d" title="3D">◈</button></div><div class="grp">${["Frente", "Trás", "Lado", "Topo"].map((v) => `<button class="bt" data-v="${v}">${v}</button>`).join("")}</div></div>
<div id="lsDir"><h3>🛠 Propriedades</h3><div id="lsProp"></div>
  <h4>Base</h4>
  <div class="sel"><span>Partir de</span><select id="lsBase"></select></div>
  <div class="cor" id="lsC1l"><span>Cor de fundo</span><input type="color" id="lsC1"><input type="text" id="lsC1t" maxlength="7"></div>
  <h4>Acabamento</h4><canvas id="lsEsfera"></canvas><div id="lsPresets" style="display:flex;flex-wrap:wrap;gap:5px;margin:8px 0"></div>
  <div class="campo"><span>Metálico</span><input type="range" id="lsMet" min="0" max="100"><b id="lsMetV"></b></div>
  <div class="campo"><span>Rugosidade</span><input type="range" id="lsRug" min="0" max="100"><b id="lsRugV"></b></div>
  <div class="campo"><span>Reflexo</span><input type="range" id="lsRef2" min="0" max="200"><b id="lsRef2V"></b></div>
  <div class="campo"><span>Verniz</span><input type="range" id="lsCc" min="0" max="100"><b id="lsCcV"></b></div>
  <div class="campo"><span>Verniz fosco</span><input type="range" id="lsCcr" min="0" max="100"><b id="lsCcrV"></b></div>
  <div class="campo"><span>Perolizado</span><input type="range" id="lsIri" min="0" max="100"><b id="lsIriV"></b></div>
  <h4>A folha da pintura</h4><canvas id="lsFolha" width="512" height="576" title="As vistas que o jogo projeta no carro: os dois lados, de cima, a frente e a traseira"></canvas></div>
<div id="lsGaveta"><div class="abas"><button data-g="cores" class="on">🎨 Cores</button><button data-g="pinturas">🏁 Pinturas</button><button data-g="marcas">🏷 Patrocinadores</button></div><div id="lsGav"></div></div>
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
{ const pm = new THREE.PMREMGenerator(renderer), sala = new THREE.Scene(); sala.background = new THREE.Color(0x1a1c22);
  for (const [x, z, w] of [[0, 0, 6], [-5, 3, 2], [5, -3, 2]]) { const l = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.5), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })); l.position.set(x, 6, z); l.rotation.x = Math.PI / 2; sala.add(l); }
  scene.environment = pm.fromScene(sala, 0.04).texture; }
const cam = new THREE.PerspectiveCamera(32, 1, 0.05, 200); cam.position.set(-5.2, 2.2, -4.6);
const orbita = new OrbitControls(cam, cv); orbita.target.set(0, 0.45, 0); orbita.enableDamping = true; orbita.maxPolarAngle = Math.PI * 0.495; orbita.minDistance = 2; orbita.maxDistance = 16; orbita.autoRotateSpeed = 0.8;
function ajustar() { const w = innerWidth, hh = innerHeight; renderer.setSize(w, hh, false); cv.style.width = w + "px"; cv.style.height = hh + "px"; cam.aspect = w / hh; cam.updateProjectionMatrix(); cam.setViewOffset(w, hh, (300 - 280) / 2, 190 / 2 - 26, w, hh); }
ajustar(); addEventListener("resize", ajustar);

// ---------- a pintura (os dados) ----------
// { versao, carro (a pintura do PINTURAS), base (equipe de partida ou null), c1, met, rug, ref, camadas: [{ tipo, zona, lado, cor, opac, s0, s1, largura, dist, oculta }] }
const padrao = (id) => ({ versao: 1, carro: id, base: equipeDe(id), c1: coresDa(id, "#e63946")[0], c2: coresDa(id, "#e63946")[1], met: 30, rug: 35, ref: 100, cc: 100, ccr: 38, iri: 0, camadas: [] });
const local = (id) => { try { return JSON.parse(localStorage.getItem("livery:" + id) || "null"); } catch { return null; } };
async function carregar(id) {
  const arq = await fetch(`/corrida/pinturas/${id}.json`, { cache: "no-cache" }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const p = { ...padrao(id), ...(local(id) || arq || {}) }; if (!Array.isArray(p.camadas)) p.camadas = []; return p;
}
let P = null, k = null, sel = -1, zonaSel = "laterais";
// desfazer/refazer: uma foto dos dados a cada mudança (as mudanças seguidas no mesmo controle viram uma só)
const pilha = [], refeitos = []; let ultimaFoto = "", fotoVez = null;
function foto(junto) { const s = JSON.stringify(P); if (s === ultimaFoto) return; if (!(junto && junto === fotoVez)) { pilha.push(ultimaFoto); if (pilha.length > 100) pilha.shift(); refeitos.length = 0; } fotoVez = junto || null; ultimaFoto = s; }
function voltar(de, para) { const s = de.pop(); if (s == null || s === "") return; para.push(JSON.stringify(P)); P = JSON.parse(s); ultimaFoto = s; fotoVez = null; if (sel >= P.camadas.length) sel = -1; tudo(); }

// a folha: redesenhada a cada mudança e posta no shader do carro (no lugar da folha da equipe)
const folhaCv = document.createElement("canvas"), folhaTx = new THREE.CanvasTexture(folhaCv);
folhaTx.colorSpace = THREE.SRGBColorSpace; folhaTx.anisotropy = 8; folhaTx.minFilter = THREE.LinearMipmapLinearFilter;
let agendado = false;
function redesenhar() {
  if (agendado) return; agendado = true;
  requestAnimationFrame(() => {
    agendado = false; for (const l of P.camadas) if (l.tipo === "logo" && l.img) imagemLivery(l.img, redesenhar); // (a imagem que ainda não chegou: pinta de novo quando chegar)
    folhaDeCamadas(P, folhaCv); folhaTx.needsUpdate = true;
    const f = $("lsFolha"), fx = f.getContext("2d"); fx.clearRect(0, 0, f.width, f.height); fx.drawImage(folhaCv, 0, 0, f.width, f.height);
    if (k) { trocarCores(k, P.c1, P.c2); const m = k.pintura; if (m?.userData?.liv) m.userData.liv.liv.value = folhaTx; if (m && "metalness" in m) { m.metalness = P.met / 100; m.roughness = P.rug / 100; m.envMapIntensity = P.ref / 100; if ("clearcoat" in m) { m.clearcoat = (P.cc ?? 100) / 100; m.clearcoatRoughness = (P.ccr ?? 38) / 100; m.iridescence = (P.iri || 0) / 100; } } }
    esfera.cor(P);
  });
}
// o carro: o modelo de uma equipe que tem desenho (para o shader ler a folha); a folha é a nossa
function montar() {
  if (k) scene.remove(k.g);
  k = montarF1({ cor: P.c1, cor2: P.c2, equipe: equipeDe(pint) || "mclaren", numero: 1, leve: false });
  k.aoMontar = () => { sombras(); redesenhar(); };
  scene.add(k.g); sombras(); redesenhar();
}
function sombras() { k.g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); }
renderer.setAnimationLoop(() => { orbita.update(); renderer.render(scene, cam); esfera.quadro(); });

// ---------- a lista da esquerda: as PEÇAS (zonas) e as CAMADAS ----------
let abaEsq = "pecas";
const corDaZona = (z) => { for (let i = P.camadas.length - 1; i >= 0; i--) { const l = P.camadas[i]; if (!l.oculta && l.tipo === "cor" && l.zona === z) return l.cor; } return null; };
function desenharLista() {
  for (const b of $("lsEsq").querySelectorAll("[data-e]")) b.classList.toggle("on", b.dataset.e === abaEsq);
  const el = $("lsLista");
  if (abaEsq === "pecas") {
    el.innerHTML = `<div class="no raiz">▾ 🏎 Carro completo</div>` + Object.entries(ZONAS).filter(([z]) => z !== "carro").map(([z, d]) => { const c = corDaZona(z), n = P.camadas.filter((l) => l.zona === z).length;
      return `<div class="no ${z === zonaSel ? "on" : ""}" data-z="${z}" style="padding-left:24px"><i style="background:${c || "transparent"}"></i><span>${h(d.nome)}</span><small style="color:var(--mu)">${n || ""}</small><button class="mini" data-pintar="${z}" title="Pintar esta peça de uma cor">🎨</button></div>`; }).join("")
      + `<small style="display:block;padding:10px 8px;color:var(--mu)">Escolha a peça e use os botões de baixo, ou 🎨 para pintar de uma cor. As camadas novas vão para a peça escolhida.</small>`;
    for (const n of el.querySelectorAll("[data-z]")) n.onclick = (e) => { zonaSel = n.dataset.z; if (e.target.closest("[data-pintar]")) return nova("cor"); desenharLista(); };
  } else {
    el.innerHTML = P.camadas.length ? [...P.camadas.keys()].reverse().map((i) => { const l = P.camadas[i];
      return `<div class="no ${i === sel ? "on" : ""}" data-i="${i}"><i style="background:${h(l.cor)}"></i><span>${TIPOS[l.tipo]?.ic || ""} ${l.tipo === "logo" ? h(l.marca ? nomeMarca(l.marca) : l.nome || "Imagem") + " · " + (l.vista === "T" ? "em cima" : "lados") : h(TIPOS[l.tipo]?.nome || l.tipo) + " · " + h(ZONAS[l.zona]?.nome || "")}</span>
        <button class="mini" data-acao="sobe" title="Subir">▲</button><button class="mini" data-acao="desce" title="Descer">▼</button><button class="mini" data-acao="dup" title="Duplicar">⧉</button><button class="mini" data-acao="espelho" title="Uma cópia no outro lado">⇋</button><button class="mini ${l.oculta ? "off" : ""}" data-acao="olho" title="Mostrar/esconder">👁</button><button class="mini" data-acao="apaga" title="Apagar">🗑</button></div>`; }).join("")
      + `<div class="no raiz" style="opacity:.7">▣ Base · ${h(P.base ? "pintura da equipe" : "cor de fundo")}</div>`
      : `<small style="display:block;padding:10px 8px;color:var(--mu)">Nenhuma camada ainda. Use os botões de baixo: a de cima da lista é pintada por cima das outras.</small>`;
    for (const n of el.querySelectorAll("[data-i]")) n.onclick = (e) => {
      const i = +n.dataset.i, a = e.target.closest("[data-acao]")?.dataset.acao, L = P.camadas;
      if (a === "olho") L[i].oculta = !L[i].oculta || undefined;
      else if (a === "apaga") { L.splice(i, 1); sel = -1; }
      else if (a === "dup") { L.splice(i + 1, 0, JSON.parse(JSON.stringify(L[i]))); sel = i + 1; }
      else if (a === "espelho") { const c = JSON.parse(JSON.stringify(L[i])); c.lado = { A: "B", B: "A" }[c.lado] || "ambos"; if (c.lado === "ambos") return status("Esta camada já está nos dois lados."); L.splice(i + 1, 0, c); sel = i + 1; }
      else if (a === "sobe" && i < L.length - 1) { [L[i], L[i + 1]] = [L[i + 1], L[i]]; sel = i + 1; }
      else if (a === "desce" && i > 0) { [L[i], L[i - 1]] = [L[i - 1], L[i]]; sel = i - 1; }
      else if (!a) sel = sel === i ? -1 : i;
      mudou(); };
  }
}
$("lsEsq").querySelector(".abas").onclick = (e) => { const b = e.target.closest("[data-e]"); if (b) { abaEsq = b.dataset.e; desenharLista(); } };
const NOVAS = { cor: (c) => ({ tipo: "cor", cor: c }), faixa: (c) => ({ tipo: "faixa", cor: c, s0: 2.9, s1: 2.3, largura: 0.25 }), listra: (c) => ({ tipo: "listra", cor: c, largura: 0.12, dist: 0 }), degrade: (c) => ({ tipo: "degrade", cor: c, s0: 2.0, s1: 3.6 }) };
function nova(tipo) {
  const zona = tipo === "listra" && zonaSel === "laterais" ? "carro" : zonaSel;
  P.camadas.push({ ...NOVAS[tipo](P.c2 || "#ffffff"), zona, lado: "ambos" }); sel = P.camadas.length - 1; abaEsq = "camadas"; mudou();
  status(`${TIPOS[tipo].nome} em ${ZONAS[zona].nome}: ajuste nas Propriedades.`);
}
$("lsNovas").onclick = (e) => { const b = e.target.closest("[data-nova]"); if (b) nova(b.dataset.nova); };

// ---------- as propriedades da camada escolhida ----------
function desenharProp() {
  const el = $("lsProp"), l = P.camadas[sel];
  if (!l) { el.innerHTML = `<small style="color:var(--mu)">Escolha uma camada (aba Camadas) para mexer nela.</small>`; return; }
  if (l.tipo === "logo") return propLogo(el, l);
  const faixa = (k, nome, min, max, passo) => `<div class="campo"><span>${nome}</span><input type="range" data-n="${k}" min="${min}" max="${max}" step="${passo}" value="${l[k] ?? 0}"><b>${(+(l[k] ?? 0)).toFixed(2)}</b></div>`;
  el.innerHTML = `<div style="font-weight:700;margin-bottom:6px">${TIPOS[l.tipo]?.ic} ${h(TIPOS[l.tipo]?.nome)}</div>
    <div class="sel"><span>Peça</span><select data-s="zona">${Object.entries(ZONAS).map(([z, d]) => `<option value="${z}" ${z === l.zona ? "selected" : ""}>${h(d.nome)}</option>`).join("")}</select></div>
    <div class="sel"><span>Lado</span><select data-s="lado">${Object.entries(LADOS).map(([z, n]) => `<option value="${z}" ${z === (l.lado || "ambos") ? "selected" : ""}>${n}</option>`).join("")}</select></div>
    <div class="cor"><span>Cor</span><input type="color" data-c value="${h(l.cor)}"><input type="text" data-ct maxlength="7" value="${h(l.cor)}"></div>
    ${faixa("opac", "Opacidade", 0, 1, 0.05).replace(`value="${l.opac ?? 0}"`, `value="${l.opac ?? 1}"`).replace(`<b>${(+(l.opac ?? 0)).toFixed(2)}</b>`, `<b>${(+(l.opac ?? 1)).toFixed(2)}</b>`)}
    ${l.tipo === "faixa" ? faixa("s0", "Embaixo (m)", 0, 4.45, 0.01) + faixa("s1", "Em cima (m)", 0, 4.45, 0.01) + faixa("largura", "Largura (m)", 0.02, 1.5, 0.01) : ""}
    ${l.tipo === "listra" ? faixa("largura", "Largura (m)", 0.02, 0.8, 0.01) + faixa("dist", "Afastadas (m)", 0, 0.6, 0.01) : ""}
    ${l.tipo === "degrade" ? faixa("s0", "Começa (m)", 0, 4.45, 0.01) + faixa("s1", "Some (m)", 0, 4.45, 0.01) : ""}
    <small style="color:var(--mu)">As medidas são a partir da ponta do bico (o carro tem 4,4 m).</small>`;
  for (const s of el.querySelectorAll("[data-s]")) s.onchange = () => { l[s.dataset.s] = s.value; mudou(); };
  for (const r of el.querySelectorAll("[data-n]")) r.oninput = () => { l[r.dataset.n] = +r.value; r.nextElementSibling.textContent = (+r.value).toFixed(2); mudou("n" + sel + r.dataset.n, true); };
  el.querySelector("[data-c]").oninput = (e) => { l.cor = e.target.value; el.querySelector("[data-ct]").value = l.cor; mudou("c" + sel, true); };
  el.querySelector("[data-ct]").onchange = (e) => { if (/^#[0-9a-f]{6}$/i.test(e.target.value)) { l.cor = e.target.value; mudou(); } };
}
// o logo: onde (a vista, o lado, s e a altura/x), o tamanho, o giro, espelhar, opacidade e, nas marcas do jogo, uma cor única
function propLogo(el, l) {
  const T = l.vista === "T", rg = (k, nome, min, max, passo, pad) => `<div class="campo"><span>${nome}</span><input type="range" data-n="${k}" min="${min}" max="${max}" step="${passo}" value="${l[k] ?? pad}"><b>${(+(l[k] ?? pad)).toFixed(2)}</b></div>`;
  el.innerHTML = `<div style="font-weight:700;margin-bottom:6px">🏷 ${h(l.marca ? nomeMarca(l.marca) : l.nome || "Imagem")}</div>
    <div class="sel"><span>Onde</span><select data-s="vista"><option value="L" ${T ? "" : "selected"}>Nas laterais</option><option value="T" ${T ? "selected" : ""}>Em cima</option></select></div>
    <div class="sel"><span>Lado</span><select data-s="lado">${Object.entries(LADOS).map(([z, n]) => `<option value="${z}" ${z === (l.lado || "ambos") ? "selected" : ""}>${n}</option>`).join("")}</select></div>
    ${rg("altura", "Tamanho (m)", 0.02, 0.8, 0.005, 0.08)}${rg("giro", "Giro (°)", -180, 180, 1, 0)}
    ${rg("a", "Do bico (m)", 0, 4.45, 0.005, 2)}${T ? rg("b", "Para o lado (m)", -0.85, 0.85, 0.005, 0) : rg("b", "Altura (m)", 0, 1.1, 0.005, 0.4)}
    ${rg("opac", "Opacidade", 0, 1, 0.05, 1)}
    <div class="chk"><label><input type="checkbox" data-k="espelhar" ${l.espelhar ? "checked" : ""}> Espelhar</label>${l.marca ? `<label><input type="checkbox" data-k="tinta" ${l.tinta ? "checked" : ""}> Cor única</label><input type="color" data-tinta value="${h(l.tinta || "#ffffff")}" ${l.tinta ? "" : "disabled"}>` : ""}</div>
    <small style="color:var(--mu)">Arraste o logo no carro para mover · [ e ] mudam o tamanho · Q e E giram · Delete apaga.</small>`;
  for (const s of el.querySelectorAll("[data-s]")) s.onchange = () => { l[s.dataset.s] = s.value; if (s.dataset.s === "vista") { l.b = s.value === "T" ? 0 : 0.4; l.giro = s.value === "T" ? 90 : 0; } mudou(); };
  for (const r of el.querySelectorAll("[data-n]")) r.oninput = () => { l[r.dataset.n] = +r.value; r.nextElementSibling.textContent = (+r.value).toFixed(2); mudou("n" + sel + r.dataset.n, true); };
  for (const c of el.querySelectorAll("[data-k]")) c.onchange = () => { if (c.dataset.k === "tinta") l.tinta = c.checked ? el.querySelector("[data-tinta]").value : undefined; else l[c.dataset.k] = c.checked || undefined; mudou(); };
  const ti = el.querySelector("[data-tinta]"); if (ti) ti.oninput = () => { l.tinta = ti.value; mudou("t" + sel, true); };
}
// a base e o material
function desenharBase() {
  $("lsBase").innerHTML = `<option value="">Cor lisa</option>` + Object.entries(PINTURAS).filter(([id]) => equipeDe(id)).map(([id, p]) => `<option value="${equipeDe(id)}" ${equipeDe(id) === P.base ? "selected" : ""}>Pintura ${h(p.name)}</option>`).join("");
  $("lsC1l").style.display = P.base ? "none" : ""; $("lsC1").value = P.c1; $("lsC1t").value = P.c1;
  for (const [id, v] of [["lsMet", P.met], ["lsRug", P.rug], ["lsRef2", P.ref], ["lsCc", P.cc ?? 100], ["lsCcr", P.ccr ?? 38], ["lsIri", P.iri || 0]]) { $(id).value = v; $(id + "V").textContent = (v / 100).toFixed(2); }
  $("lsPresets").innerHTML = Object.keys(ACABAMENTOS).map((n) => `<button class="bt" style="height:26px;padding:0 8px;border-color:var(--ln);font-size:12px" data-preset="${n}">${n}</button>`).join("");
}
$("lsBase").onchange = (e) => { P.base = e.target.value || null; mudou(); };
$("lsC1").oninput = (e) => { P.c1 = e.target.value; $("lsC1t").value = P.c1; mudou("c1", true); };
$("lsC1t").onchange = (e) => { if (/^#[0-9a-f]{6}$/i.test(e.target.value)) { P.c1 = e.target.value; mudou(); } };
// (os presets do texto que o Thiago trouxe, 2026-11-18: só a carroceria pintada; o carbono e as rodas continuam os do jogo)
const ACABAMENTOS = { Brilhante: { met: 10, rug: 30, cc: 100, ccr: 5, iri: 0 }, Fosca: { met: 0, rug: 85, cc: 0, ccr: 100, iri: 0 }, Acetinada: { met: 15, rug: 55, cc: 60, ccr: 45, iri: 0 }, Metálica: { met: 80, rug: 30, cc: 100, ccr: 10, iri: 0 }, Perolizada: { met: 40, rug: 25, cc: 100, ccr: 8, iri: 80 }, Cromada: { met: 100, rug: 6, cc: 40, ccr: 5, iri: 0 } };
$("lsPresets").onclick = (e) => { const b = e.target.closest("[data-preset]"); if (!b) return; Object.assign(P, ACABAMENTOS[b.dataset.preset]); mudou(); status(`Acabamento: ${b.dataset.preset}.`); };
for (const [id, campo] of [["lsMet", "met"], ["lsRug", "rug"], ["lsRef2", "ref"], ["lsCc", "cc"], ["lsCcr", "ccr"], ["lsIri", "iri"]]) $(id).oninput = (e) => { P[campo] = +e.target.value; $(id + "V").textContent = (P[campo] / 100).toFixed(2); mudou(campo, true); };

// ---------- mudanças, salvar, desfazer ----------
// `leve`: só a folha e o material (arrastando um controle: o painel não é refeito, para não perder o foco)
function mudou(junto = null, leve = false) { foto(junto); redesenhar(); if (!leve) { desenharLista(); desenharProp(); desenharBase(); } }
function tudo() { redesenhar(); desenharLista(); desenharProp(); desenharBase(); }
async function salvar() {
  try { localStorage.setItem("livery:" + pint, JSON.stringify(P)); } catch {}
  const r = await fetch(`/api/corrida/editor/livery/${pint}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(P) }).catch(() => null);
  status(r?.ok ? `Salvo em public/corrida/pinturas/${pint}.json (Publicar no TabbaTracks manda para o GitHub).` : "Salvo neste navegador (para gravar o arquivo, abra pelo editor-de-pistas.bat).");
}
$("lsSalvar").onclick = salvar;
$("lsDesf").onclick = () => voltar(pilha, refeitos); $("lsRef").onclick = () => voltar(refeitos, pilha);
addEventListener("keydown", (e) => {
  if (e.target.closest?.("input,select")) return; const t = e.key.toLowerCase();
  if ((e.ctrlKey || e.metaKey) && t === "s") { e.preventDefault(); salvar(); }
  else if ((e.ctrlKey || e.metaKey) && t === "z" && !e.shiftKey) { e.preventDefault(); voltar(pilha, refeitos); }
  else if ((e.ctrlKey || e.metaKey) && (t === "y" || (t === "z" && e.shiftKey))) { e.preventDefault(); voltar(refeitos, pilha); }
  else if (t === "delete" && sel >= 0) { P.camadas.splice(sel, 1); sel = -1; mudou(); }
  else if (t === "escape" && pondo) { pondo = null; cv.style.cursor = ""; desenharGaveta(); status("Cancelado."); }
  else if (P.camadas[sel]?.tipo === "logo" && ["[", "]", "q", "e"].includes(t)) { const l = P.camadas[sel];
    if (t === "[" || t === "]") l.altura = Math.max(0.02, Math.min(0.8, (+l.altura || 0.08) * (t === "]" ? 1.1 : 1 / 1.1))); else l.giro = (((+l.giro || 0) + (t === "e" ? 5 : -5) + 540) % 360) - 180;
    mudou("tecla" + sel + t); }
});
$("lsVoltar").onclick = () => { P = { ...padrao(pint), met: P.met, rug: P.rug, ref: P.ref }; sel = -1; mudou(); status("De volta à pintura da equipe (Salvar para guardar)."); };
$("lsPint").onchange = async (e) => { pint = e.target.value; history.replaceState(null, "", "?livery=" + pint); P = await carregar(pint); sel = -1; pilha.length = refeitos.length = 0; ultimaFoto = JSON.stringify(P); montar(); tudo(); desenharGaveta(); };
$("lsGirar").onclick = () => { orbita.autoRotate = !orbita.autoRotate; $("lsGirar").classList.toggle("on", orbita.autoRotate); };
$("lsRender").onclick = () => { renderer.render(scene, cam); const a = document.createElement("a"); a.href = cv.toDataURL("image/png"); a.download = `livery-${pint}.png`; a.click(); status("Imagem baixada."); };
function status(t) { $("lsStatus").textContent = t; }
const VISTAS = { Frente: [0, 0.6, -6], Trás: [0, 0.9, 6], Lado: [6.2, 0.7, 0], Topo: [0, 8, 0.01], v3d: [-5.2, 2.2, -4.6] }; // (a frente do carro é −z)
$("lsVistas").onclick = (e) => { const b = e.target.closest("[data-v]"); if (!b) return; cam.position.set(...VISTAS[b.dataset.v]); orbita.target.set(0, 0.45, 0); orbita.update(); };

// ---------- clicar no carro: PÔR o logo escolhido, ARRASTAR o logo escolhido, ou escolher a PEÇA ----------
// o ponto do carro em coordenadas da folha: s a partir do bico, a altura e o x; "de cima" se a superfície olha para cima ou para baixo
const raio = new THREE.Raycaster(), ponteiro = new THREE.Vector2(), nrm = new THREE.Vector3(); let xy0 = null, arrastando = false, pondo = null;
function noCarro(e) {
  if (!k) return null; const r = cv.getBoundingClientRect(); ponteiro.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); raio.setFromCamera(ponteiro, cam);
  const hit = raio.intersectObject(k.carro, true)[0]; if (!hit) return null;
  const cx = new THREE.Box3().setFromObject(k.carro), p = hit.point; // (a frente é −z: o bico está no menor z)
  return { s: p.z - cx.min.z, y: p.y - cx.min.y, x: p.x, deCima: !!hit.face && Math.abs(nrm.copy(hit.face.normal).transformDirection(hit.object.matrixWorld).y) > 0.7 };
}
const r3 = (v) => Math.round(v * 1000) / 1000;
cv.addEventListener("pointerdown", (e) => {
  xy0 = [e.clientX, e.clientY]; const l = P?.camadas[sel];
  if (pondo || l?.tipo !== "logo" || e.button !== 0) return;
  if (!noCarro(e)) return;
  arrastando = true; orbita.enabled = false; cv.setPointerCapture(e.pointerId);
});
cv.addEventListener("pointermove", (e) => {
  if (!arrastando) return; const l = P.camadas[sel], q = noCarro(e); if (!l || !q) return;
  const T = l.vista === "T"; if (q.deCima !== T) return; // (não pula da lateral para cima no meio do arrasto)
  l.a = r3(q.s); l.b = r3(T ? q.x : q.y); mudou("arrasto" + sel, true);
});
cv.addEventListener("pointerup", (e) => {
  const parado = xy0 && Math.hypot(e.clientX - xy0[0], e.clientY - xy0[1]) <= 4;
  if (arrastando) { arrastando = false; orbita.enabled = true; desenharProp(); if (!parado) return; } // (um clique sem arrastar escolhe a peça, como sempre)
  if (!parado) return;
  const q = noCarro(e); if (!q) return;
  if (pondo) { // o logo novo: na lateral, nos dois lados; em cima, girado para ler de quem vê o carro de lado
    P.camadas.push({ tipo: "logo", zona: "carro", ...pondo, vista: q.deCima ? "T" : "L", lado: "ambos", a: r3(q.s), b: r3(q.deCima ? q.x : q.y), altura: q.deCima ? 0.1 : 0.08, giro: q.deCima ? 90 : 0 });
    sel = P.camadas.length - 1; abaEsq = "camadas"; pondo = null; cv.style.cursor = ""; mudou(); desenharGaveta();
    return status("Logo posto: arraste para ajustar, [ ] tamanho, Q E giro. Ele vai nos dois lados (mude em Lado).");
  }
  let melhor = null, dist = 1e9;
  for (const [z, d] of Object.entries(ZONAS)) { if (z === "carro") continue;
    for (const [a0, b0, a1, b1] of (q.deCima ? d.T : d.L) || []) { const v = q.deCima ? q.x : q.y, dd = Math.hypot(Math.max(a0 - q.s, 0, q.s - a1), Math.max(b0 - v, 0, v - b1)); if (dd < dist) { dist = dd; melhor = z; } } }
  if (!melhor) return; zonaSel = melhor; abaEsq = "pecas"; desenharLista(); status(`${ZONAS[melhor].nome} (${q.x > 0 ? "lado direito" : "lado esquerdo"}): as camadas novas vão para ela.`);
});

// ---------- a esfera do material ----------
const esfera = (() => {
  const c = $("lsEsfera"), r = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true }); r.setPixelRatio(Math.min(2, devicePixelRatio)); r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping;
  const s = new THREE.Scene(); s.environment = scene.environment; s.add(new THREE.HemisphereLight(0xffffff, 0x222222, 1)); const d = new THREE.DirectionalLight(0xffffff, 2.5); d.position.set(2, 3, 3); s.add(d);
  const m = new THREE.MeshPhysicalMaterial(); s.add(new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), m));
  const cm = new THREE.PerspectiveCamera(30, 1, 0.1, 20); cm.position.set(0, 0, 4.6); let sujo = true;
  return { cor(p) { const l = p.camadas[sel]; m.color.set(l?.cor || p.c1); m.metalness = p.met / 100; m.roughness = p.rug / 100; m.envMapIntensity = p.ref / 100; m.clearcoat = (p.cc ?? 100) / 100; m.clearcoatRoughness = (p.ccr ?? 38) / 100; m.iridescence = (p.iri || 0) / 100; sujo = true; },
    quadro() { if (!sujo) return; const w = c.clientWidth, hh = c.clientHeight; if (!w) return; r.setSize(w, hh, false); cm.aspect = w / hh; cm.updateProjectionMatrix(); r.render(s, cm); sujo = false; } };
})();

// ---------- a gaveta: Cores (para a camada escolhida ou o fundo), Pinturas (de partida) e Patrocinadores ----------
let gaveta = "cores";
const PALETA = [...new Set(["#ffffff", "#c9ccd1", "#7a7f88", "#141518", "#000000", ...Object.keys(PINTURAS).flatMap((id) => coresDa(id, "#e63946")).filter(Boolean).map((c) => c.toLowerCase()), "#e10600", "#ffd400", "#00a651", "#00b4ff", "#ff5fa2", "#7b2cbf"])];
function desenharGaveta() {
  for (const b of $("lsGaveta").querySelectorAll("[data-g]")) b.classList.toggle("on", b.dataset.g === gaveta);
  const g = $("lsGav"); g.className = gaveta === "cores" ? "cores" : "";
  if (gaveta === "cores") {
    g.innerHTML = PALETA.map((c) => `<div class="amostra" data-cor="${c}" title="${c}" style="background:${c}"></div>`).join("");
    for (const f of g.querySelectorAll("[data-cor]")) f.onclick = () => { const l = P.camadas[sel]; if (l) { l.cor = f.dataset.cor; status("Cor na camada escolhida."); } else { P.c1 = f.dataset.cor; P.base = null; status("Cor de fundo trocada (base: cor lisa)."); } mudou(); };
  } else if (gaveta === "pinturas") {
    g.innerHTML = Object.entries(PINTURAS).filter(([id]) => equipeDe(id)).map(([id, p]) => { const [c1, c2] = coresDa(id, "#e63946"); return `<div class="ficha ${equipeDe(id) === P.base ? "on" : ""}" data-base="${equipeDe(id)}"><div class="dupla" style="background:linear-gradient(135deg,${c1} 55%,${c2} 55%)"></div>${h(p.name)}</div>`; }).join("");
    for (const f of g.querySelectorAll("[data-base]")) f.onclick = () => { P.base = f.dataset.base; mudou(); desenharGaveta(); status("Base trocada: as camadas continuam por cima."); };
  } else {
    const ids = [...Object.keys(PATROCINIOS).filter(Boolean), ...Object.keys(MARCAS_CAPACETE)], meus = meusLogos();
    g.innerHTML = `<label class="ficha" title="Importar um PNG (com transparência) ou JPEG" style="justify-content:center;border-style:dashed"><b style="font-size:22px">＋</b>Importar<input type="file" id="lsImp" accept="image/png,image/jpeg,image/webp" hidden></label>`
      + meus.map((m, i) => `<div class="ficha ${pondo?.img === m.url ? "on" : ""}" data-meu="${i}" title="${h(m.nome)}"><img src="${h(m.url)}" alt="">${h(m.nome)}</div>`).join("")
      + ids.map((id) => `<div class="ficha ${pondo?.marca === id ? "on" : ""}" data-marca="${id}" title="${h(nomeMarca(id))}"><img src="${miniaturaDoPatrocinio(id)}" alt="">${h(nomeMarca(id))}</div>`).join("");
    const escolher = (o, nome) => { pondo = pondo && JSON.stringify(pondo) === JSON.stringify(o) ? null : o; cv.style.cursor = pondo ? "crosshair" : ""; desenharGaveta(); status(pondo ? `${nome}: clique no carro onde ele vai (Esc cancela).` : "Cancelado."); };
    for (const f of g.querySelectorAll("[data-marca]")) f.onclick = () => escolher({ marca: f.dataset.marca }, nomeMarca(f.dataset.marca));
    for (const f of g.querySelectorAll("[data-meu]")) f.onclick = () => { const m = meus[+f.dataset.meu]; escolher({ img: m.url, nome: m.nome }, m.nome); };
    $("lsImp").onchange = (e) => importar(e.target.files[0]);
  }
}
// os logos importados: gravados pelo servidor do editor (public/corrida/pinturas/logo-<nome>.png, vão no Publicar) e, sem ele, guardados no
// navegador como imagem embutida. A lista fica no navegador (livery-logos).
const meusLogos = () => { try { return JSON.parse(localStorage.getItem("livery-logos") || "[]"); } catch { return []; } };
async function importar(arq) {
  if (!arq) return; const nome = arq.name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9_-]+/g, "-").slice(0, 40) || "logo", ext = (/\.(png|jpe?g|webp)$/i.exec(arq.name)?.[1] || "png").toLowerCase();
  let url = null; const r = await fetch(`/api/corrida/editor/livery-logo/${nome}.${ext}`, { method: "POST", headers: { "content-type": "application/octet-stream" }, body: arq }).catch(() => null);
  if (r?.ok) url = (await r.json()).url;
  else url = await new Promise((ok) => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.readAsDataURL(arq); });
  const l = meusLogos().filter((m) => m.nome !== nome); l.unshift({ nome, url }); try { localStorage.setItem("livery-logos", JSON.stringify(l.slice(0, 40))); } catch { status("O navegador não guardou o logo (grande demais): abra pelo editor-de-pistas.bat."); }
  pondo = { img: url, nome }; cv.style.cursor = "crosshair"; desenharGaveta(); status(`${nome} importado${r?.ok ? "" : " (só neste navegador)"}: clique no carro onde ele vai.`);
}
$("lsGaveta").querySelector(".abas").onclick = (e) => { const b = e.target.closest("[data-g]"); if (b) { gaveta = b.dataset.g; desenharGaveta(); } };

// ---------- começa ----------
await f1Pronto.catch(() => {});
P = await carregar(pint); ultimaFoto = JSON.stringify(P);
montar(); tudo(); desenharGaveta();
