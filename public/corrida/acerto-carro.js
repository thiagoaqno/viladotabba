// Corrida da Galera — o ACERTO DO CARRO (painel P, acerto.js): a asa (downforce) e a altura do carro. Por enquanto é VISUAL: a suspensão
// baixa com a velocidade (a asa empurra o carro para o chão) e nas compressões, e se a altura escolhida for menor que o quanto ele afunda,
// o assoalho raspa e solta faísca (carros.js, poseKart). Na FÍSICA (sim.js, extraDoAcerto): mais asa, mais carga (aderência na curva) e
// mais arrasto (menos velocidade na reta); raspando, perde carga e ganha arrasto. O acerto vai ao servidor com as entradas (fisica.js).
// Valores de 0 a 1, guardados em "corrida:acerto-carro".
const CHAVE = "corrida:acerto-carro";
export const ACERTO_CARRO_PADRAO = { asa: 0.5, altura: 0.5 };
export const ACERTO_CARRO = { ...ACERTO_CARRO_PADRAO };
try { const s = JSON.parse(localStorage.getItem(CHAVE) || "null"); if (s) for (const k of Object.keys(ACERTO_CARRO)) if (Number.isFinite(s[k])) ACERTO_CARRO[k] = Math.max(0, Math.min(1, s[k])); } catch {}
const guardar = () => { try { localStorage.setItem(CHAVE, JSON.stringify(ACERTO_CARRO)); } catch {} };
export function acertarCarro(k, v) { if (k in ACERTO_CARRO) { ACERTO_CARRO[k] = Math.max(0, Math.min(1, Number(v))); guardar(); } }
export function acertoCarroPadrao() { Object.assign(ACERTO_CARRO, ACERTO_CARRO_PADRAO); guardar(); }
// A conta da suspensão, em metros (o carro desenha em unidades: × KS). Ordem de grandeza de um F1 (a prancha fica a uns 3 a 7 cm do chão
// parado e baixa uns centímetros no fim da reta); não são medidas de um carro de verdade, e o painel é para acertar jogando.
//   altura parada: 2,5 a 7,5 cm (altura 0 a 1) · o quanto afunda: 4,5 cm × força da asa (0,6 a 1,4) × (v / 400 u/s)², mais as compressões
// (a conta é a de sim.js, a mesma que a física usa no servidor e na previsão)
export const alturaParada = (a) => window.Sim.alturaParada(a);
export const forcaDaAsa = (a) => window.Sim.forcaDaAsa(a);
export const afundaAero = (a, v) => window.Sim.afundaAero(a, v);
