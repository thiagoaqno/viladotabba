# Retratos e capacetes em pixel art dos 22 pilotos do grid

O Thiago mandou duas folhas de pixel art, uma com os rostos e outra com os capacetes dos pilotos, e pediu os pilotos do grid "mais trabalhados".

## As imagens (`public/corrida/pilotos-pixel/`)

- `rosto/<SIGLA>.png` e `capacete/<SIGLA>.png`, com 64 px de largura e o fundo escuro, como uma foto. Somam 248 KB.
- **Como foram cortadas das folhas (por ferramenta, fora do jogo):**
  - cada quadro virou uma grade de 64 px, com a cor de cada bloco tirada pela mediana do meio dele;
  - a paleta foi reduzida a 28 cores por quadro, para o pixel ficar limpo.
- **Macacões repintados:** a folha veio com o macacão verde da Sauber em quatro pilotos. O de Hülkenberg e Bortoleto foi repintado para a Audi, e o de Pérez e Bottas para a Cadillac.
- **Sobras:** sobraram dois rostos (`extra1` e `extra2`) e oito capacetes (`extra1` a `extra8`). Ficam para os jogadores ou para o montador.

## No jogo (`pixel-piloto.js`)

- `retratoDoJogador` usa a imagem desenhada para os 22 pilotos de 2026, quando é robô. Para os outros (jogadores e pilotos de outras temporadas), usa o retrato montado por peças.
- `capaceteDoJogador` é nova: devolve o capacete desenhado dos pilotos do grid.
- O retrato montado por peças ganhou olhos novos: o Thiago achou os de antes "muito feios". Agora são uma íris redonda centrada, com brilho e pupila, uma pálpebra de um traço só e a sobrancelha mais alta. O cabelo ganhou um brilho limpo no lugar da textura de pontos. Isso também conserta um erro: o brilho caía em cima da pupila do olho esquerdo.
- O aviso de novo líder mostra o retrato em 64 px, sem escala quebrada.
