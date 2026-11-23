# Cards do topo esquerdo no estilo da transmissão, com animação (1 de 3 das animações)

Pedido do Thiago (2026-11-23), com a imagem dos cards da transmissão: "animações na UI/UX do HUD da corrida... mandei um exemplo do que eu espero nos cards que aparecem no topo esquerdo".

## O card
- Faixa preta com o logo F1 e "RACE" (ou "QUALI"; "RACE CONTROL" quando vem da direção de prova). Embaixo, o corpo na cor do aviso, com o título grande em inglês como na TV, a frase do jogo e o ícone.
- Cores: Green Flag e Lights Out verdes, Safety Car e Yellow Flag amarelos, Red Flag vermelho, Fastest Lap roxo, Blue Flag azul, Pit Stop azul-claro, DRS verde. Punição, investigação, limites, incidente e falha ficam no corpo escuro, com o ícone na cor do tipo.
- Fica ao lado da torre (antes cobria a faixa "F1 RACE" dela). Continua um aviso por vez.

## As animações (~0,5 s, só transform, opacity e clip-path)
- Entrada em três tempos: o card cai e encaixa com um leve quique, a cor varre da esquerda para a direita, o título e a frase sobem e o ícone salta.
- Safety Car: o carrinho entra pela direita. Red Flag e Black Flag: o card pulsa um anel vermelho duas vezes. Fastest Lap: as faixas roxas correm ao fundo.
- O aviso fixo que muda de tipo no lugar (a bandeira da direção de prova) dá um pulo curto e a cor varre de novo. A saída sobe e encolhe.
- Com "reduzir movimento" no sistema, nada anima.

## Card novo: Battle for first
- Com o 2º a menos de 1 s do líder, a cada 2 voltas do líder, o card mostra os dois (logo, posição e sigla) e a diferença por 7 s.
- A diferença acompanha ao vivo: o número rola a cada mudança (verde quando fecha, vermelho quando abre), sem refazer o card.

Conferido no navegador com os cards montados por `htmlCard` (1600 × 900): visual de cada tipo, a varredura no meio da animação e a posição ao lado da torre. Não rodei uma corrida inteira.

Arquivos: `public/corrida/hud-cards.css` (novo, carregado depois de `transmissao.css`), `hud.js` (`htmlCard`, `estiloCard`, `batalhaF1`), `avisos-f1.js` (título e cor de cada card, tipo `batalha`), `index.html`, `novidades.json`.
