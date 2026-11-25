// Corrida da Galera — o estilo de HUD "Transmissão (TV)" (2026-11-25, os prints do Thiago de uma transmissão do jogo da F1: "queria buscar algo
// próximo disso, como opção"). É um dos estilos de Configurações > Geral (hud-telemetria.js, ESTILOS_HUD) e liga a classe #race.hud-tv; o
// visual está em hud-tv.css. hud.js chama `hudTv` junto com a torre (~10 vezes por segundo). Por cima da torre de sempre:
//  - a batalha (o card de distância do seu carro, gapF1 em hud.js) vira faixa DENTRO da torre: "BATALHA PELO 1º" acima do da frente e a
//    diferença grande entre as duas linhas (o card do canto some neste estilo);
//  - o cartão do piloto: quando você ganha ou perde posição, a sua linha abre embaixo um cartão com o número, o nome e a equipe (6 s);
//  - o aviso de novo líder no alto, no meio da tela (4 s);
//  - a caixa de marcha no canto de baixo à direita: GEAR, a velocidade, KM/H e a bateria do ERS (no lugar do mostrador grande).
// As linhas da torre não ganham classe (hud.js reescreve a classe delas a cada mudança): o espaço das faixas é margem no estilo da linha.
import { E, $, h } from "./estado.js";
import { set } from "./hud-painel.js";
import { estiloHud } from "./hud-telemetria.js";
import { numeroSuave, pulsar } from "./hud-vivo.js";

const CARTAO_MS = 6000, LIDER_MS = 4000;
const TIT_H = 28, GAP_H = 46, CARTAO_H = 74; // (px) a faixa do título da batalha, a da diferença e o cartão do piloto
const st = { pos: null, cartaoAte: 0, lider: null, liderAte: 0, corrida: null };

const jogador = (id) => (E.S && Array.isArray(E.S.players) ? E.S.players.find((p) => p.id === id) : null);
const corEquipe = (eq, p) => (eq && window.F1Pilotos && window.F1Pilotos.EQUIPES[eq] && window.F1Pilotos.EQUIPES[eq].cor) || (p && p.color) || "#3a6fd0";
const nomeEquipe = (eq) => (eq && window.F1Pilotos && window.F1Pilotos.EQUIPES[eq] && window.F1Pilotos.EQUIPES[eq].nome) || "";
const urlLogo = (eq) => { const e = eq && window.EQUIPES_F1 && window.EQUIPES_F1[eq]; return e && e.arquivo ? (window.logoF1 || ((i) => "/api/corrida/logo/" + i))(eq) : ""; };
const imgLogo = (eq, cls) => { const u = urlLogo(eq); return u ? `<img class="${cls}" src="${u}" alt="" decoding="async">` : ""; };
const sobrenome = (p) => { const n = String((p && (p.nomeCompleto || p.name)) || "?").trim().split(/\s+/); return n[n.length - 1]; };
const primeiro = (p) => { const n = String((p && (p.nomeCompleto || p.name)) || "").trim().split(/\s+/); return n.length > 1 ? n[0] : ""; };

function montar() {
  const torre = $("hTorre"); if (!torre || $("tvBatTit")) return;
  for (const [id, cls] of [["tvBatTit", "tv-bat-tit"], ["tvBatGap", "tv-bat-gap"], ["tvCartao", "tv-cartao"]]) {
    const d = document.createElement("div"); d.id = id; d.className = cls; d.hidden = true; torre.appendChild(d);
  }
  const race = $("race"); if (!race) return;
  const v = document.createElement("div"); v.id = "hTvVel"; v.className = "hud"; v.setAttribute("aria-label", "Marcha, velocidade e bateria");
  v.innerHTML = `<div class="tvv-marcha"><small>GEAR</small><b id="tvMarcha">N</b></div><div class="tvv-vel"><b id="tvVel">0</b><small>KM/H</small></div><div class="tvv-ers" id="tvErs">0%</div>`;
  race.appendChild(v);
  const l = document.createElement("div"); l.id = "hTvLider"; l.className = "hud"; l.setAttribute("role", "status"); l.hidden = true;
  race.appendChild(l);
}

// a linha visível do piloto `id` (ou da posição `pos`) entre as linhas da torre
function linhaDe(box, linhas, ver, cond) {
  for (let k = 0; k < box.length; k++) { const l = ver[k] != null ? linhas[ver[k]] : null; if (l && cond(l)) return { d: box[k], l, k }; }
  return null;
}
// põe `el` logo acima da linha `d` (o espaço vem da margem de cima dela), em coordenadas da torre
function encaixar(el, torre, d, altura, embaixo = false) {
  const t = torre.getBoundingClientRect(), r = d.getBoundingClientRect();
  el.style.top = Math.round((embaixo ? r.bottom : r.top - altura) - t.top) + "px"; el.style.height = altura + "px";
}

