// As notícias da carreira no jeito dos Stories do Instagram (window.Stories): uma faixa de bolinhas no topo da Central e, ao
// tocar, a tela cheia em pé com as barras de progresso, que anda sozinha a cada 5 s (toque à esquerda volta, à direita avança,
// Esc ou o X fecham). Tudo sai dos números da temporada que a Central já tem (o ctx de central.js): nada é inventado.
(function (root) {
"use strict";
const h = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const logo = (id) => `<img src="/api/corrida/logo/${encodeURIComponent(id)}" alt="" onerror="this.style.display='none'">`;
const ord = (n) => `${n}º`;
const nomeGP = (e) => { if (!e) return "GP"; const of = root.GpInfo?.get(e.pista)?.gp; return of ? of.replace(/^Grande Prêmio/, "GP") : `GP ${/^[AEIOU]/i.test(e.nome) ? "da" : "de"} ${e.nome}`; }; // (o nome oficial já vem com o artigo: "GP da China")
let atuais = [], aberto = -1, timer = null, inicio = 0;
const DURA = 5200;
const visto = (() => { try { return JSON.parse(localStorage.getItem("corrida:stories") || "{}"); } catch { return {}; } })();
const marcar = (k) => { visto[k] = 1; try { localStorage.setItem("corrida:stories", JSON.stringify(visto)); } catch {} };

// os stories da temporada: cada um { k (chave: muda quando a notícia muda), rot, tit, sub, eq (a equipe da cor e do logo), foto }
function montar(c) {
  const { s, t, gps, prox, previsao } = c, P = root.F1Pilotos, eqs = P.EQUIPES, Gi = root.GpInfo, lista = [], TX = root.StoriesTextos;
  const pil = t.pilotos, eu = pil.findIndex((p) => p.id === "voce"), meu = pil[eu];
  const nome = (id) => (pil.find((p) => p.id === id) || {}).nome || P.PILOTOS.find((p) => p.id === id)?.nome || "Piloto";
  const ptsTxt = (n) => (n === 1 ? "ponto" : "pontos");
  // um story pela situação: os textos variam (stories-textos.js), sempre com os números de verdade
  const story = (k, rot, eq, foto, sit, v) => { const x = TX ? TX.texto(sit, k, v) : { tit: rot, sub: "" }; lista.push({ k, rot, eq, foto, tit: x.tit, sub: x.sub }); };
  const ultimo = gps[gps.length - 1];
  if (ultimo) {
    const vence = ultimo.linhas.find((l) => l.pos === 1), minha = ultimo.linhas.find((l) => l.piloto === "voce"), e = s.calendario[ultimo.gp];
    const sit = !minha ? "fora" : minha.dnf ? "abandono" : minha.pos === 1 ? "vitoria" : minha.pos <= 3 ? "podio" : minha.pos <= 10 ? "pontos" : "fora";
    story(`gp:${s.ano}:${ultimo.gp}`, "Último GP", sit === "vitoria" ? s.equipe : vence?.equipe || s.equipe, Gi?.fundoDe(ultimo.pista), sit,
      { gp: nomeGP(e), pos: minha ? ord(minha.pos) : "", pts: minha?.pontos || 0, pontos_txt: ptsTxt(minha?.pontos || 0), vencedor: nome(vence?.piloto) });
  }
  if (gps.length && meu) {
    const lider = pil[0], dif = lider.pontos - meu.pontos, seg = pil[1];
    const sit = eu === 0 ? "lider" : eu <= 2 || dif <= 25 ? "caca" : "longe";
    story(`camp:${s.ano}:${gps.length}`, "Campeonato", eu === 0 ? s.equipe : lider.equipe, null, sit,
      { pts: meu.pontos, vant: eu === 0 ? meu.pontos - (seg?.pontos || 0) : 0, segundo: seg?.nome || "ninguém", lider: lider.nome, pos: ord(eu + 1), dif });
    const frente = pil[eu - 1];
    if (frente && eu > 1) story(`rival:${s.ano}:${gps.length}`, "Rival", frente.equipe, null, "rival",
      { rival: frente.nome, dif: frente.pontos - meu.pontos, pontos_txt: ptsTxt(frente.pontos - meu.pontos), equipe: eqs[frente.equipe]?.nome || "" });
    const melhor = gps.map((g) => ({ g, l: g.linhas.find((x) => x.piloto === "voce") })).filter((x) => x.l && !x.l.dnf).sort((a, b) => a.l.pos - b.l.pos)[0];
    if (melhor && gps.length > 1) story(`melhor:${s.ano}:${melhor.g.gp}`, "Seu melhor", s.equipe, Gi?.fundoDe(melhor.g.pista), "melhor",
      { pos: ord(melhor.l.pos), gp: nomeGP(s.calendario[melhor.g.gp]), ano: String(s.ano).padStart(2, "0") });
  }
  if (prox) {
    const prev = previsao && root.F1Regras?.descreverPrevisao ? root.F1Regras.descreverPrevisao(previsao, s.voltas) : null;
    story(`prox:${s.ano}:${s.gp}`, "Próxima etapa", s.equipe, Gi?.fundoDe(prox.pista), "proxima",
      { gp: nomeGP(prox), etapa: s.gp + 1, total: s.tamanho, faltam: s.tamanho - s.gp, previsao: prev && prev.titulo ? ` · ${prev.titulo}` : "" });
  }
  return lista;
}
// prepara os stories da tela e diz qual é o primeiro ainda não visto (-1: nenhum novo); o perfil do topo da Central usa isto
function preparar(c) { atuais = montar(c); return atuais.findIndex((x) => !visto[x.k]); }
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
  if (atuais.every((y) => visto[y.k])) document.querySelector(".cx-perfil.com-stories")?.classList.add("vistas");
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
root.Stories = { faixa, montar, preparar, fechar };
})(window);
