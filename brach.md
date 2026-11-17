# Editor: barreira na beira da pista

Na aba **Pista**, a seção **Barreira na beira da pista**:

- Escolhe o item: pneus, cerca (com altura e mureta opcional), pilares, qualquer peça de Contenção (guard-rail, guard-rail triplo, pneus coloridos, Tecpro, SAFER, mureta, barreira de concreto, fardos, grades) ou qualquer outra peça.
- Escolhe a distância da beira (m) e o espaço entre as peças (m); ao trocar de item, o espaço vira o comprimento dele, para a fileira sair emendada.
- Clica na beira da pista onde começa (o lado vem do clique) e onde termina: a fileira segue o traçado, na altura da pista, e pode dar a volta.

Salva como uma `linha` com `beira: { i0, i1, lado, de }` (`cenario-pista.js`); a Linha de itens à mão continua igual. No Inspetor, espaço e altura mudam depois.

Conferido só com `node --check`.
