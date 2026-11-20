// (2026-11-20, o Thiago: "leds de cores diferentes e bloom em objetos específicos") o painel de LUZ nas Propriedades do TabbaTracks:
// acender a peça (ou só um material dela) numa cor, com a força do brilho (o bloom do jogo: de 1, só a cor acesa, a 6, um halo forte).
// O editor desenha sem o pós-processamento: aqui se vê a cor acesa; o halo aparece no jogo, nos gráficos Média e Alta.
import { CORES_LED, FORCA_PADRAO } from "../luz-item.js";
import { materiaisDe } from "../acabamentos.js";

const h = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
// el: onde desenhar; o: a peça; atual: a luz dela; mudar(luz|null): aplica e guarda
export function painelLuz(el, o, atual, mudar) {
  if (!el) return;
  let a = atual ? { ...atual } : null;
  const mats = materiaisDe(o).filter((m) => m.name !== "LED");
  const enviar = () => mudar(a ? { ...a } : null);
  const desenhar = () => {
    el.innerHTML = `<div class="acab"><h4>Luz · LED</h4>
      <div class="lin"><label><input type="checkbox" data-liga ${a ? "checked" : ""}> Acender esta peça</label></div>
      ${a ? `<div class="var">${CORES_LED.map((c) => `<button type="button" data-cor="${c}" style="background:${c};${a.cor === c ? "outline:2px solid #fff" : ""}" title="${c}"></button>`).join("")}<input type="color" data-cor-livre value="${a.cor}" title="Outra cor"></div>
      <label class="sl">Brilho<input type="range" data-forca min="1" max="6" step="0.5" value="${a.forca ?? FORCA_PADRAO}"><span>${(+(a.forca ?? FORCA_PADRAO)).toFixed(1)}</span></label>
      ${mats.length > 1 ? `<label class="sl" style="grid-template-columns:78px 1fr">Acender<select data-alvo><option value="">A peça inteira</option>${mats.map((m, i) => `<option value="${i}" ${String(a.alvo) === String(i) ? "selected" : ""}>Material ${i + 1}${m.name ? " · " + h(m.name) : ""} ■ #${m.color?.getHexString?.() || "—"}</option>`).join("")}</select></label>` : ""}
      <small>O halo (bloom) aparece no jogo, nos gráficos Média e Alta.</small>` : ""}</div>`;
    el.querySelector("[data-liga]").onchange = (e) => { a = e.target.checked ? { cor: CORES_LED[4], forca: FORCA_PADRAO } : null; enviar(); desenhar(); };
    for (const b of el.querySelectorAll("[data-cor]")) b.onclick = () => { a.cor = b.dataset.cor; enviar(); desenhar(); };
    const livre = el.querySelector("[data-cor-livre]"); if (livre) livre.onchange = () => { a.cor = livre.value; enviar(); desenhar(); };
    const f = el.querySelector("[data-forca]"); if (f) { f.oninput = () => { f.nextElementSibling.textContent = (+f.value).toFixed(1); }; f.onchange = () => { a.forca = +f.value; enviar(); }; }
    const al = el.querySelector("[data-alvo]"); if (al) al.onchange = () => { a.alvo = al.value === "" ? undefined : +al.value; enviar(); };
  };
  desenhar();
}
