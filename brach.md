# Tiro da Galera: narrador sorteado a cada partida, como padrão

O Thiago pediu para o narrador mudar sozinho, aleatoriamente, a cada partida, e para isso ser o padrão.

## O que mudou

- **Opções > Áudio > Voz do narrador** ganha a opção **"Aleatória a cada partida"**, a primeira da lista e a de começo. As outras
  continuam: Narrador 1, 2, 3, Narradora e "Pela classe da arma".
- **O sorteio** (`vozSortear`) acontece em cada `startMatch`, entre as 4 vozes, e nunca repete a voz da partida anterior. O pacote
  da voz sorteada é baixado quando o jogador nasce, como antes.
- **O ajuste mudou de nome de novo** (`narrador` → `narradorVoz`), porque o jogo grava os ajustes a cada partida: só um nome novo faz o
  padrão novo valer para quem já jogou. A constante fica em `NARRADOR_PADRAO`, no `ferramentas/tiro-frontline.js`.
- **No online,** cada jogador sorteia o seu narrador: a voz do rádio é só de quem está ouvindo.

## Conferido no navegador

- O padrão é "aleatorio", e o seletor mostra "Aleatória a cada partida" em primeiro.
- Em 400 sorteios: Narrador 1 saiu 105 vezes, Narrador 2 saiu 108, Narrador 3 saiu 95 e a Narradora 92, sem nenhuma repetição
  seguida.
- Cada voz sorteada aponta para o pacote certo (Narrador 1, nenhum pacote extra; os outros, `voix_smg`, `voix_sniper`,
  `voix_shotgun`).
