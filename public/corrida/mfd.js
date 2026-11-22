// Corrida da Galera — o MFD (multi-function display) do HUD de F1: o painel embaixo à direita, com páginas que se alternam.
// Só nas regras de F1. As contas ficam em hud-mfd.js (HudMfd); aqui são o DOM (criado uma vez, atualizado só no que mudou, no ritmo do
// hudF1: ~10x por segundo, e só da página que está à vista) e a entrada: teclado (M/N páginas, Tab ajustar), controle (R3/L3 páginas,
// Start ajustar) e toque (o botão MFD abre e fecha; as abas e as setas ‹ › do painel são clicáveis).
//
// As SETAS são do MFD (sem modo ajustar): ↑↓ escolhem a linha, ←→ mudam o valor (ou a página nas páginas sem linhas); mexer nelas abre o painel e
// reinicia os 3 s. Tudo remapeável na tela Controles (teclas.js / teclas-ui.js). Tab e Start só abrem e fecham o painel.
import { E, $, me, carOf, store, toast, PISTAS } from "./estado.js";
import { race } from "./jogo.js";
import { alternarPedido, escolherComposto, cancelarPedido, pedirNoBox, jogosDe, textoJogos } from "./box.js";
import { set } from "./hud-painel.js";
import { acoesDaTecla, teclasDe, nomeDaTecla, nomeDoBotao, botoesDe, ui } from "./teclas.js";
import { clima } from "./clima.js";

const M = () => window.HudMfd, F = () => window.F1Regras;
export const mfd = { aberto: true, pagina: "resumo", lista: [], linha: {}, ultimo: 0, entrada: "teclado" };
// o que controles.js registra (a câmera e a torre são dele e do hud.js): { camera(d), torre(): alterna compacta/completa }
import { estiloHud, definirEstiloHud, ESTILOS_HUD } from "./hud-telemetria.js";
export const acoes = { camera: null, cameraAjuste: null, camNome: () => "", radioRival: null, torreCompacta: () => true, torreAlternar: null, mapaPerto: () => false, mapaAlternar: null };
const LEITURA = {}; // os últimos dados que o hud passou (as linhas do painel leem daqui)
let raiz = null, refs = {}, abas = "", paginaVista = null;

const coarse = () => matchMedia("(pointer:coarse)").matches || innerWidth < 700;
const lerAberto = () => { try { const v = store.get("corrida:mfd"); if (typeof v === "boolean") return v; } catch (e) {} return !coarse(); };
const guardarAberto = () => { try { store.set("corrida:mfd", mfd.aberto); } catch (e) {} };

