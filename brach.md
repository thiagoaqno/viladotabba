# Jogabilidade: largada mais rápida, robôs sem microtravadas, fácil de verdade e o painel de acerto da direção

Depois da escala real, o Thiago jogou e listou: a corrida demorava uns 30 s para começar, os robôs davam microtravadinhas, até o fácil estava difícil e o carro "ia muito para o lado" a cada toque no A ou no D.

- **Largada:** a corrida avulsa não passa mais a transmissão de TV antes das luzes. Ela durava 20 s, e do Largar às luzes eram uns 30 s; agora são uns 8 a 10 s. Na carreira a transmissão continua (dá para pular). (`TV_AVULSA_MS = 0` em `corrida.js`.)
- **Microtravadas dos robôs:** o laço dos robôs era de 50 ms, mas no Windows batia a cada 66,7 ms, e as posições deles mudavam só 15 vezes por segundo, em saltos. Agora o laço é de 8 ms (`ROBOS_F1_MS`), que no Windows dá 16,7 ms (60 por segundo). O passo da física continua pelo tempo real, e o custo ficou em 3 a 4 ms por passo, em média, para 21 robôs. Medido em Mônaco, só no servidor, com `CORRIDA_PERF=1` (um medidor novo, desligado por padrão).
- **Fácil:** 15% acima do tempo ideal e 76% do limite nas curvas (eram 4% e 86%, quase o médio). Em Mônaco, com 21 robôs, as melhores voltas ficaram de 77,5 a 81,8 s; no médio, de 59,4 a 64,7 s. O médio e o difícil não mudaram.
- **Direção:** com a escala real, as curvas ficaram ~1,8 vez mais abertas, então a mesma curva pede bem menos volante, mas a tecla continuava dando o volante inteiro. Agora o teclado vira até 0,75 do curso, chega lá em 0,15 s e volta ao centro em 0,125 s; o analógico usa a curva 1,4 e o mesmo teto. Esses valores o Thiago acertou jogando, no painel novo. Só a entrada do jogador muda: o servidor recebe o mesmo valor de volante e os robôs ficam iguais.
- **Painel de acerto da direção (tecla P, `acerto.js`):** controles deslizantes para a virada máxima, o tempo até o batente, a volta ao centro e a curva do analógico, valendo na hora, com a corrida rolando. "Padrão" volta aos valores do jogo e "Copiar valores" copia os números. Fica guardado em `corrida:acerto-direcao`.
- **México:** a linha dos robôs foi refeita. Estava com o número de pontos da pista antiga, e o servidor recalculava tudo na largada.

Só `node --check` e as corridas no servidor; a suíte fica com o CI.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
