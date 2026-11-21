# Replay 3D da corrida, na visão de qualquer piloto

Pedido do Thiago de 2026-11-21 (item 2): o replay 3D de qualquer corrida da temporada, na visão de qualquer piloto, com voltar, avançar e pausar ("se a gente criar o replay eu mesmo posso ver por que eles batem").

## Gravação (`corrida-gravacao.js`)
- Cada amostra (a cada 250 ms) passou de 6 para 12 bytes por carro. Além do que já era gravado, agora vão:
  - o **x e o y** do carro (2 bytes cada, num quadro do mundo da pista com meio mundo de margem: `mundo` vai junto com o replay; em Suzuka são 0,18 u por passo);
  - a **direção** (2 bytes com sinal).
- Conferido no Node: a posição volta com erro de até 0,1 u e a direção com erro de 0,00002 rad.
- O replay antigo (6 bytes) continua sendo lido: a miniatura e a telemetria usam o `campos` que vem junto.
- Com 22 carros, são 264 bytes por amostra, cerca de 1 KB por segundo de corrida, antes do gzip do save.

## O replay 3D (`replay-3d.js`, `replay-3d-abrir.js`)
- **Onde fica:** na aba Replay da análise, o botão **Replay 3D**. Vale na tela do resultado e na Central da carreira (solo e com os amigos).
- **Como abre:** num quadro por cima da tela, a página do jogo com `?replay=1`, como o editor de cenário. Dentro do quadro:
  - o socket não conecta (`index.html`), então nada mexe na sala;
  - a música da carreira não toca de novo.
- **A pista e os carros:**
  - a pista do jogo, com o grid de F1, o pórtico e os boxes;
  - os carros com a pintura e o número de cada equipe, no ano da temporada;
  - o pneu de cada volta, pelos stints da análise;
  - a altura e a inclinação do carro como no jogo.
- **Entre uma amostra e outra:** o carro anda numa curva de Hermite (a posição e a velocidade nas duas pontas). Numa reta entre os pontos ele cortaria as curvas: a 300 km/h anda ~100 u por amostra. Quando o carro dá um salto (volta para a pista), ele aparece direto no lugar novo.
- **Seguir um piloto:** clique na torre, ou use ↑ e ↓. O carro seguido ganha o modelo completo, com cockpit e T-cam.
- **Câmeras:** as do jogo (`cameras.js`): cockpit, T-cam, bico, perseguição próxima e afastada, aérea e TV. Troca com C ou com o botão.
- **Tempo:**
  - tocar e pausar (espaço);
  - voltar e avançar 5 s (← e →) ou 30 s (com Shift);
  - quadro a quadro (vírgula e ponto);
  - velocidade de 0,25× a 16× para a frente e até 8× para trás;
  - a barra do tempo.
- **Na tela:** a volta, o relógio e a telemetria do seguido (velocidade, marcha, acelerador e freio).
- **Replay de antes desta gravação:** abre também, com os carros pela fração da volta, no meio da pista, e um aviso no topo.

## Ainda não tem
- A chuva no replay (o céu é o do dia; a hora da noite vem quando a tela do resultado sabe).
- O safety car e os mecânicos no box.

Não foi testado jogando nem no navegador (regra do projeto: só `node --check`).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
