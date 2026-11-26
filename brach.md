# Tiro da Galera: mais cinco prédios de favela, três com escada de verdade

Peças novas no editor de mapas (aba Prefabs), de tamanhos diferentes:

- **Sem escada:**
  - **Torre** de cinco andares (15 m de altura), estreita, cada andar de uma cor;
  - **Comércio** largo de dois andares, com três portas de enrolar coloridas.
- **Com escada:**
  - **Escada pelo lado:** sobe a um terraço grande a 2,95 m;
  - **Escada até o telhado:** dois lances até a laje a 5,9 m, com mureta;
  - **Escada nos fundos:** sobe a um terraço a 2,95 m atrás do quarto.

**Escada de prefab (novo):** um prefab pode trazer escadas (`KC_ESCADAS[nome]`, em coordenadas da peça). No mapa, o `mapa-json.js` transforma cada uma em rampa do jogo e em degraus que colidem, girados junto com a peça (de 90 em 90 graus). Assim o jogador e os bots sobem.

As escadas têm 2,4 m de largura: com 1,8 m, a grade de 1 m dos bots às vezes não tinha onde pôr um ponto, dependendo da posição do prédio no mapa.

Conferido no navegador: as 5 peças montam. Fiz um teste com as três peças com escada nas quatro direções e em quatro posições diferentes da grade: em todos os 32 pontos de terraço e de laje, os bots acham caminho até lá em cima.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
