# Jogabilidade: largada mais rápida, robôs sem microtravadas, fácil de verdade e o painel de acerto da direção

Depois da escala real, o Thiago jogou e listou: a corrida demorava uns 30 s para começar, os robôs davam microtravadinhas, até o fácil estava difícil e o carro "ia muito para o lado" a cada toque no A ou no D.

- **Largada:** a corrida avulsa não passa mais a transmissão de TV antes das luzes. Ela durava 20 s, e do Largar às luzes eram uns 30 s; agora são uns 8 a 10 s. Na carreira a transmissão continua (dá para pular). (`TV_AVULSA_MS = 0` em `corrida.js`.)
- **Microtravadas dos robôs:** o laço dos robôs era de 50 ms, mas no Windows batia a cada 66,7 ms, e as posições deles mudavam só 15 vezes por segundo, em saltos. Agora o laço é de 8 ms (`ROBOS_F1_MS`), que no Windows dá 16,7 ms (60 por segundo). O passo da física continua pelo tempo real, e o custo ficou em 3 a 4 ms por passo, em média, para 21 robôs. Medido em Mônaco, só no servidor, com `CORRIDA_PERF=1` (um medidor novo, desligado por padrão).
- **Níveis dos robôs, com o tempo do Thiago como régua:** ele fez 1:04,5 em Mônaco saindo parado, e isso passou a ser a média do difícil. Folga sobre o tempo ideal e fração do limite nas curvas:
  - **difícil:** 8% e 92% (eram 0% e 100%);
  - **médio:** 13% e 85% (eram 0% e 96%);
  - **fácil:** 15% e 76% (eram 4% e 86%).

  Medido em Mônaco, no seco, com 21 robôs e 2 voltas (com a direção e a bateria novas), as melhores voltas ficaram assim, ~11% de um nível para o outro, todos terminando e nenhum preso:
  - **difícil:** 62,4 a 67,2 s;
  - **médio:** 68,0 a 75,9 s;
  - **fácil:** 77,8 a 81,4 s.
- **Robôs com a mesma direção de quem joga:** o piloto automático (robôs, fantasma e o robô que assume o carro de quem cai) tem o mesmo teto de volante, 0,75 (`VIRADA_MAX` em `sim.js`). Ninguém faz curva que o outro não faz.
- **Bateria pela regra de 2026:** a carga 0..1 é a janela de 4 MJ; o MGU-K entrega e recupera até 350 kW; a recuperação vai até 8,5 MJ por volta; a FIA limitou a entrega a 250 kW fora das zonas de aceleração. No jogo, o overtake (Shift) esvazia a bateria em 11,4 s (antes 5 s), o automático gasta a 250 kW, a recarga freando é de 350 kW e o teto por volta é de 2,125 baterias (antes 1,5). O ganho de potência com a bateria (+45%) não é da regra e ficou como estava. A energia extra do modo de ultrapassagem real (+0,5 MJ a menos de 1 s do carro da frente) ficou para depois. Fontes: [formula1.com](https://www.formula1.com/en/latest/article/explained-2026-power-unit-regulations-fia.68izKQ2tn1voQPWvgLVMXN), [The Race](https://www.the-race.com/formula-1/f1-2026-engine-rules-new-overtaking-aid-not-push-to-pass/), [ESPN](https://www.espn.com/f1/story/_/id/48548710/explained-f1-2026-rule-tweaks-changed-impact-difference-driver-criticism-max-verstappen), [batterydesign.net](https://www.batterydesign.net/formula-1-battery-rules/) e [f1chronicle](https://f1chronicle.com/f1-battery-energy-store-explained/).
- **Chuva conferida, sem mudança:** o pneu médio perde 34% da aderência com a pista meio molhada e 62% encharcada.
- **Direção:** com a escala real, as curvas ficaram ~1,8 vez mais abertas, então a mesma curva pede bem menos volante, mas a tecla continuava dando o volante inteiro. Agora o teclado vira até 0,75 do curso, chega lá em 0,15 s e volta ao centro em 0,125 s; o analógico usa a curva 1,4 e o mesmo teto. Esses valores o Thiago acertou jogando, no painel novo. Só a entrada do jogador muda: o servidor recebe o mesmo valor de volante e os robôs ficam iguais.
- **Painel de acerto da direção (tecla P, `acerto.js`):** controles deslizantes para a virada máxima, o tempo até o batente, a volta ao centro e a curva do analógico, valendo na hora, com a corrida rolando. "Padrão" volta aos valores do jogo e "Copiar valores" copia os números. Fica guardado em `corrida:acerto-direcao`.
- **México:** a linha dos robôs foi refeita. Estava com o número de pontos da pista antiga, e o servidor recalculava tudo na largada.

Só `node --check` e as corridas no servidor; a suíte fica com o CI.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
