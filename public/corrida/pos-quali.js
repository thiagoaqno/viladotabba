// Corrida da Galera — a tela das pausas da classificação (regras de F1), no estilo do "Qualifying result" da transmissão (o Thiago, 2026-11-14):
//  - o RESULTADO: depois do Q1 e do Q2, a tabela com quem passou e quem caiu; no fim, os 3 primeiros em cartões grandes (a foto do piloto, de
//    temporada/fotos-noticias.js; sem foto, o logo grande da equipe) e a tabela com os tempos do Q1, do Q2 e do Q3;
//  - os AJUSTES DO CARRO (o botão no rodapé): o acerto (asa e altura, o painel de acerto.js), os pontos do carro na carreira (F1Garagem) e, antes
//    da corrida, o pneu da largada; o botão "Largar" confirma (o servidor abre a próxima sessão, ou a corrida, quando todos confirmam; se
//    alguém sumir, abre sozinho no fim da pausa: corrida-f1-classificacao.js, PAUSA_MAX_MS).
// hud.js chama `renderQuali` a cada estado; a tela só é refeita quando muda o que ela mostra (o relógio da pausa anda à parte).
import { E, PISTAS, $, h, me, act, sNow } from "./estado.js";
import { alternarAcerto } from "./acerto.js";

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
  return `<table class="pq-tab"><thead><tr><th></th><th></th><th>Piloto</th>${cab}</tr></thead><tbody>${linhas.map((r, i) => {
    const p = P(r.id), eq = eqDe(p), tt = T[r.id] || [];
    return `<tr class="${r.fora ? "fora" : ""} ${m && r.id === m.id ? "eu" : ""} ${i === 9 && linhas.length > 10 ? "corte" : ""}" style="--c:${corOk(eq ? eq.cor : p && p.color)};--j:${i}"><td class="p">${i + 1}</td><td class="l">${logo(p)}</td><td class="n"><b>${h(sobrenome(p).toUpperCase())}</b>${p && !p.bot ? `<small>${h(p.name)}</small>` : ""}</td>
      ${Array.from({ length: n }, (_, k) => { const t = tt[k]; return `<td class="t ${t != null && t === melhor[k] ? "melhor" : ""}">${t == null ? (k < n && q.fechadas[k].ordem.some((x) => x.id === r.id) ? "sem tempo" : "—") : tempo3(t)}</td>`; }).join("")}</tr>`;
  }).join("")}</tbody></table>`;
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

