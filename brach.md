# Análise: sem os insights do engenheiro, e a Telemetria animada

O Thiago, com um print da Visão geral: "tira esses insights, ficaram feios e mal colocados"; e "em análise, na telemetria deve ser mais animado".

## Os insights saíram

O quadro "Insights do engenheiro" da Visão geral (#756) saiu inteiro: a função em `central-analise-geral.js` e o CSS em `central-abas.css`.

## A Telemetria animada (`temporada/central-telemetria.js`, `central-abas.css`)

- **A volta toca sozinha.** Os dois carros andam no mapa ao mesmo tempo: o seu na cor da equipe, o do outro piloto em cinza. Cada um anda na própria melhor volta, no tempo de verdade do replay, 3× mais rápido. Dá para ver quem está na frente em cada ponto da pista.
- **O cursor corre no gráfico da velocidade,** junto do seu carro.
- **O placar ao vivo:** o tempo da volta, a velocidade dos dois, a diferença no mesmo ponto da pista (verde quando você ganha, vermelho quando perde) e os seus pedais (acelerador e freio) subindo e descendo.
- **O mouse no gráfico** pausa e leva a volta até o ponto apontado. O botão toca e pausa.
- **Ao abrir a aba:**
  - os quadros entram um depois do outro;
  - o traçado colorido se desenha na ordem da volta;
  - as linhas da velocidade e do desgaste se desenham;
  - as faixas da estratégia crescem da esquerda.
- **Movimento reduzido:** com ele ligado no sistema, nada disso anima.

## A montagem antiga na carreira em grupo

O conserto do #758 (a montagem acima do orçamento pode ficar mais barata) não chegava na carreira com os amigos: `grupo-regras.js` não passava a montagem de agora para a conferência. Agora passa, e o carro antigo do grupo também destrava tirando níveis.

## Prints

Tirados com o servidor de teste e o Playwright, a 1600×900, com um GP simulado só na página (dois carros e um replay inventado para desenhar a tela), em dois momentos da volta: o mapa se desenhando, e os dois carros e o cursor andando. A diferença sai 0,00 s porque os dois carros simulados fazem a mesma volta. Nada foi visto com um GP corrido de verdade.

Entrada no topo de `novidades.json`. Conferido com `node --check` e `JSON.parse`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
