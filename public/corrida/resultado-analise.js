// Corrida da Galera — a análise da corrida na tela do resultado (qualquer sala com regras de F1, não só a carreira).
// O servidor anota cada volta de cada carro (corrida-analise.js: a posição ao cruzar a linha, o tempo, os 3 setores, os pits e as voltas de
// safety car) e manda o resumo uma vez, quando esta tela pede (`analise`). Três abas, tudo com o mouse:
//  - Posições: o gráfico volta a volta de todos (o "spaghetti"); passar o mouse destaca o piloto mais perto e diz a posição naquela volta;
//  - Ritmo: o tempo de cada volta de dois pilotos (A = você, ou o vencedor para quem assiste; B = o escolhido), com a diferença volta a volta;
//  - Pneus: os stints de cada um, na ordem de chegada, na cor do composto.
// Clicar num piloto (no gráfico, nos pneus ou na tabela do resultado) faz dele o B. As cores são as das equipes.
import { socket, h, sNow } from "./estado.js";
import { criarMiniatura } from "./gp-miniatura.js";

const cache = { chave: null, dados: null, pedindo: null };
let aba = "posicoes", escolhidoB = null, mini = null, filtro = "tudo", tocar = null;

const tempo = (s) => (s == null ? "—" : `${Math.floor(s / 60)}:${(s % 60).toFixed(3).padStart(6, "0")}`);
const sinal = (d) => `${d > 0 ? "+" : d < 0 ? "−" : ""}${Math.abs(d).toFixed(3)}`;
const corOk = (c) => (/^#[0-9a-f]{6}$/i.test(c || "") ? c : "#9aa1ad");
const corPneu = (c) => corOk(window.F1Regras?.PNEUS?.[c]?.cor);
const nomePneu = (c) => window.F1Regras?.PNEUS?.[c]?.nome || c || "?";
const media = (l) => (l.length ? l.reduce((a, b) => a + b, 0) / l.length : null);
const desvio = (l) => { const m = media(l); return l.length > 1 ? Math.sqrt(l.reduce((a, b) => a + (b - m) ** 2, 0) / l.length) : 0; };

// quem é quem: nome, sigla, cor da equipe (o companheiro de equipe vem tracejado no gráfico das posições)
function pilotos(S, A) {
  const out = [], vistos = {};
  for (const r of S.resultado || []) {
    const d = A.pilotos[r.id], p = S.players.find((x) => x.id === r.id); if (!d || !p) continue;
    const eq = p.equipe && window.F1Pilotos?.EQUIPES?.[p.equipe], cor = corOk(eq ? eq.cor : p.color);
    const n = (vistos[p.equipe || p.id] = (vistos[p.equipe || p.id] || 0) + 1);
    out.push({ id: r.id, r, d, p, cor, segundo: !!p.equipe && n > 1, nome: p.nomeCompleto || p.name || "?", sigla: window.HudTorre ? window.HudTorre.siglaDe(p) : String(p.sigla || p.name || "?").slice(0, 3).toUpperCase(), equipe: eq ? eq.nome : "" });
  }
  return out;
}
function stints(d) {
  const fim = d.v.length, lista = []; let de = 1, c = d.c0;
  for (const b of d.b || []) { const ate = Math.max(de, Math.min(fim, b.v || de)); lista.push({ c, de, ate, n: ate - de + 1 }); de = ate + 1; c = b.c; }
  if (de <= fim) lista.push({ c, de, ate: fim, n: fim - de + 1 });
  return lista;
}
// as faixas do safety car (voltas seguidas viram uma faixa só)
function faixasSC(sc) { const f = []; for (const v of [...(sc || [])].sort((a, b) => a - b)) { const u = f.at(-1); if (u && u[1] === v - 1) u[1] = v; else f.push([v, v]); } return f; }

// ---------- Posições ----------
const GP = { W: 760, H: 300, e: 30, d: 46, t: 14, b: 24 };
function graficoPosicoes(L, A, idA, idB) {
  const n = Math.max(1, ...L.map((x) => x.d.v.length)), N = Math.max(2, L.length), { W, H, e, d, t, b } = GP;
  const x = (v) => e + (v / n) * (W - e - d), y = (pos) => t + ((pos - 1) / (N - 1)) * (H - t - b);
  const passo = Math.max(1, Math.ceil(n / 10)), ticks = []; for (let v = 0; v <= n; v += passo) ticks.push(v); if (ticks.at(-1) !== n) ticks.push(n);
  const sc = faixasSC(A.sc).map(([p, q]) => `<rect class="ra-sc" x="${x(p - 1).toFixed(1)}" y="${t}" width="${(x(q) - x(p - 1)).toFixed(1)}" height="${H - t - b}"><title>Safety car: volta${p === q ? ` ${p}` : `s ${p} a ${q}`}</title></rect>`).join("");
  const linhas = L.map((s) => {
    const pts = [[0, s.d.g > 0 ? s.d.g : s.r.grid + 1], ...s.d.p.map((pos, i) => [i + 1, pos])];
    const pits = (s.d.b || []).filter((p) => s.d.p[p.v - 1] != null).map((p) => `<circle class="ra-pit" cx="${x(p.v).toFixed(1)}" cy="${y(s.d.p[p.v - 1]).toFixed(1)}" r="3.2"/>`).join("");
    const fim = pts.at(-1);
    return `<g class="ra-serie ${s.id === idA ? "a" : ""} ${s.id === idB ? "b" : ""}" data-id="${h(s.id)}" style="--c:${s.cor}"><polyline class="${s.segundo ? "tr" : ""}" points="${pts.map(([v, p]) => `${x(v).toFixed(1)},${y(p).toFixed(1)}`).join(" ")}"/>${pits}<text x="${(x(fim[0]) + 5).toFixed(1)}" y="${(y(fim[1]) + 3.5).toFixed(1)}">${h(s.sigla)}</text></g>`;
  }).join("");
  return `<div class="ra-graf" data-graf="posicoes" data-n="${n}" data-npos="${N}"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Posição de cada piloto a cada volta">
    ${sc}${[1, Math.ceil(N / 2), N].map((p) => `<text class="ra-eixo" x="${e - 6}" y="${(y(p) + 3.5).toFixed(1)}" text-anchor="end">${p}º</text>`).join("")}
    ${ticks.map((v) => `<line class="ra-grade" x1="${x(v).toFixed(1)}" x2="${x(v).toFixed(1)}" y1="${t}" y2="${H - b}"/><text class="ra-eixo" x="${x(v).toFixed(1)}" y="${H - b + 15}" text-anchor="middle">${v === 0 ? "Grid" : v}</text>`).join("")}
    ${linhas}<line class="ra-mira" x1="0" x2="0" y1="${t}" y2="${H - b}" style="display:none"/></svg><div class="ra-dica" hidden></div></div>
    <p class="ra-legenda">Passe o mouse para ver a posição de cada um; clique numa linha para comparar o ritmo. <i class="ra-l-pit"></i> pit <i class="ra-l-sc"></i> safety car</p>`;
}
function ligarPosicoes(g, L, A, aoEscolher) {
  const svg = g.querySelector("svg"), dica = g.querySelector(".ra-dica"), mira = g.querySelector(".ra-mira"), n = +g.dataset.n, N = +g.dataset.npos, { W, H, e, d, t, b } = GP;
  const porId = new Map(L.map((s) => [s.id, s])), posEm = (s, v) => (v === 0 ? (s.d.g > 0 ? s.d.g : s.r.grid + 1) : s.d.p[v - 1]);
  let atual = null;
  const ponto = (ev) => { const r = svg.getBoundingClientRect(); return { px: ((ev.clientX - r.left) / r.width) * W, py: ((ev.clientY - r.top) / r.height) * H, r }; };
  const realce = (id) => { if (id === atual) return; atual = id; g.classList.toggle("foco", !!id); svg.querySelectorAll(".ra-serie").forEach((el) => el.classList.toggle("on", el.dataset.id === id)); };
  svg.addEventListener("pointermove", (ev) => {
    const { px, py, r } = ponto(ev), v = Math.max(0, Math.min(n, Math.round(((px - e) / (W - e - d)) * n))), pos = 1 + ((py - t) / (H - t - b)) * (N - 1);
    // a linha mais perto do mouse naquela volta (quem já abandonou não conta depois da última volta dele)
    let melhor = null, dist = Infinity;
    for (const s of L) { const p = posEm(s, v); if (p == null) continue; const dd = Math.abs(p - pos); if (dd < dist) { dist = dd; melhor = s; } }
    const vx = e + (v / n) * (W - e - d);
    mira.setAttribute("x1", vx); mira.setAttribute("x2", vx); mira.style.display = "";
    if (!melhor) { dica.hidden = true; realce(null); return; }
    realce(melhor.id);
    const p = posEm(melhor, v), pit = (melhor.d.b || []).find((x) => x.v === v), sc = (A.sc || []).includes(v), tv = v > 0 ? melhor.d.v[v - 1] : null;
    dica.innerHTML = `<b style="--c:${melhor.cor}">${h(melhor.sigla)}</b> ${h(melhor.nome)}<br>${v === 0 ? `Largou em ${p}º` : `Volta ${v}: <strong>${p}º</strong> · ${tempo(tv)}`}${pit ? `<br><span class="ra-tag">Pit: ${h(nomePneu(pit.c))}${pit.t ? ` · ${pit.t} s` : ""}</span>` : ""}${sc ? `<br><span class="ra-tag sc">Safety car</span>` : ""}`;
    dica.hidden = false;
    const cx = ev.clientX - g.getBoundingClientRect().left, cy = ev.clientY - g.getBoundingClientRect().top;
    dica.style.left = Math.min(cx + 14, g.clientWidth - dica.offsetWidth - 4) + "px"; dica.style.top = Math.max(0, cy - dica.offsetHeight - 10) + "px";
  });
  svg.addEventListener("pointerleave", () => { dica.hidden = true; mira.style.display = "none"; realce(null); });
  svg.addEventListener("click", () => { if (atual && porId.has(atual)) aoEscolher(atual); });
}

// ---------- Ritmo ----------
const GR = { W: 760, H: 230, e: 46, d: 12, t: 16, b: 24 };
function graficoRitmo(A, a, bb) {
  const { W, H, e, d, t, b } = GR, n = Math.max(1, a.d.v.length, bb ? bb.d.v.length : 0);
  // a escala fica nas voltas normais: uma volta de pit ou de safety car (muito mais lenta) não achata o resto
  const lentas = (s) => new Set([...(A.sc || []), ...(s.d.b || []).map((x) => x.v), ...(s.d.b || []).map((x) => x.v + 1)]);
  const limpas = [a, bb].filter(Boolean).flatMap((s) => { const fora = lentas(s); return s.d.v.filter((_, i) => !fora.has(i + 1)); });
  const base = limpas.length ? limpas : [...a.d.v, ...(bb ? bb.d.v : [])];
  const lo = Math.min(...base), hi = Math.max(...base), folga = Math.max(0.3, (hi - lo) * 0.12), y0 = lo - folga, y1 = hi + folga;
  const x = (v) => e + (n > 1 ? (v - 1) / (n - 1) : 0.5) * (W - e - d), y = (s) => t + (1 - (Math.min(y1, Math.max(y0, s)) - y0) / (y1 - y0)) * (H - t - b);
  const larg = (W - e - d) / Math.max(1, n - 1);
  const sc = faixasSC(A.sc).map(([p, q]) => { const xa = Math.max(e, x(p) - larg / 2), xb = Math.min(W - d, x(q) + larg / 2); return `<rect class="ra-sc" x="${xa.toFixed(1)}" y="${t}" width="${(xb - xa).toFixed(1)}" height="${H - t - b}"/>`; }).join("");
  const serie = (s, cls) => `<g class="ra-serie on ${cls}" style="--c:${s.cor}"><polyline class="${cls === "b" && s.cor === a.cor ? "tr" : ""}" points="${s.d.v.map((v, i) => `${x(i + 1).toFixed(1)},${y(v).toFixed(1)}`).join(" ")}"/>${(s.d.b || []).filter((p) => s.d.v[p.v - 1] != null).map((p) => `<circle class="ra-pit" cx="${x(p.v).toFixed(1)}" cy="${y(s.d.v[p.v - 1]).toFixed(1)}" r="3.4"/>`).join("")}</g>`;
  const ticksY = [0, 1, 2, 3, 4].map((i) => y0 + ((y1 - y0) * i) / 4), passo = Math.max(1, Math.ceil(n / 10)), ticksX = []; for (let v = 1; v <= n; v += passo) ticksX.push(v); if (ticksX.at(-1) !== n) ticksX.push(n);
  return `<div class="ra-graf" data-graf="ritmo" data-n="${n}"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Tempo de cada volta">
    ${ticksY.map((s) => `<line class="ra-grade" x1="${e}" x2="${W - d}" y1="${y(s).toFixed(1)}" y2="${y(s).toFixed(1)}"/><text class="ra-eixo" x="${e - 6}" y="${(y(s) + 3.5).toFixed(1)}" text-anchor="end">${tempo(s).slice(0, -2)}</text>`).join("")}
    ${ticksX.map((v) => `<text class="ra-eixo" x="${x(v).toFixed(1)}" y="${H - b + 15}" text-anchor="middle">${v}</text>`).join("")}
    ${sc}${bb ? serie(bb, "b") : ""}${serie(a, "a")}<line class="ra-mira" x1="0" x2="0" y1="${t}" y2="${H - b}" style="display:none"/></svg><div class="ra-dica" hidden></div></div>`;
}
function ligarRitmo(g, A, a, bb) {
  const svg = g.querySelector("svg"), dica = g.querySelector(".ra-dica"), mira = g.querySelector(".ra-mira"), n = +g.dataset.n, { W, e, d } = GR;
  svg.addEventListener("pointermove", (ev) => {
    const r = svg.getBoundingClientRect(), px = ((ev.clientX - r.left) / r.width) * W, v = Math.max(1, Math.min(n, Math.round(1 + ((px - e) / (W - e - d)) * (n - 1))));
    const vx = e + (n > 1 ? (v - 1) / (n - 1) : 0.5) * (W - e - d); mira.setAttribute("x1", vx); mira.setAttribute("x2", vx); mira.style.display = "";
    const ta = a.d.v[v - 1], tb = bb ? bb.d.v[v - 1] : null, pit = (s) => (s.d.b || []).find((x) => x.v === v);
    const linha = (s, tt) => `<b style="--c:${s.cor}">${h(s.sigla)}</b> ${tempo(tt)}${s.d.p[v - 1] ? ` · ${s.d.p[v - 1]}º` : ""}${pit(s) ? ` <span class="ra-tag">pit → ${h(nomePneu(pit(s).c))}</span>` : ""}`;
    dica.innerHTML = `<small>Volta ${v}${(A.sc || []).includes(v) ? " · safety car" : ""}</small><br>${linha(a, ta)}${bb ? `<br>${linha(bb, tb)}${ta != null && tb != null ? `<br><span class="ra-dif ${ta <= tb ? "ganha" : "perde"}">${h(a.sigla)} ${sinal(ta - tb)} s</span>` : ""}` : ""}`;
    dica.hidden = false;
    const cx = ev.clientX - g.getBoundingClientRect().left;
    dica.style.left = Math.min(cx + 14, g.clientWidth - dica.offsetWidth - 4) + "px"; dica.style.top = "6px";
  });
  svg.addEventListener("pointerleave", () => { dica.hidden = true; mira.style.display = "none"; });
}
// os números de cada um (só o que foi medido: melhor volta, média e variação das voltas sem pit e sem safety car, setores da melhor volta)
function cartao(A, s, papel) {
  const fora = new Set([...(A.sc || []), ...(s.d.b || []).map((x) => x.v), ...(s.d.b || []).map((x) => x.v + 1)]), limpas = s.d.v.filter((_, i) => !fora.has(i + 1));
  const melhor = s.d.v.length ? Math.min(...s.d.v) : null;
  return `<div class="ra-cartao ${papel}" style="--c:${s.cor}"><header><b>${h(s.sigla)}</b><span>${h(s.nome)}${s.equipe ? ` · ${h(s.equipe)}` : ""}</span></header>
    <dl><div><dt>Melhor volta</dt><dd>${tempo(melhor)}${s.d.mv ? ` <small>(volta ${s.d.mv})</small>` : ""}</dd></div>
    <div><dt title="Sem as voltas de pit, a seguinte e as de safety car">Média limpa</dt><dd>${limpas.length ? tempo(media(limpas)) : "—"}</dd></div>
    <div><dt title="Quanto as voltas limpas variam (desvio-padrão): menor é mais constante">Constância</dt><dd>${limpas.length > 1 ? `±${desvio(limpas).toFixed(3)} s` : "—"}</dd></div>
    <div><dt>Setores da melhor</dt><dd>${s.d.s ? s.d.s.map((x) => x.toFixed(3)).join(" · ") : "—"}</dd></div></dl></div>`;
}

// ---------- Pneus ----------
function pneus(L, idA, idB) {
  const n = Math.max(1, ...L.map((x) => x.d.v.length));
  return `<ol class="ra-pneus" style="--n:${n}">${L.map((s) => `<li class="${s.id === idA ? "a" : ""} ${s.id === idB ? "b" : ""}" data-id="${h(s.id)}" style="--c:${s.cor}" tabindex="0" title="Comparar o ritmo com ${h(s.nome)}">
      <span class="ra-p-pos">${s.r.dnf || s.r.nc || s.r.dsq ? "—" : s.r.pos}</span><b>${h(s.sigla)}</b>
      <span class="ra-p-barra">${stints(s.d).map((st) => `<i style="--pc:${corPneu(st.c)};--w:${(st.n / n) * 100}%" data-dica="${h(nomePneu(st.c))} · voltas ${st.de} a ${st.ate} (${st.n} volta${st.n > 1 ? "s" : ""})"><em>${h(nomePneu(st.c).slice(0, 1))}</em></i>`).join("")}</span>
      <small>${(s.d.b || []).length ? `${s.d.b.length} parada${s.d.b.length > 1 ? "s" : ""}` : "sem parada"}</small></li>`).join("")}</ol>
    <div class="ra-dica fixa" hidden></div>`;
}

// ---------- montar ----------
function html(S, A, L, idA, idB) {
  const a = L.find((s) => s.id === idA), bb = L.find((s) => s.id === idB) || null;
  const abas = [["posicoes", "Posições"], ["momentos", "Momentos"], ["ritmo", "Ritmo"], ["pneus", "Pneus"]];
  const corpo = aba === "ritmo" ? `<div class="ra-par">${cartao(A, a, "a")}${bb ? cartao(A, bb, "b") : ""}</div>${graficoRitmo(A, a, bb)}<p class="ra-legenda">Escolha outro piloto clicando no gráfico das posições, nos pneus ou na tabela acima.</p>`
    : aba === "pneus" ? pneus(L, idA, idB) : aba === "momentos" ? momentosHTML(momentos(S, A, L), A) : graficoPosicoes(L, A, idA, idB);
  const resumo = [A.safeties ? `${A.safeties} safety car${A.safeties > 1 ? "s" : ""}` : "", A.amarelas ? `${A.amarelas} bandeira${A.amarelas > 1 ? "s" : ""} amarela${A.amarelas > 1 ? "s" : ""}` : "", A.chuva ? "chuva" : ""].filter(Boolean).join(" · ");
  return `<header class="ra-cab"><div><h3>Análise da corrida</h3><small>${A.voltas} volta${A.voltas > 1 ? "s" : ""}${resumo ? ` · ${resumo}` : ""}</small></div>
    <div class="ra-abas" role="tablist">${abas.map(([k, r]) => `<button type="button" role="tab" data-ra-aba="${k}" class="${aba === k ? "on" : ""}" aria-selected="${aba === k}">${r}</button>`).join("")}</div></header>
    <div class="ra-vs"><span class="a" style="--c:${a.cor}">${h(a.sigla)}</span><small>vs</small>${bb ? `<span class="b" style="--c:${bb.cor}">${h(bb.sigla)}</span>` : `<span class="b vazio">escolha um piloto</span>`}</div>
    <div class="ra-corpo">${corpo}</div>`;
}
function desenhar(box, S, m, A) {
  pararMomentos();
  const L = pilotos(S, A).filter((s) => s.d.v.length); if (!L.length) { box.hidden = true; return; }
  const idA = (m && L.some((s) => s.id === m.id) && m.id) || L[0].id;
  // o B padrão: o carro que chegou logo à frente de A (ou logo atrás, se A ganhou)
  if (!escolhidoB || !L.some((s) => s.id === escolhidoB) || escolhidoB === idA) { const i = L.findIndex((s) => s.id === idA); escolhidoB = (L[i - 1] || L[i + 1] || {}).id || null; }
  box.innerHTML = html(S, A, L, idA, escolhidoB); box.hidden = false;
  const escolher = (id) => { if (id && id !== idA) { escolhidoB = id; if (aba === "posicoes") aba = "ritmo"; desenhar(box, S, m, A); } };
  box.querySelectorAll("[data-ra-aba]").forEach((bt) => { bt.onclick = () => { aba = bt.dataset.raAba; desenhar(box, S, m, A); }; });
  if (aba === "momentos") ligarMomentos(box, S, m, A, L, idA, escolher);
  const g = box.querySelector(".ra-graf");
  if (g && g.dataset.graf === "posicoes") ligarPosicoes(g, L, A, escolher);
  if (g && g.dataset.graf === "ritmo") ligarRitmo(g, A, L.find((s) => s.id === idA), L.find((s) => s.id === escolhidoB) || null);
  const lista = box.querySelector(".ra-pneus");
  if (lista) {
    const dica = box.querySelector(".ra-dica.fixa");
    lista.querySelectorAll("li").forEach((li) => { li.onclick = () => escolher(li.dataset.id); li.onkeydown = (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); escolher(li.dataset.id); } }; });
    lista.addEventListener("pointermove", (ev) => {
      const i = ev.target.closest && ev.target.closest("[data-dica]"); if (!i) { dica.hidden = true; return; }
      dica.textContent = i.dataset.dica; dica.hidden = false;
      const r = box.getBoundingClientRect(); dica.style.left = Math.min(ev.clientX - r.left + 12, box.clientWidth - dica.offsetWidth - 4) + "px"; dica.style.top = ev.clientY - r.top - dica.offsetHeight - 10 + "px";
    });
    lista.addEventListener("pointerleave", () => { dica.hidden = true; });
  }
}

