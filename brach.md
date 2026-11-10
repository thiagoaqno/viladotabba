# Robôs lisos em tela de 144/240 Hz e punição para quem derrapa e acerta outro

## Os outros carros travados em tela rápida

A galera joga em monitor de 144 e 240 Hz e via os robôs (e os outros carros) aos trancos.

**Medido:** uma corrida de robôs em Interlagos, com os pacotes reais do servidor desenhados quadro a quadro pela mesma conta do jogo (`Pose.Outro`). A velocidade desenhada de cada robô varia 0,1% de um quadro para o outro (mediana; 3,8% no pior 5%). A conta da rede é lisa; o tranco não vinha dela.

**Causa:** o meu carro anda pelo tempo do quadro da tela (o `requestAnimationFrame`), mas os outros eram postos na hora do relógio no instante em que o código chegava em `updateGhosts`. Esse instante varia alguns ms de um quadro para o outro, porque antes dele a física dá 0, 1 ou 2 passos. Numa tela de 60 Hz (16,7 ms por quadro) isso some; numa de 240 Hz (4,2 ms por quadro), 2 ms de variação é meio quadro de tranco dos outros carros em relação ao meu carro e à câmera. E o acerto do relógio da rede pulava até 2 ms de uma vez, a cada 2 s.

**Correção** (`rede.js`, `jogo.js`):
- os outros carros vão para a hora do quadro da tela, a mesma régua do meu carro;
- o acerto do relógio entra no desenho devagar, 2 ms por segundo, o que dá 0,2% da velocidade e não se vê. Um acerto grande (mais de 25 ms, a primeira sincronia) entra de uma vez.

A previsão de batida (`fisica.js`) e o servidor não mudam.

**Não conferido:** o efeito na tela de 144/240 Hz. Sem monitor desses aqui, quem confere é quem joga.

## Derrapou e bateu: agora só livra se quem derrapou foi o atingido

Antes, se qualquer um dos dois carros derrapava (até 2 s antes), a batida virava "acidente de corrida", sem punição e sem dano para os dois. Assim alguém rodava, acertava você, acabava com a sua corrida e não levava nada.

Agora (`corrida-f1-direcao.js`, `bater`):
- **o atingido derrapou** (rodou na sua frente e você não teve como desviar): acidente de corrida, como antes;
- **quem derrapou foi o causador** (rodou e acertou alguém): é punido e leva o dano como qualquer causador;
- **sem culpado claro** (lado a lado, ninguém é punido mesmo): um dos dois derrapando continua sendo acidente de corrida, sem dano.

O culpado é o mesmo de sempre: quem se aproximou claramente mais que o outro no impacto (`corrida-contato.js`). A regra da batida proposital (bandeira preta) não muda.

Conferido com `node --check`; a suíte roda no CI.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
