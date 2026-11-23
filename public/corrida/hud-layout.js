// Corrida da Galera — o LAYOUT DO HUD em miniatura, para arrumar fora da corrida (2026-11-23, o Thiago: "a configuração de HUD e todas as outras
// deviam ficar nas configurações no lobby/carreira também... ninguém vai no meio da corrida ficar mexendo nisso").
// Um script comum (sem import), usado pela tela Configurações da Corrida (configuracoes.js) e pela da carreira (temporada/config-carreira.js).
// A miniatura é a tela do jogo em escala: cada bloco do HUD é um retângulo no lugar e no tamanho que o próprio jogo MEDIU na última corrida
// (hud-vivo.js guarda em corrida:hud-rects), mais o deslocamento escolhido (corrida:hud-pos, o mesmo que o arrastar na corrida usa). Arrastar um
// retângulo muda o deslocamento; "Restaurar" volta tudo ao padrão. Sem nenhuma corrida jogada ainda, não há o que desenhar: a miniatura avisa.
(function (root) {
  "use strict";
  const POS = "corrida:hud-pos", RECTS = "corrida:hud-rects";
  const ler = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
  const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sem armazenamento */ } };
  const h = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  if (!document.getElementById("hlEstilo")) {
    const st = document.createElement("style"); st.id = "hlEstilo";
    st.textContent = `.hl-tela{position:relative;width:100%;border-radius:8px;background:linear-gradient(180deg,#2a3340,#151a21);border:1px solid #ffffff26;overflow:hidden;touch-action:none;user-select:none}
.hl-tela::after{content:"";position:absolute;left:50%;bottom:0;width:30%;height:22%;transform:translateX(-50%);background:#ffffff0d;clip-path:polygon(15% 100%,85% 100%,60% 0,40% 0);pointer-events:none}
.hl-bloco{position:absolute;display:grid;place-items:center;border-radius:4px;background:#37d0ee2e;border:1.5px solid #37d0eecc;color:#fff;font:700 10px/1.1 system-ui,sans-serif;text-align:center;cursor:move;overflow:hidden;padding:1px;z-index:1}
.hl-bloco.hl-arrasta{background:#37d0ee55;border-color:#fff;z-index:2}
.hl-vazio{padding:14px;color:#ffffffb0;font:500 12.5px/1.4 system-ui,sans-serif;text-align:center}
.hl-acoes{display:flex;gap:8px;justify-content:flex-end;margin-top:8px}`;
    document.head.appendChild(st);
  }
  // rects: { W, H, itens: { sel: [x, y, w, h, nome] } } (o lugar de fábrica, sem o deslocamento)
  function montar(caixa, aoMudar) {
    const R = ler(RECTS), itens = R && R.itens ? Object.entries(R.itens) : [];
    if (!itens.length || !(R.W > 0 && R.H > 0)) { caixa.innerHTML = '<div class="hl-tela"><div class="hl-vazio">Jogue uma corrida (ou entre na classificação) uma vez: o jogo mede o HUD da sua tela e ele aparece aqui para arrumar.</div></div>'; return; }
    caixa.innerHTML = `<div class="hl-tela" style="aspect-ratio:${R.W}/${R.H}"></div>`;
    const tela = caixa.firstChild;
    const desenhar = () => {
      const pos = ler(POS) || {}, k = tela.clientWidth / R.W;
      tela.innerHTML = itens.map(([sel, [x, y, w, hh, nome]]) => { const p = pos[sel] || [0, 0];
        return `<div class="hl-bloco" data-sel="${h(sel)}" style="left:${((x + p[0]) * k).toFixed(1)}px;top:${((y + p[1]) * k).toFixed(1)}px;width:${Math.max(18, w * k).toFixed(1)}px;height:${Math.max(12, hh * k).toFixed(1)}px">${h(nome)}</div>`; }).join("");
    };
    desenhar();
    let arr = null;
    tela.addEventListener("pointerdown", (e) => {
      const b = e.target.closest(".hl-bloco"); if (!b) return; e.preventDefault();
      const sel = b.dataset.sel, pos = ler(POS) || {}, p = pos[sel] || [0, 0], it = R.itens[sel];
      arr = { b, sel, x0: e.clientX, y0: e.clientY, p0: p, it, k: tela.clientWidth / R.W }; b.classList.add("hl-arrasta"); b.setPointerCapture?.(e.pointerId);
    });
    tela.addEventListener("pointermove", (e) => {
      if (!arr) return;
      const a = arr, [x, y, w, hh] = a.it;
      let dx = a.p0[0] + (e.clientX - a.x0) / a.k, dy = a.p0[1] + (e.clientY - a.y0) / a.k;
      dx = Math.max(-x, Math.min(R.W - (x + w), dx)); dy = Math.max(-y, Math.min(R.H - (y + hh), dy)); // (nunca sai da tela)
      const pos = ler(POS) || {}; pos[a.sel] = [Math.round(dx), Math.round(dy)]; gravar(POS, pos);
      a.b.style.left = ((x + dx) * a.k).toFixed(1) + "px"; a.b.style.top = ((y + dy) * a.k).toFixed(1) + "px";
    });
    const soltar = () => { if (!arr) return; arr.b.classList.remove("hl-arrasta"); arr = null; aoMudar?.(); };
    tela.addEventListener("pointerup", soltar); tela.addEventListener("pointercancel", soltar);
    if (root.ResizeObserver) new ResizeObserver(() => { if (!arr) desenhar(); }).observe(tela);
  }
  function restaurar() { try { localStorage.removeItem(POS); } catch { /* sem armazenamento */ } }
  root.HudLayout = { montar, restaurar };
})(window);