// o lugar da análise na tela do resultado (fica vazio até o servidor responder; sem regras de F1 ou sem dados, some)
export const htmlAnalise = (S) => (S && S.config && S.config.regras === "f1" ? `<section class="ra" id="rgAnalise" hidden aria-label="Análise da corrida"></section>` : "");

export function montarAnalise(el, S, m) {
  const box = el.querySelector("#rgAnalise"); if (!box) return;
  // a tabela do resultado também escolhe o B: clicar numa linha
  el.querySelectorAll(".rg-linha[data-id]").forEach((li) => { li.addEventListener("click", () => { if (!cache.dados || li.dataset.id === (m && m.id)) return; escolhidoB = li.dataset.id; if (aba === "posicoes") aba = "ritmo"; desenhar(box, S, m, cache.dados); box.scrollIntoView({ behavior: "smooth", block: "nearest" }); }); });
  const chave = String(S.startAt || "") + ":" + S.config.pista;
  if (cache.chave === chave && cache.dados) { desenhar(box, S, m, cache.dados); return; }
  if (cache.pedindo === chave) return;
  cache.pedindo = chave; setTimeout(() => { if (cache.pedindo === chave) cache.pedindo = null; }, 8000); // (sem resposta: a próxima vez que a tela for refeita pede de novo)
  socket.emit("analise", (A) => {
    if (cache.pedindo === chave) cache.pedindo = null;
    if (!A || !A.pilotos) return;
    if (cache.chave !== chave) { escolhidoB = null; aba = "posicoes"; }
    cache.chave = chave; cache.dados = A;
    const atual = document.getElementById("rgAnalise"); if (atual && atual.isConnected) desenhar(atual, S, m, A);
  });
}

