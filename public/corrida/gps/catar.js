// Catar (Lusail International Circuit, o antigo Losail): a configuração do GP. O que é cenário (o prédio dos boxes, as arquibancadas, o paddock, as torres de luz, o horizonte de Lusail, o chão e o ambiente de pista) é só desta pista, em ../catar.js e
// ../kit/catar/; daqui o kit compartilhado só fornece a base técnica: asfalto de GP, zebras, o grid, a brita do escape, o corredor dos boxes das regras de F1 (a física dele), o som, os fiscais e o helicóptero. Nada do GP simples (kit/gp-simples.js).
// O traçado veio de bacinger/f1-circuits (qa-2004, licença MIT) por ferramentas/circuitos-f1.js; as frações (0 a 1) são da volta, a partir da linha de chegada. A reta dos boxes e a de chegada vão de 0,89 a 0,083 (1 068 m na realidade: Wikipedia) e a
// curva 1 (à direita, com a Lusail Hill por fora e o edifício VVIP por dentro) é a 0,083-0,111.
// Frações (conferidas na curvatura de pistas.js): curva 1 (direita) 0,083-0,111 · curva 2 (esquerda) 0,141-0,164 · curva 3 0,189-0,202 · curva 4 0,265-0,281 · curva 5 0,294-0,310 · grampo da 6 (a mais lenta, abaixo de 100 km/h) 0,351-0,366 ·
// curvas 7 e 8 0,418-0,456 · curva 9 0,489-0,503 · curva 10 0,528-0,545 · curva 11 0,644-0,660 · curva 12 (a mais rápida, mais de 275 km/h) 0,679-0,693 · curva 13 0,716-0,732 · curva 14 0,777-0,792 · curva 15 e a reta 0,858-0,882.
import { cenarioCatar, depoisCatar } from "../catar.js";

const BOXES = window.Pistas.PISTAS.catar.boxes; // o corredor dos boxes (pistas.js): as linhas SC 1 e SC 2 são a entrada e a saída dele

export const GP_CATAR = {
  // a escala real do cenário (as peças de kit/catar/ leem `tr.escala` e `W`; ver planos/escala-real.md): 1 u = 0,2083 m, 4,8 u por metro (o degrau do kit 0,4 m ÷ 1,25 m e a pessoa 1,75 m ÷ 2,54 m dão 0,4 e 0,69).
  escala: 0.4, escalaGente: 0.69,
  asfalto: true,
  chao: {
    margem: { cor: "#9a8a6a" }, // o asfalto cinza-areia da faixa junto da zebra
    // a zebra de antes da escala real era fixa (dentro 340, fora 220): × 1,8476 (o `scale` de 2,96 para 5,469), como a zebra e a brita das outras pistas, para as mesmas curvas continuarem com zebra
    zebra: { cores: ["#d62828", "#f4f4f4"], dentro: 340, fora: 220 }, // (de volta à escala antiga, 2026-11-11: as medidas fixas de antes)
    sc: [[BOXES.sai, "SC 2"], [BOXES.entra, "SC 1"]],
    grid: true, remendos: 26,
  },
  escape: { britaCurvas: 420, corBrita: "#d8c49a", largura: 26 }, // a brita cor de areia do lado de fora das curvas fechadas; no resto, o escape de asfalto do traçado
  cenario: (tr, ctx) => cenarioCatar(tr, ctx, GP_CATAR.ambienteCatar), // tudo o que o Lusail tem (../catar.js)
  sem: { mastros: true, olhos: true, setas: true, rodas: true, dirigivel: true, bandeirolas: true }, // as peças genéricas de vida.js não: o Lusail tem as bandeiras do Catar de kit/catar/ambiente.js, sem roda-gigante, dirigível, setas nem olhos de gato
  horizonte: false, // sem os morros verdes de longe: deserto plano; o horizonte é a linha de prédios de kit/catar/horizonte.js
  beira: { longe: {} }, // sem as árvores, palmeiras e prédios genéricos da beira: as árvores são as de kit/catar/paddock.js
  depois: (tr) => depoisCatar(tr),
  vida: { som: { campo: () => 0.8, cidade: 0.1 } }, // vento do deserto, a cidade lá longe
};
// o ambiente do kit (kit/ambiente.js) deixaria mastros, painéis e placas no ar: o do Catar é o de kit/catar/ambiente.js, chamado em `cenario` com esta configuração
GP_CATAR.ambienteCatar = {
  marcas: ["qatar", "aramco", "pirelli", "rolex", "dhl", "heineken", "aws", "lenovo", "msc", "f1"],
  outdoors: ["qatar", "aramco", "pirelli", "rolex", "dhl", "aws", "lenovo", "f1"], posto: "qatar", placas: [150, 100, 50],
};
