# Telas pós-corrida e pós-classificação novas, ajustes entre Q1/Q2/Q3, capacete da carreira no carro e a cidade real em Monza e Silverstone

O Thiago pediu os cinco juntos, num PR só.

## 1. A tela pós-corrida (`resultado-gp.js`, `pos-corrida.css`)

No estilo do "Race result" da referência:
- **Três colunas:** o pódio (o mesmo pódio 3D, com os pilotos e as logos nos degraus), a classificação e a análise da corrida.
- **Classificação:** cada linha tem a posição no bloco da cor da equipe, o sobrenome, a logo e o nome da equipe, o tempo e "+pts". O hover (ou o foco) abre o grid de largada com ▲/▼, as paradas com os pneus, a melhor volta, o dano e as punições. Clicar escolhe o piloto para comparar na análise.
- **Análise:** só as abas Replay, Ritmo, Posições e Pneus, com o replay em uma coluna (`montarAnalise` aceita `abas`).
- **A faixa de baixo:** o seu resultado (Vitória, Pódio, "7º lugar", Abandono, Desclassificado), o seu nome e a equipe, e os botões, sem emoji.

## 2. A tela pós-classificação e 3. os ajustes entre as sessões

- **Servidor** (`corrida-f1-classificacao.js`): com humanos na sala, a sessão seguinte só abre quando todos os humanos que passaram apertam "Largar" (`confirmarLargada`, que agora vale em toda pausa).
  - Se alguém sumir, ela abre sozinha depois de `PAUSA_MAX_MS` (3 minutos), para a sala com os amigos nunca ficar presa.
  - Antes da corrida, a largada espera todos, como já era. Sem humanos, segue automático como antes.
  - A montagem do carro (`montagemGrid`) muda em qualquer pausa.
- **Tela** (`pos-quali.js`, novo; o `hud.js` só chama):
  - **Resultado:** depois do Q1 e do Q2, a tabela de quem passou e de quem caiu. No fim, os 3 primeiros em cartões inclinados na cor da equipe, com a foto do piloto (`fotos-noticias.js`, agora carregado também na página da corrida; o humano fica com a logo grande), e a tabela com os tempos do Q1, do Q2 e do Q3, o melhor de cada sessão em roxo.
  - **Ajustes do carro** (botão no rodapé): o acerto (asa e altura; `acerto.js` agora abre nas pausas da classificação, e o acerto vai junto com as entradas e vale já na sessão seguinte), os pontos do carro na carreira e, antes da corrida, o pneu da largada e a previsão do tempo. Na classificação o pneu é decidido pela pista (`Sim.pneuDaLargada`), e a tela explica isso.
  - **Rodapé:** quantos estão prontos, o relógio da pausa e o botão "Largar para o Q2" / "Ir para a largada".

## 4. O capacete da carreira no carro, e mais capacetes

- **Por que não chegava:** na sala de um GP da carreira, o servidor recusava a ação `mods` (só aceita a lista dos GPs controlados pela sede), e a sala da carreira pula a tela de sala, que era onde o capacete guardado era mandado.
  - Agora `mods` é aceito na carreira, só para o capacete (a pintura continua a da equipe).
  - O navegador manda o capacete guardado também durante a classificação (`rede.js`, `sincronizarCapacete`).
- **8 desenhos novos** (`f1-capacetes.js`, e a lista do servidor em `corrida.js`): Chamas, Onda, Degradê, Raio, Xadrez, Estrelas, Listras e Geométrico.

## 5. A cidade real no cenário de Monza e Silverstone

- **`cidade-real.js` (novo):** os prédios do mapa real (`mapas/<pista>.json`, OpenStreetMap), já nas unidades do traçado.
  - Fica de fora um corredor de 180 m em volta da pista, onde estão as arquibancadas, os boxes e o parque do cenário próprio, e tudo fora do chão do mundo.
  - Cada prédio afunda a base abaixo do terreno mais baixo sob ele, para nada flutuar, e tem a altura real.
  - É uma malha só, sem sombra.
- **Ligado pelo próprio cenário de cada GP** (`gps/monza.js`, `gps/silverstone.js`), sem mexer no `pista.js` nem no kit.
  - Medido com os pontos da pista: Monza fica com 1754 prédios (93 no corredor e 110 fora do chão saem). Silverstone, que é campo, fica com 61.

Entrada no topo de `novidades.json`. Conferido só com `node --check` e `JSON.parse`. Se algum teste antigo do CI contava com a sessão abrindo sozinha depois de 9 s com humanos na sala, ele quebra porque a regra mudou. O teste jogando fica com o Thiago.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
