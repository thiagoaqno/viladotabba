// Corrida da Galera — o cartão do editor do capacete, sem sala nem socket: usado na etapa "Carro" da sala (capacete-editor.js, que manda o
// capacete para a sala) e na aba "Capacete" da Central da carreira (temporada/index.html). O capacete fica guardado neste navegador
// ("corrida:capacete") e é o mesmo nos dois lugares: o que se escolhe na carreira vai para a pista na próxima corrida (sincronizarCapacete).
// A prévia é o capacete em 3D (capacete-3d.js), girando; sem WebGL, volta a folha aberta de antes.
import { pintarFolha, DESENHOS_CAPACETE, VISEIRAS, CAPACETE_PADRAO } from "./f1-capacetes.js";
import { previaDoCapacete } from "./capacete-3d.js";

export const CHAVE_CAPACETE = "corrida:capacete";
// os nomes dos países das bandeiras (as siglas de gp-info.js BANDEIRAS)
const PAISES = { BR: "Brasil", AR: "Argentina", PT: "Portugal", ES: "Espanha", IT: "Itália", FR: "França", DE: "Alemanha", GB: "Reino Unido", NL: "Holanda", BE: "Bélgica",
  AT: "Áustria", CH: "Suíça", FI: "Finlândia", DK: "Dinamarca", HU: "Hungria", MC: "Mônaco", US: "Estados Unidos", CA: "Canadá", MX: "México", CO: "Colômbia",
  JP: "Japão", CN: "China", AU: "Austrália", SG: "Singapura", AZ: "Azerbaijão", BH: "Bahrein", SA: "Arábia Saudita", QA: "Catar", AE: "Emirados Árabes" };
const h = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function lerCapacete() {
  let c = null; try { c = JSON.parse(localStorage.getItem(CHAVE_CAPACETE)); } catch { /* sem armazenamento */ }
  return c && c.desenho && Array.isArray(c.cores) ? { ...CAPACETE_PADRAO, ...c, cores: c.cores.slice(0, 3) } : null;
}
const gravar = (c) => { try { localStorage.setItem(CHAVE_CAPACETE, JSON.stringify(c)); } catch { /* sem armazenamento */ } };

// monta o editor em `el` (uma vez) e devolve { atual(), redesenhar() }. op: { sub (o texto ao lado do título), numero () (o número do carro, opcional),
// aoMudar (cap) (cada mudança, já guardada) }
export function montarEditorCapacete(el, op = {}) {
  if (el._capacete) { el._capacete.redesenhar(); return el._capacete; }
  let atual = lerCapacete() || { ...CAPACETE_PADRAO, cores: CAPACETE_PADRAO.cores.slice() };
  const des = Object.entries(DESENHOS_CAPACETE).map(([v, n]) => `<option value="${v}">${h(n)}</option>`).join("");
  const vis = Object.entries(VISEIRAS).map(([v, n]) => `<button type="button" class="cp-vis" data-vis="${v}" title="${h(n)}" aria-label="Viseira ${h(n)}" style="--c:${v}"></button>`).join("");
  const ban = `<option value="">Sem bandeira</option>` + Object.entries(PAISES).filter(([s]) => window.GpInfo?.BANDEIRAS?.[s]).map(([s, n]) => `<option value="${s}">${h(n)}</option>`).join("");
  el.innerHTML = `<h3 class="sn-tit"><span>Seu capacete</span><em>${h(op.sub || "visto por todos na pista")}</em></h3>
    <canvas class="cp-previa cp-3d" width="840" height="420" aria-label="Seu capacete em 3D: arraste para girar"></canvas>
    <div class="cp-grade">
      <label>Desenho<select data-cp="desenho">${des}</select></label>
      <label>Casco<input type="color" data-cp="c0"></label>
      <label>Segunda cor<input type="color" data-cp="c1"></label>
      <label>Detalhes<input type="color" data-cp="c2"></label>
      <label>Bandeira<select data-cp="bandeira">${ban}</select></label>
      <label>Nome<input type="text" data-cp="nome" maxlength="14" placeholder="Seu nome" autocomplete="off"></label>
    </div>
    <div class="cp-viseiras" role="group" aria-label="Cor da viseira"><small>Viseira</small>${vis}</div>`;
  const cv = el.querySelector("canvas"), numero = () => (op.numero ? op.numero() : null);
  let p3d = null; try { p3d = previaDoCapacete(cv); } catch (e) { console.warn("Capacete: prévia 3D indisponível", e); }
  if (!p3d) { cv.classList.remove("cp-3d"); cv.width = 512; cv.height = 256; }
  const previa = () => {
    if (p3d) return p3d.mostrar(atual, numero());
    const x = cv.getContext("2d");
    pintarFolha(x, atual.cores, atual.desenho, numero(), { bandeira: atual.bandeira, nome: atual.nome }, previa);
    x.fillStyle = atual.viseira; x.fillRect(290, 98, 188, 29); // a viseira (na pista ela é uma peça à parte, f1-piloto.js)
  };
  const marcar = () => el.querySelectorAll("[data-vis]").forEach((b) => { const on = b.dataset.vis === atual.viseira; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
  const q = (k) => el.querySelector(`[data-cp="${k}"]`);
  const campos = () => {
    if (el.contains(document.activeElement)) return; // (não atropela quem está digitando)
    q("desenho").value = atual.desenho; q("bandeira").value = atual.bandeira || ""; q("nome").value = atual.nome || "";
    atual.cores.forEach((c, i) => { q("c" + i).value = c; });
  };
  const mudar = () => { gravar(atual); previa(); marcar(); op.aoMudar?.(atual); };
  el.addEventListener("input", (e) => {
    const k = e.target.dataset.cp; if (!k) return;
    if (k === "nome") atual.nome = e.target.value.replace(/[^\p{L}\p{N} .\-]/gu, "").slice(0, 14);
    else if (k[0] === "c" && k.length === 2) atual.cores[+k[1]] = e.target.value;
    else atual[k] = e.target.value;
    mudar();
  });
  el.addEventListener("click", (e) => { const b = e.target.closest("[data-vis]"); if (b) { atual.viseira = b.dataset.vis; mudar(); } });
  const api = {
    atual: () => atual,
    // de novo a partir do que está guardado (outra aba pode ter mudado) e o número de agora
    redesenhar() { const salvo = lerCapacete(); if (salvo && !el.contains(document.activeElement)) atual = salvo; campos(); marcar(); previa(); },
  };
  el._capacete = api; api.redesenhar(); return api;
}
