// Abu Dhabi (Emirados Árabes): a base técnica do GP simples do kit (kit/gp-simples.js: asfalto, zebras, grid, escape, a tribuna da reta, painéis, bandeira
// e som) e o cenário de Yas Marina, só desta pista (../abudhabi.js e ../kit/abudhabi/: o hotel W, a marina, o prédio dos boxes e o Ferrari World). O traçado
// veio de bacinger/f1-circuits (ae-2009, licença MIT) por ferramentas/circuitos-f1.js; as frações (0 a 1) são da volta, a partir da linha de chegada.
import { gpSimples } from "../kit/gp-simples.js";
import { cenarioAbuDhabi, depoisAbuDhabi, BANDEIRA } from "../abudhabi.js";

export const GP_ABUDHABI = gpSimples("abudhabi", {
  bandeira: BANDEIRA, marcas: ["pirelli", "rolex", "aramco", "dhl", "heineken", "f1", "aws", "lenovo", "msc"], margem: "#8a7e6a",
  beira: {}, horizonte: false, // (sem as palmeiras e os prédios de vidro soltos do kit: o que há em volta de Yas está em ../abudhabi.js, no lugar real)
});
// o cenário genérico do GP simples sai: o prédio dos boxes do kit (no lugar dele, o de Yas, ../kit/abudhabi/boxes.js, em cima das garagens) e as passarelas
GP_ABUDHABI.cenario = (tr, ctx) => cenarioAbuDhabi(tr, ctx);
GP_ABUDHABI.depois = (tr, ctx) => depoisAbuDhabi(tr, ctx);
delete GP_ABUDHABI.passarelas;
