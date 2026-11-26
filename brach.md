# Corrida: a sombra do sol refeita a cada 2 quadros

Ideia trazida do Tiro da Galera (o Riposte só refaz as sombras de longe quando precisa). O Thiago preferiu fazer direto.

## Como era

A sombra do sol é um mapa único de 1024 × 1024 que cobre ±260 u em volta do carro (`cena.js`) e era refeita a cada quadro da
corrida, com todos os muros, prédios e carros. Os retrovisores e o recorte já não refaziam a sombra. A medição anotada em `cena.js`
(Mônaco, RTX 2060) dá ~0,6 ms por quadro para ela.

## O que mudou (`jogo.js`, `sombraDesteQuadro`)

- No quadro da corrida, a sombra do sol é refeita **em quadros alternados**. O mapa guarda a matriz com que foi feito, então a
  sombra continua certa e só a área dela atrasa um quadro (a 300 km/h o carro anda uns 6 u por quadro, contra os ±260 da área).
- **É refeita na hora** quando o mapa acabou de nascer (qualidade das sombras trocada) ou quando a área pulou mais de 40 u
  (câmera de TV, assistir outro carro).
- **Fora do quadro da corrida,** como no aquecimento antes da largada (que precisa desenhar a sombra para preparar os shaders do
  safety car), a sombra continua sendo refeita a cada desenho: o redesenho automático volta a valer logo depois do desenho
  principal.

## Conferido no navegador

Numa corrida rápida em Mônaco com 21 robôs, contei as passadas da sombra do sol: 116 quadros, 58 com uma passada e 58 sem nenhuma,
ou seja, 0,5 por quadro (antes, 1). Não apareceu erro de script. O ganho em milissegundos não deu para medir aqui, porque o navegador
do app roda na placa integrada (Intel); pela medição antiga, fica perto de 0,3 ms por quadro.

Também entrou uma linha em `public/corrida/novidades.json`, conferida com `JSON.parse`.
