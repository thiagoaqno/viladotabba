# Editor de mapas do Tiro: selecionar, copiar e colar várias peças

Pedido do Thiago: "uma função de copiar e colar vários elementos no editor de mapas".

**Selecionar várias:**
- **Shift+clique** (ou Ctrl+clique) põe e tira uma peça da seleção;
- **Shift+arrastar** num lugar vazio desenha um retângulo e seleciona tudo o que cai dentro dele (pelo ponto de apoio de cada peça, na tela);
- **Esc** solta a seleção. A peça principal fica com a caixa amarela e as outras com a caixa azul.

**Mexer em várias de uma vez:**
- **arrastar** uma delas move todas juntas (a clicada encaixa na grade e as outras andam o mesmo tanto);
- **setas** e **PgUp/PgDn** empurram todas;
- **R** gira o grupo 90° em volta do meio, cada peça andando e girando junto;
- **Delete** apaga todas e **Ctrl+D** duplica todas.

**Copiar e colar:**
- **Ctrl+C** copia a seleção;
- **Ctrl+V** cola onde o mouse aponta: o meio do grupo vai para o ponto e o pé da peça mais baixa fica no chão que o mouse acerta. As coladas ficam selecionadas, prontas para arrastar;
- a cópia fica guardada no navegador, então **dá para copiar de um mapa e colar em outro**.

O painel da direita mostra os botões do grupo quando há várias peças selecionadas (Copiar, Colar, Duplicar, Girar 90°, Soltar, Apagar todas) e o botão Colar quando nada está selecionado. A barra de ajuda e o guia (`docs/tiro-editor-de-mapas.md`) explicam os atalhos novos.

Conferido só com `node --check` (o editor e o script do jogo montado); não abri o editor.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
