// Corrida da Galera — as CONFIGURAÇÕES de som dentro da Central da carreira (solo e com os amigos; 2026-11-15, o Thiago: "a aba de
// configurações deve ficar dentro da carreira/sala em grupo também, não só no lobby da corrida, pra poder mudar o som").
// A tela da Corrida (configuracoes.js) depende do jogo inteiro (o socket da corrida, as pistas, o relógio); aqui ela é leve e mexe nos
// MESMOS valores guardados no navegador: o som ligado (corrida:sound), o volume geral (corrida:volume), o volume de cada canal
// (corrida:mixer, os canais de sons.js), a voz do engenheiro (corrida:radio) e a música (window.MusicaCarreira, que vale na hora).
// O que é do jogo vale na próxima corrida; a música muda já. Gráficos e controles continuam na engrenagem do menu da Corrida.
(function (root) {
"use strict";
const ler = (k, padrao) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? padrao : v; } catch { return padrao; } };
const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sem armazenamento */ } };
const CANAIS = [["motor", "Motor", "o seu carro e os dos outros"], ["efeitos", "Efeitos", "batidas, zebra, pneu, ERS, box"], ["ambiente", "Ambiente", "torcida, chuva, vento e a pista"],
  ["radio", "Rádio do engenheiro", "a voz da equipe"], ["narrador", "Narrador", "a transmissão de TV"]];
