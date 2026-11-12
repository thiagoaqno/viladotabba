// Barcelona (Circuit de Barcelona-Catalunya, Montmeló, GP da Espanha): o que o GP usa do kit (kit/README.md explica cada peça) e o que só ele tem,
// em ../barcelona.js e ../kit/barcelona/ (a grande tribuna principal coberta com a asa de alumínio, o prédio dos boxes com a torre de controle de prova,
// a torre do relógio, as tribunas de curva nas encostas, as placas das curvas, o asfalto vermelho da curva 13, as bandeiras da Espanha e da
// Catalunha, os pinhais mansos e de alepo, as serras de Sant Llorenç del Munt, Montserrat e Montseny e os povoados do Vallès). As frações (0 a 1) são da
// volta, a partir da chegada, no meio da reta dos boxes:
// (traçado real de es-1991, layout atual sem chicane: as frações medidas por ferramentas/curvas-da-volta.js)
// reta dos boxes 0,923-0,147 (a tribuna principal do lado de fora, o prédio dos boxes do lado de dentro, o pórtico em 0) ·
// Elf (1) 0,147-0,162 · curva 2 0,167-0,183 · Renault (3) 0,199-0,251 · Repsol (4) 0,333-0,378 · Seat (5) 0,422-0,442 · Würth (6) 0,515-0,529 ·
// curvas 7-8 0,533-0,546 · Campsa (9) 0,583-0,612, o ponto mais alto · La Caixa (10) 0,718-0,763 · curva 11 0,766-0,771 · Banc de Sabadell (12) 0,772-0,806 ·
// curva 13 0,838-0,860 · curva 14 0,894-0,923. Autódromo largo: sem muro colado, brita clara e asfalto verde de escape, o céu limpo e o sol forte do verão.
import { cenarioBarcelona, depoisBarcelona, TORCIDA } from "../barcelona.js";

const VERMELHO = "#c8102e", BRANCO = "#f4f3f0", VERDE = ["#2f9a62", "#36a86a"];
const arq = (de, ate, lado, degraus, o = {}) => ({ de, ate, lado, degraus, cor: VERMELHO, encosto: BRANCO, torcida: TORCIDA, ...o });

export const GP_BARCELONA = {
  // escala real do cenário (as mesmas peças do kit de Interlagos e Spa: degrau 0,4 m ÷ 1,25 m e barreira 0,75 m ÷ 1,77 m dão 0,4; a pessoa, 1,75 m ÷ 2,54 m, 0,69).
  // As peças só desta pista (../barcelona.js, kit/barcelona/) leem `tr.escala`/`tr.escalaGente` ou têm o tamanho real medido (planos/escala-real.md).
  escala: 0.4, escalaGente: 0.69,
  asfalto: true, // o asfalto de GP de asfalto-gp.js, com as linhas de borda e a borracha
  chao: {
    margem: { cor: "#6d6e72" }, // a faixa de asfalto cinza, logo depois da zebra
    zebra: { cores: ["#d62828", "#f4f4f4"], dentro: 567, fora: 367 }, // as zebras vermelhas e brancas
    sc: [[0.93, "SC 1"], [0.12, "SC 2"]],
    grid: true, remendos: 26,
  },
  // o escape: brita clara do lado de fora de todas as curvas; asfalto pintado de verde por dentro das mais abertas (como em Montmeló desde 2007); pilhas de
  // pneus só nas duas curvas mais fortes (Elf e La Caixa)
  escape: {
    largura: 24, corBrita: "#e8e1cc", cores: VERDE,
    brita: [[0.142, 0.165, "fora"], [0.165, 0.186, "fora"], [0.196, 0.254, "fora"], [0.33, 0.38, "fora"], [0.419, 0.445, "fora"], [0.53, 0.55, "fora"], [0.58, 0.615, "fora"],
      [0.714, 0.765, "fora"], [0.77, 0.81, "fora"], [0.835, 0.864, "fora"], [0.89, 0.926, "fora"]],
    listrado: [[0.144, 0.164, "dentro"], [0.198, 0.252, "dentro"], [0.332, 0.379, "dentro"], [0.582, 0.613, "dentro"], [0.771, 0.808, "dentro"], [0.892, 0.924, "dentro"]],
    pneus: [[0.144, 0.164, "fora"], [0.714, 0.765, "fora"]],
  },
  // as arquibancadas de curva (fitas do kit); a tribuna principal, as tribunas das encostas (Elf, curva 3, Repsol, Campsa e La Caixa) e o resto são de ../barcelona.js
  arquibancadas: { trechos: [
    arq(0.165, 0.19, 1, 7, { encosto: "#ffc400" }), // por fora da curva 2
    arq(0.416, 0.448, 1, 8), // por fora da Seat
    arq(0.53, 0.552, 1, 6, { encosto: "#ffc400" }), // por fora da curva 7
    arq(0.768, 0.81, -1, 8), // Banc de Sabadell
    arq(0.834, 0.866, -1, 8, { encosto: "#ffc400" }), // a curva 13
    arq(0.89, 0.925, -1, 7), // a curva 14, antes da reta
  ] },
  cenario: (tr, ctx) => cenarioBarcelona(tr, ctx), // o chão sólido, a reta dos boxes, as tribunas das encostas, as placas das curvas e o asfalto vermelho
  // sem marca registrada de patrocinador: só o nome do GP, do circuito e de lugares da Catalunha
  ambiente: {
    marcas: ["gpespanya", "catalunya", "mediterrani", "montmelo", "valles", "costabrava", "pirineus", "cava", "oliva", "circuit"],
    outdoors: ["gpespanya", "catalunya", "mediterrani", "montmelo", "valles", "costabrava", "pirineus", "cava"],
    bandeira: [0xc60b1e, 0xffc400], posto: "catalunya", placas: [150, 100, 50], // a Espanha: vermelha e amarela
  },
  passarelas: { candidatos: [0.962, 0.48, 0.66, 0.3], marcas: ["gpespanya", "catalunya", "circuit"], max: 3 }, // a da reta dos boxes, pouco antes dos boxes
  horizonte: false, // os morros de longe são as serras de ../kit/barcelona/paisagem.js
  vida: {
    gaivotas: [], // não tem mar
    som: { campo: () => 1, cidade: 0.12 }, // vento e passarinhos de autódromo; a cidade fica longe
  },
  sem: { mastros: true }, // os mastros altos de vida-mais.js não: ficariam no ar. As bandeiras da Espanha e da Catalunha são as da torcida, nos degraus (../barcelona.js)
  beira: {}, // sem as árvores redondas de sempre: a vegetação mediterrânea é de ../kit/barcelona/vegetacao.js, em `depois`
  depois: (tr, ctx) => depoisBarcelona(tr, ctx, GP_BARCELONA.ambienteBarcelona), // o ambiente no chão, as serras, os povoados, a vegetação, as bandeiras da torcida e a faixa no pórtico
};
// o ambiente do kit (kit/ambiente.js) deixa os painéis, os mastros e as placas de frenagem no ar: Barcelona usa o seu (kit/barcelona/ambiente.js), chamado em `depois` (ver ../barcelona.js)
GP_BARCELONA.ambienteBarcelona = GP_BARCELONA.ambiente; delete GP_BARCELONA.ambiente;
