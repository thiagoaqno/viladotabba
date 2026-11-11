// Corrida da Galera — o MIXER de som: um painel com o volume de cada tipo de som (sons.js, Sound.mixer: o motor, os efeitos, o ambiente,
// o rádio do engenheiro e o narrador), o volume geral (Sound.volume) e a música (o tocador da carreira, window.MusicaCarreira).
// Abre pelos botões [data-mixer] (no menu da corrida e nos ajustes do menu inicial). Tudo fica guardado no navegador e vale na hora.
import { Sound } from "./sons.js";

const CANAIS = [
  ["geral", "Volume geral", "tudo junto"],
  ["motor", "Motor", "o seu carro e os dos outros"],
  ["efeitos", "Efeitos", "batidas, zebra, pneu, assoalho raspando, ERS, box"],
  ["ambiente", "Ambiente", "torcida, chuva, vento e o som da pista"],
  ["radio", "Rádio do engenheiro", "a voz da equipe"],
  ["narrador", "Narrador", "a transmissão de TV"],
  ["musica", "Música", "o tocador de músicas"],
];
const ler = (k) => (k === "geral" ? Sound.nivel : k === "musica" ? window.MusicaCarreira?.nivel?.() ?? null : Sound.mixer()[k]);
function mudar(k, v) {
  if (k === "geral") { Sound.volume(v); for (const id of ["volume", "volCorrida"]) { const el = document.getElementById(id); if (el) el.value = Math.round(v * 100); } }
  else if (k === "musica") window.MusicaCarreira?.volume?.(v);
  else Sound.mixer(k, v);
}
let painel = null;
function montar() {
  painel = document.createElement("div");
  painel.id = "mixerPainel"; painel.setAttribute("role", "dialog"); painel.setAttribute("aria-label", "Mixer de som");
  painel.style.cssText = "position:fixed;top:12px;right:12px;z-index:96;width:min(340px,calc(100vw - 24px));max-height:calc(100vh - 24px);overflow:auto;padding:12px 14px;background:#0b0d13f2;border:1px solid #ffffff2a;border-top:3px solid #e10600;color:#fff;font:600 14px/1.3 'Barlow Condensed','Titillium Web',system-ui,sans-serif;box-shadow:0 8px 30px #0008";
  painel.innerHTML = `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><b style="flex:1;font-size:18px;letter-spacing:.06em;text-transform:uppercase">Mixer de som</b><button type="button" data-fechar aria-label="Fechar" style="background:none;border:1px solid #ffffff33;color:#fff;width:28px;height:28px;cursor:pointer">✕</button></div>
    ${CANAIS.map(([k, nome, dica]) => `<label data-linha="${k}" style="display:block;margin:10px 0 2px"><span style="display:flex;justify-content:space-between"><b>${nome}</b><output data-v="${k}"></output></span>
      <input type="range" min="0" max="100" step="1" data-c="${k}" style="width:100%;accent-color:#e10600"><small style="color:#ffffff90;font-weight:500">${dica}</small></label>`).join("")}
    <small style="display:block;margin-top:8px;color:#ffffff90;font-weight:500">Fica guardado neste navegador.</small>`;
  painel.style.display = "none"; // (nasce fechado: o primeiro clique abre)
  document.body.appendChild(painel);
  painel.addEventListener("input", (e) => { const k = e.target.dataset.c; if (k) { mudar(k, e.target.value / 100); atualizar(); } });
  painel.addEventListener("keydown", (e) => e.stopPropagation()); // (as setas nos deslizantes não pilotam)
  painel.addEventListener("click", (e) => { if (e.target.closest("[data-fechar]")) alternarMixer(false); });
}
function atualizar() {
  for (const [k] of CANAIS) {
    const v = ler(k), linha = painel.querySelector(`[data-linha="${k}"]`);
    linha.style.display = v == null ? "none" : ""; // (sem o tocador de música na página, a linha some)
    if (v == null) continue;
    painel.querySelector(`[data-c="${k}"]`).value = Math.round(v * 100); painel.querySelector(`[data-v="${k}"]`).textContent = Math.round(v * 100) + "%";
  }
}
export function alternarMixer(abrir) {
  if (!painel) montar();
  const ver = abrir ?? painel.style.display === "none";
  painel.style.display = ver ? "" : "none";
  if (ver) atualizar();
}
document.addEventListener("click", (e) => { if (e.target.closest?.("[data-mixer]")) { e.preventDefault(); alternarMixer(); } });
