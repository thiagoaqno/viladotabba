// O LAYOUT do editor no jeito do TRACKSCAPE (2026-11-17, a imagem do Thiago): a barra do topo (desfazer/refazer, Salvar, Publicar, a pista,
// os modos do gizmo e as vistas), à esquerda as abas Assets · Pista · Cena · Ambiente, no meio o 3D, à direita o Inspetor e o Histórico, e a
// barra de status embaixo. Nada é refeito: as seções que o editor.js já monta (cada <h3> com o que vem depois dele) são MOVIDAS para as abas,
// com os mesmos ids e os mesmos eventos. Os controles da câmera, da seleção e do teclado continuam os do editor.js e do comandos.js.
import * as THREE from "three";
import { renderer, scene, sun, hemi } from "../cena.js";

const ICONES = { Todos: "▦", Arquibancadas: "🏟", Automóveis: "🚗", Contenção: "▥", Paddock: "🏭", Vegetação: "🌳", Geral: "◇" };
// em que aba vai cada seção do painel antigo (pelo id do bloco que vem depois do título)
const ABA_DA_SECAO = { edBib: "assets", edLeves: "assets", edDe: "assets", edZebra: "pista", edLinha: "pista", edTrecho: "pista", edEsc: "pista", edPlaca: "pista", edOrig: "cena", edItem: "inspetor" };

