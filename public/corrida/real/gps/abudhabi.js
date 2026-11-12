// Abu Dhabi (Emirados Árabes): o GP simples do kit (kit/gp-simples.js: asfalto, zebras, grid, escape, arquibancada, prédio dos
// boxes, painéis, bandeira, passarela e som), enquanto não ganha o cenário fino de cada canto; o chão junto da pista (a areia no nível do
// asfalto e a base sólida sob a pista) e o conserto do que flutuava são só de Abu Dhabi (../abudhabi.js e ../kit/abudhabi/). O traçado veio de
// bacinger/f1-circuits (ae-2009, licença MIT) por ferramentas/circuitos-f1.js; as frações (0 a 1) são da volta, a partir da linha de chegada.
import { gpSimples } from "../kit/gp-simples.js";
import { cenarioAbuDhabi, depoisAbuDhabi, BANDEIRA } from "../abudhabi.js";

export const GP_ABUDHABI = gpSimples("abudhabi", {
  bandeira: BANDEIRA, marcas: ["pirelli", "rolex", "aramco", "dhl", "heineken", "f1", "aws", "lenovo", "msc"], margem: "#8a7e6a",
  beira: {}, horizonte: false, // (sem as palmeiras e os prédios de vidro soltos do kit: o que há em volta de Yas está em ../abudhabi.js, no lugar real)
  cenario: (tr, ctx) => cenarioAbuDhabi(tr, ctx), // a areia no nível do asfalto e a base sólida da pista
});
// escala real: o cenário do kit no tamanho certo (os mesmos fatores de Interlagos e Spa), e a zebra e a brita automática de gpSimples (fixas em 340/220 e 420)
// crescem como os raios das curvas (× 1,828, o fator do `scale` de pistas.js)
Object.assign(GP_ABUDHABI, { escala: 0.4, escalaGente: 0.69 });
Object.assign(GP_ABUDHABI.chao.zebra, { dentro: 622, fora: 402 });
GP_ABUDHABI.escape = { ...GP_ABUDHABI.escape, britaCurvas: 768 };
// o que o kit de ambiente deixa no ar (o mastro das bandeiras, as placas de 100 e 50 m e, com a barreira longe, os painéis e as bandeiras na altura da pista): ../abudhabi.js `consertarAmbiente`
GP_ABUDHABI.depois = (tr, ctx) => depoisAbuDhabi(tr, ctx);
// o cenário genérico do GP simples sai: o prédio dos boxes do kit (no lugar dele, o de Yas, ../kit/abudhabi/boxes.js, em cima das garagens) e as passarelas
GP_ABUDHABI.cenario = (tr, ctx) => cenarioAbuDhabi(tr, ctx);
delete GP_ABUDHABI.passarelas;