export function renderQuali() {
  const el = $("quali"), S = E.S, q = S && S.phase === "quali" && S.quali;
  if (!q || !q.pausa || !q.fechadas.length || q.carregando) { el.classList.add("hidden"); chaveHtml = ""; relogioAtual = null; return; }
  const m = me(), f = q.fechadas[q.fechadas.length - 1], ultima = !!q.grid, T = temposPorSessao(q);
  if (ultima && m && window.Radio) { const i = q.grid.indexOf(m.id); if (i >= 0) window.Radio.uma("quali:" + S.startAt, () => window.Radio.classificacao(i + 1, q.grid.length)); }
  const sessao = `${S.startAt}:${q.fechadas.length}`; if (chaveVista !== sessao) { chaveVista = sessao; vista = "resultado"; }
  const linhas = ultima ? q.grid.map((id) => ({ id, fora: false })) : f.ordem.map((x) => ({ id: x.id, fora: f.eliminados.includes(x.id) }));
  const precisa = !!m && q.aguardados.includes(m.id), confirmado = !!m && q.confirmados.includes(m.id), prontos = q.aguardados.filter((id) => q.confirmados.includes(id)).length;
  const montagem = S.temporada && S.montagens && m && S.montagens[m.equipe];
  const chave = JSON.stringify([sessao, vista, q.confirmados, q.aguardados, m && m.pneu, montagem, linhas.length]);
  el.classList.remove("hidden");
  // o relógio da pausa (só entre as sessões: antes da corrida, a largada espera todos), andando a cada segundo
  const relogio = () => { const r = el.querySelector("[data-pq-relogio]"); if (r) r.textContent = !ultima && q.pausaAte ? `· abre sozinho em ${mmss(q.pausaAte - sNow())}` : ""; };
  relogioAtual = relogio; if (!timer) timer = setInterval(() => { if (relogioAtual && !el.classList.contains("hidden")) relogioAtual(); }, 1000);
  if (chave === chaveHtml) return relogio();
  chaveHtml = chave;
  const pista = PISTAS[S.config.pista], titulo = ultima ? "Resultado da classificação" : `${f.nome} encerrado`;
  const proximo = ultima ? "Ir para a largada" : `Largar para o Q${q.fechadas.length + 1}`;
  const esquerda = ultima ? `<div class="pq-podio">${[1, 0, 2].filter((i) => q.grid[i]).map((i) => cartao(q.grid[i], i, T, q)).join("")}</div>` : `<div class="pq-aviso"><b>${f.eliminados.length} ${f.eliminados.length === 1 ? "piloto ficou" : "pilotos ficaram"} pelo caminho</b><span>Os eliminados largam do fim do grid, na ordem do tempo. Os outros seguem para o Q${q.fechadas.length + 1}.</span></div>`;
  const corpo = vista === "ajustes" && m ? ajustesHTML(q, S, m, confirmado, ultima)
    : `<div class="pq-meio ${ultima ? "final" : ""}">${esquerda}<section class="pq-classif"><h3>${ultima ? "Classificação · grid de largada" : `Classificação · ${f.nome}`}</h3>${tabela(q, T, linhas, m)}</section></div>`;
  el.innerHTML = `<div class="pq">
    <header class="pq-topo"><span class="pq-marca">${IC.bandeira}</span><h2>${h(titulo)}</h2><span class="pq-gp">${h(pista ? pista.name : "")}</span></header>
    ${corpo}
    <footer class="pq-pe">
      <span class="pq-pe-gp"><small>Circuito</small><b>${h(pista ? pista.name : "")}</b></span>
      <span class="pq-pe-estado">${ultima ? "Classificação concluída" : `${h(f.nome)} concluído`}${precisa || !m ? ` · <em>${prontos}/${q.aguardados.length} prontos</em>` : ""} <small data-pq-relogio></small></span>
      ${m ? (vista === "ajustes" ? `<button type="button" class="pq-bt ghost" data-pq-vista="resultado">${IC.voltar}Resultado</button>` : `<button type="button" class="pq-bt ghost" data-pq-vista="ajustes">${IC.ajustes}Ajustes do carro</button>`) : ""}
      ${precisa ? `<button type="button" class="pq-bt primario" id="confirmarLargada" ${confirmado ? "disabled" : ""}>${confirmado ? "Pronto: esperando os outros" : h(proximo)}</button>` : m ? `<span class="pq-espera">Você assiste: ${ultima ? "a largada" : `o Q${q.fechadas.length + 1}`} abre quando os outros estiverem prontos</span>` : ""}
    </footer></div>`;
  relogio();
  el.querySelectorAll("[data-pq-vista]").forEach((b) => { b.onclick = () => { vista = b.dataset.pqVista; chaveHtml = ""; renderQuali(); }; });
  el.querySelector("[data-pq-acerto]")?.addEventListener("click", () => alternarAcerto(true));
  const conf = el.querySelector("#confirmarLargada"); if (conf && !confirmado) conf.onclick = () => act("confirmarLargada");
  if (ultima && m && !confirmado) el.querySelectorAll("[data-pneu-largada]").forEach((b) => { b.onclick = () => act("pneu", { pneu: b.dataset.pneuLargada }); });
  if (montagem && !confirmado) el.querySelectorAll("[data-ponto], [data-ponto-zerar]").forEach((b) => { b.onclick = () => { const nova = window.F1Garagem.cliquePonto(b, montagem, m.equipe, S.bonusMontagem[m.equipe] || 0); if (nova) act("montagemGrid", { montagem: nova }); }; });
}