// sai da tela do resultado: solta a miniatura 3D e o replay dos momentos
export function soltarAnalise() { pararMomentos(); }
function pararMomentos() { if (tocar) { cancelAnimationFrame(tocar.raf); tocar = null; } if (mini) { mini.soltar(); mini = null; } }

// ---------- Momentos: a linha do tempo da corrida sobre a miniatura 3D da pista ----------
// Cada linha da direção de prova (corrida-analise.js `evento`) e cada fala do engenheiro (radio.js `historico`, só de quem pilotou) vira um momento;
// os que têm um piloto ganham um pino no lugar da pista onde ele estava. Passar o mouse acende, clicar leva a câmera até lá, ▶ refaz a corrida.
const TIPOS = {
  largada: { rot: "Largada", cor: "#ffffff" }, pit: { rot: "Pits", cor: "#2aa8ff" }, batida: { rot: "Batidas", cor: "#ff5a36" },
  punicao: { rot: "Punições", cor: "#c77dff" }, bandeira: { rot: "Bandeiras", cor: "#ffc21a" }, destaque: { rot: "Recordes", cor: "#5ee08a" }, radio: { rot: "Rádio", cor: "#9fb3c8" },
};
function tipoDe(x) {
  if (/^🏁/u.test(x)) return "largada"; if (/^🔧/u.test(x)) return /quebrou/.test(x) ? "batida" : "pit"; if (/^💥/u.test(x)) return "batida";
  if (/^(⏱️|🛑|🏴|⚠️|✅)/u.test(x)) return "punicao"; if (/^🏆/u.test(x)) return "destaque"; return "bandeira";
}
const emojiDe = (x) => { const m = String(x).match(/^(\S+)\s/); return m ? m[1] : "•"; };
const semEmoji = (x) => String(x).replace(/^\S+\s+/, "");
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
function momentos(S, A, L) {
  const porId = new Map(L.map((s) => [s.id, s])), cum = []; let soma = 0; for (const t of (L[0] && L[0].d.v) || []) cum.push((soma += t));
  const voltaEm = (t) => { const i = cum.findIndex((c) => c >= t); return i < 0 ? Math.max(1, cum.length) : i + 1; };
  const lista = (A.eventos || []).map((e) => ({ t: e.t, v: e.v || voltaEm(e.t), tipo: tipoDe(e.x), ico: emojiDe(e.x), txt: semEmoji(e.x), id: e.id, f: e.f, cor: e.id && porId.get(e.id) ? porId.get(e.id).cor : null }));
  // o rádio: a hora do navegador vira a do servidor (sNow), e só entra o que caiu dentro desta corrida
  const fim = Math.max(soma, ...lista.map((e) => e.t), 1), desvio = sNow() - Date.now();
  if (S.startAt && window.Radio && window.Radio.historico) for (const r of window.Radio.historico()) {
    const t = (r.em + desvio - S.startAt) / 1000; if (t < 0 || t > fim + 30) continue;
    lista.push({ t: Math.round(t * 10) / 10, v: voltaEm(t), tipo: "radio", ico: "📻", txt: r.texto, id: null, f: null, cor: null });
  }
  lista.sort((a, b) => a.t - b.t); lista.forEach((e, i) => { e.i = i; });
  return { lista, fim: Math.max(fim, ...lista.map((e) => e.t)), cum };
}
const fora = (e) => filtro !== "tudo" && filtro !== e.tipo;
function momentosHTML(M, A) {
  const { lista, fim, cum } = M, W = 760, H = 46, x = (t) => 12 + (t / fim) * (W - 24);
  const conta = {}; for (const e of lista) conta[e.tipo] = (conta[e.tipo] || 0) + 1;
  const filtros = [["tudo", "Tudo", lista.length], ...Object.keys(TIPOS).filter((k) => conta[k]).map((k) => [k, TIPOS[k].rot, conta[k]])];
  const sc = faixasSC(A.sc).map(([p, q]) => { const a = p > 1 ? cum[p - 2] || 0 : 0, b = cum[q - 1] || fim; return `<rect class="ra-sc" x="${x(a).toFixed(1)}" y="6" width="${Math.max(2, x(b) - x(a)).toFixed(1)}" height="${H - 18}"/>`; }).join("");
  const cada = Math.max(1, Math.ceil(cum.length / 12));
  const voltas = cum.map((c, i) => ((i + 1) % cada === 0 || i === cum.length - 1 ? `<line class="ra-grade" x1="${x(c).toFixed(1)}" x2="${x(c).toFixed(1)}" y1="6" y2="${H - 12}"/><text class="ra-eixo" x="${x(c).toFixed(1)}" y="${H - 1}" text-anchor="middle">V${i + 1}</text>` : "")).join("");
  const itens = lista.length ? lista.map((e) => `<li data-ev="${e.i}" tabindex="0" style="--c:${TIPOS[e.tipo].cor};--p:${e.cor || "transparent"}" class="${fora(e) ? "fora" : ""}"><span class="ra-mom-v">V${e.v}<small>${mmss(e.t)}</small></span><i>${h(e.ico)}</i><span class="ra-mom-txt">${h(e.txt)}</span>${e.f != null ? `<b class="ra-mom-pin" title="Tem lugar na pista">●</b>` : ""}</li>`).join("") : `<li class="vazio">Nada anotado nesta corrida.</li>`;
  return `<div class="ra-mom">
    <div class="ra-mom-palco"><div class="ra-mini"></div><div class="ra-dica ra-mom-dica" hidden></div>
      <div class="ra-mom-barra"><button type="button" class="ra-play" aria-label="Refazer a corrida">▶</button><small>Arraste para girar · roda para aproximar · clique num pino</small></div></div>
    <div class="ra-mom-lado"><div class="ra-filtros" role="group" aria-label="Filtrar os momentos">${filtros.map(([k, r, n]) => `<button type="button" data-filtro="${k}" class="${filtro === k ? "on" : ""}" style="--c:${(TIPOS[k] || {}).cor || "#ffffff"}">${r} <small>${n}</small></button>`).join("")}</div>
      <ol class="ra-mom-lista">${itens}</ol><small class="ra-legenda">Dois cliques num momento de outro piloto: compara o ritmo com ele.</small></div>
    <div class="ra-graf ra-tempo"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Linha do tempo da corrida">${sc}${voltas}<line class="ra-grade" x1="12" x2="${W - 12}" y1="22" y2="22"/>
      ${lista.map((e) => `<circle class="ra-ponto ${fora(e) ? "fora" : ""}" data-ev="${e.i}" cx="${x(e.t).toFixed(1)}" cy="22" r="5" style="--c:${TIPOS[e.tipo].cor}"><title>V${e.v} · ${h(e.txt)}</title></circle>`).join("")}
      <line class="ra-cabeca" x1="12" x2="12" y1="4" y2="${H - 12}" style="display:none"/></svg></div></div>`;
}
function ligarMomentos(box, S, m, A, L, idA, escolher) {
  const M = momentos(S, A, L), { lista, fim } = M, pista = A.pista || S.config.pista;
  const palco = box.querySelector(".ra-mini"), dica = box.querySelector(".ra-mom-dica"), ol = box.querySelector(".ra-mom-lista"), svg = box.querySelector(".ra-tempo svg");
  const W = 760, xT = (t) => 12 + (t / fim) * (W - 24), cabeca = svg.querySelector(".ra-cabeca"), meu = L.find((s) => s.id === idA);
  const visiveis = (ate = Infinity) => lista.filter((e) => e.f != null && e.t <= ate && !fora(e)).map((e) => ({ id: e.i, f: e.f, cor: TIPOS[e.tipo].cor, alto: e.tipo === "batida" ? 5 : 3.6 }));
  const G = window.GpInfo, curvas = G && G.get ? G.get(pista).curvas || [] : [];
  const curvaPerto = (f) => { let c = null, d = 0.035; for (const k of curvas) { const dd = Math.min(Math.abs(k.f - f), 1 - Math.abs(k.f - f)); if (dd < d) { d = dd; c = k; } } return c; };
  const mostrar = (txt, xy, de) => { if (!txt || !xy) { dica.hidden = true; return; } dica.dataset.de = de || ""; dica.innerHTML = txt; dica.hidden = false; dica.style.left = Math.max(4, Math.min(xy.x + 14, palco.clientWidth - dica.offsetWidth - 4)) + "px"; dica.style.top = Math.max(4, xy.y - dica.offsetHeight - 12) + "px"; };
  let escolhido = null;
  const acender = (i) => {
    box.querySelectorAll(".ra-mom-lista li.hi, .ra-ponto.hi").forEach((x) => x.classList.remove("hi"));
    if (i == null) { if (mini) mini.destacar(null); return; }
    box.querySelectorAll(`[data-ev="${i}"]`).forEach((x) => x.classList.add("hi"));
    const li = ol.querySelector(`li[data-ev="${i}"]`);
    if (li) { const topo = li.offsetTop - ol.offsetTop; if (topo < ol.scrollTop || topo > ol.scrollTop + ol.clientHeight - li.offsetHeight) ol.scrollTop = topo - ol.clientHeight / 2; }
    if (mini) mini.destacar(i);
  };
  const texto = (e) => { const c = e.f != null ? curvaPerto(e.f) : null; return `<small>Volta ${e.v} · ${mmss(e.t)}</small><br>${h(e.ico)} ${h(e.txt)}${c ? `<br><span class="ra-tag">perto da curva ${c.n}${c.nome ? ` · ${h(c.nome)}` : ""}</span>` : ""}`; };
  const escolherEv = (i) => {
    const e = lista[i]; if (!e) return; escolhido = i; acender(i);
    box.querySelectorAll(".ra-mom-lista li.sel").forEach((x) => x.classList.remove("sel")); const li = ol.querySelector(`li[data-ev="${i}"]`); if (li) li.classList.add("sel");
    if (mini) mini.focar(e.f != null ? e.f : null);
    cabeca.style.display = ""; cabeca.setAttribute("x1", xT(e.t)); cabeca.setAttribute("x2", xT(e.t));
  };
  mini = criarMiniatura(palco, pista, {
    cor: meu ? meu.cor : null,
    aoMarcador: (id, como, xy) => { if (id == null) { acender(escolhido); mostrar(null); return; } acender(id); mostrar(texto(lista[id]), xy, "pino"); if (como === "clique") escolherEv(id); },
    aoPassar: (p) => { if (!p) { if (dica.dataset.de === "pista") mostrar(null); return; } const c = curvaPerto(p.f); mostrar(`<small>${Math.round(p.f * 100)}% da volta</small>${c ? `<br>Curva ${c.n}${c.nome ? ` · ${h(c.nome)}` : ""}` : ""}`, p, "pista"); },
  });
  if (!mini) { palco.classList.add("sem3d"); palco.innerHTML = window.GpSobre ? window.GpSobre.mapaSvg(pista, "sn-sobre-svg ra-mapa2d") : ""; }
  else { mini.marcadores(visiveis()); if (curvas.length) mini.curvas(curvas); }
  // a lista e a linha do tempo acendem e escolhem os momentos
  const deEv = (ev) => { const a = ev.target.closest && ev.target.closest("[data-ev]"); return a ? +a.dataset.ev : null; };
  for (const alvo of [ol, svg]) {
    alvo.addEventListener("pointerover", (ev) => { const i = deEv(ev); if (i != null) acender(i); });
    alvo.addEventListener("pointerleave", () => acender(escolhido));
    alvo.addEventListener("click", (ev) => { const i = deEv(ev); if (i != null) escolherEv(i); });
  }
  ol.addEventListener("keydown", (ev) => { if (ev.key !== "Enter" && ev.key !== " ") return; const i = deEv(ev); if (i != null) { ev.preventDefault(); escolherEv(i); } });
  ol.addEventListener("dblclick", (ev) => { const i = deEv(ev), e = i != null ? lista[i] : null; if (e && e.id && e.id !== idA) escolher(e.id); });
  box.querySelectorAll("[data-filtro]").forEach((bt) => { bt.onclick = () => { filtro = bt.dataset.filtro; desenhar(box, S, m, A); }; });
  // ▶: a corrida em 14 s — os pinos aparecem na hora em que aconteceram, a cabeça anda na linha do tempo e o último momento acende
  const play = box.querySelector(".ra-play");
  play.onclick = () => {
    if (tocar) { cancelAnimationFrame(tocar.raf); tocar = null; play.textContent = "▶"; if (mini) mini.marcadores(visiveis()); return; }
    play.textContent = "❚❚"; if (mini) { mini.marcadores([]); mini.focar(null); }
    const DUR = 14000, t0 = performance.now(); let mostrados = -1;
    const passo = (agora) => {
      if (!box.isConnected || !tocar) return;
      const u = Math.min(1, (agora - t0) / DUR), tt = u * fim, vis = visiveis(tt);
      cabeca.style.display = ""; cabeca.setAttribute("x1", xT(tt)); cabeca.setAttribute("x2", xT(tt));
      if (vis.length !== mostrados) { mostrados = vis.length; if (mini) mini.marcadores(vis); const ult = lista.filter((e) => e.t <= tt && !fora(e)).at(-1); if (ult) acender(ult.i); }
      if (u >= 1) { tocar = null; play.textContent = "▶"; return; }
      tocar.raf = requestAnimationFrame(passo);
    };
    tocar = { raf: requestAnimationFrame(passo) };
  };
}
