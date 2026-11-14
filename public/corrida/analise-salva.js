// Corrida da Galera — a análise 3D de um GP já guardado na carreira (solo e com os amigos), aberta pela aba Análise da Central
// (temporada/central-analise.js): as mesmas abas da tela do resultado (resultado-analise.js: Posições, Momentos, Ultrapassagens, Replay,
// Ritmo e Pneus) numa tela por cima da Central, que se redesenha sozinha e não pode levar um canvas 3D junto.
// O resumo do GP vem no save (`resultado.analise`); o replay, só quando a aba Replay pede (`pedirReplay`, o socket da carreira).
import { montarAnaliseSalva, soltarAnalise } from "/corrida/resultado-analise.js";

const h = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const corOk = (c) => (/^#[0-9a-f]{6}$/i.test(c || "") ? c : "#e10600");
let fechar = null;

// `r`: o resultado do save ({ ano, gp, pista, linhas, analise }); `titulo`: o nome do GP; `nomes`: { id: nome } dos humanos;
// `meu`: o id de quem olha ("voce"); `pedirReplay()`: Promise do replay (ou null)
export function abrirAnaliseSalva({ r, titulo, nomes = {}, meu = "voce", pedirReplay }) {
  if (fechar) fechar();
  const A = r && r.analise; if (!A || !A.pilotos) return;
  const FP = window.F1Pilotos || { EQUIPES: {}, PILOTOS: [] };
  const piloto = (id) => FP.PILOTOS.find((p) => p.id === id);
  const nomeDe = (id) => nomes[id] || (piloto(id) && piloto(id).nome) || id;
  const siglaDe = (id) => (piloto(id) && piloto(id).sigla) || String(nomeDe(id)).replace(/[^A-Za-zÀ-ú]/g, "").slice(0, 3).toUpperCase() || "???";
  const linhas = [...r.linhas].sort((a, b) => a.pos - b.pos);
  const players = linhas.map((l) => ({ id: l.piloto, name: nomeDe(l.piloto), nomeCompleto: nomeDe(l.piloto), equipe: l.equipe, sigla: siglaDe(l.piloto), color: corOk(FP.EQUIPES[l.equipe] && FP.EQUIPES[l.equipe].cor) }));
  const resultado = linhas.map((l) => ({ id: l.piloto, pos: l.pos, grid: Math.max(0, ((A.pilotos[l.piloto] && A.pilotos[l.piloto].g) || l.pos) - 1), dnf: !!l.dnf, nc: !!l.nc, dsq: false }));
  const chave = `salvo:${r.ano}:${r.gp}:${r.pista}`;
  const S = { startAt: chave, config: { pista: r.pista, regras: "f1", voltas: A.voltas }, players, resultado };
  const meuEq = (linhas.find((l) => l.piloto === meu) || {}).equipe, cor = corOk(FP.EQUIPES[meuEq] && FP.EQUIPES[meuEq].cor);

  const raiz = document.createElement("div"); raiz.className = "as"; raiz.setAttribute("role", "dialog"); raiz.setAttribute("aria-modal", "true"); raiz.setAttribute("aria-label", `Análise de ${titulo || r.pista}`);
  raiz.style.cssText = `--eq:${cor};--eq6:${cor}a6;--eq3:${cor}4d;--eq1:${cor}1f;--sv-eq:${cor}`;
  raiz.innerHTML = `<div class="as-caixa"><header class="as-topo"><div><small>Análise do GP · ${r.ano}</small><h2>${h(titulo || r.pista)}</h2></div><button type="button" class="as-x" aria-label="Fechar (Esc)">✕</button></header><section class="ra" aria-label="Análise da corrida"></section></div>`;
  document.body.appendChild(raiz); document.body.classList.add("as-on");
  const foco0 = document.activeElement;
  const tecla = (ev) => { if (ev.key === "Escape") { ev.preventDefault(); ev.stopPropagation(); fechar(); } };
  fechar = () => {
    fechar = null; removeEventListener("keydown", tecla, true); soltarAnalise(); raiz.remove(); document.body.classList.remove("as-on");
    if (foco0 && foco0.isConnected) foco0.focus({ preventScroll: true });
  };
  addEventListener("keydown", tecla, true);
  raiz.querySelector(".as-x").onclick = () => fechar && fechar();
  raiz.addEventListener("click", (ev) => { if (ev.target === raiz && fechar) fechar(); });
  const fonte = { analise: () => Promise.resolve(A), replay: () => (pedirReplay ? Promise.resolve(pedirReplay()) : Promise.resolve(null)), sNow: () => Date.now() };
  montarAnaliseSalva(raiz.querySelector(".ra"), S, { id: meu }, A, fonte, chave);
  raiz.querySelector(".as-x").focus({ preventScroll: true });
}
