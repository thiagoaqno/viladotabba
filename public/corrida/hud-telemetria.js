// Escolha pessoal e mostrador alternativo inspirado na visão de transmissão.
import { store } from "./estado.js";
import * as THREE from "three";
import { numeroSuave, pulsar } from "./hud-vivo.js";
const CHAVE = "corrida:hud-estilo";
// os estilos (Configurações > Geral): "classico" é o da transmissão da F1 (o novo: torre, setores e o mostrador) e "telemetria" o
// mostrador alternativo
// "compacto": o do novo, mas com o painel pequeno do canto (bateria e velocidade: hud-painel.js, #hDentro) em qualquer câmera
export const ESTILOS_HUD = [["classico", "Novo (F1)"], ["compacto", "Compacto"], ["telemetria", "Telemetria"], ["tv", "Transmissão (TV)"]]; // ("tv": hud-tv.js, a torre e a caixa de marcha da transmissão do jogo da F1) // (o "antigo", os painéis de antes do estilo F1, saiu: pedido do Thiago, 2026-11-11)
let estilo = "classico";
try { const v = store.get(CHAVE); if (ESTILOS_HUD.some(([k]) => k === v)) estilo = v; } catch (_) {}
export const estiloHud = () => estilo;
export function definirEstiloHud(valor) {
  estilo = ESTILOS_HUD.some(([k]) => k === valor) ? valor : "classico";
  try { store.set(CHAVE, estilo); } catch (_) {}
  document.getElementById("race")?.classList.toggle("hud-telemetria", estilo === "telemetria");
  document.getElementById("race")?.classList.toggle("hud-tv", estilo === "tv");
  window.dispatchEvent(new Event("hud:estilo"));
}
export function htmlHudTelemetria() { return `<div class="hud-tele" aria-label="Velocidade, marcha, bateria, freio e acelerador">
  <svg class="hud-tele-moldura" viewBox="0 0 600 210" preserveAspectRatio="none" aria-hidden="true"><path d="M38 92 L197 25 Q300 -18 403 25 L562 92"/><path d="M42 112 L183 166 M558 112 L417 166"/></svg>
  <div class="hud-tele-lado esquerdo"><div class="hud-tele-conjunto"><div class="hud-tele-barras freio"><i data-hud-freio></i></div><span class="hud-tele-ers">RECARGA</span></div><small>FREIO · BATERIA <b data-hud-bat>65%</b></small></div>
  <div class="hud-tele-centro"><small>KM/H</small><strong data-hud-vel>0</strong><span data-hud-modo>BALANCED</span><span class="hud-tele-modos"><em data-hud-boost>BOOST</em><em data-hud-over>OVERTAKE</em></span><strong class="hud-tele-mph" data-hud-mph>0</strong><small>MPH</small></div>
  <div class="hud-tele-lado direito"><div class="hud-tele-conjunto"><span class="hud-tele-ers">ERS</span><div class="hud-tele-barras acel"><i data-hud-acel></i></div></div><small>ACELERADOR · <b data-hud-drs>DRS</b></small></div>
  <div class="hud-tele-cambio"><div><small>MARCHAS</small><span class="hud-tele-marchas">${[1,2,3,4,5,6,7,8].map(n => `<b data-marcha="${n}">${n}</b>`).join("")}</span><strong data-hud-marcha>N</strong></div><div class="hud-tele-rpm"><i data-hud-rpm></i></div><small>ROTAÇÃO</small></div>
  </div>`; }
