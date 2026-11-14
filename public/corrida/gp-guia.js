// Corrida da Galera — o guia do GP na ficha "Sobre o GP" da sala (menus.js): a miniatura 3D do circuito (gp-miniatura.js) no lugar do mapa,
// com o relevo, os setores e os números das curvas, que se gira com o mouse; e, embaixo, a história do circuito e as curvas famosas
// (gp-curiosidades.js). Clicar numa curva (na lista da ficha, num card ou no número dela em 3D) leva a câmera até lá. O botão "Mapa"
// volta ao desenho 2D de sempre (a escolha fica guardada neste navegador). Sem WebGL, fica o mapa 2D.
import { criarMiniatura } from "/corrida/gp-miniatura.js";
import { CURIOSIDADES } from "/corrida/gp-curiosidades.js";
const h = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); // (sem estado.js: a Central da carreira também usa)

const CHAVE = "corrida:guia3d";
let mini = null, raizAtual = null;
const quer3d = () => { try { return localStorage.getItem(CHAVE) !== "0"; } catch (e) { return true; } };
const guardar = (v) => { try { localStorage.setItem(CHAVE, v ? "1" : "0"); } catch (e) { /* sem armazenamento: só não lembra */ } };

export function soltarGuia() { if (mini) { mini.soltar(); mini = null; } if (raizAtual) { raizAtual.removeEventListener("click", aoClicar); raizAtual = null; } }

// a curva do card: pelo nome (o mesmo de gp-info.js)
const curvaPorNome = (g, nome) => g.curvas.find((c) => c.nome === nome) || null;

function cardsHTML(id, g) {
  const c = CURIOSIDADES[id]; if (!c) return "";
  const curvas = Object.entries(c.curvas || {});
  return `<section class="gg" aria-label="Guia do GP">
    <header class="gg-cab"><small>Guia do GP</small><h3>${h(g.circuito || g.gp)}</h3></header>
    <div class="gg-grade">
      <article class="gg-hist"><h4>História</h4><ul>${c.historia.map((t) => `<li>${h(t)}</li>`).join("")}</ul></article>
      ${curvas.length ? `<article class="gg-curvas"><h4>Curvas famosas</h4><div class="gg-lista">${curvas.map(([nome, txt]) => { const k = curvaPorNome(g, nome); return `<button type="button" class="gg-card" ${k ? `data-curva="${k.n}" data-gg-f="${k.f}"` : "disabled"}><b>${k ? `<i>${k.n}</i>` : ""}${h(nome)}</b><span>${h(txt)}</span></button>`; }).join("")}</div></article>` : ""}
    </div></section>`;
}

function aoClicar(ev) {
  const modo = ev.target.closest && ev.target.closest("[data-gg-modo]");
  if (modo) { guardar(modo.dataset.ggModo === "3d"); const r = raizAtual, id = r && r.dataset.ggId; if (r && id) montarGuia(r, id); return; }
  const b = ev.target.closest && ev.target.closest("[data-curva], .mn3-curva"); if (!b || !mini) return;
  const g = window.GpInfo.get(raizAtual.dataset.ggId), n = b.dataset.curva || b.dataset.n, c = g.curvas.find((x) => String(x.n) === String(n));
  if (c) mini.focar(c.f);
}

// `raiz`: o corpo da ficha (já com o HTML de GpSobre.corpo); refeito a cada troca de GP
export function montarGuia(raiz, id) {
  soltarGuia();
  const G = window.GpInfo, g = G && G.get(id); if (!raiz || !g) return;
  raiz.dataset.ggId = id; raizAtual = raiz; raiz.addEventListener("click", aoClicar);
  const fig = raiz.querySelector(".sn-sobre-mapa"), svg = fig && fig.querySelector("svg");
  // os cards da história e das curvas (uma vez por GP)
  if (!raiz.querySelector(".gg")) { const cont = raiz.querySelector(".sn-sobre-conteudo"); if (cont) cont.insertAdjacentHTML("beforeend", cardsHTML(id, g)); }
  if (!fig || !svg) return;
  fig.querySelectorAll(".gg-modo, .gg-mini, .gg-ajuda").forEach((x) => x.remove());
  fig.classList.add("gg-fig");
  const em3d = quer3d();
  fig.insertAdjacentHTML("beforeend", `<div class="gg-modo" role="group" aria-label="Ver o circuito"><button type="button" data-gg-modo="3d" class="${em3d ? "on" : ""}" aria-pressed="${em3d}">3D</button><button type="button" data-gg-modo="2d" class="${em3d ? "" : "on"}" aria-pressed="${!em3d}">Mapa</button></div>`);
  if (!em3d) { svg.style.visibility = ""; fig.classList.remove("em3d"); return; }
  const caixa = document.createElement("div"); caixa.className = "gg-mini"; fig.appendChild(caixa);
  const cor = getComputedStyle(raiz).getPropertyValue("--sv-eq").trim() || null; // a cor da equipe (na sala, menus.js temaDaSala; na Central, a ficha do GP)
  mini = criarMiniatura(caixa, id, { cor: /^#[0-9a-f]{6}$/i.test(cor || "") ? cor : null });
  if (!mini) { caixa.remove(); fig.querySelector(".gg-modo").remove(); svg.style.visibility = ""; return; } // sem WebGL: o mapa 2D
  mini.curvas(g.curvas);
  svg.style.visibility = "hidden"; fig.classList.add("em3d");
  fig.insertAdjacentHTML("beforeend", `<p class="gg-ajuda">Arraste para girar · roda para aproximar · clique numa curva</p>`);
}
