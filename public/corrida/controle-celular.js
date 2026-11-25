// Corrida da Galera — o lado do jogo do controle no celular (corrida-controle.js no servidor, controle.html no celular).
// Só no programa de PC (ou com ?controle=1, para testar): o jogo fala com o servidor do PC pelo canal /controle (sempre o local, mesmo com o jogo
// online: o endereço inteiro passa reto pela troca de endereço do pc.js). O que chega do celular vai para `celular` (controles.js: o volante, o
// acelerador, o freio, o ERS e o olhar para trás, como um controle) e as ações de um toque (box, MFD, rádio, câmera, marcha, voltar à pista) são
// feitas aqui. De volta, 10 vezes por segundo, o painel: marcha, velocidade, volta, posição, ERS e o pneu.
// O botão "📱 Controle no celular" fica no menu e abre a janela com o endereço para digitar no Safari.
import { E, me, $, toast } from "./estado.js";
import { race, respawn } from "./jogo.js";
import { celular, trocarMarcha, nextCam } from "./controles.js";
import { teclaBox } from "./mfd.js";
import { comecarVoz } from "./voz.js";
import { standings } from "./hud.js";

const ligado = !!window.CORRIDA_PC?.pc || new URLSearchParams(location.search).has("controle");
const naoAqui = new URLSearchParams(location.search).has("replay") || new URLSearchParams(location.search).has("editor");
let sock = null, est = { ligado: false, enderecos: [], celulares: 0 }, janela = null, bt = null; // (o bt aqui em cima: iniciar() roda já na linha de baixo e chama botao())

if (ligado && !naoAqui && window.io) iniciar();

function iniciar() {
  sock = window.io(location.origin + "/controle", { transports: ["websocket"] });
  sock.on("connect", () => sock.emit("jogo", null, (e) => { if (e) mudou(e); }));
  sock.on("estado", mudou);
  sock.on("e", (d) => {
    celular.ate = performance.now() + 400;
    celular.v = +d.v || 0; celular.g = +d.g || 0; celular.f = +d.f || 0; celular.ers = !!d.ers; celular.olhar = !!d.olhar;
  });
  sock.on("acao", acao);
  setInterval(painel, 100);
  botao();
}
function mudou(e) {
  const antes = est.celulares; est = { ...est, ...e };
  if (est.celulares > antes) toast("📱 Celular conectado: ele é o seu controle", 2600);
  pintarJanela(); pintarBotao();
}

const ACOES = {
  box: () => teclaBox(),
  mfd: () => $("bMfd")?.click(),
  radio: () => comecarVoz(),
  camera: () => nextCam(),
  voltar: () => respawn(),
  "marcha+": () => trocarMarcha(1),
  "marcha-": () => trocarMarcha(-1),
};
function acao(a) { if (race && ACOES[a]) { try { ACOES[a](); } catch (e) { console.warn("Controle no celular:", a, e); } } }

// o painel do celular (o mesmo que o HUD mostra)
function painel() {
  if (!sock || !sock.connected || !est.celulares) return;
  const m = me(), S = E.S;
  if (!race || !m || !S) { sock.volatile.emit("painel", { ativo: false }); return; }
  const c = race.vis || race.car || {}, lista = standings(), pos = lista.findIndex((p) => p.id === m.id) + 1, eq = window.EQUIPES_F1?.[m.equipe];
  sock.volatile.emit("painel", {
    ativo: true, m: race.marcha || c.marcha || 0, kmh: Math.round(Math.abs(c.v || 0) * 0.75), rpm: race.rpm || 0,
    volta: Math.min((m.laps || 0) + 1, S.config.voltas || 99), voltas: S.config.voltas || 0, pos, total: lista.length,
    ers: race.ers ? Math.round(race.ers.carga * 100) : null, ersAtivo: !!race.ersAtivo,
    pneu: race.pneu ? race.pneu.composto : null, vida: race.pneu ? Math.max(0, Math.round((1 - (race.pneu.desgaste || 0)) * 100)) : null,
    box: !!race.box?.fase, cor: eq?.cor || m.color || "#e10600", manual: S.config.cambio === "manual",
  });
}

