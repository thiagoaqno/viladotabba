# Meu piloto: o piloto de corpo inteiro na vitrine, e as tranças de verdade

O Thiago pediu duas coisas: que o piloto aparecesse de corpo inteiro, em pé, à direita, enquanto ele é montado na carreira; e que as tranças parecessem tranças.

## O corpo inteiro (`pixel-piloto.js`: `montarInteiro`, `retratoInteiro`)

- **A cabeça:** é a do retrato, com as mesmas peças. Embaixo dela, a figura é desenhada numa grade de 48×116.
- **O macacão:** na cor da equipe, com luz à esquerda e sombra à direita, faixa branca nas laterais do tronco, dos braços e das pernas, patrocínios no peito, zíper, gola e cinto com fivela.
- **O resto do corpo:** os braços se soltam do tronco abaixo dos ombros, com luvas escuras e punho na cor da equipe. As pernas têm os joelhos marcados, e as botas têm sola cinza.
- **O contorno:** escuro em volta de tudo, como no retrato.

## A vitrine (`temporada/index.html`, aba "Meu piloto")

- A tela da aba ficou em duas colunas: o montador à esquerda e o piloto inteiro à direita, ocupando o espaço vazio.
- O piloto aparece grande (até 700 px de altura), sobre um holofote na cor da equipe e com a sombra no chão. Ele "respira" devagar.
- A cada clique no montador, ele se redesenha com um pulinho.
- Em tela estreita, a vitrine vai para baixo do montador.

## As tranças (`cabelo`, estilo "trancas")

- **Antes:** saía uma touca de pontinhos.
- **Agora, em cima:** fileiras da testa para trás, cada uma com o trançado em zigue-zague e o sulco escuro entre elas.
- **Agora, nos lados:** três tranças soltas de cada lado, separadas por um vão, com o trançado e uma conta dourada na ponta.
- **Onde vale:** no piloto montado. O Hamilton do grid usa a imagem desenhada.

## Conferido

Desenhei folhas em PNG do corpo inteiro (5 pilotos) e das tranças. A aba da carreira abre num servidor de teste com a vitrine desenhada.

A novidade fica para depois do #966, que conserta o `novidades.json` da `main`.
