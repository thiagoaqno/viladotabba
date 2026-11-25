// Corrida da Galera — a escolha do acabamento do seu carro (2026-11-25, o Thiago: "uma opção de poder escolher o material do carro, o acabamento").
// Na gaveta "Peças, pintura, capacete e piloto" da sala, na seção Pintura (#acabCarro): Cromado (o de antes, o padrão), Metálico, Brilhante,
// Acetinado e Fosco. Fica guardado neste navegador (f1-pintura.js lerAcabamentoCarro) e vale no seu carro a partir da próxima corrida (o material é
// montado na largada: f1.js pintura).
import { ACABAMENTOS_CARRO, lerAcabamentoCarro, gravarAcabamentoCarro } from "./f1-pintura.js";

// a amostra de cada acabamento: um degradê que lembra o reflexo (só para escolher; o de verdade é o do carro na pista)
const AMOSTRA = {
  cromo: "linear-gradient(135deg,#f4f6f8 0%,#7d848d 38%,#f8fafc 52%,#4a5059 78%,#d9dde2 100%)",
  metal: "linear-gradient(135deg,#c9ced6 0%,#6c737d 45%,#b9c0ca 60%,#4c525b 100%)",
  brilho: "radial-gradient(70% 55% at 30% 25%,#ffffff 0%,#e9edf2 18%,#9aa3ae 60%,#6b737e 100%)",
  acetinado: "linear-gradient(160deg,#c8cdd4 0%,#9aa1ab 55%,#7f8691 100%)",
  fosco: "linear-gradient(160deg,#8c929b 0%,#848a93 100%)",
};
export function renderAcabamento() {
  const el = document.getElementById("acabCarro"); if (!el) return;
  const atual = lerAcabamentoCarro(), chave = atual + "|" + ACABAMENTOS_CARRO.length;
  if (el._chave === chave) return; el._chave = chave;
  el.innerHTML = ACABAMENTOS_CARRO.map(([k, nome]) => `<button type="button" class="sn-acab-op ${k === atual ? "on" : ""}" data-acab="${k}" aria-pressed="${k === atual}" title="${nome}"><i style="background:${AMOSTRA[k]}"></i><span>${nome}</span></button>`).join("")
    + `<small class="sn-acab-nota">vale a partir da próxima corrida</small>`;
  if (!el._ok) { el._ok = true; el.addEventListener("click", (e) => { const b = e.target.closest("[data-acab]"); if (!b) return; e.stopPropagation(); gravarAcabamentoCarro(b.dataset.acab); el._chave = null; renderAcabamento(); }); }
}
