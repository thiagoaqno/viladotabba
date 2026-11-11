// Corrida da Galera — a TELA DE CARREGAMENTO ao entrar numa corrida ou classificação: cobre a montagem da pista e o aquecimento (shaders
// e malhas, jogo.js) e a espera pelos outros pilotos da sala (o servidor só começa a TV e as luzes, ou o Q1, quando todos carregaram).
// O visual é o da tela de abertura (index.html, .preparo-corrida), com uma das capas sorteada. A barra vermelha anima só com `transform`,
// que o navegador desenha fora da linha principal: ela continua andando mesmo quando a montagem da pista ocupa a página.
let tela = null, linha = null;
const CAPAS = ["kimi", "verts", "hamil"];

export function mostrarCarga(titulo, etapa) {
  if (!tela) {
    tela = document.createElement("div");
    tela.className = "preparo-corrida"; tela.id = "carregandoPista"; tela.setAttribute("role", "status"); tela.setAttribute("aria-live", "polite");
    tela.style.backgroundImage = `linear-gradient(90deg,#080b11e8 0%,#080b11a8 38%,#080b1122 80%),url(/corrida/carregamento-${CAPAS[Math.floor(Math.random() * CAPAS.length)]}.jpg)`;
    tela.innerHTML = `<div class="preparo-conteudo"><span class="preparo-marca">CORRIDA <small>DA GALERA</small></span><span class="preparo-linha" aria-hidden="true"></span><strong data-titulo></strong><p data-etapa></p></div>`;
    document.body.appendChild(tela);
    linha = tela;
  }
  tela.querySelector("[data-titulo]").textContent = titulo || "Preparando a corrida";
  etapaCarga(etapa || "Montando a pista");
}
export function etapaCarga(texto) { if (tela) tela.querySelector("[data-etapa]").textContent = texto; }
export function esconderCarga() { if (tela) { tela.remove(); tela = null; linha = null; } }
export const cargaAberta = () => !!tela;
