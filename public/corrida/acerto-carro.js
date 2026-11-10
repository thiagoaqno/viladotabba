// Corrida da Galera — o ACERTO DO CARRO (painel P, acerto.js): a asa (downforce) e a altura do carro, UM POR PISTA. A suspensão baixa com
// a velocidade (a asa empurra o carro para o chão) e nas compressões, e se a altura for menor que o quanto ele afunda, o assoalho raspa e
// solta faísca (carros.js, poseKart). Na FÍSICA (sim.js, extraDoAcerto): mais asa, mais carga (aderência na curva) e mais arrasto (menos
// velocidade na reta); raspando, perde carga e ganha arrasto. O acerto vai ao servidor com as entradas (fisica.js).
// O guardado por pista e as sugestões do engenheiro e do estrategista são os de acerto-sugestao.js (window.AcertoSugestao), os mesmos da aba
// Acerto da carreira (temporada/central-acerto.js). `ACERTO_CARRO` é o da pista da corrida (`usarPista`, chamado na largada por jogo.js):
// o painel, o desenho e a física leem dele.
const S = () => window.AcertoSugestao;
export const ACERTO_CARRO_PADRAO = { asa: 0.5, altura: 0.5 };
export const ACERTO_CARRO = { ...ACERTO_CARRO_PADRAO };
let pista = null;
export const acertoGuardado = (id) => S().lerGuardado(id);
export function usarPista(id) { pista = id; Object.assign(ACERTO_CARRO, acertoGuardado(id) || ACERTO_CARRO_PADRAO); return ACERTO_CARRO; }
export const pistaDoAcerto = () => pista;
const guardar = () => { if (pista) S().guardar(pista, ACERTO_CARRO); };
export function acertarCarro(k, v) { if (k in ACERTO_CARRO) { ACERTO_CARRO[k] = Math.max(0, Math.min(1, Number(v))); guardar(); } }
export function usarAcerto(a) { Object.assign(ACERTO_CARRO, S().limpo(a)); guardar(); }
export function acertoCarroPadrao() { Object.assign(ACERTO_CARRO, ACERTO_CARRO_PADRAO); guardar(); }
// A conta da suspensão, em metros (o carro desenha em unidades: × KS). Ordem de grandeza de um F1 (a prancha fica a uns 3 a 7 cm do chão
// parado e baixa uns centímetros no fim da reta); não são medidas de um carro de verdade, e o painel é para acertar jogando.
//   altura parada: 2,5 a 7,5 cm (altura 0 a 1) · o quanto afunda: 4,5 cm × força da asa (0,8 a 1,2) × (v / 400 u/s)², mais as compressões
// (a conta é a de sim.js, a mesma que a física usa no servidor e na previsão)
export const alturaParada = (a) => window.Sim.alturaParada(a);
export const forcaDaAsa = (a) => window.Sim.forcaDaAsa(a);
export const afundaAero = (a, v) => window.Sim.afundaAero(a, v);
// as sugestões (acerto-sugestao.js): o melhor medido de cada pista, a sugestão do estrategista pelo nível e a proposta do engenheiro
export const carregarIdeais = () => S().carregarIdeais();
export const sugestaoDoEstrategista = (ideal, id, nivel) => S().sugestaoDoEstrategista(ideal, id, nivel);
export const propostaDoEngenheiro = (ideal) => S().propostaDoEngenheiro(ideal);
export const frase = (a) => S().frase(a);
