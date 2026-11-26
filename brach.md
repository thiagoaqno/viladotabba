# Tiro da Galera: opção de brilho e editor de mira

## Brilho (Opções > Vídeo > Imagem)

- **De 60% a 180%,** com padrão de 100% (a imagem de antes).
- **Multiplica a exposição no shader final do jogo (`FinalShader`), antes da curva de cor (ACES).** Isso clareia as partes escuras
  sem estourar o céu, como o brilho de um jogo, e não custa nada a mais. Esse shader roda em todas as qualidades.
- **O valor é reaplicado a cada quadro da partida,** porque o jogo recria os passes quando a qualidade muda.

## Desenho da mira (Opções > Jogo, seção nova depois de Interface)

O nome "Mira" já é a seção da pontaria (sensibilidade, campo de visão), então a nova se chama "Desenho da mira":
- **Estilo:** cruz, cruz com ponto, só o ponto ou círculo;
- **Cor:** branca, verde, ciano, amarela, rosa ou vermelha;
- **Tamanho das linhas** (3 a 24 px), **espessura** (1 a 5 px), **espaço no meio** (0 a 20 px) e **opacidade**;
- **"Mira que abre com o movimento e o tiro":** desligada, a mira fica fixa;
- **Contorno escuro.**

Os padrões são exatamente a mira de antes: cruz branca a 92%, linhas de 11 px, 2 px de espessura, abrindo com o movimento.

**Como:** a mira do jogo é feita de 5 pedaços de HTML (`#xhair`). Um CSS novo troca os números fixos por variáveis, que
`miraAplicar()` preenche a partir dos ajustes. O jogo continua mandando o quanto a mira abre (`--gap`); com a mira fixa, esse
valor é multiplicado por 0. Os ajustes ficam em `dc_settings`, então vão junto com o perfil da Vila. Tudo é feito pelo
`ferramentas/tiro-frontline.js`.

## Conferido no navegador

- O brilho aparece na aba Vídeo em 100%, e o valor chega ao shader (testado com 1,4).
- A seção da mira aparece depois de "Tela cheia na partida", com todas as opções e os valores de antes.
- Círculo verde de 4 px: sem as linhas, com borda verde e redondo. Cruz com ponto e linhas de 18 px: linhas 18 × 4 px, ponto de
  5 px.
- Deslocamento do pedaço da direita, com a HUD visível: 20 px no padrão (como antes), 10 px com a mira fixa e 10 px de espaço,
  30 px com a mira que abre e 10 px de espaço.
