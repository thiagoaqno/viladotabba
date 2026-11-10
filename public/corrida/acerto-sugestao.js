// Corrida da Galera — o ACERTO DO CARRO guardado por pista e as sugestões do engenheiro e do estrategista, numa conta só para a corrida
// (acerto-carro.js e o painel P, acerto.js) e para a Central da carreira (temporada/central-acerto.js). Script comum (window.AcertoSugestao).
//  - guardado em "corrida:acerto-carro:<pista>", asa e altura de 0 a 1; a pista sem acerto guardado começa no padrão (tudo no meio);
//  - o MELHOR acerto de cada pista é medido por ferramentas/acerto-ideal.js (uma volta calculada com a física do jogo) em acerto-ideal.json;
//  - o ESTRATEGISTA (0 base, 1 experiente, 2 elite) sugere esse melhor; o de base erra um pouco (o mesmo erro para a mesma pista);
//  - o ENGENHEIRO propõe um acerto seguro: a asa arredondada para pouca, média ou muita, e a altura 0,15 acima da melhor, para não raspar.
// A altura parada e a força da asa são a MESMA conta de sim.js (alturaParada, forcaDaAsa), repetida aqui porque a Central não carrega a física.
(function (root) {
"use strict";
const PADRAO = Object.freeze({ asa: 0.5, altura: 0.5 });
const chave = (id) => `corrida:acerto-carro:${id}`;
const limpo = (s) => { const a = { ...PADRAO }; if (s) for (const k of Object.keys(a)) if (Number.isFinite(+s[k])) a[k] = Math.max(0, Math.min(1, +s[k])); return a; };
function lerGuardado(id) { try { const s = root.localStorage.getItem(chave(id)); return s ? limpo(JSON.parse(s)) : null; } catch { return null; } }
function guardar(id, a) { try { root.localStorage.setItem(chave(id), JSON.stringify(limpo(a))); } catch {} }
const alturaParada = (a) => 0.025 + a.altura * 0.05; // (sim.js)
const forcaDaAsa = (a) => 0.8 + a.asa * 0.4;         // (sim.js)
let ideais = null;
function carregarIdeais() { if (!ideais) ideais = fetch("/corrida/acerto-ideal.json").then((r) => (r.ok ? r.json() : {})).catch(() => ({})); return ideais; }
const ERRO_BASE = 0.2;
const desvio = (id, k) => { let h = 2166136261; for (const c of `${id}:${k}`) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (((h >>> 0) % 1000) / 1000) * 2 - 1; };
function sugestaoDoEstrategista(ideal, id, nivel) {
  if (!ideal) return null;
  if (nivel >= 1) return limpo(ideal);
  return limpo({ asa: ideal.asa + desvio(id, "asa") * ERRO_BASE, altura: ideal.altura + desvio(id, "altura") * ERRO_BASE });
}
function propostaDoEngenheiro(ideal) {
  if (!ideal) return null;
  return limpo({ asa: ideal.asa < 0.34 ? 0.2 : ideal.asa > 0.66 ? 0.8 : 0.5, altura: ideal.altura + 0.15 });
}
const cm = (a) => (alturaParada(a) * 100).toFixed(1).replace(".", ",") + " cm";
function frase(a) {
  const asa = a.asa <= 0.3 ? "pouca asa: a reta manda aqui" : a.asa >= 0.7 ? "muita asa: aqui a curva manda" : "asa no meio: a pista mistura reta e curva";
  return `${asa}; altura ${cm(a)}.`;
}
// o que o acerto faz, em palavras (a Central e o painel mostram junto dos deslizantes)
function efeito(a) {
  const f = forcaDaAsa(a), partes = [];
  partes.push(f >= 1.08 ? "firme nas curvas, mais lento na reta" : f <= 0.92 ? "rápido na reta, escorrega nas curvas" : "equilibrado entre reta e curva");
  partes.push(a.altura <= 0.25 ? "baixo: pode raspar no fim da reta" : a.altura >= 0.75 ? "alto: nunca raspa, perde um pouco de aderência" : "altura média");
  return partes.join(" · ");
}
// os números do acerto para a tela (a MESMA conta de sim.js, extraDoAcerto e afundaAero), no fim da reta (400 u/s, ~300 km/h) e numa curva
// média (150 u/s, ~110 km/h): a carga e o arrasto em % do padrão e a folga do assoalho em cm (negativa = raspando)
const afundaAero = (a, v) => 0.045 * forcaDaAsa(a) * Math.min(1.6, (Math.max(0, v) / 400) ** 2);
function extra(a, v) {
  const asa = forcaDaAsa(a), folga = alturaParada(a) - afundaAero(a, v), raspa = Math.max(0, -folga) / 0.01, solo = 1 + (0.05 - alturaParada(a)) * 2;
  return { carga: asa * solo * (1 - Math.min(0.35, raspa * 0.12)), arrasto: (1 + (asa - 1) * 1.6) * (1 + Math.min(0.5, raspa * 0.15)), folga };
}
// a velocidade em que o assoalho começa a raspar: onde o quanto o carro afunda (4,5 cm × força da asa × (v / 400 u/s)², até 1,6 ×) passa da
// altura parada. Em km/h como o painel do jogo mostra (u/s × 0,75, jogo.js); null = não raspa em nenhuma velocidade (o afundar para em 1,6 ×)
function raspaKmh(a) {
  const x = alturaParada(a) / (0.045 * forcaDaAsa(a));
  return x >= 1.6 ? null : Math.round(400 * Math.sqrt(x) * 0.75);
}
function numeros(a) {
  const curva = extra(a, 150), reta = extra(a, 400);
  return { carga: Math.round((curva.carga - 1) * 100), arrasto: Math.round((reta.arrasto - 1) * 100), folgaCm: Math.round(reta.folga * 1000) / 10, afundaCm: Math.round(afundaAero(a, 400) * 1000) / 10, raspaKmh: raspaKmh(a) };
}
const NIVEIS_ESTRATEGISTA = ["de base", "experiente", "de elite"];
root.AcertoSugestao = { PADRAO, chave, limpo, lerGuardado, guardar, alturaParada, forcaDaAsa, carregarIdeais, sugestaoDoEstrategista, propostaDoEngenheiro, frase, efeito, cm, afundaAero, numeros, raspaKmh, NIVEIS_ESTRATEGISTA };
})(typeof window !== "undefined" ? window : globalThis);
