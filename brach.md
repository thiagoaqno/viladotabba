# Jogabilidade: a largada espera todos, robôs sem microtravadas, níveis pelo tempo do Thiago, direção igual para todos e bateria de 2026

Depois da escala real, o Thiago jogou e listou: a corrida começava antes de ele terminar de carregar, os robôs davam microtravadinhas, até o fácil estava difícil e o carro "ia muito para o lado" a cada toque no A ou no D.

- **A largada espera todo mundo carregar:** a transmissão de TV (20 s na avulsa, 25 s na carreira) e as luzes só seguem quando todos os jogadores conectados já carregaram a pista. O navegador manda `carregou` quando a cena desenha, e aí a TV encurta para o tempo dela a partir dali, pelo mesmo caminho do pular. Ninguém trava a sala: a espera é de no máximo 40 s (`CARGA_MAX_MS`). Testado no servidor com um cliente: a TV larga contando 60 s e, depois do `carregou`, acaba em 20 s, com as luzes 8 s depois.
- **Microtravadas dos robôs:** o laço dos robôs era de 50 ms, mas no Windows rodava a cada 66,7 ms. Com isso, as posições deles mudavam só 15 vezes por segundo, em saltos. Agora o laço é de 8 ms (`ROBOS_F1_MS`), que no Windows dá 16,7 ms, ou seja, 60 vezes por segundo. O passo da física continua pelo tempo real e custa uns 3 a 4 ms em média para 21 robôs. Medido em Mônaco, só no servidor, com `CORRIDA_PERF=1`, um medidor novo que fica desligado por padrão.
- **Níveis dos robôs, com o tempo do Thiago como régua:** ele fez 1:04,5 em Mônaco saindo parado, e esse tempo virou a média do **médio**. Os números são a folga sobre o tempo ideal e a fração do limite nas curvas:
  - **difícil:** 0% e 96%, o médio de antes;
  - **médio:** 8% e 92%;
  - **fácil:** 13% e 85% (antes era 4% e 86%).

  Medido em Mônaco, no seco, com 21 robôs e 2 voltas, já com a direção e a bateria novas. Todos terminaram e ninguém ficou preso. As melhores voltas:
  - **difícil:** 58,1 a 73,1 s (o 73 foi um robô que se atrasou numa disputa);
  - **médio:** 62,4 a 67,2 s, média de ~64,8 s;
  - **fácil:** 68,0 a 75,9 s.
- **Direção:** com a escala real, as curvas ficaram ~1,8 vez mais abertas, então a mesma curva pede bem menos volante, mas a tecla continuava dando o volante inteiro. Agora o teclado vira até 0,75 do curso, chega lá em 0,15 s e volta ao centro em 0,125 s. O analógico usa a curva 1,4 e o mesmo teto. O Thiago acertou esses valores jogando, no painel novo.
- **Robôs com a mesma direção:** o piloto automático (robôs, fantasma e o robô que assume o carro de quem cai) tem o mesmo teto de volante, 0,75 (`VIRADA_MAX` em `sim.js`). Ninguém faz uma curva que o outro não consegue fazer.
- **Painel de acerto da direção (tecla P, `acerto.js`):** tem controles deslizantes para a virada máxima, o tempo até o batente, a volta ao centro e a curva do analógico, valendo na hora, com a corrida rolando. "Padrão" volta aos valores do jogo e "Copiar valores" copia os números. Fica guardado em `corrida:acerto-direcao`. Só muda a entrada do jogador: o servidor recebe o mesmo valor de volante.
- **Bateria pela regra de 2026:**
  - a carga 0..1 é a janela de 4 MJ;
  - o MGU-K entrega e recupera até 350 kW;
  - a recuperação vai até 8,5 MJ por volta;
  - a FIA limitou a entrega a 250 kW fora das zonas de aceleração.

  No jogo, o overtake (Shift) esvazia a bateria em 11,4 s (antes, 5 s), o automático gasta a 250 kW, a recarga freando é de 350 kW e o teto por volta é de 2,125 baterias (antes, 1,5). O ganho de potência com a bateria (+45%) não vem da regra e ficou como estava. A energia extra do modo de ultrapassagem real (+0,5 MJ a menos de 1 s do carro da frente) ficou para depois. Fontes: [formula1.com](https://www.formula1.com/en/latest/article/explained-2026-power-unit-regulations-fia.68izKQ2tn1voQPWvgLVMXN), [The Race](https://www.the-race.com/formula-1/f1-2026-engine-rules-new-overtaking-aid-not-push-to-pass/), [ESPN](https://www.espn.com/f1/story/_/id/48548710/explained-f1-2026-rule-tweaks-changed-impact-difference-driver-criticism-max-verstappen), [batterydesign.net](https://www.batterydesign.net/formula-1-battery-rules/) e [f1chronicle](https://f1chronicle.com/f1-battery-energy-store-explained/).
- **Chuva:** conferida, sem mudança. O pneu médio perde 34% da aderência com a pista meio molhada e 62% com ela encharcada.
- **México:** a linha dos robôs foi refeita. Estava com o número de pontos da pista antiga, e o servidor recalculava tudo na largada.

Só rodei `node --check` e as corridas no servidor; a suíte fica com o CI.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
