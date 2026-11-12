// Hungaroring (Hungria): o GP com cenário próprio (./hungaroring.js e ./kit/hungaroring/), no molde de Spa e Red Bull Ring: o que o GP usa do kit (kit/README.md explica cada peça) e o que só ele tem
// (o chão junto da pista com a base sólida, o prédio dos boxes e a tribuna principal, os morros secos da bacia e os bosquetes). O traçado veio de bacinger/f1-circuits (hu-1986, licença MIT) por
// ferramentas/circuitos-f1.js; as frações (0 a 1) são da volta, a partir da linha de chegada: reta dos boxes 0,958-0,05 · curva 1 (a descida) 0,082 · curva 2 e 3 0,199-0,241 · curva 4 0,351 ·
// curvas 6 e 7 (a chicane lenta) 0,483-0,488 · curva 11 0,649 · curva 12 0,744 · curvas 13 e 14 0,805-0,871.
import { cenarioHungaroring, depoisHungaroring, CAMISAS_HU } from "../hungaroring.js";

const P = window.Pistas, T = P.PISTAS.hungaroring, BOXES = T.boxes, PTS = P.pontos(T, 6);
const VERMELHO = "#ce2939", BRANCO = "#f4f4f2", AZUL = "#1d4f9a";
// o lado de fora de uma curva (a arquibancada de curva fica por fora, de frente para a pista): o contrário do lado para onde ela vira
const ladoDeFora = (f) => { const i = Math.floor(f * PTS.length) % PTS.length, p = PTS[i], q = PTS[(i + 3) % PTS.length]; return p.tx * q.ty - p.ty * q.tx > 0 ? -1 : 1; };
const arq = (de, ate, lado, degraus, cor, encosto, cobertura = false) => ({ de, ate, lado, degraus, cor, encosto, cobertura, torcida: CAMISAS_HU });

export const GP_HUNGARORING = {
  // a escala do cenário (1 u = 0,2083 m, 4,8 u por metro): as peças do kit de arquibancada, barreira, painel e pessoa são as mesmas de Interlagos e Spa (degrau 1,87 × 1,25 m, barreira 1,77 m e
  // pessoa 2,54 m, medidos de novo nesta pista), então valem os mesmos 0,4 e 0,69. As peças só do Hungaroring (../hungaroring.js e ../kit/hungaroring/) já foram desenhadas em unidades de hoje.
  escala: 0.4, escalaGente: 0.69,
  asfalto: true,
  chao: {
    margem: { cor: "#6d6e72" }, // o asfalto cinza da faixa junto da zebra
    zebra: { cores: [VERMELHO, BRANCO], dentro: 547, fora: 354 }, // as zebras vermelhas e brancas (raios das curvas × 1,609 com a escala real: as mesmas curvas de antes têm zebra)
    sc: [[BOXES.sai, "SC 2"], [BOXES.entra, "SC 1"]],
    grid: true, remendos: 26,
  },
  // o escape: brita clara do lado de fora das curvas fechadas (o raio × 1,609, como a zebra)
  escape: { britaCurvas: 676, corBrita: "#d9c9a0", largura: 26 },
  // as arquibancadas de curva (fitas do kit): por fora da curva 1 (entre a saída dos boxes e a curva), da curva 4 e da curva 12; a tribuna principal coberta é de ../hungaroring.js
  arquibancadas: { trechos: [
    arq(0.06, 0.104, ladoDeFora(0.082), 9, AZUL, BRANCO, true), // curva 1
    arq(0.336, 0.368, ladoDeFora(0.351), 8, VERMELHO, BRANCO), // curva 4
    arq(0.73, 0.76, ladoDeFora(0.744), 8, AZUL, BRANCO), // curva 12
  ] },
  cenario: (tr, ctx) => cenarioHungaroring(tr, ctx), // o chão junto da pista, o prédio dos boxes e a tribuna principal
  ambiente: {
    marcas: ["hungaroring", "nagydij", "mogyorod", "budapest", "paprika", "tokaji", "gulyas", "langos", "balaton", "duna"],
    outdoors: ["hungaroring", "nagydij", "mogyorod", "budapest", "paprika", "tokaji", "gulyas", "langos"],
    posto: "hungaroring", bandeira: [0xce2939, 0xffffff, 0x477050], // a bandeira da Hungria: vermelho, branco e verde em faixas horizontais
  },
  passarelas: { candidatos: [0.965, 0.5, 0.27, 0.73], marcas: ["hungaroring", "nagydij", "mogyorod"], max: 2 },
  beira: {}, // sem as árvores pálidas de sempre: os bosquetes e o mato de longe são de ../kit/hungaroring/paisagem.js, em `depois`
  horizonte: { cor: 0x8a9a6a },
  depois: (tr, ctx) => depoisHungaroring(tr, ctx),
  vida: {
    gaivotas: [], // não tem mar
    som: { campo: () => 1, cidade: 0.08 },
  },
};
