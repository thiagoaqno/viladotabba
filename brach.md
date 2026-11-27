# Editor de mapas do Tiro: terreno deformado com pincel

Pedido do Thiago: "seria legal eu conseguir criar um terreno meio deformado no editor de mapas".

**No editor** (botão **⛰ Terreno** na barra, que liga e desliga o modo terreno):
- **Criar terreno**: uma grade com um ponto a cada 2 m, cobrindo as peças com 10 m de folga (até 320 x 320 m);
- **botão esquerdo arrastado pinta**, o direito continua olhando e WASD andando; um círculo amarelo mostra o pincel deitado no chão;
- pincéis **Subir**, **Descer**, **Aplanar** (até a altura de onde o arrasto começou, bom para assentar casas), **Suavizar** e **Zerar** (volta a y = 0);
- **Raio** (1 a 25 m) e **Força** (0,5 a 12 m/s no meio do pincel, caindo até zero na borda); alturas de -20 a 40 m;
- **Superfície** (as de chão, mais rocha e pedra) e **Cor**; **Zerar tudo** e **Apagar terreno**; Ctrl+Z desfaz cada pincelada;
- as peças colocadas com o mouse se assentam em cima do terreno.

**No jogo** o terreno vira o relevo de verdade, o mesmo das dunas do Simoun (`MAP_DEFS.relief`, 02-relief.js). Por isso pisar, balas, granadas, robôs e a sombra do chão já usam ele. A malha que se vê é a grade de 1 m do próprio jogo, a mesma em que se pisa, na superfície escolhida. Com terreno o mapa deixa de ser "sem chão": fora da grade o chão fica em y = 0. Com mar ainda não funciona, porque o mapa com mar é "sem chão" e o relevo não vale.

**Arquivos:** `ferramentas/tiro-editor/editor.js` (o modo terreno), `mapa-json.js` (`edRelevoFn`, `edRelevoMalha`, limites e vazio), `texturas.js` (a foto do chão do terreno), e o guia em `docs/tiro-editor-de-mapas.md`. No `.json` fica em `relevo: { x0, z0, passo, nx, nz, m, cor, h }`.

**Atenção:** este PR e o #1072 (copiar e colar) mexem no `editor.js` e montam o mesmo `public/tiro/index.html`. O que entrar por último precisa ser juntado e montado de novo em cima da main.

Conferido só com `node --check` (os arquivos e o script do jogo montado); não abri o editor nem joguei um mapa com terreno.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
