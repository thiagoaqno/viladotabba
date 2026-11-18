// TabbaTracks (2026-11-18, o Thiago: "um visual mais parecido com um Enscape/Revit, moderno, clean e setorizado; as coisas que eu mais uso
// nem têm botão; quero ver as prévias"). O layout do editor de pistas:
//   · a barra de título: o nome, Salvar/Publicar, desfazer/refazer, o acesso rápido (mover, girar, escala) e a pista;
//   · a FAIXA (ribbon) com abas Construir · Pista · Terreno · Modificar · Vista: cada ferramenta é um botão grande com ícone, em grupos com nome;
//   · à esquerda o NAVEGADOR: Biblioteca (miniaturas grandes), Cena (os itens postos) e Importar (o conversor, os assets leves, outras pistas);
//   · à direita as PROPRIEDADES: a prévia 3D girando (da peça escolhida para pôr ou do item selecionado), as opções da ferramenta ativa e o
//     item selecionado; e o Histórico;
//   · a barra de status embaixo e os botões de vista no canto do 3D. Os dois painéis recolhem (Tab ou as setas) para ver a pista inteira.
// Nada do editor é refeito: as seções que o editor.js monta (cada <h3> com o que vem depois) são MOVIDAS para cá, com os mesmos ids e eventos,
// e os botões da faixa clicam os botões que as seções já têm. Os controles da câmera, da seleção e do teclado continuam os do editor.js.
import * as THREE from "three";
import { renderer, scene, sun, hemi } from "../cena.js";
import { montarKit, KITS } from "../biblioteca.js";

const ICONES = { Todos: "▦", Arquibancadas: "🏟", Automóveis: "🚗", Contenção: "▥", Paddock: "🏭", Vegetação: "🌳", Geral: "◇" };
// a FAIXA: aba → grupos → ferramentas. `sec` é a seção que aparece nas Propriedades; `bt` o botão dela que liga a ferramenta (se já está ligado,
// não clica de novo); `nav` abre uma aba do navegador; `acao` é um botão da barra antiga (data-barra) ou uma ação daqui.
const FAIXA = {
  Construir: [
    ["Biblioteca", [{ id: "bib", ic: "▦", nome: "Peças", nav: "bib", sec: "edBib", dica: "As peças prontas: escolha uma na Biblioteca e clique no chão" }, { id: "outras", ic: "⇄", nome: "De outras pistas", nav: "imp", sec: "edDe", dica: "Prédios e marcos das outras pistas" }, { id: "leves", ic: "⬚", nome: "Assets .glb", nav: "imp", sec: "edLeves", dica: "Os .glb convertidos" }]],
    ["Patrocínio", [{ id: "placa", ic: "▭", nome: "Placa", sec: "edPlaca", bt: "edPlPor" }, { id: "portico", ic: "⛩", nome: "Pórtico", sec: "edPlaca", bt: "edPtPor" }, { id: "marcaChao", ic: "◩", nome: "Marca no chão", sec: "edPlaca", bt: "edMcPor" }]],
    ["Montar", [{ id: "craft", ic: "⚒", nome: "Craft", acao: "craft", dica: "Montar uma peça nova com formas e materiais" }]],
  ],
  Pista: [
    ["Beira da pista", [{ id: "beira", ic: "▥", nome: "Barreira", sec: "edBeira", bt: "edBeBt", dica: "Guard-rail, pneus, cerca, Tecpro, faixa de patrocínio… seguindo a beira" }, { id: "zebra", ic: "▰", nome: "Zebra", sec: "edZebra", bt: "edZbBt" }, { id: "escape", ic: "▤", nome: "Área de escape", sec: "edEsc", bt: "edEscBt" }]],
    ["Desenhar", [{ id: "linha", ic: "⋯", nome: "Linha de itens", sec: "edLinha", bt: "edLnBt" }, { id: "trecho", ic: "〰", nome: "Trecho de pista", sec: "edTrecho", bt: "edTrBt", dica: "Só enfeite: o carro não anda nele" }]],
  ],
  Terreno: [
    ["Chão", [{ id: "area", ic: "⬠", nome: "Área", sec: "edArea", bt: "edArBt", dica: "Polígono de grama, terra, água… e o que espalhar dentro" }, { id: "pincel", ic: "⛰", nome: "Pincel de relevo", sec: "edTerreno", bt: "edTeBt" }]],
  ],
  Modificar: [
    ["Transformar", [{ id: "mover", ic: "✥", nome: "Mover", acao: "mover", tecla: "W" }, { id: "girar", ic: "⟳", nome: "Girar", acao: "girar", tecla: "E" }, { id: "escala", ic: "⤡", nome: "Escala", acao: "escala", tecla: "R" }]],
    ["Item", [{ id: "chao", ic: "⤓", nome: "No chão", acao: "tecla:g", tecla: "G" }, { id: "dup", ic: "⧉", nome: "Duplicar", acao: "tecla:d", tecla: "D" }, { id: "apagar", ic: "🗑", nome: "Apagar", acao: "tecla:Delete", tecla: "Del" }]],
    ["Histórico", [{ id: "desf", ic: "↶", nome: "Desfazer", acao: "desfazer", tecla: "Ctrl+Z" }, { id: "ref", ic: "↷", nome: "Refazer", acao: "refazer", tecla: "Ctrl+Y" }]],
  ],
  Vista: [
    ["Câmera", [{ id: "cima", ic: "⬒", nome: "De cima", acao: "cima", tecla: "1" }, { id: "lado", ic: "◧", nome: "De lado", acao: "lado", tecla: "2" }, { id: "frente", ic: "▣", nome: "De frente", acao: "frente", tecla: "3" }, { id: "v3d", ic: "◈", nome: "3D", acao: "v3d", tecla: "4" }, { id: "focar", ic: "◎", nome: "Focar", acao: "focar", tecla: "F" }]],
    ["Medir", [{ id: "medir", ic: "📏", nome: "Régua", acao: "medir", tecla: "Shift+R" }, { id: "limparMedidas", ic: "⌫", nome: "Limpar medidas", acao: "limparMedidas" }]],
    ["Ambiente", [{ id: "amb", ic: "☀", nome: "Sol e névoa", sec: "tsAmb", dica: "Só para ver no editor" }]],
  ],
};
const FERRAMENTAS = Object.values(FAIXA).flatMap((gs) => gs.flatMap((g) => g[1]));
// em que lugar vai cada seção antiga (pelo id do bloco que vem depois do <h3>)
const NAV_DA_SECAO = { edBib: "bib", edOrig: "imp", edLeves: "imp", edDe: "imp" };

