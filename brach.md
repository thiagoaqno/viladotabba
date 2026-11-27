# Editor de mapas do Tiro: focado no Battle royale

Pedido do Thiago: "editor de mapas focado no BR".

**Marcadores novos** (catálogo Básico):
- **✦ BR: arma**: uma arma sorteada cai exatamente ali (no chão, dentro de casa ou em cima de laje);
- **⬢ BR: colete** e **✚ BR: cura**: uma caixa ali;
- **◎ BR: centro final da zona**: a zona fecha até ali;
- **▼ BR: largada**: alguém começa caindo de paraquedas em cima dali (até 12).

**No jogo** (`ferramentas/tiro-br.js`, que lê `MAP_DEFS[id].br`, passado pelo `mapa-json.js`):
- com pelo menos um marcador de arma, **só os marcadores** recebem arma, uma em cada;
- o mesmo vale para as caixas (colete e cura juntos);
- o centro marcado vira o centro final da zona;
- as largadas marcadas entram primeiro, e faltando, o jogo completa até 12, longe das marcadas;
- **o que não tiver marcador continua automático**, como antes (armas dentro de construções e em lajes, caixas nos pontos de passagem, centro no miolo do mapa, largadas espalhadas). Os mapas que já existem não mudam.

**No editor:**
- com algum marcador BR no mapa, a cena mostra no chão os **círculos das quatro etapas da zona** (azul: o começo; brancos: as etapas), do jeito que o jogo calcula: tamanho pelas peças (e pelo terreno) e centro final no ◎ ou no meio;
- sem nada selecionado, o painel da direita mostra o quadro **Battle royale**: quantos marcadores de cada tipo existem ("automático" onde não há), **Esconder/Mostrar a zona** e **Espelhar marcadores BR (z → -z)**, que copia cada marcador para o outro lado, como o time Bravo;
- botão **▶ Testar no BR** na barra: monta o mapa e começa um Battle royale solo com 11 robôs.

No `.json`: `br: { armas: [[x, y, z]], coletes, curas, zonaFim: [x, z], largadas: [[x, z]] }`. O guia (`docs/tiro-editor-de-mapas.md`) ganhou a seção "Battle royale no editor".

Conferido só com `node --check` (os arquivos e o script do jogo montado); não abri o editor nem joguei.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
