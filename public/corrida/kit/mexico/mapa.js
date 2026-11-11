// Cidade do México — a planta de verdade do Foro Sol, do prédio dos boxes e das tribunas, no encaixe do traçado do jogo. A fonte é o OpenStreetMap (© colaboradores do
// OpenStreetMap, licença ODbL): os contornos `building=grandstand` e `building=bridge` do estádio, o `building=yes` "Paddock" (3 andares, parede seashell, telhado indianred) e as
// arquibancadas da reta e da saída da Peraltada, mais a linha `highway=raceway` da Peraltada antiga. Cada número é um ponto do mapa já convertido para o jogo (1 u = 0,2083 m, 4,8 u/m).
//
// O encaixe: a linha central real (bacinger/f1-circuits mx-1962, a mesma do traçado) é ajustada ao mapa pela ferramenta `ferramentas/pista-real.js` (erro médio de 43 u no circuito
// inteiro, 9 m); aqui, com a mesma linha, um segundo ajuste só da região, pela linha de F1 do OpenStreetMap (a saída da curva 12, a travessia do estádio e o início da reta dos boxes):
//  · o estádio e o que está a oeste de x = 1750: giro de 0,03 rad em volta de (1300, 2500) e deslocamento (-10, -30); erro médio de 7,7 u (1,6 m) contra os 22 u de antes;
//  · a reta dos boxes (prédio, tribunas): giro de 0,005 rad em volta de (2300, 2000) e deslocamento (0, -30); erro médio de 2,8 u (0,6 m) contra 30 u.
// O Foro Sol tem duas arquibancadas, a Norte e a Sul, cada uma em L com o canto de fora arredondado, e um corredor coberto que liga as duas pontas por cima da pista, na saída do estádio:
// a pista entra pelo lado aberto (leste), cruza o campo entre as duas e passa por baixo desse corredor (a Wikipédia e o oversteer48 descrevem o traçado de 2015 como "pelo meio das duas metades do estádio").

// O Foro Sol: a frente de cada arquibancada (a borda do lado do campo: ponta de leste, o canto e a ponta de oeste) e a profundidade (a medida entre a frente e a parede de trás, 171 u = 35,6 m:
// os dois lados do contorno do OpenStreetMap, 172 u na perna de leste e 164 u na de oeste, e a curva de fora do canto é um arco de raio 170 em volta do canto da frente).
export const FORO = {
  profundidade: 171,
  norte: { frente: [[1693, 2189], [1173, 2184], [1141, 2374]], contorno: [[1696, 2017], [1191, 2010], [1169, 2010], [1126, 2019], [1092, 2034], [1057, 2057], [1032, 2087], [1016, 2123], [1006, 2162], [979, 2352], [1077, 2366], [1141, 2374], [1167, 2187], [1179, 2182], [1693, 2189]] },
  sul: { frente: [[1600, 2841], [1101, 2697], [1122, 2506]], contorno: [[1554, 3006], [1068, 2871], [1047, 2864], [1009, 2844], [980, 2820], [952, 2788], [937, 2752], [932, 2712], [935, 2671], [960, 2483], [1059, 2497], [1122, 2506], [1096, 2691], [1106, 2703], [1600, 2841]] },
  // o corredor coberto sobre a pista (a ponte do mapa): os quatro cantos, do lado da Norte para o da Sul
  ponte: [[979, 2352], [1077, 2366], [1059, 2497], [960, 2483]],
};

// A Peraltada antiga (`highway=raceway` sem nome, a primeira metade da curva que a F1 não usa mais): do fim da reta de trás, por fora do estádio, até a saída do circuito de hoje.
export const PERALTADA_ANTIGA = [[1434, 3177], [1344, 3156], [1269, 3132], [1197, 3103], [1142, 3073], [1074, 3026], [1013, 2975], [999, 2961], [948, 2911], [901, 2850], [892, 2836], [851, 2757], [831, 2706], [817, 2674], [809, 2642], [799, 2597], [792, 2540], [791, 2469], [794, 2408], [794, 2391], [800, 2323]];

// O prédio dos boxes ("Paddock", `building:levels` 3): a planta de 307 m, com as seis fatias de 48 m e as cinco saliências (as escadas e os elevadores) do lado de trás.
export const PREDIO_DOS_BOXES = [[2631, 2220], [2433, 2192], [2427, 2236], [2388, 2229], [2393, 2186], [2199, 2159], [2194, 2201], [2159, 2196], [2164, 2154], [1964, 2126], [1959, 2168], [1927, 2163], [1933, 2121], [1898, 2117], [1895, 2141], [1724, 2117], [1733, 2057], [1744, 2058], [1746, 2041], [1735, 2040], [1745, 1970], [3197, 2175], [3170, 2369], [3087, 2358], [3097, 2285], [2900, 2257], [2893, 2303], [2854, 2297], [2861, 2252], [2665, 2225], [2659, 2269], [2625, 2264], [2631, 2220]];

// Os blocos de dois andares atrás do prédio (os escritórios e o hospitality das equipes; `building:levels` 2).
export const BLOCOS_ATRAS = [[[2112, 2408], [2191, 2419], [2280, 2432], [2252, 2637], [2084, 2614], [2112, 2408]], [[2368, 2501], [2518, 2520], [2523, 2476], [2636, 2490], [2611, 2682], [2350, 2648], [2368, 2501]]];

// As tribunas da reta dos boxes, do lado de fora (o norte): cada uma é um quadrilátero [canto, canto, canto, canto] com a borda da frente primeiro (a mais perto da pista).
// A principal (`building=grandstand`, 850 u = 177 m de comprimento por 80 u = 17 m de fundo) e as duas vizinhas; entre a primeira e a principal fica o túnel de pedestres.
export const TRIBUNAS_RETA = [
  { nome: "antes", frente: [[1637, 1682], [1895, 1721]], tras: [[1646, 1627], [1904, 1665]] },
  { nome: "principal", frente: [[1967, 1721], [2815, 1841]], tras: [[1979, 1641], [2826, 1761]] },
  { nome: "depois", frente: [[2881, 1849], [3310, 1911]], tras: [[2892, 1769], [3322, 1830]] },
];

// As seis arquibancadas pequenas (`leisure=bleachers`) do lado de fora da saída da Peraltada, antes da reta dos boxes, da primeira (a oeste) à última: [frente, frente, trás, trás].
export const ARQUIBANCADAS_SAIDA = [
  [[1001, 1857], [1076, 1798], [1052, 1769], [978, 1823]], [[1085, 1795], [1164, 1750], [1145, 1715], [1065, 1760]], [[1172, 1745], [1255, 1714], [1241, 1677], [1158, 1708]],
  [[1267, 1709], [1356, 1691], [1349, 1652], [1260, 1671]], [[1364, 1650], [1366, 1688], [1458, 1682], [1455, 1643]], [[1468, 1683], [1558, 1686], [1561, 1646], [1468, 1642]],
];