// ---------- as páginas (o HTML de cada uma, montado uma vez) ----------
const CARRO = (cls) => `<svg class="mp-carro ${cls}" viewBox="0 0 90 120" aria-hidden="true"><rect class="mp-asa" x="18" y="2" width="54" height="7" rx="2"/><rect class="mp-roda" data-r="w0" x="3" y="14" width="19" height="28" rx="5"/><rect class="mp-roda" data-r="w1" x="68" y="14" width="19" height="28" rx="5"/><rect class="mp-roda" data-r="w2" x="2" y="72" width="21" height="30" rx="5"/><rect class="mp-roda" data-r="w3" x="67" y="72" width="21" height="30" rx="5"/><path class="mp-corpo" data-r="corpo" d="M42 9h6l2 22 9 9v22l-5 8 3 28H33l3-28-5-8V40l9-9z"/><rect class="mp-asa" data-r="asaT" x="16" y="108" width="58" height="8" rx="2"/></svg>`;
// os ícones das abas (como no jogo: um por página)
const ICONE = {
  resumo: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>',
  pedidos: '<path d="M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v6H4zM17 14h3v6h-3z"/>',
  jogos: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/>',
  condicoes: '<path d="M7 18h10a4 4 0 0 0 .5-8 6 6 0 0 0-11.4 1.6A3.3 3.3 0 0 0 7 18z"/>',
  pneus: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>', danos: '<path d="M14.5 5.5a4 4 0 0 0-5 5L4 16l4 4 5.5-5.5a4 4 0 0 0 5-5l-2.5 2.5-2.5-.5-.5-2.5z"/>',
  ers: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>', box: '<path d="M4 21V4M4 5h13l-2 4 2 4H4"/>', tempos: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 1.5M9.5 2.5h5"/>',
  classificacao: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>', ajustes: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
  radio: '<path d="M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v6H4zM17 14h3v6h-3z"/>',
};
const icone = (id) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONE[id] || ""}</svg>`;
const linhasDe = (id) => `<div class="mr-lista" data-linhas="${id}"></div>`;
// os pedidos da aba Pedidos: [o que é, o que dizer, o comando do Jeff]
const PEDIDOS = [
  ["Atualização completa", "me atualiza", { tipo: "completa" }], ["Estado dos pneus", "como estão os pneus", { tipo: "pneus" }],
  ["Condição do carro", "como está o carro", { tipo: "carro" }], ["Previsão do tempo", "vai chover?", { tipo: "previsao" }],
  ["Quem está na frente", "quem está na frente", { tipo: "frente" }], ["Quem está atrás", "quem está atrás", { tipo: "tras" }],
  ["Diferença para a frente", "qual o gap da frente", { tipo: "gapFrente" }], ["Diferença do companheiro", "e o meu companheiro?", { tipo: "gapCompanheiro" }],
  ["Box nesta volta", "box", { tipo: "box" }], ["Box com macio", "box, macio", { tipo: "box", composto: "macio" }],
  ["Box com médio", "box, médio", { tipo: "box", composto: "medio" }], ["Box com duro", "box, duro", { tipo: "box", composto: "duro" }],
  ["Box com intermediário", "box, intermediário", { tipo: "box", composto: "intermediario" }], ["Box com chuva", "box, pneu de chuva", { tipo: "box", composto: "chuva" }],
];
const HTML = {
  // (2026-11-16, o Thiago: "o Caps Lock deve abrir o MFD com TODOS os pedidos possíveis legendados: o piloto pode falar ou apertar uma fala") a aba
  // Pedidos: cada pedido que o Jeff entende (jeff-comandos.js), com o que dizer; clicar faz o mesmo que falar (executarJeff). A única aba maior.
  pedidos: `<div class="m3 m3-ped"><header class="m3-ped-t"><b>PEDIDOS AO ENGENHEIRO</b><small>fale com o Caps Lock apertado ou clique</small></header><div class="m3-ped-g">${PEDIDOS.map(([rot, diga, cmd]) => `<button type="button" class="m3-ped-i" data-cmd='${JSON.stringify(cmd)}'><b>${rot}</b><small>“${diga}”</small></button>`).join("")}</div></div>`,
  // (2026-11-16, a imagem do Thiago: "o MFD resumo e minimalista") uma faixa: o pneu (anel da vida com a letra; voltas nele / voltas que aguenta), o carro
  // (condição), a pista (o estado; o jogo não mede a temperatura) e o mini mapa (você na cor da equipe, o líder em amarelo, a chegada quadriculada);
  // embaixo, o carro da frente, a diferença para ele e o carro de trás. Cada bloco leva à sua página.
  resumo: `<div class="rs3">
    <div class="rs3-l">
      <button type="button" class="rs3-c rs3-pn" data-ir="jogos" title="Pneus e box"><span class="rs3-anel"><svg viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="18" class="tr"/><circle cx="22" cy="22" r="18" class="vl" data-r="rpAnel"/></svg><b data-r="rpL">M</b></span><em data-r="rpV">—</em></button>
      <button type="button" class="rs3-c rs3-dn" data-ir="danos" title="Danos"><svg class="rs3-carro" viewBox="0 0 30 46" aria-hidden="true"><rect x="6" y="1" width="18" height="4" rx="1" class="asa"/><path d="M15 3 L18 15 L19 33 L21 42 L9 42 L11 33 L12 15 Z" class="corpo" data-r="rdCorpo"/><rect x="1" y="9" width="6" height="9" rx="2" class="rd"/><rect x="23" y="9" width="6" height="9" rx="2" class="rd"/><rect x="1" y="30" width="6" height="9" rx="2" class="rd"/><rect x="23" y="30" width="6" height="9" rx="2" class="rd"/></svg><span><strong data-r="rdT">100%</strong><i class="rs3-b"><i data-r="rdB"></i></i></span></button>
      <button type="button" class="rs3-c rs3-cl" data-ir="condicoes" title="Condições"><span class="rs3-ic" data-r="rlI"></span><strong data-r="rlT">—</strong></button>
      <div class="rs3-c rs3-mp"><svg viewBox="0 0 120 60" aria-hidden="true"><path class="pista" data-r="mpP"/><g data-r="mpCh"><rect width="5" height="5" fill="#fff"/><rect x="2.5" width="2.5" height="2.5" fill="#111"/><rect y="2.5" width="2.5" height="2.5" fill="#111"/></g><circle r="3" class="lid" data-r="mpL"/><circle r="3.6" class="eu" data-r="mpE"/></svg></div>
    </div>
    <button type="button" class="rs3-pe" data-ir="tempos" title="Tempos"><span><b data-r="frP">—</b><i></i><em data-r="frN"></em></span><span class="rs3-gap" data-r="gap">—</span><span><b data-r="trP">—</b><i></i><em data-r="trN"></em></span></button>
  </div>`,
  // como a página de pneus do jogo da EA (F1 24): o carro no meio com as 4 rodas coloridas pela temperatura e um anel de desgaste em cada canto
  // (o jogo daqui mede UM conjunto de pneus, então os quatro anéis mostram o mesmo valor); embaixo o composto, a temperatura e a previsão
  // só o essencial, grande: o pneu de agora com a vida, quantas voltas ainda aguenta e o próximo pneu (B abre o Box)
  pneus: `<div class="mp mp-pneus2"><div class="pn2-topo"><div class="anel anel-g" data-r="a0"><b></b></div><div class="pn2-txt"><div class="mp-comp"><b class="mp-bola" data-r="pLetra">M</b><span data-r="pNome">Médio</span></div><strong class="pn2-voltas" data-r="pVoltas">—</strong><span class="pn2-sub" data-r="pTempT"></span></div></div>
    <div class="pn2-prox"><span>PRÓXIMO PNEU</span><b data-r="pProx">—</b><kbd>B</kbd></div><p class="mp-nota" data-r="pNota"></p></div>`,
  danos: `<div class="m3"><section class="m3-card m3-dano" data-r="dnCard"><header><span class="m3-alerta" data-r="dnAl">!</span><b>DANOS DO CARRO</b></header>
    <div class="m3-dano-c"><svg class="m3-carro" viewBox="0 0 200 70" aria-hidden="true" data-r="dnSil"><path d="M8 35h18M174 35h18"/><rect x="2" y="12" width="12" height="46" rx="2"/><rect x="186" y="16" width="12" height="38" rx="2"/><path d="M26 35 L44 26 L70 24 L84 18 L120 18 L142 24 L168 28 L176 35 L168 42 L142 46 L120 52 L84 52 L70 46 L44 44 Z"/><path d="M90 28 Q100 22 110 28 Q100 34 90 28"/><rect x="34" y="6" width="22" height="12" rx="3"/><rect x="34" y="52" width="22" height="12" rx="3"/><rect x="146" y="5" width="24" height="13" rx="3"/><rect x="146" y="52" width="24" height="13" rx="3"/></svg>
      <div class="m3-dano-t"><strong data-r="dnPct">100%</strong><i class="m3-barra"><i data-r="dnBar"></i></i><small data-r="dnSub">sem danos</small></div></div></section></div>`,
  ers: `<div class="mp mp-ers"><div class="mp-grande"><span>BATERIA</span><b data-r="eBat">0%</b></div>
    <div class="mp-barra"><span>Carga</span><div><i data-r="eBatB"></i></div><b data-r="eEst">—</b></div>
    <div class="mp-barra"><span>Recarga da volta</span><div><i data-r="eRecB"></i></div><b data-r="eRecT">0%</b></div>
    <div class="mp-par"><span>Modo</span><b data-r="eModo">—</b></div><div class="mp-par"><span>DRS</span><b data-r="eDrs">—</b></div>
    <div class="mp-par"><span>Combustível</span><b>não medido no jogo</b></div></div>`,
  // (2026-11-16, as imagens do Thiago) três cartões: o PRÓXIMO PNEU (o desenho do pneu na cor do composto, a etiqueta e quanto resta do pneu de agora; a
  // barra embaixo é o tempo para aceitar a sugestão de box), os JOGOS DE PNEU (cada anel escolhe e pede: 1 a 5) e as CONDIÇÕES DA CORRIDA.
  // (2026-11-16, o Thiago: "eram para ser 3 abas, uma para cada") o Próximo pneu, os Jogos de pneu e as Condições, cada um na sua aba
  box: `<div class="m3">
    <section class="m3-card m3-prox" data-r="pxCard"><header><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5M10 2.5h4"/></svg><b data-r="pxTit">PRÓXIMO PNEU</b></header>
      <div class="m3-prox-c"><svg class="m3-pneu" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="57" class="borracha"/><circle cx="60" cy="60" r="44" class="flanco"/><circle cx="60" cy="60" r="40" class="faixa" data-r="pxFaixa"/><circle cx="60" cy="60" r="30" class="aro"/><g class="raios">${Array.from({ length: 10 }, (_, i) => `<line x1="60" y1="60" x2="${(60 + 28 * Math.cos(i * Math.PI / 5)).toFixed(1)}" y2="${(60 + 28 * Math.sin(i * Math.PI / 5)).toFixed(1)}"/>`).join("")}</g><circle cx="60" cy="60" r="8" class="cubo"/></svg>
        <div class="m3-prox-t"><b class="m3-chip" data-r="pxChip">MÉDIO</b><strong data-r="pxPct">—</strong><small data-r="pxSub">RESTANTES</small></div></div>
      <p class="m3-nota" data-r="pxMot"></p><i class="m3-tempo"><i data-r="pxBar"></i></i></section>
  </div>`,
  jogos: `<div class="m3">
    <section class="m3-card m3-jogos"><header><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/></svg><b>JOGOS DE PNEU</b></header>
      <div class="m3-jg">${["duro", "medio", "macio", "intermediario", "chuva"].map((c, i) => `<button type="button" class="bx-btn m3-jg-i" data-c="${c}" data-r="bx${c}" aria-label="${F().PNEUS[c].nome}: pedir"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="15"/></svg><span></span><kbd>${[3, 2, 1, 5, 4][i]}</kbd></button>`).join("")}</div>
      <p class="m3-nota" data-r="bInfo"></p></section>
  </div>`,
  condicoes: `<div class="m3">
    <section class="m3-card m3-cond"><header><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18h10a4 4 0 0 0 .5-8 6 6 0 0 0-11.4 1.6A3.3 3.3 0 0 0 7 18z"/><circle cx="17" cy="6" r="2" stroke="#ffd23f"/><path d="M17 1.5v1M21 6h1M20.2 2.8l-.7.7" stroke="#ffd23f"/></svg><b>CONDIÇÕES DA CORRIDA</b></header>
      <div class="m3-cond-g"><div><strong data-r="cdAr">—</strong><small>AR</small></div><div><strong data-r="cdPista">—</strong><small>PISTA</small></div><div><span class="m3-cond-ic" data-r="cdIco"></span><small data-r="cdEst">—</small></div></div></section>
  </div>`,
  tempos: `<div class="mp mp-tempos"><div class="mp-par"><span>Volta atual</span><b data-r="tAtual">0:00.000</b></div><div class="mp-par"><span>Corrida</span><b data-r="tCorrida">0:00.0</b></div><div class="mp-par"><span>Última volta</span><b data-r="tUlt">—:--.---</b></div><div class="mp-par"><span>Melhor volta</span><b data-r="tMelhor">—:--.---</b></div>
    <div class="mp-par"><span>Volta mais rápida</span><b class="roxo" data-r="tVR">—</b></div>
    <div class="mp-par frente"><span>Carro da frente</span><b data-r="tFrente">—</b></div><div class="mp-par tras"><span>Carro de trás</span><b data-r="tTras">—</b></div></div>`,
  classificacao: `<div class="mp mp-classif" data-r="cLista">${'<div class="cl-r hidden"><b></b><i></i><span></span><em></em><u></u></div>'.repeat(24)}</div>`,
  ajustes: `<div class="mp mp-ajustes">${linhasDe("ajustes")}<div class="mp-par"><span>ERS</span><b data-r="aErs">—</b></div><p class="mp-nota mp-fraca">Balanço de freio e mistura de combustível não existem neste carro.</p></div>`,
  radio: `<div class="mp mp-ajustes">${linhasDe("radio")}<p class="mp-nota">Selecione e confirme para pedir informações ao engenheiro.</p><p class="mp-nota" data-r="radioResposta" aria-live="polite"></p></div>`,
};

function pedirRadio(tipo) {
  const m = LEITURA.m; if (!m || !race) return;
  let situacao, texto;
  if (tipo === "carro") {
    const d = Math.round(m.dano || 0);
    situacao = d >= 66 ? "diagnosticograve" : d >= 15 ? "diagnosticomedio" : "diagnosticobom";
    texto = d >= 66 ? um("carro3", [`dano de ${d}%. O carro está muito machucado, cuidado.`, `${d}% de dano. Leve com calma até o fim.`, `situação grave: ${d}% de dano.`])
      : d >= 15 ? um("carro2", [`dano de ${d}%. Dá para seguir, mas perdemos rendimento.`, `${d}% de dano no carro. Evite os contatos.`, `o carro tem ${d}% de dano. Nada crítico.`])
      : um("carro1", [`carro em ordem: ${d}% de dano.`, `tudo certo com o carro, ${d}% de dano.`, `sem problemas no carro (${d}% de dano).`]);
  } else if (tipo === "pneus") {
    if (!race.pneu) texto = "Dados dos pneus indisponíveis.";
    else { const vida = Math.round(F().vidaRestante(race.pneu) * 100); situacao = vida < 35 ? "pneusgastos" : "pneusbons"; const pn = F().PNEUS[race.pneu.composto], nomeP = pn ? pn.nome.toLowerCase() : "pneu";
      texto = vida < 20 ? um("pneu3", [`os pneus estão no fim: ${vida}% de vida. Pense no box.`, `${vida}% de vida no ${nomeP}. Está na hora de parar.`, `quase sem borracha: ${vida}%.`])
        : vida < 50 ? um("pneu2", [`pneu ${nomeP} com ${vida}% de vida.`, `${vida}% de vida. Ainda aguenta, mas administre.`, `os pneus estão na metade da vida: ${vida}%.`])
        : um("pneu1", [`pneus bons: ${vida}% de vida no ${nomeP}.`, `${vida}% de vida. O ${nomeP} está ótimo.`, `pneu ${nomeP} inteiro: ${vida}%.`]); }
  } else {
    situacao = clima.agua > 0.15 ? "corridachuva" : "corridaseca";
    const q = E.S.phase === "quali" ? E.S.quali : null;
    const pos = q ? q.tabela.findIndex(r => r.id === m.id) + 1 : LEITURA.st.findIndex(r => r.id === m.id) + 1;
    texto = `${q ? `Classificação: ${pos ? pos + "º" : "sem tempo"}` : `Posição: ${pos || "—"}/${LEITURA.st.length}`}. Pista ${clima.agua > 0.15 ? "molhada" : "seca"}.`;
  }
  if (refs.r.radio?.radioResposta) set(refs.r.radio.radioResposta, "t", texto);
  if (situacao && window.Radio) window.Radio.dizer(situacao, { forcar: true });
  return texto;
}

// ---------- o Jeff: os comandos de voz (voz.js ouve, jeff-comandos.js entende, aqui ele faz e responde) ----------
// Cada comando faz o mesmo que o MFD ou as teclas fariam e o Jeff responde no rádio (as falas de radio/falas.js; a que ainda não tem mp3 fica
// muda) e por escrito, num aviso na tela. `falado`: o que o reconhecimento ouviu (vai no aviso quando ele não entende).
const seg1 = (s) => (s == null ? "—" : s >= 60 ? "mais de um minuto" : `${s.toFixed(1).replace(".", ",")} s`);
const jeff = (texto, ms = 3800) => toast("🎧 Jeff: " + texto, ms);
// uma das variações (sem repetir a última dita daquele tipo): o Jeff não responde sempre igual
const ultimaVar = {};
function um(tipo, lista) { const op = lista.length > 1 ? lista.filter((_, i) => i !== ultimaVar[tipo]) : lista, x = op[Math.floor(Math.random() * op.length)]; ultimaVar[tipo] = lista.indexOf(x); return x; }
export function executarJeff(cmd, falado = "") {
  const R = window.Radio, Fr = window.RadioFalas, m = LEITURA.m || me(), f1 = E.S && E.S.config && E.S.config.regras === "f1";
  if (!cmd) { jeff(falado ? um("naoentendi", [`não entendi “${falado}”. Tente “box”, “como estão meus pneus” ou “quem está na frente”.`, `“${falado}”? Não peguei. Pode pedir box, pneus, carro, previsão ou quem está perto.`, `rádio cortou: ouvi “${falado}”. Repete? Ex.: “atualização completa”.`]) : um("naoouvi", ["não ouvi nada. Aperte e fale logo depois do bipe.", "silêncio no rádio. Fale depois do bipe.", "não chegou nada aqui. Tenta de novo?"]), 4200); R?.dizer("jeffnaoentendi", { forcar: true }); return; }
  if (!race || !m || !f1 || E.S.phase !== "race") { jeff("só na corrida de F1."); return; }
  const P = F().PNEUS, nome = (c) => (P[c] ? P[c].nome.toLowerCase() : c);
  if (cmd.tipo === "box" || cmd.tipo === "pneu") {
    const B = race.box; if (!B) { jeff("sem box nesta corrida."); return; }
    if (B.fase) { jeff(um("jabox", ["você já está no box.", "calma, já estamos no box.", "já está no pit lane."])); return; }
    const c = cmd.composto || (B.pedido && B.pedido !== "decidir" ? B.pedido : proximo());
    if (B.pedido === c) { jeff(um("japedido", [`box já pedido, pneu ${nome(c)}.`, `já está confirmado: ${nome(c)} nesta volta.`, `copiado, o ${nome(c)} já está separado.`])); R?.dizer("box" + c, { forcar: true, reserva: "box" }); return; }
    escolherComposto(c); // (box.js recusa sozinho a última volta e o pneu esgotado, com o aviso dele)
    if (race.box.pedido === c) { mfd.prox = null; jeff(um("box", [`box nesta volta, pneu ${nome(c)}.`, `entendido. Box, box, vamos de ${nome(c)}.`, `confirmado: entre nesta volta, ${nome(c)} pronto.`, `a equipe está pronta com o ${nome(c)}. Box nesta volta.`])); mexeu(); atualizarLinhas(); } // (a fala de box confirmado sai do box.js avisar)
    return;
  }
  if (cmd.tipo === "pneus" || cmd.tipo === "carro") { const t = pedirRadio(cmd.tipo); if (t) jeff(t); return; }
  if (cmd.tipo === "frente" || cmd.tipo === "tras" || cmd.tipo === "gapFrente") {
    const lado = cmd.tipo === "tras" ? "tras" : "frente", i = acoes.infoRival && acoes.infoRival(lado);
    if (!i) { jeff(lado === "frente" ? um("lider", ["ninguém à sua frente: você lidera.", "pista livre, você é o líder.", "P1. Só tem asfalto à frente."]) : um("ninguematras", ["ninguém atrás de você.", "retrovisor limpo.", "atrás está vazio, pode respirar."])); if (lado === "frente") acoes.radioRival?.("frente"); return; }
    { const pn = i.pneu && P[i.pneu] ? `, de ${nome(i.pneu)}` : "", gasto = i.desg >= 60 ? " Os pneus dele estão no fim." : "";
      jeff(lado === "frente" ? um("frente", [`à sua frente, ${i.nome}, a ${seg1(i.seg)}${pn}.${gasto}`, `o carro da frente é ${i.nome}, ${seg1(i.seg)} à frente${pn}.${gasto}`, `${i.nome} logo à frente, a ${seg1(i.seg)}${pn}.${gasto}`])
        : um("tras", [`atrás de você, ${i.nome}, a ${seg1(i.seg)}${pn}.${gasto}`, `no retrovisor, ${i.nome}, ${seg1(i.seg)} atrás${pn}.${gasto}`, `${i.nome} vem atrás, a ${seg1(i.seg)}${pn}.${gasto}`])); }
    acoes.radioRival?.(lado); return;
  }
  if (cmd.tipo === "gapCompanheiro") {
    const i = acoes.infoCompanheiro && acoes.infoCompanheiro();
    if (!i) { jeff(um("semcompanheiro", ["seu companheiro de equipe não está na pista.", "o outro carro da equipe não está correndo.", "sem companheiro na pista agora."])); return; }
    jeff(i.frente ? um("compfrente", [`seu companheiro, ${i.nome}, está à frente, a ${seg1(i.seg)}.`, `${i.nome} está ${seg1(i.seg)} à sua frente.`, `o outro carro da equipe, ${i.nome}, vai à frente: ${seg1(i.seg)}.`]) : um("comptras", [`seu companheiro, ${i.nome}, está atrás, a ${seg1(i.seg)}.`, `${i.nome} vem ${seg1(i.seg)} atrás de você.`, `você está à frente do ${i.nome} por ${seg1(i.seg)}.`]));
    if (R && Fr && i.seg != null) R.frase([R.pedaco(i.frente ? "companheirofrente" : "companheirotras"), Fr.pecaDoNome(i.nome), Fr.pecaDoGap(i.seg)].filter(Boolean), "rival", { forcar: true });
    return;
  }
  if (cmd.tipo === "previsao") { jeff(textoPrevisao(m)); return; }
  if (cmd.tipo === "estrategia") { // (2026-11-21) a próxima parada do plano da equipe (paddock.js estrategia: m.paradasEquipe) e o plano do domingo
    const voltas = E.S.config.voltas, agora = Math.min(voltas, (m.laps || 0) + 1), pl = m.paradasEquipe || null, prox = pl ? pl.find((q) => q.volta >= agora) : null;
    const PLANOS = { arriscar: "ataque total", seguro: "jogar seguro", largada: "largada forte", final: "guardar para o fim", pneu: "esticar os pneus" }, PD = F().PLANOS_DOMINGO || {};
    const fase = m.plano && PD[m.plano] && PD[m.plano].ate != null ? Math.floor(PD[m.plano].ate * voltas) + 1 : null;
    const domingo = m.plano && PLANOS[m.plano] ? ` Plano do domingo: ${PLANOS[m.plano]}${fase ? (m.plano === "final" ? `, ataque a partir da volta ${fase}` : `, até a volta ${fase - 1}`) : ""}.` : "";
    const vida = race.pneu ? ` Pneu ${nome(race.pneu.composto)} com ${Math.round(F().vidaRestante(race.pneu) * 100)}% de vida.` : "";
    if (pl) {
      const resto = prox ? pl.filter((q) => q.volta > prox.volta) : [];
      jeff(prox ? `${prox.volta === agora ? "box nesta volta" : `próxima parada na volta ${prox.volta}`}, pneu ${nome(prox.composto)}${resto.length ? `; depois, ${resto.map((q) => `na ${q.volta} (${nome(q.composto)})`).join(" e ")}` : ""}.${vida}${domingo}`
        : `o plano não tem mais parada: leve até o fim.${vida}${domingo}`, 7000);
      if (R) R.frase(prox ? ["estrategiaparada", `volta-${Math.min(60, prox.volta)}`, `estrategia${prox.composto}`] : ["estrategiafim"], "objetivo", { forcar: true });
    } else {
      const t = pedirRadio("pneus");
      jeff(`não fechamos um plano de paradas: quem decide é você.${vida}${domingo}${t ? " " + t : ""}`, 7000);
      R?.frase?.(["estrategialivre"], "objetivo", { forcar: true });
    }
    return;
  }
  if (cmd.tipo === "completa") {
    const st = LEITURA.st || [], pos = st.findIndex((r) => r.id === m.id) + 1, fr = acoes.infoRival && acoes.infoRival("frente"), tr = acoes.infoRival && acoes.infoRival("tras");
    const vida = race.pneu ? Math.round(F().vidaRestante(race.pneu) * 100) : null, voltas = E.S.config.voltas, falta = Math.max(0, voltas - (m.laps || 0));
    const partes = [`P${pos || "—"} de ${st.length}, ${falta === 1 ? "última volta" : `faltam ${falta} voltas`}.`,
      race.pneu ? `Pneu ${nome(race.pneu.composto)} com ${vida}% de vida.` : "", `Dano: ${Math.round(m.dano || 0)}%.`,
      fr ? `À frente: ${fr.nome}, a ${seg1(fr.seg)}.` : "Você lidera.", tr ? `Atrás: ${tr.nome}, a ${seg1(tr.seg)}.` : "", textoPrevisao(m)];
    jeff(partes.filter(Boolean).join(" "), 9000);
    acoes.radioRival?.("frente"); pedirRadio("pneus"); // (o rádio fala primeiro os pneus e depois o carro da frente: os forçados entram na frente da fila)
  }
}
// o tempo: a chuva que vem (ou que para) e em que volta, pela previsão e pelo roteiro do clima; o estrategista fala a volta no rádio
function textoPrevisao(m) {
  const S = E.S, Fr = F(), R = window.Radio, ref = m.best || m.last;
  const mud = S.clima && S.clima.chove && Fr.proximaMudanca && clima.t >= 0 ? Fr.proximaMudanca(S.clima, clima.t) : null;
  const agora = clima.chuva > 0.05 ? (clima.chuva < 0.7 ? um("garoa", ["Garoa agora", "Está garoando", "Chuva fraca no momento"]) : um("forte", ["Chuva forte agora", "Está chovendo forte", "Muita água caindo agora"]))
    : clima.agua > 0.15 ? um("secando", ["Sem chuva, pista ainda molhada", "Parou de chover, mas a pista segue molhada", "Sem chuva agora; o asfalto ainda está úmido"]) : um("seco", ["Tempo seco", "Céu sem chuva", "Pista seca"]);
  if (mud && ref && (mud.tipo === "comeca" || mud.tipo === "para")) {
    const volta = (m.laps || 0) + 1 + Math.floor(mud.em / ref);
    if (volta <= S.config.voltas) { R?.frase?.([mud.tipo === "comeca" ? "chuvavolta" : "secavolta", `volta-${volta}`], "estrategista", { forcar: true }); return `${agora}. ${mud.tipo === "comeca" ? "Chuva prevista" : "A chuva deve parar"} na volta ${volta}.`; }
  }
  R?.dizer(clima.agua > 0.15 ? "corridachuva" : "corridaseca", { forcar: true });
  const d = S.previsao && Fr.descreverPrevisao ? Fr.descreverPrevisao(S.previsao, S.config.voltas) : null;
  return `${agora}. ${S.clima && S.clima.chove ? um("radar1", ["Nada muda até o fim, pelo radar.", "O radar não mostra mudança até a bandeirada.", "Deve ficar assim até o fim."]) : d && !d.seco ? um("radar2", [`${d.titulo} (${d.pct}%), mas nada no radar agora.`, `A previsão fala em ${d.pct}% de chuva; por enquanto, nada no radar.`, `${d.titulo.toLowerCase()} (${d.pct}%). Fique atento.`]) : um("radar3", ["Sem chuva prevista.", "Nenhuma nuvem de chuva no radar.", "Pode contar com pista seca."])}`;
}

// ---------- as linhas ajustáveis (setas ‹ › ): só o que o jogo de fato muda ----------
const compostosPossiveis = () => ["macio", "medio", "duro", "chuva", "intermediario"].filter((c) => jogosDe(me())[c] > 0);
const LINHAS = {
  radio: [
    { rot: "Diagnóstico do carro", valor: () => "Pedir", mudar: () => pedirRadio("carro") },
    { rot: "Estado dos pneus", valor: () => "Pedir", mudar: () => pedirRadio("pneus") },
    { rot: "Situação da corrida", valor: () => "Pedir", mudar: () => pedirRadio("corrida") },
    { rot: "Quem está à frente", valor: () => "Pedir", mudar: () => { if (!acoes.radioRival || !acoes.radioRival("frente")) toast("Ninguém por perto à frente.", 1500); } },
    { rot: "Quem está atrás", valor: () => "Pedir", mudar: () => { if (!acoes.radioRival || !acoes.radioRival("tras")) toast("Ninguém por perto atrás.", 1500); } },
  ],
  box: [
    { rot: "Próximo pneu", dica: "1–5", valor() { const B = race && race.box; if (!B) return "—"; if (B.fase) return "No box"; return B.pedido === "decidir" ? "Na garagem" : F().PNEUS[B.pedido || proximo()].nome; },
      mudar(d) {
        const B = race && race.box; if (!B || B.fase) return;
        const op = compostosPossiveis(); if (!op.length) { toast("Sem jogos de pneu: " + textoJogos(me()), 1800); return; }
        const base = B.pedido || proximo(), i = op.indexOf(base), novo = op[(i < 0 ? (d > 0 ? 0 : op.length - 1) : (i + d + op.length) % op.length)];
        if (B.pedido) escolherComposto(novo); else mfd.prox = novo; // sem pedido, só escolhe; o B (ou Enter) confirma
      } },
    { rot: "Pedir box", dica: "B", valor() { const B = race && race.box; return !B ? "—" : B.fase ? "No box" : B.pedido ? "Sim" : "Não"; },
      mudar() { alternarBox(); } },
  ],
  ajustes: [
    { rot: "Torre", valor: () => (acoes.torreCompacta() ? "Compacta" : "Completa"), mudar() { if (acoes.torreAlternar) acoes.torreAlternar(); } },
    { rot: "Câmera", valor: () => acoes.camNome(), mudar(d) { if (acoes.camera) acoes.camera(d); } },
    { rot: "Ajuste da câmera", dica: "H", valor: () => "Abrir", mudar() { if (acoes.cameraAjuste) acoes.cameraAjuste(); } },
    { rot: "Mapa", valor: () => (acoes.mapaPerto() ? "Perto" : "Pista inteira"), mudar() { if (acoes.mapaAlternar) acoes.mapaAlternar(); } },
    { rot: "Estilo do HUD", valor: () => (ESTILOS_HUD.find(([k]) => k === estiloHud()) || ESTILOS_HUD[0])[1], mudar() { const i = ESTILOS_HUD.findIndex(([k]) => k === estiloHud()); definirEstiloHud(ESTILOS_HUD[(i + 1) % ESTILOS_HUD.length][0]); } },
    { rot: "Rádio", valor: () => (window.Radio && !window.Radio.mudo ? "Ligado" : "Desligado"), mudar() { if (window.Radio) { window.Radio.silenciar(); } } },
  ],
};
const linhasDaPagina = (id = mfd.pagina) => LINHAS[id] || [];
// o nome de um pedido de box para a tela ("decidir" = o pneu se escolhe na garagem)
const nomeDoPedido = (p) => (p === "decidir" ? "NA GARAGEM" : p && F1U().PNEUS[p] ? F1U().PNEUS[p].nome.toUpperCase() : "—");
// pede a parada: com um pneu já escolhido (1 a 4, ou as setas do MFD) pede ele; sem escolha, o menu do box na garagem decide
function pedirPadrao() { if (mfd.prox) escolherComposto(proximo()); else pedirNoBox(); }
// o pneu da próxima parada ainda sem pedido (a escolha do MFD; senão o que vem depois do atual, como o B fazia)
function proximo() {
  const BE = window.BoxEscolha, atual = race.pneu ? race.pneu.composto : "medio", m_ = me() || {};
  return BE.padraoDoB({ atual, jogos: m_.jogos, stopGo: !!m_.stopGo, desgaste: race.pneu ? race.pneu.desgaste : 0, selecionado: mfd.prox });
}
// a linha "Pedir box" (e o botão do MFD) alterna: pede com o pneu escolhido, ou cancela se já estava pedida
function alternarBox() {
  const B = race && race.box; if (!B || B.fase) return;
  if (B.pedido) { cancelarPedido(); return; }
  pedirPadrao(); // (box.js: com stop-and-go pendente o pedido cumpre o stop-and-go e, se o pneu for outro, troca na mesma parada)
}
// Enter, A, o botão confirmar e o segundo B: PEDEM com o que está selecionado, mas com o pedido já feito só o mostram (nunca cancelam nem trocam o pneu: era o
// B apertado "de confirmação" que desfazia o 4). Cancelar é do Backspace, do mesmo número duas vezes não (é só confirmação) ou da linha "Pedir box".
function confirmarBox() {
  const B = race && race.box; if (!B || B.fase) return;
  if (B.pedido) { toast(`🔧 Box pedido: ${nomeDoPedido(B.pedido)} (6 cancela)`, 1600); return; }
  pedirPadrao();
}
const naPaginaBox = () => !!race && !!race.box && mfd.aberto && mfd.pagina === "box";
// B (teclado e botão Box): abre o MFD na página do Box; com ela aberta e sem pedido, pede; com o pedido feito, só o mostra
export function teclaBox() {
  if (!ativo() || !race.box) { alternarPedido(); return; } // fora do HUD de F1 (arcade) segue o jeito antigo
  if (race.box.fase) return;
  const acao = window.BoxEscolha.acaoDoB({ naPaginaBox: naPaginaBox(), pedido: race.box.pedido });
  if (acao === "abrir") { mfd.prox = null; abrirBoxMfd(); return; }
  confirmarBox(); mexeu(); atualizarLinhas();
}
// 1 a 4: escolhem o pneu E pedem a parada na hora (o atalho rápido: B e 2, B e 4), com ou sem stop-and-go pendente. O MFD abre no Box para mostrar o pedido.
// O mesmo número do pedido já feito é só confirmação. Sem setas. Devolve true se tratou.
export function digitoPneu(composto) {
  if (!ativo() || !race.box || race.box.fase) return false;
  const m_ = me() || {}, r = window.BoxEscolha.acaoDoDigito({ composto, pedido: race.box.pedido, jogos: m_.jogos, atual: race.pneu ? race.pneu.composto : null, stopGo: !!m_.stopGo });
  if (r.acao === "esgotado") toast(F1U().PNEUS[composto].nome + " esgotado (2 jogos usados)", 1600);
  else if (r.acao === "manter") toast(`🔧 Box já pedido: ${F1U().PNEUS[composto].nome}`, 1200);
  else if (r.acao === "pedir") { escolherComposto(composto); if (race.box.pedido === composto) { mfd.prox = null; abrirBoxMfd(); } } // (box.js recusa sozinho a última volta etc.)
  mexeu(); atualizarLinhas(); return true;
}
// Backspace: cancela o pedido de box (a única tecla que cancela sem querer querer)
export function cancelarBoxTecla() { if (race && race.box && !race.box.fase && race.box.pedido) { cancelarPedido(); mexeu(); atualizarLinhas(); } }

// ---------- montagem ----------
export function montarMfd() {
  if (raiz) return;
  raiz = $("hMfd"); if (!raiz) return;
  mfd.aberto = lerAberto(); mexeu(); // (a contagem dos 3 s começa agora)
  raiz.innerHTML = `<div class="mfd-topo"><i class="mfd-marca" aria-hidden="true"></i><b class="mfd-nome" data-r="nome">RESUMO</b><div class="mfd-abas" data-r="abas" role="tablist"></div><div class="mfd-pos"><span><b data-r="posN">—</b><small data-r="posT">/—</small></span><span class="mfd-volta">VOLTA <b data-r="voltaN">—</b><small data-r="voltaT">/—</small></span></div><button class="mfd-x" data-r="fechar" aria-label="Fechar o MFD" title="Fechar o MFD">▾</button></div>
    <div class="mfd-sug" data-r="sug" hidden role="alert"><small>BOX SUGERIDO</small><div class="sg-linha"><b class="mp-bola" data-r="sgLetra">M</b><strong data-r="sgNome">Médio</strong><span class="sg-cont" data-r="sgCont">10</span></div><em data-r="sgMotivo"></em><p class="sg-dica" data-r="sgDica"></p><i class="sg-barra"><s data-r="sgBarra"></s></i></div><div class="mfd-corpo">${Object.entries(HTML).map(([id, h]) => `<section class="mfd-pg" data-pg="${id}" hidden>${h}</section>`).join("")}</div>
    <div class="mfd-dicas" data-r="dicas"></div>`;
  const q = (sel, ctx = raiz) => ctx.querySelector(sel);
  refs.mfd = {}; for (const el of raiz.querySelectorAll("[data-r]")) refs.mfd[el.dataset.r] = el;
  refs.pg = {}; refs.r = {};
  for (const s of raiz.querySelectorAll(".mfd-pg")) { refs.pg[s.dataset.pg] = s; const r = {}; for (const el of s.querySelectorAll("[data-r]")) r[el.dataset.r] = el; refs.r[s.dataset.pg] = r; }
  // as linhas de cada página (criadas uma vez; o valor muda no lugar)
  for (const [id, lista] of Object.entries(LINHAS)) {
    const caixa = q(`[data-linhas="${id}"]`); if (!caixa) continue;
    lista.forEach((l, i) => {
      const d = document.createElement("div"); d.className = "mr"; d.dataset.i = i;
      d.innerHTML = `<span class="mr-n">${l.rot}${l.dica ? `<kbd>${l.dica}</kbd>` : ""}</span><span class="mr-v"><button type="button" class="mr-b" data-d="-1" aria-label="${l.rot}: anterior">‹</button><b></b><button type="button" class="mr-b" data-d="1" aria-label="${l.rot}: próximo">›</button></span>`;
      caixa.appendChild(d);
    });
  }
  raiz.addEventListener("click", (e) => {
    const b = e.target.closest("button, .mr"); if (!b) return; mexeu();
    if (b.classList.contains("mfd-x")) return abrir(false);
    if (b.dataset.pg) return irPara(b.dataset.pg);
    if (b.dataset.ir) return irPara(b.dataset.ir);
    if (b.dataset.cmd) { try { executarJeff(JSON.parse(b.dataset.cmd), ""); } catch (e) {} return; } // (a aba Pedidos: clicar é o mesmo que falar)
    if (b.classList.contains("bx-btn")) { digitoPneu(b.dataset.c); return; }
    const lin = b.closest(".mr");
    if (lin) { mfd.linha[mfd.pagina] = +lin.dataset.i; const d = b.dataset.d; if (d) linhasDaPagina()[+lin.dataset.i].mudar(+d); atualizarLinhas(); }
  });
  const bt = $("bMfd"); if (bt) bt.addEventListener("click", () => { mexeu(); abrir(!mfd.aberto); });
  pintarDicas(); aplicarAberto();
}
function aplicarAberto() {
  const r = $("race"); if (!raiz || !r) return;
  clearTimeout(aplicarAberto.t); r.classList.toggle("mfd-on", mfd.aberto);
  if (mfd.aberto) raiz.classList.remove("fechado", "descendo");
  else if (matchMedia("(prefers-reduced-motion: reduce)").matches || raiz.classList.contains("fechado")) raiz.classList.add("fechado");
  else { raiz.classList.add("descendo"); aplicarAberto.t = setTimeout(() => { raiz.classList.remove("descendo"); raiz.classList.add("fechado"); }, 230); } // desce (CSS) e só então some
  const bt = $("bMfd"); if (bt) bt.setAttribute("aria-expanded", String(mfd.aberto));
}
function abrir(v, guardar = true) { mfd.aberto = !!v; if (v) mexeu(); if (guardar) guardarAberto(); aplicarAberto(); paginaVista = null; }
// 10 s sem interação: o painel desce sozinho (no PC e no celular), sai do modo ajustar e devolve as setas à pilotagem. Qualquer tecla ou botão do MFD
// (M, N, B, 1-4, Tab, D-pad ajustando, toques no painel) chama mexeu() e reinicia a contagem. Não grava a escolha: o próximo GP começa com o painel à vista.
const RECOLHE_MS = 10000;
export function mexeu() { mfd.ultimo = performance.now(); }
// o Caps Lock (a tecla do Jeff, controles.js): abre o MFD na aba Pedidos enquanto ele ouve
export function abrirPedidos() { if (!raiz) return; if (!mfd.aberto) abrir(true); mfd.pagina = "pedidos"; paginaVista = null; mexeu(); }
// B e o botão de box mostram a estratégia sem tirar as setas da pilotagem.
export function abrirBoxMfd() {
  if (!ativo() || !race.box) return;
  if (!mfd.aberto) abrir(true);
  mfd.pagina = sugVisivel ? "box" : "jogos"; mfd.linha.box = 0; paginaVista = null; mexeu(); // (o Próximo pneu só existe com a sugestão da equipe)
}
function alternarAberto() { mexeu(); abrir(!mfd.aberto); }
function irPara(id) { if (mfd.lista.includes(id)) { mfd.pagina = id; paginaVista = null; mexeu(); } }
function pagina(d) { if (!mfd.aberto) { abrir(true); return; } const p = M().vizinha(mfd.lista, mfd.pagina, d); if (p) { mfd.pagina = p; paginaVista = null; mexeu(); } }
function linhaMover(d) {
  const L = linhasDaPagina(); if (!L.length) return;
  const i = ((mfd.linha[mfd.pagina] || 0) + d + L.length) % L.length; mfd.linha[mfd.pagina] = i; mexeu(); atualizarLinhas();
}
function valorMudar(d) {
  const L = linhasDaPagina(), i = mfd.linha[mfd.pagina] || 0;
  if (!L.length) { pagina(d); return; } // página sem linhas: as setas laterais trocam de página
  L[i].mudar(d); mexeu(); atualizarLinhas();
}

// ---------- a entrada (tudo pelas ações de teclas.js) ----------
export const mfdAtivo = () => !!race && !!E.S && E.S.config.regras === "f1" && (race.hudF1 || E.S.phase === "quali") && !!raiz;
const ativo = mfdAtivo;
// Executa uma ação do MFD. Com o painel recolhido, linha e valor só ABREM (nada muda sem a pessoa ver o painel).
function acao(id) {
  if (id === "mfdAbrir") { alternarAberto(); return true; }
  if (id === "mfdPagMais") { pagina(1); return true; }
  if (id === "mfdPagMenos") { pagina(-1); return true; }
  if (id === "mfdLinhaMenos" || id === "mfdLinhaMais" || id === "mfdValorMenos" || id === "mfdValorMais") {
    if (!mfd.aberto) { abrir(true); return true; }
    if (id === "mfdLinhaMenos") linhaMover(-1); else if (id === "mfdLinhaMais") linhaMover(1); else valorMudar(id === "mfdValorMenos" ? -1 : 1);
    mexeu(); return true;
  }
  if (id === "confirmar") {
    if (confirmarSugestao()) return true;
    if (mfd.aberto && mfd.pagina === "radio") { linhasDaPagina()[mfd.linha.radio || 0]?.mudar(); mexeu(); return true; }
    if (naPaginaBox() && !race.box.fase) {
      // Confirmar é idempotente: nunca cancela um pedido já feito. B continua permitindo cancelar.
      if (!race.box.pedido) escolherComposto(proximo()); else toast("Box já confirmado", 1200);
      mexeu(); atualizarLinhas(); return true;
    }
    return false;
  }
  return false;
}
// teclado: devolve true se a tecla é do MFD (controles.js então não a trata como pilotagem)
export function mfdTecla(e) {
  if (!ativo() || ui.aberto || ui.camera || e.ctrlKey || e.metaKey || e.altKey) return false;
  const ids = acoesDaTecla(e.code).filter((id) => id.startsWith("mfd") || id === "confirmar"); if (!ids.length) return false;
  let tratou = false; mfd.entrada = "teclado";
  for (const id of ids) { if (e.repeat && id !== "mfdValorMenos" && id !== "mfdValorMais") { tratou = true; continue; } if (acao(id)) tratou = true; }
  if (tratou) e.preventDefault();
  return tratou;
}
// controle: `bate(id)` diz se algum botão da ação acabou de ser apertado (controles.js, pelos botões de teclas.js)
export function mfdPad(bate) {
  if (!ativo()) return;
  for (const id of ["mfdAbrir", "mfdPagMais", "mfdPagMenos", "mfdLinhaMenos", "mfdLinhaMais", "mfdValorMenos", "mfdValorMais", "confirmar"]) if (bate(id)) { mfd.entrada = "pad"; acao(id); }
}

// as dicas no rodapé do painel saem das teclas de verdade (padrão ou remapeadas)
function dicasHTML() {
  const k = (id) => (teclasDe(id)[0] ? `<kbd>${nomeDaTecla(teclasDe(id)[0])}</kbd>` : ""), b = (id) => (botoesDe(id)[0] != null ? `<kbd class="b">${nomeDoBotao(botoesDe(id)[0])}</kbd>` : "");
  return `<span class="kb">${k("mfdLinhaMenos")}${k("mfdLinhaMais")} linha</span><span class="kb">${k("mfdValorMenos")}${k("mfdValorMais")} valor</span><span class="kb">${k("mfdPagMenos")}${k("mfdPagMais")} página</span><span class="gp">${b("mfdPagMenos")}${b("mfdPagMais")} página</span><span class="gp">${b("mfdValorMenos")}${b("mfdValorMais")} valor</span>`;
}
function pintarDicas() { if (refs.mfd && refs.mfd.dicas) refs.mfd.dicas.innerHTML = dicasHTML(); }
window.addEventListener("teclas:mudou", pintarDicas);

// ---------- a atualização (hudF1 chama a ~10x por segundo) ----------
function atualizarLinhas() {
  if (!refs.pg) return;
  const L = linhasDaPagina(), caixa = refs.pg[mfd.pagina] && refs.pg[mfd.pagina].querySelector("[data-linhas]"); if (!caixa) return;
  const sel = mfd.linha[mfd.pagina] || 0;
  L.forEach((l, i) => { const d = caixa.children[i]; if (!d) return; set(d, "c", "mr" + (i === sel ? " sel" : "")); set(d.querySelector("b"), "t", l.valor()); });
}
// a lista de páginas e as abas (só reconstruídas quando mudam)
function listaDePaginas(ctx) {
  const m = ctx.m, lista = M().paginasDisponiveis({ f1: true, pneu: !!race.pneu, eu: !!m, ers: !!race.ers, box: !!race.box, sugestao: sugVisivel, compacta: ctx.compacta, total: ctx.st.length });
  if (lista.join() !== mfd.lista.join()) mfd.lista = lista;
  if (!lista.includes(mfd.pagina)) { mfd.pagina = lista[0]; paginaVista = null; }
  const chave = lista.join();
  if (chave !== abas) {
    abas = chave;
    refs.mfd.abas.innerHTML = lista.map((id, i) => `<button type="button" role="tab" data-pg="${id}" class="${id === "ajustes" ? "sec" : ""}" title="${M().nomeDaPagina(id)}" aria-label="${M().nomeDaPagina(id)}">${icone(id)}<span>${M().nomeDaPagina(id)}</span></button>`).join("");
  }
}
// ---------- a sugestão de box (estrategia-box.js decide; aqui só aparece o cartão) ----------
// Quando a hora chega (a 1 volta da janela, pneu no fim, chuva chegando ou parando, falta o 2º composto, stop-and-go no prazo) o MFD abre sozinho com
// "BOX SUGERIDO: <composto>" e 10 s de contagem; Enter (ou A, ou o botão confirmar da tela Controles) pede a parada com aquele composto. Sem confirmar, some
// e só volta se a situação mudar (nada de spam).
let sugEst = null, sugAtual = null, sugVisivel = false; // (sugRestante fica junto de temperaturas, mais acima)
function dadosDaSugestao(ctx) {
  const m = ctx.m, B = race.box, EB = window.EstrategiaBox, F = F1U();
  if (!EB || !m || !B || !race.pneu || E.S.phase !== "race" || m.finish != null || !m.started) return null;
  const S = E.S, voltas = S.config.voltas, jogos = m.jogos || {};
  const mud = S.clima && S.clima.chove && F.proximaMudanca && clima.t >= 0 ? F.proximaMudanca(S.clima, clima.t) : null;
  const e = { F, ritmo: window.F1PneusRitmo, pista: S.config.pista, pneu: race.pneu, voltaAtual: Math.min(voltas, (m.laps || 0) + 1), voltas, jogos, janela: ctx.janela,
    compostosUsados: ["macio", "medio", "duro"].filter((c) => jogos[c] != null && jogos[c] < F.JOGOS_POR_COMPOSTO).length,
    agua: clima.agua, chuva: clima.chuva, mudanca: mud, tempoVolta: m.last || m.best || 0, taxaPneu: ctx.tp && ctx.tp.taxa, stopGo: m.stopGo || null, pedido: B.pedido, emBox: !!B.fase, fator: (carOf(m) || {}).desgaste || 1 };
  return { e, EB };
}
function atualizarSugestao(ctx, agora) {
  const d = dadosDaSugestao(ctx), r = d ? d.EB.gerirSugestao(sugEst, d.EB.sugerirBox(d.e), { agora, volta: d.e.voltaAtual }) : { est: sugEst, mostrar: false, restante: 0, sug: null };
  sugEst = r.est;
  if (r.mostrar && r.sug) {
    if (!sugVisivel) { sugVisivel = true; abrir(true); mfd.pagina = "box"; paginaVista = null; /* (2026-11-16, o Thiago: o cartão novo do Próximo pneu substitui o antigo) */ try { if (window.Radio) window.Radio.dizer("sugere" + r.sug.composto, { reserva: "sugerebox" }); } catch (e) {} } // abre sozinho e o engenheiro PERGUNTA, com o nome do pneu (2026-11-21: antes falava "box, box", como se já estivesse confirmado)
    sugAtual = r.sug; mexeu(); // enquanto o cartão está na tela o painel não recolhe
    const F = F1U(), tipo = F.PNEUS[r.sug.composto], R = refs.mfd;
    R.sug.hidden = true; set(R.sgLetra, "t", window.HudTorre.LETRA[r.sug.composto] || "M"); set(R.sgLetra, "style", `--c:${tipo.cor}`); set(R.sgNome, "t", tipo.nome.toUpperCase());
    set(R.sgMotivo, "t", r.sug.motivo + (r.sug.stopGo && ctx.m && ctx.m.stopGo ? " · cumpre o stop-and-go junto" : ""));
    sugRestante = r.restante; set(R.sgCont, "t", Math.ceil(r.restante / 1000)); set(R.sgBarra, "w", Math.round((r.restante / 10000) * 100) + "%");
    const k = teclasDe("confirmar")[0], b = botoesDe("confirmar")[0];
    set(R.sgDica, "t", [k ? nomeDaTecla(k) : "", b != null ? nomeDoBotao(b) + " no controle" : ""].filter(Boolean).join(" · ") + " confirma");
    sugTexto = r.sug.motivo + " · " + [k ? nomeDaTecla(k) : "", b != null ? nomeDoBotao(b) : ""].filter(Boolean).join(" ou ") + " confirma";
  } else if (sugVisivel) { sugVisivel = false; sugAtual = null; if (refs.mfd && refs.mfd.sug) refs.mfd.sug.hidden = true; }
}
// Enter / A / o botão confirmar: pede o box com o composto sugerido (o box.js cuida do stop-and-go junto) e marca a sugestão como atendida
function confirmarSugestao() {
  if (!sugVisivel || !sugAtual || !race.box || race.box.fase) return false;
  const c = sugAtual.composto; sugVisivel = false; sugAtual = null; if (refs.mfd && refs.mfd.sug) refs.mfd.sug.hidden = true;
  escolherComposto(c); abrirBoxMfd(); mexeu(); return true;
}
export function atualizarMfd(ctx) {
  if (!raiz) return;
  const t = performance.now();
  atualizarSugestao(ctx, t);
  if (mfd.aberto && t - mfd.ultimo > RECOLHE_MS) abrir(false, false);
  { const bt = $("bMfd"), B = race.box, rot = bt && bt.querySelector("span"); if (rot) set(rot, "t", B && B.pedido && !B.fase ? "BOX " + nomeDoPedido(B.pedido) : B && B.fase ? "NO BOX" : "MFD"); if (bt) set(bt, "c", "mfd-botao" + (B && (B.pedido || B.fase) ? " pedido" : "")); } // fechado, o pedido de box segue à vista no botão
  raiz.dataset.entrada = mfd.entrada;
  { const m = ctx.m, eq = m && window.F1Pilotos ? window.F1Pilotos.EQUIPES[m.equipe] : null, cor = eq ? eq.cor : (m && m.color) || "#e10600"; if (raiz.dataset.cor !== cor) { raiz.dataset.cor = cor; raiz.style.setProperty("--equipe", cor); } } // (o tema é sempre o da equipe)
  const rr = $("race"); if (rr && rr.dataset.entrada !== mfd.entrada) rr.dataset.entrada = mfd.entrada;
  Object.assign(LEITURA, ctx);
  listaDePaginas(ctx);
  if (!mfd.aberto) return;
  if (paginaVista !== mfd.pagina) {
    paginaVista = mfd.pagina;
    for (const [id, s] of Object.entries(refs.pg)) s.hidden = id !== mfd.pagina;
    raiz.classList.toggle("grande", mfd.pagina === "pedidos"); // (a aba Pedidos é a única maior)
    set(refs.mfd.nome, "t", M().nomeDaPagina(mfd.pagina));
    for (const b of refs.mfd.abas.children) { const on = b.dataset.pg === mfd.pagina; b.classList.toggle("on", on); b.setAttribute("aria-selected", String(on)); }
  }
  { const m = ctx.m, pos = m ? ctx.st.findIndex((x) => x.id === m.id) + 1 : 0; set(refs.mfd.posN, "t", pos ? "P" + pos : "—"); set(refs.mfd.posT, "t", "/" + ctx.st.length); set(refs.mfd.voltaN, "t", m ? Math.min(E.S.config.voltas, (m.laps || 0) + 1) : "—"); set(refs.mfd.voltaT, "t", "/" + E.S.config.voltas); }
  (ATU[mfd.pagina] || (() => {}))(ctx, refs.r[mfd.pagina]);
  atualizarLinhas();
}

const F1U = () => window.F1Regras;
// (2026-11-16, o Thiago: "temperatura inventada") o jogo não mede a temperatura do ar nem da pista: um número de enfeite, coerente e fixo no GP. Sai do
// clima típico de cada pista, cai à noite e com a chuva, varia ±2 pela semente do GP; o asfalto no sol esquenta até 10 °C acima do ar.
const AR_DA_PISTA = { bahrein: 30, catar: 31, abudhabi: 30, singapura: 30, miami: 29, jeddah: 29, austin: 27, madri: 27, monza: 27, hungaroring: 28, barcelona: 26, interlagos: 25, baku: 24, monaco: 22, mexico: 22, xangai: 22, montreal: 23, redbullring: 23, suzuka: 21, melbourne: 21, spa: 19, silverstone: 19, zandvoort: 18, lasvegas: 16 };
const SOL_ICONE = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="#ffd23f"/><g stroke="#ffd23f" stroke-width="2" stroke-linecap="round"><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"/></g></svg>';
const CHUVA_ICONE = '<svg viewBox="0 0 24 24" fill="none" stroke="#cfd6e0" stroke-width="1.6" stroke-linecap="round"><path d="M7 15h10a4 4 0 0 0 .5-8 6 6 0 0 0-11.4 1.6A3.3 3.3 0 0 0 7 15z"/><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3" stroke="#5fc8ff"/></svg>';
const LUA_ICONE = '<svg viewBox="0 0 24 24"><path d="M15 3a8 8 0 1 0 6 13 7 7 0 0 1-6-13z" fill="#dfe6f2"/></svg>';
function temperaturas() {
  const S = E.S, pista = S.config.pista, noite = S.config.hora === "noite", agua = clima.agua || 0, chuva = clima.chuva || 0;
  let h = 0; for (const ch of String(S.semente ?? pista)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const ar = Math.round((AR_DA_PISTA[pista] ?? 24) - (noite ? 5 : 0) - Math.min(1, chuva + agua) * 5 + ((h % 5) - 2));
  const pista_ = Math.round(ar + (noite ? 2 : 10 * (1 - Math.min(1, agua * 2))));
  const estado = agua > 0.45 ? "Chuva" : agua > 0.15 ? "Molhado" : chuva > 0.05 ? "Garoa" : "Seco";
  return { ar, pista: pista_, estado, icone: estado === "Seco" ? (noite ? LUA_ICONE : SOL_ICONE) : CHUVA_ICONE };
}
const htm = (el, v) => { if (el && el._h !== v) { el._h = v; el.innerHTML = v; } }; // (o ícone em SVG: só reescreve quando muda)
let sugRestante = 0, sugTexto = ""; // (o tempo que falta para aceitar a sugestão de box, em ms: a barra do Próximo pneu)
let mapaPista = null, mapaEsc = null;
function mapaDoResumo(r, idLider) {
  const tr = race.tr; if (!tr || !r.mpP) return;
  if (mapaPista !== tr) {
    mapaPista = tr; let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const p of tr.pts) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
    const k = Math.min(112 / (x1 - x0 || 1), 52 / (y1 - y0 || 1)), ox = (120 - (x1 - x0) * k) / 2, oy = (60 - (y1 - y0) * k) / 2;
    mapaEsc = (x, y) => [ox + (x - x0) * k, oy + (y - y0) * k];
    const passo = Math.max(1, Math.floor(tr.n / 200)); let d = ""; for (let i = 0; i < tr.n; i += passo) { const [a, b] = mapaEsc(tr.pts[i].x, tr.pts[i].y); d += (i ? "L" : "M") + a.toFixed(1) + " " + b.toFixed(1); }
    r.mpP.setAttribute("d", d + "Z"); const [cx, cy] = mapaEsc(tr.pts[0].x, tr.pts[0].y); r.mpCh.setAttribute("transform", `translate(${(cx - 2.5).toFixed(1)} ${(cy - 2.5).toFixed(1)})`);
  }
  const c = race.car; if (c) { const [a, b] = mapaEsc(c.x, c.y); r.mpE.setAttribute("cx", a.toFixed(1)); r.mpE.setAttribute("cy", b.toFixed(1)); }
  const g = idLider && race.ghosts.get(idLider); r.mpL.style.display = g ? "" : "none"; if (g) { const [a, b] = mapaEsc(g.x, g.y); r.mpL.setAttribute("cx", a.toFixed(1)); r.mpL.setAttribute("cy", b.toFixed(1)); }
}
const pc = (v) => Math.round(Math.max(0, Math.min(1, v)) * 100);
const corRodas = (r, nivel) => { for (const k of ["w0", "w1", "w2", "w3"]) set(r[k], "c", "mp-roda " + nivel); };
const ATU = {
  resumo(ctx, r) {
    const m = ctx.m, pn = race.pneu, F = F1U(), M_ = M(); if (!m || !pn) return;
    const e = M_.estadoDoPneu(pn, F), tipo = F.PNEUS[pn.composto] || F.PNEUS[F.COMPOSTO_PADRAO], COR = { bom: "#2ee08a", medio: "#ffb02e", baixo: "#ff6a3d", fim: "#ff3d4a" };
    if (r._pneu !== pn) { r._pneu = pn; r._volta0 = m.laps || 0; }
    set(r.rpL, "t", window.HudTorre.LETRA[pn.composto] || "M"); set(r.rpL, "style", `color:${tipo.cor}`);
    set(r.rpAnel, "style", `stroke:${tipo.cor};stroke-dasharray:${(e.vida / 100 * 113).toFixed(1)} 113`);
    set(r.rpV, "t", `${e.vida}%`); // (2026-11-21, o Thiago: "sempre contar o pneu em %, nunca em voltas") set(r.rpV, "c", e.nivel === "fim" || e.nivel === "baixo" ? "alerta" : "");
    const dano = Math.max(0, Math.min(100, m.dano || 0)), cond = Math.round(100 - dano), nv = cond > 66 ? "bom" : cond > 33 ? "medio" : "fim";
    set(r.rdT, "t", cond + "%"); set(r.rdB, "w", cond + "%"); set(r.rdB, "bg", cond > 66 ? "#fff" : COR[nv]); set(r.rdCorpo, "style", `fill:${cond > 66 ? "#3a3f4b" : COR[nv]}`);
    const tc = temperaturas(); htm(r.rlI, tc.icone); set(r.rlT, "t", tc.ar + "°C");
    const pos = ctx.st.findIndex((x) => x.id === m.id), sig = (x) => (x ? x.p.sigla || String(x.p.name || "").slice(0, 3).toUpperCase() : ""), i = ctx.int || {};
    const fr = pos > 0 ? ctx.st[pos - 1] : null, tr = pos >= 0 && pos < ctx.st.length - 1 ? ctx.st[pos + 1] : null;
    set(r.frP, "t", fr ? String(pos) : "—"); set(r.frN, "t", sig(fr)); set(r.trP, "t", tr ? String(pos + 2) : "—"); set(r.trN, "t", sig(tr));
    set(r.gap, "t", i.frente ? "+" + M_.intervalo(i.frente.seg) + "s" : pos === 0 ? "LÍDER" : "—");
    mapaDoResumo(r, ctx.st[0] && ctx.st[0].id !== m.id ? ctx.st[0].id : null);
  },
  pneus(ctx, r) {
    const pn = race.pneu; if (!pn) return;
    const F = F1U(), e = M().estadoDoPneu(pn, F), tipo = F.PNEUS[pn.composto] || F.PNEUS[F.COMPOSTO_PADRAO], B = race.box;
    const COR = { bom: "#2ee08a", medio: "#ffb02e", baixo: "#ff6a3d", fim: "#ff3d4a" };
    set(r.a0, "style", `--r:${e.vida};--c:${COR[e.nivel]}`); set(r.a0.firstChild, "t", e.vida + "%");
    set(r.pLetra, "t", window.HudTorre.LETRA[pn.composto] || "M"); set(r.pLetra, "style", `--c:${tipo.cor}`); set(r.pNome, "t", tipo.nome.toUpperCase());
    const v = ctx.tp, n = v ? Math.max(0, Math.floor(v.voltas)) : null;
    set(r.pVoltas, "t", e.nivel === "fim" ? "NO LIMITE" : `${e.vida}% de vida`); set(r.pVoltas, "c", "pn2-voltas " + e.nivel);
    set(r.pTempT, "t", "Temperatura: " + e.temp);
    set(r.pProx, "t", B && !B.fase ? (B.pedido === "decidir" ? "NA GARAGEM" : F.PNEUS[B.pedido || proximo()].nome.toUpperCase()) : "—");
    set(r.pNota, "t", e.nivel === "fim" ? "Passou do limite: faça a parada." : v && v.medida ? "(no seu ritmo)" : "");
  },
  danos(ctx, r) {
    const m = ctx.m; if (!m) return; const dano = Math.max(0, Math.min(100, m.dano || 0)), cond = Math.round(100 - dano), des = Math.round(F1U().efeitoDoDano(dano).final * 100), b = m.ultimaBatida;
    set(r.dnPct, "t", cond + "%"); set(r.dnBar, "w", cond + "%"); set(r.dnBar, "c", cond > 66 ? "" : cond > 33 ? "medio" : "baixo");
    set(r.dnSub, "t", dano < 1 ? "sem danos" : `${des}% do desempenho${b ? ` · última batida ${b.nivel === "media" ? "média" : b.nivel}` : ""}`);
    set(r.dnCard, "c", "m3-card m3-dano" + (dano >= 33 ? " alerta" : "")); set(r.dnAl, "c", "m3-alerta" + (dano >= 1 ? " on" : ""));
  },
  ers(ctx, r) {
    const ers = race.ers; if (!ers) return; const F = F1U(), carga = pc(ers.carga), m = ctx.modoErs;
    set(r.eBat, "t", carga + "%"); set(r.eBatB, "w", carga + "%"); set(r.eBatB, "c", race.ersAtivo ? "on" : carga < 20 ? "baixo" : carga < 50 ? "medio" : "bom"); set(r.eEst, "t", m ? m.texto : "—");
    const rec = pc((ers.recarga || 0) / F.ERS_MAX_RECARGA); set(r.eRecB, "w", rec + "%"); set(r.eRecT, "t", rec + "%");
    set(r.eModo, "t", E.S.config.ers === "manual" ? "Manual (segure Shift)" : "Automático");
    const pronto = !!ctx.m && ctx.m.drsZona >= 0; set(r.eDrs, "t", race.drsAtivo ? "Aberto" : pronto ? "Disponível na zona" : "Indisponível");
  },
  box(ctx, r) {
    const m = ctx.m, F = F1U(), B = race.box; if (!m || !B || !race.pneu) return;
    const pn = race.pneu, e = M().estadoDoPneu(pn, F), sug = sugVisivel && sugAtual ? sugAtual : null;
    // o próximo pneu: o sugerido (com a barra do tempo para aceitar), o pedido ou o que o box colocaria; o número é o que resta do pneu de agora
    const c = sug ? sug.composto : B.pedido && F.PNEUS[B.pedido] ? B.pedido : proximo(), tp = F.PNEUS[c] || F.PNEUS[F.COMPOSTO_PADRAO];
    set(r.pxTit, "t", B.fase ? "NO BOX" : sug ? "BOX SUGERIDO" : B.pedido ? "BOX PEDIDO" : "PRÓXIMO PNEU");
    set(r.pxChip, "t", tp.nome.toUpperCase()); set(r.pxChip, "style", `--c:${tp.cor}`); set(r.pxFaixa, "style", `stroke:${tp.cor}`);
    set(r.pxPct, "t", e.vida + "%"); set(r.pxSub, "t", "RESTANTES"); set(r.pxMot, "t", sug ? sugTexto : "");
    set(r.pxBar, "w", sug ? Math.round(Math.max(0, Math.min(1, sugRestante / 10000)) * 100) + "%" : "0%"); set(r.pxCard, "c", "m3-card m3-prox" + (sug ? " sugestao" : "") + (e.nivel === "fim" ? " alerta" : ""));
  },
  jogos(ctx, r) {
    const m = ctx.m, F = F1U(), B = race.box; if (!m || !B || !race.pneu) return; const pn = race.pneu;
    // os jogos: a quantidade de cada composto; o anel cheio se sobra jogo, apagado sem jogo, marcado no pedido e no atual
    const jogos = jogosDe(m), atual = pn.composto;
    for (const k of ["macio", "medio", "duro", "chuva", "intermediario"]) {
      const bt = r["bx" + k], n = jogos[k] ?? 0;
      set(bt, "c", "bx-btn m3-jg-i" + (B.pedido === k ? " pedido" : "") + (n <= 0 && !(m.stopGo && k === atual) ? " esgotado" : "") + (k === atual ? " atual" : ""));
      set(bt, "style", `--c:${F.PNEUS[k].cor}`); set(bt.querySelector("span"), "t", String(n));
    }
    const j = ctx.janela;
    set(r.bInfo, "t", B.fase ? "Parada em andamento" : [j && j.precisa ? (j.abre === j.fecha ? `Janela na volta ${j.abre}` : `Janela nas voltas ${j.abre}–${j.fecha}`) : j ? "Sem parada prevista" : "", ctx.perda != null ? `troca ~${ctx.perda.toFixed(0)} s` : ""].filter(Boolean).join(" · "));
  },
  condicoes(ctx, r) {
    // as condições
    const tc = temperaturas(); set(r.cdAr, "t", tc.ar + "°C"); set(r.cdPista, "t", tc.pista + "°C"); htm(r.cdIco, tc.icone); set(r.cdEst, "t", tc.estado.toUpperCase());
  },
  tempos(ctx, r) {
    const m = ctx.m, M_ = M(); if (!m) return;
    const rel = race.hudRelogio; if (rel) { set(r.tAtual, "t", M_.tempoVolta(rel.volta)); set(r.tCorrida, "t", M_.tempoCorrida(rel.corrida)); }
    set(r.tUlt, "t", M_.tempoVolta(m.last)); set(r.tMelhor, "t", M_.tempoVolta(m.best));
    const vr = ctx.vr; set(r.tVR, "t", vr ? `${vr.sigla || vr.name} · ${M_.tempoVolta(vr.best)}` : "—");
    const nome = (id) => { const p = ctx.st.find((x) => x.id === id); return p ? (p.p.sigla || String(p.p.name || "").slice(0, 3).toUpperCase()) : ""; };
    const i = ctx.int || {};
    set(r.tFrente, "t", i.frente ? `${nome(i.frente.id)} ${M_.intervalo(i.frente.seg, "-")} s` : "—"); set(r.tTras, "t", i.tras ? `${nome(i.tras.id)} ${M_.intervalo(i.tras.seg, "+")} s` : "—");
  },
  classificacao(ctx, r) {
    const rows = r.cLista.children, F = F1U();
    for (let k = 0; k < rows.length; k++) {
      const d = rows[k], l = ctx.linhas[k]; set(d, "c", l ? "cl-r" + (l.eu ? " eu" : "") : "cl-r hidden"); if (!l) continue;
      const c = d.children; set(c[0], "t", l.pos); set(c[1], "bg", l.cor); set(c[2], "t", l.sigla); set(c[3], "t", l.dif.texto);
      set(c[4], "t", l.letra); set(c[4], "col", (F.PNEUS[l.pneu] || F.PNEUS.medio).cor);
    }
  },
  ajustes(ctx, r) { set(r.aErs, "t", E.S.config.ers === "manual" ? "Manual (tecla E / botão ERS)" : "Automático (da sala)"); },
};
