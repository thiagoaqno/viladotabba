# Editor de pistas com o layout do TRACKSCAPE

Pela imagem do Thiago (sem a aba de código). Nada foi refeito: as seções que o editor já tinha foram **movidas** para o layout novo, com os mesmos ids e eventos; câmera, seleção, gizmo, atalhos e Ctrl+Z continuam os mesmos.

- **Barra do topo**: TRACKSCAPE, desfazer/refazer, Salvar, Publicar (PR), Craft, os modos do gizmo e as vistas, e a pista à direita.
- **Esquerda, em abas**:
  - *Assets*: busca, as categorias em lista com ícone e a grade de miniaturas; os assets leves e as peças das outras pistas.
  - *Pista*: zebra, linha de itens, desenhar trecho, área de escape, placa e pórtico.
  - *Cena*: a lista dos itens do cenário (clique escolhe) e o conversor de .glb.
  - *Ambiente*: altura, direção e força do sol, luz ambiente, exposição e névoa, ao vivo (só no editor; o jogo usa a luz de cada pista).
- **Direita**: Inspetor (o item escolhido) e Histórico (os passos do Ctrl+Z).
- **Barra de status**: o aviso do editor, quantos itens e passos, e a pista.

Novo arquivo: `public/corrida/editor/layout.js`. No `editor.js`, só o import e a chamada no fim.

Conferido só com `node --check`.

## Terreno com pincéis (aba Terreno)

- Pincéis **Subir, Baixar, Suavizar, Nivelar, Platô e Ruído**, com **raio, força e queda** (e `[` `]` para o raio). Um anel azul mostra onde o pincel está.
- Com o pincel ligado, arrastar com o botão esquerdo pinta; Shift + WASD, o botão direito e a roda continuam navegando. Esc desliga.
- Cada pincelada entra no Ctrl+Z (e no Histórico) guardando só as células que mudaram. Botão para zerar o relevo.
- Só os vértices do chão perto do pincel são mexidos, sem refazer a pista.
- O relevo vai no `cenario/<pista>.json` (`relevo: { cel, d }`, só as células mexidas) e o `pista.js` soma ao chão no jogo. Pista sem relevo salvo: nada muda. No editor, os pedaços lisos do chão não são juntados (para o pincel ter vértices em toda parte).

Novo: `public/corrida/editor/terreno.js`. Mexidos: `cenario-pista.js` (lê o relevo), `pista.js` (soma o relevo ao chão), `editor.js`, `layout.js`.

Erosão e pintura de material no chão ainda não.

## Área no chão (polígono), na aba Terreno

- Clique nos cantos do polígono no chão; fecha clicando no primeiro canto, com Enter ou no botão. Backspace tira o último canto, Esc cancela.
- **Preencher** com grama, mato baixo, terra, brita, areia, asfalto, concreto, água ou nada; a cobertura segue o relevo (lido da grade do chão, sem raio).
- **Espalhar** qualquer peça da biblioteca dentro dela, uma a cada N metros, com giro e tamanho sorteados (sempre os mesmos para a mesma área).
- No Inspetor dá para trocar o preenchimento, a peça e o espaçamento depois.
- Salvo como `{ tipo: "area", pts, material, espalhar, espaco }` no `cenario/<pista>.json`.
