# Análise da carreira na interface nova

O Thiago mandou a interface nova da Análise: o layout, as funções e os temas claro e escuro. No replay e na análise, ele pediu animações e itens que respondem ao mouse. As abas ficaram na ordem que ele aprovou: Replay, Visão geral, Desempenho, Pneus, Estratégia, Voltas e Eventos.

## O que mudou

- **Cabeçalho** (`central-analise.js`, `central.css`): a bandeira do país com o filete na cor da equipe, "/ Análise da corrida", o GP em letra grande, "Etapa X / Y · circuito" e a foto da cidade (`GpInfo.fundoDe`, as mesmas fotos dos GPs) esmaecendo à direita. Vale no tema claro e no escuro.
- **Visão geral** (`central-analise-geral.js`, novo):
  - a faixa com o vencedor, a volta mais rápida (com a volta) e o melhor de cada setor, com o logo de cada um;
  - o **mapa da corrida** em 3D (veja abaixo);
  - o **resultado final**: os 5 primeiros, com a diferença (tempo, voltas a menos ou abandono) e os pontos; "Ver todos" abre o grid inteiro;
  - o **desempenho por setor**;
  - as **estratégias em destaque**: quantas paradas fez quem terminou, a parte do grid em cada uma, o melhor colocado e os pneus dele;
  - os **destaques**: o vencedor, a volta mais rápida, o maior ganho e a maior queda de posições, as ultrapassagens e quem mais passou;
  - as **informações da corrida**: tempo, voltas, paradas, ultrapassagens, safety car, bandeiras amarelas e condições.
  - Só números que o jogo mede: sem temperatura, e sem distância em km, porque a escala das pistas é a antiga.
- **Mapa da corrida** (`resultado-analise.js`, aba `mapa`): em "Posições", os carros, cada um com o logo da equipe, refazem a última volta do vencedor em loop, no dobro da velocidade e com a posição interpolada entre as amostras; clicar num carro diz quem é e a posição final. "Traçado" mostra só a pista, os setores, as curvas e o carrinho de luz. Sem replay gravado, fica o Traçado. Os rótulos dos carros da miniatura agora aceitam o logo (`gp-miniatura.js`).
- **Desempenho:** os três setores em quadros, com o melhor de cada um em destaque e os 5 primeiros em barras na cor da equipe e com a diferença. Embaixo vêm o gráfico das posições (3D), "O seu desempenho" (a visão antiga: resultado, tempos, ritmo e comparação por setor) e a distância para o líder.
- **Pneus:** a tabela com o logo, o piloto, os pneus de cada stint (com a dica do composto e das voltas), as paradas, as voltas e o tempo no box, com abas por equipe.
- **Eventos:** os momentos e as ultrapassagens juntos na mesma lista e no mapa. Cada ultrapassagem tem o botão "Replay", que abre o Replay na manobra.
- **Animação e mouse:** os cartões entram em sequência, as linhas deslizam e as barras crescem (com "reduzir movimento" desligado); os cartões sobem no hover, e as linhas e os pneus reagem ao mouse. No Replay, passar o mouse num piloto da torre acende o carro dele na pista.

Entrada no topo de `novidades.json`. Conferido com `node --check` e `JSON.parse`. O teste jogando fica com o Thiago.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
