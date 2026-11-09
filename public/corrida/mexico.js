// Cidade do México (Autódromo Hermanos Rodríguez, dentro do parque Magdalena Mixhuca): o que só o circuito tem, em cima do kit. O resto (zebras, escape,
// arquibancadas, painéis, passarelas e som) é do kit, na configuração de gps/mexico.js; as peças exclusivas estão em kit/mexico/. Aqui, na ordem em que
// aparecem (frações da volta, a partir da linha de chegada, que fica no meio da reta dos boxes; o traçado vai para leste, a curva 1 é à direita):
// 1. o Foro Sol, o estádio de beisebol no miolo da alça do fim da volta (0,85-0,98): a arquibancada em ferradura lotada de verde, branco e vermelho,
//    o pódio no meio do campo de frente para a torcida, as bandeiras do México, as torres de luz e a fumaça tricolor;
// 2. a reta dos boxes (muito longa): o prédio das garagens do lado sul e a tribuna principal do lado norte; o Palácio dos Esportes, de cúpula de cobre, ao fundo;
// 3. o parque Magdalena Mixhuca: lagos, quadras, jacarandás, ahuehuetes, eucaliptos e pinheiros;
// 4. um pedaço da Peraltada antiga, o anel inclinado que ficou de fora do circuito, visível do lado;
// 5. o horizonte: a cidade baixa de cores quentes, a Torre Latinoamericana e os vulcões Popocatépetl e Iztaccíhuatl na névoa da altitude.
// Tudo é cenário: nada fica dentro da pista (livre/ocupado) e a física é a de sempre. Sem marcas registradas novas: os painéis são nomes de lugar e de
// comida do México (kit/mexico/marcas.js) e as marcas que o kit já tem.
import * as THREE from "three";
import { M } from "./cena.js";
import { livre, ocupado } from "./kit/comum.js";
import { prediosDosBoxes } from "./kit/boxes.js";
import { tendaPaddock } from "./kit/coberturas.js";
import { registrarMarcasMexico } from "./kit/mexico/marcas.js";
import { reservarRet, acharRet, indice } from "./kit/mexico/lugar.js";
import { foroSol } from "./kit/mexico/foro.js";
import { arvoresDoParque, lagos, camposDeEsporte, palacioDosEsportes, peraltada } from "./kit/mexico/parque.js";
import { CAMPOS } from "./kit/mexico/dados.js";
import { cidade, vulcoes } from "./kit/mexico/horizonte.js";
import { beiradaSolida } from "./kit/mexico/chao.js";
import { ambienteMexico } from "./kit/mexico/ambiente.js";

registrarMarcasMexico();

// ---------------------------------------------------------------------------------------------------------------------
// 1. O Foro Sol
// ---------------------------------------------------------------------------------------------------------------------
// (escala real: o traçado tem 4,3 km de verdade, 1 u = 0,208 m. O centro de partida, (1306, 2915), é o do laço de ~140 m de diâmetro que o OpenStreetMap tem dentro da alça do fim
// da volta, no encaixe do traçado do jogo; a arquibancada em ferradura cabe em volta dele, de 94 m de semieixo, e a pista passa pelo vão. O Foro Sol de verdade é maior.)
const FORO_CENTRO = [1306, 2915];
function oForoSol(tr, { add }) {
  const A = 470, B = 440, fundo = 140, folga = 30, ok = (x, z) => livre(tr, x, z, folga) && !ocupado(tr, x, z);
  let melhor = null;
  for (let cx = FORO_CENTRO[0] - 160; cx <= FORO_CENTRO[0] + 160; cx += 20) for (let cz = FORO_CENTRO[1] - 160; cz <= FORO_CENTRO[1] + 160; cz += 20) {
    let bons = 0;
    for (let k = 0; k < 72; k++) {
      const t = (k / 72) * Math.PI * 2;
      if ([-8, 0, fundo].every((d) => ok(cx + (A - d) * Math.cos(t), cz + (B - d) * Math.sin(t)))) bons++;
    }
    if (!melhor || bons > melhor.bons) melhor = { cx, cz, bons };
  }
  if (!melhor || melhor.bons < 20) { tr.faltouMexico = (tr.faltouMexico || []).concat([{ nome: "foro" }]); return null; }
  const info = foroSol(tr, add, { cx: melhor.cx, cz: melhor.cz, A, B, fundo, ok });
  // reserva o estádio inteiro (as árvores e a torcida solta não entram)
  for (let u = -A; u <= A; u += 60) for (let v = -B; v <= B; v += 60) if ((u / A) ** 2 + (v / B) ** 2 <= 1.2) tr.reservado.push([melhor.cx + u, melhor.cz + v, 60]);
  tr.foroSol = info;
  const anterior = tr.animarPista;
  tr.animarPista = (dt, foco, t) => { anterior?.(dt, foco, t); info.fumaca.animar(t, foco); };
  return info;
}

