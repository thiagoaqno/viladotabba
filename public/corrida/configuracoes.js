// Corrida da Galera — a tela CONFIGURAÇÕES, como nos jogos: quatro abas (Gráficos, Controle, Áudio e Geral), cada uma com as suas
// partes, em vez dos botões soltos na barra de cima. Abre pela engrenagem do menu, pelo botão "Configurações" da barra e pelo menu da
// corrida (☰). Esc ou o ✕ fecham. O que cada item faz continua no módulo dele:
//  - Gráficos: qualidade.js (predefinição, resolução, efeitos, sombras, retrovisores, adversários e o retrovisor virtual);
//  - Controle: teclas-ui.js (remapear teclas e botões) e forca-volante.js (força no volante e vibração);
//  - Áudio: sons.js (som ligado e volume geral), mixer.js (o volume de cada som) e radio.js (a voz do engenheiro);
//  - Geral: o painel da primeira pessoa (qualidade.js), a linha de frenagem (linha-frenagem.js) e o tema da sala (menus.js), pelos
//    mesmos botões de antes (agora escondidos na barra), e "Como jogar".
import { graficos, mudarGraficos, aoMudarGraficos, RESOLUCOES } from "./qualidade.js";
import { abrirTeclas } from "./teclas-ui.js";
import { CANAIS, ler as lerSom, mudar as mudarSom } from "./mixer.js";
import { Sound } from "./sons.js";
import { estiloHud, definirEstiloHud, ESTILOS_HUD } from "./hud-telemetria.js";

const ABAS = [["graficos", "Gráficos"], ["controle", "Controle"], ["audio", "Áudio"], ["geral", "Geral"]];
const CHAVE_ABA = "corrida:config:aba";
let tela = null, aba = (() => { try { return localStorage.getItem(CHAVE_ABA) || "graficos"; } catch { return "graficos"; } })();
const h = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// as linhas: um seletor de opções (botões), uma lista, uma chave de ligar/desligar ou uma régua
const opcoes = (chave, valor, lista) => `<div class="cfg-seg" role="radiogroup">${lista.map(([v, nome]) => `<button type="button" role="radio" aria-checked="${String(v) === String(valor)}" data-g="${chave}" data-v="${h(v)}">${h(nome)}</button>`).join("")}</div>`;
const linha = (nome, dica, controle) => `<div class="cfg-linha"><div class="cfg-rot"><b>${nome}</b>${dica ? `<small>${dica}</small>` : ""}</div><div class="cfg-ctl">${controle}</div></div>`;
const parte = (titulo, corpo) => `<section class="cfg-parte"><h3>${titulo}</h3>${corpo}</section>`;
const chave = (attr, ligado) => `<button type="button" class="cfg-chave" role="switch" aria-checked="${!!ligado}" ${attr}><i></i></button>`;

