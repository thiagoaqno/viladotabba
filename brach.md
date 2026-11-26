# Tiro da Galera: editor de mapas

O Thiago pediu um editor de mapas para o Tiro, no estilo do TabbaTracks: ele (ou o Codex) monta os mapas, e eu cuido das peças
e do editor.

## Como usa

- **`Editor de mapas do Tiro.bat`** (em `Downloads\lts`, chama o `editor-de-mapas-tiro.bat` do `klk\editor`): atualiza com a
  `main`, guarda os mapas ainda não publicados, sobe o servidor com o editor ligado (porta 3125) e abre `/tiro/?editor=1`.
- No site, `/tiro/?editor=1` abre o editor do mesmo jeito. Lá o **Salvar** baixa o `.json`, porque não grava no projeto.
- Guia completo, com regras, formato e o catálogo: [`docs/tiro-editor-de-mapas.md`](docs/tiro-editor-de-mapas.md).

## O que tem

- **Editor dentro do jogo** (`ferramentas/tiro-editor/editor.js`): cena 3D própria e câmera livre (botão direito olha, WASD
  anda, Q/E desce e sobe).
- **Catálogo:**
  - **Básico:** chão, parede, mureta, bloco, coluna, laje, parede invisível, escadas, luz.
  - **Marcadores:** nascer (o Bravo aparece espelhado), pontos de dominação e queda do mecha.
  - **209 prefabs e 47 objetos do jogo,** desenhados com a malha e as cores deles. Os 12 prefabs que precisam de parâmetros
    aparecem apagados.
- **Edição:** clicar coloca, clicar seleciona e arrastar move. Setas e PgUp/PgDn ajustam, R gira, Ctrl+D duplica, Ctrl+Z
  desfaz e Delete apaga. O painel mostra posição, tamanho, giro, matéria, cor e colisão. O rascunho fica guardado no navegador.
- **▶ Jogar:** monta o mapa de verdade e abre a partida solo com bots. O botão "Voltar ao editor" fica no canto.
- **Mapas no jogo** (`ferramentas/tiro-editor/mapa-json.js`): o `tiro-frontline.js` junta os `.json` de
  `ferramentas/tiro-mapas/editor/` e cada um vira um mapa da lista. Céu e luz vêm de um mapa do jogo, e o mar é opcional (com a
  grade de água e a espuma centradas, como no iate).
- **Servidor** (`servidor/jogos/tiro-editor.js`): grava, lista e abre os mapas. Só com `CORRIDA_EDITOR=1` e só no próprio PC,
  como o editor de cenário da Corrida.

Nenhum mapa novo entra neste PR: a pasta `ferramentas/tiro-mapas/editor/` está vazia.

## Conferido no navegador (servidor com `CORRIDA_EDITOR=1`)

- O editor abre, os 209 prefabs e os 47 objetos se desenham, e a cena mostra chão, escada, parede, sofá, barril e marcadores.
- **Salvar** gravou `ferramentas/tiro-mapas/editor/teste-do-editor.json`, e a lista do servidor mostrou o mapa. O mapa de teste
  foi apagado depois.
- **Jogar** montou o mapa (516 nós de rota) e abriu a escolha de classe. Na partida, o jogador e os 11 bots nasceram e não
  apareceu nenhum erro.

Falta o Thiago usar de verdade e dizer o que atrapalha.
