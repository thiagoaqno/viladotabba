# Câmeras de dentro presas ao carro (T-cam, cockpit e bico)

O Thiago: "fazer a câmera ser presa no carro é uma boa... pra quando o carro inclinar a visão também inclinar como numa câmera T-cam mesmo, e não uma câmera que sobrevoa o carro".

## Como era (`public/corrida/cameras.js` `pov`)
A posição vinha da posição do carro mais a guinada, e a câmera mirava um ponto do chão 70 u à frente (`lookAt`): o pitch era suavizado e o roll era só um pouco do volante. Quando o carro inclinava (curva inclinada, zebra, relevo, suspensão), a vista continuava reta: parecia uma câmera voando em cima do carro.

## Como fica
- A câmera é um ponto do corpo do carro desenhado (`carros.js` `k.body`): a posição sai do quadro dele (`localToWorld`) e a rotação é a dele (pitch e roll da inclinação, suspensão, guinada com a derrapagem).
- Por cima, o mesmo olhar para baixo de antes (mira 70 u à frente) e a inclinação do ajuste da câmera; o balanço da batida e da zebra e o tremor continuam.
- O rolar extra do volante só vale no modo antigo (o corpo já inclina com o volante).
- No ar (pulo) volta ao modo de antes, que segue o chão à frente.

Vale para as três câmeras de dentro: T-cam, cockpit e bico. Olhar para trás não muda.

Novidade do `novidades.json`: entra depois do #944 (os dois escreveriam no topo).
# Robôs: chegando rápido atrás de alguém, vão para o lado na hora em vez de frear

O Thiago: "se o bot vem muito rápido e tem um carro parado na frente dele, ele precisa mudar rápido para modo ultrapassagem e desviar em milissegundos"; "não falo só de carro parado: às vezes você está a uma velocidade mais alta atrás de um carro e frear não é a escolha certa, é colocar de lado e tentar a ultrapassagem".

## Como era (`corrida-robos-transito.js` `transito`)
- O freio de trânsito valia assim que o carro da frente entrava na faixa, e só soltava quando o robô já estava meio carro de lado.
- A manobra planejada só começava na reta (ou com o da frente quase parado), longe da freada, com bateria ou depois da paciência do piloto.
- O desvio de emergência só começava em trecho quase reto, a mais de 100 da freada, e já dentro da distância em que o freio mal daria conta.

## Como fica
- **Desvio imediato**: chegando 20 u/s ou mais rápido que o da frente, a menos de 2,5 s do contato e fora de curva fechada, vai para o lado livre na hora, sem esperar bateria, paciência nem reta. Um carro bem mais lento (menos de 60% da velocidade) é desviado até na entrada da freada. Mônaco segue com a lógica própria.
- **Sem frear durante a manobra**: já indo para o lado, se a mudança de faixa (35 u/s de lado, mais 0,25 s de reação) termina antes de encostar, mantém a velocidade; só freia se não der tempo.

Os números são de ajuste, não medidos: o Thiago testa jogando. Conferido só com `node --check`.
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
