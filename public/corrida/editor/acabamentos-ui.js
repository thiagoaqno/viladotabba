// (2026-11-18, o Thiago, com a imagem do "Wall finishes") o painel de ACABAMENTOS nas Propriedades do TabbaTracks: a grade de texturas
// (clique = aplica), embaixo a escolhida com nome e descrição, as variações de cor, e o material: rugosidade, metal e o tamanho do desenho.
// "Aplicar em" escolhe qual material da peça trocar (a parede e não a janela) ou todos.
import { ACABAMENTOS, VARIANTES, miniaturaDe, materiaisDe } from "../acabamentos.js";

const h = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
let estilo = false;
function porEstilo() {
  if (estilo) return; estilo = true;
  const st = document.createElement("style");
  st.textContent = `.acab{border-top:1px solid #2a2e36;margin-top:8px;padding-top:8px}
.acab h4{margin:0 0 6px;font:600 12px system-ui;letter-spacing:.08em;text-transform:uppercase;color:#e8e8ea;border-left:3px solid #e10600;padding-left:7px}
.acab .gr{display:grid;grid-template-columns:repeat(auto-fill,minmax(56px,1fr));gap:5px;max-height:250px;overflow:auto;padding:2px}
.acab .gr button{position:relative;aspect-ratio:1;padding:0;border:2px solid transparent;border-radius:3px;background-size:cover;cursor:pointer}
.acab .gr button:hover{border-color:#888}.acab .gr button.on{border-color:#e10600}
.acab .gr button.on::after{content:"✓";position:absolute;top:2px;right:2px;width:14px;height:14px;border-radius:50%;background:#fff;color:#111;font:700 10px/14px system-ui;text-align:center}
.acab .esc{display:flex;gap:8px;margin:8px 0}.acab .esc img{width:46px;height:46px;border:1px solid #444;border-radius:2px}
.acab .esc b{display:block;font-size:13px}.acab .esc small{opacity:.7}
.acab .var{display:flex;gap:5px;align-items:center;margin:4px 0}.acab .var button{width:26px;height:22px;border:1px solid #555;border-radius:2px;cursor:pointer}
.acab .sl{display:grid;grid-template-columns:78px 1fr 34px;align-items:center;gap:6px;font-size:11px;margin:3px 0}.acab .sl input{width:100%}
.acab select{width:100%}`;
  document.head.appendChild(st);
}
// el: onde desenhar; o: a peça; atual: o acab dela; mudar(acab|null): aplica e guarda
export function painelAcabamento(el, o, atual, mudar) {
  if (!el) return; porEstilo();
  let a = atual ? { ...atual } : null;
  const mats = materiaisDe(o);
  const enviar = () => mudar(a ? { ...a } : null);
  const desenhar = () => {
    const A = a && ACABAMENTOS[a.id];
    const sl = (k, nome, min, max, passo, padrao) => `<label class="sl">${nome}<input type="range" data-k="${k}" min="${min}" max="${max}" step="${passo}" value="${a?.[k] ?? padrao}"><span>${(+(a?.[k] ?? padrao)).toFixed(2)}</span></label>`;
    el.innerHTML = `<div class="acab"><h4>Acabamento</h4>
      <div class="gr">${Object.entries(ACABAMENTOS).map(([id, x]) => `<button type="button" data-id="${id}" class="${a?.id === id ? "on" : ""}" title="${h(x.nome)}" style="background-image:url(${miniaturaDe(id)})"></button>`).join("")}</div>
      ${A ? `<div class="esc"><img src="${miniaturaDe(a.id)}" alt=""><div><b>${h(A.nome)}</b><small>${h(A.desc)}</small></div></div>
      <div class="var">${VARIANTES.map((c) => `<button type="button" data-cor="${c}" style="background:${c}" title="${c}"></button>`).join("")}<input type="color" data-cor-livre value="${a.cor || "#ffffff"}" title="Outra cor"></div>
      ${sl("rug", "Rugosidade", 0, 1, 0.01, A.rug ?? 0.8)}${sl("met", "Metal", 0, 1, 0.01, A.met ?? 0)}${sl("rep", "Repetição", 0.25, 6, 0.05, 1)}
      ${mats.length > 1 ? `<label class="sl" style="grid-template-columns:78px 1fr">Aplicar em<select data-alvo><option value="">Tudo (menos vidro e luz)</option>${mats.map((m, i) => `<option value="${i}" ${String(a.alvo) === String(i) ? "selected" : ""}>Material ${i + 1}${m.name ? " · " + h(m.name) : ""} ■ #${m.color?.getHexString?.() || "—"}</option>`).join("")}</select></label>` : ""}
      <button type="button" data-tirar style="margin-top:6px">Tirar o acabamento</button>` : `<small>Clique numa textura para aplicar nesta peça.</small>`}</div>`;
    for (const b of el.querySelectorAll("[data-id]")) b.onclick = () => { a = { ...(a || {}), id: b.dataset.id }; delete a.rug; delete a.met; enviar(); desenhar(); };
    for (const b of el.querySelectorAll("[data-cor]")) b.onclick = () => { a.cor = b.dataset.cor === "#ffffff" ? undefined : b.dataset.cor; enviar(); desenhar(); };
    const cl = el.querySelector("[data-cor-livre]"); if (cl) cl.onchange = () => { a.cor = cl.value; enviar(); };
    for (const r of el.querySelectorAll("[data-k]")) { r.oninput = () => { r.nextElementSibling.textContent = (+r.value).toFixed(2); }; r.onchange = () => { a[r.dataset.k] = +r.value; enviar(); }; }
    const al = el.querySelector("[data-alvo]"); if (al) al.onchange = () => { a.alvo = al.value === "" ? undefined : +al.value; enviar(); };
    const t = el.querySelector("[data-tirar]"); if (t) t.onclick = () => { a = null; enviar(); desenhar(); };
  };
  desenhar();
}
