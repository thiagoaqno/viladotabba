# Tiro da Galera: camuflagem Cromado

O Thiago viu a comparação da M4 com o cromado da Corrida e pediu uma camuflagem cromada que fique bonita nas armas.

## Por que não o cromado da Corrida direto

O cromado da Corrida é um espelho quase puro (metal 0,92, aspereza 0,12, verniz). Na M4 ele deu dois problemas:

- **Cor do mapa:** ele copia o céu e o chão de cada mapa. No Deserto a arma ficou rosada e marrom, e não prateada.
- **Cor lisa:** as armas são feitas de faces retas, e cada face reflete um ponto só. A arma parecia pintada de uma cor lisa.

## A Cromado

- **Prata própria:** a base é um aço escovado, então a arma fica prateada em qualquer mapa.
- **Faixas de luz de estúdio:** elas correm pela arma conforme ela se mexe, mais o céu claro em cima e um brilho nas bordas. É o
  mesmo truque do Holo, só que em prata.
- **Shader próprio:** o código fica em `ferramentas/tiro-camos/camuflagens.js`. A Cromado tem um shader só dela, e as outras
  camuflagens não mudam.
- **Nível 29** da arma, entre o Rubi (28) e o Holo (30). A miniatura do menu é um degradê de cromo.
- **Faca:** a skin Holo da faca segue igual.

## Conferido no navegador

A M4 foi desenhada pela vitrine do jogo no mapa Deserto: hoje, com o espelho puro e com a Cromado. A Cromado fica prateada e com
faixas de brilho. O shader compila sem erro.

Falta o Thiago ver jogando: o brilho na arma em movimento e nos mapas escuros.
