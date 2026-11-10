// Corrida da Galera — o painel de ACERTO DA DIREÇÃO (tecla P na corrida; teclas.js, ação "acerto"). Muda ao vivo os valores de
// window.Volante.ACERTO (volante.js: virada, tempo até o batente, volta ao centro e curva do analógico), que só mexem na ENTRADA do jogador:
// o servidor recebe o mesmo `steer`, os robôs não mudam. Os valores ficam em "corrida:acerto-direcao"; "Padrão" volta à direção antiga
// encolhida para a escala real; "Copiar valores" põe os números na área de transferência para virarem o padrão do jogo.
const CAMPOS = [
  { id: "virada", nome: "Virada máxima", dica: "o quanto o volante vira com a tecla no fim (1 = o batente da física)", passo: 0.01, fmt: (v) => v.toFixed(2) },
  { id: "sobe", nome: "Tempo até o batente", dica: "segundos segurando a tecla até a virada máxima", passo: 0.01, fmt: (v) => v.toFixed(2) + " s" },
  { id: "volta", nome: "Volta ao centro", dica: "segundos para o volante voltar ao soltar a tecla", passo: 0.005, fmt: (v) => v.toFixed(3) + " s" },
  { id: "curva", nome: "Curva do analógico", dica: "controle: maior = mais macio no começo do curso", passo: 0.05, fmt: (v) => v.toFixed(2) },
];
let painel = null;
function montar() {
  const V = window.Volante;
  painel = document.createElement("div");
  painel.id = "acertoPainel";
  painel.setAttribute("role", "dialog"); painel.setAttribute("aria-label", "Acerto da direção");
  painel.style.cssText = "position:fixed;top:12px;right:12px;z-index:95;width:min(340px,calc(100vw - 24px));padding:12px 14px;background:#0b0d13ee;border:1px solid #ffffff2a;border-top:3px solid #e10600;color:#fff;font:600 14px/1.3 'Barlow Condensed','Titillium Web',system-ui,sans-serif;box-shadow:0 8px 30px #0008";
  const linhas = CAMPOS.map((c) => {
    const [a, b] = V.ACERTO_LIMITES[c.id];
    return `<label style="display:block;margin:8px 0 2px"><span style="display:flex;justify-content:space-between"><b>${c.nome}</b><output data-v="${c.id}"></output></span>
      <input type="range" data-c="${c.id}" min="${a}" max="${b}" step="${c.passo}" style="width:100%;accent-color:#e10600">
      <small style="color:#ffffff90;font-weight:500">${c.dica}</small></label>`;
  }).join("");
  painel.innerHTML = `<div style="display:flex;align-items:center;gap:8px"><b style="flex:1;font-size:18px;letter-spacing:.06em;text-transform:uppercase">Acerto da direção</b><button type="button" data-fechar style="background:none;border:1px solid #ffffff33;color:#fff;width:28px;height:28px;cursor:pointer">✕</button></div>
    ${linhas}
    <div style="display:flex;gap:8px;margin-top:10px"><button type="button" data-padrao style="flex:1;padding:6px;background:#ffffff18;border:1px solid #ffffff2a;color:#fff;cursor:pointer">Padrão (antiga ajustada)</button><button type="button" data-copiar style="flex:1;padding:6px;background:#e10600;border:0;color:#fff;cursor:pointer">Copiar valores</button></div>
    <small style="display:block;margin-top:6px;color:#ffffff90;font-weight:500">P abre e fecha. Vale na hora, com a corrida rolando.</small>`;
  document.body.appendChild(painel);
  const atualizar = () => { for (const c of CAMPOS) { painel.querySelector(`[data-c="${c.id}"]`).value = V.ACERTO[c.id]; painel.querySelector(`[data-v="${c.id}"]`).textContent = c.fmt(V.ACERTO[c.id]); } };
  painel.addEventListener("input", (e) => { const c = e.target.dataset.c; if (c) { V.acertar(c, e.target.value); atualizar(); } });
  painel.addEventListener("keydown", (e) => e.stopPropagation()); // (as setas nos controles deslizantes não pilotam nem mexem no MFD)
  painel.addEventListener("click", (e) => {
    if (e.target.closest("[data-fechar]")) alternarAcerto(false);
    else if (e.target.closest("[data-padrao]")) { V.acertoPadrao(); atualizar(); }
    else if (e.target.closest("[data-copiar]")) { const txt = JSON.stringify(V.ACERTO); try { navigator.clipboard.writeText(txt); } catch (err) {} e.target.textContent = "Copiado!"; setTimeout(() => { e.target.textContent = "Copiar valores"; }, 1500); }
  });
  atualizar();
}
export function alternarAcerto(abrir) {
  if (!painel) montar();
  const ver = abrir ?? painel.style.display === "none";
  painel.style.display = ver ? "" : "none";
}
