// Corrida da Galera — a tela das pausas da classificação (regras de F1), no estilo do "Qualifying result" da transmissão (o Thiago, 2026-11-14):
//  - o RESULTADO: depois do Q1 e do Q2, a tabela com quem passou e quem caiu; no fim, os 3 primeiros em cartões grandes (a foto do piloto, de
//    temporada/fotos-noticias.js; sem foto, o logo grande da equipe) e a tabela com os tempos do Q1, do Q2 e do Q3;
//  - os AJUSTES DO CARRO (o botão no rodapé): o acerto (asa e altura, o painel de acerto.js), os pontos do carro na carreira (F1Garagem) e, antes
//    da corrida, o pneu da largada; o botão "Largar" confirma (o servidor abre a próxima sessão, ou a corrida, quando todos confirmam; se
//    alguém sumir, abre sozinho no fim da pausa: corrida-f1-classificacao.js, PAUSA_MAX_MS).
// hud.js chama `renderQuali` a cada estado; a tela só é refeita quando muda o que ela mostra (o relógio da pausa anda à parte).
import { E, PISTAS, $, h, me, act, sNow } from "./estado.js";
import { alternarAcerto } from "./acerto.js";
import { clima } from "./clima.js";

let vista = "resultado", chaveVista = "", chaveHtml = "", relogioAtual = null, timer = 0;
const tempo3 = (s) => (s == null ? "—" : `${Math.floor(s / 60)}:${(s % 60).toFixed(3).padStart(6, "0")}`);
const mmss = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
const P = (id) => E.S && E.S.players.find((p) => p.id === id);
const corOk = (c) => (/^#[0-9a-f]{6}$/i.test(c || "") ? c : "#9aa1ad");
const eqDe = (p) => (p && p.equipe && window.F1Pilotos?.EQUIPES[p.equipe]) || null;
const logo = (p, cls = "pq-logo") => (p && p.equipe ? `<img class="${cls}" src="${h((window.logoF1 || ((i) => "/api/corrida/logo/" + i))(p.equipe))}" alt="" onerror="this.style.visibility='hidden'">` : `<i class="${cls}"></i>`);
const sobrenome = (p) => { const n = String((p && (p.nomeCompleto || p.name)) || "?").trim().split(/\s+/); return n.length > 1 ? n.slice(1).join(" ") : n[0]; };
const primeiro = (p) => { const n = String((p && (p.nomeCompleto || p.name)) || "").trim().split(/\s+/); return n.length > 1 ? n[0] : ""; };
// a foto do piloto real (pelo nome, em F1Pilotos) — o humano não tem: fica o logo grande da equipe
const fotoDe = (p) => { if (!p || !p.bot) return null; const pil = window.F1Pilotos?.PILOTOS.find((x) => x.nome === p.nomeCompleto || x.curto === p.name); const f = pil && window.FotosNoticias?.pilotos?.[pil.id]; return f ? f : null; };
const ORD = ["1º", "2º", "3º"];
const SVG_X = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
const IC = {
  ajustes: `${SVG_X}<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></svg>`,
  voltar: `${SVG_X}<path d="m15 5-7 7 7 7"/></svg>`,
  bandeira: `${SVG_X}<path d="M5 21V4"/><path d="M5 4h13l-2 4 2 4H5"/><path d="M9 4v8M13 4v8M5 8h13" stroke-width="1.2"/></svg>`,
};

// os tempos de cada um em cada sessão (Q1, Q2, Q3)
function temposPorSessao(q) { const t = {}; q.fechadas.forEach((f, i) => { for (const x of f.ordem) (t[x.id] ||= [])[i] = x.tempo; }); return t; }

function cartao(id, i, T, q) {
  const p = P(id), eq = eqDe(p), cor = corOk(eq ? eq.cor : p && p.color), f = fotoDe(p), tt = T[id] || [], meu = tt[tt.length - 1], pole = (T[q.grid[0]] || []).at(-1);
  return `<article class="pq-card p${i + 1}" style="--c:${cor};--i:${i}"><span class="pq-pos">${ORD[i]}</span>
    <div class="pq-foto ${f ? "" : "sem"}" ${f ? `style="--foto:url('${h(f.url)}')"` : ""}>${f ? "" : logo(p, "pq-logo-g")}</div>
    <div class="pq-nome"><small>${h(primeiro(p))}</small><b>${h(sobrenome(p))}</b><em>${h(eq ? eq.nome : "")}</em></div>
    <strong class="pq-tempo">${i === 0 ? tempo3(meu) : meu != null && pole != null ? `+${(meu - pole).toFixed(3)}` : "—"}</strong>${f ? `<small class="pq-cred" title="${h(f.autor)} · ${h(f.licenca)}">Foto: Wikimedia Commons</small>` : ""}</article>`;
}
function tabela(q, T, linhas, m) {
  const n = q.fechadas.length, cab = q.fechadas.map((_, i) => `<th>Q${i + 1}</th>`).join("");
  const melhor = q.fechadas.map((f) => Math.min(...f.ordem.map((x) => x.tempo).filter((t) => t != null)));
  // (2026-11-16, o Thiago: "faltam dados de cada resultado") a diferença para o 1º e para o da frente, na última sessão de cada um, e as voltas
  const ultimaDe = (id) => { const tt = T[id] || []; for (let k = n - 1; k >= 0; k--) if (tt[k] != null) return k; return -1; };
  const voltasDe = (id, k) => (k >= 0 ? (q.fechadas[k].ordem.find((x) => x.id === id) || {}).voltas : null);
  const dif = (v) => (v == null || !Number.isFinite(v) ? "—" : v < 0.0005 ? "" : `+${v.toFixed(3)}`);
  const extra = linhas.map((r, i) => {
    const k = ultimaDe(r.id), t = k >= 0 ? T[r.id][k] : null, ant = i > 0 ? linhas[i - 1] : null, ka = ant ? ultimaDe(ant.id) : -1;
    return { d: t != null ? dif(t - melhor[k]) : "—", i: i === 0 || t == null ? (i === 0 ? "" : "—") : ka === k ? dif(t - T[ant.id][k]) : "—", v: voltasDe(r.id, k) };
  });
  return `<table class="pq-tab"><thead><tr><th></th><th></th><th>Piloto</th>${cab}<th title="Diferença para o primeiro da sessão">Dif.</th><th title="Diferença para o carro da frente">Int.</th><th title="Voltas cronometradas na sessão">Voltas</th></tr></thead><tbody>${linhas.map((r, i) => {
    const p = P(r.id), eq = eqDe(p), tt = T[r.id] || [];
    return `<tr class="${r.fora ? "fora" : ""} ${m && r.id === m.id ? "eu" : ""} ${i === 9 && linhas.length > 10 ? "corte" : ""}" style="--c:${corOk(eq ? eq.cor : p && p.color)};--j:${i}"><td class="p">${i + 1}</td><td class="l">${logo(p)}</td><td class="n"><b>${h(sobrenome(p).toUpperCase())}</b>${p && !p.bot ? `<small>${h(p.name)}</small>` : ""}</td>
      ${Array.from({ length: n }, (_, k) => { const t = tt[k]; return `<td class="t ${t != null && t === melhor[k] ? "melhor" : ""}">${t == null ? (k < n && q.fechadas[k].ordem.some((x) => x.id === r.id) ? "sem tempo" : "—") : tempo3(t)}</td>`; }).join("")}<td class="t dif">${extra[i].d}</td><td class="t dif">${extra[i].i}</td><td class="t">${extra[i].v || "—"}</td></tr>`;
  }).join("")}</tbody></table>`;
}
// o quadro "Sua sessão": a posição, a melhor volta e os 3 setores dela (o melhor setor da sessão em roxo, como na TV), as voltas e a folga
// para o corte (quem passa para o próximo Q). Só para quem correu a sessão.
function minhaSessao(q, m) {
  if (!m) return "";
  let k = -1; for (let i = q.fechadas.length - 1; i >= 0; i--) if (q.fechadas[i].ordem.some((x) => x.id === m.id)) { k = i; break; }
  if (k < 0) return "";
  const f = q.fechadas[k], ordem = f.ordem, pos = ordem.findIndex((x) => x.id === m.id), eu = ordem[pos], com = ordem.filter((x) => x.tempo != null);
  const melhorS = [0, 1, 2].map((j) => Math.min(...ordem.map((x) => (x.setores ? x.setores[j] : Infinity))));
  const setores = eu.setores ? eu.setores.map((v, j) => `<span class="${v <= melhorS[j] ? "roxo" : ""}"><small>S${j + 1}</small><b>${v.toFixed(3)}</b></span>`).join("") : `<span><small>Setores</small><b>—</b></span>`;
  // fora: quanto faltou para o último que passou; passou: a folga sobre o primeiro que caiu
  const passa = ordem.length - f.eliminados.length, fora = f.eliminados.includes(m.id), ref = fora ? ordem[passa - 1] : ordem[passa];
  const folga = f.eliminados.length && passa > 0 && ref && ref.tempo != null && eu.tempo != null
    ? `<span><small>${fora ? "Faltou para passar" : "Folga para o corte"}</small><b>${Math.abs(ref.tempo - eu.tempo).toFixed(3)} s</b></span>` : "";
  const pole = com[0];
  return `<section class="pq-eu"><h4>Sua sessão · ${h(f.nome || `Q${k + 1}`)}</h4><div class="pq-eu-dados">
    <span><small>Posição</small><b>${pos + 1}º de ${ordem.length}</b></span>
    <span><small>Melhor volta</small><b>${tempo3(eu.tempo)}</b></span>
    ${pole && eu.tempo != null && pole.id !== m.id ? `<span><small>Para o 1º</small><b>+${(eu.tempo - pole.tempo).toFixed(3)}</b></span>` : ""}
    <span><small>Voltas</small><b>${eu.voltas || 0}</b></span>${folga}</div>
    <div class="pq-eu-setores">${setores}</div></section>`;
}
function ajustesHTML(q, S, m, confirmado, ultima) {
  const montagem = S.temporada && S.montagens && m && S.montagens[m.equipe];
  const pneus = ultima ? `<section class="pq-aj"><h4>Pneu da largada</h4><div class="pneus-largada" role="group" aria-label="Pneu da largada">${Object.entries(window.F1Regras.PNEUS).map(([id, pneu]) => `<button type="button" data-pneu-largada="${id}" class="${(m.pneu || "medio") === id ? "on" : ""}" ${confirmado ? "disabled" : ""}><i class="bola-pneu" style="--c:${pneu.cor}"></i>${pneu.nome}</button>`).join("")}</div>
      ${S.previsao && window.PrevisaoUI ? `<div class="prev-bloco">${window.PrevisaoUI.html(S.previsao, { voltas: S.config.voltas })}</div>` : ""}</section>`
    : `<section class="pq-aj"><h4>Pneu</h4><p class="pq-nota">Na classificação o pneu é o da pista: o macio no seco, o de chuva com a pista molhada. O da corrida se escolhe aqui depois do último Q.</p></section>`;
  return `<div class="pq-ajustes">
    ${pneus}
    <section class="pq-aj"><h4>Acerto do carro</h4><p class="pq-nota">Asa e altura: mais asa segura nas curvas e perde na reta; mais baixo agarra mais até raspar o assoalho. Vale já na próxima sessão.</p><button type="button" class="pq-bt" data-pq-acerto ${confirmado ? "disabled" : ""}>Abrir o acerto</button></section>
    ${montagem ? `<section class="pq-aj pq-aj-pontos"><h4>Pontos do carro · ${window.F1Equipes.custoDaMontagem(montagem)} usados</h4>${window.F1Garagem.pontosHTML({ equipe: m.equipe, montagem, bonus: S.bonusMontagem[m.equipe] || 0, pode: !confirmado, motivo: "Você já confirmou." })}</section>` : ""}
  </div>`;
}

// ---------- (2026-11-23, o Thiago, com as duas imagens de referência) o fim da classificação em duas telas ----------
// QUALIFYING: o resultado (o top 5 em destaque, o 6º ao 10º mais apagado, o resto embaixo) e o cartão da pole; "Continuar" leva ao RACE DAY: o grid de
// largada (o top 5 e você, com a punição de grid), as condições da corrida (as voltas, a volta de verdade em km, a chance de chuva, a pista seca ou
// molhada), o pneu da largada (com quantas voltas ele dura nesta pista) e "Ir para o grid". Sem temperatura nem combustível: o jogo não tem esses números.
const fundoDoGP = (id) => (window.GpInfo ? window.GpInfo.fundoDe(id) : null);
const nomeCompleto = (p) => `${h(primeiro(p))} <b>${h(sobrenome(p).toUpperCase())}</b>`;
function linhaGrid(id, i, T, pole, m, classe = "") {
  const p = P(id), eq = eqDe(p), t = (T[id] || []).at(-1), eu = m && id === m.id;
  return `<li class="${classe} ${eu ? "eu" : ""}" style="--c:${corOk(eq ? eq.cor : p && p.color)}"><span class="po">${i + 1}</span><i class="barra"></i><span class="pi">${eu ? "<b>Você</b>" : nomeCompleto(p)}</span>
    <span class="eq">${logo(p)}<small>${h(eq ? eq.nome : "")}</small></span><span class="tt">${i === 0 ? tempo3(t) : t != null && pole != null ? `+${(t - pole).toFixed(3)}` : "—"}</span></li>`;
}
function qualifyingHTML(q, T, m, S) {
  const pista = PISTAS[S.config.pista], info = window.GpInfo ? window.GpInfo.get(S.config.pista) : null, pole = (T[q.grid[0]] || []).at(-1), p0 = P(q.grid[0]), eq0 = eqDe(p0), f0 = fotoDe(p0);
  const top = q.grid.slice(0, 5).map((id, i) => linhaGrid(id, i, T, pole, m, "top")).join(""), meio = q.grid.slice(5, 10).map((id, i) => linhaGrid(id, i + 5, T, pole, m, "meio")).join("");
  const resto = q.grid.slice(10).map((id, i) => linhaGrid(id, i + 10, T, pole, m, "resto")).join("");
  return `<div class="qy">
    <header class="qy-topo"><small>QUALIFYING</small><h2>QUALIFYING</h2><em>RESULTADO</em></header>
    <div class="qy-corpo"><section class="qy-tab"><div class="qy-cab"><span>POS</span><span>PILOTO</span><span>EQUIPE</span><span>TEMPO</span></div><ol>${top}</ol><ol class="sub">${meio}</ol>${resto ? `<details class="qy-resto"><summary>Do 11º ao ${q.grid.length}º</summary><ol class="sub" start="11">${resto}</ol></details>` : ""}</section>
      <aside class="qy-pole" style="--c:${corOk(eq0 ? eq0.cor : p0 && p0.color)}">${f0 ? `<div class="qy-foto" style="--foto:url('${h(f0.url)}')"></div>` : `<div class="qy-foto sem">${logo(p0, "pq-logo-g")}</div>`}
        <div class="qy-pole-txt"><small>POLE POSITION</small><span>${h(primeiro(p0))}</span><b>${h(sobrenome(p0).toUpperCase())}</b><em>${h(eq0 ? eq0.nome : "")} ${logo(p0)}</em><strong>${tempo3(pole)}</strong></div></aside></div>
    <footer class="qy-pe"><span class="qy-mapa">${window.GpSobre ? window.GpSobre.mapaSvg(S.config.pista, "qy-mapa-svg") : ""}</span><span class="qy-gp"><b>${h(info && info.gp ? info.gp.replace(/^Grande Prêmio d[aeo]s? /i, "GP de ") : pista ? pista.name : "")}</b><small>${h(info && info.circuito ? info.circuito : "")}</small></span>
      <button type="button" class="qy-bt" data-pq-vista="raceday">CONTINUAR <span>→</span></button></footer></div>`;
}
// (2026-11-23, o Thiago: "você não fez o estilo das telas pós-qualify") a pausa entre as sessões (depois do Q1 e do Q2) no mesmo estilo do QUALIFYING:
// a sessão inteira na tabela (quem caiu apagado, a linha vermelha do corte), o mais rápido da sessão no cartão e "Sua sessão" embaixo dele.
function sessaoHTML(q, T, m, S, f, precisa, confirmado, prontos) {
  const pista = PISTAS[S.config.pista], info = window.GpInfo ? window.GpInfo.get(S.config.pista) : null, k = q.fechadas.length - 1;
  const ordem = f.ordem, pole = ordem[0] && ordem[0].tempo, passam = ordem.length - f.eliminados.length, p0 = P(ordem[0] && ordem[0].id), eq0 = eqDe(p0), f0 = fotoDe(p0);
  const Ts = {}; for (const x of ordem) Ts[x.id] = [x.tempo];
  const linhas = ordem.map((x, i) => linhaGrid(x.id, i, Ts, pole, m, `${i < 5 ? "top" : "meio"} ${f.eliminados.includes(x.id) ? "fora" : ""} ${i === passam - 1 && f.eliminados.length ? "corte" : ""}`)).join("");
  const proximo = `Q${q.fechadas.length + 1}`;
  const botao = precisa ? `<button type="button" class="rd-ir" id="confirmarLargada" ${confirmado ? "disabled" : ""}>${confirmado ? `PRONTO · ${prontos}/${q.aguardados.length}` : `LARGAR PARA O ${proximo}`} <span>→</span></button>`
    : m && !q.aguardados.length ? `<button type="button" class="rd-ir" id="confirmarLargada" ${confirmado ? "disabled" : ""}>PULAR PARA O ${proximo} <span>→</span></button>`
    : m ? `<span class="pq-espera">Você assiste: o ${proximo} abre quando os outros estiverem prontos</span>` : "";
  return `<div class="qy">
    <header class="qy-topo"><small>QUALIFYING · ${h(f.nome || `Q${k + 1}`)}</small><h2>${h(f.nome || `Q${k + 1}`)}</h2><em>RESULTADO</em></header>
    <p class="qy-aviso"><b>${f.eliminados.length} ${f.eliminados.length === 1 ? "piloto ficou" : "pilotos ficaram"} pelo caminho.</b> Os eliminados largam do fim do grid, na ordem do tempo; os ${passam} primeiros seguem para o ${proximo}.</p>
    <div class="qy-corpo"><section class="qy-tab"><div class="qy-cab"><span>POS</span><span>PILOTO</span><span>EQUIPE</span><span>TEMPO</span></div><ol class="qy-sessao">${linhas}</ol></section>
      <div class="qy-lado"><aside class="qy-pole" style="--c:${corOk(eq0 ? eq0.cor : p0 && p0.color)}">${f0 ? `<div class="qy-foto" style="--foto:url('${h(f0.url)}')"></div>` : `<div class="qy-foto sem">${logo(p0, "pq-logo-g")}</div>`}
        <div class="qy-pole-txt"><small>MAIS RÁPIDO · ${h(f.nome || `Q${k + 1}`)}</small><span>${h(primeiro(p0))}</span><b>${h(sobrenome(p0).toUpperCase())}</b><em>${h(eq0 ? eq0.nome : "")} ${logo(p0)}</em><strong>${tempo3(pole)}</strong></div></aside>
        ${minhaSessao(q, m)}</div></div>
    <footer class="qy-pe"><span class="qy-mapa">${window.GpSobre ? window.GpSobre.mapaSvg(S.config.pista, "qy-mapa-svg") : ""}</span><span class="qy-gp"><b>${h(info && info.gp ? info.gp.replace(/^Grande Prêmio d[aeo]s? /i, "GP de ") : pista ? pista.name : "")}</b><small>${h(f.nome)} concluído${precisa || !m ? ` · <em class="pq-pe-estado"><em>${prontos}/${q.aguardados.length} prontos</em></em>` : ""} <span data-pq-relogio></span></small></span>
      ${m ? `<button type="button" class="qy-bt ghost" data-pq-vista="ajustes">Ajustes do carro</button>` : ""}${botao}</footer></div>`;
}
function raceDayHTML(q, T, m, S, confirmado, precisa, prontos) {
  const F = window.F1Regras, pista = PISTAS[S.config.pista], info = window.GpInfo ? window.GpInfo.get(S.config.pista) : null, pole = (T[q.grid[0]] || []).at(-1), voltas = S.config.voltas;
  const meuI = m ? q.grid.indexOf(m.id) : -1, top = q.grid.slice(0, 5).map((id, i) => linhaGrid(id, i, T, pole, m)).join("");
  const eu = meuI >= 5 ? `<li class="sep"></li>${linhaGrid(m.id, meuI, T, pole, m)}` : "";
  const pen = m && m.gpMods && m.gpMods.grid ? `${m.gpMods.grid} posições a menos na largada` : "Sem punições de grid";
  const prev = S.previsao && F && F.descreverPrevisao ? F.descreverPrevisao(S.previsao, voltas) : null, agua = clima && Number.isFinite(clima.agua) ? clima.agua : 0;
  const ader = agua > 0.3 ? "Baixa" : agua > 0.05 ? "Média" : "Alta", fundo = fundoDoGP(S.config.pista), pneuAtual = (m && m.pneu) || "medio";
  const vida = (c) => (F && F.vidaEmVoltas ? F.vidaEmVoltas(c, 1, agua, S.config.pista) : 0);
  const pneus = F ? ["macio", "medio", "duro", "intermediario", "chuva"].map((c) => { const pn = F.PNEUS[c], v = vida(c);
    return `<button type="button" data-pneu-largada="${c}" class="${pneuAtual === c ? "on" : ""}" style="--pn:${pn.cor}" ${confirmado || !m ? "disabled" : ""}><i></i><b>${h(pn.nome)}</b><small>~${v.toFixed(1).replace(".", ",")} voltas</small></button>`; }).join("") : "";
  const vSel = vida(pneuAtual), paradas = vSel > 0 ? Math.max(0, Math.ceil(voltas / vSel) - 1) : 0;
  const botao = precisa || (m && !q.aguardados.length) ? `<button type="button" class="rd-ir" id="confirmarLargada" ${confirmado ? "disabled" : ""}>${confirmado ? `PRONTO · ${prontos}/${q.aguardados.length}` : "IR PARA O GRID"} <span>→</span></button>` : `<span class="pq-espera">A largada abre quando os outros estiverem prontos</span>`;
  return `<div class="rd">
    <header class="rd-topo"><small>${h(info && info.gp ? info.gp.replace(/^Grande Prêmio d[aeo]s? /i, "GP de ").toUpperCase() : "")} <span>›</span> RACE DAY</small><h2>RACE DAY</h2><p>Prepare-se para a corrida</p></header>
    <div class="rd-corpo">
      <div class="rd-esq">
        <section class="rd-card"><h4>GRID DE LARGADA</h4><ol class="rd-grid">${top}${eu}</ol><p class="rd-pen">ⓘ ${h(pen)}</p></section>
        <section class="rd-card"><h4>PNEU DA LARGADA</h4><div class="rd-pneus" role="group" aria-label="Pneu da largada">${pneus}</div>
          <div class="rd-est"><span><small>Com esse pneu</small><b>~${vSel.toFixed(1).replace(".", ",")} voltas até o fim da vida</b></span><span><small>Paradas, só com ele</small><b>${paradas} ${paradas === 1 ? "parada" : "paradas"} em ${voltas} voltas</b></span></div></section>
      </div>
      <aside class="rd-cond">${fundo ? `<div class="rd-foto" style="background-image:url('${h(fundo)}')"></div>` : ""}<div><h3>${h(info && info.gp ? info.gp.replace(/^Grande Prêmio d[aeo]s? /i, "GP de ") : pista ? pista.name : "")}</h3>
        <p>${voltas} voltas${info && info.km ? ` · volta de ${String(info.km).replace(".", ",")} km` : ""}</p></div>
        <div class="rd-cond-l"><span><b>${prev ? `${prev.pct}%` : "—"}</b><small>Chuva${prev && prev.quando ? ` · ${h(prev.quando)}` : ""}</small></span><span><b>${agua > 0.05 ? "Molhada" : "Seca"}</b><small>Pista</small></span><span><b>${ader}</b><small>Aderência</small></span></div></aside>
    </div>
    <footer class="rd-pe"><button type="button" class="qy-bt ghost" data-pq-vista="resultado">← VOLTAR</button>${m ? `<button type="button" class="qy-bt ghost" data-pq-vista="ajustes">Acerto e pontos</button>` : ""}${botao}</footer></div>`;
}

export function renderQuali() {
  const el = $("quali"), S = E.S, q = S && S.phase === "quali" && S.quali;
  if (!q || !q.pausa || !q.fechadas.length || q.carregando) { el.classList.add("hidden"); chaveHtml = ""; relogioAtual = null; return; }
  const m = me(), f = q.fechadas[q.fechadas.length - 1], ultima = !!q.grid, T = temposPorSessao(q);
  if (ultima && m && window.Radio) { const i = q.grid.indexOf(m.id); if (i >= 0) window.Radio.uma("quali:" + S.startAt, () => window.Radio.classificacao(i + 1, q.grid.length)); }
  const sessao = `${S.startAt}:${q.fechadas.length}`; if (chaveVista !== sessao) { chaveVista = sessao; vista = "resultado"; }
  const linhas = ultima ? q.grid.map((id) => ({ id, fora: false })) : f.ordem.map((x) => ({ id: x.id, fora: f.eliminados.includes(x.id) }));
  const precisa = !!m && q.aguardados.includes(m.id), confirmado = !!m && q.confirmados.includes(m.id), prontos = q.aguardados.filter((id) => q.confirmados.includes(id)).length;
  const montagem = S.temporada && S.montagens && m && S.montagens[m.equipe];
  // (2026-11-15) a confirmação de OUTRO jogador só muda o contador (abaixo, sem refazer a tela): refazer tudo atrapalhava quem estava mexendo
  const chave = JSON.stringify([sessao, vista, confirmado, q.aguardados, m && m.pneu, montagem, linhas.length]);
  el.classList.remove("hidden");
  { const f = fundoDoGP(S.config.pista); el.style.setProperty("--pq-fundo", f ? `url('${f}')` : "none"); el.classList.add("pq-tela"); } // (a foto do GP de fundo: a pausa não parece mais a corrida)
  // o relógio da pausa (só entre as sessões: antes da corrida, a largada espera todos), andando a cada segundo
  const relogio = () => { const r = el.querySelector("[data-pq-relogio]"); if (r) r.textContent = !ultima && q.pausaAte ? `· abre sozinho em ${mmss(q.pausaAte - sNow())}` : ""; };
  relogioAtual = relogio; if (!timer) timer = setInterval(() => { if (relogioAtual && !el.classList.contains("hidden")) relogioAtual(); }, 1000);
  if (chave === chaveHtml) { const em = el.querySelector(".pq-pe-estado em"); if (em) em.textContent = `${prontos}/${q.aguardados.length} prontos`; return relogio(); }
  chaveHtml = chave;
  if (ultima && vista !== "ajustes") { // as telas do fim da classificação: Qualifying e Race Day
    el.innerHTML = vista === "raceday" ? raceDayHTML(q, T, m, S, confirmado, precisa, prontos) : qualifyingHTML(q, T, m, S);
    el.querySelectorAll("[data-pq-vista]").forEach((b) => { b.onclick = () => { vista = b.dataset.pqVista; chaveHtml = ""; renderQuali(); }; });
    const conf = el.querySelector("#confirmarLargada"); if (conf && !confirmado) conf.onclick = () => act("confirmarLargada");
    if (m && !confirmado) el.querySelectorAll("[data-pneu-largada]").forEach((b) => { b.onclick = () => act("pneu", { pneu: b.dataset.pneuLargada }); });
    return;
  }
  if (!ultima && vista !== "ajustes") { // a pausa entre as sessões, no mesmo estilo
    el.innerHTML = sessaoHTML(q, T, m, S, f, precisa, confirmado, prontos); relogio();
    el.querySelectorAll("[data-pq-vista]").forEach((b) => { b.onclick = () => { vista = b.dataset.pqVista; chaveHtml = ""; renderQuali(); }; });
    const conf = el.querySelector("#confirmarLargada"); if (conf && !confirmado) conf.onclick = () => act("confirmarLargada");
    return;
  }
  const pista = PISTAS[S.config.pista], titulo = ultima ? "Resultado da classificação" : `${f.nome} encerrado`;
  const proximo = ultima ? "Ir para a largada" : `Largar para o Q${q.fechadas.length + 1}`;
  const esquerda = ultima ? `<div class="pq-podio">${[1, 0, 2].filter((i) => q.grid[i]).map((i) => cartao(q.grid[i], i, T, q)).join("")}</div>` : `<div class="pq-aviso"><b>${f.eliminados.length} ${f.eliminados.length === 1 ? "piloto ficou" : "pilotos ficaram"} pelo caminho</b><span>Os eliminados largam do fim do grid, na ordem do tempo. Os outros seguem para o Q${q.fechadas.length + 1}.</span></div>`;
  const corpo = vista === "ajustes" && m ? ajustesHTML(q, S, m, confirmado, ultima)
    : `<div class="pq-meio ${ultima ? "final" : ""}">${esquerda}<section class="pq-classif"><h3>${ultima ? "Classificação · grid de largada" : `Classificação · ${f.nome}`}</h3>${tabela(q, T, linhas, m)}${minhaSessao(q, m)}</section></div>`;
  el.innerHTML = `<div class="pq">
    <header class="pq-topo"><span class="pq-marca">${IC.bandeira}</span><h2>${h(titulo)}</h2><span class="pq-gp">${h(pista ? pista.name : "")}</span></header>
    ${corpo}
    <footer class="pq-pe">
      <span class="pq-pe-gp"><small>Circuito</small><b>${h(pista ? pista.name : "")}</b></span>
      <span class="pq-pe-estado">${ultima ? "Classificação concluída" : `${h(f.nome)} concluído`}${precisa || !m ? ` · <em>${prontos}/${q.aguardados.length} prontos</em>` : ""} <small data-pq-relogio></small></span>
      ${m ? (vista === "ajustes" ? `<button type="button" class="pq-bt ghost" data-pq-vista="resultado">${IC.voltar}Resultado</button>` : `<button type="button" class="pq-bt ghost" data-pq-vista="ajustes">${IC.ajustes}Ajustes do carro</button>`) : ""}
      ${precisa ? `<button type="button" class="pq-bt primario" id="confirmarLargada" ${confirmado ? "disabled" : ""}>${confirmado ? "Pronto: esperando os outros" : h(proximo)}</button>`
        : m && !q.aguardados.length ? `<button type="button" class="pq-bt primario" id="confirmarLargada" ${confirmado ? "disabled" : ""}>${ultima ? "Ir para a largada" : `Pular para o Q${q.fechadas.length + 1}`}</button>` // (2026-11-15: eliminado e sem ninguém para esperar, não fica 3 min parado; o servidor já segue quando ninguém precisa confirmar)
        : m ? `<span class="pq-espera">Você assiste: ${ultima ? "a largada" : `o Q${q.fechadas.length + 1}`} abre quando os outros estiverem prontos</span>` : ""}
    </footer></div>`;
  relogio();
  el.querySelectorAll("[data-pq-vista]").forEach((b) => { b.onclick = () => { vista = b.dataset.pqVista; chaveHtml = ""; renderQuali(); }; });
  el.querySelector("[data-pq-acerto]")?.addEventListener("click", () => alternarAcerto(true, { sala: true }));
  const conf = el.querySelector("#confirmarLargada"); if (conf && !confirmado) conf.onclick = () => act("confirmarLargada");
  if (ultima && m && !confirmado) el.querySelectorAll("[data-pneu-largada]").forEach((b) => { b.onclick = () => act("pneu", { pneu: b.dataset.pneuLargada }); });
  if (montagem && !confirmado) el.querySelectorAll("[data-ponto], [data-ponto-zerar]").forEach((b) => { b.onclick = () => { const nova = window.F1Garagem.cliquePonto(b, montagem, m.equipe, S.bonusMontagem[m.equipe] || 0); if (nova) act("montagemGrid", { montagem: nova }); }; });
}
