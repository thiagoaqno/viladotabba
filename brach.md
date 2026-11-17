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
