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
