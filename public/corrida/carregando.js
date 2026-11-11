// Corrida da Galera — a TELA DE CARREGAMENTO ao entrar numa corrida ou classificação: cobre a montagem da pista e o aquecimento (shaders
// e malhas, jogo.js) e a espera pelos outros pilotos da sala (o servidor só começa a TV e as luzes, ou o Q1, quando todos carregaram).
// Uma das capas (as ilustrações dos pilotos) sorteada no fundo e, embaixo, um F1 de perfil andando numa faixa de pista conforme a etapa:
// montando a pista, preparando os gráficos, esperando os pilotos. Os pneus giram, a faixa do asfalto corre e as linhas de velocidade passam
// só com `transform` (o navegador desenha isso fora da linha principal): tudo continua se mexendo enquanto a montagem ocupa a página.
// Interação: o fundo e o carro seguem o mouse (paralaxe) e um clique (ou espaço) acelera o carro, com fumaça e pneus mais rápidos.
const CAPAS = ["carregamento-kimi.jpg", "carregamento-verts.jpg", "carregamento-hamil.jpg", "carregamento-bortoleto.webp", "carregamento-russell.webp", "carregamento-leclerc.webp", "carregamento-senna.jpg", "carregamento-perez.webp", "carregamento-alonso.webp", "carregamento-bottas.webp", "carregamento-bortoleto-interlagos.webp", "carregamento-hamilton-suzuka.webp", "carregamento-antonelli-monza.webp", "carregamento-norris-antonelli.webp", "carregamento-hamilton-verstappen.webp", "carregamento-ferrari-mexico.webp"];
const DICAS = ["Segure Shift esquerdo para usar o ERS", "P abre o acerto do carro: asa e altura", "B chama o box; 1 a 5 escolhem o pneu", "C troca a câmera; J ajusta a sua", "M abre e fecha o som; o mixer fica no menu", "Na largada, o ERS só entra depois dos 50 km/h"];
// o quanto o carro já andou em cada etapa (0 a 1)
const ETAPAS = [[/^Montando/, 0.12], [/^Preparando/, 0.45], [/^Esperando/, 0.78], [/^Quase/, 0.9]];

let tela = null, dicaT = 0, ultimoP = 0, aoMover = null, aoTecla = null;

