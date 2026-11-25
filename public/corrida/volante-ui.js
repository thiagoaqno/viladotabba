// Corrida da Galera — a escolha do volante e do painel do seu carro (2026-11-25, o Thiago: "os volantes/painéis dos carros deviam ser
// personalizáveis"). Na gaveta "Peças, pintura, capacete e piloto" da sala (#volanteCartao): o modelo da tela do meio (F1 2026, Clássico, Minimalista,
// Retrô, Neon), o esquema das luzes de troca (F1, azul, âmbar, arco-íris, cor da equipe) e a cor do punho, com a prévia da tela. Guardado neste
// navegador (f1.js lerEstiloVolante) e lido a cada quadro: muda na hora, também no meio da corrida (na câmera de cockpit).
import { ESTILOS_VOLANTE, lerEstiloVolante, gravarEstiloVolante, desenharTelaEm } from "./f1.js";

const ROTULO = { tela: "Tela", leds: "Luzes de troca", punho: "Punho" };
const AMOSTRA_LED = { f1: "linear-gradient(90deg,#1ae65a 0 45%,#ff2a1a 45% 80%,#2e7bff 80%)", azul: "linear-gradient(90deg,#2a80ff,#4cc8ff)", ambar: "linear-gradient(90deg,#ff9a10,#ff5a0c)",
  arcoiris: "linear-gradient(90deg,#1ae65a,#e6e61a,#ff8a1a,#ff2a1a,#e01aff)", equipe: "var(--eq,#e10600)" };
export function renderVolante() {
  const el = document.getElementById("volanteCartao"); if (!el) return;
  const e = lerEstiloVolante(), chave = JSON.stringify(e);
  if (el._chave === chave) return; el._chave = chave;
  el.innerHTML = `<div class="vl-cartao"><canvas class="vl-previa" width="256" height="144" aria-label="Prévia da tela do volante"></canvas><div class="vl-linhas">${Object.keys(ESTILOS_VOLANTE).map((campo) => `<div class="vl-linha"><small>${ROTULO[campo]}</small><div class="vl-ops">${ESTILOS_VOLANTE[campo].map(([k, nome]) => `<button type="button" class="vl-op ${e[campo] === k ? "on" : ""}" data-vl-campo="${campo}" data-vl="${k}" aria-pressed="${e[campo] === k}">${campo === "leds" ? `<i style="background:${AMOSTRA_LED[k]}"></i>` : ""}${nome}</button>`).join("")}</div></div>`).join("")}</div></div>`;
  desenharTelaEm(el.querySelector(".vl-previa"), { marcha: 6, kmh: 287, bateria: 0.72, modo: "BALANCED", drs: 1, rpm: 0.78 }, e.tela);
  if (!el._ok) { el._ok = true; el.addEventListener("click", (ev) => { const b = ev.target.closest("[data-vl]"); if (!b) return; ev.stopPropagation(); gravarEstiloVolante({ [b.dataset.vlCampo]: b.dataset.vl }); el._chave = null; renderVolante(); }); }
}
