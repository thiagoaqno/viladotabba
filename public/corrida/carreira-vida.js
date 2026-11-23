// Corrida da Galera — a carreira de F1 com mais vida (2026-11-23; carreira-vida.css). Tudo por delegação no documento, então vale para o que a Central
// redesenhar depois. Com "reduzir movimento", só o essencial (nada se mexe). Ajudas: CarreiraVida.entrar(corpo, dir) (o slide com mola), que a
// troca de aba da Central chama (central.js animarAba). Também o ponteiro (um ponto e um anel) no lugar da seta.
(function (root) {
  if (typeof document === "undefined") return;
  const reduz = () => !!(root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const toque = () => !!(root.matchMedia && root.matchMedia("(hover: none)").matches);
  const CARTOES = ".cx-card,.cx-oferta,.cx-prop,.cx-perfil,.cx-cn-gp,.cx-cn-prox,.cx-prox-mini,.cx-dv-painel,.pd-card,.gr-card,.cx-camp";
  const BOTOES = ".cx-bt,.cx-link,button.cx-ok,.cx-seta,.pd-bt,.gr-bt";
  const CLICAVEIS = "button,a,[role=button],.cx-aba,.cx-card,.cx-oferta,.cx-prop";
  const MAX_INCLINA = 5; // graus

  // ---------- cartões: inclinação e luz ----------
  let atual = null;
  function preparar(el) {
    if (el._cv) return; el._cv = true; el.classList.add("cv-vivo");
    if (getComputedStyle(el).position === "static") el.style.position = "relative";
    const borda = document.createElement("i"); borda.className = "cv-borda"; borda.setAttribute("aria-hidden", "true"); el.append(borda); // (2026-11-23: a luz branca que seguia o mouse saiu; fica a borda)
    if (el.parentElement && !el.parentElement.style.perspective) el.parentElement.style.perspective = "1100px";
  }
  function soltar(el) { if (!el) return; el.classList.remove("cv-dentro"); el.style.rotate = ""; }
  function moverCartao(e) {
    const el = e.target.closest && e.target.closest(CARTOES);
    if (el !== atual) { soltar(atual); atual = el; if (el) { preparar(el); el.classList.add("cv-dentro"); } }
    if (!el) return;
    const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--cv-x", (x * 100).toFixed(1) + "%"); el.style.setProperty("--cv-y", (y * 100).toFixed(1) + "%");
    if (reduz()) return;
    const ax = -(y - 0.5), ay = x - 0.5, ang = Math.min(1, Math.hypot(ax, ay) * 2) * MAX_INCLINA * Math.min(1, 320 / Math.max(r.width, 1));
    el.style.rotate = Math.hypot(ax, ay) > 0.001 ? `${ax.toFixed(3)} ${ay.toFixed(3)} 0 ${ang.toFixed(2)}deg` : "";
  }

  // ---------- botões: ímã e brilho ----------
  let botao = null;
  function moverBotao(e) {
    const b = e.target.closest && e.target.closest(BOTOES);
    if (b !== botao) { if (botao) botao.style.translate = ""; botao = b; if (b) { b.classList.add("cv-ima"); if (!reduz()) { b.classList.remove("cv-brilha"); void b.offsetWidth; b.classList.add("cv-brilha"); } } }
    if (!b || reduz()) return;
    const r = b.getBoundingClientRect(), dx = (e.clientX - (r.left + r.width / 2)) / r.width, dy = (e.clientY - (r.top + r.height / 2)) / r.height;
    b.style.translate = `${(dx * 6).toFixed(1)}px ${(dy * 4).toFixed(1)}px`;
  }
  document.addEventListener("animationend", (e) => { if (e.animationName === "cvBrilho") e.target.classList.remove("cv-brilha"); if (e.animationName === "cvPulo") e.target.classList.remove("cv-pulo"); });

  // ---------- o fundo: profundidade ----------
  let quadro = 0, ultimoEv = null;
  function moverFundo(e) {
    const w = root.innerWidth || 1, h = root.innerHeight || 1, s = document.documentElement.style;
    s.setProperty("--cv-px", ((e.clientX / w - 0.5) * 2).toFixed(3)); s.setProperty("--cv-py", ((e.clientY / h - 0.5) * 2).toFixed(3));
  }
  document.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" || toque()) return;
    ultimoEv = e; if (quadro) return;
    quadro = requestAnimationFrame(() => { quadro = 0; const ev = ultimoEv; moverCartao(ev); moverBotao(ev); if (!reduz()) moverFundo(ev); });
  }, { passive: true });
  document.addEventListener("pointerleave", () => { soltar(atual); atual = null; if (botao) botao.style.translate = ""; botao = null; });

  // ---------- o clique: a onda ----------
  function onda(el, x, y) {
    if (reduz()) return;
    const r = el.getBoundingClientRect(); if (r.width < 4 || r.height < 4) return;
    const box = document.createElement("div"), cs = getComputedStyle(el), cor = getComputedStyle(document.documentElement).getPropertyValue("--eq-at").trim() || "#fff";
    box.className = "cv-onda"; box.setAttribute("aria-hidden", "true");
    Object.assign(box.style, { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px", borderRadius: cs.borderRadius, clipPath: cs.clipPath !== "none" ? cs.clipPath : "" });
    const i = document.createElement("i"); i.style.left = (x - r.left) + "px"; i.style.top = (y - r.top) + "px";
    i.style.setProperty("--cv-esc", String(Math.ceil(Math.hypot(r.width, r.height) * 2 / 12)));
    const claro = el.matches(".cx-bt") ? "#fff" : cor; box.style.setProperty("--cv-cor", claro);
    box.appendChild(i); document.body.appendChild(box); setTimeout(() => box.remove(), 600);
  }
  document.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    const el = e.target.closest && e.target.closest(CLICAVEIS); if (!el || el.disabled) return;
    onda(el, e.clientX, e.clientY);
    if (el.classList.contains("cx-aba") && !reduz()) { el.classList.remove("cv-pulo"); void el.offsetWidth; el.classList.add("cv-pulo"); }
  }, { passive: true });

  // ---------- a troca de aba: um slide com mola ----------
  // (2026-11-23, o Thiago: "eu sempre vejo o conteúdo antes de a faixa passar" e "quero algo minimalista e moderno, só um slide com efeito mola")
  // A faixa saiu. O conteúdo novo é desenhado e, no MESMO quadro (antes de a tela pintar), já começa escondido e fora do lugar: entra deslizando do
  // lado para onde a pessoa foi, passa um pouco do ponto e volta (a mola), bloco a bloco com um atraso curto. Nada aparece antes da hora.
  const MOLA = (() => { // os quadros da mola (amortecida: passa ~6% do ponto e assenta), de 0 a 1
    const z = 0.62, w = 15, wd = w * Math.sqrt(1 - z * z), n = 36, dur = 0.62, q = [];
    for (let k = 0; k <= n; k++) { const t = (k / n) * dur; q.push(k === n ? 1 : 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + (z * w / wd) * Math.sin(wd * t))); }
    return { q, ms: dur * 1000 };
  })();
  function varrer() {} // (a faixa saiu: fica o nome para quem ainda chama)
  function entrar(corpo, dir = 1) {
    if (reduz() || !corpo || !corpo.animate) return;
    const blocos = [...corpo.children].slice(0, 10), D = 48 * dir;
    (blocos.length ? blocos : [corpo]).forEach((el, i) => {
      const atraso = i * 38;
      el.animate(MOLA.q.map((x) => ({ transform: `translateX(${((1 - x) * D).toFixed(2)}px)` })), { duration: MOLA.ms, delay: atraso, easing: "linear", fill: "backwards" });
      el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: atraso, easing: "ease-out", fill: "backwards" });
    });
  }

  // ---------- o ponteiro: um ponto e um anel ----------
  // (2026-11-23, o Thiago: "tira essa mancha branca do meu mouse... muda o estilo do ponteiro para algo mais moderno, minimalista") o ponto fica
  // exatamente no mouse (a precisão de sempre); o anel vem atrás com uma mola leve, cresce em cima do que dá para clicar e aperta no clique.
  // Só com mouse de verdade (pointer: fine); com "reduzir movimento" o anel acompanha sem mola. Dentro dos diálogos (que ficam na camada de
  // cima), o ponteiro passa para dentro do diálogo aberto, senão ficaria por baixo dele.
  const fino = () => !!(root.matchMedia && root.matchMedia("(hover: hover) and (pointer: fine)").matches);
  let cur = null;
  function montarPonteiro() {
    if (cur || !fino() || !document.body) return;
    const caixa = document.createElement("div"), anel = document.createElement("i"), ponto = document.createElement("b");
    caixa.className = "cv-ponteiro"; caixa.setAttribute("aria-hidden", "true"); caixa.append(anel, ponto); document.body.appendChild(caixa);
    document.documentElement.classList.add("cv-sem-seta");
    cur = { caixa, anel, ponto, x: -100, y: -100, ax: -100, ay: -100, vx: 0, vy: 0, raf: 0, ant: 0 };
  }
  function passoAnel(agora) {
    const c = cur; c.raf = 0;
    const dt = Math.min(0.05, (agora - (c.ant || agora)) / 1000) || 0.016; c.ant = agora;
    if (reduz()) { c.ax = c.x; c.ay = c.y; c.vx = c.vy = 0; }
    else { const k = 520, am = 34; c.vx += ((c.x - c.ax) * k - c.vx * am) * dt; c.vy += ((c.y - c.ay) * k - c.vy * am) * dt; c.ax += c.vx * dt; c.ay += c.vy * dt; }
    c.anel.style.translate = `${c.ax.toFixed(1)}px ${c.ay.toFixed(1)}px`;
    if (Math.abs(c.x - c.ax) + Math.abs(c.y - c.ay) + Math.abs(c.vx) + Math.abs(c.vy) > 0.3) c.raf = requestAnimationFrame(passoAnel); else c.ant = 0;
  }
  function moverPonteiro(e) {
    montarPonteiro(); if (!cur) return;
    const dlg = [...document.querySelectorAll("dialog[open]")].pop() || document.body; if (cur.caixa.parentNode !== dlg) dlg.appendChild(cur.caixa);
    cur.x = e.clientX; cur.y = e.clientY; cur.ponto.style.translate = `${cur.x}px ${cur.y}px`; cur.caixa.classList.add("cv-ve");
    const alvo = e.target.closest && e.target.closest(CLICAVEIS + ",label,select,summary,input[type=range],input[type=checkbox],input[type=radio]");
    cur.caixa.classList.toggle("cv-sobre", !!alvo && !alvo.disabled);
    cur.caixa.classList.toggle("cv-texto", !!(e.target.closest && e.target.closest("input:not([type=range]):not([type=checkbox]):not([type=radio]),textarea,[contenteditable=true]")));
    if (!cur.raf) cur.raf = requestAnimationFrame(passoAnel);
  }
  document.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") moverPonteiro(e); }, { passive: true });
  document.addEventListener("pointerdown", (e) => { if (cur && e.pointerType === "mouse") cur.caixa.classList.add("cv-aperta"); }, { passive: true });
  document.addEventListener("pointerup", () => { if (cur) cur.caixa.classList.remove("cv-aperta"); }, { passive: true });
  document.documentElement.addEventListener("mouseleave", () => { if (cur) cur.caixa.classList.remove("cv-ve"); });
  root.CarreiraVida = { varrer, entrar };
})(typeof window !== "undefined" ? window : globalThis);
