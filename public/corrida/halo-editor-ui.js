// O halo do carro na aba Carro da Central (2026-11-16, o Thiago: "ficou junto do capacete mas não aparece um desenho do meu halo; acho justo
// colocar na aba Carro"). Mostra o halo aberto, com as marcas de agora em cada um dos 5 lugares (a mesma folha que o jogo projeta no halo, f1-pintura.js
// texturaDoHalo), e a lista das marcas do capacete para escolher a de cada lugar. A escolha fica no navegador (f1-capacetes.js lerHalo/gravarHalo) e
// vale no carro do jogador a partir da próxima corrida.
import { texturaDoHalo } from "./f1-pintura.js";
import { PATROCINIOS, MARCAS_CAPACETE, LUGARES_HALO, lerHalo, gravarHalo, miniaturaDoPatrocinio } from "./f1-capacetes.js";

const h = (s) => String(s ?? "").replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
const CSS = `.hl{display:grid;grid-template-columns:minmax(0,1fr);gap:14px}
.hl-vista{position:relative;background:linear-gradient(180deg,#20242c,#0f1115);border-radius:12px;padding:18px 14px 10px;overflow:hidden}
.hl-vista canvas{display:block;width:100%;height:auto}
.hl-vista small{display:block;text-align:center;color:#fff9;font:600 12px Barlow,system-ui,sans-serif;margin-top:6px}
.hl-lugares{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}
.hl-lugar{border:1px solid #8884;border-radius:8px;background:transparent;color:inherit;padding:7px 6px;text-align:left;cursor:pointer;font:inherit}
.hl-lugar b{display:block;font-size:12px}.hl-lugar small{display:block;opacity:.7;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hl-lugar:hover{border-color:var(--eq,#e10600)}.hl-lugar.on{border-color:var(--eq,#e10600);box-shadow:inset 0 0 0 1px var(--eq,#e10600)}
.hl-linha{display:flex;gap:6px;flex-wrap:wrap;align-items:center}.hl-linha span{font-size:12px;opacity:.75;margin-right:4px}
.hl-op{border:1px solid #8884;border-radius:999px;background:transparent;color:inherit;padding:4px 10px;cursor:pointer;font:inherit;font-size:12px}
.hl-op.on,.hl-op:hover{border-color:var(--eq,#e10600)}
.hl-marcas{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:6px;max-height:300px;overflow:auto;padding-right:4px}
.hl-marca{border:1px solid #8883;border-radius:8px;background:#0f1115;color:#fff;padding:5px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;font:inherit}
.hl-marca img{width:100%;height:34px;object-fit:contain}.hl-marca small{font-size:10px;opacity:.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.hl-marca:hover{border-color:var(--eq,#e10600)}.hl-marca.on{border-color:var(--eq,#e10600);box-shadow:0 0 0 2px var(--eq,#e10600)}
.hl-nota{font-size:12px;opacity:.7;margin:0}
@media (max-width:640px){.hl-lugares{grid-template-columns:repeat(3,minmax(0,1fr))}}`;
let estilo = false;
const CURTOS = ["Perna esq.", "Lado esq.", "Topo", "Lado dir.", "Perna dir."];

