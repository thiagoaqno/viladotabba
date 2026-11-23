// Corrida da Galera — o HUD mais vivo e no lugar que cada um quiser (2026-11-23, o Thiago: "tem que add a opção de poder mudar a posição dos
// elementos do HUD (especial o velocímetro e afins)" e "melhorar as animações do velocímetro e afins e aperfeiçoar o da telemetria").
//  - numeroSuave(el, v): o número corre até o valor a cada quadro (o HUD atualiza ~10x por segundo; antes a velocidade pulava de 10 em 10).
//  - pulsar(el): um "pop" de uma vez (a troca de marcha).
//  - editarHud(): o modo de mover o HUD (MFD > Ajustes > Posição do HUD): cada bloco ganha um contorno e o nome, arrasta com o mouse ou o dedo e a
//    posição fica guardada (corrida:hud-pos); "Restaurar" volta tudo ao lugar de fábrica. A posição é um `translate` por cima do lugar de sempre,
//    então vale para todos os estilos do HUD e não briga com a telemetria presa ao halo (que usa `transform`).
import { store } from "./estado.js";

const reduz = () => !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

// ---------- os números suaves ----------
const alvos = new Map();
let raf = 0, ant = 0;
function quadro(t) {
  raf = 0; const dt = Math.min(0.1, (t - (ant || t)) / 1000); ant = t; let vivo = false;
  for (const [el, a] of alvos) {
    if (!el.isConnected) { alvos.delete(el); continue; }
    const d = a.alvo - a.atual;
    if (Math.abs(d) < 0.5) a.atual = a.alvo; else { a.atual += d * (1 - Math.exp(-dt / 0.07)); vivo = true; }
    const txt = String(Math.round(a.atual)); if (el.textContent !== txt) el.textContent = txt;
  }
  if (vivo) raf = requestAnimationFrame(quadro); else ant = 0;
}
export function numeroSuave(el, v) {
  if (!el) return; const n = Number(v);
  if (!Number.isFinite(n) || reduz()) { alvos.delete(el); const s = String(v); if (el.textContent !== s) el.textContent = s; return; }
  let a = alvos.get(el); if (!a) { a = { alvo: n, atual: Number(el.textContent) || n }; alvos.set(el, a); }
  a.alvo = n; if (!raf) raf = requestAnimationFrame(quadro);
}
export function pulsar(el, cls = "hv-pop") { if (!el || reduz()) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
document.addEventListener("animationend", (e) => { if (e.animationName === "hvPop") e.target.classList.remove("hv-pop"); });

// ---------- mover o HUD ----------
const ALVOS = [["hCentro", "Velocímetro"], ["hDentro", "Painel compacto"], ["hTempo", "Tempos e setores"], ["hTorre", "Torre"], [".hud.bl", "Mapa"], ["hMfd", "MFD"], ["hClima", "Clima"], ["hRadioEng", "Rádio"]];
const CHAVE = "corrida:hud-pos";
let pos = {}; try { pos = store.get(CHAVE) || {}; } catch (_) { pos = {}; }
const elDe = (sel) => (sel.startsWith(".") ? document.querySelector("#race " + sel) : document.getElementById(sel));
const selDe = (el) => ALVOS.find(([s]) => elDe(s) === el)?.[0];
function aplicar(sel) {
  const el = elDe(sel); if (!el) return;
  const p = pos[sel], tr = p ? `${Math.round(p[0])}px ${Math.round(p[1])}px` : "";
  el.style.translate = tr;
  if (sel === "hTorre") { const av = document.getElementById("avisosF1"); if (av) av.style.translate = tr; } // (o card dos avisos mora em cima da torre: vai junto)
}
export function aplicarPosicoes() { for (const [s] of ALVOS) aplicar(s); }

let editando = false, barra = null, arrasto = null;
export const editandoHud = () => editando;
export function editarHud(on = !editando) {
  editando = !!on; const r = document.getElementById("race"); if (!r) return;
  r.classList.toggle("hud-editar", editando);
  for (const [s, nome] of ALVOS) { const el = elDe(s); if (el) { if (editando) el.dataset.hudNome = nome; else delete el.dataset.hudNome; } }
  if (editando && !barra) {
    barra = document.createElement("div"); barra.className = "hv-barra"; barra.setAttribute("role", "toolbar");
    barra.innerHTML = '<span>Arraste os elementos do HUD</span><button type="button" data-hv="restaurar">Restaurar</button><button type="button" data-hv="pronto" class="hv-ok">Pronto</button>';
    barra.addEventListener("click", (e) => { const b = e.target.closest("[data-hv]"); if (!b) return; if (b.dataset.hv === "restaurar") { pos = {}; salvar(); aplicarPosicoes(); } else editarHud(false); });
    r.appendChild(barra);
  } else if (!editando && barra) { barra.remove(); barra = null; }
}
function salvar() { try { store.set(CHAVE, pos); } catch (_) {} }
document.addEventListener("pointerdown", (e) => {
  if (!editando || e.button !== 0 || e.target.closest(".hv-barra")) return;
  const el = e.target.closest("[data-hud-nome]"), sel = el && selDe(el); if (!sel) return;
  e.preventDefault(); e.stopPropagation();
  const p = pos[sel] || [0, 0];
  arrasto = { el, sel, x0: e.clientX, y0: e.clientY, dx0: p[0], dy0: p[1], r0: el.getBoundingClientRect() };
  el.classList.add("hv-arrasta"); el.setPointerCapture?.(e.pointerId);
}, true);
document.addEventListener("pointermove", (e) => {
  if (!arrasto) return;
  const a = arrasto, W = window.innerWidth, H = window.innerHeight;
  let mx = e.clientX - a.x0, my = e.clientY - a.y0;
  mx = Math.max(-a.r0.left, Math.min(W - a.r0.right, mx)); my = Math.max(-a.r0.top, Math.min(H - a.r0.bottom, my)); // (nunca sai da tela)
  pos[a.sel] = [a.dx0 + mx, a.dy0 + my]; aplicar(a.sel);
}, true);
const soltar = () => { if (!arrasto) return; arrasto.el.classList.remove("hv-arrasta"); arrasto = null; salvar(); };
document.addEventListener("pointerup", soltar, true); document.addEventListener("pointercancel", soltar, true);
document.addEventListener("keydown", (e) => { if (editando && e.key === "Escape") { e.preventDefault(); editarHud(false); } });
aplicarPosicoes();
window.addEventListener("hud:estilo", aplicarPosicoes);
