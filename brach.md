# Tiro da Galera: janela na frente do avião e janelão de vidro no corredor do terminal

- **Avião (`kcAAviao`):**
  - a cabine de passageiros continua até o nariz, com a cabine dos pilotos (dois bancos e painel);
  - em volta do nariz, uma faixa de janela aberta de 1,1 a 2,0 m do piso: de fora se vê (e se acerta) a cabeça e a parte de cima do tronco de quem está lá dentro;
  - na faixa, parede invisível (`KC_INVIS`): a bala passa e ninguém pula do nariz.
- **Vidro que quebra (objeto `kcVidro`):** um tiro estilhaça o painel. O tamanho vai em `a: [largura, altura]`. É o mesmo jeito das janelas do Iate, que não entram mais no jogo.
- **Aeroporto:** o corredor da frente do terminal ganhou um janelão de 20 painéis `kcVidro` (15 + 5, dos dois lados da ponte de embarque), do guarda-corpo até 9,4 m, com montantes, viga e o teto fechando a faixa da frente.

Conferido no navegador:
- o avião monta, e pela janela do nariz se vê a cabine dos pilotos;
- as 3 paredes invisíveis da faixa estão no lugar;
- os 20 vidros estão no mapa, com 1 de vida cada;
- a cabine de passageiros e a frente do terminal continuam na rede dos bots.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
