// Catar (Catar): o GP simples do kit (kit/gp-simples.js: asfalto, zebras, grid, escape, arquibancada, prédio dos
// boxes, painéis, bandeira, passarela e som), enquanto não ganha o cenário fino de cada canto; o chão junto da pista (a areia
// no nível do asfalto e a base sólida sob a pista) é só do Catar (../catar.js e ../kit/catar/). O traçado veio de
// bacinger/f1-circuits (qa-2004, licença MIT) por ferramentas/circuitos-f1.js; as frações (0 a 1) são da volta, a partir da linha de chegada.
import { gpSimples } from "../kit/gp-simples.js";
import { cenarioCatar, depoisCatar } from "../catar.js";

export const GP_CATAR = gpSimples("catar", {
  bandeira: [0x8a1538, 0xffffff], marcas: ["qatar", "pirelli", "rolex", "aramco", "dhl", "heineken", "f1", "aws", "lenovo"], margem: "#9a8a6a",
  escape: { britaCurvas: 776, corBrita: "#d8c49a", largura: 26 }, beira: { palmeiras: 0.03, longe: {} }, horizonte: false,
  cenario: (tr, ctx) => cenarioCatar(tr, ctx), // a areia no nível do asfalto e a base sólida da pista
});
// a escala do cenário (1 u = 0,2083 m, 4,8 u por metro), medida na cena do Catar (as peças do kit são as mesmas de Interlagos, Spa e Hungaroring): o degrau da arquibancada tem 9 × 6 u
// (1,87 × 1,25 m, `tr.arqDegraus`), a barreira do escape 8,5 u (1,77 m, pista.js) e a pessoa sentada 2,54 m; real ÷ medido: degrau 0,4 m, barreira 0,75 m e pessoa 1,75 m, então os mesmos 0,4 e 0,69.
GP_CATAR.escala = 0.4; GP_CATAR.escalaGente = 0.69;
// a zebra de gpSimples é fixa (dentro 340, fora 220, as de antes da escala real): × 1,8476 (o `scale` de 2,96 para 5,469), como a zebra e a brita das outras pistas, para as mesmas curvas continuarem com zebra
GP_CATAR.chao.zebra = { ...GP_CATAR.chao.zebra, dentro: 628, fora: 406 };
// o que o kit de ambiente deixa no ar sem a cerca (o mastro das bandeiras e as placas de 100 e 50 m): ../catar.js `consertarAmbiente`
GP_CATAR.depois = (tr, ctx) => depoisCatar(tr, ctx);
