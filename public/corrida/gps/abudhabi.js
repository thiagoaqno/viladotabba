// Abu Dhabi (Emirados Árabes): o GP simples do kit (kit/gp-simples.js: asfalto, zebras, grid, escape, arquibancada, prédio dos
// boxes, painéis, bandeira, passarela e som), enquanto não ganha o cenário fino de cada canto. O traçado veio de
// bacinger/f1-circuits (ae-2009, licença MIT) por ferramentas/circuitos-f1.js; as frações (0 a 1) são da volta, a partir da linha de chegada.
import { gpSimples } from "../kit/gp-simples.js";

export const GP_ABUDHABI = gpSimples("abudhabi", {
  bandeira: [0x00732f, 0xef3340], marcas: ["pirelli", "rolex", "aramco", "dhl", "heineken", "f1", "aws", "lenovo", "msc"], margem: "#8a7e6a",
  beira: { palmeiras: 0.12, vidro: 0.15, longe: { vidro: 0.15 } }, horizonte: false,
});
// escala real: o cenário do kit no tamanho certo (os mesmos fatores de Interlagos e Spa), e a zebra e a brita automática de gpSimples (fixas em 340/220 e 420)
// crescem como os raios das curvas (× 1,828, o fator do `scale` de pistas.js)
Object.assign(GP_ABUDHABI, { escala: 0.4, escalaGente: 0.69 });
Object.assign(GP_ABUDHABI.chao.zebra, { dentro: 622, fora: 402 });
GP_ABUDHABI.escape = { ...GP_ABUDHABI.escape, britaCurvas: 768 };
