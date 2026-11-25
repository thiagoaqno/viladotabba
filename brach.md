# Apresentação da pista: o grid de largada fila a fila, no estilo da transmissão

O Thiago pediu que, na apresentação da pista, a ordem dos pilotos passasse de 2 em 2 com os cards deles, grandes e em destaque. Depois mandou o print do "Starting grid" da transmissão do jogo da F1 como referência.

## O painel (`transmissao.js`: `cartaGrid`, `ladoDoGrid`, `meioDoGrid`; `transmissao.css`: `.tvGridP`, `.tgp*`)

- **O painel:** ocupa a tela quase inteira. Em cima vêm "Fórmula 1 · <pista> <ano>" e o título "Grid de largada".
- **Cada lado, um piloto da fila da vez:**
  - a posição enorme ("17º") no alto;
  - o retrato em pixel art grande, de até 384 px;
  - embaixo, o logo da equipe, o nome e o sobrenome em letras grandes;
  - o tempo da classificação e a diferença para a pole em vermelho, quando houve classificação (`E.S.quali.tabela`).
- **O meio:** o grid em zigue-zague, com os ímpares à esquerda e os pares à direita, um pouco abaixo. Ele é preenchido da pole para trás com a sigla na cor da equipe, e a fila da vez fica sublinhada.
- **A ordem:** os pares vão da pole até a última fila, como na referência. A câmera do bloco agora anda no mesmo sentido, da pole para trás.
- **No celular:** o meio some e os dois lados dividem a tela.

## O tempo

O Thiago pediu: "pode aumentar o tempo total para uns 20 s, aí dá tempo de exibir tudo com calma".

- A transmissão da corrida avulsa passou de 8 para 20 s (`TV_AVULSA_MS`, `corrida-base.js`). A da temporada continua em 25 s.
- Os blocos (`BASE`) ficaram assim: pista 6 s, clima 2,5 s, campeonato 4,5 s e grid 12 s. Antes eram 9,5 / 4 / 6,5 / 5.
- Dá cerca de 1 s por fila, e ainda dá para pular.

## Conferido

Montei uma página estática com o CSS e uma fila de exemplo para ver o visual, e a página do jogo carrega sem erros num servidor de teste. A transmissão rodando com a câmera não foi vista.
