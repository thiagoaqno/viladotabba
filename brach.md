# Tiro da Galera: sombras mais baratas

O Thiago mediu no PC dele (RTX 2060, Edge): na qualidade Alta, com as sombras ligadas, eram 402 chamadas de desenho e 13,4 ms
de processador por quadro. Numa tela de 144 Hz, isso trava o jogo em 72 fps. Com as sombras desligadas eram ~180 chamadas e
7,7 ms. O gargalo é o processador montando o desenho, não a placa (7,5 ms de GPU).

## O que mudou (no `updateShadows` do jogo, pelo `ferramentas/tiro-frontline.js`)

As sombras são feitas em 3 faixas de distância (CSM). A de perto continua sendo redesenhada todo quadro. As duas de longe
(além de ~15 m):
- **passam a ser redesenhadas a cada 4 quadros em vez de 2**, ainda alternadas (nunca as duas no mesmo quadro);
- **só são forçadas por movimento da câmera num giro de 11° ou num deslocamento de 2 m** desde o último redesenho. Antes era
  1,5° ou 0,3 m, ou seja, quase todo quadro de quem está mirando.

## Quanto ganha

Simulei a regra antiga e a nova com a câmera girando:

| | parada | 90°/s | 180°/s | 360°/s |
| --- | --- | --- | --- | --- |
| antes (144 fps) | 2,0 | 2,0 | 2,0 | 3,0 |
| depois (144 fps) | 1,5 | 1,5 | 1,5 | 1,5 |
| antes (72 fps) | 2,0 | 2,0 | 3,0 | 3,0 |
| depois (72 fps) | 1,5 | 1,5 | 1,5 | 2,0 |

São passadas de sombra por quadro: de 25 a 50% menos trabalho de sombra.

## O custo visual

A sombra de um objeto que se mexe lá longe (um bot correndo a mais de 15 m) atualiza 36 vezes por segundo em vez de 72. Num giro
muito rápido, a borda da tela pode ficar um quadro sem a sombra de longe. Precisa ser conferido jogando.

## Conferido

A página continua sem erro de sintaxe, e o patch carregou no navegador (limites novos lidos, 3 faixas ativas). A partida não roda
com o painel do navegador escondido, então o teste jogando fica com o Thiago.
