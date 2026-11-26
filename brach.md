# Tiro da Galera: mapa Favela

Mapa novo, **Favela**, montado a partir do conceito que o Thiago mandou (imagem gerada por IA), com as peças de favela do editor. Ele entra na lista de mapas do jogo e abre no editor de mapas para ajustar.

- **Rotas e lados:** três rotas (o beco oeste com o mercado, a praça central com a árvore e o beco leste com a casa em obra). O Alpha nasce no sul e o Bravo no norte, que é o espelho do sul.
- **Por cima:** a laje dos Telhados, a 3 m, com escadas na base e passagem por baixo, e uma passarela até a laje do bloco leste, que tem escada pelo beco.
- **Limite e cenário:** parede invisível em volta e casas de cenário do lado de fora (sobrado, prédio velho, casas de tijolo e de concreto, bananeiras, postes).
- **Pontos dos bots:** 53 pontos, 20 deles de "segurar" (lajes, janelas, cantos); zonas no mapinho; dominação em A (mercado), B (árvore) e C (beco leste).
- **Peças novas:** barraca de feira (amarela e azul) e árvore no canteiro.
- **Gerador:** `ferramentas/tiro-mapas/favela-gerar.js` refaz o `.json` (não rode depois de mexer no editor: sobrescreve).
- **Editor (consertos):**
  - Abrir e salvar não perde mais `poi`, `zonas`, `sniper`, `som`, `tipo` e `capa`. Antes, o Jogar do editor usava os pontos automáticos.
  - A "Parede invisível" (`inv: true`) agora fica invisível no jogo. Antes, era uma caixa de vidro.
  - Ponto de bot com 4º número `1` faz o bot segurar a posição.

Conferido no navegador: o mapa abre no Jogar com bots. Há caminho para os bots até as lajes, a passarela, os dois becos, o mercado e dentro das casas, e o console não deu erro.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
