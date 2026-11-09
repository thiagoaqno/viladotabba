// Madri (Espanha): o GP simples do kit (kit/gp-simples.js: asfalto, zebras, grid, escape, arquibancada, prédio dos
// boxes, painéis, bandeira, passarela e som), enquanto não ganha o cenário fino de cada canto. O traçado veio de
// bacinger/f1-circuits (es-2026, licença MIT) por ferramentas/circuitos-f1.js; as frações (0 a 1) são da volta, a partir da linha de chegada.
// Escala real (fase 1): a zebra e a brita de gpSimples são fixas (340/220) e não cresceram com o `scale` (× 1,888), então crescem aqui só para Madri; o chão sólido
// junto da pista é de ./madri.js e ./kit/madri/ (nada do kit compartilhado nem de pista.js foi mexido).
import { gpSimples } from "../kit/gp-simples.js";
import { cenarioMadri, depoisMadri } from "../madri.js";

const FATOR = 1.888; // o `scale` de Madri, de 3,64 para 6,872

export const GP_MADRI = gpSimples("madri", {
  bandeira: [0xc60b1e, 0xffc400], marcas: ["pirelli", "rolex", "aramco", "dhl", "heineken", "f1", "aws", "lenovo", "msc"],
  montanha: { angulo: (-3 * Math.PI) / 4, afastamento: 1700, altura: 760, rocha: "#8a8478", mato: "#5e6648", longe: "#a8b4c4" }, // a serra de Guadarrama, a noroeste
  beira: { arvores: 0.05, predios: 0.1, longe: { predios: 0.2, vidro: 0.1 } }, horizonte: { cor: 0x9a9472 },
  escape: { britaCurvas: 793, corBrita: "#ddd3b6", largura: 26 }, // o raio da curva com brita: 420 × 1,888 (o mesmo de SUPERFICIES_ESCAPE em pistas.js)
  cenario: (tr, ctx) => cenarioMadri(tr, ctx, GP_MADRI.ambienteMadri), // o chão sólido e o ambiente de Madri (os painéis, mastros e placas no chão)
});
// o ambiente do kit (kit/ambiente.js) deixa mastros, painéis e placas de frenagem no ar: Madri usa o seu (kit/madri/ambiente.js), chamado em `cenario` com a mesma configuração
GP_MADRI.ambienteMadri = GP_MADRI.ambiente; delete GP_MADRI.ambiente;
GP_MADRI.depois = (tr) => depoisMadri(tr); // os postos das placas de DRS
// a escala do cenário (1 u = 0,2083 m, 4,8 u por metro): as peças do kit (degrau 9 × 6 u = 1,88 × 1,25 m, barreira 1,77 m, pessoa sentada 2,54 m) são as mesmas de Interlagos, Spa e Hungaroring, medidas nelas
GP_MADRI.escala = 0.4; GP_MADRI.escalaGente = 0.69;
// a zebra (de gpSimples: 340 por dentro e 220 por fora) × 1,888
GP_MADRI.chao.zebra.dentro = Math.round(340 * FATOR); GP_MADRI.chao.zebra.fora = Math.round(220 * FATOR);
