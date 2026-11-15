// Corrida da Galera — a aba ACERTO da carreira: a tela de acerto do carro para a pista do próximo GP, antes de ir para a corrida.
//  - o topo: o GP, o mapa da pista e o que o acerto faz, em palavras;
//  - o palco: o carro de lado (SVG), com a asa traseira inclinando conforme a asa, a carroceria mais alta ou mais baixa sobre as rodas
//    (com os braços da suspensão) e, num laço, o carro afundando como no fim da reta, soltando faísca se raspar;
//  - os ajustes: a asa e a altura, com a marca de onde o engenheiro (E) e o estrategista (S) sugerem, e três medidores da física do jogo
//    (acerto-sugestao.js, `numeros`, a mesma conta de sim.js): a carga aerodinâmica numa curva, o arrasto no fim da reta e a folga do assoalho;
//  - a equipe: o engenheiro e o estrategista contratado (o nível vem de s.engenheiros.estrategista), cada um com a sua frase e "Usar".
// (2026-11-15) A tela foi refeita pelas referências do Thiago: ver o comentário de `html`.
// O acerto fica guardado no navegador por pista (acerto-sugestao.js) e a corrida usa o mesmo (acerto-carro.js, na largada; o painel P).
// Mexer nos deslizantes atualiza a tela sem redesenhar (redesenhar soltaria o deslizante no meio do arrasto).
(function (root) {
"use strict";
const U = () => root.CentralUI, h = (v) => U().h(v), A = () => root.AcertoSugestao;
let ideais = null;
const PX = 520;              // px do desenho por metro de altura (a altura do carro anda de 2,5 a 7,5 cm: ±13 px em volta do padrão)
const ANG = (a) => 2 + a.asa * 22; // o ângulo da asa traseira no desenho (graus)

function sugestoes(c, id) {
  const ideal = ideais && ideais[id], nivel = Math.max(0, Math.min(2, (c.s.engenheiros && c.s.engenheiros.estrategista) || 0));
  return { nivel, engenheiro: A().propostaDoEngenheiro(ideal), estrategista: A().sugestaoDoEstrategista(ideal, id, nivel) };
}
// as variáveis do desenho e dos medidores para um acerto (no style do .ac)
function estilo(a) {
  const n = A().numeros(a), parado = (A().alturaParada(a) - A().alturaParada(A().PADRAO)) * PX, rapido = parado - A().afundaAero(a, 400) * PX;
  return `--v-asa:${a.asa};--v-altura:${a.altura};--v-cambio:${a.cambio ?? 0.5};--v-freio:${a.freio ?? 0.5};--v-diferencial:${a.diferencial ?? 0.5};--v-cambagem:${a.cambagem ?? 0.5};--v-pressao:${a.pressao ?? 0.5};--v-rigidez:${a.rigidez ?? 0.5};--asa-ang:${ANG(a).toFixed(1)}deg;--parado:${(-parado).toFixed(1)}px;--rapido:${(-rapido).toFixed(1)}px;--carga:${n.carga};--arrasto:${n.arrasto}`;
}
const sinal = (v) => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v);
function medidores(a) {
  const n = A().numeros(a), folga = n.folgaCm, raspa = folga < 0;
  const barra = (v, max) => { const w = Math.min(50, (Math.abs(v) / max) * 50); return `<i class="ac-m-fill ${v < 0 ? "neg" : "pos"}" style="${v < 0 ? `right:50%` : `left:50%`};width:${w}%"></i>`; };
  const vr = n.raspaKmh, perigo = vr != null && vr < 300;
  const raspaHTML = `<div class="ac-raspa-vel ${vr == null ? "nunca" : perigo ? "perigo" : "ok"}"><small>Começa a raspar no chão a</small><b>${vr == null ? "nunca raspa" : `${vr} km/h`}</b><span>${vr == null ? "a altura aguenta a carga da asa em qualquer velocidade" : perigo ? "abaixo da velocidade do fim da reta (~300 km/h): vai raspar nas retas" : "acima de ~300 km/h: só no vácuo ou com o ERS"}</span></div>`;
  return raspaHTML + `<div class="ac-med"><span>Carga aerodinâmica <small>aderência numa curva média</small></span><b>${sinal(n.carga)}%</b><div class="ac-m">${barra(n.carga, 30)}<i class="ac-m-meio"></i></div></div>
    <div class="ac-med"><span>Arrasto <small>no fim da reta, a ~300 km/h</small></span><b>${sinal(n.arrasto)}%</b><div class="ac-m ac-m-inv">${barra(n.arrasto, 90)}<i class="ac-m-meio"></i></div></div>
    <div class="ac-med ${raspa ? "raspa" : folga < 0.4 ? "justo" : ""}"><span>Folga do assoalho <small>no fim da reta (o carro afunda ${String(n.afundaCm).replace(".", ",")} cm)</small></span><b>${raspa ? `raspa ${String(-folga).replace(".", ",")} cm` : `${String(folga).replace(".", ",")} cm`}</b><div class="ac-m ac-m-folga"><i class="ac-m-fill ${raspa ? "neg" : "pos"}" style="left:0;width:${Math.max(4, Math.min(100, ((folga + 3) / 7) * 100)).toFixed(0)}%"></i></div></div>`;
}
const CARRO = `<svg class="ac-carro" viewBox="0 0 640 230" aria-hidden="true">
  <defs><linearGradient id="acChao" x1="0" x2="1"><stop offset="0" stop-color="currentColor" stop-opacity="0"/><stop offset=".15" stop-color="currentColor" stop-opacity=".35"/><stop offset=".85" stop-color="currentColor" stop-opacity=".35"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>
  <rect x="0" y="206" width="640" height="2" fill="url(#acChao)"/>
  <g class="ac-rodas"><circle cx="150" cy="172" r="34"/><circle cx="150" cy="172" r="15" class="ac-aro"/><circle cx="492" cy="170" r="36"/><circle cx="492" cy="170" r="16" class="ac-aro"/></g>
  <g class="ac-corpo">
    <path class="ac-braco" d="M150 172 L205 150 M150 172 L205 170 M492 170 L430 148 M492 170 L430 168"/>
    <path class="ac-pintura" d="M28 168 L120 160 Q150 148 190 146 L300 140 Q330 122 360 120 L395 118 Q420 112 440 124 L470 132 L560 136 L586 150 L586 172 L520 178 L210 182 L120 180 L36 180 Z"/>
    <path class="ac-capo" d="M300 140 Q332 104 372 100 L400 102 Q418 106 430 122"/>
    <path class="ac-halo" d="M318 118 Q352 86 396 98" fill="none"/>
    <rect class="ac-prancha" x="200" y="182" width="320" height="5" rx="2"/>
    <g class="ac-asa-d"><rect x="16" y="176" width="92" height="7" rx="2"/><rect x="62" y="166" width="46" height="5" rx="2" class="ac-flap"/></g>
    <g class="ac-asa-t"><rect x="556" y="58" width="10" height="84" rx="2" class="ac-placa"/><g class="ac-perfil"><rect x="532" y="58" width="80" height="11" rx="5"/><rect x="540" y="74" width="62" height="7" rx="3"/></g></g>
    <g class="ac-faisca"><path d="M240 188 l-30 10 M260 188 l-44 6 M300 188 l-36 12 M330 188 l-50 4 M360 188 l-28 9"/></g>
  </g>
</svg>`;
// a ficha da pista no topo (gp-info.js): o circuito, a cidade e o país, a volta em km, as curvas e as voltas deste GP da carreira
function ficha(id, c) {
  const g = root.GpInfo ? root.GpInfo.get(id) : null; if (!g || !g.real) return "";
  const item = (rot, v) => `<div class="ac-ficha-i"><small>${h(rot)}</small><b>${h(v)}</b></div>`;
  return `<div class="ac-ficha">${item("Circuito", g.circuito)}${item("Local", [g.cidade, g.pais].filter(Boolean).join(", "))}${g.km ? item("Volta", g.km.toFixed(3).replace(".", ",") + " km") : ""}${g.curvas?.length ? item("Curvas", String(g.curvas.length)) : ""}${c.s.voltas ? item("Voltas no GP", String(c.s.voltas)) : ""}</div>`;
}
// A tela pela referência do Thiago (2026-11-15, a segunda): o título "Acerto do carro" com o traço da equipe, as abas inclinadas (Ajustes,
// Equipe, Pista), o painel com o ícone, as linhas com ‹ barra › o valor e o mínimo e o máximo DE VERDADE (a força da asa vai de 80 a 120%,
// a altura parada de 2,5 a 7,5 cm: acerto-sugestao.js), o cartão de onde o assoalho começa a raspar, os medidores, o carro grande à direita
// com o logo da equipe atrás e a faixa de baixo com a etapa, a folga e os três botões. As setas do teclado também andam (para cima e para
// baixo trocam de linha, para os lados mexem 5 pontos).
let sub = "ajustes", linha = "asa";
const LINHAS = {
  asa: { nome: "Asa (downforce)", v: (a) => Math.round(A().forcaDaAsa(a) * 100) + "%", faixa: "(Mín. 80 – Máx. 120%)",
    texto: "Mais asa: mais curva, menos reta, e o carro desce mais no fim da reta." },
  altura: { nome: "Altura do carro", v: (a) => A().cm(a), faixa: "(Mín. 2,5 – Máx. 7,5 cm)",
    texto: "Mais baixo: mais aderência, até o assoalho raspar." },
  // (2026-11-15) os três ajustes novos (sim.js extraDoAcerto): cada um troca uma coisa por outra, até ±4%
  cambio: { nome: "Câmbio", v: (a) => lado(a.cambio, "curto", "longo"), faixa: "",
    texto: "Curto arranca mais; longo chega mais longe na reta." },
  freio: { nome: "Balanço de freio", v: (a) => lado(a.freio, "na frente", "atrás"), faixa: "",
    texto: "Na frente freia mais; atrás o carro vira mais." },
  diferencial: { nome: "Diferencial", v: (a) => lado(a.diferencial, "aberto", "travado"), faixa: "",
    texto: "Aberto vira mais no meio da curva; travado tem mais tração na saída." },
};
Object.assign(LINHAS, {
  cambagem: { nome: "Cambagem", v: (a) => lado(a.cambagem, "pouca", "muita"), faixa: "", texto: "Muita: mais curva, menos freio e tração, e o pneu gasta mais." },
  pressao: { nome: "Pressão dos pneus", v: (a) => lado(a.pressao, "baixa", "alta"), faixa: "", texto: "Baixa agarra mais e gasta mais o pneu; alta dura mais e agarra menos." },
  rigidez: { nome: "Rigidez da suspensão", v: (a) => lado(a.rigidez, "macia", "dura"), faixa: "", texto: "Dura segura a carga da asa; macia passa melhor nas zebras." },
});
// o lado do ajuste em palavras (e o quanto, de 0 a 100)
function lado(v, menos, mais) { const x = Number.isFinite(v) ? v : 0.5; return x < 0.42 ? menos : x > 0.58 ? mais : "no meio"; }
const SV = (d, w = 22) => `<svg viewBox="0 0 24 24" width="${w}" height="${w}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const IC_MOLA = '<path d="M12 2v3M12 19v3M8 5h8M8 19h8M7 8l10 2M7 12l10 2M7 16l10-2M17 10 7 12M17 14 7 16"/>';
const IC_VELOC = '<path d="M4 16a8 8 0 1 1 16 0"/><path d="m12 16 4-5"/><circle cx="12" cy="16" r="1.3"/>';
// os medidores (só leitura): a carga numa curva média, o arrasto no fim da reta e a folga do assoalho, cada um na sua barra
function medidoresF1(a) {
  const n = A().numeros(a), vr = n.raspaKmh, perigo = vr != null && vr < 300, raspa = n.folgaCm < 0;
  const pct = (v, min, max) => Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));
  const sinalv = (v) => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v);
  const linhaM = (rot, sub2, valor, p, cls = "") => `<div class="acf2-med ${cls}"><span><b>${rot}</b>${sub2 ? `<small>${sub2}</small>` : ""}</span><span class="acf2-medbar"><i style="width:${p.toFixed(0)}%"></i></span><output>${valor}</output></div>`;
  return `<div class="acf2-raspa ${perigo ? "perigo" : vr == null ? "nunca" : ""}"><span class="acf2-raspa-ic">${SV(IC_VELOC, 34)}</span><div><small>Começa a raspar no chão a</small><b>${vr == null ? "nunca raspa" : `${vr} km/h`}</b></div>
      ${perigo ? `<i class="acf2-i" title="O assoalho raspa">!</i>` : ""}</div>
    ${linhaM("Carga aerodinâmica", "", `${sinalv(n.carga)}%`, pct(n.carga, -30, 30))}
    ${linhaM("Arrasto", "", `${sinalv(n.arrasto)}%`, pct(n.arrasto, -90, 90))}
    ${linhaM("Folga do assoalho", "", raspa ? `raspa ${String(-n.folgaCm).replace(".", ",")} cm` : `${String(n.folgaCm).replace(".", ",")} cm`, pct(n.folgaCm, -1, 3), raspa ? "raspa" : "")}`;
}
function html(c) {
  const UI = U(), prox = c.prox, id = prox && prox.pista;
  if (!A()) return `<section class="cx-card">${UI.tituloCard("Acerto do carro")}<p>O acerto não carregou. Recarregue a página.</p></section>`;
  if (!id) return `<section class="cx-card cx-an-vazio"><h3>Sem GP pela frente</h3><p>O acerto do carro é por pista: ele aparece aqui quando houver um próximo GP no calendário.</p></section>`;
  if (!ideais) A().carregarIdeais().then((j) => { ideais = j || {}; if (root.Central?.aba?.() === "carro" && root.Central?.carroSub?.() === "acerto") document.querySelector('[data-cx-carro="acerto"]')?.click(); });
  const nome = (root.Pistas?.PISTAS?.[id]?.name) || prox.nome || id, atual = A().lerGuardado(id) || A().PADRAO, sg = sugestoes(c, id), n = A().numeros(atual), raspa = n.folgaCm < 0;
  const mapa = root.GpSobre ? root.GpSobre.mapaSvg(id, "cx-traco ac-mapa-svg") : "", etapa = (c.s.gp || 0) + 1;
  const marca = (quem, letra, a, campo) => (a && (campo === "asa" || campo === "altura") ? `<i class="ac-sug ac-sug-${quem}" style="left:${(a[campo] * 100).toFixed(1)}%" title="${quem === "engenheiro" ? "Engenheiro" : "Estrategista"}">${letra}</i>` : "");
  const linhaHTML = (campo) => { const L = LINHAS[campo], on = linha === campo;
    return `<div class="acf2-linha ${on ? "on" : ""}" data-cx-acerto-linha="${campo}">
      <span class="acf2-nome">${h(L.nome)}</span>
      <button type="button" class="acf2-seta" data-cx-acerto-passo="${campo}:-1" aria-label="Menos ${h(L.nome)}">${SV('<path d="m15 6-6 6 6 6"/>', 18)}</button>
      <span class="acf2-barra"><i class="acf2-cheio" style="--v:var(--v-${campo})"></i><input type="range" min="0" max="1" step="0.01" value="${atual[campo]}" data-cx-acerto="${campo}" aria-label="${h(L.nome)}"><span class="ac-sugs">${marca("engenheiro", "E", sg.engenheiro, campo)}${marca("estrategista", "S", sg.estrategista, campo)}</span></span>
      <button type="button" class="acf2-seta" data-cx-acerto-passo="${campo}:1" aria-label="Mais ${h(L.nome)}">${SV('<path d="m9 6 6 6-6 6"/>', 18)}</button>
      <output class="acf2-valor" data-cx-acerto-v="${campo}">${h(L.v(atual))}</output><small class="acf2-faixa">${L.faixa}</small>
    </div>`; };
  const radio = (quem, titulo, a, subt) => a ? `<article class="ac-radio">
      <div class="ac-av ac-av-${quem}">${quem === "engenheiro" ? "E" : "S"}</div>
      <div class="ac-radio-txt"><small>${h(subt)}</small><b>${h(titulo)}</b><p>"${h(A().frase(a))}"</p><small class="ac-ef">${h(A().efeito(a))}</small></div>
      <button type="button" class="cx-bt" data-cx-acerto-usar="${quem}">Usar</button></article>` : "";
  const ABAS_AC = [["ajustes", "Ajustes"], ["equipe", "Equipe"], ["pista", "Pista"]];
  const cab = (ic, t, st) => `<header class="acf2-cab"><span class="acf2-cab-ic">${SV(ic, 30)}</span><div><h3>${t}</h3>${st ? `<p>${st}</p>` : ""}</div></header>`;
  const corpo = sub === "equipe"
    ? cab('<path d="M4 18v-5a8 8 0 0 1 16 0v5"/><path d="M4 15h3v5H4zM17 15h3v5h-3z"/>', "Rádio da equipe", "O engenheiro e o estrategista dizem como acertar o carro para esta pista.") + (ideais ? `<div class="ac-equipe">${radio("engenheiro", "Engenheiro da equipe", sg.engenheiro, "Seguro, sem raspar")}${radio("estrategista", `Estrategista ${A().NIVEIS_ESTRATEGISTA[sg.nivel]}`, sg.estrategista, sg.nivel ? "O melhor acerto para esta pista" : "Erra um pouco: contrate um experiente em Contratos")}</div>
        <p class="ac-legenda"><i class="ac-sug ac-sug-engenheiro">E</i> onde o <b>engenheiro</b> propõe <i class="ac-sug ac-sug-estrategista">S</i> onde o <b>estrategista</b> sugere, nas barras da aba Ajustes.</p>` : `<p class="ac-carregando">Chamando a equipe no rádio…</p>`)
    : sub === "pista"
      ? cab('<path d="M5 18c-2-3 0-6 3-6s4-4 7-4 5 3 3 6-6 2-8 4-4 2-5 0z"/>', h(nome), "O traçado e o que o acerto de agora faz nele.") + `<div class="acf2-pista"><div class="ac-mapa" aria-hidden="true">${mapa}</div><div>${ficha(id, c)}<p class="acf2-desc">${h(A().frase(atual))}</p><p class="acf2-desc">${h(A().efeito(atual))}</p></div></div>`
      : cab(IC_MOLA, "Aerodinâmica e Suspensão", "") + `${linhaHTML("asa")}${linhaHTML("altura")}${linhaHTML("rigidez")}${linhaHTML("cambagem")}${linhaHTML("pressao")}${linhaHTML("cambio")}${linhaHTML("freio")}${linhaHTML("diferencial")}
          <p class="acf2-desc" data-cx-acerto-desc>${h(LINHAS[linha].texto)}</p>
          <div class="acf2-meds" data-cx-acerto-med>${medidoresF1(atual)}</div>`;
  const vr = n.raspaKmh;
  return `<div class="ac acf2 ${raspa ? "ac-raspa" : ""}" style="${estilo(atual)}">
    <div class="acf2-esq">
      <h2 class="acf2-titulo">Acerto do carro</h2>
      <nav class="acf2-abas" role="tablist" aria-label="Partes do acerto">${ABAS_AC.map(([k, t]) => `<button type="button" role="tab" class="${sub === k ? "on" : ""}" aria-selected="${sub === k}" data-cx-acerto-sub="${k}">${t}</button>`).join("")}</nav>
      <section class="acf2-painel">${corpo}</section>
    </div>
    <div class="acf2-dir">

      <section class="ac-palco acf2-palco${carro3d ? " ac-3d-pronto" : ""}"><span class="acf2-marca" aria-hidden="true">${UI.marca ? UI.marca(c.s.equipe, "acf2-marca-img") : ""}</span><div class="ac-palco-rot"><span class="on">Parado</span><span>Fim da reta</span><em class="ac-raspa-selo">Raspando</em></div><div class="ac-palco3d"><canvas aria-label="O carro da equipe, com a suspensão subindo e descendo"></canvas></div><div class="ac-reserva">${CARRO}</div></section>
    </div>
    <footer class="acf2-pe">
      <div class="acf2-gp">${SV('<path d="M3 20 9 6l4 9 3-5 5 10"/>', 40)}<div><small>Etapa ${etapa}</small><b>${UI.bandeira ? UI.bandeira(id) : ""}${h(nome)}</b></div></div>

      <div class="acf2-botoes"><button type="button" class="acf2-bt" data-cx-acerto-padrao>${SV('<path d="M7 5v14l11-7z"/>', 16)}<span>Carro padrão</span></button>${ideais && sg.engenheiro ? `<button type="button" class="acf2-bt cheio" data-cx-acerto-usar="engenheiro">${SV('<path d="M14 7l3-3 3 3-3 3M4 20l9-9M8 4a4 4 0 0 0 5 5l-6 6a2 2 0 0 1-3-3z"/>', 16)}<span>Usar o do engenheiro</span></button>` : ""}${ideais && sg.estrategista ? `<button type="button" class="acf2-bt" data-cx-acerto-usar="estrategista">${SV('<path d="M4 18v-5a8 8 0 0 1 16 0v5"/><path d="M4 15h3v5H4zM17 15h3v5h-3z"/>', 16)}<span>Usar o do estrategista</span></button>` : ""}</div>
    </footer>
  </div>`;
}
// o carro 3D: um só, montado depois que a aba aparece (o canvas novo de cada pintura ganha um carro novo; o velho para sozinho)
let carro3d = null, montando = false;
const ajustar3d = (a) => carro3d && carro3d.ajustar({ alturaParadaM: A().alturaParada(a) - A().alturaParada(A().PADRAO), afundaM: A().afundaAero(a, 400), asa: a.asa });
function montar3d(c) {
  requestAnimationFrame(() => {
    const cv = document.querySelector(".ac-palco3d canvas"), id = c.prox && c.prox.pista; if (!cv || !id) return;
    const a = A().lerGuardado(id) || A().PADRAO;
    if (carro3d && carro3d.canvas === cv) { cv.closest(".ac-palco")?.classList.add("ac-3d-pronto"); carro3d.redimensionar(); return ajustar3d(a); } // (depois de cada pintura: a classe e o tamanho do desenho, que a pintura apaga)
    if (montando) return; montando = true;
    carro3d?.parar(); carro3d = null;
    import("/corrida/temporada/acerto3d.js").then((m) => m.montarAcerto(cv.closest(".ac-palco3d"), c.s.equipe)).then((x) => { carro3d = x; montando = false; ajustar3d(A().lerGuardado(id) || A().PADRAO); cv.closest(".ac-palco")?.classList.add("ac-3d-pronto"); })
      .catch((e) => { montando = false; console.warn("acerto: carro 3D indisponível", e); });
  });
}
// os deslizantes: guardam na hora e atualizam o desenho, os números e os medidores sem redesenhar a tela
document.addEventListener("input", (e) => {
  const k = e.target?.dataset?.cxAcerto; if (!k) return;
  mudarValor(k, +e.target.value, false);
});
// muda um valor (deslizante, setas da tela ou do teclado) e atualiza a tela sem redesenhar; `noInput`: põe também o valor no deslizante
function mudarValor(k, valor, noInput = true) {
  const ctx = root.CentralAcerto._ctx, id = ctx && ctx.prox && ctx.prox.pista; if (!id) return;
  const a = { ...(A().lerGuardado(id) || A().PADRAO), [k]: Math.max(0, Math.min(1, Math.round(valor * 100) / 100)) }; A().guardar(id, a);
  const raiz = document.querySelector(".ac"); if (!raiz) return;
  if (noInput) { const inp = raiz.querySelector(`[data-cx-acerto="${k}"]`); if (inp) inp.value = a[k]; }
  for (const c of ["asa", "altura"]) { const o = raiz.querySelector(`[data-cx-acerto-n="${c}"]`); if (o) o.textContent = Math.round(a[c] * 100); }
  const n = A().numeros(a), folga = raiz.querySelector("[data-cx-acerto-folga]"), alerta = raiz.querySelector("[data-cx-acerto-alerta]");
  if (folga) folga.textContent = n.folgaCm < 0 ? `raspa ${String(-n.folgaCm).replace(".", ",")} cm` : `${String(n.folgaCm).replace(".", ",")} cm`;
  if (alerta) { alerta.classList.toggle("on", n.raspaKmh != null && n.raspaKmh < 300); alerta.querySelector("b").textContent = n.raspaKmh == null ? "Nunca raspa" : `Raspa a ${n.raspaKmh} km/h`; }
  raiz.setAttribute("style", estilo(a)); raiz.classList.toggle("ac-raspa", A().numeros(a).folgaCm < 0);
  const v = (c) => raiz.querySelector(`[data-cx-acerto-v="${c}"]`);
  for (const c of Object.keys(LINHAS)) if (v(c)) v(c).textContent = LINHAS[c].v(a);
  const ef = raiz.querySelector("[data-cx-acerto-efeito]"); if (ef) ef.textContent = A().efeito(a);
  const med = raiz.querySelector("[data-cx-acerto-med]"); if (med) med.innerHTML = medidoresF1(a);
  ajustar3d(a);
}
// a linha escolhida (o destaque e a explicação embaixo), sem redesenhar
function escolherLinha(campo) {
  linha = campo;
  document.querySelectorAll("[data-cx-acerto-linha]").forEach((el) => el.classList.toggle("on", el.dataset.cxAcertoLinha === campo));
  const d = document.querySelector("[data-cx-acerto-desc]"); if (d) d.textContent = LINHAS[campo].texto;
}
// o teclado, como no jogo: para cima e para baixo trocam de linha, para os lados mexem 5 pontos (só na aba Acerto, fora de campos de texto)
document.addEventListener("keydown", (e) => {
  if (!document.querySelector(".acf2") || sub !== "ajustes" || e.target?.closest?.("input:not([type=range]),select,textarea") || e.altKey || e.ctrlKey || e.metaKey) return;
  const ctx = root.CentralAcerto._ctx, id = ctx && ctx.prox && ctx.prox.pista; if (!id) return;
  const ordem = Object.keys(LINHAS), i = ordem.indexOf(linha);
  if (e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); escolherLinha(ordem[(i + (e.key === "ArrowDown" ? 1 : ordem.length - 1)) % ordem.length]); }
  else if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && e.target?.type !== "range") { e.preventDefault(); const a = A().lerGuardado(id) || A().PADRAO; mudarValor(linha, a[linha] + (e.key === "ArrowRight" ? 0.05 : -0.05)); }
});
function clique(b, render) {
  const ctx = root.CentralAcerto._ctx, id = ctx && ctx.prox && ctx.prox.pista;
  if (b.dataset.cxAcertoSub) { sub = b.dataset.cxAcertoSub; render(); return true; }
  if (b.dataset.cxAcertoPasso && id) { const [k, d] = b.dataset.cxAcertoPasso.split(":"), a = A().lerGuardado(id) || A().PADRAO; escolherLinha(k); mudarValor(k, a[k] + Number(d) * 0.05); return true; }
  if (b.dataset.cxAcertoUsar && id) { const a = sugestoes(ctx, id)[b.dataset.cxAcertoUsar]; if (a) A().guardar(id, { ...(A().lerGuardado(id) || A().PADRAO), asa: a.asa, altura: a.altura }); render(); return true; }
  if (b.hasAttribute("data-cx-acerto-padrao") && id) { A().guardar(id, A().PADRAO); render(); return true; }
  return false;
}
document.addEventListener("pointerdown", (e) => { const l = e.target?.closest?.("[data-cx-acerto-linha]"); if (l) escolherLinha(l.dataset.cxAcertoLinha); });
root.CentralAcerto = { html: (c) => { root.CentralAcerto._ctx = c; montar3d(c); return html(c); }, clique, _ctx: null };
})(typeof window !== "undefined" ? window : globalThis);