export function montarLayout({ vigiarPainel, painel, barra, ajuda, pista, nomePista, cenario, selecionar, escolhido, pilha, refeitos, desfazer, refazer, tr }) {
  document.title = `TabbaTracks · ${nomePista}`;
  const css = document.createElement("style");
  css.textContent = `
:root{--tt-bg:#111317;--tt-pn:#181b20;--tt-pn2:#1e2228;--tt-ln:#2a2f37;--tt-tx:#e8eaee;--tt-mu:#8a93a2;--tt-ac:#e8a33d;--tt-ac2:#3d7bff;--tt-top:40px;--tt-rib:96px;--tt-sb:28px;--tt-l:300px;--tt-r:320px}
body.modo-editor{font-family:Inter,Barlow,system-ui,sans-serif}
#edBarra,#edAjuda,#edCmd{display:none!important}
/* barra de título */
#ttTopo{position:fixed;left:0;right:0;top:0;height:var(--tt-top);background:var(--tt-bg);display:flex;align-items:center;gap:6px;padding:0 10px;z-index:62;color:var(--tt-tx);font:13px Inter,Barlow,system-ui,sans-serif;box-sizing:border-box;border-bottom:1px solid #000}
#ttTopo .logo{display:flex;align-items:center;gap:8px;font-weight:800;font-size:15px;letter-spacing:.02em;margin-right:10px}#ttTopo .logo i{width:22px;height:22px;border-radius:6px;background:linear-gradient(135deg,var(--tt-ac),#d4572a);display:grid;place-items:center;font-style:normal;font-size:12px;color:#111}
#ttTopo .logo span{color:var(--tt-ac)}#ttTopo .sep{width:1px;height:20px;background:var(--tt-ln);margin:0 4px}
#ttTopo button{background:transparent;color:var(--tt-tx);border:1px solid transparent;border-radius:6px;height:28px;padding:0 9px;font:inherit;cursor:pointer;display:flex;align-items:center;gap:6px}
#ttTopo button:hover{background:#22262d;border-color:var(--tt-ln)}#ttTopo button.on{background:#2a3446;border-color:#3b4a66}
#ttTopo .pri{background:var(--tt-ac);color:#14161a;font-weight:700}#ttTopo .pri:hover{background:#f2b453;border-color:transparent}
#ttTopo .dir{margin-left:auto;display:flex;gap:8px;align-items:center;color:var(--tt-mu)}#ttTopo select{background:var(--tt-pn2);color:var(--tt-tx);border:1px solid var(--tt-ln);border-radius:6px;height:28px;padding:0 8px;font:inherit}
/* a faixa */
#ttFaixa{position:fixed;left:0;right:0;top:var(--tt-top);height:var(--tt-rib);background:var(--tt-pn);border-bottom:1px solid var(--tt-ln);z-index:61;color:var(--tt-tx);font:12px Inter,Barlow,system-ui,sans-serif;display:flex;flex-direction:column}
#ttAbasF{display:flex;gap:2px;padding:0 10px;height:28px;align-items:flex-end;background:var(--tt-bg)}
#ttAbasF button{background:transparent;border:0;color:var(--tt-mu);padding:6px 14px;font:600 12px inherit;font-family:inherit;cursor:pointer;border-radius:6px 6px 0 0}#ttAbasF button:hover{color:var(--tt-tx)}#ttAbasF button.on{background:var(--tt-pn);color:var(--tt-tx);box-shadow:inset 0 2px 0 var(--tt-ac)}
#ttGrupos{flex:1;display:flex;align-items:stretch;padding:4px 6px;gap:0;overflow-x:auto}
.ttG{display:flex;flex-direction:column;padding:0 8px;border-right:1px solid var(--tt-ln)}.ttG>div{display:flex;gap:2px;flex:1;align-items:center}.ttG>small{text-align:center;color:var(--tt-mu);font-size:10.5px;letter-spacing:.04em;padding-top:1px}
.ttF{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-width:62px;height:52px;padding:0 6px;background:transparent;border:1px solid transparent;border-radius:7px;color:var(--tt-tx);cursor:pointer;font:500 11.5px Inter,Barlow,system-ui,sans-serif;white-space:nowrap}
.ttF b{font-size:20px;line-height:1;font-weight:400}.ttF:hover{background:#242930;border-color:var(--tt-ln)}.ttF.on{background:rgba(232,163,61,.16);border-color:var(--tt-ac);color:#ffd9a0}
/* painéis */
#ed,#ttDir{position:fixed!important;top:calc(var(--tt-top) + var(--tt-rib))!important;bottom:var(--tt-sb)!important;background:var(--tt-pn)!important;color:var(--tt-tx);z-index:50;display:flex;flex-direction:column;box-sizing:border-box;transition:transform .18s ease;font:13px Inter,Barlow,system-ui,sans-serif!important}
#ed{left:0!important;width:var(--tt-l)!important;border:0!important;border-right:1px solid var(--tt-ln)!important;border-radius:0!important;padding:0!important;box-shadow:none!important;backdrop-filter:none!important;overflow:hidden!important}
#ttDir{right:0;width:var(--tt-r);border-left:1px solid var(--tt-ln)}
body.ttSemEsq #ed{transform:translateX(-100%)}body.ttSemDir #ttDir{transform:translateX(100%)}
#ed > :not(.ttCab):not(.ttNav){display:none!important}
.ttCab{display:flex;border-bottom:1px solid var(--tt-ln);flex:none;background:var(--tt-bg)}.ttCab button{flex:1;background:transparent!important;border:0!important;border-radius:0!important;padding:10px 4px!important;font:600 12px Inter,Barlow,system-ui,sans-serif!important;color:var(--tt-mu)!important;cursor:pointer;box-shadow:none}
.ttCab button.on{color:var(--tt-tx)!important;box-shadow:inset 0 -2px 0 var(--tt-ac)}
.ttNav{display:none;overflow:auto;padding:12px;flex:1}.ttNav.on{display:block}
.ttSec{margin:0 0 14px}.ttSec>h3,#ttDir h3,.ttNav h3{font:700 10.5px Inter,Barlow,system-ui,sans-serif!important;letter-spacing:.12em!important;text-transform:uppercase;color:var(--tt-mu)!important;margin:0 0 8px!important;padding:0!important;border:0!important}
#ed button,#ed select,#ed input,#ttDir button,#ttDir select,#ttDir input{font:13px Inter,Barlow,system-ui,sans-serif!important;color:var(--tt-tx)!important;background:var(--tt-pn2)!important;border:1px solid var(--tt-ln)!important;border-radius:6px!important;padding:6px 9px!important;font-weight:500!important}
#ed button:hover,#ttDir button:hover{border-color:#4a5262!important;background:#252a32!important}#ed button.on,#ttDir button.on{background:rgba(232,163,61,.16)!important;border-color:var(--tt-ac)!important;color:#ffd9a0!important}
#ttDir .ferr,#ed .ferr{display:block;width:100%;padding:10px!important;font-weight:700!important;background:var(--tt-ac)!important;border-color:var(--tt-ac)!important;color:#14161a!important}#ttDir .ferr.on,#ed .ferr.on{background:#2a3446!important;border-color:var(--tt-ac2)!important;color:#cfe0ff!important}
#ed .lin,#ttDir .lin{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:7px 0}#ed .lin label,#ttDir .lin label{display:flex;gap:6px;align-items:center;color:#b6bfcc}
#ttDir input[type=number],#ed input[type=number]{width:72px}#ttDir input[type=color],#ed input[type=color]{padding:2px!important;width:36px;height:28px}#ttDir small,#ed small{color:var(--tt-mu);line-height:1.4}#ttDir select{max-width:100%}
#ed .lst{display:flex;flex-direction:column;gap:3px;max-height:none}#ed .lst button{display:flex;justify-content:space-between;text-align:left}
/* a biblioteca */
#edBib > .lin:first-child{display:flex;flex-wrap:wrap;gap:4px}#edBib > .lin:first-child button{padding:4px 9px!important;border-radius:20px!important;font-size:12px!important}
#edBib > .lin:nth-child(3){order:-1}#edBib{display:flex;flex-direction:column}#edBib input#edBibBusca{width:100%;box-sizing:border-box;padding:8px 10px!important}
#ed .edBibG{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin:6px 0 12px}#ed .edBibG button{display:flex!important;flex-direction:column;align-items:stretch;gap:0;padding:0!important;overflow:hidden;background:var(--tt-pn2)!important}
#ed .edBibG img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:0;background:#1b2029;display:block}#ed .edBibG span{font-size:11.5px;padding:6px 6px 7px;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#ed .edBibG button.on{box-shadow:0 0 0 2px var(--tt-ac)}#edBib > small{font:700 10.5px Inter,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:var(--tt-mu);margin-top:6px}
#edPrev{width:100%;height:170px;border-radius:8px;display:block;background:#0b0d11}
/* propriedades */
#ttPrevBox{flex:none;position:relative;background:radial-gradient(circle at 50% 40%,#2a2f38,#121418);border-bottom:1px solid var(--tt-ln);height:190px}#ttPrevBox canvas{width:100%;height:100%;display:block}
#ttPrevBox .rot{position:absolute;left:10px;bottom:8px;right:10px;font:600 12px Inter,sans-serif;color:#dfe3ea;text-shadow:0 1px 3px #000;display:flex;justify-content:space-between}#ttPrevBox .rot small{color:var(--tt-mu)!important;font-weight:500}
#ttPrevBox .vazio{position:absolute;inset:0;display:grid;place-items:center;color:var(--tt-mu);font-size:12px;text-align:center;padding:20px}
.ttBloco{border-bottom:1px solid var(--tt-ln);padding:12px}.ttBloco:last-child{border-bottom:0}
#ttHist div{padding:6px 8px;border-bottom:1px solid #22262d;color:#c9d1dd;font-size:12.5px}#ttHist div.fut{opacity:.4}
.ttCena button{display:flex!important;justify-content:space-between;width:100%;text-align:left;background:transparent!important;border:0!important;padding:6px 8px!important}.ttCena button.on{background:rgba(232,163,61,.14)!important}
#tsAmb .lin{justify-content:space-between}#tsAmb input[type=range]{flex:1}
/* status e vistas */
#ttStatus{position:fixed;left:0;right:0;bottom:0;height:var(--tt-sb);background:var(--tt-bg);border-top:1px solid var(--tt-ln);display:flex;align-items:center;gap:18px;padding:0 12px;z-index:62;color:var(--tt-mu);font:12px Inter,Barlow,system-ui,sans-serif;box-sizing:border-box}
#ttStatus b{color:#7fe08a;font-weight:600}#ttStatus .erro{color:#ff8080}#ttStatus a{color:#9cc2ff}#ttStatus .fim{margin-left:auto;display:flex;gap:14px}
#ttVistas{position:fixed;top:calc(var(--tt-top) + var(--tt-rib) + 10px);right:calc(var(--tt-r) + 10px);z-index:49;display:flex;flex-direction:column;gap:4px;transition:right .18s}body.ttSemDir #ttVistas{right:10px}
#ttVistas button{width:38px;height:34px;background:rgba(24,27,32,.88);border:1px solid var(--tt-ln);border-radius:7px;color:var(--tt-tx);cursor:pointer;font-size:15px;backdrop-filter:blur(4px)}#ttVistas button:hover{border-color:var(--tt-ac)}
.ttRecolhe{position:fixed;top:50%;z-index:51;width:16px;height:48px;background:var(--tt-pn);border:1px solid var(--tt-ln);color:var(--tt-mu);cursor:pointer;padding:0;font-size:10px;transition:left .18s,right .18s}
#ttRecE{left:var(--tt-l);border-left:0;border-radius:0 6px 6px 0}body.ttSemEsq #ttRecE{left:0}#ttRecD{right:var(--tt-r);border-right:0;border-radius:6px 0 0 6px}body.ttSemDir #ttRecD{right:0}
#edCraft{padding:0}
.ttAlca{position:fixed;top:calc(var(--tt-top) + var(--tt-rib));bottom:var(--tt-sb);width:6px;cursor:col-resize;z-index:52;transition:background .12s}.ttAlca:hover,.ttAlca.on{background:rgba(232,163,61,.55)}
#ttAlcaE{left:calc(var(--tt-l) - 3px)}#ttAlcaD{right:calc(var(--tt-r) - 3px)}body.ttSemEsq #ttAlcaE,body.ttSemDir #ttAlcaD{display:none}`;
  document.head.appendChild(css);
  const $ = (id) => document.getElementById(id);
  const h = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  // ---------- a barra de título ----------
  const topo = document.createElement("div"); topo.id = "ttTopo";
  topo.innerHTML = `<div class="logo"><i>TT</i>Tabba<span>Tracks</span></div>
    <button id="ttSalvar" class="pri" title="Salvar (Ctrl+S)">💾 Salvar</button><button id="ttPub" title="Salva e abre um PR no GitHub">⇪ Publicar</button><span class="sep"></span>
    <button id="ttDesf" title="Desfazer (Ctrl+Z)">↶</button><button id="ttRef" title="Refazer (Ctrl+Y)">↷</button><span class="sep"></span>
    <button data-rap="mover" title="Mover (W)">✥</button><button data-rap="girar" title="Girar (E)">⟳</button><button data-rap="escala" title="Escala (R)">⤡</button>
    <div class="dir"><a href="/corrida/livery.html" target="_blank" rel="noopener" style="color:var(--tt-tx);text-decoration:none;border:1px solid var(--tt-ln);border-radius:6px;padding:5px 9px" title="O editor de pinturas dos carros">🏎 Livery Studio</a><span>Pista</span><span id="ttPistaLugar"></span></div>`;
  document.body.appendChild(topo);
  const barraClica = (k) => barra.querySelector(`[data-barra="${k}"]`)?.click();
  $("ttDesf").onclick = desfazer; $("ttRef").onclick = refazer;
  $("ttSalvar").onclick = () => $("edSalvar").click(); $("ttPub").onclick = () => $("edPublicar").click();
  for (const b of topo.querySelectorAll("[data-rap]")) b.onclick = () => barraClica(b.dataset.rap);
  $("ttPistaLugar").appendChild($("edPista"));
  addEventListener("keydown", (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); $("edSalvar").click(); } });

  // ---------- os painéis: o navegador (esquerda) e as propriedades (direita) ----------
  const cabNav = document.createElement("div"); cabNav.className = "ttCab";
  const NAVS = { bib: "Biblioteca", cena: "Cena", imp: "Importar" };
  cabNav.innerHTML = Object.entries(NAVS).map(([k, n]) => `<button type="button" data-nav="${k}">${n}</button>`).join("");
  const nav = {}; for (const k of Object.keys(NAVS)) { const d = document.createElement("div"); d.className = "ttNav"; d.dataset.nav = k; nav[k] = d; }
  const dir = document.createElement("div"); dir.id = "ttDir";
  dir.innerHTML = `<div class="ttCab"><button type="button" data-d="prop" class="on">Propriedades</button><button type="button" data-d="hist">Histórico</button></div>
    <div id="ttPrevBox"><canvas id="ttPrev"></canvas><div class="vazio" id="ttPrevVazio">Escolha uma peça na Biblioteca ou clique num item para ver a prévia aqui.</div><div class="rot" id="ttPrevRot"></div></div>
    <div class="ttNav on" data-d="prop" style="padding:0"><div class="ttBloco" id="ttFerr"><h3 id="ttFerrT">Ferramenta</h3><div id="ttFerrC"><small>Escolha uma ferramenta na faixa lá em cima.</small></div></div><div class="ttBloco" id="ttSel"></div></div>
    <div class="ttNav" data-d="hist"><div id="ttHist"></div></div>`;
  document.body.appendChild(dir);
  vigiarPainel?.(dir); // (as Propriedades saíram do painel: os números delas continuam entrando no Ctrl+Z)
  // cada <h3> leva junto o que vem depois dele até o próximo <h3>; as seções de ferramenta ficam guardadas e aparecem uma de cada vez
  const secoes = {};
  for (const h3 of [...painel.querySelectorAll(":scope > h3")]) {
    const bloco = [h3]; for (let n = h3.nextElementSibling; n && n.tagName !== "H3"; n = n.nextElementSibling) bloco.push(n);
    const id = bloco.find((b) => b.id)?.id || ""; const sec = document.createElement("div"); sec.className = "ttSec"; sec.dataset.sec = id;
    for (const b of bloco) sec.appendChild(b);
    if (id === "edItem") { h3.remove(); $("ttSel").append(Object.assign(document.createElement("h3"), { textContent: "Seleção" }), ...sec.childNodes); continue; }
    if (NAV_DA_SECAO[id]) nav[NAV_DA_SECAO[id]].appendChild(sec); else secoes[id] = sec;
  }
  // a Biblioteca já tem o seu título na aba; Importar: o conversor primeiro, depois os assets e as outras pistas
  nav.bib.querySelector("h3")?.remove();
  painel.prepend(cabNav); for (const d of Object.values(nav)) painel.appendChild(d);
  const craftEl = $("edCraft"); if (craftEl) $("ttFerrC").after(craftEl);
  const abrirNav = (k) => { for (const b of cabNav.children) b.classList.toggle("on", b.dataset.nav === k); for (const d of Object.values(nav)) d.classList.toggle("on", d.dataset.nav === k); if (k === "cena") desenharCena(); document.body.classList.remove("ttSemEsq"); };
  cabNav.onclick = (e) => { const b = e.target.closest("[data-nav]"); if (b) abrirNav(b.dataset.nav); };
  abrirNav("bib");
  dir.querySelector(".ttCab").onclick = (e) => { const b = e.target.closest("[data-d]"); if (!b) return;
    for (const x of dir.querySelectorAll(".ttCab button")) x.classList.toggle("on", x === b);
    for (const d of dir.querySelectorAll(":scope > .ttNav")) d.classList.toggle("on", d.dataset.d === b.dataset.d); if (b.dataset.d === "hist") desenharHist(); };
  const iconizar = () => { for (const b of document.querySelectorAll("#edBib [data-filtro]")) if (!b.dataset.ic) { b.dataset.ic = 1; b.textContent = `${ICONES[b.dataset.filtro] || "◇"} ${b.textContent}`; } };
  new MutationObserver(iconizar).observe($("edBib"), { childList: true }); iconizar();

  // ---------- a faixa ----------
  const faixa = document.createElement("div"); faixa.id = "ttFaixa";
  faixa.innerHTML = `<div id="ttAbasF">${Object.keys(FAIXA).map((k) => `<button type="button" data-fx="${k}">${k}</button>`).join("")}</div><div id="ttGrupos"></div>`;
  document.body.appendChild(faixa);
  let abaFaixa = "Construir", ferrAtiva = null;
  function desenharFaixa() {
    for (const b of faixa.querySelectorAll("[data-fx]")) b.classList.toggle("on", b.dataset.fx === abaFaixa);
    $("ttGrupos").innerHTML = FAIXA[abaFaixa].map(([nome, fs]) => `<div class="ttG"><div>${fs.map((f) => `<button type="button" class="ttF" data-f="${f.id}" title="${h((f.dica || f.nome) + (f.tecla ? ` (${f.tecla})` : ""))}"><b>${f.ic}</b>${h(f.nome)}</button>`).join("")}</div><small>${h(nome)}</small></div>`).join("");
    marcarFaixa();
  }
  faixa.querySelector("#ttAbasF").onclick = (e) => { const b = e.target.closest("[data-fx]"); if (b) { abaFaixa = b.dataset.fx; desenharFaixa(); } };
  // a seção de uma ferramenta nas Propriedades
  function mostrarSecao(id, titulo) {
    const c = $("ttFerrC"); for (const s of Object.values(secoes)) if (s.parentNode === c) s.remove();
    $("ttFerrT").textContent = titulo || "Ferramenta";
    if (id && secoes[id]) { const s = secoes[id]; s.querySelector(":scope > h3")?.setAttribute("hidden", ""); c.replaceChildren(s); } else c.innerHTML = "<small>Escolha uma ferramenta na faixa lá em cima.</small>";
    document.body.classList.remove("ttSemDir");
  }
  function usar(f) {
    if (f.nav) abrirNav(f.nav);
    if (f.sec) { ferrAtiva = f.id; mostrarSecao(f.sec, f.nome); }
    if (f.bt) { const b = $(f.bt); if (b && !b.classList.contains("on")) b.click(); }
    if (f.acao) {
      if (f.acao === "desfazer") desfazer(); else if (f.acao === "refazer") refazer();
      else if (f.acao.startsWith("tecla:")) dispatchEvent(new KeyboardEvent("keydown", { key: f.acao.slice(6) }));
      else if (f.acao === "craft") { $("edCraftBt").click(); ferrAtiva = $("edCraftBt").classList.contains("on") ? "craft" : null; if (ferrAtiva) mostrarSecao(null, "Craft"); }
      else barraClica(f.acao);
    }
    marcarFaixa(); atualizarPrevia(true);
  }
  // (2026-11-18, o Thiago: "apertei em pôr pórtico e depois em pôr asset, mas o menu da direita ficou só no pórtico") escolher uma peça no
  // painel da esquerda troca a ferramenta da direita (o pórtico, a placa... saem) e mostra que é só clicar no chão
  for (const d of Object.values(nav)) d.addEventListener("click", (e) => {
    if (!e.target.closest("button,[data-kit],[data-leve],[data-de],.ficha")) return;
    setTimeout(() => { ferrAtiva = d.dataset.nav === "bib" ? "bib" : "leves"; mostrarSecao(null, "Pôr peça"); $("ttFerrC").innerHTML = "<small>Peça escolhida na esquerda: clique no chão para pôr (Esc cancela). Depois de posta, as propriedades dela aparecem em Seleção.</small>"; marcarFaixa(); atualizarPrevia(true); });
  });
  $("ttGrupos").onclick = (e) => { const b = e.target.closest("[data-f]"); if (b) usar(FERRAMENTAS.find((f) => f.id === b.dataset.f)); };
  // o que está ligado: a ferramenta que tem o botão "on", o modo do gizmo, a régua e o Craft (lido da barra antiga e das seções)
  function marcarFaixa() {
    const ligada = (f) => (f.bt ? !!$(f.bt)?.classList.contains("on") : f.acao && barra.querySelector(`[data-barra="${f.acao}"]`)?.classList.contains("on")) || (f.sec && f.id === ferrAtiva && !f.bt);
    for (const b of document.querySelectorAll("#ttGrupos [data-f]")) { const f = FERRAMENTAS.find((x) => x.id === b.dataset.f); b.classList.toggle("on", !!ligada(f)); }
    for (const b of topo.querySelectorAll("[data-rap]")) b.classList.toggle("on", !!barra.querySelector(`[data-barra="${b.dataset.rap}"]`)?.classList.contains("on"));
  }
  desenharFaixa();

  // ---------- os botões de vista no canto e o recolher dos painéis ----------
  const vistas = document.createElement("div"); vistas.id = "ttVistas";
  vistas.innerHTML = [["cima", "⬒", "De cima (1)"], ["lado", "◧", "De lado (2)"], ["frente", "▣", "De frente (3)"], ["v3d", "◈", "3D (4)"], ["focar", "◎", "Focar no escolhido (F)"]].map(([k, i, t]) => `<button type="button" data-v="${k}" title="${t}">${i}</button>`).join("");
  vistas.onclick = (e) => { const b = e.target.closest("[data-v]"); if (b) barraClica(b.dataset.v); };
  document.body.appendChild(vistas);
  for (const [id, cls, seta] of [["ttRecE", "ttSemEsq", "◀"], ["ttRecD", "ttSemDir", "▶"]]) {
    const b = document.createElement("button"); b.id = id; b.className = "ttRecolhe"; b.title = "Recolher o painel (Tab: os dois)"; b.textContent = seta;
    b.onclick = () => { document.body.classList.toggle(cls); b.textContent = document.body.classList.contains(cls) ? (seta === "◀" ? "▶" : "◀") : seta; }; document.body.appendChild(b);
  }
  addEventListener("keydown", (e) => { if (e.key !== "Tab" || e.target.closest?.("input,select,textarea")) return; e.preventDefault(); const tudo = !(document.body.classList.contains("ttSemEsq") && document.body.classList.contains("ttSemDir")); document.body.classList.toggle("ttSemEsq", tudo); document.body.classList.toggle("ttSemDir", tudo); });

  // ---------- (2026-11-18, o Thiago: "deve ser possível mudar o tamanho das abas") as larguras dos painéis: arraste a borda ----------
  const TAM = (() => { try { return { l: 300, r: 320, ...JSON.parse(localStorage.getItem("tt-paineis") || "{}") }; } catch { return { l: 300, r: 320 }; } })();
  const aplicarTam = () => { document.documentElement.style.setProperty("--tt-l", TAM.l + "px"); document.documentElement.style.setProperty("--tt-r", TAM.r + "px"); };
  aplicarTam();
  for (const [id, k] of [["ttAlcaE", "l"], ["ttAlcaD", "r"]]) {
    const a = document.createElement("div"); a.id = id; a.className = "ttAlca"; a.title = "Arraste para mudar a largura (duplo clique volta ao padrão)"; document.body.appendChild(a);
    a.onpointerdown = (e) => { a.setPointerCapture(e.pointerId); a.classList.add("on"); const x0 = e.clientX, t0 = TAM[k];
      a.onpointermove = (ev) => { TAM[k] = Math.round(Math.max(220, Math.min(innerWidth * 0.45, t0 + (k === "l" ? ev.clientX - x0 : x0 - ev.clientX)))); aplicarTam(); };
      a.onpointerup = () => { a.onpointermove = null; a.classList.remove("on"); try { localStorage.setItem("tt-paineis", JSON.stringify(TAM)); } catch {} }; };
    a.ondblclick = () => { TAM[k] = k === "l" ? 300 : 320; aplicarTam(); try { localStorage.setItem("tt-paineis", JSON.stringify(TAM)); } catch {} };
  }

  // ---------- Cena: os itens postos ----------
  const cenaLista = document.createElement("div"); cenaLista.className = "ttCena";
  nav.cena.append(Object.assign(document.createElement("h3"), { textContent: "Itens do cenário" }), cenaLista);
  const nomeDe = (o) => { const it = o.userData.item || {}; return it.tipo === "kit" ? KITS[it.kit]?.nome || it.kit : it.tipo === "linha" ? "Linha · " + String(it.modelo || "").replace("kit:", "") : it.tipo || it.asset || o.name; };
  function desenharCena() {
    const itens = cenario.children.filter((o) => o.userData.item), atual = escolhido();
    cenaLista.innerHTML = itens.length ? itens.map((o, i) => `<button type="button" data-i="${i}" class="${o === atual ? "on" : ""}"><span>${o.visible ? "" : "◌ "}${h(nomeDe(o))}</span><small>${Math.round(o.position.x)}, ${Math.round(o.position.z)}</small></button>`).join("") : "<small>Nada posto ainda.</small>";
    for (const b of cenaLista.querySelectorAll("[data-i]")) b.onclick = () => { selecionar(itens[+b.dataset.i]); desenharCena(); };
  }
  for (const ev of ["childadded", "childremoved"]) cenario.addEventListener(ev, () => { if (nav.cena.classList.contains("on")) desenharCena(); });

  // ---------- Ambiente (uma seção de ferramenta: Vista › Sol e névoa) ----------
  const amb = document.createElement("div"); amb.id = "tsAmb";
  const alvoSol = sun.target?.position || new THREE.Vector3(), d0 = sun.position.clone().sub(alvoSol), raio0 = d0.length() || 1;
  let alt = Math.asin(d0.y / raio0), azi = Math.atan2(d0.x, d0.z);
  amb.innerHTML = `<div class="lin"><label>Altura do sol</label><input type="range" id="tsSolA" min="2" max="88" value="${Math.round((alt * 180) / Math.PI)}"></div>
    <div class="lin"><label>Direção do sol</label><input type="range" id="tsSolD" min="-180" max="180" value="${Math.round((azi * 180) / Math.PI)}"></div>
    <div class="lin"><label>Força do sol</label><input type="range" id="tsSolF" min="0" max="50" value="${Math.round(sun.intensity * 10)}"></div>
    <div class="lin"><label>Luz ambiente</label><input type="range" id="tsHemi" min="0" max="40" value="${Math.round(hemi.intensity * 10)}"></div>
    <div class="lin"><label>Exposição</label><input type="range" id="tsExp" min="20" max="250" value="${Math.round((renderer.toneMappingExposure || 1) * 100)}"></div>
    <div class="lin"><label><input type="checkbox" id="tsNev" ${scene.fog && scene.fog.near < 1e5 ? "checked" : ""}> Névoa</label><input type="range" id="tsNevD" min="500" max="20000" step="250" value="6000"></div>
    <small>Só para ver como fica no editor: o jogo usa a luz de cada pista.</small>`;
  const secAmb = document.createElement("div"); secAmb.className = "ttSec"; secAmb.appendChild(amb); secoes.tsAmb = secAmb;
  const solAqui = () => { sun.position.set(alvoSol.x + raio0 * Math.cos(alt) * Math.sin(azi), alvoSol.y + raio0 * Math.sin(alt), alvoSol.z + raio0 * Math.cos(alt) * Math.cos(azi)); };
  amb.querySelector("#tsSolA").oninput = (e) => { alt = (+e.target.value * Math.PI) / 180; solAqui(); };
  amb.querySelector("#tsSolD").oninput = (e) => { azi = (+e.target.value * Math.PI) / 180; solAqui(); };
  amb.querySelector("#tsSolF").oninput = (e) => { sun.intensity = +e.target.value / 10; };
  amb.querySelector("#tsHemi").oninput = (e) => { hemi.intensity = +e.target.value / 10; };
  amb.querySelector("#tsExp").oninput = (e) => { renderer.toneMappingExposure = +e.target.value / 100; };
  const nevoa = () => { if (!scene.fog) return; const on = amb.querySelector("#tsNev").checked, d = +amb.querySelector("#tsNevD").value; scene.fog.near = on ? d * 0.25 : 1e6; scene.fog.far = on ? d : 2e6; };
  amb.querySelector("#tsNev").onchange = nevoa; amb.querySelector("#tsNevD").oninput = nevoa;

  // ---------- a PRÉVIA 3D: a peça escolhida para pôr (ou a que o mouse está em cima, na Biblioteca), senão o item selecionado ----------
  const pc = $("ttPrev"), pr = new THREE.WebGLRenderer({ canvas: pc, antialias: true, alpha: true }); pr.setPixelRatio(Math.min(2, devicePixelRatio)); pr.outputColorSpace = THREE.SRGBColorSpace;
  const ps = new THREE.Scene(); ps.add(new THREE.HemisphereLight(0xffffff, 0x445566, 2.2)); const pd = new THREE.DirectionalLight(0xffffff, 2.2); pd.position.set(3, 5, 4); ps.add(pd);
  const pcam = new THREE.PerspectiveCamera(32, 1, 0.1, 1e6); let pObj = null, pChave = "", pCen = new THREE.Vector3(), pTam = 1, sobre = null;
  const chao = new THREE.Mesh(new THREE.CircleGeometry(1, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x2a2f38, roughness: 1 })); ps.add(chao);
  function porNaPrevia(chave, fazer, rotulo) {
    if (chave === pChave) return; pChave = chave;
    if (pObj) ps.remove(pObj); pObj = null; $("ttPrevRot").innerHTML = "";
    $("ttPrevVazio").style.display = chave ? "none" : ""; if (!chave) return;
    const o = fazer(); if (!o) return; o.position.set(0, 0, 0); o.rotation.set(0, o.rotation.y, 0); o.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(o); if (b.isEmpty()) return; b.getCenter(pCen); pTam = b.getSize(new THREE.Vector3()).length() || 1;
    chao.scale.setScalar(pTam * 0.8); chao.position.set(pCen.x, b.min.y - 0.01, pCen.z); pObj = o; ps.add(o);
    const s = b.getSize(new THREE.Vector3()), m = (v) => (v / 4.8).toFixed(1);
    $("ttPrevRot").innerHTML = `<span>${h(rotulo)}</span><small>${m(s.x)} × ${m(s.z)} × ${m(s.y)} m</small>`;
  }
  function atualizarPrevia() {
    const kitSobre = sobre, kitBt = document.querySelector("#edBib .edBibG button.on")?.dataset.kit, o = escolhido();
    const kit = kitSobre || kitBt;
    if (kit && KITS[kit]) return porNaPrevia("kit:" + kit, () => montarKit(kit), KITS[kit].nome);
    if (o && o.parent) return porNaPrevia("o:" + o.uuid + ":" + (o.userData.item ? JSON.stringify(o.userData.item).length : ""), () => { const c = o.clone(true); c.scale.setScalar(1); return c; }, o.userData.item ? nomeDe(o) : o.name || "Peça da pista");
    porNaPrevia("", null, "");
  }
  $("edBib").addEventListener("pointerover", (e) => { const b = e.target.closest("[data-kit]"); sobre = b ? b.dataset.kit : null; atualizarPrevia(); });
  $("edBib").addEventListener("pointerleave", () => { sobre = null; atualizarPrevia(); });
  let tPrev = 0;
  (function quadro(t) {
    requestAnimationFrame(quadro);
    if (!pObj || document.body.classList.contains("ttSemDir") || t - tPrev < 33) return; tPrev = t; // (30 quadros por segundo bastam)
    const w = pc.clientWidth, hh = pc.clientHeight; if (!w || !hh) return;
    if (pc.width !== Math.round(w * pr.getPixelRatio())) { pr.setSize(w, hh, false); pcam.aspect = w / hh; pcam.updateProjectionMatrix(); }
    const a = t / 3000; pcam.position.set(pCen.x + Math.cos(a) * pTam * 0.95, pCen.y + pTam * 0.45, pCen.z + Math.sin(a) * pTam * 0.95); pcam.lookAt(pCen); pr.render(ps, pcam);
  })(0);

  // ---------- Histórico ----------
  const NOME_PASSO = { mexer: "Mexeu", por: "Pôs", tirar: "Tirou", terreno: "Pincel" };
  function desenharHist() {
    const el = $("ttHist"), linha = (p, fut) => `<div class="${fut ? "fut" : ""}">${NOME_PASSO[p.tipo] || p.tipo || "Passo"} · ${h(p.o?.userData?.item ? nomeDe(p.o) : p.o?.name || "peça")}</div>`;
    el.innerHTML = (pilha.length || refeitos.length) ? [...refeitos].map((p) => linha(p, true)).join("") + [...pilha].reverse().map((p) => linha(p, false)).join("") : "<small>Nada feito ainda.</small>";
  }

  // ---------- a barra de status ----------
  const st = document.createElement("div"); st.id = "ttStatus";
  st.innerHTML = `<span id="ttMsg"><b>●</b> Pronto</span><span class="fim"><span id="ttQtd"></span><span>${h(nomePista)}</span><span>Tab: painéis · Shift+WASD: andar</span></span>`;
  document.body.appendChild(st);
  const aviso = $("edAviso"); document.body.appendChild(aviso); aviso.style.display = "none";
  const copiar = () => { const s = aviso.querySelector("small"); $("ttMsg").innerHTML = s ? `<span class="${s.className === "erro" ? "erro" : ""}">${s.innerHTML}</span>` : "<b>●</b> Pronto"; };
  new MutationObserver(copiar).observe(aviso, { childList: true, subtree: true });
  setInterval(() => {
    $("ttQtd").textContent = `${cenario.children.length} itens · ${pilha.length} passos`;
    if (dir.querySelector('.ttNav[data-d="hist"]').classList.contains("on")) desenharHist();
    marcarFaixa(); atualizarPrevia();
  }, 400);
  if (ajuda) ajuda.style.display = "none";
  void tr; void pista;
}
