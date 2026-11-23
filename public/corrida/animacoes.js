// Corrida da Galera — as animações dos menus e da carreira (2026-11-23; animacoes.css). Três ajudas, todas desligadas com "reduzir movimento":
//  - Animacoes.entrar(el): a tela que acabou de aparecer sobe e aparece; Animacoes.trocar(fn): a transição nativa (startViewTransition), quando a troca pode esperar um quadro;
//  - Animacoes.indicador(abas): o sublinhado único que desliza até a aba ativa;
//  - Animacoes.contar(raiz) e cascata(raiz): os números grandes contam até o valor e as linhas entram uma depois da outra.
(function (root) {
  const reduz = () => !!(root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches);
  function trocar(fn) {
    if (reduz() || !document.startViewTransition || document.hidden) { fn(); return; }
    try { document.startViewTransition(fn); } catch (e) { fn(); }
  }
  // a tela que acabou de aparecer: sobe 12 px e aparece (Web Animations; não muda nada no layout nem atrasa a troca)
  function entrar(el, ms = 300) { if (!el || !el.animate || reduz()) return; el.animate([{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "none" }], { duration: ms, easing: "cubic-bezier(0,0,.2,1)" }); }
  // a barra de abas é redesenhada a cada troca: a barra nova nasce onde a antiga estava (`ultimo`) e desliza até a aba ativa
  let ultimo = null;
  function indicador(abas) {
    if (!abas) return;
    const on = abas.querySelector(".on"); let b = abas.querySelector(".an-ind-barra"), nova = false;
    if (!b) { b = document.createElement("i"); b.className = "an-ind-barra sem"; b.setAttribute("aria-hidden", "true"); abas.appendChild(b); abas.classList.add("an-ind"); nova = true; }
    if (!on) { b.style.width = "0"; return; }
    const alvo = { x: on.offsetLeft, w: on.offsetWidth }, pos = (p) => { b.style.width = p.w + "px"; b.style.transform = `translateX(${p.x}px)`; };
    if (nova && ultimo && !reduz() && (ultimo.x !== alvo.x || ultimo.w !== alvo.w)) { pos(ultimo); void b.offsetWidth; b.classList.remove("sem"); pos(alvo); }
    else { pos(alvo); if (nova) requestAnimationFrame(() => requestAnimationFrame(() => b.classList.remove("sem"))); }
    ultimo = alvo;
  }
  // o primeiro número do texto (com vírgula decimal ou ponto de milhar) conta de 0 até ele; o resto do texto fica
  const NUM = /(\d{1,3}(?:\.\d{3})+|\d+)(,\d+)?/;
  function contarEl(el, ms = 700) {
    const no = [...el.childNodes].find((n) => n.nodeType === 3 && NUM.test(n.nodeValue)); if (!no) return;
    const txt = no.nodeValue, m = txt.match(NUM), inteiro = m[1].replace(/\./g, ""), dec = m[2] ? m[2].length - 1 : 0, alvo = parseFloat(inteiro + (m[2] ? "." + m[2].slice(1) : ""));
    if (!(alvo > 0) || alvo > 1e7 || !/^[\sR$+\-−]*$/.test(txt.slice(0, m.index))) return; // (só quando o número abre o texto: "Terminar no top 5" não conta)
    const antes = txt.slice(0, m.index), depois = txt.slice(m.index + m[0].length), milhar = m[1].includes(".");
    const fmt = (v) => { let s = v.toFixed(dec).replace(".", ","); if (milhar) s = s.replace(/^\d+/, (x) => x.replace(/\B(?=(\d{3})+(?!\d))/g, ".")); return antes + s + depois; };
    const t0 = performance.now();
    const passo = (t) => { const u = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - u, 3); no.nodeValue = u >= 1 ? txt : fmt(alvo * e); if (u < 1 && no.isConnected) requestAnimationFrame(passo); };
    no.nodeValue = fmt(0); requestAnimationFrame(passo);
  }
  const NUMEROS = ".cx-numeros strong, .cx-nums b, .cx-num b, .cx-ob-num b, .cx-camp strong";
  function contar(raiz) { if (reduz() || !raiz) return; raiz.querySelectorAll(NUMEROS).forEach((el) => contarEl(el)); }
  const LINHAS = "tbody tr, .cx-lista > li, ol > li";
  function cascata(raiz, max = 24) {
    if (reduz() || !raiz) return;
    [...raiz.querySelectorAll(LINHAS)].slice(0, max).forEach((el, i) => { el.style.setProperty("--an-i", i); el.classList.remove("an-cai"); void el.offsetWidth; el.classList.add("an-cai"); });
  }
  if (root.addEventListener) root.addEventListener("resize", () => { const a = document.querySelector(".cx-abas.an-ind"); if (a) indicador(a); });
  root.Animacoes = { trocar, entrar, indicador, contar, contarEl, cascata, reduz };
})(typeof window !== "undefined" ? window : globalThis);
