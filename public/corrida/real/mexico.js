// Cidade do México (Autódromo Hermanos Rodríguez, dentro do parque Magdalena Mixhuca): o que só o circuito tem, em cima do kit. O resto (zebras, escape,
// arquibancadas, painéis, passarelas e som) é do kit, na configuração de gps/mexico.js; as peças exclusivas estão em kit/mexico/. Aqui, na ordem em que
// aparecem (frações da volta, a partir da linha de chegada, que fica no meio da reta dos boxes; o traçado vai para leste, a curva 1 é à direita):
// 1. o Foro Sol, o estádio de beisebol no miolo da alça do fim da volta (0,87-0,94), no lugar de verdade (planta do OpenStreetMap: kit/mexico/mapa.js): as duas arquibancadas, a Norte e a Sul, em L,
//    de dois andares e cobertura de chocolate, com a pista cruzando o campo ENTRE elas e saindo por baixo do corredor coberto que liga as duas pontas; o pódio no meio do campo, as bandeiras do México,
//    as torres de luz e a fumaça tricolor;
// 2. a reta dos boxes (muito longa): o prédio dos boxes de seis fatias com a torre de controle na ponta de oeste e os blocos de hospitality atrás, a tribuna principal e as vizinhas do lado de fora
//    e as seis arquibancadas pequenas da saída da Peraltada, cada uma na planta de verdade; o Palácio dos Esportes, de cúpula de cobre, ao fundo;
// 3. o parque Magdalena Mixhuca: lagos, quadras, jacarandás, ahuehuetes, eucaliptos e pinheiros;
// 4. a Peraltada antiga, a curva inclinada que ficou de fora do circuito, por fora do estádio, no traçado de verdade;
// 5. o horizonte: a cidade baixa de cores quentes, a Torre Latinoamericana e os vulcões Popocatépetl e Iztaccíhuatl na névoa da altitude.
// Tudo é cenário: nada fica dentro da pista (livre/ocupado) e a física é a de sempre. Sem marcas registradas novas: os painéis são nomes de lugar e de
// comida do México (kit/mexico/marcas.js) e as marcas que o kit já tem.
import * as THREE from "three";
import { M } from "../cena.js";
import { registrarMarcasMexico } from "./kit/mexico/marcas.js";
import { foroSol } from "./kit/mexico/foro.js";
import { predioDosBoxes, tribunasDaReta } from "./kit/mexico/boxes.js";
import { PERALTADA_ANTIGA } from "./kit/mexico/mapa.js";
import { arvoresDoParque, lagos, camposDeEsporte, palacioDosEsportes, peraltada } from "./kit/mexico/parque.js";
import { CAMPOS } from "./kit/mexico/dados.js";
import { cidade, vulcoes } from "./kit/mexico/horizonte.js";
import { beiradaSolida } from "./kit/mexico/chao.js";
import { ambienteMexico } from "./kit/mexico/ambiente.js";

registrarMarcasMexico();

// ---------------------------------------------------------------------------------------------------------------------
// O antes (cenario) e o depois (depois) do GP
// ---------------------------------------------------------------------------------------------------------------------
export function cenarioMexico(tr, ctx, marcas, ambiente) {
  tr.reservado ||= [];
  beiradaSolida(tr, ctx.add); // a base sólida da pista e a grama no nível do asfalto, dos dois lados (kit/mexico/chao.js)
  ambienteMexico(tr, ctx.add, ambiente); // painéis na barreira, mastros e placas de frenagem no chão, postos dos fiscais (kit/mexico/ambiente.js)
  const foro = foroSol(tr, ctx.add); // o Foro Sol no lugar de verdade, com a pista passando pelo vão entre as duas arquibancadas
  tr.foroSol = foro;
  const anterior = tr.animarPista;
  tr.animarPista = (dt, foco, t) => { anterior?.(dt, foco, t); foro.fumaca.animar(t, foco); };
  predioDosBoxes(tr, ctx.add); // o prédio dos boxes, a torre de controle e os blocos atrás (kit/mexico/boxes.js)
  tribunasDaReta(tr, ctx.add); // as tribunas da reta e as arquibancadas da saída da Peraltada
  // o resto do parque, no lugar de verdade (OpenStreetMap, no encaixe do traçado): os campos e quadras de kit/mexico/dados.js; o Palácio dos Esportes (domo de 120 m) fica a ~1,5 km a oeste da
  // pista, fora do mundo (o chão vai 1400 u além dele); a Peraltada antiga segue a linha `raceway` do mapa, por fora do estádio
  peraltada(tr, ctx.add, PERALTADA_ANTIGA);
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
