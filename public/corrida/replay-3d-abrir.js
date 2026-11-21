// Corrida da Galera — abre o replay 3D (replay-3d.js) num quadro por cima da tela: a página do jogo com `?replay=1`, que monta a pista e os carros.
// Quem chama (a aba Replay da análise, resultado-analise.js: na tela do resultado e na Central da carreira) passa o replay cru e quem é quem;
// o quadro avisa quando está pronto ("replay3d-pronto"), recebe tudo por mensagem e pede para fechar ("replay3d-fechar": o ✕ ou o Esc).
let aberto = null;

export function abrirReplay3D(dados) {
  fecharReplay3D();
  const fr = document.createElement("iframe");
  fr.src = "/corrida/?replay=1"; fr.title = "Replay 3D"; fr.allow = "fullscreen; gamepad";
  fr.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;border:0;z-index:2147483000;background:#080b11";
  const ouvir = (ev) => {
    if (ev.source !== fr.contentWindow || ev.origin !== location.origin || !ev.data) return;
    if (ev.data.tipo === "replay3d-pronto") fr.contentWindow.postMessage({ tipo: "replay3d", ...dados }, location.origin);
    else if (ev.data.tipo === "replay3d-fechar") fecharReplay3D();
  };
  addEventListener("message", ouvir);
  const rolagem = document.documentElement.style.overflow; document.documentElement.style.overflow = "hidden";
  document.body.appendChild(fr); fr.focus();
  aberto = { fr, ouvir, rolagem };
}

export function fecharReplay3D() {
  if (!aberto) return;
  removeEventListener("message", aberto.ouvir); aberto.fr.remove(); document.documentElement.style.overflow = aberto.rolagem; aberto = null;
}
