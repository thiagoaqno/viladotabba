// Corrida da Galera — o montador do seu piloto em pixel art (2026-11-25, o Thiago: "um espaço para montar seu próprio piloto estilo pixel art").
// Fica na gaveta "Peças, pintura e capacete" da sala, abaixo do capacete (#pilotoPixelCartao). As peças são as do retrato montado (pixel-piloto.js):
// pele, cabelo, cor do cabelo, barba, olhos, rosto, nariz, sobrancelha, a risca, o sorriso, os óculos e o brinco. A prévia grande muda na hora, no
// macacão da sua equipe. Os traços ficam guardados neste navegador ("corrida:piloto-pixel") e vão para a sala em `mods.pixel` (o servidor confere em
// corrida-base.js limparPixel), assim os outros veem o seu piloto no cartão do HUD de transmissão. Como o capacete (capacete-editor.js): manda
// 1,2 s depois do último clique, e uma vez por sala ao entrar.
// (o estado da sala, estado.js, só é carregado quando o montador fala com a sala: ele depende do `Comum` da página do jogo, e o montador também
// roda na Central da carreira, temporada/index.html, onde não há sala)
let EST = null; const est = async () => EST || (EST = await import("./estado.js"));
import { retrato, tracosSorteados, PELES, CABELOS, CORES_CABELO, BARBAS, OLHOS, ROSTOS, NARIZES, SOBRANCELHAS } from "./pixel-piloto.js";

export const CHAVE_PIXEL = "corrida:piloto-pixel";
const PADRAO = { pele: 1, cabelo: "curto", cor: "castanho", barba: "nenhuma", olhos: "castanho", rosto: "oval", nariz: "medio", sobr: "media", risca: null, sorriso: false, oculos: false, brinco: false };
const NOMES = {
  cabelo: { curto: "Curto", raspado: "Raspado", topete: "Topete", ondulado: "Ondulado", cacheado: "Cacheado", longo: "Comprido", trancas: "Tranças", calvo: "Careca" },
  cor: { preto: "Preto", "castanho-escuro": "Castanho-escuro", castanho: "Castanho", "castanho-claro": "Castanho-claro", "loiro-escuro": "Loiro-escuro", loiro: "Loiro", ruivo: "Ruivo", grisalho: "Grisalho" },
  barba: { nenhuma: "Sem barba", rala: "Rala", cheia: "Cheia", bigode: "Bigode", cavanhaque: "Cavanhaque" },
  olhos: { castanho: "Castanhos", escuro: "Escuros", azul: "Azuis", verde: "Verdes", mel: "Mel" },
  rosto: { oval: "Oval", fino: "Fino", largo: "Largo", quadrado: "Quadrado" },
  nariz: { pequeno: "Pequeno", medio: "Médio", grande: "Grande" },
  sobr: { fina: "Fina", media: "Média", grossa: "Grossa" },
  risca: { "": "Sem risca", esq: "À esquerda", dir: "À direita" },
};
// as linhas do montador: [campo, rótulo, opções]
const LINHAS = [
  ["pele", "Pele", PELES.map((_, i) => i)], ["cabelo", "Cabelo", CABELOS], ["cor", "Cor do cabelo", Object.keys(CORES_CABELO)], ["risca", "Risca", ["", "esq", "dir"]],
  ["barba", "Barba", BARBAS], ["olhos", "Olhos", Object.keys(OLHOS)], ["sobr", "Sobrancelha", SOBRANCELHAS], ["rosto", "Rosto", ROSTOS], ["nariz", "Nariz", NARIZES],
  ["sorriso", "Sorriso", [false, true]], ["oculos", "Óculos", [false, true]], ["brinco", "Brinco", [false, true]],
];
const h = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const rotulo = (campo, v) => (campo === "pele" ? `Tom ${v + 1}` : typeof v === "boolean" ? (v ? "Sim" : "Não") : (NOMES[campo] && NOMES[campo][v ?? ""]) || String(v));

export function lerPixel() {
  let t = null; try { t = JSON.parse(localStorage.getItem(CHAVE_PIXEL)); } catch { /* sem armazenamento */ }
  return t && typeof t === "object" && CABELOS.includes(t.cabelo) ? { ...PADRAO, ...t } : null;
}
const gravar = (t) => { try { localStorage.setItem(CHAVE_PIXEL, JSON.stringify(t)); } catch { /* sem armazenamento */ } };

// ---------- a ligação com a sala ----------
let enviarT = 0, enviadoPara = null;
function enviar(t) { clearTimeout(enviarT); enviarT = setTimeout(async () => { const { E, me, act } = await est(); if (me() && E.S && E.S.phase !== "race") act("mods", { mods: { pixel: t } }); }, 1200); }
export async function sincronizarPixel() {
  const { E, me, act } = await est(), m = me(), salvo = lerPixel(); if (!m || !salvo || !E.S || E.S.phase === "race") return;
  const chave = E.S.code + ":" + m.id; if (enviadoPara === chave) return; enviadoPara = chave;
  if (JSON.stringify(m.mods?.pixel || null) !== JSON.stringify(salvo)) act("mods", { mods: { pixel: salvo } });
}

