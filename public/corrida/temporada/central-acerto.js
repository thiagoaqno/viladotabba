// Corrida da Galera — a aba ACERTO da carreira: o acerto do carro (asa e altura) para a pista do próximo GP, antes de ir para a corrida,
// com a proposta do engenheiro da equipe e a sugestão do estrategista contratado (o nível vem de s.engenheiros.estrategista: o de base erra
// um pouco, o experiente e o de elite acertam o melhor medido). O acerto fica guardado no navegador por pista (acerto-sugestao.js) e a
// corrida usa o mesmo (acerto-carro.js, na largada); o painel P da corrida mexe nele também.
(function (root) {
"use strict";
const U = () => root.CentralUI, h = (v) => U().h(v), A = () => root.AcertoSugestao;
let ideais = null;
const CAMPOS = [["asa", "Asa (downforce)", "Mais asa: mais aderência na curva e na freada, e mais arrasto (menos velocidade na reta)."],
  ["altura", "Altura do carro", "Mais baixo: um pouco mais de aderência, até raspar o assoalho no fim da reta (faísca, perde carga e freia). Mais alto: nunca raspa."]];
const valor = (k, a) => (k === "asa" ? Math.round(A().forcaDaAsa(a) * 100) + "%" : A().cm(a));
function sugestoes(c, id) {
  const ideal = ideais && ideais[id], nivel = Math.max(0, Math.min(2, (c.s.engenheiros && c.s.engenheiros.estrategista) || 0));
  return { nivel, engenheiro: A().propostaDoEngenheiro(ideal), estrategista: A().sugestaoDoEstrategista(ideal, id, nivel) };
}
function html(c) {
  const UI = U(), prox = c.prox, id = prox && prox.pista;
  if (!A()) return `<section class="cx-card">${UI.tituloCard("Acerto do carro")}<p>O acerto não carregou. Recarregue a página.</p></section>`;
  if (!id) return `<section class="cx-card cx-an-vazio"><h3>Sem GP pela frente</h3><p>O acerto do carro é por pista: ele aparece aqui quando houver um próximo GP no calendário.</p></section>`;
  if (!ideais) A().carregarIdeais().then((j) => { ideais = j || {}; root.Central?.aba?.() === "acerto" && document.querySelector('.cx-aba[data-cx-aba="acerto"]')?.click(); });
  const nome = (root.Pistas?.PISTAS?.[id]?.name) || prox.nome || id, atual = A().lerGuardado(id) || A().PADRAO, sg = sugestoes(c, id);
  const cartao = (quem, titulo, a) => a ? `<article class="cx-card" style="padding:14px 16px;display:grid;gap:6px">
      <div style="display:flex;align-items:center;gap:10px"><b style="flex:1;font-size:1.05em">${h(titulo)}</b><button type="button" class="cx-bt" data-cx-acerto-usar="${quem}">Usar este acerto</button></div>
      <p style="margin:0">"${h(A().frase(a))}"</p><small style="opacity:.75">${h(A().efeito(a))}</small></article>` : "";
  const deslizantes = CAMPOS.map(([k, nome2, dica]) => `<label style="display:block;margin:14px 0 4px;color:inherit;text-transform:none;letter-spacing:normal;font-size:1rem"><span style="display:flex;justify-content:space-between;font-weight:700;color:inherit"><span>${h(nome2)}</span><output data-cx-acerto-v="${k}">${h(valor(k, atual))}</output></span>
      <input type="range" min="0" max="1" step="0.01" value="${atual[k]}" data-cx-acerto="${k}" style="width:100%;accent-color:var(--eq,#e10600)">
      <small style="display:block;color:inherit;opacity:.75;text-transform:none;letter-spacing:normal">${h(dica)}</small></label>`).join("");
  return `<div style="display:grid;gap:16px;max-width:880px">
    <section class="cx-card" style="padding:16px 18px">${UI.tituloCard(`Acerto para ${h(nome)}`, "Fica guardado para esta pista; o painel P da corrida mexe no mesmo")}
      <p data-cx-acerto-efeito style="margin:8px 0 0;font-weight:700">${h(A().efeito(atual))}</p>
      ${deslizantes}
      <button type="button" class="cx-contorno" data-cx-acerto-padrao style="margin-top:8px">Carro padrão (tudo no meio)</button></section>
    ${ideais ? `<div style="display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">${cartao("engenheiro", "Engenheiro da equipe", sg.engenheiro)}${cartao("estrategista", `Estrategista ${A().NIVEIS_ESTRATEGISTA[sg.nivel]}`, sg.estrategista)}</div>
      ${sg.nivel === 0 ? `<small style="opacity:.75">O estrategista de base erra um pouco. Contrate um experiente (aba Contratos) para receber o melhor acerto da pista.</small>` : ""}` : `<p>Carregando as sugestões…</p>`}
  </div>`;
}
// os deslizantes: guardam na hora e atualizam os textos sem redesenhar a tela (redesenhar soltaria o deslizante no meio do arrasto)
document.addEventListener("input", (e) => {
  const k = e.target?.dataset?.cxAcerto; if (!k) return;
  const ctx = root.CentralAcerto._ctx, id = ctx && ctx.prox && ctx.prox.pista; if (!id) return;
  const a = { ...(A().lerGuardado(id) || A().PADRAO), [k]: +e.target.value }; A().guardar(id, a);
  for (const [c] of CAMPOS) { const o = document.querySelector(`[data-cx-acerto-v="${c}"]`); if (o) o.textContent = valor(c, a); }
  const ef = document.querySelector("[data-cx-acerto-efeito]"); if (ef) ef.textContent = A().efeito(a);
});
function clique(b, render) {
  const ctx = root.CentralAcerto._ctx, id = ctx && ctx.prox && ctx.prox.pista;
  if (b.dataset.cxAcertoUsar && id) { const a = sugestoes(ctx, id)[b.dataset.cxAcertoUsar]; if (a) A().guardar(id, a); render(); return true; }
  if (b.hasAttribute("data-cx-acerto-padrao") && id) { A().guardar(id, A().PADRAO); render(); return true; }
  return false;
}
root.CentralAcerto = { html: (c) => { root.CentralAcerto._ctx = c; return html(c); }, clique, _ctx: null };
})(typeof window !== "undefined" ? window : globalThis);