// o: { linhas, ver, m, batalha (o texto do card de distância ou null), kmh, marcha, carga, ersAtivo, fase }
export function hudTv(o) {
  const raiz = $("race"), on = estiloHud() === "tv";
  if (raiz) raiz.classList.toggle("hud-tv", on);
  if (!on) { // (saiu do estilo no meio da corrida: as linhas perdem o espaço das faixas)
    if (st.ligado) { st.ligado = false; for (const d of $("tLinhas")?.children || []) { d.style.marginTop = d.style.marginBottom = ""; if (d._v) delete d._v["data-tv-m"]; } for (const id of ["tvBatTit", "tvBatGap", "tvCartao", "hTvLider"]) { const e = $(id); if (e) e.hidden = true; } }
    return;
  }
  st.ligado = true;
  montar();
  const torre = $("hTorre"), box = $("tLinhas") ? $("tLinhas").children : [], agora = performance.now();
  const { linhas, ver, m } = o, corrida = o.fase === "race";
  if (st.corrida !== (E.S && E.S.startAt)) { st.corrida = E.S && E.S.startAt; st.pos = null; st.cartaoAte = 0; st.lider = null; st.liderAte = 0; }
  // ---- as margens das linhas: zera e põe só as que valem neste quadro
  const margem = new Map(); // linha -> [cima, baixo]
  const abre = (d, cima, baixo) => { const a = margem.get(d) || [0, 0]; margem.set(d, [a[0] + cima, a[1] + baixo]); };
  // a batalha: sigla|equipe|sigla|equipe|segundos|posição|posição|legenda
  const tit = $("tvBatTit"), gap = $("tvBatGap"), cart = $("tvCartao");
  let bat = null;
  if (o.batalha && corrida) {
    const [, , , , seg, p1, p2] = String(o.batalha).split("|");
    const a = linhaDe(box, linhas, ver, (l) => String(l.pos) === String(p1)), b = linhaDe(box, linhas, ver, (l) => String(l.pos) === String(p2));
    if (a && b && b.k === a.k + 1) bat = { a, b, seg, p1 };
  }
  // o cartão do piloto: a sua posição mudou na corrida (não na largada parada)
  const eu = m && linhaDe(box, linhas, ver, (l) => l.eu);
  if (eu && corrida && m.started && m.finish == null) {
    if (st.pos != null && st.pos !== eu.l.pos) st.cartaoAte = agora + CARTAO_MS;
    st.pos = eu.l.pos;
  } else if (!eu) st.pos = null;
  const cartao = eu && agora < st.cartaoAte && !(bat && (bat.a.d === eu.d)) ? eu : null; // (com a batalha logo embaixo da sua linha, fica a batalha)
  if (bat) { abre(bat.a.d, TIT_H, 0); abre(bat.b.d, GAP_H, 0); }
  if (cartao) { const prox = box[cartao.k + 1]; if (prox && !prox.classList.contains("hidden")) abre(prox, CARTAO_H, 0); else abre(cartao.d, 0, CARTAO_H); }
  for (const d of box) { const a = margem.get(d) || [0, 0]; set(d, "data-tv-m", a.join(",")); d.style.marginTop = a[0] ? a[0] + "px" : ""; d.style.marginBottom = a[1] ? a[1] + "px" : ""; }
  // ---- as faixas, depois das margens (a posição delas depende delas)
  tit.hidden = gap.hidden = !bat;
  if (bat) {
    set(tit, "t", `BATALHA PELO ${bat.p1}º`); encaixar(tit, torre, bat.a.d, TIT_H);
    const txt = "+" + bat.seg; if (gap.textContent !== txt) { const subiu = gap.textContent && parseFloat(txt) > parseFloat(gap.textContent); gap.textContent = txt; if (gap._ok) pulsar(gap, subiu ? "tv-abre" : "tv-fecha"); gap._ok = true; }
    encaixar(gap, torre, bat.b.d, GAP_H);
  } else gap._ok = false;
  cart.hidden = !cartao;
  if (cartao) {
    const p = jogador(cartao.l.id) || {}, eq = cartao.l.equipe || p.equipe, num = p.numero != null ? String(p.numero) : String(cartao.l.pos);
    const chave = [cartao.l.id, eq, num].join("|");
    if (cart._chave !== chave) {
      cart._chave = chave; cart.style.setProperty("--tv-eq", corEquipe(eq, p));
      cart.innerHTML = `<b class="tvc-num">${h(num)}</b><span class="tvc-nome"><small>${h(primeiro(p))}</small><b>${h(sobrenome(p))}</b><em>${imgLogo(eq, "tvc-logo")}${h(nomeEquipe(eq))}</em></span>`;
      cart.classList.remove("entra"); void cart.offsetWidth; cart.classList.add("entra");
    }
    encaixar(cart, torre, cartao.d, CARTAO_H, true);
  } else cart._chave = null;
  // ---- o novo líder (só na corrida, depois da primeira volta do líder)
  const lid = linhas[0], lider = $("hTvLider");
  if (corrida && lid) {
    const p = jogador(lid.id);
    if (st.lider != null && st.lider !== lid.id && p && p.laps >= 1) {
      const eq = lid.equipe || p.equipe;
      lider.style.setProperty("--tv-eq", corEquipe(eq, p));
      lider.innerHTML = `<span class="tvl-txt"><b>${h(sobrenome(p).toUpperCase())}</b> NOVO LÍDER DA CORRIDA</span>${imgLogo(eq, "tvl-logo")}`;
      lider.hidden = false; lider.classList.remove("entra"); void lider.offsetWidth; lider.classList.add("entra");
      st.liderAte = agora + LIDER_MS;
    }
    st.lider = lid.id;
  }
  if (!lider.hidden && agora >= st.liderAte) lider.hidden = true;
  // ---- a caixa de marcha
  numeroSuave($("tvVel"), o.kmh);
  const mm = $("tvMarcha"); if (mm._v?.t !== undefined && mm._v.t !== String(o.marcha)) pulsar(mm); set(mm, "t", String(o.marcha));
  const pct = Math.round(Math.max(0, Math.min(1, o.carga || 0)) * 100), ers = $("tvErs");
  set(ers, "t", pct + "%"); set(ers, "c", "tvv-ers" + (o.ersAtivo ? " on" : pct >= 90 ? " cheia" : pct < 20 ? " baixa" : ""));
}
