# Análise da corrida no resultado do GP: posições, ritmo e pneus

Segundo PR do pós-corrida interativo, depois das logos (#742). A análise volta a volta já existia, mas só para a carreira: `corrida-analise.js` anota cada volta de cada carro em toda sala com regras de F1 (a posição ao cruzar a linha, o tempo, os 3 setores, os pits e as voltas de safety car). Nas salas com os amigos fora da carreira, o resumo era jogado fora. Agora ele aparece embaixo da tabela do resultado.

## O que mudou

- **Servidor** (`corrida.js`): no fim do GP guarda `room.analiseGP = Analise.resumo(room, p => p.id)`, dentro de um `try`, porque um erro na análise nunca pode perder o resultado. Ele vai pelo evento novo `analise`, pedido uma vez pela tela do resultado, e não no estado, que sai várias vezes por segundo. `Analise.limpar` zera o resumo na largada seguinte.
- **Tela do resultado** (`resultado-analise.js`, novo, e `resultado-gp.css`): uma caixa "Análise da corrida" na cor da sua equipe, com três abas:
  - **Posições:** o gráfico volta a volta de todos, do grid à bandeirada, na cor da equipe (o segundo carro da equipe vem tracejado). Com o mouse, a linha mais perto se acende e as outras apagam; a dica mostra a posição e o tempo daquela volta, o pit (com o pneu novo) e o safety car. As faixas amarelas são as voltas de safety car, e as bolinhas são os pits.
  - **Ritmo:** o tempo de cada volta de A (você, ou o vencedor para quem só assiste) e de B, com a diferença volta a volta na dica. A escala ignora as voltas de pit e de safety car, para não achatar o resto. Os cartões mostram só números medidos: a melhor volta (e em qual volta), a média e a constância (desvio-padrão) das voltas limpas e os setores da melhor volta.
  - **Pneus:** os stints de cada piloto na ordem de chegada, na cor do composto, com hover em cada stint (pneu e voltas).
- **Escolher com quem comparar:** clicar numa linha do gráfico, numa fila dos pneus ou numa linha da tabela do resultado faz daquele piloto o B e abre o Ritmo. O B padrão é o carro que chegou logo à sua frente.
- Sem regras de F1, ou sem voltas anotadas, a caixa não aparece.
- Entrada nova no topo de `novidades.json`.

Conferido só com `node --check` e `JSON.parse`. O teste jogando fica com o Thiago.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
