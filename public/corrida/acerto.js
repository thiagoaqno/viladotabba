// Corrida da Galera — o painel de ACERTO (tecla P na corrida; teclas.js, ação "acerto"):
//  - o ACERTO DO CARRO da pista da corrida (acerto-carro.js: asa e altura, um por pista), com a proposta do engenheiro e a sugestão do
//    estrategista (o melhor acerto medido da pista, acerto-ideal.json; o estrategista de base erra um pouco), cada uma com "Usar";
//  - o ACERTO DA DIREÇÃO (window.Volante.ACERTO, volante.js: virada, tempo até o batente, volta ao centro e curva do analógico), que só
//    mexe na ENTRADA do jogador. "Copiar valores" põe os números da direção na área de transferência para virarem o padrão do jogo.
// O painel abre sozinho no grid da primeira corrida numa pista sem acerto guardado (jogo.js).
import { E, me } from "./estado.js";
import { ACERTO_CARRO, acertarCarro, acertoCarroPadrao, usarAcerto, alturaParada, forcaDaAsa, pistaDoAcerto, carregarIdeais, sugestaoDoEstrategista, propostaDoEngenheiro, frase } from "./acerto-carro.js";
const CAMPOS = [
  { id: "virada", nome: "Virada máxima", dica: "o quanto o volante vira com a tecla no fim (1 = o batente da física)", passo: 0.01, fmt: (v) => v.toFixed(2) },
  { id: "sobe", nome: "Tempo até o batente", dica: "segundos segurando a tecla até a virada máxima", passo: 0.01, fmt: (v) => v.toFixed(2) + " s" },
  { id: "volta", nome: "Volta ao centro", dica: "segundos para o volante voltar ao soltar a tecla", passo: 0.005, fmt: (v) => v.toFixed(3) + " s" },
  { id: "curva", nome: "Curva do analógico", dica: "controle: maior = mais macio no começo do curso", passo: 0.05, fmt: (v) => v.toFixed(2) },
];
const CAMPOS_CARRO = [
  { id: "asa", nome: "Asa (downforce)", dica: "mais asa: mais aderência na curva e na freada, mais arrasto (menos velocidade na reta)", fmt: () => Math.round(forcaDaAsa(ACERTO_CARRO) * 100) + "%" },
  { id: "altura", nome: "Altura do carro", dica: "mais baixo: um pouco mais de aderência, até raspar o assoalho (faísca, perde carga e freia); mais alto: nunca raspa", fmt: () => (alturaParada(ACERTO_CARRO) * 100).toFixed(1).replace(".", ",") + " cm" },
];
const NIVEIS = ["de base", "experiente", "de elite"];
const BOTAO = "padding:6px;background:#ffffff18;border:1px solid #ffffff2a;color:#fff;cursor:pointer";
const TITULO = "display:block;margin-top:12px;padding-top:8px;border-top:1px solid #ffffff2a;font-size:16px;letter-spacing:.06em;text-transform:uppercase";
let painel = null, atualizar = () => {};
const sugestoes = { engenheiro: null, estrategista: null };
// o nível do estrategista: o da carreira (S.estrategistas, por equipe); fora da carreira, o experiente
function nivelDoEstrategista() {
  const S = E.S, m = me();
  if (S && S.estrategistas && m) return Math.max(0, Math.min(2, S.estrategistas[m.equipe] || 0));
  return 1;
}
async function desenharSugestoes() {
  const caixa = painel && painel.querySelector("[data-sugestoes]"), id = pistaDoAcerto();
  if (!caixa) return;
  if (!id) { caixa.innerHTML = ""; return; }
  const ideal = (await carregarIdeais())[id], nivel = nivelDoEstrategista();
  sugestoes.engenheiro = propostaDoEngenheiro(ideal); sugestoes.estrategista = sugestaoDoEstrategista(ideal, id, nivel);
  if (!ideal) { caixa.innerHTML = `<small style="color:#ffffff90">Sem a medição desta pista ainda.</small>`; return; }
  const linha = (quem, nome, a) => `<div style="margin:6px 0;padding:6px 8px;background:#ffffff0d;border-left:3px solid #e10600">
      <div style="display:flex;align-items:center;gap:8px"><b style="flex:1">${nome}</b><button type="button" data-usar="${quem}" style="${BOTAO}">Usar</button></div>
      <small style="color:#ffffffc0;font-weight:500">"${frase(a)}"</small></div>`;
  caixa.innerHTML = linha("engenheiro", "Engenheiro da equipe", sugestoes.engenheiro) + linha("estrategista", `Estrategista ${NIVEIS[nivel]}`, sugestoes.estrategista);
}
function montar() {
  const V = window.Volante;
  painel = document.createElement("div");
  painel.id = "acertoPainel";
  painel.setAttribute("role", "dialog"); painel.setAttribute("aria-label", "Acerto do carro e da direção");
  painel.style.cssText = "position:fixed;top:12px;right:12px;z-index:95;width:min(360px,calc(100vw - 24px));max-height:calc(100vh - 24px);overflow:auto;padding:12px 14px;background:#0b0d13ee;border:1px solid #ffffff2a;border-top:3px solid #e10600;color:#fff;font:600 14px/1.3 'Barlow Condensed','Titillium Web',system-ui,sans-serif;box-shadow:0 8px 30px #0008";
  const linhas = CAMPOS.map((c) => {
    const [a, b] = V.ACERTO_LIMITES[c.id];
    return `<label style="display:block;margin:8px 0 2px"><span style="display:flex;justify-content:space-between"><b>${c.nome}</b><output data-v="${c.id}"></output></span>
      <input type="range" data-c="${c.id}" min="${a}" max="${b}" step="${c.passo}" style="width:100%;accent-color:#e10600">
      <small style="color:#ffffff90;font-weight:500">${c.dica}</small></label>`;
  }).join("");
  const linhasCarro = CAMPOS_CARRO.map((c) => `<label style="display:block;margin:8px 0 2px"><span style="display:flex;justify-content:space-between"><b>${c.nome}</b><output data-vc="${c.id}"></output></span>
      <input type="range" data-cc="${c.id}" min="0" max="1" step="0.01" style="width:100%;accent-color:#e10600">
      <small style="color:#ffffff90;font-weight:500">${c.dica}</small></label>`).join("");
  painel.innerHTML = `<div style="display:flex;align-items:center;gap:8px"><b style="flex:1;font-size:18px;letter-spacing:.06em;text-transform:uppercase">Acerto do carro</b><button type="button" data-fechar aria-label="Fechar" style="background:none;border:1px solid #ffffff33;color:#fff;width:28px;height:28px;cursor:pointer">✕</button></div>
    <small data-pista style="display:block;color:#ffffff90;font-weight:500"></small>
    <div data-sugestoes></div>
    ${linhasCarro}
    <button type="button" data-padrao-carro style="width:100%;margin-top:6px;${BOTAO}">Carro padrão (tudo no meio)</button>
    <b style="${TITULO}">Acerto da direção</b>
    ${linhas}
    <div style="display:flex;gap:8px;margin-top:10px"><button type="button" data-padrao style="flex:1;${BOTAO}">Direção padrão</button><button type="button" data-copiar style="flex:1;padding:6px;background:#e10600;border:0;color:#fff;cursor:pointer">Copiar valores</button></div>
    <small style="display:block;margin-top:6px;color:#ffffff90;font-weight:500">P abre e fecha. Vale na hora, com a corrida rolando. O acerto do carro fica guardado para esta pista.</small>`;
  document.body.appendChild(painel);
  atualizar = () => {
    const id = pistaDoAcerto(), nome = id && window.Pistas?.PISTAS?.[id]?.name;
    painel.querySelector("[data-pista]").textContent = nome ? `Para ${nome}` : "";
    for (const c of CAMPOS_CARRO) { painel.querySelector(`[data-cc="${c.id}"]`).value = ACERTO_CARRO[c.id]; painel.querySelector(`[data-vc="${c.id}"]`).textContent = c.fmt(); }
    for (const c of CAMPOS) { painel.querySelector(`[data-c="${c.id}"]`).value = V.ACERTO[c.id]; painel.querySelector(`[data-v="${c.id}"]`).textContent = c.fmt(V.ACERTO[c.id]); }
  };
  painel.addEventListener("input", (e) => { const c = e.target.dataset.c, cc = e.target.dataset.cc; if (c) { V.acertar(c, e.target.value); atualizar(); } if (cc) { acertarCarro(cc, e.target.value); atualizar(); } });
  painel.addEventListener("keydown", (e) => e.stopPropagation()); // (as setas nos controles deslizantes não pilotam nem mexem no MFD)
  painel.addEventListener("click", (e) => {
    const usar = e.target.closest("[data-usar]");
    if (usar) { const a = sugestoes[usar.dataset.usar]; if (a) { usarAcerto(a); atualizar(); } }
    else if (e.target.closest("[data-fechar]")) alternarAcerto(false);
    else if (e.target.closest("[data-padrao]")) { V.acertoPadrao(); atualizar(); }
    else if (e.target.closest("[data-padrao-carro]")) { acertoCarroPadrao(); atualizar(); }
    else if (e.target.closest("[data-copiar]")) { const txt = JSON.stringify(V.ACERTO); try { navigator.clipboard.writeText(txt); } catch (err) {} e.target.textContent = "Copiado!"; setTimeout(() => { e.target.textContent = "Copiar valores"; }, 1500); }
  });
}
export function alternarAcerto(abrir) {
  if (!painel) montar();
  const ver = abrir ?? painel.style.display === "none";
  painel.style.display = ver ? "" : "none";
  if (ver) { atualizar(); desenharSugestoes(); }
}
