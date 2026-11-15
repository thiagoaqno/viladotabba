// Corrida da Galera — a aba ACERTO da carreira: a tela de acerto do carro para a pista do próximo GP, antes de ir para a corrida.
//  - o topo: o GP, o mapa da pista e o que o acerto faz, em palavras;
//  - o palco: o carro de lado (SVG), com a asa traseira inclinando conforme a asa, a carroceria mais alta ou mais baixa sobre as rodas
//    (com os braços da suspensão) e, num laço, o carro afundando como no fim da reta, soltando faísca se raspar;
//  - os ajustes: a asa e a altura, com a marca de onde o engenheiro (E) e o estrategista (S) sugerem, e três medidores da física do jogo
//    (acerto-sugestao.js, `numeros`, a mesma conta de sim.js): a carga aerodinâmica numa curva, o arrasto no fim da reta e a folga do assoalho;
//  - a equipe: o engenheiro e o estrategista contratado (o nível vem de s.engenheiros.estrategista), cada um com a sua frase e "Usar".
// (2026-11-15) A tela ganhou o jeito da tela de acerto do jogo da F1: ver o comentário de `html`.
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
  return `--v-asa:${a.asa};--v-altura:${a.altura};--asa-ang:${ANG(a).toFixed(1)}deg;--parado:${(-parado).toFixed(1)}px;--rapido:${(-rapido).toFixed(1)}px;--carga:${n.carga};--arrasto:${n.arrasto}`;
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
// A tela no jeito da tela de acerto do jogo da F1 (2026-11-15, o print do Thiago): o título no meio, as abas embaixo dele (Ajustes, Equipe,
// Pista), o painel com as linhas (a escolhida em destaque, as setas, a barra em gomos com o valor e a faixa "Menos 0 – 100 Mais"), o carro de
// lado à direita, a explicação da linha embaixo e a faixa de baixo com a pista, a folga do assoalho e o alerta vermelho quando o carro raspa.
// As setas do teclado também andam: para cima e para baixo trocam de linha, para os lados mexem 5 pontos.
let sub = "ajustes", linha = "asa";
const LINHAS = {
  asa: { nome: "Asa (downforce)", menos: "Menos", mais: "Mais", v: (a) => Math.round(A().forcaDaAsa(a) * 100) + "%",
    texto: "Mais asa é mais carga aerodinâmica: o carro gruda nas curvas e freia mais tarde, mas o arrasto tira velocidade no fim da reta. A carga também empurra o carro para baixo e come a folga do assoalho. Pouca asa deixa o carro rápido na reta e solto nas curvas." },
  altura: { nome: "Altura do carro", menos: "Baixo", mais: "Alto", v: (a) => A().cm(a),
    texto: "Mais baixo, o assoalho trabalha mais perto do chão e o efeito solo dá mais aderência. Baixo demais, a carga da asa afunda o carro no fim da reta e o assoalho raspa no asfalto, soltando faísca. Alto é seguro, mas perde aderência." },
};
const gomos = (campo) => `<div class="acf-gomos">${Array.from({ length: 10 }, (_, i) => `<i style="--i:${i}"></i>`).join("")}</div><i class="acf-cheio" style="--v:var(--v-${campo})"></i>`;
function html(c) {
  const UI = U(), prox = c.prox, id = prox && prox.pista;
  if (!A()) return `<section class="cx-card">${UI.tituloCard("Acerto do carro")}<p>O acerto não carregou. Recarregue a página.</p></section>`;
  if (!id) return `<section class="cx-card cx-an-vazio"><h3>Sem GP pela frente</h3><p>O acerto do carro é por pista: ele aparece aqui quando houver um próximo GP no calendário.</p></section>`;
  if (!ideais) A().carregarIdeais().then((j) => { ideais = j || {}; if (root.Central?.aba?.() === "acerto") document.querySelector('.cx-aba[data-cx-aba="acerto"]')?.click(); });
  const nome = (root.Pistas?.PISTAS?.[id]?.name) || prox.nome || id, atual = A().lerGuardado(id) || A().PADRAO, sg = sugestoes(c, id), n = A().numeros(atual), raspa = n.folgaCm < 0;
  const mapa = root.GpSobre ? root.GpSobre.mapaSvg(id, "cx-traco ac-mapa-svg") : "", etapa = (c.s.gp || 0) + 1;
  const marca = (quem, letra, a, campo) => (a ? `<i class="ac-sug ac-sug-${quem}" style="left:${(a[campo] * 100).toFixed(1)}%" title="${quem === "engenheiro" ? "Engenheiro" : "Estrategista"}">${letra}</i>` : "");
  const linhaHTML = (campo) => { const L = LINHAS[campo], on = linha === campo;
    return `<div class="acf-linha ${on ? "on" : ""}" data-cx-acerto-linha="${campo}">
      <span class="acf-nome">${h(L.nome)}</span>
      <span class="acf-setas"><button type="button" data-cx-acerto-passo="${campo}:-1" aria-label="Menos ${h(L.nome)}">◀</button><button type="button" data-cx-acerto-passo="${campo}:1" aria-label="Mais ${h(L.nome)}">▶</button></span>
      <span class="acf-barra">${gomos(campo)}<input type="range" min="0" max="1" step="0.01" value="${atual[campo]}" data-cx-acerto="${campo}" aria-label="${h(L.nome)}"><span class="ac-sugs">${marca("engenheiro", "E", sg.engenheiro, campo)}${marca("estrategista", "S", sg.estrategista, campo)}</span></span>
      <output class="acf-num" data-cx-acerto-n="${campo}">${Math.round(atual[campo] * 100)}</output>
      <span class="acf-faixa">${h(L.menos)} 0 – 100 ${h(L.mais)} · <b data-cx-acerto-v="${campo}">${h(L.v(atual))}</b></span>
    </div>`; };
  const radio = (quem, titulo, a, subt) => a ? `<article class="ac-radio">
      <div class="ac-av ac-av-${quem}">${quem === "engenheiro" ? "E" : "S"}</div>
      <div class="ac-radio-txt"><small>${h(subt)}</small><b>${h(titulo)}</b><p>"${h(A().frase(a))}"</p><small class="ac-ef">${h(A().efeito(a))}</small></div>
      <button type="button" class="cx-bt" data-cx-acerto-usar="${quem}">Usar</button></article>` : "";
  const ABAS_AC = [["ajustes", "Ajustes"], ["equipe", "Equipe"], ["pista", "Pista"]];
  const vr = n.raspaKmh;
  const corpo = sub === "equipe"
    ? (ideais ? `<div class="ac-equipe">${radio("engenheiro", "Engenheiro da equipe", sg.engenheiro, "Rádio da equipe")}${radio("estrategista", `Estrategista ${A().NIVEIS_ESTRATEGISTA[sg.nivel]}`, sg.estrategista, sg.nivel ? "O melhor acerto para esta pista" : "Erra um pouco: contrate um experiente em Contratos")}</div>
        <p class="ac-legenda"><i class="ac-sug ac-sug-engenheiro">E</i> onde o <b>engenheiro da equipe</b> propõe (seguro, sem raspar) <i class="ac-sug ac-sug-estrategista">S</i> onde o <b>estrategista</b> sugere (o melhor para a pista; o de base erra um pouco).</p>` : `<p class="ac-carregando">Chamando a equipe no rádio…</p>`)
    : sub === "pista"
      ? `<div class="acf-pista"><div class="ac-mapa" aria-hidden="true">${mapa}</div><div>${ficha(id, c)}<p class="acf-desc">${h(A().frase(atual))}</p><p class="acf-desc">${h(A().efeito(atual))}</p></div></div>`
      : `<div class="acf-corpo">
          <div class="acf-lista">${linhaHTML("asa")}${linhaHTML("altura")}
            <p class="acf-desc" data-cx-acerto-desc>${h(LINHAS[linha].texto)}</p>
            <div class="ac-medidores" data-cx-acerto-med>${medidores(atual)}</div></div>
          <section class="ac-palco${carro3d ? " ac-3d-pronto" : ""}"><div class="ac-palco-rot"><span class="on">Parado</span><span>Fim da reta</span><em class="ac-raspa-selo">Raspando</em></div><div class="ac-palco3d"><canvas aria-label="O carro da equipe, de lado, com a suspensão subindo e descendo"></canvas></div><div class="ac-reserva">${CARRO}</div></section>
        </div>`;
  return `<div class="ac acf ${raspa ? "ac-raspa" : ""}" style="${estilo(atual)}">
    <h2 class="acf-titulo">Acerto do carro</h2>
    <nav class="acf-abas" role="tablist" aria-label="Partes do acerto">${ABAS_AC.map(([k, t]) => `<button type="button" role="tab" class="${sub === k ? "on" : ""}" aria-selected="${sub === k}" data-cx-acerto-sub="${k}">${t}</button>`).join("")}</nav>
    <section class="acf-painel"><header class="acf-cab"><b>${sub === "equipe" ? "Sugestões da equipe" : sub === "pista" ? "A pista" : "Aerodinâmica e suspensão"}</b><span>Acerto guardado <em>${h(nome)}</em></span></header>${corpo}</section>
    <footer class="acf-pe">
      <div class="acf-gp">${UI.bandeira ? UI.bandeira(id) : ""}<div><small>${h(nome)}</small><b>Etapa ${etapa}</b></div></div>
      <div class="acf-folga"><small>Folga do assoalho no fim da reta</small><b data-cx-acerto-folga>${raspa ? `raspa ${String(-n.folgaCm).replace(".", ",")} cm` : `${String(n.folgaCm).replace(".", ",")} cm`}</b></div>
      <div class="acf-alerta ${vr != null && vr < 300 ? "on" : ""}" data-cx-acerto-alerta><svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M12 3 2 21h20z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 10v5M12 18v.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><div><small>Assoalho</small><b>${vr == null ? "Nunca raspa" : `Raspa a ${vr} km/h`}</b></div></div>
    </footer>
    <div class="acf-botoes"><button type="button" class="acf-bt" data-cx-acerto-padrao><kbd>□</kbd> Carro padrão</button>${ideais && sg.engenheiro ? `<button type="button" class="acf-bt" data-cx-acerto-usar="engenheiro"><kbd>E</kbd> Usar o do engenheiro</button>` : ""}${ideais && sg.estrategista ? `<button type="button" class="acf-bt" data-cx-acerto-usar="estrategista"><kbd>S</kbd> Usar o do estrategista</button>` : ""}</div>
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
  if (v("asa")) v("asa").textContent = Math.round(A().forcaDaAsa(a) * 100) + "%";
  if (v("altura")) v("altura").textContent = A().cm(a);
  const ef = raiz.querySelector("[data-cx-acerto-efeito]"); if (ef) ef.textContent = A().efeito(a);
  const med = raiz.querySelector("[data-cx-acerto-med]"); if (med) med.innerHTML = medidores(a);
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
  if (!document.querySelector(".acf") || sub !== "ajustes" || e.target?.closest?.("input:not([type=range]),select,textarea") || e.altKey || e.ctrlKey || e.metaKey) return;
  const ctx = root.CentralAcerto._ctx, id = ctx && ctx.prox && ctx.prox.pista; if (!id) return;
  const ordem = Object.keys(LINHAS), i = ordem.indexOf(linha);
  if (e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); escolherLinha(ordem[(i + (e.key === "ArrowDown" ? 1 : ordem.length - 1)) % ordem.length]); }
  else if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && e.target?.type !== "range") { e.preventDefault(); const a = A().lerGuardado(id) || A().PADRAO; mudarValor(linha, a[linha] + (e.key === "ArrowRight" ? 0.05 : -0.05)); }
});
function clique(b, render) {
  const ctx = root.CentralAcerto._ctx, id = ctx && ctx.prox && ctx.prox.pista;
  if (b.dataset.cxAcertoSub) { sub = b.dataset.cxAcertoSub; render(); return true; }
  if (b.dataset.cxAcertoPasso && id) { const [k, d] = b.dataset.cxAcertoPasso.split(":"), a = A().lerGuardado(id) || A().PADRAO; escolherLinha(k); mudarValor(k, a[k] + Number(d) * 0.05); return true; }
  if (b.dataset.cxAcertoUsar && id) { const a = sugestoes(ctx, id)[b.dataset.cxAcertoUsar]; if (a) A().guardar(id, a); render(); return true; }
  if (b.hasAttribute("data-cx-acerto-padrao") && id) { A().guardar(id, A().PADRAO); render(); return true; }
  return false;
}
document.addEventListener("pointerdown", (e) => { const l = e.target?.closest?.("[data-cx-acerto-linha]"); if (l) escolherLinha(l.dataset.cxAcertoLinha); });
root.CentralAcerto = { html: (c) => { root.CentralAcerto._ctx = c; montar3d(c); return html(c); }, clique, _ctx: null };
})(typeof window !== "undefined" ? window : globalThis);
