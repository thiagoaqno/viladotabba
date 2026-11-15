// Corrida da Galera — a sub-aba TELEMETRIA da Análise da carreira (2026-11-15, a referência de análise que o Thiago mandou):
//  - o mapa da pista colorido na melhor volta do piloto escolhido: velocidade, frenagem ou aceleração;
//  - a telemetria comparativa: a velocidade ao longo da volta (a melhor de cada um), com os setores e onde o tempo foi ganho ou perdido;
//  - o desgaste dos pneus volta a volta (gravado desde 2026-11-15: corrida-analise.js `d`), com a cor do composto;
//  - a estratégia: a faixa de cada stint (o composto e as paradas) dos dois pilotos.
// Tudo sai do save: o resumo do GP (`resultado.analise`) e o replay (as amostras de 250 ms: a fração da volta, a velocidade, o acelerador e o freio;
// corrida-gravacao.js). Nada inventado: o GP sem replay ou sem desgaste gravado diz que não tem.
(function (root) {
"use strict";
const U = () => root.CentralUI, h = (v) => U().h(v), Pil = () => root.F1Pilotos, F = () => root.F1Regras;
let metrica = "vel"; // o que o mapa pinta: vel, freio, gas
// (2026-11-15, o Thiago: "na telemetria deve ser mais animado") a volta toca sozinha: os dois carros andam no mapa (cada um na própria melhor
// volta, no tempo de verdade, 3× mais rápido), o cursor corre no gráfico e o placar mostra a velocidade dos dois, o pedal e a diferença no
// mesmo ponto da pista. O mouse no gráfico pausa e leva a volta até ali; o botão toca e pausa.
const vivo = { vE: [], vO: [], passo: 250, T: null, graf: null, t: 0, tocando: true, raf: 0, ultimo: 0, mouse: false };
const VEL = 3;
const tempoTxt = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, "0").replace(".", ",")}`;
// o instante (s) em que a volta passa pela fração `f` (a primeira amostra além dela)
function tempoEm(vol, f, passo) { const i = vol.findIndex((x) => x.f >= f); return (i < 0 ? vol.length : i) * passo / 1000; }
function quadro() {
  const el = document.querySelector(".ct"); if (!el || !vivo.vE.length) { vivo.raf = 0; return; }
  const agora = performance.now(), dt = vivo.ultimo ? Math.min(0.1, (agora - vivo.ultimo) / 1000) : 0; vivo.ultimo = agora;
  const durE = vivo.vE.length * vivo.passo / 1000;
  if (vivo.tocando && !vivo.mouse) vivo.t = (vivo.t + dt * VEL) % durE;
  desenharVivo(el);
  vivo.raf = requestAnimationFrame(quadro);
}
function desenharVivo(el) {
  const { vE, vO, passo, T, graf } = vivo, iE = Math.min(vE.length - 1, Math.floor(vivo.t * 1000 / passo)), a = vE[iE];
  const iO = vO.length ? Math.min(vO.length - 1, Math.floor(vivo.t * 1000 / passo)) : -1, b = iO >= 0 ? vO[iO] : null;
  const pos = (c, s2) => { if (!c || !s2 || !T) return; const [x, y] = T.em(s2.f); c.setAttribute("cx", x.toFixed(2)); c.setAttribute("cy", y.toFixed(2)); };
  pos(el.querySelector(".ct-carro.eu"), a); pos(el.querySelector(".ct-carro.ou"), b);
  if (graf && a) { const cx = graf.e + a.f * (graf.W - graf.e - graf.d), cur = el.querySelector(".ct-cursor"); if (cur) { cur.setAttribute("x1", cx.toFixed(1)); cur.setAttribute("x2", cx.toFixed(1)); } }
  const q = (s2) => el.querySelector(s2);
  if (q(".ct-tempo")) q(".ct-tempo").textContent = tempoTxt(vivo.t);
  if (q(".ct-v.eu b")) q(".ct-v.eu b").textContent = a ? a.kmh : "—";
  if (q(".ct-v.ou b")) q(".ct-v.ou b").textContent = b ? b.kmh : "—";
  if (a && q(".ct-pedais .gas u")) { q(".ct-pedais .gas u").style.height = `${Math.round(a.gas * 100)}%`; q(".ct-pedais .freio u").style.height = `${Math.round(a.freio * 100)}%`; }
  if (a && vO.length && q(".ct-dif")) { const d = tempoEm(vE, a.f, passo) - tempoEm(vO, a.f, passo); q(".ct-dif").textContent = `${d <= 0 ? "−" : "+"}${Math.abs(d).toFixed(2).replace(".", ",")} s`; q(".ct-dif").className = `ct-dif ${d <= 0 ? "ganha" : "perde"}`; }
  const play = q("[data-ct-play]"); if (play) play.classList.toggle("tocando", vivo.tocando);
}
function ligarVivo() {
  const el = document.querySelector(".ct"); if (!el || !vivo.vE.length) return;
  if (!vivo.raf) { vivo.ultimo = 0; vivo.raf = requestAnimationFrame(quadro); }
  const g = el.querySelector("[data-ct-graf]"); if (!g || g._ligado) return; g._ligado = true;
  const aFracao = (ev) => { const r = g.getBoundingClientRect(), W = vivo.graf.W, px = ((ev.clientX - r.left) / r.width) * W; return Math.max(0, Math.min(1, (px - vivo.graf.e) / (W - vivo.graf.e - vivo.graf.d))); };
  g.addEventListener("pointermove", (ev) => { vivo.mouse = true; vivo.t = tempoEm(vivo.vE, aFracao(ev), vivo.passo); });
  g.addEventListener("pointerleave", () => { vivo.mouse = false; });
}
const CACHE = new Map(); // a chave "ano:gp" → o replay lido (ou null)
const nomeDe = (id, s) => (id === "voce" ? s.nome : s.nomesExtras?.[id] || Pil().PILOTOS.find((p) => p.id === id)?.nome || id);
const sobrenome = (n) => String(n || "").trim().split(/\s+/).at(-1);
const corPneu = (c) => (F()?.PNEUS?.[c]?.cor) || "#999";
const nomePneu = (c) => (F()?.PNEUS?.[c]?.nome) || c || "?";
// o replay em números (a mesma leitura de resultado-analise.js lerReplay): para cada carro, as amostras com a fração, a velocidade, o acelerador e o freio
function ler(R) {
  const bin = atob(R.dados), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  const nc = R.ids.length, C = R.campos, FORA = 65535;
  const carro = (k) => { const out = []; let voltas = 0, ant = null;
    for (let j = 0; j < R.n; j++) { const o = (j * nc + k) * C, f16 = u8[o] | (u8[o + 1] << 8); if (f16 === FORA) { out.push(null); continue; }
      const f = f16 / (FORA - 1); if (ant == null) voltas = f > 0.5 ? -1 : 0; else if (ant - f > 0.5) voltas++; else if (f - ant > 0.5) voltas--; ant = f;
      out.push({ f, prog: voltas + f, kmh: u8[o + 2] * 2, gas: u8[o + 3] / 255, freio: u8[o + 4] / 255, box: !!(u8[o + 5] & 128) }); }
    return out; };
  return { ids: R.ids, passo: R.passo, carro };
}
// as amostras de uma volta (1 = a primeira): as que têm o progresso entre volta − 1 e volta
function daVolta(amostras, volta) { return amostras.filter((x) => x && !x.box && x.prog >= volta - 1 && x.prog < volta); }
// o mapa: o traçado em 100 × 100 (Pistas.pontos, o mesmo de gp-sobre.js) e a posição de cada fração da volta
function tracado(id) {
  const t = root.Pistas?.PISTAS?.[id]; if (!t || !root.Pistas.pontos) return null;
  const pts = root.Pistas.pontos(t, 12), n = pts.length; let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const p of pts) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
  const s = 86 / Math.max(x1 - x0, y1 - y0), ox = (100 - (x1 - x0) * s) / 2, oy = (100 - (y1 - y0) * s) / 2, pt = (p) => [ox + (p.x - x0) * s, oy + (p.y - y0) * s];
  return { d: pts.filter((_, i) => i % 2 === 0).map((p, i) => (i ? "L" : "M") + pt(p).map((v) => v.toFixed(1)).join(" ")).join("") + "Z", em: (f) => pt(pts[Math.floor(((f % 1) + 1) % 1 * n) % n]) };
}
// a cor de 0 (lento, solto) a 1 (rápido, fundo): azul → verde → amarelo → vermelho, como a transmissão
function cor(x) { const t = Math.max(0, Math.min(1, x)), stops = [[0, [46, 110, 230]], [0.35, [40, 190, 120]], [0.65, [250, 200, 40]], [1, [230, 40, 40]]];
  for (let i = 1; i < stops.length; i++) if (t <= stops[i][0]) { const [a, ca] = stops[i - 1], [b, cb] = stops[i], u = (t - a) / (b - a); return `rgb(${ca.map((v, k) => Math.round(v + (cb[k] - v) * u)).join(",")})`; }
  return "rgb(230,40,40)"; }
function mapaHTML(pista, vol, rot) {
  const T = tracado(pista); if (!T) return `<p class="ct-vazio">Sem o traçado desta pista.</p>`;
  if (!vol.length) return `<p class="ct-vazio">O replay deste GP não tem a volta.</p>`;
  const vals = vol.map((x) => (metrica === "vel" ? x.kmh : metrica === "freio" ? x.freio : x.gas)), lo = Math.min(...vals), hi = Math.max(...vals, lo + 1e-6);
  let seg = ""; for (let i = 1; i < vol.length; i++) { const [ax, ay] = T.em(vol[i - 1].f), [bx, by] = T.em(vol[i].f); if (Math.hypot(bx - ax, by - ay) > 12) continue; seg += `<line x1="${ax.toFixed(1)}" y1="${ay.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke="${cor((vals[i] - lo) / (hi - lo))}" style="--i:${i}"/>`; }
  const [lx, ly] = T.em(0), esc = metrica === "vel" ? [`> ${Math.round(hi)} km/h`, `< ${Math.round(lo)} km/h`] : metrica === "freio" ? ["freio no fundo", "sem freio"] : ["acelerador no fundo", "pé fora"];
  return `<div class="ct-mapa"><div class="ct-escala"><small>${esc[0]}</small><i></i><small>${esc[1]}</small></div><svg viewBox="0 0 100 100" aria-label="${h(rot)}"><path d="${T.d}" class="ct-base"/><g class="ct-seg">${seg}</g><circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="1.6" class="ct-largada"/><circle class="ct-carro ou" r="2.4" cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}"/><circle class="ct-carro eu" r="2.8" cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}"/></svg></div>`;
}
// a velocidade ao longo da volta dos dois (a fração da volta no eixo x, em 120 pedaços) e o tempo ganho/perdido em cada pedaço
function comparativoHTML(vEu, vOu, nEu, nOu, passo) {
  if (!vEu.length || !vOu.length) return `<p class="ct-vazio">Sem as duas voltas no replay.</p>`;
  const B = 120, perfil = (vol) => { const b = Array(B).fill(null); for (const x of vol) { const i = Math.min(B - 1, Math.floor(x.f * B)); b[i] = b[i] == null ? x.kmh : (b[i] + x.kmh) / 2; } for (let i = 0; i < B; i++) if (b[i] == null) b[i] = b[(i + B - 1) % B] ?? b.find((v) => v != null); return b; };
  const pE = perfil(vEu), pO = perfil(vOu), lo = Math.min(...pE, ...pO) - 10, hi = Math.max(...pE, ...pO) + 10;
  const W = 720, H = 200, m = { e: 40, d: 10, t: 12, b: 24 }; vivo.graf = { W, e: m.e, d: m.d }; const x = (i) => m.e + (i / (B - 1)) * (W - m.e - m.d), y = (v) => m.t + (1 - (v - lo) / (hi - lo)) * (H - m.t - m.b);
  const pol = (b) => b.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  // o tempo em cada pedaço: o comprimento dele dividido pela velocidade (km/h); o acumulado mostra onde a diferença nasce
  let acum = 0, pior = { d: 0, i: 0 }; const dif = pE.map((v, i) => { const d = 1 / Math.max(40, v) - 1 / Math.max(40, pO[i]); acum += d; if (d > pior.d) pior = { d, i }; return acum; });
  const total = (vEu.length - vOu.length) * passo / 1000, setores = [4 / 12, 8 / 12].map((f) => `<line x1="${x(f * (B - 1)).toFixed(1)}" x2="${x(f * (B - 1)).toFixed(1)}" y1="${m.t}" y2="${H - m.b}" class="ct-setor"/>`).join("");
  const ticks = [0, 1, 2, 3].map((k) => { const v = lo + (hi - lo) * k / 3; return `<text x="${m.e - 6}" y="${y(v) + 4}" text-anchor="end">${Math.round(v)}</text>`; }).join("");
  const rotS = [[2 / 12, "S1"], [6 / 12, "S2"], [10 / 12, "S3"]].map(([f, t]) => `<text x="${x(f * (B - 1)).toFixed(1)}" y="${H - 6}" text-anchor="middle">${t}</text>`).join("");
  return `<div class="ct-comp"><div class="ct-vivo" aria-live="off"><button type="button" class="ct-play" data-ct-play aria-label="Tocar ou pausar a volta"></button><span class="ct-tempo">0:00,0</span><span class="ct-v eu"><i></i><b>—</b> km/h</span><span class="ct-v ou"><i></i><b>—</b> km/h</span><span class="ct-dif">—</span><span class="ct-pedais"><i class="gas"><u></u></i><i class="freio"><u></u></i></span></div>
    <svg viewBox="0 0 ${W} ${H}" class="ct-graf" data-ct-graf>${ticks}${setores}${rotS}<polyline points="${pol(pO)}" class="ct-ou ct-traco"/><polyline points="${pol(pE)}" class="ct-eu ct-traco"/><line class="ct-cursor" x1="${m.e}" x2="${m.e}" y1="${m.t}" y2="${H - m.b}"/>
      <circle cx="${x(pior.i).toFixed(1)}" cy="${y(pE[pior.i]).toFixed(1)}" r="5" class="ct-pior"/><rect class="ct-alvo" x="${m.e}" y="${m.t}" width="${W - m.e - m.d}" height="${H - m.t - m.b}"/></svg>
    <p class="ct-nota"><b class="${total <= 0 ? "ct-ganha" : "ct-perde"}">${total <= 0 ? "−" : "+"}${Math.abs(total).toFixed(2).replace(".", ",")} s</b> na melhor volta contra ${h(nOu)} · onde ${h(nEu)} mais perde: o ponto marcado (${Math.round(pior.i / B * 100)}% da volta)</p></div>`;
}
// o desgaste volta a volta (só os GPs gravados depois de 2026-11-15)
function desgasteHTML(dEu, dOu, nEu, nOu, voltas) {
  const ok = (d) => d && d.d && d.d.some((v) => v != null);
  if (!ok(dEu)) return `<p class="ct-vazio">Este GP foi corrido antes de o desgaste ser gravado. Os próximos já mostram.</p>`;
  const W = 520, H = 190, m = { e: 36, d: 10, t: 10, b: 24 }, n = Math.max(voltas, dEu.d.length, 2), x = (i) => m.e + (i / (n - 1)) * (W - m.e - m.d), y = (v) => m.t + v * (H - m.t - m.b);
  const linha = (d, cls) => { let s2 = "", ant = null; d.d.forEach((v, i) => { if (v == null) { ant = null; return; } s2 += `${ant == null || v < ant - 0.05 ? "M" : "L"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`; ant = v; }); return `<path d="${s2}" class="${cls} ct-traco"/>`; };
  const paradas = (dEu.b || []).map((b) => `<line x1="${x(b.v - 1).toFixed(1)}" x2="${x(b.v - 1).toFixed(1)}" y1="${m.t}" y2="${H - m.b}" class="ct-setor"/>`).join("");
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((v) => `<text x="${m.e - 6}" y="${y(v) + 4}" text-anchor="end">${Math.round((1 - v) * 100)}%</text>`).join(""); // (a vida do pneu: 100% novo, em cima)
  const voltasT = [1, Math.round(n / 2), n].map((v) => `<text x="${x(v - 1).toFixed(1)}" y="${H - 6}" text-anchor="middle">${v}</text>`).join("");
  return `<svg viewBox="0 0 ${W} ${H}" class="ct-graf">${ticks}${voltasT}${paradas}${ok(dOu) ? linha(dOu, "ct-ou") : ""}${linha(dEu, "ct-eu")}</svg><p class="ct-nota">A vida do pneu no fim de cada volta; as linhas finas são as paradas de ${h(nEu)}.</p>`;
}
// a estratégia: os stints de cada um, na largura das voltas
function estrategiaHTML(lista, voltas) {
  const n = Math.max(1, voltas);
  return lista.map(([nome, d]) => {
    if (!d) return "";
    const comp = [d.c0, ...(d.b || []).map((b) => b.c)], cortes = [0, ...(d.b || []).map((b) => b.v), (d.v || []).length || n];
    const blocos = comp.map((c, i) => { const de = cortes[i], ate = cortes[i + 1]; return `<i style="left:${(de / n) * 100}%;width:${Math.max(0, (ate - de) / n) * 100}%;--c:${h(corPneu(c))}" title="${h(nomePneu(c))}: voltas ${de + 1} a ${ate}"><b>${h((nomePneu(c) || "?")[0])}</b></i>`; }).join("");
    return `<div class="ct-estr"><small>${h(nome)}</small><span class="ct-faixa">${blocos}</span></div>`;
  }).join("") + `<div class="ct-estr ct-estr-eixo"><small></small><span><em>1</em><em>${Math.round(n / 2)}</em><em>${n}</em></span></div>`;
}
function html(c, r, a, rival) {
  const s = c.s, eu = a.pilotos.voce, ou = a.pilotos[rival], nEu = sobrenome(s.nome), nOu = sobrenome(nomeDe(rival, s));
  const chave = `${r.ano}:${r.gp}`, R = CACHE.get(chave);
  const mets = [["vel", "Velocidade"], ["freio", "Frenagem"], ["gas", "Aceleração"]];
  let mapa = `<p class="ct-vazio">Carregando o replay…</p>`, comp = mapa;
  if (R === null) mapa = comp = `<p class="ct-vazio">Este GP não tem replay salvo (só os GPs do ano atual e do anterior guardam).</p>`;
  else if (R) {
    const kE = R.ids.indexOf("voce"), kO = R.ids.indexOf(rival), aE = kE >= 0 ? R.carro(kE) : [], aO = kO >= 0 ? R.carro(kO) : [];
    const vE = daVolta(aE, eu?.mv || 1), vO = ou ? daVolta(aO, ou.mv || 1) : [];
    vivo.vE = vE; vivo.vO = vO; vivo.passo = R.passo; vivo.T = tracado(r.pista);
    mapa = mapaHTML(r.pista, vE, `A sua melhor volta (volta ${eu?.mv || 1})`); comp = comparativoHTML(vE, vO, nEu, nOu, R.passo);
  }
  return `<div class="ct" data-ct-chave="${h(chave)}">
    <section class="cx-card ct-card">${U().tituloCard("Mapa da pista", `A sua melhor volta (volta ${eu?.mv || "—"})`)}<div class="ct-mets">${mets.map(([k, t]) => `<button type="button" class="${metrica === k ? "on" : ""}" data-ct-met="${k}">${t}</button>`).join("")}</div>${mapa}</section>
    <section class="cx-card ct-card">${U().tituloCard("Telemetria comparativa", `Velocidade na melhor volta · <span class="ct-leg eu">${h(nEu)}</span> <span class="ct-leg ou">${h(nOu)}</span>`)}${comp}</section>
    <section class="cx-card ct-card">${U().tituloCard("Desgaste dos pneus", `<span class="ct-leg eu">${h(nEu)}</span> <span class="ct-leg ou">${h(nOu)}</span>`)}${desgasteHTML(eu, ou, nEu, nOu, a.voltas)}</section>
    <section class="cx-card ct-card">${U().tituloCard("Estratégia de corrida", "Os stints e as paradas")}${estrategiaHTML([[nEu, eu], [nOu, ou]], a.voltas)}</section>
  </div>`;
}
// depois de desenhar: pede o replay do GP (uma vez) e redesenha quando chegar
function montar(render) {
  const el = document.querySelector(".ct[data-ct-chave]"); if (!el) return;
  ligarVivo();
  const chave = el.dataset.ctChave; if (CACHE.has(chave)) return;
  CACHE.set(chave, undefined);
  const [ano, gp] = chave.split(":").map(Number);
  const pedir = root.SedeGrupo?.ativo ? root.SedeGrupo.replayDoGP(ano, gp) : root.CarreiraReplay ? root.CarreiraReplay(ano, gp) : Promise.resolve(null);
  Promise.resolve(pedir).then((R) => { CACHE.set(chave, R && R.dados ? ler(R) : null); render && render(); }).catch(() => { CACHE.set(chave, null); render && render(); });
}
function clique(b, render) {
  if (b.dataset.ctMet) { metrica = b.dataset.ctMet; render(); return true; }
  if (b.hasAttribute("data-ct-play")) { vivo.tocando = !vivo.tocando; return true; }
  return false;
}
root.CentralTelemetria = { html, montar, clique };
})(window);