const CSS = `
.cg{position:fixed;inset:0;z-index:1000;overflow:hidden;background:#07090e;color:#f5f5f2;font-family:'Barlow Condensed','Titillium Web',Arial,sans-serif;opacity:1;transition:opacity .35s ease}
.cg.saindo{opacity:0}
.cg-fundo{position:absolute;inset:-4%;background-size:cover;background-position:center;transform:translate3d(calc(var(--mx,0)*-14px),calc(var(--my,0)*-10px),0) scale(1.04);transition:transform .25s ease-out;animation:cg-zoom 18s ease-in-out infinite alternate}
@keyframes cg-zoom{from{scale:1}to{scale:1.06}}
.cg:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,#07090ef2 0%,#07090eb0 34%,#07090e10 70%),linear-gradient(0deg,#07090ef5 0%,#07090e00 42%);pointer-events:none}
.cg-txt{position:absolute;left:clamp(20px,6vw,90px);top:clamp(24px,9vh,110px);z-index:2;max-width:min(520px,80vw)}
.cg-marca{font-weight:900;font-style:italic;font-size:clamp(26px,4.2vw,44px);letter-spacing:-.04em;line-height:.9}
.cg-marca small{display:block;color:var(--cg-cor,#e10600);font-size:12px;font-style:normal;letter-spacing:.24em;margin-top:4px}
.cg-pista{margin-top:clamp(22px,5vh,48px);font-size:clamp(32px,5.6vw,64px);font-weight:800;text-transform:uppercase;letter-spacing:.01em;line-height:.95;text-shadow:0 4px 24px #000a}
.cg-etapa{margin-top:10px;font-size:18px;font-weight:600;color:#c9d0da;letter-spacing:.04em;text-transform:uppercase}
.cg-etapa:before{content:"";display:inline-block;width:8px;height:8px;margin-right:10px;border-radius:50%;background:var(--cg-cor,#e10600);box-shadow:0 0 12px var(--cg-cor,#e10600);animation:cg-pisca 1s ease-in-out infinite;vertical-align:middle}
@keyframes cg-pisca{50%{opacity:.25}}
.cg-baixo{position:absolute;left:clamp(16px,6vw,90px);right:clamp(16px,6vw,90px);bottom:clamp(18px,6vh,64px);z-index:2}
.cg-faixa{position:relative;height:74px}
.cg-asfalto{position:absolute;left:0;right:0;bottom:0;height:16px;border-radius:3px;overflow:hidden;background:#1b1e24;box-shadow:inset 0 2px 0 #ffffff14}
.cg-asfalto:before{content:"";position:absolute;inset:7px -60px auto 0;height:2px;background:repeating-linear-gradient(90deg,#ffffff70 0 26px,transparent 26px 52px);animation:cg-corre .5s linear infinite}
.cg-asfalto:after{content:"";position:absolute;left:0;right:0;top:0;height:3px;background:repeating-linear-gradient(90deg,var(--cg-cor,#e10600) 0 18px,#f4f4f4 18px 36px);opacity:.9}
@keyframes cg-corre{to{transform:translateX(-52px)}}
.cg-feito{position:absolute;left:0;bottom:0;height:16px;width:100%;transform-origin:left;transform:scaleX(var(--p,0));transition:transform 1.1s cubic-bezier(.3,.8,.3,1);background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--cg-cor,#e10600) 45%,transparent));border-radius:3px}
.cg-trilho{position:absolute;left:0;bottom:12px;width:calc(100% - 192px);height:62px;transform:translateX(calc(var(--p,0)*100%));transition:transform 1.1s cubic-bezier(.3,.8,.3,1)}
.cg-carro{position:absolute;left:0;bottom:0;width:192px;height:62px;transform:translate3d(calc(var(--mx,0)*6px),0,0) rotate(calc(var(--mx,0)*-1deg));transition:transform .2s ease-out;animation:cg-pula .32s ease-in-out infinite alternate}
@keyframes cg-pula{to{translate:0 -1.2px}}
.cg-carro svg{width:192px;height:62px;overflow:visible;filter:drop-shadow(0 8px 6px #0009)}
.cg-roda{transform-box:fill-box;transform-origin:center;animation:cg-gira .28s linear infinite}
.cg.turbo .cg-roda{animation-duration:.09s}
@keyframes cg-gira{to{transform:rotate(360deg)}}
.cg-vento{position:absolute;right:100%;bottom:22px;width:120px;height:30px;margin-right:-6px;pointer-events:none}
.cg-vento i{position:absolute;right:0;height:2px;border-radius:2px;background:linear-gradient(90deg,transparent,#ffffffb0);animation:cg-risco .55s linear infinite}
.cg-vento i:nth-child(1){top:2px;width:70px}.cg-vento i:nth-child(2){top:13px;width:110px;animation-delay:-.2s}.cg-vento i:nth-child(3){top:24px;width:56px;animation-delay:-.37s}
@keyframes cg-risco{from{transform:translateX(30px);opacity:0}30%{opacity:1}to{transform:translateX(-110px);opacity:0}}
.cg.turbo .cg-vento i{animation-duration:.22s}
.cg-fumaca{position:absolute;left:4px;bottom:4px;width:22px;height:22px;border-radius:50%;background:#d8dde4;opacity:0;pointer-events:none}
.cg.turbo .cg-fumaca{animation:cg-fumo .5s ease-out infinite}
.cg.turbo .cg-fumaca:nth-of-type(2){animation-delay:-.25s}
@keyframes cg-fumo{from{transform:translate(0,0) scale(.4);opacity:.7}to{transform:translate(-70px,-10px) scale(2.2);opacity:0}}
.cg-marcos{display:flex;justify-content:space-between;margin-top:12px;font-size:13px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#7f8996}
.cg-marcos b{font-weight:600;transition:color .4s}.cg-marcos b.on{color:#f5f5f2}
.cg-dica{margin-top:14px;font-size:15px;color:#aeb6c2;min-height:20px;transition:opacity .4s}
.cg-dica kbd{font:inherit;color:#fff;font-weight:700}
.cg-toque{position:absolute;right:clamp(16px,6vw,90px);bottom:calc(clamp(18px,6vh,64px) + 128px);z-index:2;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#ffffff80}
@media (max-width:640px){.cg-trilho{width:calc(100% - 128px)}.cg-carro,.cg-carro svg{width:128px;height:42px}.cg-toque{display:none}}
@media (prefers-reduced-motion:reduce){.cg-fundo,.cg-carro,.cg-roda,.cg-vento i,.cg-asfalto:before{animation:none!important}}
`;

