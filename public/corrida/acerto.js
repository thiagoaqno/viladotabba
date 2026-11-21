// Corrida da Galera — o painel de ACERTO (tecla P na corrida; teclas.js, ação "acerto"):
//  - o ACERTO DO CARRO da pista da corrida (acerto-carro.js: asa e altura, um por pista), com a proposta do engenheiro e a sugestão do
//    estrategista (o melhor acerto medido da pista, acerto-ideal.json; o estrategista de base erra um pouco), cada uma com "Usar";
//  - o ACERTO DA DIREÇÃO (window.Volante.ACERTO, volante.js: virada, tempo até o batente, volta ao centro e curva do analógico), que só
//    mexe na ENTRADA do jogador. "Copiar valores" põe os números da direção na área de transferência para virarem o padrão do jogo.
// O painel abre sozinho no grid da primeira corrida numa pista sem acerto guardado (jogo.js).
import { E, me, sNow, toast } from "./estado.js";
// O acerto só se mexe ANTES da largada (corrida) ou da abertura da sessão (classificação), como no parque fechado da F1. No jogo local
// (localhost) o painel continua abrindo durante a corrida, para o Thiago acertar a direção jogando (pedido dele, 2026-11-11).
const LOCAL = typeof location !== "undefined" && /^(localhost|127.0.0.1|[::1])$/.test(location.hostname) && !window.CORRIDA_PC?.pc; // (o programa de PC também roda em 127.0.0.1, mas é jogo de verdade)
// No contrarrelógio (e no treino livre da carreira, que é um contrarrelógio: menu.js, ?treino=) não há parque fechado: o acerto muda com o carro andando.
// (desde 2026-11-11 vale a sessão inteira, não só depois das luzes: o acerto é só no lobby, nem na transmissão nem no grid)
// (nas pausas da classificação, a tela de ajustes entre Q1, Q2 e Q3 e a do grid, o acerto também muda: o Thiago, 2026-11-14)
const valendo = () => { const S = E.S; return !!S && !S.config?.contrarrelogio && (S.phase === "race" || (S.phase === "quali" && !(S.quali && S.quali.pausa && !S.quali.carregando))); };
import { ACERTO_CARRO, acertarCarro, acertoCarroPadrao, usarAcerto, alturaParada, forcaDaAsa, pistaDoAcerto, carregarIdeais, sugestaoDoEstrategista, propostaDoEngenheiro, frase } from "./acerto-carro.js";
const CAMPOS = [
  { id: "virada", nome: "Virada máxima", dica: "o quanto o volante vira com a tecla no fim (1 = o batente da física)", passo: 0.01, fmt: (v) => v.toFixed(2) },
  { id: "sobe", nome: "Tempo até o batente", dica: "segundos segurando a tecla até a virada máxima", passo: 0.01, fmt: (v) => v.toFixed(2) + " s" },
  { id: "volta", nome: "Volta ao centro", dica: "segundos para o volante voltar ao soltar a tecla", passo: 0.005, fmt: (v) => v.toFixed(3) + " s" },
  { id: "curva", nome: "Curva do analógico", dica: "controle: maior = mais macio no começo do curso", passo: 0.05, fmt: (v) => v.toFixed(2) },
];
const CAMPOS_CARRO = [
  { id: "asa", nome: "Asa (downforce)", dica: "mais asa: mais aderência na curva e na freada, mais arrasto (menos velocidade na reta)", fmt: () => Math.round(forcaDaAsa(ACERTO_CARRO) * 100) + "%" },
  { id: "altura", nome: "Altura do carro", dica: "mais baixo: um pouco mais de aderência, até raspar o assoalho (faísca, perde carga e freia); mais alto: nunca raspa", fmt: () => (alturaParada(ACERTO_CARRO) * 100).toFixed(1).replace(".", ",") + " cm" },
];
const NIVEIS = ["de base", "experiente", "de elite"];
// (2026-11-21, as telas novas do Thiago: a tela "Acerto do carro") o painel tem dois jeitos: na corrida (tecla P), compacto no canto, como sempre;
// aberto da sala ou do menu (`alternarAcerto(true, { sala: true, desenhar })`), grande no meio da tela: o carro de lado (quem chama desenha, porque
// carros.js não pode entrar aqui), a asa e a altura em barras largas, o engenheiro e o estrategista em balões e o gráfico da carga na curva e do
// arrasto na reta nas 5 posições da asa (a mesma conta da física: AcertoSugestao.numeros). O desenho é de sala-f1.css (.ac).
let painel = null, atualizar = () => {}, opcoes = {};
const sugestoes = { engenheiro: null, estrategista: null };
// o nível do estrategista: o da carreira (S.estrategistas, por equipe); fora da carreira, o experiente
function nivelDoEstrategista() {
  const S = E.S, m = me();
  if (S && S.estrategistas && m) return Math.max(0, Math.min(2, S.estrategistas[m.equipe] || 0));
  return 1;
}
async function desenharSugestoes() {
  const caixa = painel && painel.querySelector("[data-sugestoes]"), id = pistaDoAcerto();
  if (!caixa) return;
  if (!id) { caixa.innerHTML = ""; return; }
  const ideal = (await carregarIdeais())[id], nivel = nivelDoEstrategista();
  sugestoes.engenheiro = propostaDoEngenheiro(ideal); sugestoes.estrategista = sugestaoDoEstrategista(ideal, id, nivel);
  if (!ideal) { caixa.innerHTML = `<small class="ac-sem">Sem a medição desta pista ainda.</small>`; return; }
  const linha = (quem, nome, a) => `<div class="ac-balao" data-quem="${quem}"><i class="ac-rosto" aria-hidden="true"></i><div><b>${nome}</b><p>“${frase(a)}”</p></div><button type="button" data-usar="${quem}" title="Pôr este acerto no carro">Usar</button></div>`;
  caixa.innerHTML = linha("engenheiro", "Engenheiro", sugestoes.engenheiro) + linha("estrategista", `Estrategista ${NIVEIS[nivel]}`, sugestoes.estrategista);
}
// o gráfico: a carga na curva e o arrasto na reta (em % do carro padrão) nas 5 posições da asa, com a altura de agora; a posição mais perto da asa
// de agora fica marcada
function desenharGrafico() {
  const el = painel && painel.querySelector("[data-graf]"), N = window.AcertoSugestao?.numeros; if (!el || !N) return;
  const pos = [0, 0.25, 0.5, 0.75, 1], dados = pos.map((x) => ({ x, n: N({ ...ACERTO_CARRO, asa: x }) }));
  const vals = dados.flatMap((d) => [d.n.carga, d.n.arrasto]), mn = Math.min(0, ...vals), mx = Math.max(1, ...vals), alt = (v) => 8 + ((v - mn) / (mx - mn || 1)) * 92;
  const perto = pos.reduce((b, x) => (Math.abs(x - ACERTO_CARRO.asa) < Math.abs(b - ACERTO_CARRO.asa) ? x : b), pos[0]);
  const sinal = (v) => (v > 0 ? "+" : "") + v + "%";
  el.innerHTML = `<header><i class="ac-ico-graf" aria-hidden="true"></i><b>Carga na curva × arrasto na reta</b><small>em % do carro padrão, com a altura de agora</small><span class="ac-leg"><i class="c"></i>Carga<i class="a"></i>Arrasto</span></header>
    <div class="ac-barras">${dados.map((d) => `<button type="button" class="ac-grupo ${d.x === perto ? "on" : ""}" data-asa-ir="${d.x}" title="Asa ${Math.round(forcaDaAsa({ asa: d.x }) * 100)}%: carga ${sinal(d.n.carga)}, arrasto ${sinal(d.n.arrasto)}. Clique para usar esta asa"><span class="ac-par"><i class="c" style="height:${alt(d.n.carga).toFixed(1)}%"><em>${sinal(d.n.carga)}</em></i><i class="a" style="height:${alt(d.n.arrasto).toFixed(1)}%"><em>${sinal(d.n.arrasto)}</em></i></span><small>Asa ${Math.round(forcaDaAsa({ asa: d.x }) * 100)}%</small></button>`).join("")}</div>`;
}
function montar() {
  const V = window.Volante;
  painel = document.createElement("div");
  painel.id = "acertoPainel"; painel.className = "ac";
  painel.setAttribute("role", "dialog"); painel.setAttribute("aria-label", "Acerto do carro e da direção");
  const linhas = CAMPOS.map((c) => {
    const [a, b] = V.ACERTO_LIMITES[c.id];
    return `<label class="ac-linha"><span><b>${c.nome}</b><output data-v="${c.id}"></output></span>
      <input type="range" data-c="${c.id}" min="${a}" max="${b}" step="${c.passo}"><small>${c.dica}</small></label>`;
  }).join("");
  painel.innerHTML = `<div class="ac-fundo" data-fechar></div><div class="ac-caixa">
    <header class="ac-cab"><span class="ac-logo" data-logo></span><div><h2>Acerto do carro</h2><small data-pista></small></div><button type="button" class="ac-x" data-fechar aria-label="Fechar">✕</button></header>
    <div class="ac-corpo">
      <div class="ac-esq">
        <canvas class="ac-carro" data-carro width="720" height="405" aria-hidden="true"></canvas>
        <label class="ac-barra" title="${CAMPOS_CARRO[0].dica}"><i class="ac-ico asa" aria-hidden="true"></i><b>Asa</b><output data-vc="asa"></output>
          <input type="range" data-cc="asa" min="0" max="1" step="0.01" aria-label="Asa (downforce)"><span class="ac-pontas"><small>Menos asa: mais reta</small><small>Mais asa: mais curva</small></span></label>
        <label class="ac-barra" title="${CAMPOS_CARRO[1].dica}"><i class="ac-ico altura" aria-hidden="true"></i><b>Altura</b><output data-vc="altura"></output>
          <input type="range" data-cc="altura" min="0" max="1" step="0.01" aria-label="Altura do carro"><span class="ac-pontas"><small>Baixo</small><small>Alto</small></span></label>
        <div class="ac-raspa" data-raspa-vel></div>
      </div>
      <div class="ac-dir" data-sugestoes></div>
    </div>
    <section class="ac-graf" data-graf></section>
    <div class="ac-acoes"><button type="button" data-padrao-carro>Carro padrão (tudo no meio)</button></div>
    <details class="ac-direcao"><summary>Acerto da direção</summary>${linhas}
      <div class="ac-acoes"><button type="button" data-padrao>Direção padrão</button><button type="button" class="forte" data-copiar>Copiar valores</button></div></details>
    <small class="ac-rodape">P abre e fecha. O acerto do carro fica guardado para esta pista.</small></div>`;
  document.body.appendChild(painel);
  atualizar = () => {
    const id = pistaDoAcerto(), nome = id && window.Pistas?.PISTAS?.[id]?.name;
    painel.querySelector("[data-pista]").textContent = nome ? `Para ${nome}` : "";
    { const el = painel.querySelector("[data-raspa-vel]"), vr = window.AcertoSugestao?.raspaKmh(ACERTO_CARRO); if (el) { el.textContent = vr == null ? "Não raspa em nenhuma velocidade" : `Começa a raspar no chão a ${vr} km/h`; el.classList.toggle("raspa", vr != null); } }
    for (const c of CAMPOS_CARRO) { painel.querySelector(`[data-cc="${c.id}"]`).value = ACERTO_CARRO[c.id]; painel.querySelector(`[data-vc="${c.id}"]`).textContent = c.fmt(); }
    for (const c of CAMPOS) { painel.querySelector(`[data-c="${c.id}"]`).value = V.ACERTO[c.id]; painel.querySelector(`[data-v="${c.id}"]`).textContent = c.fmt(V.ACERTO[c.id]); }
    desenharGrafico();
  };
  painel.addEventListener("input", (e) => { const c = e.target.dataset.c, cc = e.target.dataset.cc; if (c) { V.acertar(c, e.target.value); atualizar(); } if (cc) { acertarCarro(cc, e.target.value); atualizar(); } });
  painel.addEventListener("keydown", (e) => { if (e.key === "Escape") { alternarAcerto(false); e.preventDefault(); } e.stopPropagation(); }); // (as setas nos controles deslizantes não pilotam nem mexem no MFD)
  painel.addEventListener("click", (e) => {
    const usar = e.target.closest("[data-usar]"), ir = e.target.closest("[data-asa-ir]");
    if (usar) { const a = sugestoes[usar.dataset.usar]; if (a) { usarAcerto(a); atualizar(); } }
    else if (ir) { acertarCarro("asa", ir.dataset.asaIr); atualizar(); }
    else if (e.target.closest("[data-fechar]")) alternarAcerto(false);
    else if (e.target.closest("[data-padrao]")) { V.acertoPadrao(); atualizar(); }
    else if (e.target.closest("[data-padrao-carro]")) { acertoCarroPadrao(); atualizar(); }
    else if (e.target.closest("[data-copiar]")) { const txt = JSON.stringify(V.ACERTO); try { navigator.clipboard.writeText(txt); } catch (err) {} e.target.textContent = "Copiado!"; setTimeout(() => { e.target.textContent = "Copiar valores"; }, 1500); }
  });
}
const aberto = () => !!painel && !painel.classList.contains("fechado");
export function alternarAcerto(abrir, op) {
  if (abrir !== false && valendo() && !LOCAL && !aberto()) { toast("O acerto do carro só muda no lobby ou nas pausas da classificação."); return; }
  if (!painel) montar();
  const ver = abrir ?? !aberto();
  if (ver) opcoes = op || {};
  painel.classList.toggle("fechado", !ver); painel.classList.toggle("ac-sala", ver && !!opcoes.sala);
  document.body.classList.toggle("ac-aberto", ver && !!opcoes.sala);
  if (ver) {
    atualizar(); desenharSugestoes();
    const cv = painel.querySelector("[data-carro]"), logo = painel.querySelector("[data-logo]");
    cv.hidden = !opcoes.desenhar; if (opcoes.desenhar) { try { opcoes.desenhar(cv); } catch (err) { cv.hidden = true; } }
    logo.innerHTML = opcoes.logo || "";
    if (opcoes.cor) painel.style.setProperty("--ac-eq", opcoes.cor); else painel.style.removeProperty("--ac-eq");
    if (opcoes.sala) painel.querySelector('[data-cc="asa"]')?.focus({ preventScroll: true });
  }
}
// as luzes apagaram com o painel aberto: ele fecha (fora do jogo local)
setInterval(() => { if (aberto() && valendo() && !LOCAL) { alternarAcerto(false); toast("A sessão começou: o acerto ficou como estava."); } }, 1000);
