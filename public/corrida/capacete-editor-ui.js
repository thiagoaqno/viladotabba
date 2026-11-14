// Corrida da Galera — o editor do capacete, sem sala nem socket: usado na etapa "Carro" da sala (capacete-editor.js, que manda o capacete para a
// sala) e na aba "Capacete" da Central da carreira (temporada/index.html). O capacete fica guardado neste navegador ("corrida:capacete") e é o
// mesmo nos dois lugares: o que se escolhe na carreira vai para a pista na próxima corrida (sincronizarCapacete).
// A tela (2026-11-14, pela referência do Thiago): o menu à esquerda (Desenho, Cores, Detalhes, Patrocínios, Visor, Acabamento), o painel da opção
// no meio (no Desenho, a grade de miniaturas em 3D com as suas cores, 12 por página) e o capacete grande à direita (arrastar gira), com as
// cores principais e o "Padrão" (as 4 variações do desenho) embaixo. Sem WebGL, a prévia volta a ser a folha aberta e a grade fica em texto.
import { pintarFolha, DESENHOS_CAPACETE, VISEIRAS, CAPACETE_PADRAO, VARIANTES, ACABAMENTOS, PATROCINIOS } from "./f1-capacetes.js";
import { previaDoCapacete } from "./capacete-3d.js";

export const CHAVE_CAPACETE = "corrida:capacete";
// os nomes dos países das bandeiras (as siglas de gp-info.js BANDEIRAS)
const PAISES = { BR: "Brasil", AR: "Argentina", PT: "Portugal", ES: "Espanha", IT: "Itália", FR: "França", DE: "Alemanha", GB: "Reino Unido", NL: "Holanda", BE: "Bélgica",
  AT: "Áustria", CH: "Suíça", FI: "Finlândia", DK: "Dinamarca", HU: "Hungria", MC: "Mônaco", US: "Estados Unidos", CA: "Canadá", MX: "México", CO: "Colômbia",
  JP: "Japão", CN: "China", AU: "Austrália", SG: "Singapura", AZ: "Azerbaijão", BH: "Bahrein", SA: "Arábia Saudita", QA: "Catar", AE: "Emirados Árabes" };
const PALETA = ["#ffffff", "#101114", "#e10600", "#9aa1ad", "#1e3fd0", "#f6c90e", "#1fa64a", "#f47600", "#7a2fd0", "#00d2be", "#ff5fa8", "#8a5a2b"];
const POR_PAGINA = 12;
const h = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const svg = (d) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ABAS = [
  ["desenho", "Desenho", svg('<path d="M4 15a8 8 0 0 1 16 0v2H4z"/><path d="M12 7v3M8 15h8"/>')],
  ["cores", "Cores", svg('<path d="M12 3a9 9 0 1 0 0 18c1 0 1.5-.7 1.5-1.5 0-1.2-1-1.5-1-2.5S13.3 15 14.5 15H17a4 4 0 0 0 4-4c0-4.4-4-8-9-8z"/><circle cx="7.5" cy="11" r="1.2" fill="currentColor"/><circle cx="10" cy="7" r="1.2" fill="currentColor"/><circle cx="15" cy="7.5" r="1.2" fill="currentColor"/>')],
  ["detalhes", "Detalhes", svg('<path d="m12 3 2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>')],
  ["patrocinios", "Patrocínios", svg('<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M12 14v4M8.5 21h7M10 18h4"/>')],
  ["visor", "Visor", svg('<path d="M3 10c3-3 15-3 18 0l-1.5 5c-3 1.5-12 1.5-15 0z"/>')],
  ["acabamento", "Acabamento", svg('<path d="M4 4h4v4H4zM12 4h4v4h-4zM8 8h4v4H8zM16 8h4v4h-4zM4 12h4v4H4zM12 12h4v4h-4zM8 16h4v4H8zM16 16h4v4h-4z" fill="currentColor" stroke="none"/>')],
];
const SETA_E = svg('<path d="m15 5-7 7 7 7"/>'), SETA_D = svg('<path d="m9 5 7 7-7 7"/>'), CHECK = svg('<path d="m5 12 4 4 10-10"/>');

