// Corrida da Galera — a aba PADDOCK da Central da carreira solo (2026-11-15): a temporada "viva", em vez de mais um painel de números.
//  - o fim de semana do GP em quatro passos (sexta, sábado, domingo, pós-corrida), com o passo de agora aceso;
//  - "Acontecendo agora": os acontecimentos deste GP (paddock.js), cada um com as opções e o que elas mexem; a escolha vai para o servidor
//    (o evento "paddock") e o efeito aparece no mural;
//  - o humor da equipe (moral e lealdade do companheiro, patrocinador, torcida, diretoria), com o que cada um faz no jogo;
//  - os dois pilotos lado a lado, com o que foi medido na temporada (a consistência das voltas e as ultrapassagens, da análise de cada GP);
//  - as notícias do paddock, tiradas dos números de verdade (as equipes que levaram peça nova, a previsão do próximo GP, o líder);
//  - o mural do que aconteceu e o histórico da equipe (as temporadas, as vitórias e os pódios, os momentos marcantes).
(function (root) {
"use strict";
const U = () => root.CentralUI, h = (v) => U().h(v), P = () => root.F1Paddock, Reg = () => root.F1Temporada, Pil = () => root.F1Pilotos;
const nomeEq = (id) => (Pil().EQUIPES[id] && Pil().EQUIPES[id].nome) || id;
const nomePil = (id) => (id === "voce" ? "Você" : (Pil().PILOTOS.find((p) => p.id === id) || {}).nome || id);
const num = (v, casas = 1) => String(v.toFixed(casas)).replace(".", ",");
const ICONES = {
  Piloto: '<path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 4-6 8-6s8 2 8 6"/>',
  Patrocinador: '<path d="M4 7h16v10H4zM8 7V5h8v2M4 11h16"/>',
  Imprensa: '<path d="M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2M7 9h7M7 13h7"/>',
  Torcida: '<path d="M7 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM17 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20c0-3 2-5 5-5s5 2 5 5M12 20c0-3 2-5 5-5s5 2 5 5"/>',
  Diretoria: '<path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6"/>',
  Engenheiros: '<path d="M14 7l3-3 3 3-3 3M4 20l9-9M8 4a4 4 0 0 0 5 5l-6 6a2 2 0 0 1-3-3z"/>',
  "Fim de semana": '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
};
const icone = (q) => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONES[q] || ICONES.Diretoria}</svg>`;
// o efeito de uma opção em plaquinhas: "+12 moral", "−3 mi caixa"
const ROT = { moral: "moral", lealdade: "lealdade", patrocinador: "patrocinador", torcida: "torcida", diretoria: "diretoria", caixa: "mi caixa" };
function plaquinhas(ef) {
  return Object.entries(ef || {}).filter(([, v]) => v).map(([k, v]) => `<i class="pd-ef ${v > 0 ? "mais" : "menos"}">${v > 0 ? "+" : "−"}${Math.abs(v)} ${ROT[k] || k}</i>`).join("");
}
// o que foi medido de um piloto no ano: o desvio das voltas limpas (sem a 1ª, sem as de box, sem as 7% mais lentas que a mediana) e as ultrapassagens por GP
function medidas(s, chave) {
  const gps = (s.resultados || []).filter((r) => r.ano === s.ano && r.analise && r.analise.pilotos && r.analise.pilotos[chave]);
  let desvios = [], ultr = 0, nGp = 0;
  for (const r of gps) {
    const a = r.analise.pilotos[chave], box = new Set((a.b || []).map((x) => x.v).concat((a.b || []).map((x) => x.v + 1)));
    const v = (a.v || []).filter((t, i) => i > 0 && !box.has(i + 1) && Number.isFinite(t));
    if (v.length >= 2) {
      const ord = v.slice().sort((x, y) => x - y), med = ord[Math.floor(ord.length / 2)], limpas = v.filter((t) => t <= med * 1.07);
      if (limpas.length >= 2) { const m = limpas.reduce((x, y) => x + y, 0) / limpas.length; desvios.push(Math.sqrt(limpas.reduce((x, y) => x + (y - m) ** 2, 0) / limpas.length)); }
    }
    if (Array.isArray(r.analise.ultrapassagens)) { ultr += r.analise.ultrapassagens.filter((u) => u.a === chave).length; nGp++; }
  }
  return { desvio: desvios.length ? desvios.reduce((x, y) => x + y, 0) / desvios.length : null, ultrapassagens: nGp ? ultr / nGp : null, gps: gps.length };
}
// as notícias de verdade: quem levou peça nova para este GP, a previsão do próximo, o vencedor do último e o líder
function noticias(c) {
  const s = c.s, out = [];
  try {
    if (s.gp > 0 && s.gp < s.tamanho) {
      const agora = Reg().desenvolvimentoRivais({ semente: s.semente, ano: s.ano, gp: s.gp, tamanho: s.tamanho }, [s.equipe]).bonus;
      const antes = Reg().desenvolvimentoRivais({ semente: s.semente, ano: s.ano, gp: s.gp - 1, tamanho: s.tamanho }, [s.equipe]).bonus;
      for (const [eq, b] of Object.entries(agora)) if (b > (antes[eq] || 0)) out.push({ eq, t: `${nomeEq(eq)} leva pacote novo`, x: `A equipe trouxe ${b - (antes[eq] || 0) > 1 ? `${b - (antes[eq] || 0)} melhorias` : "uma melhoria"} para o carro neste GP (agora ${b} no total).` });
    }
  } catch (e) { /* sem as contas da carreira, sem essa notícia */ }
  if (c.prox && c.previsao && root.F1Regras?.descreverPrevisao) {
    const d = root.F1Regras.descreverPrevisao(c.previsao, s.voltas);
    out.push({ t: d.seco ? `Tempo firme: ${c.prox.nome}` : d.pct >= 25 ? `Previsão de chuva: ${c.prox.nome}` : `Pouca chance de chuva: ${c.prox.nome}`, x: d.seco ? "Os meteorologistas não esperam chuva no fim de semana." : `${d.pct}% de chance de chuva: ${d.titulo.toLowerCase()}.${d.quando ? ` ${d.quando}.` : ""}${d.pct >= 25 ? " Os engenheiros recomendam rever o acerto." : ""}` });
  }
  const ultimo = (s.resultados || []).filter((r) => r.ano === s.ano).at(-1);
  if (ultimo) { const v = ultimo.linhas.find((l) => l.pos === 1); if (v) out.push({ eq: v.equipe, t: `${nomePil(v.piloto)} vence ${s.calendario[ultimo.gp] ? `na ${s.calendario[ultimo.gp].nome}` : ""}`.trim(), x: `${v.piloto === "voce" ? "Vitória sua, com" : `${nomeEq(v.equipe)} venceu com`} ${v.pontos} pontos no GP.` }); }
  const lider = c.t && c.t.pilotos && c.t.pilotos[0];
  if (lider && lider.pontos > 0) out.push({ eq: lider.equipe, t: `${lider.id === "voce" ? "Você lidera" : `${lider.nome} lidera`} o campeonato`, x: `${lider.pontos} pontos depois de ${s.resultados.filter((r) => r.ano === s.ano).length} GP${s.resultados.filter((r) => r.ano === s.ano).length === 1 ? "" : "s"}.` });
  return out.slice(0, 5);
}
// o histórico da equipe: cada temporada (posição final, pontos, vitórias, pódios) e os momentos marcantes da carreira
function historico(s) {
  const anos = [...new Set((s.resultados || []).map((r) => r.ano))].sort((a, b) => a - b), linhas = [], momentos = [];
  let primeiraVitoria = null, primeiroPodio = null, melhor = null;
  for (const ano of anos) {
    const rs = s.resultados.filter((r) => r.ano === ano), eu = rs.map((r) => ({ r, l: r.linhas.find((x) => x.piloto === "voce") })).filter((x) => x.l);
    const tb = Reg().tabelas({ ...s, ano }), pos = tb.pilotos.findIndex((p) => p.id === "voce") + 1, eqDoAno = (eu[0] && eu[0].l.equipe) || s.equipe, eqPos = tb.equipes.findIndex((e) => e.id === eqDoAno) + 1;
    const vit = eu.filter((x) => x.l.pos === 1 && !x.l.dnf).length, pod = eu.filter((x) => x.l.pos <= 3 && !x.l.dnf).length, pts = eu.reduce((a, x) => a + (x.l.pontos || 0), 0);
    linhas.push({ ano, gps: rs.length, pos, eqPos, vit, pod, pts, completo: ano < s.ano || s.gp >= s.tamanho });
    for (const x of eu) {
      const onde = `${(s.ano === ano && s.calendario[x.r.gp]) ? s.calendario[x.r.gp].nome : x.r.pista} · ano ${ano}`;
      if (!x.l.dnf && !x.l.nc) {
        if (x.l.pos === 1 && !primeiraVitoria) primeiraVitoria = onde;
        if (x.l.pos <= 3 && !primeiroPodio) primeiroPodio = `${x.l.pos}º · ${onde}`;
        if (!melhor || x.l.pos < melhor.pos) melhor = { pos: x.l.pos, onde };
      }
    }
  }
  if (primeiraVitoria) momentos.push(["Primeira vitória", primeiraVitoria]);
  if (primeiroPodio) momentos.push(["Primeiro pódio", primeiroPodio]);
  if (melhor) momentos.push(["Melhor resultado", `${melhor.pos}º · ${melhor.onde}`]);
  const melhorAno = linhas.filter((l) => l.completo && l.pos).sort((a, b) => a.pos - b.pos)[0];
  if (melhorAno) momentos.push(["Melhor temporada", `${melhorAno.pos}º no campeonato · ano ${melhorAno.ano}`]);
  return { linhas, momentos };
}
function medidor(rot, v, nota, min = 0, max = 100) {
  const pct = ((v - min) / (max - min)) * 100, tom = pct >= 66 ? "bom" : pct <= 33 ? "ruim" : "meio";
  return `<div class="pd-med pd-${tom}"><div class="pd-med-topo"><span>${h(rot)}</span><b>${v > 0 && min < 0 ? "+" : ""}${Math.round(v)}</b></div><div class="pd-barra"><i style="width:${Math.max(2, Math.min(100, pct)).toFixed(0)}%"></i></div><small>${nota}</small></div>`;
}
function html(c) {
  const s = c.s;
  if (!P()) return `<section class="cx-card"><p>O Paddock não carregou. Recarregue a página.</p></section>`;
  const p = P().garantir(s), evs = P().acontecimentos(s), comp = Pil().PILOTOS.find((x) => x.id === s.piloto2) || { nome: "Companheiro", ritmo: 0 };
  const terminou = s.gp >= s.tamanho, ultimo = (s.resultados || []).filter((r) => r.ano === s.ano).at(-1);
  const pendentes = evs.filter((e) => !e.escolha).length;
  // o fim de semana: antes do GP é a sexta (os acontecimentos), com o GP aberto é a corrida; o pós-corrida é o do GP que passou
  const fase = terminou ? 3 : c.ativo ? 2 : 0;
  const passos = [["Sexta", "Reunião técnica e bastidores"], ["Sábado", "Classificação"], ["Domingo", "Corrida"], ["Pós-corrida", ultimo ? "Repercussão do último GP" : "Ainda sem GP"]];
  const fimDeSemana = `<ol class="pd-fds">${passos.map(([d, t], i) => `<li class="${i === fase ? "on" : i < fase ? "feito" : ""}"><b>${d}</b><span>${t}</span></li>`).join("")}</ol>`;
  const cartao = (e) => `<article class="pd-ev ${e.escolha ? "decidido" : ""}"><header><span class="pd-quem">${icone(e.quem)}${h(e.quem)}</span>${e.escolha ? `<em>Decidido</em>` : `<em class="novo">Esperando você</em>`}</header>
      <h4>${h(e.titulo)}</h4><p>${h(e.texto)}</p>
      <div class="pd-opcoes">${e.opcoes.map((o) => `<button type="button" class="pd-op ${e.escolha === o.id ? "on" : ""}" data-pd-ev="${h(e.id)}" data-pd-op="${h(o.id)}" ${e.escolha ? "disabled" : ""}><span>${h(o.rotulo)}</span><span class="pd-efs">${plaquinhas(o.efeito)}</span></button>`).join("")}</div></article>`;
  const agora = terminou ? `<p class="pd-vazio">A temporada terminou. O paddock volta a ferver no próximo ano.</p>` : evs.length ? evs.map(cartao).join("") : `<p class="pd-vazio">Tudo calmo no paddock antes deste GP.</p>`;
  const ritmo = P().ajusteDeRitmo(s);
  const humor = `<div class="pd-humor">
      ${medidor(`Moral · ${comp.nome}`, p.moral, ritmo ? `${ritmo > 0 ? "+" : "−"}${num(Math.abs(ritmo))} de ritmo na corrida` : "ritmo normal na corrida")}
      ${medidor("Lealdade", p.lealdade, p.lealdade < 30 ? "pode procurar outra equipe" : "segue com a equipe")}
      ${medidor("Patrocinador", p.patrocinador, `acima de 80 a verba sobe; abaixo de 20, cai · hoje ${s.patrocinio} mi/GP`)}
      ${medidor("Torcida", p.torcida, p.torcida >= 66 ? "a arquibancada está com vocês" : p.torcida <= 33 ? "a torcida anda desconfiada" : "a torcida acompanha")}
      ${medidor("Diretoria", p.diretoria, `soma na confiança do chefe: ${c.im ? c.im.confianca : "—"}%`, -20, 20)}
    </div>`;
  const eu = medidas(s, "voce"), ele = medidas(s, s.piloto2);
  const duelo = (s.resultados || []).filter((r) => r.ano === s.ano).reduce((a, r) => { const x = r.linhas.find((l) => l.piloto === "voce"), y = r.linhas.find((l) => l.piloto === s.piloto2); if (x && y) { if (x.pos < y.pos) a[0]++; else a[1]++; } return a; }, [0, 0]);
  const linhaMed = (rot, v, fmt) => `<div><small>${h(rot)}</small><b>${v == null ? "—" : fmt(v)}</b></div>`;
  const piloto = (nome, m, extra) => `<article class="pd-piloto"><h4>${h(nome)}</h4><div class="pd-traços">${extra}${linhaMed("Consistência (desvio das voltas)", m.desvio, (v) => `±${num(v, 2)} s`)}${linhaMed("Ultrapassagens por GP", m.ultrapassagens, (v) => num(v))}</div><small>${m.gps ? `${m.gps} GP${m.gps === 1 ? "" : "s"} medido${m.gps === 1 ? "" : "s"} neste ano` : "Ainda sem GP medido neste ano"}</small></article>`;
  const pilotos = `<div class="pd-pilotos">${piloto(s.nome || "Você", eu, "")}<div class="pd-duelo"><small>Duelo interno</small><b>${duelo[0]} × ${duelo[1]}</b><small>quem chegou na frente</small></div>${piloto(comp.nome, ele, `<div><small>Ritmo</small><b>${comp.ritmo}${ritmo ? ` <i class="${ritmo > 0 ? "mais" : "menos"}">${ritmo > 0 ? "+" : "−"}${num(Math.abs(ritmo))}</i>` : ""}</b></div>`)}</div>`;
  const nts = noticias(c), news = nts.length ? nts.map((n) => `<article class="pd-noticia">${n.eq ? U().marca(n.eq, "pd-logo") : ""}<div><b>${h(n.t)}</b><p>${h(n.x)}</p></div></article>`).join("") : `<p class="pd-vazio">Sem notícias por enquanto.</p>`;
  const mural = p.mural.slice(-10).reverse().map((m) => `<li><span class="pd-quem">${icone(m.tipo)}</span><div><small>${h(m.tipo)} · ano ${m.ano}</small><p>${h(m.texto)}</p>${m.efeito ? `<span class="pd-efs">${plaquinhas(m.efeito)}</span>` : ""}</div></li>`).join("");
  const hist = historico(s);
  const historicoHTML = `<div class="pd-hist">${hist.momentos.length ? `<div class="pd-momentos">${hist.momentos.map(([t, x]) => `<div><small>${h(t)}</small><b>${h(x)}</b></div>`).join("")}</div>` : `<p class="pd-vazio">Os momentos marcantes aparecem aqui conforme a equipe vai somando resultados.</p>`}
      ${hist.linhas.length ? `<table class="pd-anos"><thead><tr><th>Ano</th><th>GPs</th><th>Você</th><th>Equipe</th><th>Pontos</th><th>Vitórias</th><th>Pódios</th></tr></thead><tbody>${hist.linhas.map((l) => `<tr><td>${l.ano}${l.completo ? "" : " (em curso)"}</td><td>${l.gps}</td><td>${l.pos}º</td><td>${l.eqPos}º</td><td>${l.pts}</td><td>${l.vit}</td><td>${l.pod}</td></tr>`).join("")}</tbody></table>` : ""}</div>`;
  return `<div class="pd">
    <header class="pd-cab"><div><small class="cx-rot">Paddock · ${h(c.eq.nome)}</small><h2>${terminou ? "Fim de temporada" : `Fim de semana: ${h(c.prox ? c.prox.nome : "")}`}</h2></div>${fimDeSemana}</header>
    <div class="pd-grade">
      <section class="pd-col pd-agora"><h3>Acontecendo agora ${pendentes ? `<i class="pd-n">${pendentes}</i>` : ""}</h3>${agora}</section>
      <section class="pd-col"><h3>O humor da equipe</h3>${humor}</section>
    </div>
    <section class="pd-bloco"><h3>Os pilotos</h3>${pilotos}</section>
    <div class="pd-grade">
      <section class="pd-col"><h3>Central de notícias</h3>${news}</section>
      <section class="pd-col"><h3>Mural</h3>${mural ? `<ol class="pd-mural">${mural}</ol>` : `<p class="pd-vazio">As decisões e o que cada GP mudou na equipe ficam guardados aqui.</p>`}</section>
    </div>
    <section class="pd-bloco"><h3>Histórico da equipe</h3>${historicoHTML}</section>
  </div>`;
}
function clique(b) {
  if (b.dataset.pdEv && b.dataset.pdOp) { const ctx = root.CentralPaddock._ctx; if (ctx && ctx.decidirPaddock) ctx.decidirPaddock(b.dataset.pdEv, b.dataset.pdOp); return true; }
  return false;
}
// quantos acontecimentos esperam decisão (o número na aba)
const pendentes = (s) => { try { return root.F1Paddock && s.gp < s.tamanho ? root.F1Paddock.acontecimentos(JSON.parse(JSON.stringify(s))).filter((e) => !e.escolha).length : 0; } catch { return 0; } };
root.CentralPaddock = { html: (c) => { root.CentralPaddock._ctx = c; return html(c); }, clique, pendentes, _ctx: null };
})(typeof window !== "undefined" ? window : globalThis);
