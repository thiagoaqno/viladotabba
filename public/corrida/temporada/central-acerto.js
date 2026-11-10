// Corrida da Galera — a aba ACERTO da carreira: a tela de acerto do carro para a pista do próximo GP, antes de ir para a corrida.
//  - o topo: o GP, o mapa da pista e o que o acerto faz, em palavras;
//  - o palco: o carro de lado (SVG), com a asa traseira inclinando conforme a asa, a carroceria mais alta ou mais baixa sobre as rodas
//    (com os braços da suspensão) e, num laço, o carro afundando como no fim da reta, soltando faísca se raspar;
//  - os ajustes: a asa e a altura, com a marca de onde o engenheiro (E) e o estrategista (S) sugerem, e três medidores da física do jogo
//    (acerto-sugestao.js, `numeros`, a mesma conta de sim.js): a carga aerodinâmica numa curva, o arrasto no fim da reta e a folga do assoalho;
//  - a equipe: o engenheiro e o estrategista contratado (o nível vem de s.engenheiros.estrategista), cada um com a sua frase e "Usar".
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
  return `--asa-ang:${ANG(a).toFixed(1)}deg;--parado:${(-parado).toFixed(1)}px;--rapido:${(-rapido).toFixed(1)}px;--carga:${n.carga};--arrasto:${n.arrasto}`;
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
function html(c) {
  const UI = U(), prox = c.prox, id = prox && prox.pista;
  if (!A()) return `<section class="cx-card">${UI.tituloCard("Acerto do carro")}<p>O acerto não carregou. Recarregue a página.</p></section>`;
  if (!id) return `<section class="cx-card cx-an-vazio"><h3>Sem GP pela frente</h3><p>O acerto do carro é por pista: ele aparece aqui quando houver um próximo GP no calendário.</p></section>`;
  if (!ideais) A().carregarIdeais().then((j) => { ideais = j || {}; if (root.Central?.aba?.() === "acerto") document.querySelector('.cx-aba[data-cx-aba="acerto"]')?.click(); });
  const nome = (root.Pistas?.PISTAS?.[id]?.name) || prox.nome || id, atual = A().lerGuardado(id) || A().PADRAO, sg = sugestoes(c, id), raspa = A().numeros(atual).folgaCm < 0;
  const mapa = root.GpSobre ? root.GpSobre.mapaSvg(id, "cx-traco ac-mapa-svg") : "", etapa = (c.s.gp || 0) + 1;
  const marca = (quem, letra, a, campo) => (a ? `<i class="ac-sug ac-sug-${quem}" style="left:${(a[campo] * 100).toFixed(1)}%" title="${quem === "engenheiro" ? "Engenheiro" : "Estrategista"}">${letra}</i>` : "");
  const parametro = (campo, nomeP, menos, mais, dica) => `<div class="ac-param">
      <div class="ac-param-topo"><b>${h(nomeP)}</b><output class="ac-chip" data-cx-acerto-v="${campo}">${h(campo === "asa" ? Math.round(A().forcaDaAsa(atual) * 100) + "%" : A().cm(atual))}</output></div>
      <div class="ac-trilho"><input type="range" min="0" max="1" step="0.01" value="${atual[campo]}" data-cx-acerto="${campo}" aria-label="${h(nomeP)}">
        <div class="ac-sugs">${marca("engenheiro", "E", sg.engenheiro, campo)}${marca("estrategista", "S", sg.estrategista, campo)}</div></div>
      <div class="ac-param-pe"><span>${h(menos)}</span><small>${h(dica)}</small><span>${h(mais)}</span></div></div>`;
  const radio = (quem, titulo, a, sub) => a ? `<article class="ac-radio">
      <div class="ac-av">${quem === "engenheiro" ? "EN" : "ES"}</div>
      <div class="ac-radio-txt"><small>${h(sub)}</small><b>${h(titulo)}</b><p>"${h(A().frase(a))}"</p><small class="ac-ef">${h(A().efeito(a))}</small></div>
      <button type="button" class="cx-bt" data-cx-acerto-usar="${quem}">Usar</button></article>` : "";
  return `<div class="ac ${raspa ? "ac-raspa" : ""}" style="${estilo(atual)}">
    <header class="ac-topo"><div class="ac-topo-txt"><small class="cx-rot">Acerto do carro · etapa ${etapa}</small><h2>${UI.bandeira ? UI.bandeira(id) : ""}<span>${h(nome)}</span></h2>${ficha(id, c)}</div><div class="ac-mapa" aria-hidden="true">${mapa}</div></header>
    <div class="ac-grade">
      <section class="ac-palco"><div class="ac-palco-rot"><span class="on">Parado</span><span>Fim da reta</span><em class="ac-raspa-selo">Raspando</em></div><div class="ac-palco3d"><canvas aria-label="O carro da equipe, de lado, com a suspensão subindo e descendo"></canvas></div><div class="ac-reserva">${CARRO}</div><small class="ac-palco-pe">A suspensão afunda com a carga da asa no fim da reta; o carro mostra 4 × o curso para dar para ver.</small></section>
      <section class="ac-ajustes">
        ${parametro("asa", "Asa (downforce)", "Menos", "Mais", "aderência na curva × velocidade na reta")}
        ${parametro("altura", "Altura do carro", "Baixo", "Alto", "efeito solo × risco de raspar")}
        <div class="ac-medidores" data-cx-acerto-med>${medidores(atual)}</div>
        <div class="ac-acoes"><button type="button" class="cx-contorno" data-cx-acerto-padrao>Carro padrão</button><small>Guardado para ${h(nome)}. O painel P da corrida mexe no mesmo.</small></div>
      </section>
    </div>
    ${ideais ? `<div class="ac-equipe">${radio("engenheiro", "Engenheiro da equipe", sg.engenheiro, "Rádio da equipe")}${radio("estrategista", `Estrategista ${A().NIVEIS_ESTRATEGISTA[sg.nivel]}`, sg.estrategista, sg.nivel ? "O melhor acerto para esta pista" : "Erra um pouco: contrate um experiente em Contratos")}</div>` : `<p class="ac-carregando">Chamando a equipe no rádio…</p>`}
  </div>`;
}
// o carro 3D: um só, montado depois que a aba aparece (o canvas novo de cada pintura ganha um carro novo; o velho para sozinho)
let carro3d = null, montando = false;
const ajustar3d = (a) => carro3d && carro3d.ajustar({ alturaParadaM: A().alturaParada(a) - A().alturaParada(A().PADRAO), afundaM: A().afundaAero(a, 400), asa: a.asa });
function montar3d(c) {
  requestAnimationFrame(() => {
    const cv = document.querySelector(".ac-palco3d canvas"), id = c.prox && c.prox.pista; if (!cv || !id) return;
    const a = A().lerGuardado(id) || A().PADRAO;
    if (carro3d && carro3d.canvas === cv) { cv.closest(".ac-palco")?.classList.add("ac-3d-pronto"); return ajustar3d(a); } // (a pintura da Central tira a classe: põe de volta)
    if (montando) return; montando = true;
    carro3d?.parar(); carro3d = null;
    import("/corrida/temporada/acerto3d.js").then((m) => m.montarAcerto(cv.closest(".ac-palco3d"), c.s.equipe)).then((x) => { carro3d = x; montando = false; ajustar3d(A().lerGuardado(id) || A().PADRAO); cv.closest(".ac-palco")?.classList.add("ac-3d-pronto"); })
      .catch((e) => { montando = false; console.warn("acerto: carro 3D indisponível", e); });
  });
}
// os deslizantes: guardam na hora e atualizam o desenho, os números e os medidores sem redesenhar a tela
document.addEventListener("input", (e) => {
  const k = e.target?.dataset?.cxAcerto; if (!k) return;
  const ctx = root.CentralAcerto._ctx, id = ctx && ctx.prox && ctx.prox.pista; if (!id) return;
  const a = { ...(A().lerGuardado(id) || A().PADRAO), [k]: +e.target.value }; A().guardar(id, a);
  const raiz = document.querySelector(".ac"); if (!raiz) return;
  raiz.setAttribute("style", estilo(a)); raiz.classList.toggle("ac-raspa", A().numeros(a).folgaCm < 0);
  const v = (c) => raiz.querySelector(`[data-cx-acerto-v="${c}"]`);
  if (v("asa")) v("asa").textContent = Math.round(A().forcaDaAsa(a) * 100) + "%";
  if (v("altura")) v("altura").textContent = A().cm(a);
  const ef = raiz.querySelector("[data-cx-acerto-efeito]"); if (ef) ef.textContent = A().efeito(a);
  const med = raiz.querySelector("[data-cx-acerto-med]"); if (med) med.innerHTML = medidores(a);
  ajustar3d(a);
});
function clique(b, render) {
  const ctx = root.CentralAcerto._ctx, id = ctx && ctx.prox && ctx.prox.pista;
  if (b.dataset.cxAcertoUsar && id) { const a = sugestoes(ctx, id)[b.dataset.cxAcertoUsar]; if (a) A().guardar(id, a); render(); return true; }
  if (b.hasAttribute("data-cx-acerto-padrao") && id) { A().guardar(id, A().PADRAO); render(); return true; }
  return false;
}
root.CentralAcerto = { html: (c) => { root.CentralAcerto._ctx = c; montar3d(c); return html(c); }, clique, _ctx: null };
})(typeof window !== "undefined" ? window : globalThis);
