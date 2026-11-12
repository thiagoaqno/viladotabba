// Hungaroring (GP da Hungria, em Mogyoród, perto de Budapeste) — o cenário próprio da pista (nada daqui é do kit compartilhado de GP simples): o que só ela tem, em ./kit/hungaroring/
// (o chão junto da pista com a base sólida, o prédio dos boxes, os morros secos da bacia, os bosquetes e os letreiros). Configuração em gps/hungaroring.js. Estrutura copiada de ./spa.js.
// O que as descrições em texto do circuito dizem (não achei fotos que eu pudesse abrir): bacia natural no vale, a pista toda visível de quase qualquer ponto, solo arenoso e poeirento,
// a reta dos boxes de 908 m, o prédio dos boxes e a tribuna principal reconstruídos (a tribuna principal é a única coberta), arquibancadas fora da curva 1 (entre a saída dos boxes e a curva 1)
// e na curva 4, morros de arquibancada livre entre as curvas 9 e 14.
import * as THREE from "three";
import { M } from "../cena.js";
import { ocupado, recortar } from "./kit/comum.js";
import { tribunaCoberta } from "./kit/coberturas.js";
import { registrarMarcasHungaroring } from "./kit/hungaroring/marcas.js";
import { predioDosBoxes } from "./kit/hungaroring/predios.js";
import { beiradaSolida } from "./kit/hungaroring/chao.js";
import { colinas, bosquetes, matoDeLonge } from "./kit/hungaroring/paisagem.js";

registrarMarcasHungaroring();

export const CAMISAS_HU = ["#ce2939", "#ffffff", "#477050", "#f4f4f2", "#1d4f9a", "#ffd23f", "#1b1b1b"]; // a bandeira (vermelho, branco e verde) e o azul de equipe

const indice = (tr, f) => ((Math.floor(f * tr.n) % tr.n) + tr.n) % tr.n;
function pousar(tr, g, f, lado, lat, ao = 0) {
  const p = tr.pts[indice(tr, f)], x = p.x + p.nx * lado * lat + p.tx * ao, z = p.y + p.ny * lado * lat + p.ty * ao, ry = Math.atan2(-lado * p.nx, -lado * p.ny);
  g.position.set(x, tr.chao(x, z) - 1, z); g.rotation.y = ry;
  return { x, z, ry, p };
}
const mundo = (x, z, ry, u, v) => [x + Math.cos(ry) * u - Math.sin(ry) * v, z - Math.sin(ry) * u - Math.cos(ry) * v];
function cabe(tr, x, z, ry, w, d, folga = 24) {
  for (const u of [-w / 2, 0, w / 2]) for (const v of [0, d / 2, d]) {
    const [px, pz] = mundo(x, z, ry, u, v);
    if (tr.distAt(px, pz) < tr.W / 2 + folga || ocupado(tr, px, pz)) return false;
  }
  return true;
}
function reservar(tr, x, z, ry, w, d, folga = 22) {
  const r = d / 2 + folga, passo = Math.max(20, d * 0.7);
  for (let u = -w / 2; u <= w / 2 + 0.1; u += passo) { const [px, pz] = mundo(x, z, ry, u, d / 2); tr.reservado.push([px, pz, r]); }
}
// o aterro de terra sob a peça: o chão desce para longe da pista e a peça não pode ficar flutuando
function aterro(g, w, d, fundo = 130) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(w + 4, fundo, d + 4), M(0x8c8148, { roughness: 1 })); b.position.set(0, -fundo / 2 - 0.4, -d / 2); g.add(b); return b;
}
function colocar(tr, add, g, { nome = g.name, f, lado, lats, ao = 0, w, d, folga = 24, ambos = false, base = true, reserva = 22 }) {
  for (const l of ambos ? [lado, -lado] : [lado]) for (const lat of lats) {
    const p = tr.pts[indice(tr, f)], x = p.x + p.nx * l * lat + p.tx * ao, z = p.y + p.ny * l * lat + p.ty * ao, ry = Math.atan2(-l * p.nx, -l * p.ny);
    if (!cabe(tr, x, z, ry, w, d, folga)) continue;
    pousar(tr, g, f, l, lat, ao); if (base) aterro(g, w, d); add(g); if (reserva !== null) reservar(tr, x, z, ry, w, d, reserva);
    (tr.pecasHU ||= []).push({ nome, f: +f.toFixed(4), ao, lado: l, lat: Math.round(lat), x: Math.round(x), z: Math.round(z), ry, w, d });
    return { x, z, ry, w, d, lado: l, lat };
  }
  (tr.faltouHU ||= []).push({ nome, f });
  return null;
}
const somDaTorcida = (tr, f0, f1) => (tr.arquibancadas ||= []).push([indice(tr, f0), indice(tr, f1)]);

// A reta dos boxes: o prédio das garagens com a torre de controle, e do outro lado a tribuna principal coberta
function retaDosBoxes(tr, { add }) {
  const { n, W } = tr, lado = tr.t.boxes?.lado ?? 1, Z = W / 2 + 84, F = 46;
  const rec = recortar(tr, Math.floor(0.958 * n), Math.floor(1.016 * n), [lado * (Z - 4), lado * (Z + F + 4)], 4);
  if (rec) {
    const comp = Math.min(660, (rec.i1 - rec.i0) * 6 - 24), meio = Math.floor((rec.i0 + rec.i1) / 2);
    const linha = ((n - meio) * 6) * (lado > 0 ? -1 : 1);
    const predio = predioDosBoxes({ comprimento: comp, fundo: F, torre: Math.max(-comp / 2 + 90, Math.min(comp / 2 - 90, linha)) });
    const q = pousar(tr, predio, (meio % n) / n, lado, Z); add(predio);
    reservar(tr, q.x, q.z, q.ry, comp, F + 30, 40);
    tr.predioHU = { f: meio / n, comprimento: comp, lado };
  }
  const oposto = -lado, mods = [], E = tr.escala ?? 1;
  for (const [ao, sem] of [[-190, 3], [100, 8]]) {
    const t = tribunaCoberta({
      comprimento: 270, degraus: Math.round(12 / E), altura: 5.4 * E, fundo: 8.2 * E, secoes: 7, publico: 0.6, semente: sem, alcance: 0.7, folga: 18, vao: 56, camisas: CAMISAS_HU,
      cores: ["#1d4f9a", "#f4f4f2", "#1d4f9a", "#ce2939", "#f4f4f2", "#477050", "#1d4f9a"], cobertura: "#f4f4f2", estrutura: "#8a9096",
    });
    const o = colocar(tr, add, t, { f: 0.998, lado: oposto, lats: [W / 2 + 46, W / 2 + 70], ao, w: 274, d: 12 * 8.2 + 8, folga: 30, reserva: null });
    if (o) mods.push(o);
  }
  for (const o of mods) reservar(tr, o.x, o.z, o.ry, o.w, o.d, 22);
  if (mods.length) somDaTorcida(tr, 0.972, 1.024);
}

export function cenarioHungaroring(tr, ctx) {
  tr.reservado ||= [];
  tr.camisasGP = CAMISAS_HU;
  beiradaSolida(tr, ctx.add); // a base sólida da pista e a grama no nível do asfalto, dos dois lados (kit/hungaroring/chao.js)
  retaDosBoxes(tr, ctx);
}

export function depoisHungaroring(tr, ctx) {
  const { add } = ctx;
  const rel = colinas(tr, add, {});
  bosquetes(tr, add, { recuo: 130, fundo: 420, alturas: [75, 125], chance: 0.5, semente: 4242 });
  matoDeLonge(tr, add, rel, {});
}
