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
  const story = (k, rot, eq, foto, sit, v, extra = {}) => { const x = TX ? TX.texto(sit, k, v) : { tit: rot, sub: "" }; lista.push({ k, rot, eq, foto, sit, tit: x.tit, sub: x.sub, ...extra }); };
  const ultimo = gps[gps.length - 1];
  if (ultimo) {
    const vence = ultimo.linhas.find((l) => l.pos === 1), minha = ultimo.linhas.find((l) => l.piloto === "voce"), e = s.calendario[ultimo.gp];
    const sit = !minha ? "fora" : minha.dnf ? "abandono" : minha.pos === 1 ? "vitoria" : minha.pos <= 3 ? "podio" : minha.pos <= 10 ? "pontos" : "fora";
    story(`gp:${s.ano}:${ultimo.gp}`, "Último GP", sit === "vitoria" ? s.equipe : vence?.equipe || s.equipe, Gi?.fundoDe(ultimo.pista), sit,
      { gp: nomeGP(e), pos: minha ? ord(minha.pos) : "", pts: minha?.pontos || 0, pontos_txt: ptsTxt(minha?.pontos || 0), vencedor: nome(vence?.piloto) },
      { num: !minha ? "—" : minha.dnf ? "DNF" : ord(minha.pos), numRot: minha && !minha.dnf ? `+${minha.pontos} pts` : "", pista: ultimo.pista });
  }
  if (gps.length && meu) {
    const lider = pil[0], dif = lider.pontos - meu.pontos, seg = pil[1];
    const sit = eu === 0 ? "lider" : eu <= 2 || dif <= 25 ? "caca" : "longe";
    story(`camp:${s.ano}:${gps.length}`, "Campeonato", eu === 0 ? s.equipe : lider.equipe, null, sit,
      { pts: meu.pontos, vant: eu === 0 ? meu.pontos - (seg?.pontos || 0) : 0, segundo: seg?.nome || "ninguém", lider: lider.nome, pos: ord(eu + 1), dif },
      { num: ord(eu + 1), numRot: `${meu.pontos} pts`, eq2: eu === 0 ? seg?.equipe : s.equipe, dif: eu === 0 ? meu.pontos - (seg?.pontos || 0) : dif, nomeA: eu === 0 ? "Você" : lider.nome, nomeB: eu === 0 ? seg?.nome || "" : "Você" });
    const frente = pil[eu - 1];
    if (frente && eu > 1) story(`rival:${s.ano}:${gps.length}`, "Rival", frente.equipe, null, "rival",
      { rival: frente.nome, dif: frente.pontos - meu.pontos, pontos_txt: ptsTxt(frente.pontos - meu.pontos), equipe: eqs[frente.equipe]?.nome || "" },
      { num: `${frente.pontos - meu.pontos}`, numRot: "pontos de diferença", eq2: s.equipe, dif: frente.pontos - meu.pontos, nomeA: frente.nome, nomeB: "Você" });
    const melhor = gps.map((g) => ({ g, l: g.linhas.find((x) => x.piloto === "voce") })).filter((x) => x.l && !x.l.dnf).sort((a, b) => a.l.pos - b.l.pos)[0];
    if (melhor && gps.length > 1) story(`melhor:${s.ano}:${melhor.g.gp}`, "Seu melhor", s.equipe, Gi?.fundoDe(melhor.g.pista), "melhor",
      { pos: ord(melhor.l.pos), gp: nomeGP(s.calendario[melhor.g.gp]), ano: String(s.ano).padStart(2, "0") }, { num: ord(melhor.l.pos), numRot: "melhor do ano", pista: melhor.g.pista });
  }
  // os stories que os amigos lançaram (temporada em grupo): vêm antes das notícias, o mais novo primeiro
  if (c.grupo) for (const a of (c.storiesAmigos || []).slice().sort((x, y) => y.em - x.em)) {
    lista.push({ k: `amigo:${a.id}`, rot: a.pid === c.eu ? "Seu story" : a.nome, eq: a.equipe || s.equipe, foto: null, sit: "amigo", tit: a.texto, sub: a.dado ? a.dado.rot : "",
      num: a.dado ? a.dado.num : "", numRot: a.dado ? a.dado.rot : "", modelo: a.modelo || null, amigo: a, meu: a.pid === c.eu });
  }
  if (prox) {
    const prev = previsao && root.F1Regras?.descreverPrevisao ? root.F1Regras.descreverPrevisao(previsao, s.voltas) : null;
    story(`prox:${s.ano}:${s.gp}`, "Próxima etapa", s.equipe, Gi?.fundoDe(prox.pista), "proxima",
      { gp: nomeGP(prox), etapa: s.gp + 1, total: s.tamanho, faltam: s.tamanho - s.gp, previsao: prev && prev.titulo ? ` · ${prev.titulo}` : "" }, { num: `${s.gp + 1}/${s.tamanho}`, numRot: "etapa", pista: prox.pista });
  }
  return lista;
}
// prepara os stories da tela e diz qual é o primeiro ainda não visto (-1: nenhum novo); o perfil do topo da Central usa isto
function preparar(c) { ultimoCtx = c; atuais = montar(c); return atuais.findIndex((x) => !visto[x.k]); }
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
// os 40 modelos de desenho: 5 layouts (capa, número gigante, manchete de jornal, duelo, traçado da pista) × 8 fundos (foto, gradiente
// da equipe, papel, neon, listras, bandeirada, dividido, vidro). Cada situação só usa os layouts que combinam com ela; o fundo é livre.
// A escolha é fixa pela chave da notícia (o mesmo story sai sempre igual). Stories.vitrine() mostra os 40 em sequência.
const GERAIS = ["capa", "numero", "manchete", "topo", "centro", "faixa", "lateral", "contorno", "cartao", "selo", "citacao", "tv", "poster", "minimal", "grade"];
const LAYOUTS = { amigo: ["capa", "topo", "centro", "faixa", "cartao", "citacao", "tv", "poster", "minimal", "manchete", "lateral"], gp: [...GERAIS, "pista", "placar", "medalha"], camp: [...GERAIS, "duelo", "placar"], rival: [...GERAIS, "duelo", "duelo"], melhor: [...GERAIS, "pista", "medalha"], prox: [...GERAIS, "pista", "ticket", "ticket"] };
const FUNDOS = ["foto", "gradiente", "papel", "neon", "listras", "bandeirada", "dividido", "vidro"];
const TODOS = [...GERAIS, "duelo", "pista", "placar", "ticket", "medalha"].flatMap((l) => FUNDOS.map((f) => `${l}:${f}`)); // 20 layouts × 8 fundos = 160
function hashK(k) { let x = 2166136261; for (const c of String(k)) { x ^= c.charCodeAt(0); x = Math.imul(x, 16777619); } return x >>> 0; }
function modeloDe(x) {
  if (x.modelo) { const [l, f] = x.modelo.split(":"); return [l === "duelo" && !x.eq2 ? "capa" : l === "pista" && !x.pista ? "capa" : l, f]; }
  const ls = LAYOUTS[x.k.split(":")[0]] || ["capa"], a = hashK(x.k + ":l"), b = hashK(x.k + ":f");
  let l = ls[a % ls.length]; if (l === "duelo" && !x.eq2) l = "capa"; if (l === "pista" && !x.pista) l = "numero";
  const fundos = x.k.startsWith("prox:") && x.foto ? ["foto", "vidro"] : FUNDOS; // a próxima pista sempre com a foto dela no fundo
  return [l, fundos[b % fundos.length]];
}
function corpoDo(x, l) {
  const eqs = root.F1Pilotos.EQUIPES, tit = `<h2>${h(x.tit)}</h2>`, sub = x.sub ? `<p>${h(x.sub)}</p>` : "";
  if (l === "numero") return `<div class="st-corpo st-m-numero"><span class="st-num">${h(x.num || "")}</span>${x.numRot ? `<small class="st-num-rot">${h(x.numRot)}</small>` : ""}${tit}${sub}</div>`;
  if (l === "manchete") return `<div class="st-corpo st-m-manchete"><div class="st-jornal"><b>EXTRA</b><span>Corrida da Galera · ${h(x.rot)}</span></div>${tit}<i class="st-fio"></i>${sub}<span class="st-logo">${logo(x.eq)}</span></div>`;
  if (l === "duelo") return `<div class="st-corpo st-m-duelo"><div class="st-vs"><span style="--c:${h(eqs[x.eq]?.cor || "#888")}">${logo(x.eq)}<b>${h(x.nomeA || "")}</b></span><em>${x.dif != null ? `${h(x.dif)}<small>pts</small>` : "VS"}</em><span style="--c:${h(eqs[x.eq2]?.cor || "#888")}">${logo(x.eq2)}<b>${h(x.nomeB || "")}</b></span></div>${tit}${sub}</div>`;
  if (l === "pista" && root.GpSobre) return `<div class="st-corpo st-m-pista"><span class="st-traco">${root.GpSobre.mapaSvg(x.pista, "st-traco-svg")}</span>${tit}${sub}</div>`;
  const num = x.num ? `<span class="st-num">${h(x.num)}</span>` : "", rot = x.numRot ? `<small class="st-num-rot">${h(x.numRot)}</small>` : "", lg = `<span class="st-logo">${logo(x.eq)}</span>`;
  if (l === "topo") return `<div class="st-corpo st-m-topo">${tit}${sub}<span class="st-logo st-logo-baixo">${logo(x.eq)}</span></div>`;
  if (l === "centro") return `<div class="st-corpo st-m-centro"><span class="st-logo st-logo-g">${logo(x.eq)}</span>${tit}${sub}</div>`;
  if (l === "faixa") return `<div class="st-corpo st-m-faixa"><div class="st-banda">${tit}</div>${sub}</div>`;
  if (l === "lateral") return `<div class="st-corpo st-m-lateral"><b class="st-vertical">${h(x.rot)}</b><div>${lg}${tit}${sub}</div></div>`;
  if (l === "contorno") return `<div class="st-corpo st-m-contorno"><span class="st-marca-dagua">${h(x.num || x.rot)}</span>${tit}${sub}</div>`;
  if (l === "cartao") return `<div class="st-corpo st-m-cartao"><div class="st-cartao">${lg}${tit}${sub}</div></div>`;
  if (l === "selo") return `<div class="st-corpo st-m-selo"><span class="st-selo">${h(x.num || "★")}${rot}</span>${tit}${sub}</div>`;
  if (l === "citacao") return `<div class="st-corpo st-m-citacao"><span class="st-aspas">“</span>${tit}${sub ? `<p>— ${h(x.sub)}</p>` : ""}</div>`;
  if (l === "tv") return `<div class="st-corpo st-m-tv"><div class="st-tarja"><span class="st-tarja-cor">${logo(x.eq)}</span><div><b>${h(x.rot)}</b>${tit}</div></div>${sub}</div>`;
  if (l === "poster") return `<div class="st-corpo st-m-poster${String(x.tit).length > 34 ? " longo" : ""}">${tit}${sub}</div>`;
  if (l === "minimal") return `<div class="st-corpo st-m-minimal"><i class="st-linha"></i>${tit}${sub}</div>`;
  if (l === "grade") return `<div class="st-corpo st-m-grade"><div class="st-grade"><span><b>${h(x.num || "—")}</b><small>${h(x.numRot || x.rot)}</small></span><span>${logo(x.eq)}<small>${h(eqs[x.eq]?.nome || "")}</small></span><span><b>${h(x.dif ?? "—")}</b><small>diferença</small></span><span><b>${h(String(x.rot).split(" ")[0])}</b><small>notícia</small></span></div>${tit}${sub}</div>`;
  if (l === "placar") return `<div class="st-corpo st-m-placar"><div class="st-placar"><span>POS<b>${h(x.num || "—")}</b></span><span>PTS<b>${h(String(x.numRot || "").replace(/[^0-9+]/g, "") || "—")}</b></span><span>DIF<b>${h(x.dif ?? "—")}</b></span></div>${tit}${sub}</div>`;
  if (l === "ticket") return `<div class="st-corpo st-m-ticket"><div class="st-ticket"><div><small>Corrida da Galera</small>${tit}${sub}</div><span class="st-canhoto"><b>${h(x.num || "")}</b><small>${h(x.numRot || "")}</small></span></div></div>`;
  if (l === "medalha") return `<div class="st-corpo st-m-medalha"><span class="st-fita"></span><span class="st-medalha">${h(x.num || "1º")}</span>${tit}${sub}</div>`;
  return `<div class="st-corpo">${lg}${tit}${sub}</div>`;
}
function mostrar(i) {
  if (i < 0 || i >= atuais.length) return fechar();
  aberto = i; const x = atuais[i], cor = root.F1Pilotos.EQUIPES[x.eq]?.cor || "#e10600"; marcar(x.k);
  document.querySelector(`.st-bola[data-story="${i}"]`)?.classList.add("vista");
  if (atuais.every((y) => visto[y.k])) document.querySelector(".cx-perfil.com-stories")?.classList.add("vistas");
  const el = tela();
  const [l, f] = modeloDe(x);
  el.innerHTML = `<div class="st-card st-l-${l} st-f-${f}" data-modelo="${l}:${f}" style="--c:${h(cor)};--foto:${x.foto ? `url('${h(x.foto)}')` : "none"}">
    <div class="st-barras">${atuais.map((_, k) => `<i class="${k < i ? "cheia" : ""}"><b${k === i ? ' class="anda"' : ""}></b></i>`).join("")}</div>
    <header><span class="st-mini">${logo(x.eq)}</span><b>${h(x.rot)}</b><button type="button" class="st-x" data-st-fechar aria-label="Fechar">✕</button></header>
    ${corpoDo(x, l)}${x.amigo ? rodapeAmigo(x) : ""}
    <button type="button" class="st-lado esq" data-st-ir="-1" aria-label="Anterior"></button><button type="button" class="st-lado dir" data-st-ir="1" aria-label="Próxima"></button></div>`;
  el.hidden = false; clearTimeout(timer); inicio = performance.now(); timer = setTimeout(() => mostrar(aberto + 1), DURA);
}
// o rodapé do story de um amigo: as reações (quem não é o autor reage; o autor vê quem reagiu e pode apagar)
function rodapeAmigo(x) {
  const R = ["🔥", "😂", "💀"], r = x.amigo.reacoes || {}, conta = (e) => Object.values(r).filter((v) => v === e).length, meu = r[ultimoCtx && ultimoCtx.eu];
  const nomes = (e) => Object.entries(r).filter(([, v]) => v === e).map(([pid]) => (ultimoCtx?.pessoas || []).find((p) => p.id === pid)?.nome || "").filter(Boolean).join(", ");
  if (x.meu) return `<footer class="st-reacoes st-meu">${R.map((e) => `<span title="${h(nomes(e))}">${e} ${conta(e)}</span>`).join("")}<button type="button" class="st-apagar" data-st-apagar="${h(x.amigo.id)}">Apagar</button></footer>`;
  return `<footer class="st-reacoes">${R.map((e) => `<button type="button" class="${meu === e ? "on" : ""}" data-st-reagir="${e}" data-st-id="${h(x.amigo.id)}">${e}<small>${conta(e) || ""}</small></button>`).join("")}</footer>`;
}
// ---------- lançar o seu story (temporada em grupo) ----------
let envio = null, ultimoCtx = null;
const LAY = () => ["capa", "numero", "manchete", "topo", "centro", "faixa", "lateral", "contorno", "cartao", "selo", "citacao", "tv", "poster", "minimal", "grade"];
// pode lançar? (grupo, ainda não lançou nesta rodada)
function podeLancar(c) { return !!(c && c.grupo && envio && !(c.storiesAmigos || []).some((a) => a.pid === c.eu && a.ano === c.s.ano && a.gp === c.s.gp)); }
function abrirLancar() {
  const c = ultimoCtx; if (!c) return;
  const ultimo = (c.gps || []).at(-1), minha = ultimo && ultimo.linhas.find((l) => l.piloto === "voce"), el = tela();
  clearTimeout(timer); aberto = -2;
  const opt = (v, t) => `<option value="${v}">${h(t)}</option>`;
  el.innerHTML = `<div class="st-lancar"><header><b>Lançar story</b><button type="button" class="st-x" data-st-fechar aria-label="Fechar">✕</button></header>
    <div class="st-lancar-corpo"><div class="st-previa" id="stPrevia"></div><form id="stForm" class="st-form" autocomplete="off">
      <label for="stTexto">O que você quer contar?</label><textarea id="stTexto" maxlength="120" rows="3" placeholder="Ex.: Semana que vem eu passo todo mundo na largada"></textarea><small id="stConta">0/120</small>
      <label for="stLayout">Modelo</label><div class="st-duas"><select id="stLayout">${opt("", "Layout surpresa")}${LAY().map((l) => opt(l, l)).join("")}</select><select id="stFundo">${opt("", "Fundo surpresa")}${["foto", "gradiente", "papel", "neon", "listras", "bandeirada", "dividido", "vidro"].map((f) => opt(f, f)).join("")}</select></div>
      ${minha ? `<label class="st-check"><input type="checkbox" id="stDado"> Mostrar o meu resultado do último GP (${minha.dnf ? "DNF" : minha.pos + "º"})</label>` : ""}
      <p class="st-aviso">Um story por rodada. Todo mundo da sala vê e pode reagir.</p>
      <button type="submit" class="st-publicar">Publicar</button></form></div></div>`;
  el.hidden = false;
  const atualizar = () => {
    const texto = document.getElementById("stTexto").value.trim() || "O seu texto aparece aqui", l = document.getElementById("stLayout").value, f = document.getElementById("stFundo").value, dado = document.getElementById("stDado")?.checked;
    document.getElementById("stConta").textContent = `${document.getElementById("stTexto").value.length}/120`;
    const x = { k: "previa", rot: "Seu story", eq: c.s.equipe, tit: texto, sub: dado && minha ? `${minha.pontos} pontos no último GP` : "", num: dado && minha ? (minha.dnf ? "DNF" : `${minha.pos}º`) : "", numRot: "", modelo: `${l || "capa"}:${f || "gradiente"}` };
    const [ll, ff] = modeloDe(x), cor = root.F1Pilotos.EQUIPES[x.eq]?.cor || "#e10600";
    document.getElementById("stPrevia").innerHTML = `<div class="st-card st-l-${ll} st-f-${ff}" style="--c:${h(cor)};--foto:none"><header><span class="st-mini">${logo(x.eq)}</span><b>${h(x.rot)}</b></header>${corpoDo(x, ll)}</div>`;
  };
  ["input", "change"].forEach((ev) => document.getElementById("stForm").addEventListener(ev, atualizar));
  document.getElementById("stForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const texto = document.getElementById("stTexto").value.trim(); if (!texto) return document.getElementById("stTexto").focus();
    const l = document.getElementById("stLayout").value, f = document.getElementById("stFundo").value, sorteio = ["capa", "topo", "centro", "faixa", "cartao", "poster", "tv"], fundos = ["foto", "gradiente", "papel", "neon", "listras", "bandeirada", "dividido", "vidro"];
    const modelo = `${l || sorteio[Math.floor(Math.random() * sorteio.length)]}:${f || fundos[Math.floor(Math.random() * fundos.length)]}`;
    const r = await envio("story", { texto, modelo, dado: !!document.getElementById("stDado")?.checked });
    if (r && r.ok) fechar();
  });
  atualizar(); document.getElementById("stTexto").focus();
}
function fechar() { clearTimeout(timer); aberto = -1; const el = document.getElementById("stTela"); if (el) { el.hidden = true; el.innerHTML = ""; } }
document.addEventListener("click", (e) => {
  const b = e.target.closest?.("[data-story],[data-st-ir],[data-st-fechar],[data-st-lancar],[data-st-reagir],[data-st-apagar]"); if (!b) { if (aberto >= 0 && e.target.id === "stTela") fechar(); return; }
  if (b.hasAttribute("data-st-fechar")) return fechar();
  if (b.hasAttribute("data-st-lancar")) return abrirLancar();
  if (b.dataset.stReagir) { clearTimeout(timer); const voltar = aberto; envio?.("storyReagir", { id: b.dataset.stId, emoji: b.dataset.stReagir }).then(() => { if (aberto === voltar) mostrar(voltar); }); return; }
  if (b.dataset.stApagar) { if (confirm("Apagar o seu story desta rodada?")) envio?.("storyApagar", { id: b.dataset.stApagar }).then(() => fechar()); return; }
  if (b.dataset.stIr) return mostrar(aberto + Number(b.dataset.stIr));
  mostrar(Number(b.dataset.story));
});
document.addEventListener("keydown", (e) => {
  if (aberto === -2 && e.key === "Escape") { e.stopPropagation(); return fechar(); }
  if (aberto < 0) return;
  if (e.key === "Escape") { e.stopPropagation(); fechar(); } else if (e.key === "ArrowRight") mostrar(aberto + 1); else if (e.key === "ArrowLeft") mostrar(Math.max(0, aberto - 1));
}, true);
// a vitrine: o primeiro story da tela nos 40 modelos, em sequência (no console: Stories.vitrine())
function vitrine(c) {
  if (c) atuais = montar(c); if (!atuais.length) return 0;
  const base = atuais[0];
  atuais = TODOS.map((m, i) => ({ ...base, k: `${base.k}:v${i}`, modelo: m, rot: `Modelo ${i + 1} de ${TODOS.length} · ${m}`, num: base.num || "3º", numRot: base.numRot || "exemplo",
    eq2: base.eq2 || base.eq, dif: base.dif ?? 12, nomeA: base.nomeA || "Rival", nomeB: base.nomeB || "Você", pista: base.pista || "interlagos" }));
  mostrar(0); return TODOS.length;
}
root.Stories = { faixa, montar, preparar, fechar, vitrine, podeLancar, usarEnvio(fn) { envio = fn; }, MODELOS: TODOS };
})(window);
