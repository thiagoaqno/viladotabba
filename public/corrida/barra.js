// A barra de botões da corrida (#tbBarra, index.html): à vista só o que se usa na pista (Box, ERS, Pronto, câmera, voltar à
// pista); o som, a câmera ajustável, a linha de frenagem, os controles, reiniciar e sair ficam no menu (#tbMenu). Os botões
// continuam com os mesmos ids, e cada um com o seu comportamento de sempre (jogo.js, box.js, linha-frenagem.js...).
(function () {
  const botao = document.getElementById("bMenu"), menu = document.getElementById("tbMenu");
  if (!botao || !menu) return;
  const abrir = (on) => { menu.hidden = !on; botao.setAttribute("aria-expanded", String(on)); botao.classList.toggle("on", on); };
  botao.addEventListener("click", (e) => { e.stopPropagation(); abrir(menu.hidden); });
  // um item do menu fecha o menu (o volume e o rádio não: dá para mexer neles com o menu aberto)
  menu.addEventListener("click", (e) => { const b = e.target.closest(".tb-item"); if (b) abrir(false); });
  document.addEventListener("pointerdown", (e) => { if (!menu.hidden && !menu.contains(e.target) && !botao.contains(e.target)) abrir(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !menu.hidden) { e.stopPropagation(); abrir(false); } }, true);
})();
