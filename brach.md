# Pós-corrida interativo: análise da corrida, momentos sobre a pista em 3D e guia do GP

Junta três pedidos do Thiago num PR só (ele pediu um merge só): a análise da corrida (posições, ritmo e pneus), os momentos da corrida sobre uma miniatura 3D da pista e o guia do GP na ficha "Sobre o GP".

## 1. Análise da corrida no resultado do GP

A análise volta a volta já existia, mas só para a carreira: `corrida-analise.js` anota cada volta de cada carro em toda sala com regras de F1 (a posição ao cruzar a linha, o tempo, os 3 setores, os pits e as voltas de safety car). Nas salas com os amigos fora da carreira, o resumo era jogado fora.

- **Servidor** (`corrida.js`): no fim do GP guarda `room.analiseGP = Analise.resumo(room, p => p.id)`, dentro de um `try`, porque um erro na análise nunca pode perder o resultado. Ele vai pelo evento novo `analise`, pedido uma vez pela tela do resultado, e não no estado, que sai várias vezes por segundo. `Analise.limpar` zera o resumo na largada seguinte.
- **Tela do resultado** (`resultado-analise.js`, novo): uma caixa "Análise da corrida" na cor da sua equipe, com quatro abas:
  - **Posições:** o gráfico volta a volta de todos, na cor da equipe (o segundo carro tracejado). Com o mouse, a linha mais perto se acende e a dica mostra a posição, o tempo, o pit e o safety car daquela volta.
  - **Momentos:** veja a seção 2.
  - **Ritmo:** o tempo de cada volta de A (você, ou o vencedor para quem só assiste) e de B, com a diferença volta a volta. A escala ignora as voltas de pit e de safety car. Os cartões mostram só números medidos: a melhor volta, a média e a constância das voltas limpas e os setores da melhor volta.
  - **Pneus:** os stints de cada piloto na cor do composto, com hover.
- Clicar num piloto (no gráfico, nos pneus ou na tabela do resultado) faz dele o B e abre o Ritmo. O B padrão é o carro que chegou logo à sua frente.

## 2. Momentos da corrida sobre a miniatura 3D da pista

- **Servidor:** a função `log` de `corrida.js` passa cada linha da direção de prova para `Analise.evento`, que anota a hora desde a largada, a volta do líder e, quando a linha fala de um piloto, a fração da volta em que ele estava (`pontoDoCarro`). Ficam de fora a bandeira azul e cada chegada, que encheriam a lista. O limite é de 300 por corrida. Os momentos vão no mesmo resumo `analise`.
- **Rádio** (`radio.js`): guarda o que o engenheiro falou (a hora e o texto, sem o observador do carro ao lado), num histórico de no máximo 200 falas (`Radio.historico()`). A tela converte a hora para a do servidor e mostra só o que caiu dentro desta corrida.
- **Miniatura 3D** (`gp-miniatura.js`, novo, reaproveitável): o traçado em relevo, desenhado em código a partir de `Pistas.pontos`, sem modelo baixado:
  - a parede translúcida até a base, como no mapa 3D da transmissão;
  - a linha dos 3 setores, a largada quadriculada e um carrinho de luz dando a volta com rastro na cor da equipe;
  - os pinos dos momentos, que pulsam;
  - os números das curvas, que seguem a câmera.
  - O relevo é exagerado para aparecer, como na TV, e não mostra metros.
  - Arrastar gira, a roda aproxima, e o giro automático volta 6 s depois. Com o mouse na pista aparecem a fração da volta e a curva mais perto. Passar o mouse num pino acende o pino e o momento; clicar leva a câmera até lá.
  - Só desenha com a caixa na página e solta tudo ao sair. Sem WebGL, cai no mapa 2D.
- **Aba Momentos:**
  - a lista com filtros: largada, pits, batidas, punições, bandeiras, recordes e rádio;
  - a linha do tempo por volta, com as faixas de safety car;
  - o botão ▶, que refaz a corrida em 14 s, soltando cada pino na hora em que o momento aconteceu.
  - Dois cliques num momento de outro piloto comparam o ritmo com ele.

## 3. Guia do GP na ficha "Sobre o GP"

- `gp-guia.js` (novo) troca o mapa da ficha pela miniatura 3D com os números das curvas, com um botão para voltar ao mapa 2D; a escolha fica guardada no navegador. Passar o mouse numa curva da lista acende o número no 3D (o mesmo `data-n` de sempre), e clicar leva a câmera até ela.
- `gp-curiosidades.js` (novo): a história de cada circuito real e as curvas famosas. São só fatos conhecidos, sem recorde de volta nem número que mude a cada ano; os recordes da ficha continuam sendo os do jogo. Cada card de curva acha a curva pelo nome de `gp-info.js` e leva a câmera até ela.
- `menus.js`: monta o guia quando a ficha é desenhada e solta a miniatura quando ela fecha. A ficha da carreira (Central) ainda não tem o guia.

Entrada no topo de `novidades.json`. Conferido só com `node --check` e `JSON.parse`. O teste jogando fica com o Thiago.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
