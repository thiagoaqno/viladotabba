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
    <p class="ccf-nota">Vale na próxima corrida (a música muda já). Gráficos e controles ficam na engrenagem do menu da Corrida.</p>`;
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
    const b = e.target.closest("[data-ccf-chave]"); if (!b) return;
    const on = b.getAttribute("aria-checked") !== "true"; b.setAttribute("aria-checked", String(on));
    if (b.dataset.ccfChave === "som") gravar("corrida:sound", on);
    else if (root.Radio?.silenciar) root.Radio.silenciar(!on); else gravar("corrida:radio", on); // (o rádio da Central muda já)
  });
  dlg.addEventListener("keydown", (e) => e.stopPropagation()); // (as teclas da Central, como Q e E, não trocam de aba com a tela aberta)
}
function abrir() { if (!dlg) montar(); dlg.innerHTML = corpo(); dlg.showModal(); }
root.ConfigCarreira = { abrir };
})(window);
