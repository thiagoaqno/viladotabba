// Corrida da Galera — as abas novas da Análise da Central (central-analise.js chama): a Visão geral (o vencedor, a volta mais rápida e o melhor
// de cada setor; o mapa da corrida em 3D; o resultado final; o desempenho por setor; as estratégias; os destaques e as informações da corrida),
// os quadros por setor do Desempenho e a tabela de pneus. Tudo sai do resumo do GP no save (corrida-analise.js: tempos, setores, paradas,
// posições, safety car, ultrapassagens): nenhum número inventado (nada de temperatura nem de distância em km, que o jogo não mede).
(function (root) {
const U = () => root.CentralUI, h = (v) => U().h(v), Pil = () => root.F1Pilotos, F = () => root.F1Regras;
const tempo = (s) => (s == null ? "—" : `${Math.floor(s / 60)}:${(s % 60).toFixed(3).padStart(6, "0")}`);
const tempoLongo = (s) => { if (s == null) return "—"; const m = Math.floor(s / 60), hh = Math.floor(m / 60); return hh ? `${hh}:${String(m % 60).padStart(2, "0")}:${(s % 60).toFixed(3).padStart(6, "0")}` : tempo(s); };
const nomeDe = (id, s) => (id === "voce" ? s.nome : s.nomesExtras?.[id] || Pil().PILOTOS.find((p) => p.id === id)?.nome || id);
// "Lewis Hamilton" → "L. Hamilton" (como na transmissão)
const curto = (n) => { const p = String(n || "").trim().split(/\s+/); return p.length > 1 ? `${p[0][0]}. ${p.slice(1).join(" ")}` : p[0] || "?"; };
const logo = (eq, cls = "cx-ag-logo") => (eq ? U().marca(eq, cls) : `<i class="${cls} vazio"></i>`);
const LETRA = { macio: "S", medio: "M", duro: "H", chuva: "W", intermediario: "I" };
const corPneu = (c) => F()?.PNEUS?.[c]?.cor || "#888";
const nomePneu = (c) => F()?.PNEUS?.[c]?.nome || c;
const svg = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const IC = {
  taca: svg('<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5a3.5 3.5 0 0 1-3.5 3.5M12 14v4M8.5 21h7M10 18h4"/>'),
  crono: svg('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9.5 2.5h5M12 2.5V5"/>'),
  setor: svg('<path d="M4 18a8 8 0 0 1 16 0"/><path d="M12 18l4-6"/><circle cx="12" cy="18" r="1.2" fill="currentColor"/>'),
  barras: svg('<path d="M5 20V12M10 20V6M15 20v-9M20 20V9"/>'),
  estrategia: svg('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.2"/><path d="M12 4v2M12 18v2M4 12h2M18 12h2"/>'),
  destaque: svg('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>'),
  info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>'),
  voltas: svg('<path d="M4 12a8 8 0 1 0 2.3-5.7"/><path d="M4 4v4h4"/>'),
  parada: svg('<path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L4 16.8 7.2 20l5.3-5.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>'),
  ultra: svg('<path d="M4 17h9M4 12h13M4 7h9"/><path d="m15 4 4 3-4 3M17 14l3 3-3 3"/>'),
  sobe: svg('<path d="M12 19V5M6 11l6-6 6 6"/>'),
  desce: svg('<path d="M12 5v14M6 13l6 6 6-6"/>'),
  sc: svg('<rect x="3" y="9" width="18" height="7" rx="2"/><path d="M6 9l2-3h8l2 3M7 16v2M17 16v2"/>'),
  bandeira: svg('<path d="M5 21V4"/><path d="M5 4h12l-2.5 4L17 12H5"/>'),
  sol: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19"/>'),
  chuva: svg('<path d="M7 15a4 4 0 0 1 0-8 5.5 5.5 0 0 1 10.5 1.5A3.5 3.5 0 0 1 17 15z"/><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3"/>'),
  seta: svg('<path d="m9 5 7 7-7 7"/>'),
};
const card = (cls, ic, titulo, corpo, extra = "", i = 0) => `<section class="cx-ag-card ${cls}" style="--i:${i}"><header>${ic}<h3>${titulo}</h3>${extra}</header>${corpo}</section>`;

// os números do GP, contados uma vez: quem venceu, a volta mais rápida, o melhor de cada setor, os tempos finais
function dados(c, r, a) {
  const s = c.s, P = a.pilotos, linhas = r.linhas.slice().sort((x, y) => x.pos - y.pos);
  const quem = (id) => { const l = linhas.find((x) => x.piloto === id); return { id, eq: l?.equipe, nome: nomeDe(id, s), curto: curto(nomeDe(id, s)) }; };
  const venc = linhas[0] ? quem(linhas[0].piloto) : null;
  let rapida = null; for (const [id, d] of Object.entries(P)) (d.v || []).forEach((t, i) => { if (!rapida || t < rapida.t) rapida = { ...quem(id), t, volta: i + 1 }; });
  const setores = [0, 1, 2].map((k) => { let m = null; for (const [id, d] of Object.entries(P)) for (const x of d.sv || []) if (x && (!m || x[k] < m.t)) m = { ...quem(id), t: x[k] }; return m; });
  const melhorSetorDe = (id, k) => { const l = (P[id]?.sv || []).filter(Boolean).map((x) => x[k]); return l.length ? Math.min(...l) : null; };
  return { s, P, linhas, quem, venc, rapida, setores, melhorSetorDe, voltasV: venc ? (P[venc.id]?.v || []).length : a.voltas, tV: venc ? P[venc.id]?.t : null };
}
// a diferença para o vencedor: tempo, voltas a menos, abandono
function diferenca(D, l) {
  const d = D.P[l.piloto]; if (l.dnf) return "Abandono"; if (l.nc) return "NC"; if (!d) return "—";
  if (l.pos === 1) return tempoLongo(D.tV);
  const falta = D.voltasV - (d.v || []).length; if (falta > 0) return `+${falta} volta${falta > 1 ? "s" : ""}`;
  return d.t != null && D.tV != null ? `+${(d.t - D.tV).toFixed(3)}` : "—";
}

// ---------- a Visão geral ----------
function visaoGeral(c, r, a, mapa, verTodos) {
  const D = dados(c, r, a), U0 = U();
  // a faixa de cima: o vencedor, a volta mais rápida e o melhor de cada setor
  const faixa = `<section class="cx-ag-faixa" style="--i:0">
    <div class="cx-ag-f-item">${IC.taca}${D.venc ? logo(D.venc.eq) : ""}<div><small>Vencedor da corrida</small><b>${h(D.venc?.curto || "—")}</b></div></div>
    <div class="cx-ag-f-item">${IC.crono}${D.rapida ? logo(D.rapida.eq) : ""}<div><small>Volta mais rápida</small><b>${h(D.rapida?.curto || "—")}</b></div><strong>${tempo(D.rapida?.t)}</strong>${D.rapida ? `<em>volta ${D.rapida.volta}</em>` : ""}</div>
    <div class="cx-ag-f-setores"><small>Melhor setor</small><div>${D.setores.map((x, k) => `<span title="${x ? h(x.nome) : ""}"><i>S${k + 1}</i>${x ? logo(x.eq) : ""}<b>${x ? x.t.toFixed(3) : "—"}</b></span>`).join("")}</div></div></section>`;
  // o resultado final (os 5 primeiros; "Ver todos" abre o grid inteiro)
  const lista = verTodos ? D.linhas : D.linhas.slice(0, 5);
  const resultado = card("cx-ag-res", IC.barras, "Resultado final", `<ol class="cx-ag-res-l">${lista.map((l, i) => `<li class="${l.piloto === "voce" ? "eu" : ""} ${l.pos === 1 ? "p1" : ""}" style="--j:${i}"><span class="p">${l.dnf || l.nc ? "—" : l.pos}</span>${logo(l.equipe)}<b>${h(curto(nomeDe(l.piloto, D.s)))}</b><span class="t">${diferenca(D, l)}</span><span class="pts">${l.pontos ? `${l.pontos} pts` : ""}</span></li>`).join("")}</ol>`,
    `<button type="button" class="cx-ag-link" data-cx-ag-todos>${verTodos ? "Só os 5 primeiros" : "Ver todos"} ${IC.seta}</button>`, 2);
  // o desempenho por setor: o melhor tempo de cada um
  const setor = card("cx-ag-set", IC.setor, "Desempenho por setor", `<div class="cx-ag-set-l">${D.setores.map((x, k) => `<div><small>S${k + 1}</small><b>${x ? x.t.toFixed(3) : "—"}</b><span>${x ? logo(x.eq) : ""}${h(x?.curto || "")}</span></div>`).join("")}</div>`, "", 3);
  // as estratégias: quantas paradas fez quem terminou, a parte do grid em cada uma e o melhor colocado delas
  const fins = D.linhas.filter((l) => !l.dnf && !l.nc && D.P[l.piloto]), grupos = {};
  for (const l of fins) { const n = (D.P[l.piloto].b || []).length; (grupos[n] ||= []).push(l); }
  const estr = Object.entries(grupos).sort((x, y) => y[1].length - x[1].length).slice(0, 3).map(([n, ls]) => { const pct = Math.round((ls.length / Math.max(1, fins.length)) * 100), m = ls[0], eq = Pil().EQUIPES[m.equipe];
    const comp = [(D.P[m.piloto].c0), ...(D.P[m.piloto].b || []).map((b) => b.c)].filter(Boolean);
    return `<li><span class="cx-ag-pneus">${comp.map((cp) => `<i style="--c:${h(corPneu(cp))}" title="${h(nomePneu(cp))}">${LETRA[cp] || "?"}</i>`).join("")}</span><div><b>${n === "0" ? "Sem parada" : `${n} parada${n > 1 ? "s" : ""}`}</b><small>${h(curto(nomeDe(m.piloto, D.s)))}${eq ? ` (${h(eq.sigla)})` : ""} · ${m.pos}º</small></div><span class="cx-ag-barra"><u style="--p:${pct}%"></u></span><strong>${pct}%</strong></li>`; }).join("");
  const estrategias = card("cx-ag-estr", IC.estrategia, "Estratégias em destaque", `<ul class="cx-ag-estr-l">${estr || "<li>Sem dados de paradas.</li>"}</ul>`, "", 4);
  // os destaques: o vencedor, a volta mais rápida, quem mais ganhou e quem mais perdeu posições, as ultrapassagens
  const mov = D.linhas.filter((l) => !l.dnf && !l.nc && D.P[l.piloto]?.g > 0).map((l) => ({ l, d: D.P[l.piloto].g - l.pos }));
  const ganho = mov.slice().sort((x, y) => y.d - x.d)[0], queda = mov.slice().sort((x, y) => x.d - y.d)[0];
  const ult = a.ultrapassagens || [], porQuem = {}; for (const u of ult) porQuem[u.a] = (porQuem[u.a] || 0) + 1;
  const rei = Object.entries(porQuem).sort((x, y) => y[1] - x[1])[0];
  const item = (eq, titulo, quem, sub) => `<li>${eq !== undefined ? logo(eq) : ""}<div><small>${titulo}</small><b>${h(quem)}</b>${sub ? `<em>${sub}</em>` : ""}</div></li>`;
  const destaques = card("cx-ag-dest", IC.destaque, "Destaques da corrida", `<ul class="cx-ag-dest-l">
      ${D.venc ? item(D.venc.eq, "Vencedor", D.venc.curto, `Venceu o ${h(U0.nomeGP(r.pista, c.s.calendario[r.gp]?.nome))}`) : ""}
      ${D.rapida ? item(D.rapida.eq, "Volta mais rápida", D.rapida.curto, `${tempo(D.rapida.t)} (volta ${D.rapida.volta})`) : ""}
      ${ganho && ganho.d > 0 ? item(ganho.l.equipe, "Maior ganho de posições", curto(nomeDe(ganho.l.piloto, D.s)), `+${ganho.d} posiç${ganho.d > 1 ? "ões" : "ão"} (${D.P[ganho.l.piloto].g}º → ${ganho.l.pos}º)`) : ""}
      ${queda && queda.d < 0 ? item(queda.l.equipe, "Maior queda de posições", curto(nomeDe(queda.l.piloto, D.s)), `${queda.d} posiç${queda.d < -1 ? "ões" : "ão"} (${D.P[queda.l.piloto].g}º → ${queda.l.pos}º)`) : ""}
      ${item(rei ? D.quem(rei[0]).eq : undefined, "Ultrapassagens", `${ult.length}`, rei ? `${h(D.quem(rei[0]).curto)} fez ${rei[1]}` : ult.length ? "" : "nenhuma gravada nesta corrida")}</ul>`, "", 5);
  // as informações da corrida (só o que o jogo mede)
  const paradas = Object.values(D.P).reduce((m, d) => m + (d.b || []).length, 0);
  const info = (ic, rot, val) => `<li>${ic}<span>${rot}</span><b>${val}</b></li>`;
  const infos = card("cx-ag-info", IC.info, "Informações da corrida", `<ul class="cx-ag-info-l">
      ${info(IC.crono, "Tempo de corrida", tempoLongo(D.tV))}${info(IC.voltas, "Voltas", a.voltas)}${info(IC.parada, "Paradas nos boxes", paradas)}${info(IC.ultra, "Ultrapassagens", ult.length)}
      ${info(IC.sc, "Safety car", a.safeties || 0)}${info(IC.bandeira, "Bandeiras amarelas", a.amarelas || 0)}${info(a.chuva ? IC.chuva : IC.sol, "Condições", a.chuva ? "Com chuva" : "Pista seca")}</ul>`, "", 6);
  return `<div class="cx-ag">${faixa}<div class="cx-ag-meio"><div class="cx-ag-mapa" style="--i:1">${mapa}</div>${resultado}</div><div class="cx-ag-baixo">${setor}${estrategias}${destaques}${infos}</div></div>`;
}

// ---------- o Desempenho por setor: cada setor com o melhor e os 5 primeiros, em barras ----------
function quadrosSetor(c, r, a) {
  const D = dados(c, r, a);
  const quadros = [0, 1, 2].map((k) => {
    const lista = D.linhas.map((l) => ({ l, t: D.melhorSetorDe(l.piloto, k) })).filter((x) => x.t != null).sort((x, y) => x.t - y.t);
    if (!lista.length) return `<div class="cx-ag-q"><header><i>S${k + 1}</i></header><p>Sem tempos.</p></div>`;
    const top = lista[0], pior = lista[Math.min(lista.length - 1, 4)].t, faixaT = Math.max(0.05, pior - top.t);
    return `<div class="cx-ag-q" style="--i:${k}"><header><i>S${k + 1}</i>${logo(top.l.equipe, "cx-ag-logo g")}<div><b>${h(curto(nomeDe(top.l.piloto, D.s)))}</b><strong>${top.t.toFixed(3)}</strong></div></header>
      <ol>${lista.slice(0, 5).map((x, i) => { const cor = Pil().EQUIPES[x.l.equipe]?.cor || "#888"; return `<li class="${x.l.piloto === "voce" ? "eu" : ""}" style="--j:${i}">${logo(x.l.equipe)}<span>${h(curto(nomeDe(x.l.piloto, D.s)))}</span><u style="--c:${h(cor)};--p:${Math.max(8, 100 - ((x.t - top.t) / faixaT) * 70)}%"></u><b>${i ? `+${(x.t - top.t).toFixed(3)}` : x.t.toFixed(3)}</b></li>`; }).join("")}</ol></div>`;
  }).join("");
  return `<section class="cx-ag-card cx-ag-quadros" style="--i:0"><header>${IC.setor}<h3>Desempenho por setor</h3><small>O melhor tempo de cada piloto em cada setor</small></header><div class="cx-ag-q3">${quadros}</div></section>`;
}

// ---------- os Pneus: a estratégia de cada piloto, com filtro por equipe ----------
function pneusTabela(c, r, a, filtroEq) {
  const D = dados(c, r, a), eqs = [...new Set(D.linhas.map((l) => l.equipe).filter(Boolean))];
  const abas = `<div class="cx-ag-abas" role="tablist"><button type="button" role="tab" data-cx-ag-eq="" class="${!filtroEq ? "on" : ""}" aria-selected="${!filtroEq}">Todos</button>${eqs.map((e) => `<button type="button" role="tab" data-cx-ag-eq="${h(e)}" class="${filtroEq === e ? "on" : ""}" aria-selected="${filtroEq === e}">${logo(e)}${h(Pil().EQUIPES[e]?.nome || e)}</button>`).join("")}</div>`;
  const linhas = D.linhas.filter((l) => !filtroEq || l.equipe === filtroEq).map((l, i) => {
    const d = D.P[l.piloto]; if (!d) return "";
    const fim = (d.v || []).length || a.voltas, st = []; let de = 1, cp = d.c0;
    for (const b of d.b || []) { st.push({ c: cp, de, ate: Math.max(de, b.v) }); de = b.v + 1; cp = b.c; }
    st.push({ c: cp, de, ate: fim });
    return `<tr class="${l.piloto === "voce" ? "eu" : ""}" style="--j:${i}"><td class="p">${l.dnf || l.nc ? "—" : l.pos}</td><td class="n">${logo(l.equipe)}<b>${h(curto(nomeDe(l.piloto, D.s)))}</b></td>
      <td class="pn"><span class="cx-ag-pneus">${st.map((x) => `<i style="--c:${h(corPneu(x.c))}" title="${h(nomePneu(x.c))} · voltas ${x.de} a ${x.ate} (${x.ate - x.de + 1})">${LETRA[x.c] || "?"}</i>`).join("")}</span></td>
      <td class="pit">${(d.b || []).length}</td><td class="v">${(d.b || []).length ? d.b.map((b) => b.v).join(" / ") : "—"}</td><td class="tp">${(d.b || []).length ? d.b.map((b) => (b.t != null ? `${b.t} s` : "—")).join(" / ") : ""}</td></tr>`;
  }).join("");
  return `<section class="cx-ag-card cx-ag-pneus-t" style="--i:0"><header>${IC.estrategia}<h3>Estratégia de pneus</h3><small>Passe o mouse nos pneus: o composto e as voltas de cada jogo</small></header>${abas}
    <div class="cx-t-rolo"><table><thead><tr><th>Pos.</th><th>Piloto</th><th>Pneus</th><th>Paradas</th><th>Volta(s)</th><th>Tempo no box</th></tr></thead><tbody>${linhas}</tbody></table></div></section>`;
}

root.CentralAnaliseGeral = { visaoGeral, quadrosSetor, pneusTabela };
})(window);
