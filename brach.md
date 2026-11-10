# Suzuka: árvore invadindo a pista

O Thiago viu uma árvore invadindo a pista numa curva de Suzuka. A conferência de invasão (`tests/ajuda-cena/invasao.mjs`, com a cena montada no Node, olhando até 60 m de altura) achou duas peças do bosque: a copa de uma árvore a 86,1% da volta e um pinheiro a 47,1%.

**Causa:** o bosque vem do kit compartilhado (`kit/parque.js`), que exige só 36 u (`folga`) entre o tronco e o centro da pista. Ele só encolhe a copa quando ela fica baixa em relação à pista. Uma árvore alta com o tronco perto de uma curva ficava com a copa, de até ~84 u de raio (17 m), por cima do asfalto.

**Correção, só em Suzuka** (`gps/suzuka.js`; o kit não mudou): `folga: 100` no parque. O tronco fica a pelo menos 100 u do centro de qualquer trecho da pista.

**Medido depois:** nenhuma peça de árvore invade a pista. O bosque perdeu só as árvores coladas na pista: as copas foram de 1 201 para 925, e os pinheiros de 1 434 para 1 175.

Os prints não ajudaram aqui: no ponto de 86% o carro de teste caiu fora da pista e a câmera ficou dentro do chão. A prova é a medição.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
