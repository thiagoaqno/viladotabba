# Tiro: marcador do parceiro através das paredes e granadas pelo mapa no Battle royale

Dois pedidos do Thiago.

**Marcador do parceiro** ("deve ficar um marcador sobre o jogador da minha equipe, mesmo quando ele está atrás das paredes"):
- os marcadores de aliado do jogo (o triângulo verde em cima da cabeça, com o nome de perto) ficavam desligados no cada um por si, e o BR é um cada um por si por dentro. No **BR em dupla** eles ligam, mesmo com o ajuste "Marcadores de aliados" desligado;
- vão até **600 m** (eram 120), então dá para achar o parceiro em qualquer canto do mapa;
- **atrás de parede** ficam quase tão fortes quanto à vista (0,75 em vez de 0,42).

**Granadas pelo mapa** ("deve ser possível encontrar granadas"):
- no Battle royale (solo e dupla) todo mundo começa **sem granada**;
- elas ficam no chão ao lado de **metade dos lugares das armas** (dentro das construções e nas lajes, ou nos marcadores do editor), com a mesma semente do salão: 60% de fragmentação, 25% de fumaça e 15% de atordoante;
- pega-se passando por cima, até 3, do mesmo tipo (sem nenhuma, qualquer tipo). O HUD mostra a quantidade;
- os robôs também pegam (até 2) e jogam;
- como as caixas, não vão pela rede: a granada que outro jogador pegou some aqui também.

Arquivos: `ferramentas/tiro-br.js` (`brGranadasPoe`, granada nas caixas, começar sem granada) e `ferramentas/tiro-frontline.js` (três trocas nos marcadores de aliado).

Conferido só com `node --check` (os arquivos e o script do jogo montado); não joguei.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