export function lerCapacete() {
  let c = null; try { c = JSON.parse(localStorage.getItem(CHAVE_CAPACETE)); } catch { /* sem armazenamento */ }
  return c && c.desenho && Array.isArray(c.cores) ? { ...CAPACETE_PADRAO, variante: 0, acabamento: "brilho", patrocinio: "", ...c, cores: c.cores.slice(0, 3) } : null;
}
const gravar = (c) => { try { localStorage.setItem(CHAVE_CAPACETE, JSON.stringify(c)); } catch { /* sem armazenamento */ } };

// monta o editor em `el` (uma vez) e devolve { atual(), redesenhar() }. op: { sub (o texto ao lado do título), numero () (o número do carro,
// opcional), aoMudar (cap) (cada mudança, já guardada) }
export function montarEditorCapacete(el, op = {}) {
  if (el._capacete) { el._capacete.redesenhar(); return el._capacete; }
  let atual = lerCapacete() || { ...CAPACETE_PADRAO, cores: CAPACETE_PADRAO.cores.slice(), variante: 0, acabamento: "brilho", patrocinio: "" };
  let aba = "desenho", pagina = 0, slot = 0; // slot: a cor que as cores principais trocam (0 casco, 1 segunda, 2 detalhes)
  const desenhos = Object.keys(DESENHOS_CAPACETE), paginas = Math.ceil(desenhos.length / POR_PAGINA);
  el.classList.add("cp2-on");
  el.innerHTML = `<div class="cp2">
    <header class="cp2-cab"><h3>Seu capacete</h3><p>${h(op.sub || "Personalize o visual do seu capacete: todos o veem na pista.")}</p></header>
    <nav class="cp2-menu" role="tablist" aria-label="O que personalizar">${ABAS.map(([k, n, ic]) => `<button type="button" role="tab" data-cp-aba="${k}">${ic}<span>${n}</span><i class="cp2-seta">${SETA_D}</i></button>`).join("")}</nav>
    <section class="cp2-painel" data-cp-painel></section>
    <div class="cp2-palco"><canvas class="cp-previa cp-3d" width="900" height="760" aria-label="Seu capacete em 3D: arraste para girar"></canvas>
      <div class="cp2-rodape"><div><small>Cores principais</small><div class="cp2-cores" data-cp-rapidas></div></div><div><small>Padrão</small><div class="cp2-variantes" data-cp-variantes></div></div></div></div>
  </div>`;
  const cv = el.querySelector("canvas"), numero = () => (op.numero ? op.numero() : null), painel = el.querySelector("[data-cp-painel]");
  let p3d = null; try { p3d = previaDoCapacete(cv); } catch (e) { console.warn("Capacete: prévia 3D indisponível", e); }
  if (!p3d) { cv.classList.remove("cp-3d"); cv.width = 512; cv.height = 256; }
  const previa = () => {
    if (p3d) { p3d.usarNumero(numero()); return p3d.mostrar(atual, numero()); }
    const x = cv.getContext("2d");
    pintarFolha(x, atual.cores, atual.desenho, numero(), { bandeira: atual.bandeira, nome: atual.nome, variante: atual.variante, patrocinio: atual.patrocinio }, previa);
    x.fillStyle = atual.viseira; x.fillRect(278, 98, 212, 36);
  };
  // as miniaturas (fotografadas pela prévia 3D, com as cores de agora; refeitas quando as cores, o visor ou o acabamento mudam)
  let fotos = {}, chaveFotos = "", tFotos = 0;
  const fotosDe = (lista) => {
    if (!p3d) return [];
    const chave = JSON.stringify([atual.cores, atual.viseira, atual.acabamento, atual.patrocinio]);
    if (chave !== chaveFotos) { fotos = {}; chaveFotos = chave; }
    const faltam = lista.filter(([k]) => !fotos[k]);
    if (faltam.length) { const imgs = p3d.fotografar(faltam.map(([, cap]) => cap)); faltam.forEach(([k], i) => { fotos[k] = imgs[i]; }); p3d.mostrar(atual, numero()); }
    return lista.map(([k]) => fotos[k]);
  };
  const capCom = (mudanca) => ({ ...atual, ...mudanca });
  const corBotao = (c, on, attr) => `<button type="button" class="cp2-cor ${on ? "on" : ""}" ${attr} style="--c:${c}" aria-label="Cor ${c}" aria-pressed="${on}"></button>`;
  function desenharPainel() {
    el.querySelectorAll("[data-cp-aba]").forEach((b) => { const on = b.dataset.cpAba === aba; b.classList.toggle("on", on); b.setAttribute("aria-selected", String(on)); });
    if (aba === "desenho") {
      const da = desenhos.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA), imgs = fotosDe(da.map((d) => [`d:${d}:${atual.variante}`, capCom({ desenho: d })]));
      painel.innerHTML = `<header class="cp2-ph"><h4>Desenho</h4><span class="cp2-pag"><button type="button" data-cp-pag="-1" aria-label="Página anterior" ${pagina ? "" : "disabled"}>${SETA_E}</button>${pagina + 1} / ${paginas}<button type="button" data-cp-pag="1" aria-label="Próxima página" ${pagina < paginas - 1 ? "" : "disabled"}>${SETA_D}</button></span></header>
        <div class="cp2-grade">${da.map((d, i) => `<button type="button" class="cp2-mini ${atual.desenho === d ? "on" : ""}" data-cp-desenho="${d}" title="${h(DESENHOS_CAPACETE[d])}" aria-pressed="${atual.desenho === d}">${imgs[i] ? `<img src="${imgs[i]}" alt="">` : `<span class="cp2-mini-txt">${h(DESENHOS_CAPACETE[d])}</span>`}<small>${h(DESENHOS_CAPACETE[d])}</small>${atual.desenho === d ? `<i class="cp2-ok">${CHECK}</i>` : ""}</button>`).join("")}</div>`;
    } else if (aba === "cores") {
      const nomes = ["Casco", "Segunda cor", "Detalhes"];
      painel.innerHTML = `<header class="cp2-ph"><h4>Cores</h4></header>${nomes.map((n, i) => `<div class="cp2-linha"><span class="cp2-rot"><i style="--c:${atual.cores[i]}"></i>${n}</span><div class="cp2-cores">${PALETA.map((c) => corBotao(c, atual.cores[i].toLowerCase() === c, `data-cp-cor="${i}" data-c="${c}"`)).join("")}<label class="cp2-cor cp2-mais" title="Outra cor"><input type="color" data-cp-livre="${i}" value="${atual.cores[i]}">+</label></div></div>`).join("")}`;
    } else if (aba === "detalhes") {
      const ban = `<option value="">Sem bandeira</option>` + Object.entries(PAISES).filter(([s]) => window.GpInfo?.BANDEIRAS?.[s]).map(([s, n]) => `<option value="${s}" ${atual.bandeira === s ? "selected" : ""}>${h(n)}</option>`).join("");
      painel.innerHTML = `<header class="cp2-ph"><h4>Detalhes</h4></header><div class="cp2-campos"><label>Bandeira<select data-cp="bandeira">${ban}</select></label><label>Nome no capacete<input type="text" data-cp="nome" maxlength="14" placeholder="Seu nome" autocomplete="off" value="${h(atual.nome || "")}"></label></div><p class="cp2-nota">A bandeira vai atrás e nos lados; o nome, na faixa acima do visor e na nuca. O número do carro entra sozinho.</p>`;
    } else if (aba === "patrocinios") {
      painel.innerHTML = `<header class="cp2-ph"><h4>Patrocínios</h4></header><div class="cp2-opcoes">${Object.entries(PATROCINIOS).map(([k, n]) => `<button type="button" class="cp2-op cp2-selo-${k || "nenhum"} ${atual.patrocinio === k ? "on" : ""}" data-cp-patrocinio="${k}" aria-pressed="${atual.patrocinio === k}"><b>${h(n)}</b><small>${k ? "na nuca e nos lados" : "o capacete limpo"}</small></button>`).join("")}</div><p class="cp2-nota">Patrocinadores inventados da galera.</p>`;
    } else if (aba === "visor") {
      painel.innerHTML = `<header class="cp2-ph"><h4>Visor</h4></header><div class="cp2-opcoes">${Object.entries(VISEIRAS).map(([c, n]) => `<button type="button" class="cp2-op ${atual.viseira === c ? "on" : ""}" data-cp-visor="${c}" aria-pressed="${atual.viseira === c}"><i class="cp2-vis" style="--c:${c}"></i><b>${h(n)}</b></button>`).join("")}</div>`;
    } else {
      const dicas = { brilho: "verniz de espelho, o clássico", fosco: "sem brilho, aveludado", metal: "pintura metálica com verniz", cromo: "metal polido, reflete tudo" };
      painel.innerHTML = `<header class="cp2-ph"><h4>Acabamento</h4></header><div class="cp2-opcoes">${Object.entries(ACABAMENTOS).map(([k, n]) => `<button type="button" class="cp2-op cp2-ac-${k} ${atual.acabamento === k ? "on" : ""}" data-cp-acabamento="${k}" aria-pressed="${atual.acabamento === k}"><i class="cp2-amostra"></i><b>${h(n)}</b><small>${dicas[k]}</small></button>`).join("")}</div>`;
    }
  }
  function desenharRodape() {
    el.querySelector("[data-cp-rapidas]").innerHTML = PALETA.slice(0, 6).map((c) => corBotao(c, atual.cores[slot].toLowerCase() === c, `data-cp-rapida="${c}"`)).join("") + `<label class="cp2-cor cp2-mais" title="Outra cor"><input type="color" data-cp-livre="${slot}" value="${atual.cores[slot]}">+</label>`;
    const imgs = fotosDe(VARIANTES.map((_, v) => [`v:${atual.desenho}:${v}`, capCom({ variante: v })]));
    el.querySelector("[data-cp-variantes]").innerHTML = VARIANTES.map((n, v) => `<button type="button" class="cp2-var ${atual.variante === v ? "on" : ""}" data-cp-variante="${v}" title="${h(n)}" aria-pressed="${atual.variante === v}">${imgs[v] ? `<img src="${imgs[v]}" alt="">` : h(n)}</button>`).join("");
  }
  const tudo = () => { previa(); desenharPainel(); desenharRodape(); };
  // uma mudança: guarda, mostra no 3D e refaz o painel (as miniaturas esperam um instante, para o arrastar da cor livre não travar)
  const mudar = (refazer = true) => { gravar(atual); previa(); op.aoMudar?.(atual); if (!refazer) return; clearTimeout(tFotos); tFotos = setTimeout(() => { desenharPainel(); desenharRodape(); }, 120); };
  el.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b || !el.contains(b)) return;
    const d = b.dataset;
    if (d.cpAba) { aba = d.cpAba; return desenharPainel(); }
    if (d.cpPag) { pagina = Math.max(0, Math.min(paginas - 1, pagina + Number(d.cpPag))); return desenharPainel(); }
    if (d.cpDesenho) { atual.desenho = d.cpDesenho; return mudar(); }
    if (d.cpCor != null) { atual.cores[+d.cpCor] = d.c; slot = +d.cpCor; return mudar(); }
    if (d.cpRapida) { atual.cores[slot] = d.cpRapida; return mudar(); }
    if (d.cpVariante != null) { atual.variante = +d.cpVariante; return mudar(); }
    if (d.cpPatrocinio != null) { atual.patrocinio = d.cpPatrocinio; return mudar(); }
    if (d.cpVisor) { atual.viseira = d.cpVisor; return mudar(); }
    if (d.cpAcabamento) { atual.acabamento = d.cpAcabamento; return mudar(); }
  });
  el.addEventListener("input", (e) => {
    const t = e.target;
    if (t.dataset.cpLivre != null) { slot = +t.dataset.cpLivre; atual.cores[slot] = t.value; return mudar(); }
    if (t.dataset.cp === "nome") { atual.nome = t.value.replace(/[^\p{L}\p{N} .\-]/gu, "").slice(0, 14); return mudar(false); }
    if (t.dataset.cp === "bandeira") { atual.bandeira = t.value; return mudar(false); }
  });
  const api = {
    atual: () => atual,
    // de novo a partir do que está guardado (outra aba pode ter mudado) e o número de agora
    redesenhar() { if (el.contains(document.activeElement)) return previa(); const salvo = lerCapacete(); if (salvo) atual = salvo; tudo(); }, // (não refaz o painel de quem está digitando o nome)
  };
  el._capacete = api; api.redesenhar(); return api;
}