export function montarHalo(el, equipe) {
  if (!estilo) { estilo = true; const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st); }
  let lugar = el._lugar ?? 2;
  const nomeDe = (id) => id === "-" ? "Liso" : PATROCINIOS[id] || MARCAS_CAPACETE[id] || "Da equipe";
  const ids = [...Object.keys(PATROCINIOS).filter(Boolean), ...Object.keys(MARCAS_CAPACETE).sort((a, b) => MARCAS_CAPACETE[a].localeCompare(MARCAS_CAPACETE[b], "pt"))];
  function desenhar() {
    const hl = lerHalo(), agora = hl.lugares[lugar] || "";
    const rolagem = el.querySelector(".hl-marcas")?.scrollTop || 0;
    el.innerHTML = `<div class="hl">
      <div class="hl-vista"><canvas width="1024" height="300" aria-label="O seu halo, aberto"></canvas><small>O halo aberto, da perna esquerda à direita (visto de frente)</small></div>
      <div class="hl-lugares" role="tablist" aria-label="Lugar do halo">${CURTOS.map((n, i) => `<button type="button" role="tab" class="hl-lugar ${i === lugar ? "on" : ""}" aria-selected="${i === lugar}" data-hl-lugar="${i}" title="${h(LUGARES_HALO[i])}"><b>${h(n)}</b><small>${h(nomeDe(hl.lugares[i]))}</small></button>`).join("")}</div>
      <div class="hl-linha"><span>Fundo</span>${[["escuro", "Placa escura"], ["claro", "Placa clara"]].map(([k, n]) => `<button type="button" class="hl-op ${(hl.fundo === "claro" ? "claro" : "escuro") === k ? "on" : ""}" data-hl-fundo="${k}">${n}</button>`).join("")}
        <button type="button" class="hl-op" data-hl-limpar>Voltar às marcas da equipe</button></div>
      <div class="hl-marcas"><button type="button" class="hl-marca ${agora === "" ? "on" : ""}" data-hl-marca=""><small>Da equipe</small></button><button type="button" class="hl-marca ${agora === "-" ? "on" : ""}" data-hl-marca="-"><small>Liso</small></button>${ids.map((id) => `<button type="button" class="hl-marca ${agora === id ? "on" : ""}" data-hl-marca="${id}" title="${h(nomeDe(id))}"><img src="${miniaturaDoPatrocinio(id)}" alt=""><small>${h(nomeDe(id))}</small></button>`).join("")}</div>
      <p class="hl-nota">Vale no seu carro de 2026 a partir da próxima corrida (só na sua tela).</p></div>`;
    const m = el.querySelector(".hl-marcas"); if (m) m.scrollTop = rolagem;
    pintar(el.querySelector("canvas"), equipe, hl);
  }
  if (!el._ligado) {
    el._ligado = true;
    el.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b || !el.contains(b)) return; e.stopPropagation();
      const d = b.dataset, hl = lerHalo();
      if (d.hlLugar != null) { lugar = el._lugar = +d.hlLugar; return desenhar(); }
      if (d.hlMarca != null) { hl.lugares[lugar] = d.hlMarca; gravarHalo(hl); return desenhar(); }
      if (d.hlFundo) { hl.fundo = d.hlFundo; gravarHalo(hl); return desenhar(); }
      if (d.hlLimpar != null) { gravarHalo({ lugares: [], fundo: hl.fundo || "escuro" }); return desenhar(); }
    });
  }
  desenhar();
}

// o halo aberto: a barra na cor da base do halo da equipe e, por cima, a folha das marcas (a mesma do jogo)
function pintar(cv, equipe, hl) {
  if (!cv) return; const x = cv.getContext("2d"), W = cv.width, H = cv.height;
  x.clearRect(0, 0, W, H);
  const t = texturaDoHalo(equipe, hl), img = t?.image, base = t?.userData?.baseEscura ? "#06070a" : t?.userData?.baseRosa ? "#ff7ab8" : "#2b2f37";
  // o arco do halo: as pernas descem nas pontas e o topo fica no meio
  x.save(); x.beginPath(); x.moveTo(30, H - 20); x.quadraticCurveTo(60, 70, W / 2, 60); x.quadraticCurveTo(W - 60, 70, W - 30, H - 20); x.lineTo(W - 130, H - 20); x.quadraticCurveTo(W - 170, 150, W / 2, 140); x.quadraticCurveTo(170, 150, 130, H - 20); x.closePath();
  x.fillStyle = "#0b0c0f"; x.fill(); x.restore();
  // a faixa onde as marcas ficam, desenrolada (como o jogo a projeta)
  const y0 = 150, alt = 128;
  x.fillStyle = base; x.beginPath(); x.roundRect ? x.roundRect(12, y0 - 8, W - 24, alt + 16, 14) : x.rect(12, y0 - 8, W - 24, alt + 16); x.fill();
  if (img) x.drawImage(img, 12, y0, W - 24, alt);
  else { x.fillStyle = "#fff8"; x.font = "600 22px Barlow, system-ui, sans-serif"; x.textAlign = "center"; x.fillText("As marcas do halo aparecem com o carro de 2026", W / 2, y0 + alt / 2); }
  x.strokeStyle = "#fff3"; x.setLineDash([6, 8]); x.lineWidth = 2;
  for (let i = 1; i < 5; i++) { const px = 12 + ((W - 24) * (180 + i * 422 - 211)) / 2048; x.beginPath(); x.moveTo(px, y0 - 4); x.lineTo(px, y0 + alt + 4); x.stroke(); }
  x.setLineDash([]);
}
