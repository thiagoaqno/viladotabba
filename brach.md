# Replay da corrida, ultrapassagens com telemetria e a vista do carro de 2026

Continua o pós-corrida interativo (#742, #743). Junta os itens 5 a 8 da proposta: a vista do carro, as ultrapassagens, o replay com as trajetórias e a telemetria dos pilotos.

## Gravação no servidor (`corrida-gravacao.js`, novo)

- A cada 250 ms, o laço de 100 ms das regras de F1 grava 6 bytes por carro: a fração da volta (2 bytes), a velocidade em km/h ÷ 2 na escala do velocímetro (v × 0,75), o acelerador, o freio e a marcha (+128 no box). Quem abandonou ou já recebeu a bandeirada fica marcado como fora.
  - Pela conta (não medido): 132 bytes por amostra com 22 carros, 528 B/s, uns 31 KB por minuto de corrida. O limite é 1 hora (14 400 amostras).
  - Vai ao navegador só quando a aba Replay pede (evento `replay`, tudo em base64), e nunca no estado da sala.
- **Ultrapassagens:** guardo a última ordem certa de cada par na pista (voltas + fração); quando ela vira e continua virada 1,5 s depois, conta.
  - Não contam: a volta de um retardatário (diferença de mais de meia volta), quem está no box (a troca de lugar no pit não é ultrapassagem) e o empate de uma amostra.
  - A ultrapassagem sob bandeira fica marcada.
  - A lista vai no resumo `analise` (`ultrapassagens`).
- Tudo dentro de `try`: um erro na gravação nunca para a corrida. `Gravacao.limpar` zera tudo na largada.

## Tela do resultado (`resultado-analise.js`)

- **Ultrapassagens** (aba nova):
  - a lista, com a volta, quem passou quem, a posição e a curva mais perto, e "quem mais passou";
  - os pinos na miniatura 3D na cor de quem passou.
  - "Ver no replay", ou um clique no pino, abre o Replay de 8 s antes até 4 s depois da manobra, em 1×, seguindo quem passou, com a telemetria dos dois lado a lado.
- **Replay** (aba nova):
  - todos os carros andando na miniatura 3D, com a sigla, em 1×, 4× ou 16×, com a barra do tempo e a torre ao vivo pela ordem na pista;
  - "Seguir" faz a câmera acompanhar o carro escolhido;
  - clicar num carro (na pista ou na torre) faz dele o escolhido, e o anterior fica para comparar;
  - o painel de telemetria, como o do app da F1, mostra a velocidade, a marcha, o acelerador e o freio dos dois;
  - o gráfico mostra os últimos 12 s (ou a janela da ultrapassagem): a velocidade, o acelerador e o freio, com as ultrapassagens marcadas;
  - "Mapa de calor" pinta a pista pela velocidade da melhor volta do escolhido, do azul ao vermelho, com as cores relativas à própria volta.
- `gp-miniatura.js` ganhou os carros (`definirCarros`/`posicionar`, com o clique), o `seguir` e o `pintar`.

## A vista do carro (`vista-carro.js`, novo)

- No menu, Garagem > "Ver o carro de perto": o carro de 2026 da equipe (o mesmo modelo do jogo, `montarF1`, nas cores dela) num palco escuro.
  - A mesa gira devagar, o mouse gira e aproxima.
  - Oito pontos clicáveis: asa dianteira, pneus, halo, laterais, ERS, unidade de potência, assoalho e asa traseira. Clicar voa a câmera até a peça e abre o cartão; ◀ ▶ (ou as setas) passam de peça, e Esc fecha.
  - Onde fica cada ponto sai da caixa do modelo medida depois que ele carrega (a frente é −z). O ponto atrás do carro fica apagado (um raio por vez, a cada 90 ms).
- O texto segue o regulamento de 2026: a aerodinâmica ativa no lugar do DRS, o MGU-K de 350 kW, o fim do MGU-H, o combustível sustentável, os pneus mais estreitos e o carro menor e mais leve. A vida dos pneus no jogo sai de `F1Regras.PNEUS`.
- A garagem 3D do menu para enquanto a vista está aberta e volta quando ela fecha.

Entrada no topo de `novidades.json`. Conferido com `node --check` e `JSON.parse`; a detecção de ultrapassagem foi rodada uma vez à mão, com dois carros falsos no `node -e`, sem teste novo. O teste jogando fica com o Thiago.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
