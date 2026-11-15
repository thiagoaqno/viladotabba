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
const U = () => root.CentralUI, h = (v) => U().h(v), P = () => root.F1Paddock, Reg = () => root.F1Temporada, Pil = () => root.F1Pilotos; // (Reg: as regras da carreira)
const nomeEq = (id) => (Pil().EQUIPES[id] && Pil().EQUIPES[id].nome) || id;
const nomePil = (id) => (id === "voce" ? "Você" : (Pil().PILOTOS.find((p) => p.id === id) || {}).nome || id);
const sobrenomeDe = (n) => String(n || "").trim().split(/\s+/).at(-1);
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
// o efeito em texto corrido, colorido por sinal ("+12 moral · −3 mi caixa")
function textoEfeito(ef) { return Object.entries(ef || {}).filter(([, v]) => v).map(([k, v]) => `<span class="${v > 0 ? "mais" : "menos"}">${v > 0 ? "+" : "−"}${Math.abs(v)} ${ROT[k] || k}</span>`).join(" · "); }
// os números da última vez que a tela foi desenhada: o que mudou anima (a barra anda do valor antigo ao novo e aparece o "+12")
let antes = null;
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
// (2026-11-15, a referência do Thiago) o layout: o topo com a foto do GP à direita e as pílulas do fim de semana; os cartões claros com a barra
// da equipe no título; o humor com o número grande (a média dos cinco) e as linhas com ícone; os pilotos com foto (Wikimedia Commons,
// fotos-noticias.js) e o logo da equipe no meio; as notícias com miniatura e o mural com o balão.
const FN = () => root.FotosNoticias || { pilotos: {}, equipes: {} };
const fotoPiloto = (id) => FN().pilotos[id]?.url || null, fotoEquipe = (eq) => FN().equipes[eq]?.url || null;
const SVG = (d, w = 20) => `<svg viewBox="0 0 24 24" width="${w}" height="${w}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const IH = { moral: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5c1 1.2 2.1 1.8 3.5 1.8s2.5-.6 3.5-1.8M9 10h.01M15 10h.01"/>', lealdade: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/><path d="m9.5 11 2 2 3-3.5"/>',
  patrocinador: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM6 5H4v1a3 3 0 0 0 4 3M18 5h2v1a3 3 0 0 1-4 3M12 13v4M9 20h6"/>', torcida: '<path d="M13 3 5 14h6l-1 7 8-11h-6z"/>', diretoria: '<path d="M4 5h6a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h6z"/>',
  seta: '<path d="m9 6 6 6-6 6"/>', balao: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h.01M12 10h.01M16 10h.01"/>' };
// (2026-11-15, a referência nova do Thiago) a tela cabe numa vista: "Ações do fim de semana" em linhas (uma aberta por vez, com as opções),
// o humor em linhas finas e, embaixo, três cartões pequenos (o companheiro, uma notícia por vez e a última linha do mural), que abrem o resto
let aberto = null, maisPilotos = false, maisMural = false, nNoticia = 0;
const IC_OP = ['<path d="M5 19V11M12 19V5M19 19v-9"/>', '<path d="M4 17l5-5 4 4 7-7M15 9h5v5"/>', '<path d="M12 3v18M3 12h18"/>', '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>'];
function html(c) {
  const s = c.s;
  if (!P()) return `<section class="cx-card"><p>O Paddock não carregou. Recarregue a página.</p></section>`;
  const p = P().garantir(s), evs = P().acontecimentos(s), comp = Pil().PILOTOS.find((x) => x.id === s.piloto2) || { nome: "Companheiro", ritmo: 0 };
  const terminou = s.gp >= s.tamanho, ultimo = (s.resultados || []).filter((r) => r.ano === s.ano).at(-1);
  const pendentes = evs.filter((e) => !e.escolha).length;
  const fase = terminou ? 3 : c.ativo ? 2 : 0, foto = c.prox && root.GpInfo?.fundoDe ? root.GpInfo.fundoDe(c.prox.pista) : null;
  const pilulas = `<div class="pd-pilulas" aria-label="O fim de semana">${["Sexta", "Sábado", "Domingo", "Pós-corrida"].map((d, i) => `<span class="${i === fase ? "on" : i < fase ? "feito" : ""}">${d}</span>`).join("")}</div>`;
  const tit = (t, extra = "") => `<header class="pd-tit"><h3>${t}</h3>${extra}</header>`;
  if (!evs.some((e) => e.id === aberto)) aberto = (evs.find((e) => !e.escolha) || evs[0] || {}).id || null;
  const cartao = (e) => { const on = e.id === aberto;
    return `<article class="pd-ev ${e.escolha ? "decidido" : ""} ${on ? "aberto" : ""}">
      <button type="button" class="pd-ev-linha" data-pd-abrir="${h(e.id)}" aria-expanded="${on}"><span class="pd-ev-ic">${icone(e.quem)}</span><span class="pd-ev-txt"><small>${h(e.quem)}</small><b>${h(e.titulo)}</b><span>${h(e.texto)}</span></span><i class="pd-chev">${SVG(IH.seta, 18)}</i></button>
      ${on ? `<div class="pd-opcoes">${e.opcoes.filter((o) => !e.escolha || o.id === e.escolha).map((o, i) => `<button type="button" class="pd-op ${e.escolha === o.id ? "on" : ""}" data-pd-ev="${h(e.id)}" data-pd-op="${h(o.id)}" ${e.escolha ? "disabled" : ""}>
        <i class="pd-op-ic">${e.escolha === o.id ? SVG('<path d="m5 12 4.5 4.5L19 7"/>', 18) : SVG(IC_OP[i % IC_OP.length], 18)}</i><span class="pd-op-txt"><b>${h(o.rotulo)}</b>${e.escolha && textoEfeito(o.efeito) ? `<small class="pd-revela">${textoEfeito(o.efeito)}</small>` : ""}${e.escolha && e.resultado ? `<em class="pd-revela">${h(e.resultado)}</em>` : ""}</span>${e.escolha ? "" : SVG(IH.seta, 16)}</button>`).join("")}</div>` : ""}
    </article>`; };
  const agora = terminou ? `<p class="pd-vazio">A temporada terminou. O paddock volta a ferver no próximo ano.</p>` : evs.length ? evs.map(cartao).join("") : `<p class="pd-vazio">Tudo calmo no paddock antes deste GP.</p>`;
  const ritmo = P().ajusteDeRitmo(s), dir100 = (p.diretoria + 20) * 2.5;
  const media = Math.round((p.moral + p.lealdade + p.patrocinador + p.torcida + dir100) / 5);
  const agoraN = { moral: p.moral, lealdade: p.lealdade, patrocinador: p.patrocinador, torcida: p.torcida, diretoria: dir100, caixa: s.caixa }, velho = antes && antes.id === s.semente ? antes.n : null;
  antes = { id: s.semente, n: agoraN };
  const linhaH = (ic, rot, v, mostra, nota) => { const de = velho ? velho[ic] : v, d = Math.round(ic === "diretoria" ? (v - de) / 2.5 : v - de);
    return `<div class="pd-hl ${d ? "mudou" : ""}" title="${h(nota)}"><span class="pd-hl-ic">${SVG(IH[ic], 20)}</span><span class="pd-hl-nome">${h(rot)}</span><div class="pd-barra"><i style="--de:${Math.max(1, Math.min(100, de)).toFixed(0)}%;width:${Math.max(1, Math.min(100, v)).toFixed(0)}%"></i></div><span class="pd-hl-num">${d ? `<em class="pd-delta ${d > 0 ? "mais" : "menos"}">${d > 0 ? "+" : "−"}${Math.abs(d)}</em>` : ""}<b>${mostra}</b></span></div>`; };
  const dCaixa = velho ? s.caixa - velho.caixa : 0;
  const humor = `<div class="pd-humor-topo"><b>${media}</b><span>/100</span><div class="pd-barra grossa"><i style="width:${media}%"></i></div></div><div class="pd-hls">
      ${linhaH("moral", `Moral · ${comp.nome}`, p.moral, p.moral, ritmo ? `${ritmo > 0 ? "+" : "−"}${num(Math.abs(ritmo))} de ritmo na corrida` : "ritmo normal na corrida")}
      ${linhaH("lealdade", "Lealdade", p.lealdade, p.lealdade, p.lealdade < 30 ? "pode procurar outra equipe" : "segue com a equipe")}
      ${linhaH("patrocinador", "Patrocinador", p.patrocinador, p.patrocinador, `acima de 80 a verba sobe; abaixo de 20, cai · hoje ${s.patrocinio} mi/GP`)}
      ${linhaH("torcida", "Torcida", p.torcida, p.torcida, p.torcida >= 66 ? "a arquibancada está com vocês" : p.torcida <= 33 ? "a torcida anda desconfiada" : "a torcida acompanha")}
      ${linhaH("diretoria", "Diretoria", dir100, `${p.diretoria > 0 ? "+" : ""}${p.diretoria}`, `soma na confiança do chefe: ${c.im ? c.im.confianca : "—"}%`)}</div>
      <div class="pd-caixa ${dCaixa ? "mudou" : ""}"><span>Caixa</span><span class="pd-hl-num">${dCaixa ? `<em class="pd-delta ${dCaixa > 0 ? "mais" : "menos"}">${dCaixa > 0 ? "+" : "−"}${Math.abs(dCaixa)}</em>` : ""}<b>${s.caixa} mi</b></span></div>`;
  const eu = medidas(s, "voce"), ele = medidas(s, s.piloto2);
  const duelo = (s.resultados || []).filter((r) => r.ano === s.ano).reduce((a, r) => { const x = r.linhas.find((l) => l.piloto === "voce"), y = r.linhas.find((l) => l.piloto === s.piloto2); if (x && y) { if (x.pos < y.pos) a[0]++; else a[1]++; } return a; }, [0, 0]);
  const medHTML = (m) => `<div class="pd-pm"><small>Consistência</small><b>${m.desvio == null ? "—" : `±${num(m.desvio, 2)} s`}</b></div><div class="pd-pm"><small>Ultrapassagens por GP</small><b>${m.ultrapassagens == null ? "—" : num(m.ultrapassagens)}</b></div>`;
  const meusPts = (c.t?.pilotos || []).find((x) => x.id === "voce")?.pontos || 0;
  const iniciais = (n) => String(n || "?").trim().split(/\s+/).map((x) => x[0]).slice(0, 2).join("").toUpperCase();
  const cartaoPiloto = (nome, fotoUrl, grande, rotGrande, delta, m) => `<article class="pd-piloto"><span class="pd-foto">${fotoUrl ? `<img src="${h(fotoUrl)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ""}<i>${h(iniciais(nome))}</i></span>
      <div class="pd-p-nome"><h4>${h(nome)}</h4><div class="pd-p-big"><b>${grande}</b>${delta}</div><small>${rotGrande}</small></div>${medHTML(m)}</article>`;
  const pilotos = `<div class="pd-pilotos">${cartaoPiloto(s.nome || "Você", null, meusPts, "Pontos no ano", "", eu)}
      <div class="pd-meio">${U().marca(s.equipe, "pd-meio-logo")}<b>${duelo[0]} × ${duelo[1]}</b><small>duelo interno</small></div>
      ${cartaoPiloto(comp.nome, fotoPiloto(s.piloto2), comp.ritmo, `Ritmo${p.salarioComp ? ` · <span class="pd-tag">salário +${p.salarioComp} mi/GP</span>` : ""}`, ritmo ? `<em class="${ritmo > 0 ? "mais" : "menos"}">${ritmo > 0 ? "+" : "−"}${num(Math.abs(ritmo))}</em>` : "", ele)}</div>
    <div class="pd-staff">${(() => { const E = Reg().ENGENHEIROS, en = s.engenheiros || { mecanico: 0, estrategista: 0 }, ct = Reg().contrato(s);
      const exp = P().experiencia ? P().experiencia(s) : 0;
      return `<div title="Sobe com bons resultados, cai com abandonos: mexe na constância dele"><small>Confiança · ${h(sobrenomeDe(comp.nome))}</small><b>${p.confianca ?? 55}</b></div><div title="Das instruções de corrida e das brigas: mais ataque, mais erro"><small>Agressividade</small><b>${p.agressividade ?? 50}</b></div><div title="Os GPs com a equipe: melhora a largada e a constância"><small>Experiência</small><b>${exp} ${exp === 1 ? "GP" : "GPs"}</b></div><div><small>Estrategista</small><b>${h(E.estrategista[en.estrategista].nome)}</b></div><div><small>Mecânicos</small><b>${h(E.mecanico[en.mecanico].nome)}${p.salarioStaff ? ` <span class="pd-tag">+${p.salarioStaff} mi/GP</span>` : ""}</b></div><div><small>Seu bônus por vitória</small><b>${ct.bonusVitoria} mi</b></div><div><small>Salários extras por GP</small><b>${P().salarios(s) ? `${P().salarios(s)} mi` : "nenhum"}</b></div>`; })()}</div>`;
  // as notícias das decisões (as deste GP e do anterior) entram primeiro
  const dasDecisoes = (p.noticias || []).filter((n) => n.ano === s.ano && n.gp >= s.gp - 1).slice(-2).reverse().map((n) => ({ ...n, nova: n.gp === s.gp }));
  const nts = [...dasDecisoes, ...noticias(c)];
  const miniDe = (n) => (n.eq ? fotoEquipe(n.eq) : foto);
  const news = nts.length ? nts.slice(0, 3).map((n) => { const m = miniDe(n); return `<article class="pd-noticia ${n.nova ? "nova" : ""}"><span class="pd-mini">${m ? `<img src="${h(m)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ""}${n.eq ? U().marca(n.eq, "pd-mini-logo") : ""}</span><div>${n.nova ? `<small class="pd-agora-tag">Agora</small>` : ""}<b>${h(n.t)}</b><p>${h(n.x)}</p></div>${SVG('<path d="M5 12h14M13 6l6 6-6 6"/>', 18)}</article>`; }).join("") : `<p class="pd-vazio">Sem notícias por enquanto.</p>`;
  const mural = p.mural.slice(-6).reverse().map((m) => `<li><span class="pd-balao">${SVG(IH.balao, 20)}</span><div><small>${h(m.tipo)} · ano ${m.ano}</small><p>${h(m.texto)}</p>${m.efeito ? `<span class="pd-efs">${plaquinhas(m.efeito)}</span>` : ""}</div></li>`).join("");
  const hist = historico(s);
  const historicoHTML = `${hist.momentos.length ? `<div class="pd-momentos">${hist.momentos.map(([t, x]) => `<div><small>${h(t)}</small><b>${h(x)}</b></div>`).join("")}</div>` : `<p class="pd-vazio">Os momentos marcantes aparecem aqui conforme a equipe vai somando resultados.</p>`}
      ${hist.linhas.length ? `<table class="pd-anos"><thead><tr><th>Ano</th><th>GPs</th><th>Você</th><th>Equipe</th><th>Pontos</th><th>Vitórias</th><th>Pódios</th></tr></thead><tbody>${hist.linhas.map((l) => `<tr><td>${l.ano}${l.completo ? "" : " (em curso)"}</td><td>${l.gps}</td><td>${l.pos}º</td><td>${l.eqPos}º</td><td>${l.pts}</td><td>${l.vit}</td><td>${l.pod}</td></tr>`).join("")}</tbody></table>` : ""}`;
  const um = p.ultimaMudanca, mostraMudanca = um && um.ano === s.ano && um.gp >= s.gp - 1;
  const conseq = mostraMudanca ? `<div class="pd-conseq ${/demitido/i.test(um.texto) ? "forte" : ""}"><span class="pd-conseq-ic">${icone(um.quem)}</span><div><small>O que mudou na equipe</small><p>${h(um.texto)}</p></div></div>` : "";
  const aviso = p.demitido && p.demitido.ano === s.ano ? `<div class="pd-aviso demitido"><b>Você foi demitido</b><span>A equipe não renova o seu contrato. No fim do ano, você vai para a equipe mais fraca que fizer proposta, a não ser que aceite outra antes.</span></div>`
    : p.ultimato && p.ultimato.ano === s.ano ? `<div class="pd-aviso"><b>Ultimato</b><span>Top ${p.ultimato.alvo} neste GP, ou a diretoria não renova o seu contrato.</span></div>` : "";
  const mais = (k, on) => `<button type="button" class="pd-mais ${on ? "on" : ""}" data-pd-mais="${k}" aria-expanded="${on}" aria-label="${on ? "Fechar" : "Ver mais"}">${SVG(IH.seta, 18)}</button>`;
  const n0 = nts.length ? nts[((nNoticia % nts.length) + nts.length) % nts.length] : null, m0 = n0 ? miniDe(n0) : null, ult = p.mural.at(-1);
  const cPiloto = `<section class="pd-card pd-mini-card">${tit("Os pilotos")}<div class="pd-mc"><span class="pd-foto">${fotoPiloto(s.piloto2) ? `<img src="${h(fotoPiloto(s.piloto2))}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ""}<i>${h(iniciais(comp.nome))}</i></span>
      <div class="pd-p-nome"><h4>${h(comp.nome)}</h4><div class="pd-p-big"><b>${comp.ritmo}</b>${ritmo ? `<em class="${ritmo > 0 ? "mais" : "menos"}">${ritmo > 0 ? "+" : "−"}${num(Math.abs(ritmo))}</em>` : ""}</div><small>Ritmo${p.salarioComp ? ` · <span class="pd-tag">+${p.salarioComp} mi/GP</span>` : ""}</small></div>
      <span class="pd-mc-logo">${U().marca(s.equipe, "pd-meio-logo")}</span>${mais("pilotos", maisPilotos)}</div></section>`;
  const cNoticia = `<section class="pd-card pd-mini-card">${tit("Notícias", nts.length > 1 ? `<small class="pd-cont">${(((nNoticia % nts.length) + nts.length) % nts.length) + 1}/${nts.length}</small>` : "")}${n0 ? `<div class="pd-mc pd-mc-noticia ${n0.nova ? "nova" : ""}"><span class="pd-mini">${m0 ? `<img src="${h(m0)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ""}${n0.eq ? U().marca(n0.eq, "pd-mini-logo") : ""}</span><div>${n0.nova ? `<small class="pd-agora-tag">Agora</small>` : ""}<b>${h(n0.t)}</b><p>${h(n0.x)}</p></div>${nts.length > 1 ? `<button type="button" class="pd-mais" data-pd-noticia aria-label="Próxima notícia">${SVG(IH.seta, 18)}</button>` : ""}</div>` : `<p class="pd-vazio">Sem notícias.</p>`}</section>`;
  const cMural = `<section class="pd-card pd-mini-card">${tit("Mural")}${ult ? `<div class="pd-mc"><span class="pd-balao">${SVG(IH.balao, 20)}</span><div class="pd-mc-txt"><small>${h(ult.tipo)} · ano ${ult.ano}</small><p>${h(ult.texto)}</p>${ult.efeito ? `<span class="pd-efs">${plaquinhas(ult.efeito)}</span>` : ""}</div>${p.mural.length > 1 || hist.linhas.length ? mais("mural", maisMural) : ""}</div>` : `<p class="pd-vazio">Nada ainda.</p>`}</section>`;
  const abertoPilotos = maisPilotos ? `<section class="pd-card pd-aberto">${tit("Os pilotos")}${pilotos}</section>` : "";
  const abertoMural = maisMural ? `<section class="pd-card pd-aberto">${tit("Mural")}${mural ? `<ol class="pd-mural">${mural}</ol>` : ""}${hist.momentos.length || hist.linhas.length ? `<h4 class="pd-sub">Histórico da equipe</h4>${historicoHTML}` : ""}</section>` : "";
  return `<div class="pd">
    <header class="pd-hero" ${foto ? `style="--foto:url('${h(foto)}')"` : ""}><div class="pd-hero-txt"><small class="pd-sobre">Paddock<i></i></small><h2>${terminou ? "Fim de temporada" : `Fim de semana: ${h(c.prox ? c.prox.nome : "")}`}</h2><p>${terminou ? "A temporada terminou." : "Prepare-se para a próxima etapa do campeonato."}</p>${pilulas}${aviso}</div></header>
    <div class="pd-grade">
      <section class="pd-card pd-agora">${tit("Ações do fim de semana", pendentes ? `<em class="pd-selo novo">${pendentes} esperando</em>` : "")}${conseq}${agora}</section>
      <section class="pd-card pd-humor">${tit(`${SVG(IH.moral, 20)} Humor da equipe`)}${humor}</section>
    </div>
    <div class="pd-baixo">${cPiloto}${cNoticia}${cMural}</div>
    ${abertoPilotos}${abertoMural}
  </div>`;
}
function previa(op) {
  document.querySelectorAll(".pd-hl.previa, .pd-caixa.previa").forEach((el) => { el.classList.remove("previa", "sobe", "desce"); const pv = el.querySelector(".pd-prev"); if (pv) pv.textContent = ""; });
  if (!op) return;
  let ef = {}; try { ef = JSON.parse(op.dataset.pdEf || "{}"); } catch { ef = {}; }
  for (const [k, d] of Object.entries(ef)) {
    if (!d) continue;
    const el = document.querySelector(`[data-pd-hl="${k}"]`); if (!el) continue;
    const v = Number(el.dataset.pdV), novo = k === "diretoria" ? Math.max(0, Math.min(100, v + d * 2.5)) : k === "caixa" ? v + d : Math.max(0, Math.min(100, v + d));
    el.classList.add("previa", d > 0 ? "sobe" : "desce");
    const f = el.querySelector(".pd-fantasma"); if (f) { f.style.left = `${Math.min(v, novo)}%`; f.style.width = `${Math.abs(novo - v)}%`; }
    const pv = el.querySelector(".pd-prev"); if (pv) pv.textContent = `${d > 0 ? "+" : "−"}${Math.abs(d)}${k === "caixa" ? " mi" : ""}`;
  }
}
// (2026-11-15: o Thiago achou que mostrar o resultado antes dá viés; a prévia no humor saiu, e o efeito só aparece depois da escolha)
function clique(b, render) {
  if (b.dataset.pdAbrir) { aberto = aberto === b.dataset.pdAbrir ? null : b.dataset.pdAbrir; render && render(); return true; }
  if (b.dataset.pdMais) { if (b.dataset.pdMais === "pilotos") maisPilotos = !maisPilotos; else maisMural = !maisMural; render && render(); return true; }
  if (b.hasAttribute("data-pd-noticia")) { nNoticia++; render && render(); return true; }
  if (b.dataset.pdEv && b.dataset.pdOp) { aberto = b.dataset.pdEv; /* (o decidido fica aberto: o efeito aparece nele) */ const ctx = root.CentralPaddock._ctx; if (ctx && ctx.decidirPaddock) ctx.decidirPaddock(b.dataset.pdEv, b.dataset.pdOp); return true; }
  return false;
}
// quantos acontecimentos esperam decisão (o número na aba)
const pendentes = (s) => { try { return root.F1Paddock && s.gp < s.tamanho ? root.F1Paddock.acontecimentos(JSON.parse(JSON.stringify(s))).filter((e) => !e.escolha).length : 0; } catch { return 0; } };
root.CentralPaddock = { html: (c) => { root.CentralPaddock._ctx = c; return html(c); }, clique, pendentes, _ctx: null };
})(typeof window !== "undefined" ? window : globalThis);
