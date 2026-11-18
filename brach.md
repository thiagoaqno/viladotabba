# Editor: régua, barreiras emendadas e relevo de Mônaco

- **Régua** (`editor/regua.js`): botão **Medir** na barra do topo (ou Shift+R). Clique no primeiro ponto, a medida aparece ao vivo, e o segundo clique a fixa: a cota fica na tela em metros (com a distância no plano e a diferença de altura quando tem desnível). Ctrl ao clicar trava em metros inteiros. **Limpar medidas** apaga; Esc desliga. Não vai para o cenário.
- **Barreiras emendadas** (`cenario-pista.js`): na Linha de itens e na Barreira na beira, os pneus e as peças de Contenção vão de um ponto ao próximo, no meio deles, virados pela corda e esticados ao comprimento dela. Nas curvas um módulo não entra mais no outro e não sobra vão. A fileira também vai até o ponto final.
- **Relevo de Mônaco** (biblioteca, Geral · Relevo e Contenção · Cidade): rocha calcária facetada com mato, arbustos e pinheiros-mansos: penhasco alto, médio com árvores, largo, rocha grande, rochedo com forte e casario, encosta com estrada e muro de arrimo, penhasco com terraço e muro; muros de pedra com balaustrada (reto e curvo), de concreto com pilastras, curvo com grade e escada, de arrimo de pedra.

Conferido com `node --check`, montando as 183 peças no Node e uma Linha curva de guard-rail e de pneus.
