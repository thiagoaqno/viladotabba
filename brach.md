# Tiro: no Battle royale, as armas só aparecem dentro de construções e em lajes

Pedido do Thiago: "faz as armas spawnarem só dentro de construções e lajes!"

**Como o lugar de cada arma é escolhido agora:**
- só entram pontos onde dá para andar e chegar: os da malha de navegação dos robôs, na parte principal (nada atrás de parede invisível nem em telhado sem acesso);
- desses, ficam os que têm **teto a até 8 m em cima** (dentro de casa, prédio, galpão, barraca) e os que estão **a mais de 1,5 m acima do chão sem teto** (laje, terraço, passarela);
- as armas ficam espalhadas: cada uma a pelo menos 6 m das outras, ou em outro andar. Se não couberem todas, a distância vai diminuindo;
- a quantidade é a mesma de antes (14 a 30, conforme o tamanho do mapa), com a mesma semente do salão, então todo mundo vê as armas nos mesmos lugares;
- num mapa quase sem construção (menos de 6 lugares assim), o resto das armas vai para os pontos de passagem, como antes.

As caixas de colete e de cura continuam como estavam (pontos de passagem). Os robôs com pistola continuam indo atrás da arma mais perto, agora dentro das casas e nas lajes.

Feito em `ferramentas/tiro-br.js` (`brLootPontos`, `brLoot`). Conferido só com `node --check` (o arquivo e o script do jogo montado); não joguei.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