// ---------------------------------------------------------------------------------------------------------------------
// 2. A reta dos boxes: o prédio das garagens e o paddock atrás
// ---------------------------------------------------------------------------------------------------------------------
function retaDosBoxes(tr, { add }, marcas) {
  const bx = tr.t.boxes || { lado: 1 };
  prediosDosBoxes(tr, add, { de: 0.984, ate: 1.062, lado: bx.lado, recuo: 62, torre: true, paineis: marcas.slice(0, 4), cores: { friso: "#006847" } });
  // as tendas do paddock atrás do prédio
  const p = tr.pts[indice(tr, 0.012)], atras = bx.lado * (tr.W / 2 + 62 + 46 + 90);
  const q = acharRet(tr, p.x + p.nx * atras, p.y + p.ny * atras, 0, 150, 60, { folga: 36, raio: 260, passo: 30 });
  if (q) {
    ["PADDOCK", "MÉXICO"].forEach((texto, k) => { const t = tendaPaddock({ modulos: 3, filas: 2, texto, corFaixa: k ? "#ce1126" : "#006847", corMesas: "#006847" }); t.position.set(q.x - 70 + k * 140, tr.chao(q.x, q.z) - 1, q.z); add(t); });
    reservarRet(tr, q.x, q.z, 0, 150, 60, 20); tr.paddockMexico = { x: Math.round(q.x), z: Math.round(q.z) };
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// O antes (cenario) e o depois (depois) do GP
// ---------------------------------------------------------------------------------------------------------------------
export function cenarioMexico(tr, ctx, marcas, ambiente) {
  tr.reservado ||= [];
  beiradaSolida(tr, ctx.add); // a base sólida da pista e a grama no nível do asfalto, dos dois lados (kit/mexico/chao.js)
  ambienteMexico(tr, ctx.add, ambiente); // painéis na barreira, mastros e placas de frenagem no chão, postos dos fiscais (kit/mexico/ambiente.js)
  oForoSol(tr, ctx);
  retaDosBoxes(tr, ctx, marcas);
  // o resto do parque, no lugar de verdade (OpenStreetMap, no encaixe do traçado): os campos e quadras de kit/mexico/dados.js; o Palácio dos Esportes (domo de 120 m) fica a ~1,5 km a oeste da
  // pista, fora do mundo (o chão vai 1400 u além dele); a Peraltada antiga é só uma curva de concreto de raio grande ao lado do Foro Sol (a posição exata dela não foi achada)
  peraltada(tr, ctx.add, { caixa: [500, 1300, 2300, 3300], raios: [500, 700], largura: 67 });
  palacioDosEsportes(tr, ctx.add, [-674, 2439], 2.62);
  camposDeEsporte(tr, ctx.add, CAMPOS);
  lagos(tr, ctx.add, [ // (o OpenStreetMap só mapeia um laguinho aqui, o do sul; os dois do miolo são enfeite do parque)
    { caixa: [2300, 3400, 2750, 3300], a: 190, b: 110 }, { caixa: [3700, 4900, 3500, 4200], a: 260, b: 150 }, { caixa: [4840, 4960, 7570, 7700], a: 68, b: 70 },
  ]);
}

export function depoisMexico(tr, ctx) {
  postesDRS(tr);
  arvoresDoParque(tr, ctx.add);
  cidade(tr, ctx.add);
  vulcoes(tr, ctx.add);
}

// as placas de DRS de pista.js (um sprite a 18 × a escala acima do ponto da pista, sem nada embaixo) ganham o poste até o chão; ele entra no mesmo grupo (tr.drsPlacas) e some e aparece junto
function postesDRS(tr) {
  if (!tr.drsPlacas) return;
  const { W, pts, n } = tr, E = tr.escala ?? 1, metal = M(0x697780), geo = new THREE.BoxGeometry(0.8, 1, 0.8);
  for (const [deteccao, abre] of tr.t.drs || []) for (const f of [deteccao, abre]) {
    const p = pts[Math.floor(f * n) % n], lado = W / 2 + 28, x = p.x + p.nx * lado, z = p.y + p.ny * lado, h = tr.chao(x, z), baixo = p.h + 18 * E - 6.5 * E; // a borda de baixo da placa
    const poste = new THREE.Mesh(geo, metal); poste.scale.y = baixo - h + 0.5 + 0.3; poste.position.set(x, h - 0.5 + poste.scale.y / 2, z); poste.castShadow = true; tr.drsPlacas.add(poste);
  }
}