// um F1 de perfil, virado para a direita (o bico em x = 188): a asa de trás alta, a tampa do motor com a entrada de ar, o capacete e o halo,
// o assoalho, o bico comprido com a asa da frente, e as duas rodas com raios e a faixa amarela da Pirelli
const CARRO = `<svg viewBox="0 0 192 62" aria-hidden="true">
  <rect x="2" y="7" width="24" height="5" rx="1.5" fill="#11151c"/><rect x="4" y="9" width="4" height="30" rx="1" fill="#11151c"/><rect x="2" y="12" width="20" height="3" fill="var(--cg-cor,#e10600)"/>
  <path d="M10 41 L14 31 L36 28 L58 24 L64 13 L76 13 L80 23 L98 25 L132 29 L162 33 L188 37 L188 41 Z" fill="var(--cg-cor,#e10600)"/>
  <path d="M56 31 Q92 26 126 31 L128 40 L56 40 Z" fill="#000" opacity=".28"/>
  <path d="M64 13 L76 13 L74 18 L66 18 Z" fill="#11151c"/>
  <circle cx="90" cy="21" r="4.6" fill="#f2f2f2"/><rect x="88" y="19.5" width="6" height="2.2" rx="1" fill="#11151c"/>
  <path d="M80 24 Q90 12 104 25" stroke="#d8dde4" stroke-width="2.6" fill="none"/>
  <path d="M14 41 L188 41 L186 44 L16 44 Z" fill="#11151c"/>
  <rect x="164" y="42" width="27" height="3" rx="1" fill="#11151c"/><rect x="187" y="35" width="3" height="10" rx="1" fill="#11151c"/><rect x="166" y="40" width="22" height="2" fill="var(--cg-cor,#e10600)"/>
  <g class="cg-roda"><circle cx="36" cy="44" r="15" fill="#15181e"/><circle cx="36" cy="44" r="15" fill="none" stroke="#2b2f37" stroke-width="3"/><circle cx="36" cy="44" r="6" fill="#9aa3ad"/><path d="M36 31 V57 M23 44 H49" stroke="#555c66" stroke-width="2"/><path d="M26 35 A13 13 0 0 1 46 35" stroke="#ffd100" stroke-width="2" fill="none"/></g>
  <g class="cg-roda"><circle cx="152" cy="45" r="13" fill="#15181e"/><circle cx="152" cy="45" r="13" fill="none" stroke="#2b2f37" stroke-width="3"/><circle cx="152" cy="45" r="5" fill="#9aa3ad"/><path d="M152 34 V56 M141 45 H163" stroke="#555c66" stroke-width="2"/><path d="M143 37 A11 11 0 0 1 161 37" stroke="#ffd100" stroke-width="2" fill="none"/></g>
</svg>`;

