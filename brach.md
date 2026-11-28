# Tiro: grades sem física (alambrado, cerca do campo, janelas, portão)

Pedido do Thiago: "todas as grades (de quadra, campo, janelas) sem física".

Sem colisão agora (gente e bala passam; continuam aparecendo iguais), em `ferramentas/tiro-editor/pecas.js`:
- **`kcAlambrado`** (a cerca de tela, inteira, com os postes);
- a **cerca do campo de futebol** (`kcCampoFutebol`, o alambrado em volta);
- as **grades de janela** (`kcGrade`, das casas de tijolo e das outras que usam ela);
- o **portão de grade** do `kcMuroPortao`;
- a **grade baixa do alpendre** da casa azul (`kcCasaAzul`).

As **traves** do gol (do campo e da quadra) continuam sólidas, porque são postes e não grade. As cercas de madeira da zona rural também continuam.

Vale em todo mapa que usa essas peças (Favela, Favela Grande e os mapas do editor). O guia diz que o alambrado agora é só visual.

Conferido com `node --check` no `pecas.js` e no script do jogo montado; não joguei.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
