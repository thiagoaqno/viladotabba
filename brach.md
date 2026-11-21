# Carros menos parelhos: do primeiro ao último, de 1,5% para 2,6%

Pedido do Thiago (2026-11-21): "melhorar os carros, para aumentar a diferença entre eles".

- `f1-equipes.js specDaMontagem`: `PARELHO` 0,6 → 1. Cada nível de peça passa a contar inteiro, e não mais 60% da distância até o nível médio.
- Medido com o piloto ideal em Bahrein (`ferramentas/pneus-fisica.js voltaFixa`), com os carros dos robôs da carreira (`temporada/regras.js desenvolvimentoRivais`, GP 1):

| PARELHO | McLaren | Red Bull | Aston Martin | Cadillac | 1º ao último |
|---|---|---|---|---|---|
| 0,6 (antes) | 68,783 | 68,950 | 69,342 | 69,825 | 1,51% |
| 0,9 | 68,108 | 68,375 | 68,975 | 69,667 | 2,29% |
| 1 | 67,875 | 68,183 | 68,850 | 69,617 | 2,57% |

- Os números de cada carro continuam presos nos `LIMITES` (o teste "todo número de toda montagem possível fica entre o pior e o melhor" segue valendo).
- Vale também para o carro de quem joga e para as corridas rápidas: a montagem pesa mais.