function abaGraficos() {
  const g = graficos(), PRE = [["baixa", "Baixa"], ["media", "Média"], ["alta", "Alta"]];
  return parte("Predefinição", linha("Qualidade geral", g.predef === "personalizada" ? "Personalizada: você mudou algum item abaixo" : "Põe todos os itens abaixo de uma vez (tecla G na corrida)",
      opcoes("predef", g.predef, g.predef === "personalizada" ? [...PRE, ["personalizada", "Personalizada"]] : PRE)))
    + parte("Tela", linha("Resolução", "A altura do desenho em pixels. Menor é mais leve; a janela continua do mesmo tamanho",
      `<select data-g="resolucao">${RESOLUCOES.map(([v, n]) => `<option value="${v}" ${v === g.resolucao ? "selected" : ""}>${n}</option>`).join("")}</select>`))
    + parte("Qualidade",
      linha("Efeitos", "Baixa: sem efeitos. Média: cor por clima, brilho e vinheta. Alta: tudo, com desfoque de velocidade", opcoes("efeitos", g.efeitos, [["baixa", "Baixa"], ["media", "Média"], ["alta", "Alta"]]))
      + linha("Sombras", "Do sol, em volta do carro", opcoes("sombras", g.sombras, [["desligadas", "Desligadas"], ["baixas", "Baixas"], ["altas", "Altas"]]))
      + linha("Carros dos adversários", "Simples: as peças pequenas somem mais perto (mais leve com o grid cheio)", opcoes("adversarios", g.adversarios, [["simples", "Simples"], ["detalhados", "Detalhados"]])))
    + parte("Retrovisores",
      linha("Retrovisores do carro", "Os espelhos de verdade, nas laterais do cockpit", opcoes("espelhos", g.espelhos, [[false, "Desligados"], [true, "Ligados"]]))
      + linha("Retrovisor virtual", "A faixa fina no alto e no centro da tela, com a pista atrás", opcoes("retroVirtual", g.retroVirtual, [["desligado", "Desligado"], ["dentro", "Só em primeira pessoa"], ["sempre", "Sempre"]])));
}
function abaControle() {
  return parte("Teclado e controle", linha("Teclas e botões", "Trocar qual tecla ou botão faz cada coisa, e a sensibilidade da direção", `<button type="button" class="cfg-bt" data-acao="teclas">Remapear</button>`))
    + (window.ForcaVolante ? parte("Volante", `<div class="cfg-livre">${window.ForcaVolante.html()}</div>`) : "")
    + (document.getElementById("bCamAjuste") && !document.getElementById("race")?.classList.contains("hidden") ? parte("Câmera", linha("Ajuste da câmera", "Campo de visão, altura, distância, inclinação e tremor (tecla H na corrida)", `<button type="button" class="cfg-bt" data-acao="camera">Ajustar</button>`)) : "");
}
function abaAudio() {
  const sons = CANAIS.filter(([k]) => lerSom(k) != null).map(([k, nome, dica]) => { const v = Math.round(lerSom(k) * 100);
    return linha(nome, dica, `<input type="range" min="0" max="100" value="${v}" data-som="${k}"><output data-som-v="${k}">${v}%</output>`); }).join("");
  return parte("Som", linha("Som do jogo", "Liga e desliga tudo", chave("data-acao=\"som\"", Sound.on)))
    + parte("Volumes", sons)
    + parte("Rádio", linha("Voz do engenheiro", "Os avisos da equipe durante a corrida", `<button type="button" class="cfg-bt cfg-radio" data-radio-botao></button>`));
}
function abaGeral() {
  const g = graficos(), linhaFreio = document.getElementById("btnLinhaFreio"), tema = document.getElementById("btnTemaSala");
  return parte("Interface",
      linha("Estilo do HUD", "Novo: o da transmissão da F1 (torre e mostrador). Compacto: o novo com o painel pequeno no canto. Telemetria: o mostrador alternativo. Clássico: os painéis de antes", `<div class="cfg-seg" role="radiogroup">${ESTILOS_HUD.map(([v, nome]) => `<button type="button" role="radio" aria-checked="${v === estiloHud()}" data-hud="${v}">${nome}</button>`).join("")}</div>`)
      + linha("Minimapa", "Embaixo à esquerda ou em cima à direita, embaixo dos tempos", opcoes("mapa", g.mapa, [["baixo", "Embaixo"], ["cima", "Em cima"]]))
      + linha("Painel em primeira pessoa", "No estilo Novo, com a câmera de dentro do carro: só a bateria e a velocidade no canto de baixo", opcoes("painelDentro", g.painelDentro, [[true, "Compacto"], [false, "Completo"]]))
      + (linhaFreio ? linha("Linha de frenagem", "Marcas na pista: verde acelera, amarelo alivia, vermelho freia", chave("data-acao=\"linha\"", linhaFreio.getAttribute("aria-pressed") === "true")) : "")
      + (tema && !tema.classList.contains("hidden") ? linha("Modo escuro na sala", "", chave("data-acao=\"tema\"", tema.getAttribute("aria-pressed") === "true")) : ""))
    + parte("Ajuda", linha("Como jogar", "As teclas, as regras e as dicas", `<button type="button" class="cfg-bt" data-acao="regras">Abrir</button>`));
}
const CORPO = { graficos: abaGraficos, controle: abaControle, audio: abaAudio, geral: abaGeral };

