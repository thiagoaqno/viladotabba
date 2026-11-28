# Tiro: mapa Danger Zone, BR só com ele e a Favela Grande, robôs mais espalhados e armas nos módulos

Pedido do Thiago: "esse deve ser o único mapa de BR por enquanto, junto com o favela que fizemos lá... faça os bots caírem mais espalhados. Coloque para nascer armas também dentro dos módulos."

- **Mapa Danger Zone** (`ferramentas/tiro-mapas/editor/danger-zone.json`, o arquivo do editor que ele mandou, sem mudança): entra no jogo como os outros mapas do editor (continua disponível nos outros modos).
- **Mapas do Battle royale** (`BR_MAPAS` e `brMapaDe` em `ferramentas/tiro-br.js`, trocas no `tiro-frontline.js`): no BR e no BR em dupla, a escolha de mapa (solo e salão) mostra **só o Danger Zone e a Favela Grande**. Se o modo for trocado para BR com outro mapa escolhido, o mapa passa para o Danger Zone.
- **Robôs mais espalhados** (`ferramentas/tiro-br-aviao.js`): cada robô agora mira um lugar de largada diferente (os lugares espalhados, cada um o mais longe dos outros), salta do avião quando passa mais perto dele e plana mais rápido (20 m/s em queda livre e 9 m/s de paraquedas; o jogador segue com 10 e 7), para chegar até os cantos do mapa.
- **Armas dentro dos módulos** (`ferramentas/tiro-editor/mapa-json.js` guarda o centro de cada módulo; `brLoot`): uma arma no meio de cada módulo em que se entra (`kcModuloAberto`, `kcModuloPorta`, `kcModuloPortaMadeira` e os `kcNModulo*`; garagem e janela, que são fechados, ficam de fora), além das outras. No Danger Zone são 17. As granadas e peças de arma também usam esses lugares.

Conferido só com `node --check` (os arquivos e o script do jogo montado); não joguei.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
