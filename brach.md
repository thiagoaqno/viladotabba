# Corrida dos robôs: planos do domingo em toda corrida e o momento da corrida

O Thiago: "a gente também tinha que pensar em algo assim para as corridas" (depois dos planos do qualify, #942). Escolheu "os dois".

## Os planos do domingo em toda corrida de F1
`planoDoRobo` (atacar, seguro, largada forte, fim forte, esticar pneu; 35% sem plano) só valia na carreira (`room.temporada`). Agora vale em toda corrida de F1, solta ou com os amigos.

## O momento da corrida (`corrida-robos.js` `momentoDaCorrida`)
Por cima do plano do domingo, o robô muda de modo pela situação, a cada passo:
- **ataque**: nas últimas voltas (até 3, um quarto da corrida nas curtas), na volta de saída do box (o undercut) e a menos de 1,5 s do carro da frente por até 3 voltas. O carro anda como no plano "arriscar" e o ERS vai nas retas a 1,5 s (antes só colado, a 3 carros).
- **gerir**: em ar limpo (ninguém a 3 s na frente nem atrás) ou na volta depois de 3 voltas de ataque sem passar. Plano "seguro", 98,5% do ritmo nas curvas, sem ERS (só para defender) e lift and coast em toda freada: junta bateria e pneu para o próximo ataque.
- O plano "arriscar" nunca gere; "seguro" e "pneu" gerem já com 2 s de folga. Safety car: normal.

Os números (1,5 s, 3 s, 3 voltas, 98,5%) são de ajuste, não medidos: o Thiago testa jogando.

Entrada nova no `novidades.json`.

Conferido só com `node --check`.