// ---------- o botão do menu e a janela do endereço ----------

function botao() {
  bt = document.createElement("button"); bt.type = "button"; bt.id = "bCelular";
  bt.style.cssText = "position:fixed;right:8px;bottom:40px;z-index:99998;padding:6px 11px;border:0;border-radius:6px;font:600 12px system-ui,sans-serif;color:#fff;background:#1d2330e6;cursor:pointer;box-shadow:0 4px 14px #0006";
  bt.onclick = abrirJanela;
  const mostrar = () => { const home = document.getElementById("home"); bt.hidden = !home || home.classList.contains("hidden"); };
  const pronto = () => { document.body.appendChild(bt); pintarBotao(); mostrar(); new MutationObserver(mostrar).observe(document.getElementById("home") || document.body, { attributes: true, attributeFilter: ["class"] }); };
  if (document.body) pronto(); else addEventListener("DOMContentLoaded", pronto);
}
function pintarBotao() { if (bt) bt.textContent = est.celulares ? `📱 Celular conectado (${est.celulares})` : "📱 Controle no celular"; }
function abrirJanela() {
  if (!janela) {
    janela = document.createElement("div");
    janela.style.cssText = "position:fixed;inset:0;z-index:100001;display:grid;place-items:center;background:#000b;font:500 15px/1.45 system-ui,sans-serif;color:#eef1f6";
    janela.addEventListener("click", (e) => { if (e.target === janela || e.target.hasAttribute("data-fechar")) { janela.remove(); janela = null; } });
    document.body.appendChild(janela);
  }
  pintarJanela();
  sock.emit("abrir", null, (e) => { if (e) mudou(e); });
}
function pintarJanela() {
  if (!janela) return;
  const end = est.enderecos || [], esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  janela.innerHTML = `<div role="dialog" aria-label="Controle no celular" style="max-width:520px;margin:16px;padding:22px 24px;background:#11141c;border-top:4px solid #e10600;border-radius:10px;box-shadow:0 10px 40px #000a">
    <b style="font-size:20px">📱 Controle no celular</b>
    <p style="margin:10px 0 6px">O celular e este PC na <b>mesma rede Wi-Fi</b> (sem internet também vale: o PC pode entrar no hotspot do iPhone). No Safari do celular, digite:</p>
    ${!est.ligado ? `<p style="opacity:.7">Abrindo o controle… (o Windows pode perguntar se o programa pode usar a rede: permita nas redes privadas)</p>` : end.length ? end.map((u, i) => `<p style="margin:6px 0;font:700 ${i ? 17 : 24}px ui-monospace,Consolas,monospace;color:${i ? "#9aa4b5" : "#fff"};user-select:all">${esc(u)}</p>`).join("") : `<p style="color:#ff8a80">O PC não está em nenhuma rede. Ligue o Wi-Fi.</p>`}
    <ol style="margin:12px 0 0;padding-left:20px;color:#c9d1dd;font-size:14px">
      <li>Na primeira vez o Safari avisa "Esta conexão não é privada": toque em <b>Mostrar Detalhes</b> e em <b>visitar este site</b> (o certificado é deste PC).</li>
      <li>Vire o celular de lado, toque em <b>Começar</b> e permita o movimento: o celular vira o volante. <b>CAL</b> zera o centro.</li>
      <li>Dica: no Safari, Compartilhar → <b>Adicionar à Tela de Início</b>, e ele abre como um app, em tela cheia.</li>
    </ol>
    <p style="margin:14px 0 0;font-weight:700;color:${est.celulares ? "#7fe08a" : "#9aa4b5"}">${est.celulares ? `Conectado: ${est.celulares} celular${est.celulares > 1 ? "es" : ""}` : "Esperando o celular…"}</p>
    <button type="button" data-fechar style="margin-top:14px;padding:10px 16px;border:0;border-radius:6px;font:700 14px system-ui,sans-serif;background:#ffffff22;color:#fff;cursor:pointer">Fechar</button></div>`;
}
