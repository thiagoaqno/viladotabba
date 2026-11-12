// Corrida da Galera — o editor do capacete de quem joga (etapa "Carro" da sala): o desenho, as três cores, a cor da viseira, a bandeira e o nome.
// O capacete fica guardado neste navegador ("corrida:capacete") e vai para a sala em `mods.capacete` (act "mods"; corrida.js `limparCapacete` confere):
// assim os outros veem o seu capacete na pista (f1-piloto.js) e ele vai junto para toda sala em que você entrar (`sincronizarCapacete`).
import { E, $, h, me, act, store } from "./estado.js";
import { pintarFolha, DESENHOS_CAPACETE, VISEIRAS, CAPACETE_PADRAO } from "./f1-capacetes.js";

const CHAVE = "corrida:capacete";
// os nomes dos países das bandeiras (as siglas de gp-info.js BANDEIRAS)
const PAISES = { BR: "Brasil", AR: "Argentina", PT: "Portugal", ES: "Espanha", IT: "Itália", FR: "França", DE: "Alemanha", GB: "Reino Unido", NL: "Holanda", BE: "Bélgica",
  AT: "Áustria", CH: "Suíça", FI: "Finlândia", DK: "Dinamarca", HU: "Hungria", MC: "Mônaco", US: "Estados Unidos", CA: "Canadá", MX: "México", CO: "Colômbia",
  JP: "Japão", CN: "China", AU: "Austrália", SG: "Singapura", AZ: "Azerbaijão", BH: "Bahrein", SA: "Arábia Saudita", QA: "Catar", AE: "Emirados Árabes" };

const ler = () => { const c = store.get(CHAVE); return c && c.desenho && Array.isArray(c.cores) ? { ...CAPACETE_PADRAO, ...c, cores: c.cores.slice(0, 3) } : null; };
const gravar = (c) => store.set(CHAVE, c);
let atual = ler() || { ...CAPACETE_PADRAO, cores: CAPACETE_PADRAO.cores.slice() }, enviarT = 0, enviadoPara = null;

function enviar() { clearTimeout(enviarT); enviarT = setTimeout(() => { if (me() && E.S && E.S.phase !== "race") act("mods", { mods: { capacete: atual } }); }, 250); }
// ao entrar numa sala (ou quando ela volta para a sala de espera): o capacete guardado vai para lá, uma vez por sala
export function sincronizarCapacete() {
  const m = me(), salvo = ler(); if (!m || !salvo || !E.S || E.S.phase === "race") return;
  const chave = E.S.code + ":" + m.id; if (enviadoPara === chave) return; enviadoPara = chave;
  if (JSON.stringify(m.mods?.capacete || null) !== JSON.stringify(salvo)) act("mods", { mods: { capacete: salvo } });
}

function desenharPrevia(cv) {
  const x = cv.getContext("2d"), cores = atual.cores;
  pintarFolha(x, cores, atual.desenho, me()?.numero ?? null, { bandeira: atual.bandeira, nome: atual.nome }, () => desenharPrevia(cv));
  x.fillStyle = atual.viseira; x.fillRect(290, 98, 188, 29); // a viseira (na pista ela é uma peça à parte, f1-piloto.js)
}

// o cartão do editor (dentro de `#capaceteCartao`); só redesenha o que muda
export function renderCapacete() {
  const el = $("capaceteCartao"); if (!el) return;
  if (!el.dataset.pronto) {
    el.dataset.pronto = "1";
    const des = Object.entries(DESENHOS_CAPACETE).map(([v, n]) => `<option value="${v}">${h(n)}</option>`).join("");
    const vis = Object.entries(VISEIRAS).map(([v, n]) => `<button type="button" class="cp-vis" data-vis="${v}" title="${h(n)}" aria-label="Viseira ${h(n)}" style="--c:${v}"></button>`).join("");
    const ban = `<option value="">Sem bandeira</option>` + Object.entries(PAISES).filter(([s]) => window.GpInfo?.BANDEIRAS?.[s]).map(([s, n]) => `<option value="${s}">${h(n)}</option>`).join("");
    el.innerHTML = `<h3 class="sn-tit"><span>Seu capacete</span><em>visto por todos na pista</em></h3>
      <canvas class="cp-previa" width="512" height="256" aria-label="Prévia do capacete aberto"></canvas>
      <div class="cp-grade">
        <label>Desenho<select data-cp="desenho">${des}</select></label>
        <label>Casco<input type="color" data-cp="c0"></label>
        <label>Segunda cor<input type="color" data-cp="c1"></label>
        <label>Detalhes<input type="color" data-cp="c2"></label>
        <label>Bandeira<select data-cp="bandeira">${ban}</select></label>
        <label>Nome<input type="text" data-cp="nome" maxlength="14" placeholder="Seu nome" autocomplete="off"></label>
      </div>
      <div class="cp-viseiras" role="group" aria-label="Cor da viseira"><small>Viseira</small>${vis}</div>`;
    const mudar = () => { gravar(atual); desenharPrevia(el.querySelector("canvas")); marcar(); enviar(); };
    el.addEventListener("input", (e) => {
      const k = e.target.dataset.cp; if (!k) return;
      if (k === "nome") atual.nome = e.target.value.replace(/[^\p{L}\p{N} .\-]/gu, "").slice(0, 14);
      else if (k[0] === "c" && k.length === 2) atual.cores[+k[1]] = e.target.value;
      else atual[k] = e.target.value;
      mudar();
    });
    el.addEventListener("click", (e) => { const b = e.target.closest("[data-vis]"); if (b) { atual.viseira = b.dataset.vis; mudar(); } });
  }
  const q = (k) => el.querySelector(`[data-cp="${k}"]`);
  if (document.activeElement?.closest?.("#capaceteCartao") == null) { // (não atropela quem está digitando)
    q("desenho").value = atual.desenho; q("bandeira").value = atual.bandeira || ""; q("nome").value = atual.nome || "";
    atual.cores.forEach((c, i) => { q("c" + i).value = c; });
  }
  marcar(); desenharPrevia(el.querySelector("canvas"));
}
function marcar() { document.querySelectorAll("#capaceteCartao [data-vis]").forEach((b) => { const on = b.dataset.vis === atual.viseira; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); }); }
