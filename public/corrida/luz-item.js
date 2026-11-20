// Corrida da Galera — a LUZ de um item do cenário ou de uma peça da pista (2026-11-20, o Thiago: "no TabbaTracks eu consiga colocar leds de
// cores diferentes e bloom em objetos específicos"). O item guarda { luz: { cor, forca, alvo? } }:
//   cor   = a cor acesa (o LED);
//   forca = o brilho, de 1 a 6: é o ganho do bloom (pos.js, `preparar`: userData.bloom), o mesmo caminho do neon e das lâmpadas do jogo.
//           Na qualidade Baixa (sem pós) fica só a cor acesa, sem o halo;
//   alvo  = qual material da peça acende (a ordem de materiaisDe: a lâmpada e não o poste); sem alvo, a peça inteira.
// O material aceso é um MeshBasicMaterial sem sombra e sem tom (toneMapped false): não depende do sol nem dos postes, brilha igual de dia e de noite.
import * as THREE from "three";
import { materiaisDe } from "./acabamentos.js";

export const CORES_LED = ["#ff1a1a", "#ff7a00", "#ffd400", "#2bff4a", "#00e5ff", "#1a5cff", "#b02bff", "#ff2bd6", "#ffffff"];
export const FORCA_PADRAO = 3;

const cache = new Map();
function materialAceso(cor, forca, lado) {
  const k = cor + "|" + forca + "|" + lado;
  if (!cache.has(k)) { const m = new THREE.MeshBasicMaterial({ color: cor, toneMapped: false, side: lado }); m.userData.bloom = forca; m.name = "LED"; cache.set(k, m); }
  return cache.get(k);
}
// põe (ou tira, com luz nula) a luz numa peça ou item; vale por cima do acabamento (guarda o material de antes em userData.matSemLuz)
export function aplicarLuz(o, luz) {
  if (!o) return;
  const mats = materiaisDe(o);
  o.traverse((m) => {
    if (!m.isMesh) return;
    if (m.userData.matSemLuz) { m.material = m.userData.matSemLuz; delete m.userData.matSemLuz; }
    if (!luz || !luz.cor) return;
    const orig = m.material, lista = [].concat(orig);
    const troca = lista.map((mat) => (luz.alvo != null && luz.alvo !== "" ? mats.indexOf(m.userData.matOriginal ? [].concat(m.userData.matOriginal)[lista.indexOf(mat)] : mat) === +luz.alvo : true));
    if (!troca.some(Boolean)) return;
    const forca = Math.max(1, Math.min(6, +luz.forca || FORCA_PADRAO));
    m.userData.matSemLuz = orig;
    m.material = Array.isArray(orig) ? lista.map((mat, i) => (troca[i] ? materialAceso(luz.cor, forca, mat.side) : mat)) : materialAceso(luz.cor, forca, orig.side);
    m.castShadow = false;
  });
}