function progresso(p) { if (!tela) return; ultimoP = Math.max(ultimoP, Math.min(1, p)); tela.style.setProperty("--p", ultimoP.toFixed(3));
  const m = tela.querySelectorAll(".cg-marcos b"); m.forEach((b, i) => b.classList.toggle("on", ultimoP >= [0.1, 0.4, 0.75, 0.99][i])); }
function trocarDica() { if (!tela) return; const d = tela.querySelector(".cg-dica"); d.style.opacity = 0; setTimeout(() => { if (!tela) return; d.textContent = DICAS[Math.floor(Math.random() * DICAS.length)]; d.style.opacity = 1; }, 400); }
function turbo() { if (!tela) return; tela.classList.add("turbo"); clearTimeout(tela._turbo); tela._turbo = setTimeout(() => tela && tela.classList.remove("turbo"), 900); }

// titulo: o nome da pista; etapa: o texto da etapa; cor: a cor da equipe (opcional)
export function mostrarCarga(titulo, etapa, cor) {
  if (!tela) {
    if (!document.getElementById("cgEstilo")) { const s = document.createElement("style"); s.id = "cgEstilo"; s.textContent = CSS; document.head.appendChild(s); }
    tela = document.createElement("div"); tela.className = "cg"; tela.id = "carregandoPista"; tela.setAttribute("role", "status"); tela.setAttribute("aria-live", "polite");
    tela.innerHTML = `<div class="cg-fundo" style="background-image:url(/corrida/${CAPAS[Math.floor(Math.random() * CAPAS.length)]})"></div>
      <div class="cg-txt"><div class="cg-marca">CORRIDA <small>DA GALERA</small></div><div class="cg-pista" data-titulo></div><div class="cg-etapa" data-etapa></div></div>
      <div class="cg-toque">Clique para acelerar</div>
      <div class="cg-baixo"><div class="cg-faixa"><div class="cg-asfalto"></div><div class="cg-feito"></div>
        <div class="cg-trilho"><div class="cg-carro"><div class="cg-vento"><i></i><i></i><i></i></div><span class="cg-fumaca"></span><span class="cg-fumaca"></span>${CARRO}</div></div></div>
        <div class="cg-marcos"><b>Pista</b><b>Gráficos</b><b>Pilotos</b><b>Largada</b></div><div class="cg-dica"></div></div>`;
    document.body.appendChild(tela);
    ultimoP = 0; progresso(0.04);
    aoMover = (e) => { if (!tela) return; tela.style.setProperty("--mx", ((e.clientX / innerWidth) * 2 - 1).toFixed(3)); tela.style.setProperty("--my", ((e.clientY / innerHeight) * 2 - 1).toFixed(3)); };
    aoTecla = (e) => { if (e.code === "Space" || e.code === "Enter") { e.preventDefault(); turbo(); } };
    tela.addEventListener("pointermove", aoMover); tela.addEventListener("pointerdown", turbo); addEventListener("keydown", aoTecla);
    trocarDica(); clearInterval(dicaT); dicaT = setInterval(trocarDica, 4500);
  }
  if (cor) tela.style.setProperty("--cg-cor", cor);
  tela.querySelector("[data-titulo]").textContent = titulo || "Preparando a corrida";
  etapaCarga(etapa || "Montando a pista");
}
export function etapaCarga(texto) {
  if (!tela) return;
  tela.querySelector("[data-etapa]").textContent = texto;
  for (const [re, p] of ETAPAS) if (re.test(texto)) progresso(p);
}
// some com o carro chegando ao fim da faixa e a tela apagando
export function esconderCarga() {
  if (!tela) return;
  const t = tela; tela = null; clearInterval(dicaT); removeEventListener("keydown", aoTecla);
  t.style.setProperty("--p", "1"); t.classList.add("turbo");
  setTimeout(() => { t.classList.add("saindo"); setTimeout(() => t.remove(), 380); }, 450);
}
export const cargaAberta = () => !!tela;