export function montarLayout({ vigiarPainel, painel, barra, ajuda, pista, nomePista, cenario, selecionar, escolhido, pilha, refeitos, desfazer, refazer, tr }) {
  const css = document.createElement("style");
  css.textContent = `
:root{--ts-bg:#15181d;--ts-pn:#1b1f26;--ts-ln:#2a303a;--ts-tx:#e6e9ee;--ts-mu:#8b95a5;--ts-ac:#3d7bff}
#tsTopo{position:fixed;left:0;right:0;top:0;height:52px;background:var(--ts-bg);border-bottom:1px solid var(--ts-ln);display:flex;align-items:center;gap:14px;padding:0 14px;z-index:60;font:14px Barlow,system-ui,sans-serif;color:var(--ts-tx);box-sizing:border-box}
#tsTopo .logo{font-weight:800;letter-spacing:.04em;font-size:17px;display:flex;align-items:center;gap:8px;margin-right:8px}#tsTopo .logo i{display:inline-block;width:26px;height:14px;background:repeating-linear-gradient(115deg,#fff 0 5px,transparent 5px 8px)}
#tsTopo .sep{width:1px;height:26px;background:var(--ts-ln)}#tsTopo button,#tsTopo select{background:transparent;color:var(--ts-tx);border:1px solid transparent;border-radius:6px;padding:7px 10px;font:inherit;cursor:pointer}
#tsTopo button:hover{background:#232833;border-color:var(--ts-ln)}#tsTopo select{border-color:var(--ts-ln);background:#1e232b}#tsTopo .dir{margin-left:auto;display:flex;gap:10px;align-items:center;color:var(--ts-mu)}
#edBarra{position:static!important;transform:none!important;background:transparent!important;border:0!important;box-shadow:none!important;padding:0!important}#edBarra button{min-width:52px!important;padding:4px 6px!important}#edBarra button b{font-size:16px!important}#edBarra button small{font-size:10px!important}
#edBarra [data-barra=desfazer],#edBarra [data-barra=refazer],#edBarra [data-barra=craft]{display:none}
#ed{left:0!important;top:52px!important;bottom:30px!important;width:300px!important;border-radius:0!important;border:0!important;border-right:1px solid var(--ts-ln)!important;background:var(--ts-pn)!important;padding:0!important;box-shadow:none!important;backdrop-filter:none!important;display:flex;flex-direction:column}
#ed > :not(#tsAbas):not(.tsAba):not(#edCraft){display:none!important}#edCraft:not([hidden]){display:block;overflow:auto;padding:12px 14px;flex:1}#ed:has(#edCraft:not([hidden])) .tsAba{display:none!important}
#tsAbas{display:flex;border-bottom:1px solid var(--ts-ln);flex:none}#tsAbas button{flex:1;background:transparent!important;border:0!important;border-bottom:2px solid transparent!important;border-radius:0!important;padding:13px 4px!important;color:var(--ts-mu)!important;font-weight:700}#tsAbas button.on{color:#fff!important;border-bottom-color:var(--ts-ac)!important}
.tsAba{display:none;overflow:auto;padding:12px 14px;flex:1}.tsAba.on{display:block}
#edBib > .lin:first-child{flex-direction:column;align-items:stretch;gap:2px}#edBib > .lin:first-child button{text-align:left;background:transparent!important;border:0!important;padding:9px 10px!important;font-weight:500!important;font-size:14px}#edBib > .lin:first-child button.on{background:#26324a!important;color:#fff}
#edBib > .lin:nth-child(2){order:-1}#ed .edBibG{grid-template-columns:repeat(3,1fr)}#ed .edBibG button{background:#20252d!important;border:1px solid var(--ts-ln)!important}#ed .edBibG button.on{border-color:var(--ts-ac)!important;background:#26324a!important}
#tsDir{position:fixed;right:0;top:52px;bottom:30px;width:300px;background:var(--ts-pn);border-left:1px solid var(--ts-ln);z-index:50;display:flex;flex-direction:column;color:var(--ts-tx);font:14px Barlow,system-ui,sans-serif}
#tsDir .tsAba{padding:12px 14px}#tsDir h3{font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--ts-mu);margin:4px 0 10px}
#tsDir button,#tsDir select,#tsDir input{font:inherit;color:inherit;background:#1e232d;border:1px solid #333b49;border-radius:6px;padding:6px 9px}#tsDir button{cursor:pointer}#tsDir button:hover{border-color:var(--ts-ac)}
#tsDir .lin{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:7px 0}#tsDir .lin label{display:flex;gap:6px;align-items:center;color:#b9c3d3}#tsDir input[type=number]{width:72px}#tsDir small{color:var(--ts-mu)}
#tsHist div{padding:6px 8px;border-bottom:1px solid #232933;color:#c9d1dd;font-size:13px}#tsHist div.fut{opacity:.4}
#tsStatus{position:fixed;left:0;right:0;bottom:0;height:30px;background:var(--ts-bg);border-top:1px solid var(--ts-ln);display:flex;align-items:center;gap:18px;padding:0 14px;z-index:60;color:var(--ts-mu);font:12px Barlow,system-ui,sans-serif;box-sizing:border-box}
#tsStatus b{color:#7fe08a;font-weight:600}#tsStatus .erro{color:#ff8080}#tsStatus span:last-child{margin-left:auto}
#edAjuda{display:none!important}
.tsCena button{display:flex;justify-content:space-between;width:100%;text-align:left;background:transparent!important;border:0!important;border-radius:4px!important;padding:6px 8px!important;font-weight:500!important}.tsCena button:hover,.tsCena button.on{background:#26324a!important}
#tsAmb .lin{justify-content:space-between}#tsAmb input[type=range]{flex:1}`;
  document.head.appendChild(css);
  const $ = (id) => document.getElementById(id);

  // ---------- a barra do topo ----------
  const topo = document.createElement("div"); topo.id = "tsTopo";
  topo.innerHTML = `<div class="logo"><i></i>TRACKSCAPE</div>
    <button id="tsDesf" title="Desfazer (Ctrl+Z)">↶</button><button id="tsRef" title="Refazer (Ctrl+Y)">↷</button><span class="sep"></span>
    <button id="tsSalvar">💾 Salvar</button><button id="tsPub">⇪ Publicar (PR)</button><button id="tsCraft">⚒ Craft</button><span class="sep"></span>
    <span id="tsBarraLugar"></span><div class="dir"><span id="tsPistaLugar"></span></div>`;
  document.body.appendChild(topo);
  $("tsBarraLugar").appendChild(barra);
  $("tsDesf").onclick = desfazer; $("tsRef").onclick = refazer;
  $("tsSalvar").onclick = () => $("edSalvar").click(); $("tsPub").onclick = () => $("edPublicar").click();
  $("tsCraft").onclick = () => { $("edCraftBt").click(); $("tsCraft").style.background = $("edCraftBt").classList.contains("on") ? "#2f63e0" : ""; };
  $("tsPistaLugar").appendChild($("edPista"));

  // ---------- as abas da esquerda: as seções antigas são movidas para elas ----------
  const abas = document.createElement("div"); abas.id = "tsAbas";
  const NOMES = { assets: "Assets", pista: "Pista", cena: "Cena", amb: "Ambiente" };
  abas.innerHTML = Object.entries(NOMES).map(([k, n]) => `<button type="button" data-aba="${k}">${n}</button>`).join("");
  const conteudo = {}; for (const k of Object.keys(NOMES)) { const d = document.createElement("div"); d.className = "tsAba"; d.dataset.aba = k; conteudo[k] = d; }
  const dir = document.createElement("div"); dir.id = "tsDir";
  dir.innerHTML = `<div id="tsAbasDir" style="display:flex;border-bottom:1px solid var(--ts-ln)"><button type="button" data-d="insp" class="on" style="flex:1;background:transparent;border:0;border-bottom:2px solid var(--ts-ac);border-radius:0;padding:13px;color:#fff;font-weight:700">Inspetor</button><button type="button" data-d="hist" style="flex:1;background:transparent;border:0;border-bottom:2px solid transparent;border-radius:0;padding:13px;color:var(--ts-mu);font-weight:700">Histórico</button></div>
    <div class="tsAba on" data-d="insp"></div><div class="tsAba" data-d="hist"><div id="tsHist"></div></div>`;
  document.body.appendChild(dir);
  const insp = dir.querySelector('.tsAba[data-d="insp"]');
  vigiarPainel?.(dir); // (o Inspetor saiu do painel: os números dele continuam entrando no Ctrl+Z)
  // cada <h3> leva junto o que vem depois dele até o próximo <h3>
  for (const h3 of [...painel.querySelectorAll(":scope > h3")]) {
    const bloco = [h3]; for (let n = h3.nextElementSibling; n && n.tagName !== "H3"; n = n.nextElementSibling) bloco.push(n);
    const id = bloco.find((b) => b.id && ABA_DA_SECAO[b.id])?.id, destino = id ? ABA_DA_SECAO[id] : "cena";
    const alvo = destino === "inspetor" ? insp : conteudo[destino];
    for (const b of bloco) alvo.appendChild(b);
  }
  insp.querySelector("h3")?.replaceChildren("Inspetor");
  painel.prepend(abas); for (const d of Object.values(conteudo)) painel.appendChild(d);
  const abrir = (k) => { for (const b of abas.children) b.classList.toggle("on", b.dataset.aba === k); for (const d of Object.values(conteudo)) d.classList.toggle("on", d.dataset.aba === k); if (k === "cena") desenharCena(); };
  abas.onclick = (e) => { const b = e.target.closest("[data-aba]"); if (b) abrir(b.dataset.aba); };
  abrir("assets");
  dir.querySelector("#tsAbasDir").onclick = (e) => { const b = e.target.closest("[data-d]"); if (!b) return;
    for (const x of dir.querySelectorAll("#tsAbasDir button")) { const on = x === b; x.style.borderBottomColor = on ? "var(--ts-ac)" : "transparent"; x.style.color = on ? "#fff" : "var(--ts-mu)"; }
    for (const d of dir.querySelectorAll(".tsAba")) d.classList.toggle("on", d.dataset.d === b.dataset.d); if (b.dataset.d === "hist") desenharHist(); };
  // os ícones nas categorias da biblioteca (ela se redesenha: um observador põe o ícone de novo)
  const iconizar = () => { for (const b of document.querySelectorAll("#edBib [data-filtro]")) if (!b.dataset.ic) { b.dataset.ic = 1; b.textContent = `${ICONES[b.dataset.filtro] || "◇"}  ${b.textContent}`; } };
  new MutationObserver(iconizar).observe($("edBib"), { childList: true }); iconizar();

  // ---------- Cena: a hierarquia dos itens do cenário ----------
  const cenaLista = document.createElement("div"); cenaLista.className = "tsCena";
  const tituloCena = document.createElement("h3"); tituloCena.textContent = "Itens do cenário";
  conteudo.cena.prepend(tituloCena, cenaLista);
  const nomeDe = (o) => { const it = o.userData.item || {}; return it.tipo === "kit" ? it.kit : it.tipo === "linha" ? "linha · " + (it.modelo || "") : it.tipo || it.asset || o.name; };
  function desenharCena() {
    const itens = cenario.children.filter((o) => o.userData.item), atual = escolhido();
    cenaLista.innerHTML = itens.length ? itens.map((o, i) => `<button type="button" data-i="${i}" class="${o === atual ? "on" : ""}"><span>${o.visible ? "" : "◌ "}${String(nomeDe(o)).replace(/[<&]/g, "")}</span><small>${Math.round(o.position.x)}, ${Math.round(o.position.z)}</small></button>`).join("") : "<small>Nada posto ainda.</small>";
    for (const b of cenaLista.querySelectorAll("[data-i]")) b.onclick = () => { selecionar(itens[+b.dataset.i]); desenharCena(); };
  }
  for (const ev of ["childadded", "childremoved"]) cenario.addEventListener(ev, () => { if (conteudo.cena.classList.contains("on")) desenharCena(); });

  // ---------- Ambiente: o sol, a luz, a exposição e a névoa (ao vivo) ----------
  const amb = document.createElement("div"); amb.id = "tsAmb";
  const alvoSol = sun.target?.position || new THREE.Vector3(), d0 = sun.position.clone().sub(alvoSol), raio0 = d0.length() || 1;
  let alt = Math.asin(d0.y / raio0), azi = Math.atan2(d0.x, d0.z);
  const nevoa0 = scene.fog ? { near: scene.fog.near, far: scene.fog.far } : null;
  amb.innerHTML = `<h3>Sol e luz</h3>
    <div class="lin"><label>Altura do sol</label><input type="range" id="tsSolA" min="2" max="88" value="${Math.round((alt * 180) / Math.PI)}"></div>
    <div class="lin"><label>Direção do sol</label><input type="range" id="tsSolD" min="-180" max="180" value="${Math.round((azi * 180) / Math.PI)}"></div>
    <div class="lin"><label>Força do sol</label><input type="range" id="tsSolF" min="0" max="50" value="${Math.round(sun.intensity * 10)}"></div>
    <div class="lin"><label>Luz ambiente</label><input type="range" id="tsHemi" min="0" max="40" value="${Math.round(hemi.intensity * 10)}"></div>
    <div class="lin"><label>Exposição</label><input type="range" id="tsExp" min="20" max="250" value="${Math.round((renderer.toneMappingExposure || 1) * 100)}"></div>
    <h3>Névoa</h3><div class="lin"><label><input type="checkbox" id="tsNev" ${nevoa0 && scene.fog.near < 1e5 ? "checked" : ""}> Ligada</label><input type="range" id="tsNevD" min="500" max="20000" step="250" value="6000"></div>
    <small>Só para ver como fica no editor: o jogo usa a luz de cada pista.</small>`;
  conteudo.amb.appendChild(amb);
  const solAqui = () => { const r = raio0; sun.position.set(alvoSol.x + r * Math.cos(alt) * Math.sin(azi), alvoSol.y + r * Math.sin(alt), alvoSol.z + r * Math.cos(alt) * Math.cos(azi)); };
  $("tsSolA").oninput = (e) => { alt = (+e.target.value * Math.PI) / 180; solAqui(); };
  $("tsSolD").oninput = (e) => { azi = (+e.target.value * Math.PI) / 180; solAqui(); };
  $("tsSolF").oninput = (e) => { sun.intensity = +e.target.value / 10; };
  $("tsHemi").oninput = (e) => { hemi.intensity = +e.target.value / 10; };
  $("tsExp").oninput = (e) => { renderer.toneMappingExposure = +e.target.value / 100; };
  const nevoa = () => { if (!scene.fog) return; const on = $("tsNev").checked, d = +$("tsNevD").value; scene.fog.near = on ? d * 0.25 : 1e6; scene.fog.far = on ? d : 2e6; };
  $("tsNev").onchange = nevoa; $("tsNevD").oninput = nevoa;

  // ---------- Histórico: os passos do Ctrl+Z ----------
  const NOME_PASSO = { mexer: "Mexeu", por: "Pôs", tirar: "Tirou" };
  function desenharHist() {
    const el = $("tsHist"), linha = (p, fut) => `<div class="${fut ? "fut" : ""}">${NOME_PASSO[p.tipo] || p.tipo} · ${String(p.o?.userData?.item ? nomeDe(p.o) : p.o?.name || "peça").replace(/[<&]/g, "")}</div>`;
    el.innerHTML = (pilha.length || refeitos.length) ? [...refeitos].map((p) => linha(p, true)).join("") + [...pilha].reverse().map((p) => linha(p, false)).join("") : "<small>Nada feito ainda.</small>";
  }

  // ---------- a barra de status: o aviso do editor, a pista e quantos itens ----------
  const st = document.createElement("div"); st.id = "tsStatus";
  st.innerHTML = `<span id="tsMsg"><b>●</b> Pronto</span><span id="tsQtd"></span><span>${nomePista} · ${pista}</span>`;
  document.body.appendChild(st);
  const aviso = $("edAviso"); document.body.appendChild(aviso); aviso.style.display = "none";
  const copiar = () => { const s = aviso.querySelector("small"); $("tsMsg").innerHTML = s ? `<span class="${s.className === "erro" ? "erro" : ""}">${s.innerHTML}</span>` : "<b>●</b> Pronto"; };
  new MutationObserver(copiar).observe(aviso, { childList: true, subtree: true });
  setInterval(() => { $("tsQtd").textContent = `${cenario.children.length} itens · ${pilha.length} passos`; if (dir.querySelector('.tsAba[data-d="hist"]').classList.contains("on")) desenharHist(); }, 700);
  if (ajuda) ajuda.style.display = "none";
  void tr;
}
