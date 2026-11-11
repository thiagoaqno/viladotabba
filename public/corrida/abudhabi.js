// Abu Dhabi (Yas Marina Circuit) — as peças só desta pista (nada daqui é do kit compartilhado), ligadas por gps/abudhabi.js. Do GP simples (kit/gp-simples.js)
// fica só a base técnica (asfalto, zebras, brita, grid, o corredor e as garagens dos boxes, a tribuna da reta e os painéis da barreira); o cenário é o de Yas,
// pelas fotos e pela posição real de cada coisa (passada da latitude e longitude para o mundo do jogo pelo encaixe da linha real, ferramentas/pista-real.js):
// o hotel W com a casca de LEDs por cima da pista (./kit/abudhabi/hotel.js), a marina com os iates (marina.js), o prédio dos boxes com o terraço de toldos
// (boxes.js) e o teto vermelho do Ferrari World ao longe (ferrari.js). Feitas para a escala real (#658) e trazidas para a escala antiga em 2026-11-11.
import { hotelW } from "./kit/abudhabi/hotel.js";
import { marinaYas } from "./kit/abudhabi/marina.js";
import { predioDosBoxes } from "./kit/abudhabi/boxes.js";
import { ferrariWorld } from "./kit/abudhabi/ferrari.js";
import { ligarNoite } from "./kit/bahrein/base.js";

export const BANDEIRA = [0x00732f, 0xef3340]; // verde em cima, vermelho embaixo

export function cenarioAbuDhabi(tr, ctx) {
  tr.hotelAD = hotelW(tr, ctx.add);
  marinaYas(tr, ctx.add);
  predioDosBoxes(tr, ctx.add);
  ferrariWorld(tr, ctx.add);
}

export function depoisAbuDhabi(tr) {
  ligarNoite(tr); // por último: depois de vidaGP, que define tr.animarPista (os LEDs da casca do hotel acendem e trocam de cor de noite)
}
