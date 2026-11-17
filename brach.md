# Editor: adicionar asset com filtros + desenhar pista de cenário

- **Adicionar asset**: a biblioteca agora tem filtros por tipo de construção (Arquibancadas, Automóveis, Contenção, Paddock, Vegetação, Geral) e uma busca. Cada peça antiga caiu num filtro.
- **Peças novas low poly** (no estilo da imagem): arquibancada curva de cadeiras amarelas sobre pilares (alta e baixa), arquibancada reta de cadeiras (alta e baixa), arquibancada com toldo, tenda arredondada (curta e longa), mureta de concreto (com e sem alambrado), barreira de concreto, zebra de 10 m, prédio dos boxes com camarote, árvore de copa larga, gramado, van e carro amarelo. As cadeiras e os degraus vão juntados numa malha por material.
- **Desenhar pista (só cenário)**: reta com 2 cliques (início, fim) ou curva com 3 (início, fim e o ponto por onde ela passa). Tem largura, zebras e a opção de emendar o próximo trecho no fim do anterior. Fica salvo no cenario/<pista>.json como `{ tipo: "trecho" }`. Não é pista de andar.

Conferido só com `node --check`.
