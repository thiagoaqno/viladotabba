# Apresentação da pista: o grid de 2 em 2 com os cards dos pilotos

O Thiago pediu que, na apresentação da pista, a ordem dos pilotos passasse de 2 em 2, com os cards deles e o nome.

- **O bloco "O grid de largada"** (`transmissao.js`) não mostra mais a lista inteira: mostra os dois cards de cada fila, da última até a pole. É o mesmo caminho que a câmera já faz entre os carros. A pole fica parada no fim, com a etiqueta POLE dourada.
- **Cada card (`cardDoGrid`):**
  - na cor da equipe;
  - o retrato em pixel art em 96 px (`retratoDoJogador`: o desenhado para os pilotos do grid, o do montador para os jogadores);
  - a posição grande, o nome e o sobrenome;
  - o logo e o nome da equipe e o número do carro;
  - o seu card ganha um contorno branco.
- **Tempo (pedido do Thiago: "aumentar o tempo total para uns 20 s, aí dá tempo de exibir tudo com calma"):** a transmissão da corrida avulsa passou de 8 para 20 s (`TV_AVULSA_MS`, `corrida-base.js`); a da temporada continua em 25 s. Os blocos (`BASE`) ficaram assim: pista 6 s, clima 2,5 s, campeonato 4,5 s e grid 12 s (antes 9,5 / 4 / 6,5 / 5). Dá cerca de 1 s por fila; ainda dá para pular.
- **Os cards grandes e em destaque:** a carta do grid fica centralizada embaixo, com até 1180 px de largura. Cada card tem até 212 px de altura, o retrato até 192 px, a posição até 76 px e o sobrenome até 44 px, tudo escalando com a altura da tela.
- **CSS (`transmissao.css`):** `.tvPares` e `.tvp*`, com uma versão menor para celular.
- **Conferido:** montei uma página estática com o CSS e dois cards para ver o visual, e a página do jogo carrega sem erros num servidor de teste. A transmissão em si não foi vista rodando.