const lim = v => Math.max(0, Math.min(1, Number(v) || 0));
export function atualizarHudTelemetria(raiz, v) {
  if (!raiz) return;
  const texto = (id, valor) => { const e = raiz.querySelector(`[data-hud-${id}]`); if (e && e.textContent !== String(valor)) e.textContent = String(valor); };
  const barra = (id, valor, vertical = false) => { const e = raiz.querySelector(`[data-hud-${id}]`); if (e) e.style[vertical ? "height" : "width"] = Math.round(lim(valor) * 100) + "%"; };
  // (2026-11-23) os números correm suaves; a marcha nova dá um "pop"; BOOST (o elétrico entregando) e OVERTAKE (a 1,5 s do da frente) acendem;
  // a rotação muda de cor perto do corte e pisca nele; o freio forte brilha
  const q = (id) => raiz.querySelector(`[data-hud-${id}]`);
  numeroSuave(q("vel"), Number(v.kmh) || 0); numeroSuave(q("mph"), Math.round((Number(v.kmh) || 0) * 0.621371));
  { const e = q("marcha"); if (e && e.textContent !== String(v.marcha)) { e.textContent = String(v.marcha); pulsar(e); } }
  q("boost")?.classList.toggle("on", !!v.boost); { const o = q("over"); if (o) { o.classList.toggle("on", v.over === "on"); o.classList.toggle("pronto", v.over === "pronto"); } }
  { const r = q("rpm")?.parentElement; if (r) { r.classList.toggle("alto", lim(v.rpm) > 0.85); r.classList.toggle("corte", lim(v.rpm) > 0.97); } }
  q("freio")?.parentElement?.classList.toggle("forte", lim(v.freio) > 0.8); q("acel")?.parentElement?.classList.toggle("cheio", lim(v.acel) > 0.98);
  raiz.querySelector(".hud-tele-centro")?.classList.toggle("boost", !!v.boost); texto("modo", v.modo); texto("bat", Math.round(lim(v.bateria) * 100) + "%"); texto("drs", v.drs ? "DRS ABERTO" : "DRS");
  raiz.querySelectorAll("[data-marcha]").forEach(e => e.classList.toggle("atual", String(v.marcha) === e.dataset.marcha));
  barra("acel", v.acel, true); barra("freio", v.freio, true); barra("rpm", v.rpm);
}

// Acompanha a projeção do halo nas câmeras do piloto. A geometria pertence ao modelo,
// portanto a mesma conta serve à prévia e à corrida, inclusive com ajustes de câmera.
const centro = new THREE.Vector3(), esquerda = new THREE.Vector3(), direita = new THREE.Vector3();
export function posicionarHudNoHalo(el, kart, camera, modo, area) {
  if (el) el.style.visibility = estilo === "classico" && modo === "cockpit" ? "hidden" : ""; // na primeira pessoa, o volante já mostra marcha e velocidade: o velocímetro clássico some (na T-cam, "onboard", fica)
  const ref = kart?.kt?.modelo?.dados?.haloReferencia, carro = kart?.kt?.carro;
  if (!el || !area || !ref || !carro || estilo !== "telemetria" || (modo !== "cockpit" && modo !== "onboard")) { el?.classList.remove("ancorado"); return; }
  const w = area.clientWidth, h = area.clientHeight; if (!w || !h) { el.classList.remove("ancorado"); return; }
  carro.updateWorldMatrix(true, false); camera.updateMatrixWorld();
  const projetar = (v, x, y, z) => v.set(x, y, z).applyMatrix4(carro.matrixWorld).project(camera);
  projetar(centro, 0, 0.765, ref.z);
  projetar(esquerda, -0.20, 0.725, ref.z + 0.14); projetar(direita, 0.20, 0.725, ref.z + 0.14);
  if (![centro.x, centro.y, centro.z, esquerda.x, direita.x].every(Number.isFinite) || centro.z < -1 || centro.z > 1) { el.classList.remove("ancorado"); return; }
  const largura = Math.abs(direita.x - esquerda.x) * w * 0.5;
  const escalaMax = Math.min(1.20, w * 0.90 / 600);
  const escala = Math.min(escalaMax, Math.max(0.55, largura * 1.35 / 600));
  const x = Math.max(40, Math.min(w - 40, (centro.x + 1) * w * 0.5));
  const y = Math.max(0, Math.min(h - 95 * escala, (1 - centro.y) * h * 0.5 - 83 * escala));
  el.style.setProperty("--hud-x", x.toFixed(1) + "px"); el.style.setProperty("--hud-y", y.toFixed(1) + "px"); el.style.setProperty("--hud-escala", escala.toFixed(3));
  el.classList.add("ancorado");
}