function desenhar() {
  if (!tela) return;
  tela.querySelector(".cfg-abas").innerHTML = ABAS.map(([id, nome]) => `<button type="button" role="tab" aria-selected="${id === aba}" data-aba="${id}">${nome}</button>`).join("");
  tela.querySelector(".cfg-corpo").innerHTML = CORPO[aba]();
  if (aba === "audio") window.Radio?.desenharBotoes?.(); // (o radio.js desenha o botão novo da voz do engenheiro)
}
function montar() {
  tela = document.createElement("div"); tela.id = "cfgTela"; tela.className = "cfg hidden";
  tela.innerHTML = `<div class="cfg-caixa" role="dialog" aria-modal="true" aria-label="Configurações">
    <header><b>Configurações</b><button type="button" class="cfg-x" data-acao="fechar" aria-label="Fechar (Esc)">✕</button></header>
    <div class="cfg-meio"><nav class="cfg-abas" role="tablist"></nav><div class="cfg-corpo"></div></div></div>`;
  document.body.appendChild(tela);
  tela.addEventListener("click", (e) => {
    if (e.target === tela) return fecharConfig();
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.aba) { aba = b.dataset.aba; try { localStorage.setItem(CHAVE_ABA, aba); } catch {} return desenhar(); }
    if (b.dataset.hud) { definirEstiloHud(b.dataset.hud); return desenhar(); }
    if (b.dataset.g) { const v = b.dataset.v; mudarGraficos({ [b.dataset.g]: v === "true" ? true : v === "false" ? false : v }); return desenhar(); }
    const a = b.dataset.acao;
    if (a === "fechar") return fecharConfig();
    if (a === "teclas") { fecharConfig(); return abrirTeclas(); }
    if (a === "camera") { fecharConfig(); return document.getElementById("bCamAjuste")?.click(); }
    if (a === "regras") { fecharConfig(); return document.getElementById("btnRules")?.click(); }
    if (a === "som") { document.getElementById("btnSound")?.click(); return desenhar(); }
    if (a === "linha") { document.getElementById("btnLinhaFreio")?.click(); return desenhar(); }
    if (a === "tema") { document.getElementById("btnTemaSala")?.click(); return desenhar(); }
  });
  tela.addEventListener("change", (e) => { const k = e.target.dataset?.g; if (k) { mudarGraficos({ [k]: e.target.value }); desenhar(); } });
  tela.addEventListener("input", (e) => {
    const k = e.target.dataset?.som; if (!k) return;
    mudarSom(k, e.target.value / 100); const o = tela.querySelector(`[data-som-v="${k}"]`); if (o) o.textContent = e.target.value + "%";
  });
  tela.addEventListener("keydown", (e) => { e.stopPropagation(); if (e.key === "Escape") fecharConfig(); }); // (as setas nos controles não pilotam)
  aoMudarGraficos(() => { if (tela && !tela.classList.contains("hidden") && aba === "graficos") desenhar(); }); // (a tecla G muda a predefinição)
}
export function abrirConfig(qual) {
  if (!tela) montar();
  if (qual && CORPO[qual]) aba = qual;
  desenhar(); tela.classList.remove("hidden");
  tela.querySelector(`[data-aba="${aba}"]`)?.focus();
}
export function fecharConfig() { tela?.classList.add("hidden"); }
// os pontos de entrada: [data-config] (a engrenagem do menu, o botão da barra e o item do menu da corrida)
document.addEventListener("click", (e) => { const b = e.target.closest?.("[data-config]"); if (b) { e.preventDefault(); e.stopPropagation(); abrirConfig(b.dataset.config || undefined); } }, true);
window.Configuracoes = { abrir: abrirConfig, fechar: fecharConfig };
