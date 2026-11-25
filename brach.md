# Apresentação da pista: o grid de 2 em 2 com os cards dos pilotos

O Thiago pediu que, na apresentação da pista, a ordem dos pilotos passasse de 2 em 2, com os cards deles e o nome.

- **O bloco "O grid de largada"** (`transmissao.js`) não mostra mais a lista inteira: mostra os dois cards de cada fila, da última até a pole. É o mesmo caminho que a câmera já faz entre os carros. A pole fica parada no fim, com a etiqueta POLE dourada.
- **Cada card (`cardDoGrid`):**
  - na cor da equipe;
  - o retrato em pixel art em 96 px (`retratoDoJogador`: o desenhado para os pilotos do grid, o do montador para os jogadores);
  - a posição grande, o nome e o sobrenome;
  - o logo e o nome da equipe e o número do carro;
  - o seu card ganha um contorno branco.
- **Tempos dos blocos (`BASE`):** o grid passou de 5 para 9,5 s, para os 11 pares terem tempo de aparecer. A pista passou de 9,5 para 7 s, o clima de 4 para 3 s e o campeonato de 6,5 para 5,5 s. O total é o mesmo (25 s numa temporada), porque quem define é o servidor (`tvAte`).
- **CSS (`transmissao.css`):** `.tvPares` e `.tvp*`, com uma versão menor para celular.
- **Conferido:** montei uma página estática com o CSS e dois cards para ver o visual, e a página do jogo carrega sem erros num servidor de teste. A transmissão em si não foi vista rodando.
