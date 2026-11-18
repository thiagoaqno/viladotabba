# Editor: faixa de patrocínio na barreira

Na aba Pista, **Barreira na beira da pista**, o item novo **Faixa de patrocínio (sem pés)**: painéis colados um no outro seguindo a beira, com a marca no meio de cada um (ou duas marcas alternando), o fundo da cor escolhida, a altura do painel e a distância do chão (para ficar em cima da mureta ou do guard-rail, é só subir). O logo sai certo dos dois lados. Depois, no Inspetor, dá para trocar a marca, o fundo, o espaço e a altura.

`cenario-pista.js`: modelo `faixa` da `linha` (`marca`, `marca2`, `fundo`, `altura`, `elev`), emendado como as barreiras; cada painel é feito de peças de um material só, e a fileira inteira vira 5 malhas (medido no Node numa fileira curva com duas marcas).

Conferido com `node --check`.
