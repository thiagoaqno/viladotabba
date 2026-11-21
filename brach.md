# Pneus com vida em voltas inteiras

Pedido do Thiago (2026-11-21): as vidas que terminavam em ,95 arredondam para cima.

- `f1-regras.js`: macio 2,95 → 3, médio 3,95 → 4, duro 4,95 → 5, intermediário 5,95 → 6, chuva 7,95 → 8 voltas.
- `f1-pneus-tabela.js` (o que os robôs usam para planejar): o `gasto` por volta de cada composto foi multiplicado por vida antiga / vida nova (o desgaste é proporcional a 1/vida em `gastarPneu`, então a conta é a mesma que rodar o gerador de novo; os tempos não dependem da vida).
- `tests/corrida-f1-pneus.test.js`: as vidas esperadas viraram 3/4/5.
- `novidades.json`: entrada nova.

Medido na tabela (mediana das 57 pistas, voltas até o penhasco do piloto ideal): macio 2,16 → 2,20, médio 2,89 → 2,93, duro 3,63 → 3,66. O robô gasta o pneu ~1,37× mais rápido que a vida nominal (o carro de referência e o escorregão do piloto ideal), então o arredondamento muda pouco o plano dele.
