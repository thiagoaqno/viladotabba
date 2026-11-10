// Corrida da Galera — o ACERTO DO CARRO (painel P, acerto.js): a asa (downforce) e a altura do carro, UM POR PISTA. A suspensão baixa com
// a velocidade (a asa empurra o carro para o chão) e nas compressões, e se a altura for menor que o quanto ele afunda, o assoalho raspa e
// solta faísca (carros.js, poseKart). Na FÍSICA (sim.js, extraDoAcerto): mais asa, mais carga (aderência na curva) e mais arrasto (menos
// velocidade na reta); raspando, perde carga e ganha arrasto. O acerto vai ao servidor com as entradas (fisica.js).
// Valores de 0 a 1, guardados por pista em "corrida:acerto-carro:<pista>"; a pista sem acerto guardado começa no padrão (tudo no meio).
// `ACERTO_CARRO` é o da pista da corrida (`usarPista`, chamado na largada por jogo.js): o painel, o desenho e a física leem dele.
const CHAVE = (id) => `corrida:acerto-carro:${id}`;
export const ACERTO_CARRO_PADRAO = { asa: 0.5, altura: 0.5 };
export const ACERTO_CARRO = { ...ACERTO_CARRO_PADRAO };
let pista = null;
const limpo = (s) => { const a = { ...ACERTO_CARRO_PADRAO }; if (s) for (const k of Object.keys(a)) if (Number.isFinite(s[k])) a[k] = Math.max(0, Math.min(1, s[k])); return a; };
export function acertoGuardado(id) { try { const s = localStorage.getItem(CHAVE(id)); return s ? limpo(JSON.parse(s)) : null; } catch { return null; } }
export function usarPista(id) { pista = id; Object.assign(ACERTO_CARRO, acertoGuardado(id) || ACERTO_CARRO_PADRAO); return ACERTO_CARRO; }
export const pistaDoAcerto = () => pista;
const guardar = () => { if (!pista) return; try { localStorage.setItem(CHAVE(pista), JSON.stringify(ACERTO_CARRO)); } catch {} };
export function acertarCarro(k, v) { if (k in ACERTO_CARRO) { ACERTO_CARRO[k] = Math.max(0, Math.min(1, Number(v))); guardar(); } }
export function usarAcerto(a) { Object.assign(ACERTO_CARRO, limpo(a)); guardar(); }
export function acertoCarroPadrao() { Object.assign(ACERTO_CARRO, ACERTO_CARRO_PADRAO); guardar(); }
// A conta da suspensão, em metros (o carro desenha em unidades: × KS). Ordem de grandeza de um F1 (a prancha fica a uns 3 a 7 cm do chão
// parado e baixa uns centímetros no fim da reta); não são medidas de um carro de verdade, e o painel é para acertar jogando.
//   altura parada: 2,5 a 7,5 cm (altura 0 a 1) · o quanto afunda: 4,5 cm × força da asa (0,8 a 1,2) × (v / 400 u/s)², mais as compressões
// (a conta é a de sim.js, a mesma que a física usa no servidor e na previsão)
export const alturaParada = (a) => window.Sim.alturaParada(a);
export const forcaDaAsa = (a) => window.Sim.forcaDaAsa(a);
export const afundaAero = (a, v) => window.Sim.afundaAero(a, v);

// ---------- as sugestões do engenheiro e do estrategista ----------
// O MELHOR acerto de cada pista é medido por ferramentas/acerto-ideal.js (uma volta calculada com a física do jogo, 21 × 21 acertos) e fica
// em acerto-ideal.json. O ESTRATEGISTA (o nível vem da carreira: S.estrategistas[equipe], 0 base, 1 experiente, 2 elite; fora da carreira,
// o experiente) sugere esse melhor; o de base erra um pouco (o mesmo erro para a mesma pista). O ENGENHEIRO propõe um acerto seguro: a asa
// arredondada para pouca, média ou muita, e a altura 0,15 acima da melhor, para não raspar.
let ideais = null;
export function carregarIdeais() { if (!ideais) ideais = fetch("/corrida/acerto-ideal.json").then((r) => (r.ok ? r.json() : {})).catch(() => ({})); return ideais; }
const ERRO_BASE = 0.2;
const desvio = (id, k) => { let h = 2166136261; for (const c of `${id}:${k}`) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (((h >>> 0) % 1000) / 1000) * 2 - 1; };
export function sugestaoDoEstrategista(ideal, id, nivel) {
  if (!ideal) return null;
  if (nivel >= 1) return limpo(ideal);
  return limpo({ asa: ideal.asa + desvio(id, "asa") * ERRO_BASE, altura: ideal.altura + desvio(id, "altura") * ERRO_BASE });
}
export function propostaDoEngenheiro(ideal) {
  if (!ideal) return null;
  return limpo({ asa: ideal.asa < 0.34 ? 0.2 : ideal.asa > 0.66 ? 0.8 : 0.5, altura: ideal.altura + 0.15 });
}
// a frase de cada um sobre um acerto, em palavras
export function frase(a) {
  const asa = a.asa <= 0.3 ? "pouca asa: a reta manda aqui" : a.asa >= 0.7 ? "muita asa: aqui a curva manda" : "asa no meio: a pista mistura reta e curva";
  return `${asa}; altura ${(alturaParada(a) * 100).toFixed(1).replace(".", ",")} cm.`;
}
