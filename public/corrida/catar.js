// Catar (Lusail International Circuit): o que só este autódromo tem. O resto (asfalto, zebras, brita do escape, o corredor dos boxes das regras de F1, o som, os fiscais e o helicóptero) é a base técnica do kit, na configuração de gps/catar.js.
// As peças exclusivas ficam em kit/catar/ e são todas desenhadas para este circuito (nenhuma é o GP simples do kit):
// 1. o prédio dos boxes de 402 m com a torre de controle, o Paddock Club com a escada em espiral e a plataforma de aço, e os quatro telões (boxes.js);
// 2. a arquibancada principal de 14 fileiras e seis zonas, com o telhado só na metade de trás, e as outras, uma a uma (tribuna.js);
// 3. o paddock com as dezesseis vilas de frente curva, as sombras de aço em forma de árvore, o centro de mídia, o edifício VVIP da curva 1, a Lusail Hill e o deserto em volta (paddock.js);
// 4. a iluminação noturna da Musco, os postes de painéis de LED dos dois lados da pista, e a luz de verdade deles (luz.js);
// 5. o horizonte: as Lusail Plaza Towers, as Katara Towers, o Lusail Stadium e a Doha da Baía Oeste (horizonte.js);
// 6. o chão (areia no nível do asfalto, grama sintética e base sólida, chao.js) e o ambiente de pista no chão (painéis, bandeiras do Catar, placas de frenagem, postos dos fiscais: ambiente.js).
// Fontes: tilke.de/portfolio/lusail-race-track-qatar (a arquitetura), marhaba.qa e thepeninsulaqatar.com (o Guinness da pit building de 402 m e 50 garagens, os números da reforma de 2023), gulf-times.com (as capacidades das arquibancadas),
// oversteer48.com (a Main Grandstand), Wikipedia "Lusail International Circuit" (a grama sintética e a iluminação da Musco), Autosport "Qatar ready for major night test" (a iluminação) e Wikipedia "Lusail Plaza Towers" / "Lusail Stadium" (o horizonte).
import { beiradaSolida } from "./kit/catar/chao.js";
import { predioDosBoxes } from "./kit/catar/boxes.js";
import { arquibancadas } from "./kit/catar/tribuna.js";
import { paddock, vvip, lusailHill, deserto } from "./kit/catar/paddock.js";
import { torresDeLuz } from "./kit/catar/luz.js";
import { horizonteLusail } from "./kit/catar/horizonte.js";
import { ambienteCatar, postesDRS } from "./kit/catar/ambiente.js";
import { ligarNoite } from "./kit/catar/base.js";

const GRENA = ["#8a1538", "#5e0e27"], BRANCO = ["#e9e7e2", "#c7c4bd"], GRAFITE = ["#3b3f46", "#2a2d33"], AREIA = ["#c9b48a", "#a8946b"];
// As arquibancadas (frações da volta a partir da linha de chegada; `lado: "fora"` é o lado de fora da curva). A principal fica do lado de fora da reta, de frente para o prédio dos boxes (7 500 lugares ÷ 14 fileiras ≈ 268 m: 0,9755 a 1,0245),
// com a do norte colada nela; as temporárias (22 700 lugares na soma: Ashghal) ficam nas curvas lentas, de tamanhos e fileiras diferentes, e a posição de cada uma é estimada.
const ARQUIBANCADAS = [
  { nome: "principal", de: 0.9755, ate: 1.0245, lado: -1, degraus: 14, secoes: 24, zonas: 6, cobertura: 0.5, assentos: [GRENA, BRANCO, GRENA, BRANCO, GRENA, BRANCO], placas: ["qatar", "aramco", "pirelli", "rolex"] },
  { nome: "norte", de: 1.027, ate: 1.049, lado: -1, degraus: 10, secoes: 6, cobertura: 0.4, assentos: [GRENA], placas: ["qatar", "heineken"] },
  { nome: "reta-sul", de: 0.918, ate: 0.968, lado: -1, degraus: 9, secoes: 9, zonas: 3, cobertura: 0, assentos: [BRANCO, GRAFITE, BRANCO], placas: ["aramco", "dhl", "aws"] },
  { nome: "curva-1", de: 0.088, ate: 0.126, lado: "fora", degraus: 13, secoes: 8, zonas: 2, cobertura: 0.35, assentos: [GRENA, AREIA], placas: ["qatar", "lenovo"] },
  { nome: "curva-2-3", de: 0.15, ate: 0.172, lado: "fora", degraus: 8, secoes: 4, cobertura: 0, assentos: [GRAFITE], placas: ["pirelli", "f1"] },
  { nome: "curva-4", de: 0.254, ate: 0.282, lado: "fora", degraus: 10, secoes: 5, cobertura: 0.25, assentos: [BRANCO, GRENA], zonas: 2, placas: ["rolex", "msc"] },
  { nome: "grampo-6", de: 0.342, ate: 0.372, lado: "fora", degraus: 11, secoes: 6, cobertura: 0, assentos: [GRENA, GRAFITE], zonas: 2, placas: ["heineken", "aramco"] },
  { nome: "curva-10", de: 0.52, ate: 0.55, lado: "fora", degraus: 9, secoes: 5, cobertura: 0.3, assentos: [AREIA], placas: ["dhl", "qatar"] },
  { nome: "curva-12", de: 0.672, ate: 0.698, lado: "fora", degraus: 8, secoes: 4, cobertura: 0, assentos: [BRANCO, GRENA], zonas: 2, placas: ["aws", "lenovo"] },
  { nome: "curva-14", de: 0.768, ate: 0.8, lado: "fora", degraus: 12, secoes: 6, cobertura: 0.2, assentos: [GRENA, BRANCO], zonas: 2, placas: ["f1", "pirelli"] },
  { nome: "curva-15", de: 0.848, ate: 0.892, lado: "fora", degraus: 14, secoes: 9, cobertura: 0.4, assentos: [BRANCO, GRENA, GRAFITE], zonas: 3, placas: ["qatar", "aramco", "rolex"] },
];

// o antes: o chão sólido, o prédio dos boxes, as arquibancadas, o paddock, o VVIP e a colina, as torres de luz, o horizonte, o deserto e o ambiente de pista
export function cenarioCatar(tr, ctx, ambiente) {
  const { add } = ctx;
  tr.reservado ||= [];
  tr.camisasGP = ["#8a1538", "#ffffff", "#8a1538", "#f3f3f3", "#e8c25a", "#1b1b1b", "#ff8700", "#e10600"]; // a torcida veste o grená do Catar e as cores das equipes
  beiradaSolida(tr, add, { britaCurvas: 776 }); // a areia no nível do asfalto, a grama sintética e a base sólida da pista, dos dois lados (kit/catar/chao.js)
  const boxes = predioDosBoxes(tr, add);
  arquibancadas(tr, add, ARQUIBANCADAS);
  paddock(tr, add, boxes);
  vvip(tr, add);
  lusailHill(tr, add);
  torresDeLuz(tr, add);
  horizonteLusail(tr, add);
  deserto(tr, add);
  ambienteCatar(tr, add, ambiente); // painéis, bandeiras, placas de frenagem e postos dos fiscais, no chão e atrás da barreira (kit/catar/ambiente.js)
}

// o depois: as placas de DRS de pista.js com poste até o chão e a luz da noite (por último: depois de vidaGP, que define tr.animarPista)
export function depoisCatar(tr) {
  postesDRS(tr);
  ligarNoite(tr);
}
