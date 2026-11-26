# Tiro da Galera: Favela versão 5 com capa; mapa Navio apagado

- **Favela:** a versão nova que o Thiago montou no editor, com:
  - capa nova (foto da quadra no meio do morro, em `ferramentas/tiro-mapas/editor/capas/favela.webp`);
  - 182 pontos dos bots redistribuídos pela rede de caminhos;
  - um nascer do Alpha que espelhava para dentro de um prédio mudou de (7,5; 37,5) para (11,5; 41,5);
  - o ponto de dominação A, que tinha caído em cima do canteiro da árvore, foi para o lugar aberto mais perto no morro (-22,5; -5,5; y 3,05).
- **Capas dos mapas do editor:** os arquivos em `ferramentas/tiro-mapas/editor/capas/` vão para `maps/` na montagem, e o `.json` aponta com `"capa": "maps/<arquivo>"`.
- **Navio:** o `navio.json` (a base vazia) foi apagado. Fica o Maré Alta, e a peça `kcNavio` continua, porque ele usa.

Conferido no navegador: todos os pontos dos bots, os nascer dos dois times e os 3 de dominação estão na rede de caminhos; a capa aparece; a lista tem Favela e Maré Alta, e o Navio saiu.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