let dlg = null;
const pct = (v) => Math.round(Math.max(0, Math.min(1, +v || 0)) * 100);
function linha(nome, dica, k, v) {
  return `<label class="ccf-linha"><span><b>${nome}</b><small>${dica}</small></span><input type="range" min="0" max="100" step="1" value="${pct(v)}" data-ccf="${k}" aria-label="${nome}"><output data-ccf-v="${k}">${pct(v)}%</output></label>`;
}
function chave(nome, dica, k, on) {
  return `<div class="ccf-linha"><span><b>${nome}</b><small>${dica}</small></span><button type="button" class="ccf-chave" role="switch" aria-checked="${!!on}" data-ccf-chave="${k}"><i></i></button></div>`;
}
// (2026-11-23, o Thiago: "a configuração de HUD e todas as outras... deviam ficar nas configurações no lobby/carreira também; hoje pra mexer nas
// configurações completas é preciso sair da carreira") o HUD e os gráficos aqui também, nos MESMOS valores da Corrida: o estilo (corrida:hud-estilo,
// hud-telemetria.js), o minimapa e o painel da primeira pessoa (corrida:graficos, qualidade.js), a posição dos blocos (a miniatura, hud-layout.js) e a
// predefinição dos gráficos (corrida:graficos + corrida:qualidade, com as mesmas predefinições de qualidade.js PREDEF)
const ESTILOS = [["classico", "Novo (F1)"], ["compacto", "Compacto"], ["telemetria", "Telemetria"]];
const PREDEF = {
  baixa: { efeitos: "baixa", resolucao: "auto", sombras: "desligadas", espelhos: false, adversarios: "simples" },
  media: { efeitos: "media", resolucao: "auto", sombras: "baixas", espelhos: true, adversarios: "detalhados" },
  alta: { efeitos: "alta", resolucao: "auto", sombras: "altas", espelhos: true, adversarios: "detalhados" },
};
const seg = (k, valor, lista) => `<div class="ccf-seg" role="radiogroup">${lista.map(([v, n]) => `<button type="button" role="radio" aria-checked="${String(v) === String(valor)}" data-ccf-seg="${k}" data-v="${v}">${n}</button>`).join("")}</div>`;
const linhaSeg = (nome, dica, ctl) => `<div class="ccf-linha ccf-col"><span><b>${nome}</b><small>${dica}</small></span>${ctl}</div>`;
function hud() {
  const g = ler("corrida:graficos", {}) || {}, est = ler("corrida:hud-estilo", "classico");
  const predef = g.predef || (() => { try { return localStorage.getItem("corrida:qualidade") || "media"; } catch { return "media"; } })();
  return `<section class="ccf-parte"><h3>HUD</h3>
      ${linhaSeg("Estilo do HUD", "Novo: o da transmissão da F1. Compacto: o painel pequeno no canto. Telemetria: o mostrador alternativo", seg("estilo", est, ESTILOS))}
      ${linhaSeg("Minimapa", "embaixo à esquerda ou em cima à direita", seg("mapa", g.mapa || "baixo", [["baixo", "Embaixo"], ["cima", "Em cima"]]))}
      ${linhaSeg("Painel em primeira pessoa", "no cockpit: só a bateria e a velocidade no canto", seg("painelDentro", g.painelDentro !== false, [[true, "Compacto"], [false, "Completo"]]))}
      <div class="ccf-linha ccf-col"><span><b>Posição dos blocos</b><small>arraste na miniatura; vale na próxima corrida</small></span><div data-ccf-layout></div><div class="hl-acoes"><button type="button" class="ccf-bt" data-ccf-restaurar>Restaurar</button></div></div>
    </section>
    <section class="ccf-parte"><h3>Gráficos</h3>
      ${linhaSeg("Qualidade", "Baixa: leve, sem efeitos. Média: cor, brilho e sombras simples. Alta: tudo ligado", seg("predef", predef, [["baixa", "Baixa"], ["media", "Média"], ["alta", "Alta"]]))}
    </section>`;
}
function mudarSeg(k, v) {
  if (k === "estilo") return gravar("corrida:hud-estilo", v);
  const g = { ...(ler("corrida:graficos", {}) || {}) };
  if (k === "predef") { Object.assign(g, PREDEF[v] || {}, { predef: v }); gravar("corrida:graficos", g); try { localStorage.setItem("corrida:qualidade", v); } catch { /* sem armazenamento */ } return; }
  g[k] = v === "true" ? true : v === "false" ? false : v; gravar("corrida:graficos", g);
}
function corpo() {
  const mix = { motor: 1, efeitos: 1, ambiente: 1, radio: 1, narrador: 1, ...(ler("corrida:mixer", {}) || {}) }, musica = root.MusicaCarreira?.nivel?.();
  return `<header class="ccf-cab"><h2>Configurações</h2><button type="button" class="ccf-x" data-ccf-fechar aria-label="Fechar">✕</button></header>
    <section class="ccf-parte"><h3>Som</h3>
      ${chave("Som do jogo", "liga e desliga todo o som da corrida", "som", ler("corrida:sound", true) !== false)}
      ${linha("Volume geral", "tudo junto", "geral", ler("corrida:volume", 0.7))}
      ${chave("Voz do engenheiro", "o rádio da equipe na corrida e na Central", "voz", root.Radio ? !root.Radio.mudo : ler("corrida:radio", true) !== false)}
    </section>
    <section class="ccf-parte"><h3>Mixer</h3>${CANAIS.map(([k, n, d]) => linha(n, d, k, mix[k])).join("")}
      ${musica != null ? linha("Música", "o tocador da carreira", "musica", musica) : ""}</section>
    ${hud()}
    <p class="ccf-nota">Vale na próxima corrida (a música muda já). Os controles (remapear teclas e o volante) ficam na engrenagem do menu da Corrida.</p>`;
}
function montar() {
  dlg = document.createElement("dialog"); dlg.className = "ccf"; dlg.setAttribute("aria-label", "Configurações");
  document.body.appendChild(dlg);
  dlg.addEventListener("input", (e) => {
    const k = e.target.dataset.ccf; if (!k) return;
    const v = e.target.value / 100, o = dlg.querySelector(`[data-ccf-v="${k}"]`); if (o) o.textContent = `${e.target.value}%`;
    if (k === "geral") gravar("corrida:volume", v);
    else if (k === "musica") root.MusicaCarreira?.volume?.(v);
    else { const mix = { ...(ler("corrida:mixer", {}) || {}), [k]: v }; gravar("corrida:mixer", mix); }
  });
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg || e.target.closest("[data-ccf-fechar]")) { dlg.close(); return; }
    { const sg = e.target.closest("[data-ccf-seg]"); if (sg) { mudarSeg(sg.dataset.ccfSeg, sg.dataset.v); sg.parentElement.querySelectorAll("button").forEach((x) => x.setAttribute("aria-checked", String(x === sg))); return; } }
    if (e.target.closest("[data-ccf-restaurar]")) { root.HudLayout?.restaurar(); montarLayout(); return; }
    const b = e.target.closest("[data-ccf-chave]"); if (!b) return;
    const on = b.getAttribute("aria-checked") !== "true"; b.setAttribute("aria-checked", String(on));
    if (b.dataset.ccfChave === "som") gravar("corrida:sound", on);
    else if (root.Radio?.silenciar) root.Radio.silenciar(!on); else gravar("corrida:radio", on); // (o rádio da Central muda já)
  });
  dlg.addEventListener("keydown", (e) => e.stopPropagation()); // (as teclas da Central, como Q e E, não trocam de aba com a tela aberta)
}
function montarLayout() { const c = dlg && dlg.querySelector("[data-ccf-layout]"); if (c && root.HudLayout) root.HudLayout.montar(c); }
function abrir() { if (!dlg) montar(); dlg.innerHTML = corpo(); dlg.showModal(); montarLayout(); }
root.ConfigCarreira = { abrir };
})(window);
