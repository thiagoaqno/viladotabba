// Interlagos (Autódromo José Carlos Pace): o que o GP usa do kit (kit/README.md explica cada peça) e o que só ele tem, em
// ../interlagos.js (o lago, a caixa-d'água, o prédio dos boxes, São Paulo em volta, e de kit/interlagos/ as placas das curvas e a mata). A pista é a real (4.309 m, anti-horária) e as frações (0 a 1) são da volta, a partir da chegada:
// S do Senna 0,066-0,104 · Curva do Sol 0,11-0,18 · Reta Oposta 0,18-0,31 · Descida do Lago 0,31-0,37 · Ferradura 0,46-0,50 ·
// Laranjinha 0,49-0,50 · Pinheirinho 0,55-0,58 · Bico de Pato 0,625-0,645 · Mergulho 0,66-0,70 · Junção 0,74-0,76 · Café 0,78 · subida dos boxes até a chegada.
import { cenarioInterlagos, depoisInterlagos } from "../interlagos.js";

export const GP_INTERLAGOS = {
  asfalto: true,
  chao: {
    margem: { cor: "#7b7d82" }, // o asfalto cinza-claro da faixa de escape junto da zebra
    zebra: { cores: ["#d62828", "#f4f4f4"], dentro: 330, fora: 200 }, // as zebras vermelhas e brancas das curvas
    amarelas: [[0.66, 0.705]], // a zebra alta do Mergulho
    sc: [[0.945, "SC 1"], [0.225, "SC 2"]],
    grid: true, remendos: 34,
  },
  // o escape: asfalto pintado de verde e amarelo (as cores do Brasil) na saída do S do Senna, no Lago e na Junção; brita
  // na Ferradura e no Pinheirinho; muro de pneus por fora das curvas
  escape: {
    listrado: [[0.06, 0.125, "fora"], [0.31, 0.37, "fora"], [0.74, 0.775, "fora"]],
    brita: [[0.45, 0.505, "fora"], [0.545, 0.59, "fora"], [0.62, 0.655, "fora"]],
    pneus: [[0.06, 0.125, "fora"], [0.45, 0.505, "fora"], [0.545, 0.59, "fora"], [0.62, 0.655, "fora"], [0.74, 0.775, "fora"]],
  },
  // as arquibancadas do kit, com a torcida sentada (vida.js): as três da reta dos boxes (o setor M e as duas de antes dele, do lado de fora, oposto aos boxes, onde o OpenStreetMap as mapeia) e as dos setores do S do Senna, da Curva do Sol, da Reta Oposta, do Lago, do Laranjinha, do Pinheirinho e do Café
  arquibancadas: { trechos: [
    { de: 0.976, ate: 0.9995, lado: 1, degraus: 8, cor: "#1f8a3f", encosto: "#ffd23f" },
    { de: 0.006, ate: 0.019, lado: 1, degraus: 8, cor: "#1f8a3f", encosto: "#ffd23f" },
    { de: 0.022, ate: 0.06, lado: 1, degraus: 8, cor: "#1f8a3f", encosto: "#ffd23f" },
    ...[[0.075, 0.112], [0.165, 0.19], [0.272, 0.298], [0.30, 0.322, -1], [0.482, 0.505], [0.552, 0.58], [0.77, 0.795]].map(([de, ate, lado = 1], k) => ({ de, ate, lado, degraus: 6, cor: k % 2 ? "#1f5fbf" : "#1f8a3f", encosto: k % 2 ? "#f4f4f4" : "#ffd23f" })),
  ] },
  cenario: (tr, ctx) => cenarioInterlagos(tr, ctx), // as arquibancadas (para o som), São Paulo em volta e o lago
  ambiente: {
    marcas: ["heineken", "pirelli", "petrobras", "rolex", "bb", "aramco", "itau", "dhl", "gpsp", "tag"],
    outdoors: ["heineken", "petrobras", "pirelli", "bb", "itau", "rolex", "gpsp", "aramco"],
    posto: "gpsp", bandeira: [0x009c3b, 0xffdf00], placas: [150, 100, 50], // as placas de frenagem de Interlagos têm 150 m
  },
  passarelas: { candidatos: [0.035, 0.22, 0.9, 0.26], marcas: ["gpsp", "petrobras", "heineken"], max: 2 }, // a da reta dos boxes
  montanha: { angulo: -Math.PI / 2, altura: 620, rocha: "#6f7a62", mato: "#35623a", longe: "#9db6c6" }, // a Serra da Cantareira, ao norte
  fachadas: { cores: [["#d8d2c4", "#55626d"], ["#c6beac", "#6a4f3c"], ["#e4dbc4", "#3a566e"], ["#bdbab2", "#2f4a3c"], ["#e6cba6", "#6a3d2a"], ["#cdd2d3", "#3a3f45"], ["#efe7d6", "#8a6a2f"]], toldos: [], telhas: 0.1 }, // São Paulo: concreto, tijolo e pastilha
  vida: {
    som: { campo: () => 0.7, cidade: 0.25 }, // vento e passarinhos do autódromo, a cidade lá longe
  },
  depois: (tr, ctx) => depoisInterlagos(tr, ctx, GP_INTERLAGOS.arquibancadas.trechos), // o prédio dos boxes, as placas das curvas e a mata (sem entrar atrás das arquibancadas)
};
