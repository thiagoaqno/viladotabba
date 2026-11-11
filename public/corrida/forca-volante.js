// Corrida da Galera — a FORÇA NO VOLANTE (force feedback) e a VIBRAÇÃO DO CONTROLE. jogo.js chama `quadro` a cada desenho e fisica.js
// chama `batida` nas pancadas; a tela Controles (teclas-ui.js, aba Controle) mostra o botão de conectar e a intensidade.
//  - Volante Logitech (Driving Force, DF Pro, DF GT, G25, G27, G29) pelo WebHID: o navegador do programa de PC (o Edge) fala direto com o
//    volante pelos comandos de força clássicos da Logitech (os mesmos do driver hid-lg4ff do Linux): força constante no slot 1
//    (0x11 0x08 <nível> 0x80), desligar a volta ao centro do próprio volante (0xf5) e parar (0x13). O G920/G923 de Xbox fala outro
//    protocolo (HID++) e não entra. Depois do primeiro "Conectar", o navegador lembra a permissão e liga sozinho nas próximas vezes.
//  - A força: o volante puxa para o centro mais forte quanto maior a velocidade (como a força de alinhamento dos pneus), fica LEVE quando
//    o carro derrapa (o pneu perdeu a aderência), treme na zebra, chacoalha na grama e na brita e dá um tranco na batida.
//  - Controle (Xbox, PlayStation): a vibração do próprio controle (gamepad.vibrationActuator), na zebra, fora da pista e na batida.
// Os números da força são de sensação (o jogo não tem o torque do pneu de verdade): acerte pela intensidade na tela Controles.
const CHAVE = "corrida:ffb";
const LOGITECH = 0x046d, MODELOS = [0xc294, 0xc298, 0xc29a, 0xc299, 0xc29b, 0xc24f]; // DF/compatível, DF Pro, DF GT, G25, G27, G29
let cfg = { ligado: true, forca: 0.6, vibrar: true };
try { cfg = { ...cfg, ...JSON.parse(localStorage.getItem(CHAVE) || "{}") }; } catch { /* sem armazenamento */ }
const guardar = () => { try { localStorage.setItem(CHAVE, JSON.stringify(cfg)); } catch { /* sem armazenamento */ } };

let volante = null, ultimo = -1, enviando = false, tranco = 0, fase = 0, ultimaVib = 0;
const temHID = typeof navigator !== "undefined" && !!navigator.hid;

async function abrir(d) {
  if (!d) return false;
  try {
    if (!d.opened) await d.open();
    volante = d; ultimo = -1;
    await mandar([0xf5, 0, 0, 0, 0, 0, 0]); // (sem a volta ao centro do volante: quem puxa é o jogo)
    return true;
  } catch (e) { console.warn("Força no volante:", e.message); volante = null; return false; }
}
async function mandar(bytes) {
  if (!volante || enviando) return;
  enviando = true;
  try { await volante.sendReport(0, new Uint8Array(bytes)); } catch (e) { console.warn("Força no volante:", e.message); volante = null; }
  enviando = false;
}
// o volante já permitido antes liga sozinho (o navegador lembra)
if (temHID) {
  navigator.hid.getDevices().then((l) => abrir(l.find((d) => d.vendorId === LOGITECH && MODELOS.includes(d.productId)))).catch(() => {});
  navigator.hid.addEventListener?.("disconnect", (e) => { if (e.device === volante) volante = null; });
}
async function conectar() {
  if (!temHID) return "Este navegador não fala com volantes. Use o programa de PC (ou o Edge/Chrome).";
  try {
    const [d] = await navigator.hid.requestDevice({ filters: MODELOS.map((productId) => ({ vendorId: LOGITECH, productId })) });
    if (!d) return "Nenhum volante escolhido.";
    return (await abrir(d)) ? `Conectado: ${d.productName || "volante Logitech"}.` : "Não deu para abrir o volante (feche o G HUB e tente de novo).";
  } catch (e) { return "Não deu para conectar: " + e.message; }
}
function parar() { if (volante) { ultimo = -1; mandar([0x13, 0, 0, 0, 0, 0, 0]); } }

