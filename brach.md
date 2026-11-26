# Tiro da Galera: ninguém nasce dentro de área de dominação; pontos dos bots da Favela redistribuídos

- **Nascer fora das áreas de domínio (todos os mapas, modo dominação):**
  - ao renascer, o jogo usava também os pontos de campo (os pontos dos bots), e só evitava as áreas em disputa ou do inimigo; um ponto neutro ou do próprio time podia ter gente nascendo dentro;
  - agora os pontos de campo a menos de 8 m do centro de qualquer ponto de dominação saem da lista, e qualquer lugar nessa distância ganha nota muito baixa (só se usa se não houver outro). A área tem 5,5 m de raio;
  - são duas trocas em `tiro-frontline.js`.
- **Pontos dos bots da Favela redistribuídos:** 171 pontos tirados da rede de caminhos da versão 4 do mapa, um a cada 7 m no chão e a cada 9 m no alto. Ficaram 51 no oeste, 54 no meio e 66 no leste; 74 ficam no alto, 26 deles de segurar posição.

Conferido no navegador:
- foram 1.650 renascimentos no modo dominação, com 5 combinações de donos dos pontos (todos neutros, todos de um time, todos do outro e misturados);
- nenhum caiu dentro de uma área; o mais perto ficou a 6,4 m do centro;
- os nascer de base da Favela ficam a pelo menos 20 m de qualquer ponto de dominação.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
