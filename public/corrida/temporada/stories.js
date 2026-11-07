// As notícias da carreira no jeito dos Stories do Instagram (window.Stories): uma faixa de bolinhas no topo da Central e, ao
// tocar, a tela cheia em pé com as barras de progresso, que anda sozinha a cada 5 s (toque à esquerda volta, à direita avança,
// Esc ou o X fecham). Tudo sai dos números da temporada que a Central já tem (o ctx de central.js): nada é inventado.
(function (root) {
"use strict";
const h = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const logo = (id) => `<img src="/api/corrida/logo/${encodeURIComponent(id)}" alt="" onerror="this.style.display='none'">`;
const ord = (n) => `${n}º`;
const nomeGP = (e) => (e ? `GP ${/^[AEIOU]/i.test(e.nome) ? "da" : "de"} ${e.nome}` : "GP");
let atuais = [], aberto = -1, timer = null, inicio = 0;
const DURA = 5200;
const visto = (() => { try { return JSON.parse(localStorage.getItem("corrida:stories") || "{}"); } catch { return {}; } })();
const marcar = (k) => { visto[k] = 1; try { localStorage.setItem("corrida:stories", JSON.stringify(visto)); } catch {} };

// os stories da temporada: cada um { k (chave: muda quando a notícia muda), rot, tit, sub, eq (a equipe da cor e do logo), foto }
function montar(c) {
  const { s, t, gps, prox, previsao } = c, P = root.F1Pilotos, eqs = P.EQUIPES, Gi = root.GpInfo, lista = [];
  const pil = t.pilotos, eu = pil.findIndex((p) => p.id === "voce"), meu = pil[eu];
  const nome = (id) => (pil.find((p) => p.id === id) || {}).nome || P.PILOTOS.find((p) => p.id === id)?.nome || "Piloto";
  const ultimo = gps[gps.length - 1];
  if (ultimo) {
    const vence = ultimo.linhas.find((l) => l.pos === 1), minha = ultimo.linhas.find((l) => l.piloto === "voce"), e = s.calendario[ultimo.gp];
    const venci = vence && vence.piloto === "voce";
    lista.push({ k: `gp:${s.ano}:${ultimo.gp}`, rot: "Último GP", eq: venci ? s.equipe : vence?.equipe || s.equipe, foto: Gi?.fundoDe(ultimo.pista),
      tit: venci ? `Vitória no ${nomeGP(e)}!` : `${nome(vence?.piloto)} vence o ${nomeGP(e)}`,
      sub: minha ? (minha.dnf ? "Você abandonou a corrida." : `Você terminou em ${ord(minha.pos)} e somou ${minha.pontos} ${minha.pontos === 1 ? "ponto" : "pontos"}.`) : "" });
  }
  if (gps.length && meu) {
    const lider = pil[0], dif = lider.pontos - meu.pontos;
    lista.push({ k: `camp:${s.ano}:${gps.length}`, rot: "Campeonato", eq: eu === 0 ? s.equipe : lider.equipe,
      tit: eu === 0 ? "Você lidera o campeonato" : `${lider.nome} lidera o campeonato`,
      sub: eu === 0 ? `${meu.pontos} pontos, ${meu.pontos - (pil[1]?.pontos || 0)} à frente de ${pil[1]?.nome || "ninguém"}.` : `Você é o ${ord(eu + 1)} com ${meu.pontos} pontos, a ${dif} do líder.` });
    const frente = pil[eu - 1];
    if (frente) lista.push({ k: `rival:${s.ano}:${gps.length}`, rot: "Rival", eq: frente.equipe, tit: `${frente.nome} está logo à frente`, sub: `${frente.pontos - meu.pontos} ${frente.pontos - meu.pontos === 1 ? "ponto" : "pontos"} separam vocês no campeonato. ${eqs[frente.equipe]?.nome || ""}.` });
    const melhor = gps.map((g) => ({ g, l: g.linhas.find((x) => x.piloto === "voce") })).filter((x) => x.l && !x.l.dnf).sort((a, b) => a.l.pos - b.l.pos)[0];
    if (melhor && gps.length > 1) lista.push({ k: `melhor:${s.ano}:${melhor.g.gp}`, rot: "Seu melhor", eq: s.equipe, foto: Gi?.fundoDe(melhor.g.pista), tit: `${ord(melhor.l.pos)} no ${nomeGP(s.calendario[melhor.g.gp])}`, sub: `O seu melhor resultado da temporada ${String(s.ano).padStart(2, "0")}.` });
  }
  if (prox) {
    const prev = previsao && root.F1Regras?.descreverPrevisao ? root.F1Regras.descreverPrevisao(previsao, s.voltas) : null;
    lista.push({ k: `prox:${s.ano}:${s.gp}`, rot: "Próxima etapa", eq: s.equipe, foto: Gi?.fundoDe(prox.pista), tit: nomeGP(prox), sub: `Etapa ${s.gp + 1} de ${s.tamanho}${prev && prev.titulo ? ` · ${prev.titulo}` : ""}.` });
  }
  return lista;
}
// a faixa de bolinhas (vazia quando não há notícia)
function faixa(c) {
  atuais = montar(c);
  if (!atuais.length) return "";
  return `<nav class="st-faixa" aria-label="Notícias da temporada">${atuais.map((x, i) => `<button type="button" class="st-bola${visto[x.k] ? " vista" : ""}" data-story="${i}" style="--c:${h(root.F1Pilotos.EQUIPES[x.eq]?.cor || "#e10600")}"><span class="st-anel">${logo(x.eq)}</span><small>${h(x.rot)}</small></button>`).join("")}</nav>`;
}
function tela() {
  let el = document.getElementById("stTela");
  if (!el) { el = document.createElement("div"); el.id = "stTela"; el.className = "st-tela"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); document.body.appendChild(el); }
  return el;
}
function mostrar(i) {
  if (i < 0 || i >= atuais.length) return fechar();
  aberto = i; const x = atuais[i], cor = root.F1Pilotos.EQUIPES[x.eq]?.cor || "#e10600"; marcar(x.k);
  document.querySelector(`.st-bola[data-story="${i}"]`)?.classList.add("vista");
  const el = tela();
  el.innerHTML = `<div class="st-card" style="--c:${h(cor)};--foto:${x.foto ? `url('${h(x.foto)}')` : "none"}">
    <div class="st-barras">${atuais.map((_, k) => `<i class="${k < i ? "cheia" : ""}"><b${k === i ? ' class="anda"' : ""}></b></i>`).join("")}</div>
    <header><span class="st-mini">${logo(x.eq)}</span><b>${h(x.rot)}</b><button type="button" class="st-x" data-st-fechar aria-label="Fechar">✕</button></header>
    <div class="st-corpo"><span class="st-logo">${logo(x.eq)}</span><h2>${h(x.tit)}</h2>${x.sub ? `<p>${h(x.sub)}</p>` : ""}</div>
    <button type="button" class="st-lado esq" data-st-ir="-1" aria-label="Anterior"></button><button type="button" class="st-lado dir" data-st-ir="1" aria-label="Próxima"></button></div>`;
  el.hidden = false; clearTimeout(timer); inicio = performance.now(); timer = setTimeout(() => mostrar(aberto + 1), DURA);
}
function fechar() { clearTimeout(timer); aberto = -1; const el = document.getElementById("stTela"); if (el) { el.hidden = true; el.innerHTML = ""; } }
document.addEventListener("click", (e) => {
  const b = e.target.closest?.("[data-story],[data-st-ir],[data-st-fechar]"); if (!b) { if (aberto >= 0 && e.target.id === "stTela") fechar(); return; }
  if (b.hasAttribute("data-st-fechar")) return fechar();
  if (b.dataset.stIr) return mostrar(aberto + Number(b.dataset.stIr));
  mostrar(Number(b.dataset.story));
});
document.addEventListener("keydown", (e) => {
  if (aberto < 0) return;
  if (e.key === "Escape") { e.stopPropagation(); fechar(); } else if (e.key === "ArrowRight") mostrar(aberto + 1); else if (e.key === "ArrowLeft") mostrar(Math.max(0, aberto - 1));
}, true);
root.Stories = { faixa, montar, fechar };
})(window);