// a força deste quadro, de -1 (puxa para a esquerda) a 1 (direita)
function calcular(s, dt) {
  const v = Math.abs(s.v || 0), rapido = Math.min(1, v / 300), leve = 1 - Math.min(0.7, (s.slip || 0) * 0.7);
  let f = -(s.steer || 0) * (0.25 + 0.75 * rapido) * leve; // a volta ao centro (cresce com a velocidade, some na derrapagem)
  fase += dt * (s.zebra ? 38 : 22);
  if (s.zebra && v > 20) f += Math.sin(fase) * 0.35 * Math.min(1, v / 150);
  else if (s.fora && v > 20) f += (Math.random() - 0.5) * 0.4 * Math.min(1, v / 150);
  if (tranco) { f += tranco; tranco *= Math.pow(0.02, dt); if (Math.abs(tranco) < 0.02) tranco = 0; }
  return Math.max(-1, Math.min(1, f * cfg.forca));
}
function quadro(s, dt) {
  const correndo = !!(s && s.correndo);
  // o volante
  if (volante) {
    if (!cfg.ligado || !correndo) { if (ultimo !== -1) parar(); }
    else {
      const nivel = Math.round(0x80 + calcular(s, dt) * 127);
      if (nivel !== ultimo) { ultimo = nivel; mandar([0x11, 0x08, nivel, 0x80, 0, 0, 0]); }
    }
  }
  // o controle
  if (cfg.vibrar && correndo && (s.zebra || s.fora || tranco) && performance.now() - ultimaVib > 90) {
    const gp = [...(navigator.getGamepads ? navigator.getGamepads() : [])].find((g) => g && g.connected && g.vibrationActuator);
    if (gp) {
      ultimaVib = performance.now();
      const v = Math.min(1, Math.abs(s.v || 0) / 200), forte = Math.min(1, Math.abs(tranco) * 2 + (s.fora ? 0.35 * v : 0)), fraco = s.zebra ? 0.5 * v : 0.2 * v;
      gp.vibrationActuator.playEffect("dual-rumble", { duration: 110, strongMagnitude: forte, weakMagnitude: fraco }).catch(() => {});
    }
  }
}
// a pancada (fisica.js, avisarBatida): um tranco para o lado, maior quanto mais forte
function batida(forca) { tranco = (Math.random() < 0.5 ? -1 : 1) * Math.min(0.9, 0.3 + (forca || 0) / 400); }

// o pedaço da tela Controles (aba Controle)
function html() {
  const st = volante ? `Volante conectado: ${volante.productName || "Logitech"}` : temHID ? "Nenhum volante conectado" : "Força no volante só no programa de PC (ou no Edge/Chrome)";
  return `<div class="tk-ffb" style="margin-top:10px;padding-top:8px;border-top:1px solid #ffffff22">
    <h3 style="margin:4px 0">Força no volante e vibração</h3>
    <small style="display:block;opacity:.8;margin-bottom:6px">${st}. Volantes Logitech Driving Force, G25, G27 e G29.</small>
    ${temHID ? `<button type="button" data-ffb="conectar">${volante ? "Trocar de volante" : "Conectar volante"}</button>` : ""}
    <label class="tk-r"><span>Força no volante<small>0 desliga</small></span><input type="range" min="0" max="100" value="${Math.round(cfg.forca * 100)}" data-ffb="forca"><b>${Math.round(cfg.forca * 100)}</b></label>
    <label style="display:flex;gap:8px;align-items:center;margin-top:4px"><input type="checkbox" data-ffb="vibrar" ${cfg.vibrar ? "checked" : ""}> Vibração do controle (zebra, fora da pista e batidas)</label>
    <small data-ffb-msg style="display:block;margin-top:4px"></small></div>`;
}
if (typeof document !== "undefined") {
  document.addEventListener("click", async (e) => {
    const b = e.target.closest?.('[data-ffb="conectar"]'); if (!b) return;
    const msg = b.closest(".tk-ffb")?.querySelector("[data-ffb-msg]"); if (msg) msg.textContent = "Escolha o volante na janela…";
    const t = await conectar(); if (msg) msg.textContent = t;
  });
  document.addEventListener("input", (e) => {
    const k = e.target.dataset?.ffb;
    if (k === "forca") { cfg.forca = Number(e.target.value) / 100; cfg.ligado = cfg.forca > 0; guardar(); const o = e.target.parentNode.querySelector("b"); if (o) o.textContent = e.target.value; }
    if (k === "vibrar") { cfg.vibrar = e.target.checked; guardar(); }
  });
}

window.ForcaVolante = { quadro, batida, conectar, parar, html };
export { quadro, batida, conectar, parar, html };
