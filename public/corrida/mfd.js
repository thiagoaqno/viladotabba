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
  pneus: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>', danos: '<path d="M14.5 5.5a4 4 0 0 0-5 5L4 16l4 4 5.5-5.5a4 4 0 0 0 5-5l-2.5 2.5-2.5-.5-.5-2.5z"/>',
  ers: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>', box: '<path d="M4 21V4M4 5h13l-2 4 2 4H4"/>', tempos: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 1.5M9.5 2.5h5"/>',
  classificacao: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>', ajustes: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
  radio: '<path d="M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v6H4zM17 14h3v6h-3z"/>',
};
const icone = (id) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONE[id] || ""}</svg>`;
const linhasDe = (id) => `<div class="mr-lista" data-linhas="${id}"></div>`;
const HTML = {
  // (2026-11-16, o MFD novo, pelo conceito do Thiago: "um painel vivo, não um menu: bater o olho por um segundo e entender a corrida")
  // centro: o carro com os quatro pneus (o jogo mede UM conjunto: os quatro mostram a mesma vida e o mesmo estado de temperatura) e a condição
  // geral num anel; esquerda: a estratégia (a contagem muda com a situação) e os jogos; direita: os danos (clicável: abre a página Danos) e o clima;
  // rodapé: o líder, o carro da frente e o de trás, e o mapa com você e o líder. Nada inventado: sem temperatura do ar e da pista (o jogo não mede).
  resumo: `<div class="rs">
    <div class="rs-col">
      <button type="button" class="rs-card rs-pneu" data-ir="box" data-r="rpCard"><header><span class="rs-ico">⟳</span><b data-r="rpTit">PNEU ATUAL</b></header>
        <div class="rs-pneu-corpo"><svg class="rs-roda" viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="34" class="rs-borracha"/><circle cx="40" cy="40" r="27" class="rs-faixa" data-r="rpFaixa"/><circle cx="40" cy="40" r="13" class="rs-cubo"/></svg>
        <div class="rs-pneu-txt"><b class="rs-chip" data-r="rpChip">MÉDIO</b><strong><span data-r="rpNum">—</span><small data-r="rpUn"></small></strong><em data-r="rpSub"></em></div></div>
        <i class="rs-prog"><i data-r="rpProg"></i></i></button>
      <button type="button" class="rs-card rs-jogos" data-ir="box"><header><span class="rs-ico">◎</span><b>JOGOS DE PNEU</b></header>
        <div class="rs-jg">${["duro", "medio", "macio", "intermediario", "chuva"].map((c) => `<span class="rs-jg-i" data-r="jg${c}"><svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="14" class="tr"/><circle cx="18" cy="18" r="14" class="vl" data-r="jgv${c}"/></svg><b data-r="jgn${c}">0</b></span>`).join("")}</div></button>
    </div>
    <div class="rs-meio">
      <svg class="rs-anel" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="92" class="tr"/><circle cx="100" cy="100" r="92" class="vl" data-r="rcAnel"/></svg>
      <svg class="rs-carro" viewBox="0 0 90 150" aria-hidden="true"><rect x="16" y="4" width="58" height="9" rx="3" class="asa"/><path d="M45 8 L53 40 L56 92 L62 128 L28 128 L34 92 L37 40 Z" class="corpo" data-r="rcCorpo"/><rect x="20" y="132" width="50" height="10" rx="3" class="asa"/>${[[4, 26], [70, 26], [4, 104], [70, 104]].map(([x, y], i) => `<rect x="${x}" y="${y}" width="16" height="26" rx="4" class="roda" data-r="rcR${i}"/>`).join("")}</svg>
      ${["ed", "dd", "et", "dt"].map((k, i) => `<div class="rs-tp rs-tp${i}"><b data-r="tpV${i}">—</b><small data-r="tpT${i}">—</small><i><i data-r="tpB${i}"></i></i></div>`).join("")}
      <div class="rs-cond"><small>CONDIÇÃO</small><b data-r="rcCond">—</b></div>
    </div>
    <div class="rs-col">
      <button type="button" class="rs-card rs-dano" data-ir="danos" data-r="rdCard"><header><span class="rs-ico alerta">▲</span><b>DANO NO CARRO</b></header>
        <div class="rs-dano-corpo"><svg viewBox="0 0 120 50" aria-hidden="true"><path d="M8 25 h18 l8 -10 h52 l8 10 h18 M8 25 h18 l8 10 h52 l8 -10 h18" class="sil" data-r="rdSil"/></svg><div><strong data-r="rdPct">100%</strong><i class="rs-barra"><i data-r="rdBarra"></i></i><em data-r="rdSub">sem danos</em></div></div></button>
      <div class="rs-card rs-clima"><header><span class="rs-ico">☁</span><b>CONDIÇÕES DA PISTA</b></header>
        <div class="rs-clima-corpo"><div><span data-r="rlIco">☀</span><b data-r="rlEstado">Seco</b></div><div><small>ÁGUA NA PISTA</small><b data-r="rlAgua">0%</b></div><div><small>PREVISÃO</small><b data-r="rlPrev">—</b></div></div></div>
    </div>
    <div class="rs-rodape">
      <div class="rs-lider"><small>LÍDER DA CORRIDA</small><div><b class="rs-num">1</b><span><strong data-r="rlNome">—</strong><em data-r="rlEq"></em></span><img data-r="rlLogo" alt="" hidden></div></div>
      <div class="rs-gap frente"><small>À SUA FRENTE</small><strong data-r="gfT">—</strong><em data-r="gfN"></em></div>
      <div class="rs-gap tras"><small>ATRÁS DE VOCÊ</small><strong data-r="gtT">—</strong><em data-r="gtN"></em></div>
      <div class="rs-mapa"><svg viewBox="0 0 200 90" aria-hidden="true"><path class="pista" data-r="mpPista"/><circle r="4" class="lid" data-r="mpLid"/><circle r="5" class="eu" data-r="mpEu"/></svg><em data-r="mpNome"></em></div>
    </div>
  </div>`,
  // como a página de pneus do jogo da EA (F1 24): o carro no meio com as 4 rodas coloridas pela temperatura e um anel de desgaste em cada canto
  // (o jogo daqui mede UM conjunto de pneus, então os quatro anéis mostram o mesmo valor); embaixo o composto, a temperatura e a previsão
  // só o essencial, grande: o pneu de agora com a vida, quantas voltas ainda aguenta e o próximo pneu (B abre o Box)
  pneus: `<div class="mp mp-pneus2"><div class="pn2-topo"><div class="anel anel-g" data-r="a0"><b></b></div><div class="pn2-txt"><div class="mp-comp"><b class="mp-bola" data-r="pLetra">M</b><span data-r="pNome">Médio</span></div><strong class="pn2-voltas" data-r="pVoltas">—</strong><span class="pn2-sub" data-r="pTempT"></span></div></div>
    <div class="pn2-prox"><span>PRÓXIMO PNEU</span><b data-r="pProx">—</b><kbd>B</kbd></div><p class="mp-nota" data-r="pNota"></p></div>`,
  danos: `<div class="mp mp-dupla">${CARRO("dn")}<b class="mp-centro" data-r="dPct">0%</b><div class="mp-dados">
    <div class="mp-barra"><span>Dano</span><div><i data-r="dBarra"></i></div><b data-r="dT">0%</b></div>
    <div class="mp-barra"><span>Desempenho</span><div><i data-r="dDes"></i></div><b data-r="dDesT">100%</b></div>
    <p class="mp-nota" data-r="dBatida">Sem batidas</p><p class="mp-nota mp-fraca">Com 100% de dano o carro está destruído (perda total).</p></div></div>`,
  ers: `<div class="mp mp-ers"><div class="mp-grande"><span>BATERIA</span><b data-r="eBat">0%</b></div>
    <div class="mp-barra"><span>Carga</span><div><i data-r="eBatB"></i></div><b data-r="eEst">—</b></div>
    <div class="mp-barra"><span>Recarga da volta</span><div><i data-r="eRecB"></i></div><b data-r="eRecT">0%</b></div>
    <div class="mp-par"><span>Modo</span><b data-r="eModo">—</b></div><div class="mp-par"><span>DRS</span><b data-r="eDrs">—</b></div>
    <div class="mp-par"><span>Combustível</span><b>não medido no jogo</b></div></div>`,
  box: `<div class="mp mp-box"><div class="mp-janela"><small>JANELA DE BOX</small><b data-r="bJan">—</b><em data-r="bSub"></em></div>
    <div class="bx-linha" role="group" aria-label="Escolher o pneu da parada">${["macio", "medio", "duro", "chuva", "intermediario"].map((c, i) => `<button type="button" class="bx-btn" aria-label="${F().PNEUS[c].nome}" data-c="${c}" data-r="bx${c}"><kbd>${i + 1}</kbd><i class="bx-pn"></i><b>${["MACIO", "MÉDIO", "DURO", "CHUVA", "INTER."][i]}</b><span></span></button>`).join("")}</div>
    <p class="mp-nota bx-info" data-r="bInfo"></p><p class="mp-nota mp-fraca" data-r="bDica"><kbd>1</kbd>–<kbd>5</kbd> escolhe e pede · <kbd>B</kbd> ou <kbd>Enter</kbd> pede o selecionado · <kbd>6</kbd> cancela</p></div>`,
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
    if (race.box.pedido === c) { mfd.prox = null; jeff(um("box", [`box nesta volta, pneu ${nome(c)}.`, `entendido. Box, box, vamos de ${nome(c)}.`, `confirmado: entre nesta volta, ${nome(c)} pronto.`, `a equipe está pronta com o ${nome(c)}. Box nesta volta.`])); R?.dizer("box" + c, { forcar: true, reserva: "box" }); mexeu(); atualizarLinhas(); }
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
// B e o botão de box mostram a estratégia sem tirar as setas da pilotagem.
export function abrirBoxMfd() {
  if (!ativo() || !race.box) return;
  if (!mfd.aberto) abrir(true);
  mfd.pagina = "box"; mfd.linha.box = 0; paginaVista = null; mexeu();
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
  const m = ctx.m, lista = M().paginasDisponiveis({ f1: true, pneu: !!race.pneu, eu: !!m, ers: !!race.ers, box: !!race.box, compacta: ctx.compacta, total: ctx.st.length });
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
let sugEst = null, sugAtual = null, sugVisivel = false;
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
    if (!sugVisivel) { sugVisivel = true; abrir(true); try { if (window.Radio) window.Radio.dizer("box" + r.sug.composto, { reserva: "box" }); } catch (e) {} } // abre sozinho e o engenheiro fala junto, com o nome do pneu
    sugAtual = r.sug; mexeu(); // enquanto o cartão está na tela o painel não recolhe
    const F = F1U(), tipo = F.PNEUS[r.sug.composto], R = refs.mfd;
    R.sug.hidden = false; set(R.sgLetra, "t", window.HudTorre.LETRA[r.sug.composto] || "M"); set(R.sgLetra, "style", `--c:${tipo.cor}`); set(R.sgNome, "t", tipo.nome.toUpperCase());
    set(R.sgMotivo, "t", r.sug.motivo + (r.sug.stopGo && ctx.m && ctx.m.stopGo ? " · cumpre o stop-and-go junto" : ""));
    set(R.sgCont, "t", Math.ceil(r.restante / 1000)); set(R.sgBarra, "w", Math.round((r.restante / 10000) * 100) + "%");
    const k = teclasDe("confirmar")[0], b = botoesDe("confirmar")[0];
    set(R.sgDica, "t", [k ? nomeDaTecla(k) : "", b != null ? nomeDoBotao(b) + " no controle" : ""].filter(Boolean).join(" · ") + " confirma");
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
    raiz.classList.toggle("largo", mfd.pagina === "resumo");
    set(refs.mfd.nome, "t", M().nomeDaPagina(mfd.pagina));
    for (const b of refs.mfd.abas.children) { const on = b.dataset.pg === mfd.pagina; b.classList.toggle("on", on); b.setAttribute("aria-selected", String(on)); }
  }
  { const m = ctx.m, pos = m ? ctx.st.findIndex((x) => x.id === m.id) + 1 : 0; set(refs.mfd.posN, "t", pos ? "P" + pos : "—"); set(refs.mfd.posT, "t", "/" + ctx.st.length); set(refs.mfd.voltaN, "t", m ? Math.min(E.S.config.voltas, (m.laps || 0) + 1) : "—"); set(refs.mfd.voltaT, "t", "/" + E.S.config.voltas); }
  (ATU[mfd.pagina] || (() => {}))(ctx, refs.r[mfd.pagina]);
  atualizarLinhas();
}

const F1U = () => window.F1Regras;
let mapaPista = null, mapaEsc = null;
function mapaDoResumo(r, idLider) {
  const tr = race.tr; if (!tr || !r.mpPista) return;
  if (mapaPista !== tr) {
    mapaPista = tr; let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const p of tr.pts) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
    const k = Math.min(188 / (x1 - x0 || 1), 80 / (y1 - y0 || 1)), ox = (200 - (x1 - x0) * k) / 2, oy = (90 - (y1 - y0) * k) / 2;
    mapaEsc = (x, y) => [ox + (x - x0) * k, oy + (y - y0) * k];
    const passo = Math.max(1, Math.floor(tr.n / 240)); let d = ""; for (let i = 0; i < tr.n; i += passo) { const [a, b] = mapaEsc(tr.pts[i].x, tr.pts[i].y); d += (i ? "L" : "M") + a.toFixed(1) + " " + b.toFixed(1); }
    r.mpPista.setAttribute("d", d + "Z"); set(r.mpNome, "t", (PISTAS[E.S.config.pista] ? PISTAS[E.S.config.pista].name : "").toUpperCase());
  }
  const c = race.car; if (c) { const [a, b] = mapaEsc(c.x, c.y); r.mpEu.setAttribute("cx", a.toFixed(1)); r.mpEu.setAttribute("cy", b.toFixed(1)); }
  const g = idLider && race.ghosts.get(idLider); r.mpLid.style.display = g ? "" : "none"; if (g) { const [a, b] = mapaEsc(g.x, g.y); r.mpLid.setAttribute("cx", a.toFixed(1)); r.mpLid.setAttribute("cy", b.toFixed(1)); }
}
const pc = (v) => Math.round(Math.max(0, Math.min(1, v)) * 100);
const corRodas = (r, nivel) => { for (const k of ["w0", "w1", "w2", "w3"]) set(r[k], "c", "mp-roda " + nivel); };
const ATU = {
  resumo(ctx, r) {
    const m = ctx.m, pn = race.pneu, F = F1U(), M_ = M(); if (!m || !pn) return;
    const e = M_.estadoDoPneu(pn, F), tipo = F.PNEUS[pn.composto] || F.PNEUS[F.COMPOSTO_PADRAO], B = race.box, j = ctx.janela, voltaAtual = Math.min(E.S.config.voltas, (m.laps || 0) + 1);
    const COR = { bom: "#2ee08a", medio: "#ffb02e", baixo: "#ff6a3d", fim: "#ff3d4a" };
    // o cartão da estratégia: a contagem muda com a situação (no box; box pedido; a janela chegando; senão, quanto o pneu de agora aguenta)
    let tit = "PNEU ATUAL", chip = tipo, num = "—", un = "", sub = "", prog = e.vida / 100, alerta = false;
    const prox = B && !B.fase ? (B.pedido && F.PNEUS[B.pedido] ? F.PNEUS[B.pedido] : F.PNEUS[proximo()]) : null;
    if (B && B.fase) { tit = "NO BOX"; num = "BOX"; sub = "parada em andamento"; prog = 1; }
    else if (B && B.pedido) { tit = "BOX PEDIDO"; chip = prox || tipo; num = "BOX"; sub = "nesta passagem pelo box"; alerta = true; }
    else if (j && j.precisa && Number.isFinite(j.abre) && prox) { const faltam = Math.max(0, j.abre - voltaAtual); tit = "PRÓXIMO PNEU"; chip = prox; num = faltam === 0 ? "AGORA" : String(faltam); un = faltam === 0 ? "" : faltam === 1 ? " volta" : " voltas"; sub = faltam === 0 ? "a janela de box está aberta" : "até a janela de box"; alerta = faltam <= 1; prog = Math.max(0, Math.min(1, 1 - faltam / 10)); }
    else { const v = ctx.tp, n = v ? Math.max(0, Math.floor(v.voltas)) : null; num = e.nivel === "fim" ? "NO LIMITE" : n == null || v.voltas >= 90 ? `${e.vida}%` : String(n); un = e.nivel === "fim" || n == null || v.voltas >= 90 ? "" : n === 1 ? " volta" : " voltas"; sub = e.nivel === "fim" ? "faça a parada" : n == null || v.voltas >= 90 ? "de vida" : "o pneu ainda aguenta"; alerta = e.nivel === "fim"; }
    set(r.rpTit, "t", tit); set(r.rpChip, "t", chip.nome.toUpperCase()); set(r.rpChip, "style", `--c:${chip.cor}`); set(r.rpFaixa, "style", `stroke:${chip.cor}`);
    set(r.rpNum, "t", num); set(r.rpUn, "t", un); set(r.rpSub, "t", sub); set(r.rpProg, "w", Math.round(prog * 100) + "%"); set(r.rpProg, "style", `background:${chip.cor}`);
    set(r.rpCard, "c", "rs-card rs-pneu" + (alerta ? " alerta" : ""));
    // os jogos: quantos sobram de cada composto; o anel é a vida do jogo que está no carro, cheio nos guardados (novos), vazio sem jogo
    const jogos = jogosDe(m);
    for (const c of ["duro", "medio", "macio", "intermediario", "chuva"]) {
      const n = jogos[c] ?? 0, atual = pn.composto === c, frac = atual ? e.vida / 100 : n > 0 ? 1 : 0;
      set(r["jgn" + c], "t", n); set(r["jg" + c], "c", "rs-jg-i" + (n <= 0 && !atual ? " vazio" : "") + (atual ? " atual" : "")); set(r["jg" + c], "style", `--c:${F.PNEUS[c].cor}`);
      set(r["jgv" + c], "style", `stroke-dasharray:${(frac * 88).toFixed(1)} 88`);
    }
    // o centro: os quatro pneus (o mesmo conjunto) e a condição geral do carro
    const dano = Math.max(0, Math.min(100, m.dano || 0)), cond = Math.round(100 - dano), corT = e.temp === "Ideal" ? "#2ee08a" : e.temp === "Frio" ? "#5fc8ff" : "#ff6a3d";
    for (let i = 0; i < 4; i++) { set(r["tpV" + i], "t", e.vida + "%"); set(r["tpT" + i], "t", e.temp); set(r["tpB" + i], "w", Math.round(e.tempPct * 100) + "%"); set(r["tpB" + i], "style", `background:${corT}`); set(r["rcR" + i], "style", `fill:${COR[e.nivel]}`); }
    set(r.rcCond, "t", cond + "%"); set(r.rcAnel, "style", `stroke-dasharray:${(cond / 100 * 578).toFixed(0)} 578;stroke:${cond > 66 ? "var(--equipe,#2ee08a)" : cond > 33 ? "#ffb02e" : "#ff3d4a"}`);
    // os danos (clicável: abre a página Danos)
    const des = Math.round(F.efeitoDoDano(dano).final * 100), b = m.ultimaBatida;
    set(r.rdPct, "t", cond + "%"); set(r.rdBarra, "w", cond + "%"); set(r.rdBarra, "c", cond > 66 ? "bom" : cond > 33 ? "medio" : "baixo");
    set(r.rdSub, "t", dano < 1 ? "sem danos" : `${des}% do desempenho${b ? ` · última batida ${b.nivel === "media" ? "média" : b.nivel}` : ""}`);
    set(r.rdCard, "c", "rs-card rs-dano" + (dano >= 33 ? " alerta" : "")); set(r.rdSil, "c", "sil " + (cond > 66 ? "bom" : cond > 33 ? "medio" : "baixo"));
    // o clima: o estado, a água e a previsão (sem número inventado: o jogo não mede a temperatura do ar e da pista)
    const agua = clima.agua || 0, estado = agua > 0.45 ? "Chuva" : agua > 0.15 ? "Molhado" : clima.chuva > 0.05 ? "Garoa" : "Seco";
    set(r.rlEstado, "t", estado); set(r.rlIco, "t", estado === "Seco" ? "☀" : estado === "Garoa" ? "🌦" : "🌧"); set(r.rlAgua, "t", Math.round(agua * 100) + "%");
    const S = E.S, mud = S.clima && S.clima.chove && F.proximaMudanca && clima.t >= 0 ? F.proximaMudanca(S.clima, clima.t) : null;
    set(r.rlPrev, "t", !mud ? "Estável" : mud.tipo === "comeca" ? "Chuva chegando" : mud.tipo === "para" ? "Chuva parando" : "Mudando");
    // o rodapé: o líder, os intervalos e o mapa
    const lid = ctx.st[0], eqs = window.F1Pilotos ? window.F1Pilotos.EQUIPES : {};
    if (lid) { const p = lid.p, eq = eqs[p.equipe]; set(r.rlNome, "t", lid.id === m.id ? "VOCÊ" : (p.nomeCompleto || p.name || "").split(" ").slice(-1)[0].toUpperCase()); set(r.rlEq, "t", eq ? eq.nome : ""); if (p.equipe && r.rlLogo.dataset.eq !== p.equipe) { r.rlLogo.dataset.eq = p.equipe; r.rlLogo.src = (window.logoF1 || ((i) => "/api/corrida/logo/" + i))(p.equipe); r.rlLogo.hidden = false; } }
    const nome = (id) => { const x = ctx.st.find((y) => y.id === id); return x ? (x.p.nomeCompleto || x.p.name || "").split(" ").slice(-1)[0].toUpperCase() : ""; }, i = ctx.int || {};
    set(r.gfT, "t", i.frente ? M_.intervalo(i.frente.seg, "-") + " s" : "—"); set(r.gfN, "t", i.frente ? nome(i.frente.id) : "");
    set(r.gtT, "t", i.tras ? M_.intervalo(i.tras.seg, "+") + " s" : "—"); set(r.gtN, "t", i.tras ? nome(i.tras.id) : "");
    mapaDoResumo(r, lid && lid.id !== m.id ? lid.id : null);
  },
  pneus(ctx, r) {
    const pn = race.pneu; if (!pn) return;
    const F = F1U(), e = M().estadoDoPneu(pn, F), tipo = F.PNEUS[pn.composto] || F.PNEUS[F.COMPOSTO_PADRAO], B = race.box;
    const COR = { bom: "#2ee08a", medio: "#ffb02e", baixo: "#ff6a3d", fim: "#ff3d4a" };
    set(r.a0, "style", `--r:${e.vida};--c:${COR[e.nivel]}`); set(r.a0.firstChild, "t", e.vida + "%");
    set(r.pLetra, "t", window.HudTorre.LETRA[pn.composto] || "M"); set(r.pLetra, "style", `--c:${tipo.cor}`); set(r.pNome, "t", tipo.nome.toUpperCase());
    const v = ctx.tp, n = v ? Math.max(0, Math.floor(v.voltas)) : null;
    set(r.pVoltas, "t", n == null || v.voltas >= 90 ? "—" : e.nivel === "fim" ? "NO LIMITE" : `Aguenta ~${n} volta${n === 1 ? "" : "s"}`); set(r.pVoltas, "c", "pn2-voltas " + e.nivel);
    set(r.pTempT, "t", "Temperatura: " + e.temp);
    set(r.pProx, "t", B && !B.fase ? (B.pedido === "decidir" ? "NA GARAGEM" : F.PNEUS[B.pedido || proximo()].nome.toUpperCase()) : "—");
    set(r.pNota, "t", e.nivel === "fim" ? "Passou do limite: faça a parada." : v && v.medida ? "(no seu ritmo)" : "");
  },
  danos(ctx, r) {
    const m = ctx.m; if (!m) return; const d = Math.round(m.dano || 0), des = Math.round(F1U().efeitoDoDano(m.dano || 0).final * 100), nivel = d >= 66 ? "fim" : d >= 33 ? "medio" : "bom";
    set(r.dPct, "t", d + "%"); set(r.dT, "t", d + "%"); set(r.dBarra, "w", Math.min(100, d) + "%"); set(r.dBarra, "c", d >= 66 ? "baixo" : d >= 33 ? "medio" : "bom");
    set(r.dDes, "w", des + "%"); set(r.dDesT, "t", des + "%"); corRodas(r, "neutra"); set(r.corpo, "c", "mp-corpo " + nivel); set(r.asaT, "c", "mp-asa " + nivel);
    const b = m.ultimaBatida; set(r.dBatida, "t", b ? `Última batida: ${b.nivel === "media" ? "média" : b.nivel} (+${Math.round(b.dano)}%)` : "Sem batidas");
  },
  ers(ctx, r) {
    const ers = race.ers; if (!ers) return; const F = F1U(), carga = pc(ers.carga), m = ctx.modoErs;
    set(r.eBat, "t", carga + "%"); set(r.eBatB, "w", carga + "%"); set(r.eBatB, "c", race.ersAtivo ? "on" : carga < 20 ? "baixo" : carga < 50 ? "medio" : "bom"); set(r.eEst, "t", m ? m.texto : "—");
    const rec = pc((ers.recarga || 0) / F.ERS_MAX_RECARGA); set(r.eRecB, "w", rec + "%"); set(r.eRecT, "t", rec + "%");
    set(r.eModo, "t", E.S.config.ers === "manual" ? "Manual (segure Shift)" : "Automático");
    const pronto = !!ctx.m && ctx.m.drsZona >= 0; set(r.eDrs, "t", race.drsAtivo ? "Aberto" : pronto ? "Disponível na zona" : "Indisponível");
  },
  box(ctx, r) {
    const m = ctx.m, F = F1U(), B = race.box; if (!m || !B) return;
    const j = ctx.janela;
    if (B.fase) { set(r.bJan, "t", "NO BOX"); set(r.bSub, "t", ""); }
    else if (!j) { set(r.bJan, "t", "—"); set(r.bSub, "t", ""); }
    else if (!j.precisa) { set(r.bJan, "t", "SEM PARADA"); set(r.bSub, "t", j.motivo); }
    else { set(r.bJan, "t", j.abre === j.fecha ? `VOLTA ${j.abre}` : `VOLTA ${j.abre} – ${j.fecha}`); set(r.bSub, "t", j.motivo || "janela estimada pelo desgaste"); }
    const jogos = jogosDe(m), sel = B.pedido || proximo(), atual = race.pneu ? race.pneu.composto : null;
    for (const c of ["macio", "medio", "duro", "chuva", "intermediario"]) {
      const bt = r["bx" + c], n = jogos[c];
      set(bt, "c", "bx-btn" + (B.pedido === c ? " pedido" : sel === c ? " sel" : "") + (n <= 0 && !(m.stopGo && c === atual) ? " esgotado" : "") + (c === atual ? " atual" : ""));
      set(bt, "style", `--c:${F.PNEUS[c].cor}`); set(bt.querySelector("span"), "t", n <= 0 ? "esgotado" : n + (n === 1 ? " jogo" : " jogos"));
    }
    set(r.bInfo, "t", [B.pedido ? `PEDIDO: ${nomeDoPedido(B.pedido)}` : "Sem pedido", ctx.retorno ? `volta em ${ctx.retorno}º (est.)` : "", ctx.perda != null ? `troca ~${ctx.perda.toFixed(0)} s` : ""].filter(Boolean).join(" · "));
    set(r.bDica, "d", B.fase ? "none" : "");
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
