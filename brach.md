# Tiro: o chão da Favela Grande vira terreno do editor

Pedido do Thiago: "troca todo o chão da favela do BR por terreno, assim eu posso mexer na topografia".

- O chão da Favela Grande era uma caixa de paralelepípedo do tamanho do mapa. Agora é um **terreno do editor** (`relevo` no `.json`): uma grade com um ponto a cada 2 m (137 x 107 pontos), cobrindo os **272 x 212 m** inteiros, **plana em y = 0**, com a mesma superfície (paralelepípedo) e a mesma cor;
- no jogo nada muda de lugar: tudo continua no chão em y = 0. Por baixo, o chão passa a ser o relevo do jogo (como as dunas do Simoun), e não uma caixa;
- **no editor**, abra a Favela Grande e use o **⛰ Terreno** (subir, descer, aplanar, suavizar, zerar) para fazer morro, barranco e ladeira. As casas não acompanham sozinhas: onde o chão subir ou descer embaixo de uma casa, use o **Aplanar** em volta dela, ou suba a casa (PgUp);
- as paredes de 600 m da beira continuam.

**Cuidado:** depois de mexer no terreno pelo editor, **não rode mais o `favela-grande-gerar.js`**, porque ele zera a grade. Isso está escrito no gerador.

**Desempenho:** a malha do chão agora é a grade de 1 m do jogo (uns 115 mil triângulos), em vez de uma caixa só. Vale olhar no tablet.

Conferido com `node --check` no script do jogo montado; o gerador diz 0 sobreposições e 0 peças passando da beira. Não joguei nem abri o editor.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
