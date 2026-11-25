# Volante e painel personalizáveis

O Thiago pediu que os volantes e painéis dos carros fossem personalizáveis.

## O que dá para escolher (no seu carro, visto no cockpit)

- **A tela do volante, em 5 modelos:**
  - **F1 2026:** a de antes.
  - **Clássico:** a marcha no meio, a velocidade embaixo e o ERS em segmentos.
  - **Minimalista:** só a marcha, enorme.
  - **Retrô:** o conta-giros de ponteiro, com a faixa vermelha.
  - **Neon:** magenta e ciano, com brilho.
- **As luzes de troca:** F1 (verde, vermelho, azul), azul, âmbar, arco-íris ou na cor da equipe.
- **O punho do volante:** carbono (o de fábrica), alcântara, vermelho ou na cor da equipe.

## Como

- **`f1.js`:**
  - `ESTILOS_VOLANTE` traz as opções, e `lerEstiloVolante`/`gravarEstiloVolante` guardam a escolha neste navegador.
  - `desenharTelaEm` desenha a tela de cada modelo, num canvas de 256×144.
  - As luzes pintam pelo esquema escolhido, e o punho tinge o material do volante.
  - Tudo é lido a cada quadro, então muda na hora, também no meio da corrida.
- **`volante-ui.js` (novo):** a seção "Volante e painel" na gaveta da sala, com a prévia da tela e as opções. A prévia se redesenha a cada clique.

## Conferido

A página carrega sem erros, e desenhei as telas fora do jogo. Não vi o volante no cockpit numa corrida.
