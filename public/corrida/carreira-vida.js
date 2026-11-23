// Corrida da Galera — a carreira de F1 com mais vida (2026-11-23; carreira-vida.css). Tudo por delegação no documento, então vale para o que a Central
// redesenhar depois. Com "reduzir movimento", só o essencial (nada se mexe). Ajudas: CarreiraVida.varrer(dir) e CarreiraVida.entrar(corpo, dir), que a
// troca de aba da Central chama (central.js animarAba).
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
    const luz = document.createElement("i"), borda = document.createElement("i"); luz.className = "cv-luz"; borda.className = "cv-borda";
    luz.setAttribute("aria-hidden", "true"); borda.setAttribute("aria-hidden", "true"); el.append(luz, borda);
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

  // ---------- a troca de aba: a varredura e a entrada ----------
  function varrer(dir = 1) {
    if (reduz()) return;
    const v = document.createElement("div"); v.className = "cv-varre"; v.setAttribute("aria-hidden", "true"); v.innerHTML = "<i></i><i></i><i></i>";
    document.body.appendChild(v);
    const de = dir > 0 ? "-60vw" : "120vw", para = dir > 0 ? "120vw" : "-60vw";
    [...v.children].forEach((faixa, k) => faixa.animate([{ left: de }, { left: para }], { duration: 560, delay: k * 45, easing: "cubic-bezier(.7,0,.25,1)", fill: "both" }));
    setTimeout(() => v.remove(), 760);
  }
  function entrar(corpo, dir = 1) {
    if (reduz() || !corpo || !corpo.animate) return;
    const blocos = [...corpo.children].slice(0, 10);
    (blocos.length ? blocos : [corpo]).forEach((el, i) => el.animate(
      [{ opacity: 0, filter: "blur(6px)", transform: `translateX(${dir * 36}px) scale(.985)` }, { opacity: 1, filter: "blur(0)", transform: "none" }],
      { duration: 420, delay: 140 + i * 55, easing: "cubic-bezier(.2,.8,.2,1)", fill: "backwards" }));
  }
  root.CarreiraVida = { varrer, entrar };
})(typeof window !== "undefined" ? window : globalThis);