// ---------- o cartão ----------
function estilo() {
  if (document.getElementById("pxEstilo")) return;
  const s = document.createElement("style"); s.id = "pxEstilo";
  s.textContent = `.px-cartao{display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:start}
.px-prev{display:flex;flex-direction:column;align-items:center;gap:8px}
.px-prev img{width:144px;height:144px;image-rendering:pixelated;border-radius:10px;background:linear-gradient(160deg,#2a2f3c,#12141b);box-shadow:inset 0 0 0 1px #ffffff1a}
.px-prev .px-bts{display:flex;gap:6px}
.px-prev button{padding:6px 10px;font:600 12px inherit;color:#fff;background:#ffffff14;border:1px solid #ffffff26;border-radius:6px;cursor:pointer}
.px-prev button:hover{background:#ffffff26}
.px-linhas{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:4px 10px}
.px-l{display:flex;align-items:center;justify-content:space-between;gap:6px;min-height:30px;padding:0 4px 0 10px;background:#ffffff0d;border-radius:6px;font-size:13px}
.px-l span{opacity:.8}
.px-v{display:flex;align-items:center;gap:2px}
.px-v b{min-width:104px;text-align:center;font-weight:700}
.px-v button{width:26px;height:26px;padding:0;font-size:18px;line-height:1;color:inherit;background:none;border:0;border-radius:5px;cursor:pointer}
.px-v button:hover{background:#ffffff22}
.px-pele{display:inline-block;width:12px;height:12px;margin-right:6px;border-radius:3px;vertical-align:-1px;box-shadow:0 0 0 1px #0006}
@media (max-width:640px){.px-cartao{grid-template-columns:1fr}.px-prev img{width:96px;height:96px}}`;
  document.head.appendChild(s);
}
const corDoJogador = (m) => { const eq = m && m.equipe && window.F1Pilotos && window.F1Pilotos.EQUIPES[m.equipe]; return (eq && eq.cor) || (m && m.color) || "#3a6fd0"; };

// monta o montador em `el` (uma vez) e devolve { atual(), redesenhar() }. op: { aoMudar (t), cor () (a cor do macacão; sem ela, a da sua equipe na sala) }
export function montarMontador(el, op = {}) {
  if (op.cor) el._corPx = op.cor;
  if (el._pixel) { el._pixel.redesenhar(); return el._pixel; }
  estilo();
  let atual = lerPixel() || { ...tracosSorteados(op.nome || "eu") };
  el.innerHTML = `<div class="px-prev"><img alt="O seu piloto em pixel art" data-px="img"><div class="px-bts"><button type="button" data-px="sortear">🎲 Sortear</button></div></div>
    <div class="px-linhas">${LINHAS.map(([campo, nome]) => `<div class="px-l" data-campo="${campo}"><span>${h(nome)}</span><span class="px-v"><button type="button" data-d="-1" aria-label="${h(nome)}: anterior">‹</button><b></b><button type="button" data-d="1" aria-label="${h(nome)}: próximo">›</button></span></div>`).join("")}</div>`;
  const pintar = () => {
    el.querySelector('[data-px="img"]').src = retrato(atual, { cor: (el._corPx && el._corPx()) || "#3a6fd0", escala: 3 });
    for (const [campo, , lista] of LINHAS) {
      const b = el.querySelector(`[data-campo="${campo}"] b`); if (!b) continue;
      const v = campo === "risca" ? atual.risca || "" : typeof lista[0] === "boolean" ? !!atual[campo] : atual[campo]; // (sorteado, o brinco vinha sem valor)
      b.innerHTML = (campo === "pele" ? `<i class="px-pele" style="background:${PELES[v] || PELES[1]}"></i>` : "") + h(rotulo(campo, v));
      void lista;
    }
  };
  const mudou = () => { gravar(atual); pintar(); if (op.aoMudar) op.aoMudar(atual); };
  el.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.px === "sortear") { atual = { ...PADRAO, ...tracosSorteados(String(Math.random())) }; return mudou(); }
    const linha = b.closest("[data-campo]"); if (!linha || !b.dataset.d) return;
    const campo = linha.dataset.campo, lista = LINHAS.find((l) => l[0] === campo)[2], v = campo === "risca" ? atual.risca || "" : atual[campo];
    const i = lista.indexOf(v), novo = lista[((i < 0 ? 0 : i) + +b.dataset.d + lista.length) % lista.length];
    atual = { ...atual, [campo]: campo === "risca" ? novo || null : novo };
    mudou();
  });
  pintar();
  el._pixel = { atual: () => atual, redesenhar: pintar };
  return el._pixel;
}
// o cartão da sala (dentro de `#pilotoPixelCartao`)
export async function renderPixel() {
  const el = document.getElementById("pilotoPixelCartao"); if (!el) return;
  const { me } = await est();
  const ed = montarMontador(el, { aoMudar: enviar, cor: () => corDoJogador(me()), nome: (me() && me().name) || "eu" });
  if (!lerPixel()) { gravar(ed.atual()); enviar(ed.atual()); } // (a primeira vez: o sorteado pelo nome já vale como o seu)
}
